# WeedApp

Jeu mobile de culture et de gestion (tycoon), multijoueur entre potes, inspiré de Weed-Land.net.
Vision, périmètre et architecture : [CLAUDE.md](CLAUDE.md). Référence du jeu d'origine : [docs/weedland-reference.md](docs/weedland-reference.md).

## Structure

| Dossier | Rôle |
|---|---|
| `packages/engine` | Moteur de jeu en TypeScript pur (règles, données, actualisation horaire). Partagé app + serveur. |
| `apps/mobile` | App Expo (SDK 57, Expo Router). |
| `supabase` | Migrations SQL (schéma, RLS) et Edge Functions `game` / `pvp` qui exécutent le moteur. |

## Lancer l'app en mode démo (sans serveur)

Sans variables Supabase, l'app tourne hors ligne avec le moteur local (pas de chat ni de vols).

```bash
npm install
```

```bash
npm run ios -w @weedapp/mobile
```

(`expo run:ios` compile l'app native : il faut Xcode et CocoaPods. `npx expo start` dans `apps/mobile` suffit pour Expo Go.)

## Brancher Supabase

1. Créer un projet sur supabase.com, puis lier le dépôt :

   ```bash
   npx supabase link --project-ref <ref-du-projet>
   ```

2. Appliquer le schéma et déployer les fonctions :

   ```bash
   npm run db:push
   ```

   ```bash
   npm run functions:deploy
   ```

3. Créer `apps/mobile/.env.local` :

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé publishable>
   ```

4. Dans Supabase > Authentication > Email, désactiver « Confirm email » pour tester vite (optionnel).
5. Se donner le rôle admin (SQL editor) :

   ```sql
   update public.profiles set role = 'admin' where pseudo = 'TonPseudo';
   ```

Les notifications push (vols subis) demandent un projet EAS (`npx eas-cli@latest init`) et un vrai téléphone ; les rappels locaux (soif, récolte, ventes, police) fonctionnent sans.

## Vérifications

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run functions:check
```
