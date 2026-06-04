import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCards } from '@/components/dashboard/StatCards';
import { AmplitudeChart } from '@/components/dashboard/AmplitudeChart';
import { TodaySession } from '@/components/dashboard/TodaySession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats } from '@/lib/ipc';

export default function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, []);

  if (error) {
    return (
      <AppShell title="Tableau de bord">
        <p className="text-sm text-danger">{error}</p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Tableau de bord">
        <p className="text-sm text-text-tertiary">Chargement des statistiques…</p>
      </AppShell>
    );
  }

  const avgValues = Object.values(data.avgAmplitudeByJoint).filter((v) => v > 0);
  const avgAmplitude =
    avgValues.length > 0
      ? Math.round(avgValues.reduce((a, b) => a + b, 0) / avgValues.length)
      : 0;

  const pending = data.activeSession?.exercises?.find(
    (e) => e.status === 'active' || e.status === 'pending',
  );
  const firstId = pending?.exerciseId ?? data.todayExercises[0]?.id ?? null;

  return (
    <AppShell title="Tableau de bord" subtitle="Vue d’ensemble de votre rééducation">
      <div className="space-y-6">
        <StatCards
          totalSessions={data.totalSessions}
          avgAmplitude={avgAmplitude}
          totalDurationSeconds={data.totalDurationSeconds}
          formScore={data.formScore}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Amplitude par articulation (7 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <AmplitudeChart data={data.amplitudeLast7Days} />
            </CardContent>
          </Card>
          <TodaySession
            exercises={data.todayExercises}
            session={data.todaySession}
            activeSession={data.activeSession}
            dayType={data.dayType}
            firstExerciseId={firstId}
          />
        </div>
      </div>
    </AppShell>
  );
}
