-- WeedApp — schéma initial V0
-- Principe : l'état de jeu de chaque joueur est un document JSON (GameState du moteur)
-- modifié UNIQUEMENT par les Edge Functions (clé service). Le client lit son état,
-- le chat et les profils publics ; il écrit seulement dans le chat, les signalements et les blocages.

-- ============================================================ Profils

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  pseudo text not null unique check (pseudo ~ '^[A-Za-z0-9_-]{3,20}$'),
  role text not null default 'player' check (role in ('player', 'moderator', 'admin')),
  -- Copie publique du niveau d'habitation (liste des joueurs, cibles de vol).
  housing_level smallint not null default 0,
  created_at timestamptz not null default now()
);

create unique index profiles_pseudo_ci on public.profiles (lower(pseudo));

-- Création automatique du profil à l'inscription (pseudo passé dans les métadonnées).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, pseudo) values (new.id, new.raw_user_meta_data ->> 'pseudo');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_moderator(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('moderator', 'admin') from public.profiles where id = uid), false);
$$;

alter table public.profiles enable row level security;

create policy "profils visibles par les joueurs connectés"
  on public.profiles for select to authenticated using (true);

-- ============================================================ État de jeu

create table public.player_states (
  user_id uuid primary key references public.profiles on delete cascade,
  state jsonb not null,
  -- Verrou optimiste : chaque écriture incrémente la version attendue.
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.player_states enable row level security;

create policy "chaque joueur lit son propre état"
  on public.player_states for select to authenticated using (user_id = auth.uid());

-- Crée ou met à jour l'état d'un joueur si sa version n'a pas bougé. Renvoie false en cas de conflit.
create function public.save_player_state(p_user_id uuid, p_state jsonb, p_expected_version integer, p_housing_level smallint)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  updated integer;
begin
  if p_expected_version = 0 then
    insert into public.player_states (user_id, state, version) values (p_user_id, p_state, 1)
    on conflict (user_id) do nothing;
  else
    update public.player_states
      set state = p_state, version = version + 1, updated_at = now()
      where user_id = p_user_id and version = p_expected_version;
  end if;
  get diagnostics updated = row_count;
  if updated = 0 then
    return false;
  end if;
  update public.profiles set housing_level = p_housing_level where id = p_user_id and housing_level <> p_housing_level;
  return true;
end;
$$;

-- Écrit deux états dans la même transaction (vol entre joueurs). Lève une erreur en cas de conflit.
create function public.save_two_player_states(
  p_a uuid, p_a_state jsonb, p_a_version integer, p_a_housing smallint,
  p_b uuid, p_b_state jsonb, p_b_version integer, p_b_housing smallint
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.save_player_state(p_a, p_a_state, p_a_version, p_a_housing)
     or not public.save_player_state(p_b, p_b_state, p_b_version, p_b_housing) then
    raise exception 'VERSION_CONFLICT';
  end if;
end;
$$;

revoke execute on function public.save_player_state from public, anon, authenticated;
revoke execute on function public.save_two_player_states from public, anon, authenticated;

-- ============================================================ Modération : bans temporaires

create table public.bans (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  -- 'chat' coupe le squatte ; 'game' coupe le jeu ET le squatte.
  scope text not null check (scope in ('chat', 'game')),
  reason text not null check (char_length(reason) between 1 and 300),
  expires_at timestamptz not null,
  created_by uuid not null default auth.uid() references public.profiles,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index bans_active on public.bans (user_id, expires_at) where revoked_at is null;

create function public.is_banned(uid uuid, ban_scope text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bans b
    where b.user_id = uid and b.revoked_at is null and b.expires_at > now()
      and (b.scope = ban_scope or b.scope = 'game')
  );
$$;

alter table public.bans enable row level security;

create policy "un joueur voit ses bans, les modérateurs voient tout"
  on public.bans for select to authenticated
  using (user_id = auth.uid() or public.is_moderator(auth.uid()));

create policy "les modérateurs bannissent"
  on public.bans for insert to authenticated
  with check (public.is_moderator(auth.uid()) and created_by = auth.uid() and user_id <> auth.uid());

create policy "les modérateurs lèvent un ban"
  on public.bans for update to authenticated
  using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

-- ============================================================ Squatte (chat global)

create table public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  pseudo text not null default '',
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles
);

create index chat_messages_recent on public.chat_messages (created_at desc);

-- Pseudo imposé par le serveur, anti-flood (3 messages / 10 s), refus si banni.
create function public.chat_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_banned(new.user_id, 'chat') then
    raise exception 'BANNED' using errcode = 'P0001';
  end if;
  if (select count(*) from public.chat_messages
      where user_id = new.user_id and created_at > now() - interval '10 seconds') >= 3 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
  new.pseudo := (select pseudo from public.profiles where id = new.user_id);
  new.created_at := now();
  new.deleted_at := null;
  new.deleted_by := null;
  return new;
end;
$$;

create trigger chat_before_insert
  before insert on public.chat_messages
  for each row execute function public.chat_before_insert();

-- Les modérateurs ne peuvent que masquer un message (suppression douce).
create function public.chat_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.body <> old.body or new.user_id <> old.user_id or new.pseudo <> old.pseudo or new.created_at <> old.created_at then
    raise exception 'ONLY_DELETION_ALLOWED' using errcode = 'P0001';
  end if;
  new.deleted_by := auth.uid();
  return new;
end;
$$;

create trigger chat_before_update
  before update on public.chat_messages
  for each row execute function public.chat_before_update();

alter table public.chat_messages enable row level security;

create policy "messages visibles (masqués : modérateurs seulement)"
  on public.chat_messages for select to authenticated
  using (deleted_at is null or public.is_moderator(auth.uid()));

create policy "écrire en son nom"
  on public.chat_messages for insert to authenticated
  with check (user_id = auth.uid());

create policy "les modérateurs masquent des messages"
  on public.chat_messages for update to authenticated
  using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

alter publication supabase_realtime add table public.chat_messages;

-- ============================================================ Signalements et blocages

create table public.chat_reports (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.chat_messages on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  reason text not null default '' check (char_length(reason) <= 300),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

alter table public.chat_reports enable row level security;

create policy "signaler un message"
  on public.chat_reports for insert to authenticated with check (reporter_id = auth.uid());

create policy "les modérateurs lisent les signalements"
  on public.chat_reports for select to authenticated using (public.is_moderator(auth.uid()));

create policy "les modérateurs traitent les signalements"
  on public.chat_reports for update to authenticated
  using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles on delete cascade,
  blocked_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "gérer ses blocages"
  on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ============================================================ Notifications push

create table public.push_tokens (
  user_id uuid not null references public.profiles on delete cascade,
  token text not null check (char_length(token) <= 200),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "gérer ses jetons push"
  on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
