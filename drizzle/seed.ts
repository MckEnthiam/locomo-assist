import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const exerciseRows = [
  {
    id: 'ex-flexion-avant',
    name: 'Flexion avant épaule',
    description:
      'Debout face à un mur, glissez l’avant-bras vers le haut en gardant le coude tendu contre le mur.',
    bodyPart: 'epaule',
    sets: 3,
    reps: 12,
    targetAngles: JSON.stringify({
      shoulderLeft: 120,
      shoulderRight: 120,
      elbowLeft: 170,
      spine: 10,
      hip: 175,
    }),
    refVideoPath: 'exercises/flexion-avant.mp4',
    dayOfWeek: 1,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: 'ex-rotation-externe',
    name: 'Rotation externe épaule',
    description:
      'Coude plié à 90°, rotatez l’avant-bras vers l’extérieur sans décoller le coude du corps.',
    bodyPart: 'epaule',
    sets: 3,
    reps: 15,
    targetAngles: JSON.stringify({
      shoulderLeft: 90,
      shoulderRight: 90,
      elbowLeft: 90,
      spine: 8,
      hip: 175,
    }),
    refVideoPath: 'exercises/rotation-externe.mp4',
    dayOfWeek: 2,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: 'ex-abduction',
    name: 'Abduction latérale',
    description: 'Élevez le bras sur le côté jusqu’à hauteur d’épaule, paume vers le sol.',
    bodyPart: 'epaule',
    sets: 3,
    reps: 10,
    targetAngles: JSON.stringify({
      shoulderLeft: 90,
      shoulderRight: 90,
      elbowLeft: 175,
      spine: 12,
      hip: 175,
    }),
    refVideoPath: 'exercises/abduction-laterale.mp4',
    dayOfWeek: 3,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: 'ex-pendule',
    name: 'Pendule Codman',
    description: 'Penché en avant, laissez pendre le bras et effectuez de petits cercles.',
    bodyPart: 'epaule',
    sets: 2,
    reps: 20,
    targetAngles: JSON.stringify({
      shoulderLeft: 45,
      shoulderRight: 45,
      elbowLeft: 160,
      spine: 25,
      hip: 170,
    }),
    refVideoPath: 'exercises/pendule-codman.mp4',
    dayOfWeek: 4,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: 'ex-hanche',
    name: 'Mobilisation hanche',
    description: 'Allongé sur le côté, effectuez des rotations lentes de hanche.',
    bodyPart: 'hanche',
    sets: 3,
    reps: 12,
    targetAngles: JSON.stringify({
      shoulderLeft: 15,
      shoulderRight: 15,
      elbowLeft: 170,
      spine: 10,
      hip: 45,
    }),
    refVideoPath: 'exercises/mobilisation-hanche.mp4',
    dayOfWeek: 5,
    sortOrder: 1,
    createdAt: new Date(),
  },
];

export function seedIfEmpty(database: BetterSQLite3Database<typeof schema>): void {
  const existing = database.select().from(schema.exercises).all();
  if (existing.length > 0) return;

  for (const row of exerciseRows) {
    database.insert(schema.exercises).values(row).run();
  }

  const params = database.select().from(schema.parametres).all();
  if (params.length === 0) {
    database.insert(schema.parametres).values({ id: 'singleton' }).run();
  }
}
