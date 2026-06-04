# Décisions d’architecture — locomo assist

## Migration Next.js → Electron

- **Renderer** : React 18 + Vite 5 (`src/`), routing via `react-router-dom` (HashRouter pour compatibilité `file://` en production).
- **Main process** : Electron 32, TypeScript compilé vers `dist-electron/`.
- **Sécurité** : `contextIsolation: true`, `nodeIntegration: false`, API exposée via `preload.ts` uniquement.

## Base de données

- **SQLite** (`better-sqlite3`) dans `app.getPath('userData')` — source de vérité offline.
- **Drizzle ORM** remplace Prisma (meilleure intégration SQLite synchrone).
- Migrations dans `drizzle/migrations/`, appliquées au démarrage.
- Seed des 5 exercices si table vide ; vidéos référencées par `refVideoPath` vers `resources/exercises/`.

## Coach IA

- **En ligne** : Groq (`llama-3.1-8b-instant`) via `VITE_GROQ_API_KEY`.
- **Hors ligne** : règles statiques déterministes (`getStaticFeedback`).
- Throttle minimum 8 s entre appels (30 s si pas de compensation).

## Sync cloud

- Unidirectionnelle **local → Supabase** quand `autoSync` et réseau disponibles.
- Tables Supabase attendues : `sessions`, `session_exercises`, bucket Storage `rapports`.

## PDF

- Génération **PDFKit** dans le main process (`electron/ipc/pdf.ts`).
- Fichiers dans `Documents/LocomoAssist/rapports/`.

## MediaPipe

- WASM servi depuis `public/mediapipe/` (copie postinstall depuis `@mediapipe/pose`).
- `locateFile: (file) => mediapipe/${file}` en dev et prod (extraResources).

## Ancien code Next.js

- Dossiers `app/`, `prisma/`, anciennes API routes conservés à titre de référence ; **non utilisés** par le build Electron.
- Composants réutilisés sous `src/components/` (adaptés sans `next/*`).

## Nom produit

- Affichage : **locomo assist** (`lib/brand.ts`).
- Dossier projet : `locomo-assist/`.
