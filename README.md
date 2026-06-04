# locomo assist

---
## Le problème

Chaque année au Togo, des milliers de vies basculent. Les AVC représentent la première cause de handicap moteur acquis chez l'adulte dans les centres hospitaliers de Lomé. A cela s'ajoute une explosion des traumatismes : plus de 60 % des accidents de la route au Togo impliquent des engins à deux-roues.

Ces patients ont un besoin vital de rééducation des membres. Mais la rééducation physique souffre de trois problèmes majeurs :

**Un mur financier.** Une séance de kinésithérapie coûte entre 3 000 et 15 000 FCFA. Répétée plusieurs fois par semaine, cette charge mensuelle dépasse rapidement le SMIG togolais, forçant l'abandon des soins dans la majorité des cas faute de ressources.

**Le défi de la mobilité.** Transporter un patient hémiplégique ou lourdement blessé vers le CNAO ou les CHU aggrave ses douleurs, fatigue les familles et engendre des coûts de transport insoutenables.

**La solitude et l'erreur.** Entre deux rendez-vous médicaux, le patient fait ses exercices chez lui, souvent avec une mauvaise posture sans s'en rendre compte, ce qui peut aggraver sa situation. Le médecin n'a aucune donnée objective sur ce que le patient a réellement fait, et comment il l'a fait.

---

## La solution

> L'objectif n'est pas de remplacer le kinésithérapeute, dont l'expertise humaine et le diagnostic restent irremplaçables. Notre projet consiste à lui donner un allié technologique portable.

**LocomoAssist** est une application web de rééducation physique assistée par IA. Elle transforme n'importe quelle caméra de smartphone ou de PC en un coach virtuel interactif, capable de guider le patient en temps réel et de générer des bilans cliniques précis pour les médecins.

Elle repose sur trois piliers :

**L'oeil intelligent (Computer Vision).** L'application utilise la caméra de l'appareil pour analyser instantanément les mouvements en 3D (angles articulaires, symétrie, vitesse) sans capteurs portables couteux.

**Le coach vocal IA.** Pendant l'effort, une voix guide activement le patient. Elle le corrige en temps réel ("Redressez votre épaule gauche de quelques degrés"), l'encourage, et adapte son planning en fonction de sa fatigue ou de ses réussites.

**Le hub clinique.** Toutes les données de performance sont compilées. L'application génère des rapports PDF certifiés qui traduisent les mouvements en constantes médicales (amplitude, régularité, progression), envoyés automatiquement au médecin en fin de semaine.

En espaçant les déplacements obligatoires en clinique, nous divisons par trois l'impact logistique sur les familles tout en optimisant le temps de suivi des praticiens.

---

## Equipe

| | Nom | Role |
|---|---|---|
| <a href="https://github.com/koumekpoablam3-ux"><img src="https://github.com/koumekpoablam3-ux.png" width="40" height="40" style="border-radius:50%" alt="KOUMEKPO Rodrigue"/></a> | <a href="https://github.com/koumekpoablam3-ux">**KOUMEKPO Ablam Sotoh Rodrigue**</a> | Chef de projet |
| <a href="https://github.com/MckEnthiam"><img src="https://github.com/MckEnthiam.png" width="40" height="40" style="border-radius:50%" alt="Ethiam"/></a> | <a href="https://github.com/MckEnthiam">**AKOSSOU Comlavi Didier Ethiam**</a> | Développement |
| <a href="https://github.com/clairecodexx"><img src="https://github.com/clairecodexx.png" width="40" height="40" style="border-radius:50%" alt="claire"/></a> | <a href="https://github.com/clairecodexx">**Claire**</a> | Développement |

---

## Stack technique

### Frontend

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript strict |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand |
| Détection de pose | MediaPipe Pose (WASM) |
| Canvas | API Canvas 2D native |
| Coach vocal | Web Speech API (voix FR) |
| Graphes | Recharts |
| PDF client | jsPDF + jsPDF-AutoTable |
| Formulaires | React Hook Form + Zod |

### Backend

| Couche | Technologie |
|---|---|
| API | Next.js Route Handlers |
| Base de données | PostgreSQL via Supabase |
| ORM | Prisma |
| Coach IA | Groq API + Gemini API (alternance) |
| Génération PDF | PDFKit (Node.js) |
| Stockage | Supabase Storage |

### Infra

| | |
|---|---|
| Déploiement | Vercel |
| Linting | ESLint + Prettier |
| Pre-commit | Husky |

---

## Architecture

```
locomoassist/
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── session/[exerciseId]/       # Vue session live
│   ├── planning/                   # Planning hebdomadaire
│   ├── progression/                # Graphes de progression
│   ├── rapports/                   # Rapports PDF
│   └── api/
│       ├── coach/                  # POST → API
│       ├── sessions/               # GET/POST sessions
│       ├── exercises/              # Catalogue d'exercices
│       ├── rapports/               # Génération PDF
│       └── progression/            # Données agrégées
├── components/
│   ├── session/
│   │   ├── CameraFeed.tsx          # Webcam PIP bas-gauche
│   │   ├── PoseCanvas.tsx          # Overlay MediaPipe
│   │   ├── SignalGraph.tsx         # Signal articulaire
│   │   ├── AnglePanel.tsx          # Angles en temps réel
│   │   └── CoachPanel.tsx          # Messages coach IA
│   └── dashboard/
├── lib/
│   ├── mediapipe.ts                # Init MediaPipe Pose
│   ├── angles.ts                   # Calcul angles articulaires
│   ├── coach.ts                    # Logique API
│   └── tts.ts                      # Web Speech API wrapper
└── store/
    ├── sessionStore.ts             # Etat session live (Zustand)
    └── progressionStore.ts
```

---

## Parcours utilisateur

**1. Planification.** L'IA propose au patient sa session du jour adaptée à sa forme, avec une estimation des mouvements, tensions et durée.

**2. Action.** Le patient pose son téléphone ou son PC, la caméra s'active, et l'IA commence à interagir vocalement avec lui tout au long des mouvements.

**3. Suivi.** A la fin de la semaine, un rapport PDF complet est envoyé automatiquement au médecin ou téléchargeable pour la prochaine consultation.

---

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

---
## References
<div align="center">
  <h3>Élévation latérale du bras</h3>
  <img src="readimg/1.png" alt="Élévation latérale du bras" width="2800"/>
  <h3>Abduction du bras</h3>
  <img src="readimg/2.png" alt="Abduction du bras" width="2800"/>
  <h3>Flexion du coude</h3>
  <img src="readimg/3.png" alt="Flexion du coude" width="2800"/>
</div>


---

Voir [DECISIONS.md](./DECISIONS.md).
