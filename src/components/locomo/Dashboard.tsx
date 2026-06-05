"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  TrendingDown,
  Play,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";

interface UserInfo {
  name: string;
  email: string;
}

const DEFAULT_USER: UserInfo = { name: "Patient", email: "" };

// Fallback data used when API is not available
const DEFAULT_DATA = {
  totalSessions: 5,
  avgAmplitudeByJoint: { epaule: 96, coude: 45, hanche: 38, colonne: 22 },
  totalDurationSeconds: 6000,
  formScore: 35,
  amplitudeLast7Days: [
    { date: "2026-05-30", epaule: 78, coude: 0, hanche: 0, colonne: 0 },
    { date: "2026-05-31", epaule: 82, coude: 0, hanche: 0, colonne: 0 },
    { date: "2026-06-01", epaule: 96, coude: 40, hanche: 30, colonne: 18 },
    { date: "2026-06-02", epaule: 106, coude: 48, hanche: 35, colonne: 22 },
    { date: "2026-06-03", epaule: 90, coude: 45, hanche: 38, colonne: 20 },
    { date: "2026-06-04", epaule: 102, coude: 50, hanche: 42, colonne: 25 },
    { date: "2026-06-05", epaule: 88, coude: 47, hanche: 36, colonne: 21 },
  ] as { date: string; epaule: number; coude: number; hanche: number; colonne: number }[],
  todayExercises: [
    { id: "demo-1", name: "Flexion avant epaule", sets: 3, reps: 12, bodyPart: "epaule" },
    { id: "demo-2", name: "Rotation externe epaule", sets: 3, reps: 15, bodyPart: "epaule" },
    { id: "demo-3", name: "Mobilisation hanche", sets: 3, reps: 12, bodyPart: "hanche" },
  ],
  dayType: "Epaule et Hanche",
};

// Gamification badges removed

const MOTIVATIONAL_MESSAGES = [
  "Chaque mouvement vous rapproche de votre objectif. Continuez !",
  "La constance est la clé de la récupération. Vous êtes sur la bonne voie.",
  "Votre détermination est admirable. Le corps se répare jour après jour.",
  "N'oubliez pas : même une petite séance vaut mieux que rien.",
  "Vous faites des progres remarquables. Le coach IA le confirme !",
];

interface DashboardProps {
  dashboardData: Record<string, unknown> | null;
  onStartSession: (exerciseId: string) => void;
  loading: boolean;
  userName?: string;
}

export function Dashboard({
  dashboardData,
  onStartSession,
  loading,
}: DashboardProps) {
  const [user, setUser] = useState<UserInfo>(DEFAULT_USER);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("locomo-user");
      if (stored) {
        const parsed = JSON.parse(stored) as UserInfo;
        setUser(parsed);
      }
    } catch {
      // use defaults
    }
  }, []);

  // Use API data if available, otherwise use built-in demo data
  const data = (dashboardData ?? DEFAULT_DATA) as {
    totalSessions: number;
    avgAmplitudeByJoint: Record<string, number>;
    totalDurationSeconds: number;
    formScore: number;
    amplitudeLast7Days: {
      date: string;
      epaule: number;
      coude: number;
      hanche: number;
      colonne: number;
    }[];
    todayExercises: Array<{
      id: string;
      name: string;
      sets: number;
      reps: number;
      bodyPart: string;
    }>;
    dayType: string;
  };

  const motivationalIndex = data.totalSessions % MOTIVATIONAL_MESSAGES.length;

  const stats = [
    {
      label: "Sessions completées",
      value: String(data.totalSessions),
      icon: Trophy,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Score de forme",
      value: `${data.formScore}%`,
      icon: Activity,
      color: data.formScore >= 80 ? "text-primary" : "text-chart-3",
      bgColor: data.formScore >= 80 ? "bg-primary/10" : "bg-chart-3/10",
    },
  ];

  const amplitudeData = (data.amplitudeLast7Days ?? []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-start gap-4">
          <img src="/logo.png" alt="Locomo-assist" className="w-14 h-14 rounded-xl object-contain bg-white/10 p-1 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white/70 mb-1">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h2 className="text-2xl font-bold mb-1">
              Bonjour {user?.name?.split(" ")[0] || ""} !
            </h2>
            <p className="text-sm text-white/80 max-w-lg">
              {MOTIVATIONAL_MESSAGES[motivationalIndex]}
            </p>
          </div>
          {/* Points badge removed */}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-foreground">
                    {s.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bgColor}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Today */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Amplitude par articulation (7 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {amplitudeData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                Aucune donnée sur les 7 derniers jours
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={amplitudeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.04)"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="epaule" fill="#1D9E75" name="Épaule" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="coude" fill="#085041" name="Coude" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="hanche" fill="#EF9F27" name="Hanche" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="colonne" fill="#6B7280" name="Colonne" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Session du jour - {data.dayType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayExercises && data.todayExercises.length > 0 ? (
              <div className="space-y-3">
                {data.todayExercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                    onClick={() => onStartSession(ex.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.sets} × {ex.reps} - {ex.bodyPart}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Go
                    </Badge>
                  </div>
                ))}
                <button
                  onClick={() =>
                    data.todayExercises[0] &&
                    onStartSession(data.todayExercises[0].id)
                  }
                  className="w-full mt-3 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Démarrer la session
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
                <Activity className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Aucun exercice planifié pour aujourd&apos;hui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amplitude moy. (7j)</p>
              <p className="text-lg font-bold">
                {Math.round(
                  Object.values(data.avgAmplitudeByJoint).reduce((a: number, b: number) => a + b, 0) /
                    Math.max(1, Object.values(data.avgAmplitudeByJoint).filter((v: number) => v > 0).length)
                )}
                °
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-chart-3/10 shrink-0">
              <Clock className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durée cumulée</p>
              <p className="text-lg font-bold">{formatDuration(data.totalDurationSeconds)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 shrink-0">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Forme</p>
              <p className="text-lg font-bold flex items-center gap-1">
                {data.formScore}%
                {data.formScore >= 80 ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-chart-3" />
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}
