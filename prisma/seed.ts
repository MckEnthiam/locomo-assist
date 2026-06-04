import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  {
    name: 'Flexion avant épaule',
    description:
      'Debout face à un mur, glissez l’avant-bras vers le haut en gardant le coude tendu contre le mur.',
    bodyPart: 'epaule',
    sets: 3,
    reps: 12,
    targetAngles: { shoulderLeft: 120, shoulderRight: 120, elbowLeft: 170, spine: 10, hip: 175 },
    refVideoUrl: null,
    dayOfWeek: 1,
    sortOrder: 1,
  },
  {
    name: 'Rotation externe épaule',
    description:
      'Coude plié à 90°, rotatez l’avant-bras vers l’extérieur sans décoller le coude du corps.',
    bodyPart: 'epaule',
    sets: 3,
    reps: 15,
    targetAngles: { shoulderLeft: 90, shoulderRight: 90, elbowLeft: 90, spine: 8, hip: 175 },
    refVideoUrl: null,
    dayOfWeek: 2,
    sortOrder: 1,
  },
  {
    name: 'Abduction latérale',
    description: 'Élevez le bras sur le côté jusqu’à hauteur d’épaule, paume vers le sol.',
    bodyPart: 'epaule',
    sets: 3,
    reps: 10,
    targetAngles: { shoulderLeft: 90, shoulderRight: 90, elbowLeft: 175, spine: 12, hip: 175 },
    refVideoUrl: null,
    dayOfWeek: 3,
    sortOrder: 1,
  },
  {
    name: 'Pendule Codman',
    description: 'Penché en avant, laissez pendre le bras et effectuez de petits cercles.',
    bodyPart: 'epaule',
    sets: 2,
    reps: 20,
    targetAngles: { shoulderLeft: 45, shoulderRight: 45, elbowLeft: 160, spine: 25, hip: 170 },
    refVideoUrl: null,
    dayOfWeek: 4,
    sortOrder: 1,
  },
  {
    name: 'Mobilisation hanche',
    description: 'Allongé sur le côté, effectuez des rotations lentes de hanche.',
    bodyPart: 'hanche',
    sets: 3,
    reps: 12,
    targetAngles: { shoulderLeft: 15, shoulderRight: 15, elbowLeft: 170, spine: 10, hip: 45 },
    refVideoUrl: null,
    dayOfWeek: 5,
    sortOrder: 1,
  },
];

async function main() {
  await prisma.progression.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.session.deleteMany();
  await prisma.exercise.deleteMany();

  for (const exercise of exercises) {
    await prisma.exercise.create({ data: exercise });
  }

  console.log(`Seeded ${exercises.length} exercises`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
