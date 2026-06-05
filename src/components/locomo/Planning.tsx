"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Dumbbell, ChevronRight } from "lucide-react";
import { getTodayExercises } from "@/lib/localData";

const DAY_LABELS = [
  "",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
];

const DAY_COLORS: Record<number, string> = {
  1: "bg-primary/15 text-primary border-primary/20",
  2: "bg-primary/15 text-primary border-primary/20",
  3: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  4: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  5: "bg-primary/15 text-primary border-primary/20",
};

interface PlanningProps {
  onStartSession: () => void;
}

interface ExerciseItem {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  sets: number;
  reps: number;
  dayOfWeek: number;
  sortOrder: number;
}

interface PlanningDay {
  dayOfWeek: number;
  label: string;
  bodyPart: string;
  exercises: ExerciseItem[];
  estimatedMinutes: number;
}

const FALLBACK_EXERCISES: ExerciseItem[] = [
  { id: "fe-1", name: "Flexion avant epaule", description: "Glissez l'avant-bras vers le haut en gardant le coude tendu contre le mur.", bodyPart: "epaule", sets: 3, reps: 12, dayOfWeek: 1, sortOrder: 1 },
  { id: "re-1", name: "Rotation externe epaule", description: "Coude plie a 90 deg., rotatez l'avant-bras vers l'exterieur.", bodyPart: "epaule", sets: 3, reps: 15, dayOfWeek: 2, sortOrder: 1 },
  { id: "ab-1", name: "Abduction laterale", description: "Elevez le bras sur le cote jusqu'a hauteur d'epaule.", bodyPart: "epaule", sets: 3, reps: 10, dayOfWeek: 3, sortOrder: 1 },
  { id: "pc-1", name: "Pendule Codman", description: "Penche en avant, laissez pendre le bras et effectuez de petits cercles.", bodyPart: "epaule", sets: 2, reps: 20, dayOfWeek: 4, sortOrder: 1 },
  { id: "mh-1", name: "Mobilisation hanche", description: "Allonge sur le cote, effectuez des rotations lentes de hanche.", bodyPart: "hanche", sets: 3, reps: 12, dayOfWeek: 5, sortOrder: 1 },
];

export function Planning({ onStartSession }: PlanningProps) {
  const [days, setDays] = useState<PlanningDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const exercises = getTodayExercises();
    const grouped: PlanningDay[] = [];
    for (let d = 1; d <= 5; d++) {
      const dayExercises = exercises.filter((e) => e.dayOfWeek === d);
      const estimatedMinutes = dayExercises.reduce(
        (sum, ex) => sum + ex.sets * ex.reps * 0.05,
        0
      );
      grouped.push({
        dayOfWeek: d,
        label: DAY_LABELS[d],
        bodyPart:
          dayExercises[0]?.bodyPart === "epaule"
            ? "Epaule"
            : dayExercises[0]?.bodyPart === "hanche"
              ? "Hanche"
              : "Rééducation",
        exercises: dayExercises,
        estimatedMinutes: Math.max(1, Math.round(estimatedMinutes)),
      });
    }
    setDays(grouped);
    setLoading(false);
  }, []);

  const jsDay = new Date().getDay();
  const todayIdx = jsDay === 0 ? 1 : jsDay;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Planning hebdomadaire
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Programme du lundi au vendredi — 5 exercices ciblés
          </p>
        </div>
        <Button
          onClick={onStartSession}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
        >
          <Dumbbell className="w-4 h-4 mr-2" />
          Démarrer aujourd&apos;hui
        </Button>
      </div>

      {/* Days Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-xl bg-white animate-shimmer"
              />
            ))
          : days.map((day) => {
              const isToday = day.dayOfWeek === todayIdx;
              return (
                <Card
                  key={day.dayOfWeek}
                  className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                    isToday ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                >
                  {isToday && (
                    <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">
                          {day.label}
                        </CardTitle>
                        {isToday && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            Aujourd&apos;hui
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          DAY_COLORS[day.dayOfWeek] ?? ""
                        }`}
                      >
                        {day.bodyPart}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {day.estimatedMinutes} min estimées
                    </p>
                  </CardHeader>
                  <CardContent>
                    {day.exercises.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        Repos ce jour
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {day.exercises.map((ex) => (
                          <li
                            key={ex.id}
                            className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={onStartSession}
                          >
                            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {ex.sets}×{ex.reps}
                            </div>
                            <span className="flex-1 truncate text-foreground/90 group-hover:text-foreground transition-colors">
                              {ex.name}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
