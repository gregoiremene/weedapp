# WeedApp

Jeu mobile de culture et de gestion (tycoon), multijoueur entre potes, inspiré de Weed-Land.net.
Vision, périmètre et architecture : [CLAUDE.md](CLAUDE.md). Référence du jeu d'origine : [docs/weedland-reference.md](docs/weedland-reference.md).

## Structure

| Dossier | Rôle |
|---|---|
| `packages/engine` | Moteur de jeu en TypeScript pur (règles, données, actualisation horaire). Partagé app + serveur. |
| `apps/mobile` | App Expo (SDK 54, Expo Router). |
| `supabase` | Migrations SQL (schéma, RLS) et Edge Functions `game` / `pvp` qui exécutent le moteur. |

## Lancer l'app en mode démo (sans serveur)

Sans variables Supabase, l'app tourne hors ligne avec le moteur local (pas de chat ni de vols).

```bash
npm install
```

```bash
npx expo start
```

(à lancer dans `apps/mobile`, puis scanner le QR code avec Expo Go **SDK 54** ; voir ci-dessous pour un build natif)

`expo run:ios` compile l'app native : il faut Xcode 16.1 ou plus (SDK Expo 54) et CocoaPods. Autres options :

- **Expo Go** (le plus simple pour tester) : `npx expo start --ios` dans `apps/mobile`, ou scanner le QR code avec l'app Expo Go sur un téléphone ;
- **EAS Build** (compilation dans le cloud) : `npx eas-cli@latest build --profile development --platform ios`.

## Version web

L'app tourne aussi dans un navigateur (sans notifications). Hébergement prévu : **EAS Hosting**, qui donne une adresse gratuite `https://<nom>.expo.app` (domaine personnalisé : plan payant). Une fois connecté avec `npx eas-cli@latest login`, depuis `apps/mobile` :

```bash
npm run web:deploy
```

Le premier déploiement demande de créer le projet EAS et de choisir le sous-domaine. Les variables `EXPO_PUBLIC_SUPABASE_*` de `.env.local` sont intégrées au moment de l'export.

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

3. Créer le fichier `apps/mobile/.env.local` (il n'existe pas encore : c'est toi qui le crées, il est ignoré par git) en copiant le modèle :

   ```bash
   cp apps/mobile/.env.example apps/mobile/.env.local
   ```

   puis y coller l'URL du projet et la clé **publishable** (`sb_publishable_…`), trouvées dans le dashboard Supabase via le bouton « Connect » ou Project Settings > API Keys. Relancer ensuite `npx expo start`.

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
