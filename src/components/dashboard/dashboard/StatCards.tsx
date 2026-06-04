import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';

interface StatCardsProps {
  totalSessions: number;
  avgAmplitude: number;
  totalDurationSeconds: number;
  formScore: number;
}

export function StatCards({
  totalSessions,
  avgAmplitude,
  totalDurationSeconds,
  formScore,
}: StatCardsProps) {
  const stats = [
    { label: 'Sessions complétées', value: String(totalSessions) },
    { label: 'Amplitude moy. (7j)', value: `${avgAmplitude}°` },
    { label: 'Durée cumulée', value: formatDuration(totalDurationSeconds) },
    { label: 'Score de forme', value: `${formScore}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-text-secondary">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-text-primary">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
