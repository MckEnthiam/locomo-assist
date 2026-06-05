"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ChartPoint {
  week: string;
  epaule: number;
  coude: number;
  hanche: number;
  colonne: number;
}

interface WeekRow {
  weekNumber: number;
  sessionsCount: number;
  avgAmplitude: number;
  totalTimeSeconds: number;
  compensations: { lumbar: number; shoulder: number };
}

const FALLBACK_CHART: ChartPoint[] = [
  { week: "S20", epaule: 72, coude: 38, hanche: 30, colonne: 15 },
  { week: "S21", epaule: 80, coude: 42, hanche: 33, colonne: 17 },
  { week: "S22", epaule: 88, coude: 45, hanche: 36, colonne: 20 },
  { week: "S23", epaule: 96, coude: 48, hanche: 40, colonne: 22 },
];
const FALLBACK_WEEKS: WeekRow[] = [
  { weekNumber: 20, sessionsCount: 1, avgAmplitude: 72, totalTimeSeconds: 600, compensations: { lumbar: 2, shoulder: 3 } },
  { weekNumber: 21, sessionsCount: 2, avgAmplitude: 80, totalTimeSeconds: 1200, compensations: { lumbar: 1, shoulder: 2 } },
  { weekNumber: 22, sessionsCount: 3, avgAmplitude: 88, totalTimeSeconds: 1800, compensations: { lumbar: 1, shoulder: 1 } },
  { weekNumber: 23, sessionsCount: 5, avgAmplitude: 96, totalTimeSeconds: 3000, compensations: { lumbar: 0, shoulder: 1 } },
];

export function Progression() {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [weekRows, setWeekRows] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/progression");
        if (res.ok) {
          const data = await res.json();
          setChartData(data.chartData?.length > 0 ? data.chartData : FALLBACK_CHART);
          setWeekRows(data.weekRows?.length > 0 ? data.weekRows : FALLBACK_WEEKS);
        } else {
          setChartData(FALLBACK_CHART);
          setWeekRows(FALLBACK_WEEKS);
        }
      } catch {
        setChartData(FALLBACK_CHART);
        setWeekRows(FALLBACK_WEEKS);
      }
      setLoading(false);
    }
    void load();
  }, []);

  function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  }

  function TrendIcon({ current, previous }: { current: number; previous: number }) {
    if (previous === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    const diff = ((current - previous) / previous) * 100;
    if (diff > 2) return <TrendingUp className="w-3 h-3 text-primary" />;
    if (diff < -2) return <TrendingDown className="w-3 h-3 text-chart-3" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-80 rounded-xl bg-white/80" />
        <div className="h-60 rounded-xl bg-white/80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progression
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi de vos performances sur les 4 dernières semaines
        </p>
      </div>

      {/* Line Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Amplitude par articulation</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              Aucune donnée de progression enregistrée.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.04)"
                />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="epaule"
                  stroke="#1D9E75"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#1D9E75" }}
                  name="Épaule"
                />
                <Line
                  type="monotone"
                  dataKey="coude"
                  stroke="#085041"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#085041" }}
                  name="Coude"
                />
                <Line
                  type="monotone"
                  dataKey="hanche"
                  stroke="#EF9F27"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#EF9F27" }}
                  name="Hanche"
                />
                <Line
                  type="monotone"
                  dataKey="colonne"
                  stroke="#6B7280"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6B7280" }}
                  name="Colonne"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Récapitulatif hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weekRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucune session sur cette période.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">
                      Semaine
                    </th>
                    <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">
                      Sessions
                    </th>
                    <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">
                      Amp. moy.
                    </th>
                    <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">
                      Temps
                    </th>
                    <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">
                      Compensations
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                      Tendance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weekRows.map((row, idx) => (
                    <tr
                      key={row.weekNumber}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium">S{row.weekNumber}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary text-[10px]"
                        >
                          {row.sessionsCount}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-bold text-primary">
                        {row.avgAmplitude}°
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDuration(row.totalTimeSeconds)}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        <span className="text-muted-foreground">
                          Lomb: {row.compensations.lumbar}
                        </span>
                        <span className="mx-1">·</span>
                        <span className="text-muted-foreground">
                          Ép: {row.compensations.shoulder}
                        </span>
                      </td>
                      <td className="py-3">
                        <TrendIcon
                          current={row.avgAmplitude}
                          previous={
                            idx < weekRows.length - 1
                              ? weekRows[idx + 1].avgAmplitude
                              : 0
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
