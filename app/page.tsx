export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/layout/AppShell';
import { StatCards } from '@/components/dashboard/StatCards';
import { AmplitudeChart } from '@/components/dashboard/AmplitudeChart';
import { TodaySession } from '@/components/dashboard/TodaySession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats } from '@/lib/dashboard';

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardStats();
  } catch {
    data = {
      totalSessions: 0,
      avgAmplitudeByJoint: { epaule: 0, coude: 0, hanche: 0, colonne: 0 },
      totalDurationSeconds: 0,
      formScore: 0,
      amplitudeLast7Days: [],
      todaySession: null,
      activeSession: null,
      todayExercises: [],
      dayType: 'Session du jour',
    };
  }
  const joints = data.avgAmplitudeByJoint as Record<string, number>;
  const avgValues = Object.values(joints).filter((v) => v > 0);
  const avgAmplitude =
    avgValues.length > 0
      ? Math.round(avgValues.reduce((a, b) => a + b, 0) / avgValues.length)
      : 0;

  const exercises = data.todayExercises ?? [];
  const pending = data.activeSession?.exercises?.find(
    (e) => e.status === 'active' || e.status === 'pending',
  );
  const firstId = pending?.exerciseId ?? exercises[0]?.id ?? null;

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
              <AmplitudeChart data={data.amplitudeLast7Days ?? []} />
            </CardContent>
          </Card>
          <TodaySession
            exercises={exercises}
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
