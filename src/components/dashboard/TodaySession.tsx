import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExerciseDTO, SessionDTO } from '@/types';

interface TodaySessionProps {
  exercises: ExerciseDTO[];
  session: SessionDTO | null;
  activeSession: SessionDTO | null;
  dayType: string;
  firstExerciseId: string | null;
}

function statusSquare(status: string) {
  const color =
    status === 'done'
      ? 'bg-primary'
      : status === 'active'
        ? 'bg-primary-dark'
        : 'bg-bg border border-[0.5px] border-border';
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-[1px] ${color}`} />;
}

export function TodaySession({
  exercises,
  session,
  activeSession,
  dayType,
  firstExerciseId,
}: TodaySessionProps) {
  const displaySession = activeSession ?? session;
  const items =
    displaySession?.exercises ??
    exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.id,
      status: 'pending' as const,
      exercise: ex,
    }));

  const resume = Boolean(activeSession && !activeSession.endedAt);
  const href = firstExerciseId ? `/session/${firstExerciseId}` : '/planning';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session du jour — {dayType}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-text-tertiary">Aucun exercice planifié pour aujourd’hui.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                {statusSquare(item.status)}
                <span className="text-text-primary">{item.exercise.name}</span>
              </li>
            ))}
          </ul>
        )}
        {firstExerciseId && (
          <Button asChild>
            <Link to={href}>{resume ? 'Reprendre la session' : 'Démarrer la session'}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
