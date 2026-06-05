import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();
const SALT = "locomo-assist-hackathon-2026";

function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64).toString("hex");
}

const exercises = [
  {
    name: "Flexion avant épaule",
    description:
      "Debout face à un mur, glissez l'avant-bras vers le haut en gardant le coude tendu contre le mur.",
    bodyPart: "epaule",
    sets: 3,
    reps: 12,
    targetAngles: JSON.stringify({
      shoulderLeft: 120,
      shoulderRight: 120,
      elbowLeft: 170,
      spine: 10,
      hip: 175,
    }),
    refVideoUrl: null,
    dayOfWeek: 1,
    sortOrder: 1,
  },
  {
    name: "Rotation externe épaule",
    description:
      "Coude plié à 90°, rotatez l'avant-bras vers l'extérieur sans décoller le coude du corps.",
    bodyPart: "epaule",
    sets: 3,
    reps: 15,
    targetAngles: JSON.stringify({
      shoulderLeft: 90,
      shoulderRight: 90,
      elbowLeft: 90,
      spine: 8,
      hip: 175,
    }),
    refVideoUrl: null,
    dayOfWeek: 2,
    sortOrder: 1,
  },
  {
    name: "Abduction latérale",
    description:
      "Élevez le bras sur le côté jusqu'à hauteur d'épaule, paume vers le sol.",
    bodyPart: "epaule",
    sets: 3,
    reps: 10,
    targetAngles: JSON.stringify({
      shoulderLeft: 90,
      shoulderRight: 90,
      elbowLeft: 175,
      spine: 12,
      hip: 175,
    }),
    refVideoUrl: null,
    dayOfWeek: 3,
    sortOrder: 1,
  },
  {
    name: "Pendule Codman",
    description:
      "Penché en avant, laissez pendre le bras et effectuez de petits cercles.",
    bodyPart: "epaule",
    sets: 2,
    reps: 20,
    targetAngles: JSON.stringify({
      shoulderLeft: 45,
      shoulderRight: 45,
      elbowLeft: 160,
      spine: 25,
      hip: 170,
    }),
    refVideoUrl: null,
    dayOfWeek: 4,
    sortOrder: 1,
  },
  {
    name: "Mobilisation hanche",
    description:
      "Allongé sur le côté, effectuez des rotations lentes de hanche.",
    bodyPart: "hanche",
    sets: 3,
    reps: 12,
    targetAngles: JSON.stringify({
      shoulderLeft: 15,
      shoulderRight: 15,
      elbowLeft: 170,
      spine: 10,
      hip: 45,
    }),
    refVideoUrl: null,
    dayOfWeek: 5,
    sortOrder: 1,
  },
];

async function main() {
  // Clean existing data
  await prisma.progression.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.session.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      name: "Patient Démo",
      email: "demo@locomo.com",
      password: hashPassword("demo123"),
      role: "PATIENT",
      phone: "+228 90 12 34 56",
      birthDate: "1985-03-15",
      condition: "Rééducation post-AVC épaule gauche — Phase 2",
    },
  });
  console.log(`Created demo user: ${demoUser.email} (password: demo123)`);

  // Create therapist user
  const therapist = await prisma.user.create({
    data: {
      name: "Dr. Koffi Mensah",
      email: "koffi@locomo.com",
      password: hashPassword("demo123"),
      role: "THERAPIST",
      phone: "+228 91 23 45 67",
      condition: "Kinésithérapeute — Centre de rééducation de Lomé",
    },
  });
  console.log(`Created therapist: ${therapist.email} (password: demo123)`);

  // Create exercises
  for (const ex of exercises) {
    await prisma.exercise.create({ data: ex });
  }
  console.log(`Seeded ${exercises.length} exercises`);

  // Create mock completed sessions for demo data
  const allExercises = await prisma.exercise.findMany();
  const now = new Date();
  const weekNumber = getWeekNumber(now);

  for (let s = 0; s < 5; s++) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - s);
    if (sessionDate.getHours() < 9) {
      sessionDate.setHours(9 + s, 0, 0, 0);
    }

    const sessionWeek = getWeekNumber(sessionDate);
    const dayExercises = allExercises.slice(0, 2 + (s % 3));

    const session = await prisma.session.create({
      data: {
        startedAt: sessionDate,
        endedAt: new Date(sessionDate.getTime() + (10 + s * 5) * 60 * 1000),
        weekNumber: sessionWeek,
        dayType: "Épaule — flexion",
        totalDuration: (10 + s * 5) * 60,
        exercises: {
          create: dayExercises.map((ex, idx) => ({
            exerciseId: ex.id,
            status: "done",
            completedAt: new Date(
              sessionDate.getTime() + (idx + 1) * 5 * 60 * 1000
            ),
            setsCompleted: ex.sets,
            repsCompleted: ex.reps,
            avgAmplitude: 80 + Math.random() * 30,
            peakAmplitude: 105 + Math.random() * 25,
            compensations: JSON.stringify({ lumbar: Math.floor(Math.random() * 3), shoulder: Math.floor(Math.random() * 4) }),
            durationSeconds: 5 * 60,
          })),
        },
      },
    });

    // Create progressions for each exercise
    const sessionExercises = await prisma.sessionExercise.findMany({
      where: { sessionId: session.id },
    });
    for (const se of sessionExercises) {
      const ex = await prisma.exercise.findUnique({ where: { id: se.exerciseId } });
      await prisma.progression.create({
        data: {
          bodyPart: ex!.bodyPart,
          angleDegrees: se.avgAmplitude ?? 90,
          exerciseId: se.exerciseId,
          date: sessionDate,
        },
      });
    }

    // Create reports for the latest sessions
    if (s < 2) {
      await prisma.report.create({
        data: {
          sessionId: session.id,
          weekNumber: sessionWeek,
          pdfUrl: "/rapport-demo.pdf",
          summary: JSON.stringify({
            avgAmplitude: 85 + s * 5,
            totalTime: (10 + s * 5) * 60,
            sessionsCount: 1,
            compensations: { lumbar: s, shoulder: s + 1 },
            formScore: 82 + s * 6,
          }),
        },
      });
    }
  }

  console.log("Created 5 mock sessions with progression data and 2 reports");
}

function getWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
