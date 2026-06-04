'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DAY_BODY_PARTS, DAY_LABELS, formatDuration } from '@/lib/utils';
import type { ExerciseDTO } from '@/types';

interface PlanningDay {
  dayOfWeek: number;
  label: string;
  bodyPart: string;
  exercises: ExerciseDTO[];
  estimatedMinutes: number;
}

export default function PlanningPage() {
  const router = useRouter();
  const [days, setDays] = useState<PlanningDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/exercises');
        if (!res.ok) throw new Error('Impossible de charger les exercices');
        const exercises = (await res.json()) as ExerciseDTO[];
        const grouped: PlanningDay[] = [];
        for (let d = 1; d <= 5; d++) {
          const dayExercises = exercises.filter((e) => e.dayOfWeek === d);
          const estimatedMinutes = dayExercises.reduce(
            (sum, ex) => sum + ex.sets * ex.reps * 0.05,
            0,
          );
          grouped.push({
            dayOfWeek: d,
            label: DAY_LABELS[d],
            bodyPart: DAY_BODY_PARTS[d] ?? 'Rééducation',
            exercises: dayExercises,
            estimatedMinutes: Math.max(1, Math.round(estimatedMinutes)),
          });
        }
        setDays(grouped);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function startDay(dayOfWeek: number, exerciseIds: string[]) {
    setStarting(dayOfWeek);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, exerciseIds }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Erreur création session');
      }
      const session = (await res.json()) as { exercises: { exerciseId: string }[] };
      const first = session.exercises[0]?.exerciseId;
      if (first) router.push(`/session/${first}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setStarting(null);
    }
  }

  return (
    <AppShell title="Planning" subtitle="Programme hebdomadaire (lundi → vendredi)">
      {loading && <p className="text-sm text-text-tertiary">Chargement du planning…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && days.length === 0 && (
        <p className="text-sm text-text-tertiary">
          Aucun exercice en base. Exécutez le seed Prisma.
        </p>
      )}
      <div className="grid gap-4">
        {days.map((day) => (
          <Card key={day.dayOfWeek}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {day.label} — {day.bodyPart}
                </CardTitle>
                <p className="mt-1 text-xs text-text-secondary">
                  Durée estimée : {formatDuration(day.estimatedMinutes * 60)}
                </p>
              </div>
              <Button
                disabled={day.exercises.length === 0 || starting === day.dayOfWeek}
                onClick={() =>
                  void startDay(
                    day.dayOfWeek,
                    day.exercises.map((e) => e.id),
                  )
                }
              >
                Démarrer
              </Button>
            </CardHeader>
            <CardContent>
              {day.exercises.length === 0 ? (
                <p className="text-xs text-text-tertiary">Aucun exercice ce jour-là.</p>
              ) : (
                <ul className="space-y-2">
                  {day.exercises.map((ex) => (
                    <li key={ex.id} className="flex justify-between text-sm">
                      <span>{ex.name}</span>
                      <span className="text-text-secondary">
                        {ex.sets}×{ex.reps} — {ex.bodyPart}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-text-tertiary">
        <Link href="/" className="text-primary hover:underline">
          Retour au tableau de bord
        </Link>
      </p>
    </AppShell>
  );
}
