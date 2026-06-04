'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AmplitudeChartProps {
  data: {
    date: string;
    epaule: number;
    coude: number;
    hanche: number;
    colonne: number;
  }[];
}

export function AmplitudeChart({ data }: AmplitudeChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-tertiary">
        Aucune donnée d’amplitude sur les 7 derniers jours.
      </p>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="epaule" fill="#1D9E75" name="Épaule" />
        <Bar dataKey="coude" fill="#085041" name="Coude" />
        <Bar dataKey="hanche" fill="#EF9F27" name="Hanche" />
        <Bar dataKey="colonne" fill="#6B7280" name="Colonne" />
      </BarChart>
    </ResponsiveContainer>
  );
}
