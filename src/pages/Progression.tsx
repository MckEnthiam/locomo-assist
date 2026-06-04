import { useEffect } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';
import { useProgressionStore } from '@/store/progressionStore';

export default function Progression() {
  const { chartData, weekRows, loading, error, fetchProgression } = useProgressionStore();

  useEffect(() => {
    void fetchProgression();
  }, [fetchProgression]);

  return (
    <AppShell title="Progression" subtitle="4 dernières semaines">
      {loading && <p className="text-sm text-text-tertiary">Chargement…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Amplitude par articulation</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 && !loading ? (
            <p className="py-8 text-center text-sm text-text-tertiary">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="epaule" stroke="#1D9E75" name="Épaule" />
                <Line type="monotone" dataKey="coude" stroke="#085041" name="Coude" />
                <Line type="monotone" dataKey="hanche" stroke="#EF9F27" name="Hanche" />
                <Line type="monotone" dataKey="colonne" stroke="#6B7280" name="Colonne" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif hebdomadaire</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[0.5px] border-border text-text-secondary">
                <th className="pb-2 pr-4 font-medium">Semaine</th>
                <th className="pb-2 pr-4 font-medium">Sessions</th>
                <th className="pb-2 pr-4 font-medium">Amp. moy.</th>
                <th className="pb-2 pr-4 font-medium">Temps</th>
                <th className="pb-2 font-medium">Compensations</th>
              </tr>
            </thead>
            <tbody>
              {weekRows.map((row) => (
                <tr key={row.weekNumber} className="border-b border-[0.5px] border-border">
                  <td className="py-2 pr-4">S{row.weekNumber}</td>
                  <td className="py-2 pr-4">{row.sessionsCount}</td>
                  <td className="py-2 pr-4">{row.avgAmplitude}°</td>
                  <td className="py-2 pr-4">{formatDuration(row.totalTimeSeconds)}</td>
                  <td className="py-2">
                    Lombaire {row.compensations.lumbar}, Épaule {row.compensations.shoulder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
