# locomo assist

Application desktop de rééducation physique (Electron + React + Vite), avec détection posturale MediaPipe, coach vocal et rapports PDF.

## Prérequis

- Node.js 18+
- Webcam
- (Optionnel) Clés Groq + Supabase pour le coach IA et la sync cloud

## Installation

```bash
cd locomo-assist
cp .env.example .env
npm install
```

## Développement

```bash
npm run dev
```

Lance Vite (`http://localhost:5173`) et la fenêtre Electron.

## Build

```bash
npm run build          # Vite + main process
npm run electron:build # Installateur (.exe / .dmg / .AppImage)
```

## Base de données

SQLite local dans le dossier userData d’Electron. Migrations : `drizzle/migrations/`. Seed automatique au premier lancement.

## Vidéos d’exercices

Placez les MP4 dans `resources/exercises/` (noms alignés avec le seed).

Voir [DECISIONS.md](./DECISIONS.md).
