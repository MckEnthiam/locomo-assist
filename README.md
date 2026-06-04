<div align="center">
  <h1>LocomoAssist</h1>
  <img src="logo.png" alt="LocomoAssist Logo" width="180"/>
  <p><strong>Un kinésithérapeute virtuel dans votre poche.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Hackathon-TCCHackDefend%202026-1D9E75?style=flat-square" alt="Hackathon"/>
    <img src="https://img.shields.io/badge/Stack-Next.js%2014%20%2B%20TypeScript-0070f3?style=flat-square" alt="Stack"/>
    <img src="https://img.shields.io/badge/IA-Groq%20%2B%20Gemini-4285F4?style=flat-square" alt="IA"/>
    <img src="https://img.shields.io/badge/Vision-MediaPipe%20Pose-EF9F27?style=flat-square" alt="Vision"/>
  </p>
</div>

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

### Prérequis

- Node.js 18+
- Un projet Supabase (PostgreSQL + Storage)
- Une clé API Anthropic

### Variables d'environnement

Créer un fichier `.env.local` à la racine :

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="..."
```

### Lancer le projet

```bash
# Installer les dépendances
npm install

# Appliquer le schema et seeder la base
npx prisma migrate dev
npx prisma db seed

# Lancer en développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

---

## Modèle de données

```prisma
model Exercise {
  id           String   @id @default(cuid())
  name         String
  bodyPart     String   // "epaule" | "coude" | "hanche" | "genou"
  sets         Int
  reps         Int
  targetAngles Json     // { shoulder: 120, elbow: 110, ... }
  refVideoUrl  String?
}

model Session {
  id            String            @id @default(cuid())
  startedAt     DateTime          @default(now())
  weekNumber    Int
  totalDuration Int?
  exercises     SessionExercise[]
  report        Report?
}

model SessionExercise {
  id            String   @id @default(cuid())
  avgAmplitude  Float?
  peakAmplitude Float?
  compensations Json?    // { lumbar: 3, shoulder: 1 }
  signalData    Json?
  coachMessages Json?
}

model Report {
  id          String   @id @default(cuid())
  weekNumber  Int
  pdfUrl      String
  generatedAt DateTime @default(now())
}
```

---

## Exercices disponibles (seed)

| Exercice | Partie du corps | Sets x Reps |
|---|---|---|
| Flexion avant épaule | Epaule | 3 x 10 |
| Rotation externe épaule | Epaule | 3 x 12 |
| Abduction latérale | Epaule | 3 x 10 |
| Pendule Codman | Epaule | 2 x 15 |
| Mobilisation hanche | Hanche | 3 x 10 |

---
## References
<div align="center">
  <h1>1</h1>
  <img src="readimg/1.png" alt="1" width="180"/>
  <h1>2</h1>
  <img src="readimg/2.png" alt="2" width="180"/>
  <h1>3</h1>
  <img src="readimg/3.png" alt="3" width="180"/>
</div>


---

## Contexte

Projet réalisé dans le cadre du **TCCHackDefend 2026**.

Sources :
- [Facteurs prédictifs de mortalité des hématomes cérébraux aux CHU de Lomé](https://ajns.paans.org/facteurs-predictifs-de-mortalite-des-hematomes-cerebraux-aux-chu-de-lome/)
- [Accidents de la route au Togo](https://republicoftogo.com/toutes-les-rubriques/societe/malgre-les-campagnes-les-accidents-continuent-d-endeuiller-le-togo)
