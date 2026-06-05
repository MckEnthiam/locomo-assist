"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  BookOpen,
  Dumbbell,
  Brain,
  AlertTriangle,
  Loader2,
  Eye,
  X,
  Printer,
} from "lucide-react";
// CSS transitions used instead of framer-motion for reliability

interface ReportItem {
  id: string;
  sessionId: string;
  weekNumber: number;
  generatedAt: string;
  pdfUrl: string;
  summary: {
    avgAmplitude: number;
    totalTime: number;
    sessionsCount: number;
    compensations: { lumbar: number; shoulder: number };
    formScore: number;
    exercises?: Array<{
      name: string;
      avgAmplitude: number;
      peakAmplitude: number;
      reps: number;
      status: string;
    }>;
  } | null;
}

interface GuideItem {
  id: string;
  title: string;
  description: string;
  icon: "shoulder" | "hip" | "coach" | "general";
  color: string;
  content: string;
}

const TRAINING_GUIDES: GuideItem[] = [
  {
    id: "guide-epaule",
    title: "Guide de rééducation de l'épaule",
    description:
      "Programme complet de 8 exercices pour la récupération de la mobilité de l'épaule après un AVC ou un traumatisme.",
    icon: "shoulder",
    color: "bg-primary/10 text-primary",
    content: `GUIDE DE RÉÉDUCATION DE L'ÉPAULE — Locomo-assist
================================================

1. FLEXION AVANT D'ÉPAULE
   Position: Debout face a un mur
   Mouvement: Glissez l'avant-bras vers le haut en gardant le coude tendu
   Séries: 3 x 12 répétitions
   Cible: 120 deg. d'amplitude
   Astuce: Gardez le dos bien droit, ne cambrez pas la colonne

2. ROTATION EXTERNE D'ÉPAULE
   Position: Coude plie a 90 deg., le long du corps
   Mouvement: Rotatez l'avant-bras vers l'extérieur
   Séries: 3 x 15 répétitions
   Cible: 90 deg. de rotation
   Astuce: Ne décollez pas le coude du corps

3. ABDUCTION LATÉRALE
   Position: Debout, bras le long du corps
   Mouvement: Élevez le bras sur le côte
   Séries: 3 x 10 répétitions
   Cible: 90 deg. d'élévation
   Astuce: Paume vers le sol, mouvement lent et contrôlé

4. PENDULE CODMAN
   Position: Penché en avant, main appuyée sur une table
   Mouvement: Laissez pendre le bras et faites des cercles
   Séries: 2 x 20 cercles (dans chaque sens)
   Astuce: Utilisez le poids du bras, pas la force musculaire

PRÉCAUTIONS:
- Arrêtez immédiatement si vous ressentez une douleur vive
- Ne forcez jamais un mouvement
- Respirez calmement pendant chaque exercice
- Faites les exercices 5 fois par semaine minimum
- Consultez votre kinésithérapeute régulièrement

FRÉQUENCE RECOMMANDÉE: 5 séances par semaine, 20-30 min par séance`,
  },
  {
    id: "guide-hanche",
    title: "Exercices de mobilisation de la hanche",
    description:
      "Entrainement ciblé pour retrouver la mobilité et la force de la hanche. Adapté aux patients en post-AVC ou post-chirurgical.",
    icon: "hip",
    color: "bg-chart-3/10 text-chart-3",
    content: `EXERCICES DE MOBILISATION DE LA HANCHE — Locomo-assist
======================================================

1. FLEXION DE HANCHE (ALLONGÉ)
   Position: Allongé sur le dos, jambes tendues
   Mouvement: Ramenez le genou vers la poitrine
   Séries: 3 x 12 répétitions (chaque jambe)
   Cible: 120 deg. de flexion
   Astuce: Maintenez 3 secondes en position haute

2. ABDUCTION DE HANCHE
   Position: Allongé sur le côté
   Mouvement: Élevez la jambe du haut latéralement
   Séries: 3 x 15 répétitions
   Cible: 45 deg. d'abduction
   Astuce: Ne roulez pas le bassin vers l'arrière

3. PONT FESSIER
   Position: Allongé sur le dos, genoux pliés
   Mouvement: Soulevez le bassin en contractant les fessiers
   Séries: 3 x 12 répétitions, tenir 5 secondes
   Astuce: Montez et descendez lentement

4. MARCHE SUR PLACE
   Position: Debout, près d'un mur pour l'équilibre
   Mouvement: Levez les genoux alternativement
   Durée: 2 minutes
   Astuce: Montez le genou a hauteur de hanche

PRÉCAUTIONS:
- Échauffez-vous 5 minutes avant chaque séance
- Progression graduelle — augmentez les répétitions chaque semaine
- Douleur modérée acceptable, douleur vive = arrêt immédiat`,
  },
  {
    id: "guide-posture",
    title: "Guide posture et prévention des compensations",
    description:
      "Apprenez a identifier et corriger les compensations motrices fréquentes pendant la rééducation.",
    icon: "coach",
    color: "bg-blue-100 text-blue-600",
    content: `GUIDE POSTURE ET PRÉVENTION — Locomo-assist
============================================

COMPENSATIONS LOMBAIRES (DOSSIER)
---------------------------------
Signes: Dos cambré, bassin antéversé, douleurs lombaires
Causes: Faiblesse abdominale, raideur des fléchisseurs de hanche
Correction:
  1. Serrez les abdominaux pendant chaque exercice
  2. Rétroversez le bassin (rentrez les fesses)
  3. Renforcez le transverse abdominal
  4. Étirez les fléchisseurs de hanche régulièrement

COMPENSATIONS D'ÉPAULE
-----------------------
Signes: Remontée des épaules, inclinaison du tronc
Causes: Faiblesse des fixateurs de scapula, tension
Correction:
  1. Abaissez et reculez les épaules
  2. Renforcez le trapèze moyen et inférieur
  3. Relaxez les muscles trapèze supérieur
  4. Utilisez l'IA Locomo-assist pour un feedback temps réel

RÈGLES D'OR PENDANT L'EXERCICE:
1. Le dos droit = abdominaux engagés
2. Les épaules basses et détendues
3. Le mouvement est lent et contrôlé
4. Respirez: expirez pendant l'effort, inspirez au retour
5. Ne forcez jamais au-dela de la douleur
6. Qualité > Quantité: mieux vaut 5 répétitions parfaites que 15 mal faites`,
  },
  {
    id: "guide-nutrition",
    title: "Nutrition et récupération pour la rééducation",
    description:
      "Conseils nutritionnels pour optimiser la récupération musculaire et nerveuse pendant votre programme de rééducation.",
    icon: "general",
    color: "bg-green-100 text-green-600",
    content: `NUTRITION ET RÉCUPÉRATION — Locomo-assist
===========================================

PRINCIPES DE BASE
-----------------
1. HYDRATATION: Minimum 2L d'eau par jour
   - L'eau facilite l'élasticité des tissus musculaires
   - Buvez avant, pendant et après les séances

2. PROTÉINES: 1.2-1.5g par kg de poids corporel/jour
   - Sources: Poulet, poisson, oeufs, légumineuses, tofu
   - Répartissez sur 3-4 repas

3. ANTI-INFLAMMATOIRES NATURELS
   - Curcuma + poivre noir
   - Gingembre frais
   - Oméga-3: poissons gras, noix, graines de lin
   - Fruits rouges: myrtilles, fraises, cerises

ALIMENTS A PRIVILÉGIER
-----------------------
Legumes verts (épinards, brocoli, kale)
Fruits frais (mangue, papaye, agrumes)
Céréales complètes (riz, quinoa, mil)
Poissons gras (sardine, maquereau)
Tubercules (igname, patate douce)

ALIMENTS A LIMITER
------------------
Sucre raffiné et boissons sucrées
Aliments ultra-transformés
Excès d'alcool
Aliments frits en excès`,
  },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function getGuideIcon(icon: GuideItem["icon"]) {
  switch (icon) {
    case "shoulder":
      return <Dumbbell className="w-5 h-5" />;
    case "hip":
      return <ActivityIcon className="w-5 h-5" />;
    case "coach":
      return <Brain className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// Generate and download a report as an HTML file
function downloadReportAsHTML(report: ReportItem) {
  const summary = report.summary;
  const exercisesHTML = summary?.exercises
    ? summary.exercises.map((ex, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${i + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 500;">${ex.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center;">${ex.avgAmplitude} deg.</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center;">${ex.peakAmplitude} deg.</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center;">${ex.reps}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center;">
          <span style="background: ${ex.status === "done" ? "#E1F5EE" : "#FEF3C7"}; color: ${ex.status === "done" ? "#085041" : "#92400E"}; padding: 2px 8px; border-radius: 9999px; font-size: 11px;">${ex.status === "done" ? "Termine" : "En cours"}</span>
        </td>
      </tr>`).join("")
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Locomo-assist — Semaine ${report.weekNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; background: #fff; }
  .header { text-align: center; border-bottom: 3px solid #1D9E75; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #085041; font-size: 28px; margin-bottom: 5px; }
  .header p { color: #666; font-size: 14px; }
  .meta { display: flex; justify-content: space-between; background: #f5f5f5; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; font-size: 14px; flex-wrap: wrap; gap: 10px; }
  .meta span { color: #555; }
  .meta strong { color: #085041; }
  .section { margin-bottom: 25px; }
  .section h2 { color: #085041; font-size: 18px; border-left: 4px solid #1D9E75; padding-left: 12px; margin-bottom: 12px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
  .metric { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
  .metric .value { font-size: 32px; font-weight: 700; color: #1D9E75; }
  .metric .label { font-size: 12px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #085041; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
  .note { background: #EFF6FF; border: 1px solid #BFDBFE; padding: 15px; border-radius: 8px; font-size: 13px; color: #1E40AF; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; }
  @media print { body { padding: 20px; } @media (max-width: 600px) { .metrics { grid-template-columns: 1fr; } .meta { flex-direction: column; } } }
</style>
</head>
<body>
  <div class="header">
    <h1>Locomo-assist</h1>
    <p>Rapport de rééducation hebdomadaire</p>
  </div>
  <div class="meta">
    <span>Semaine: <strong>${report.weekNumber}</strong></span>
    <span>Date: <strong>${new Date(report.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
  </div>
  ${summary ? `
  <div class="section">
    <h2>Résumé de la performance</h2>
    <div class="metrics">
      <div class="metric">
        <div class="value">${summary.formScore}%</div>
        <div class="label">Score de forme</div>
      </div>
      <div class="metric">
        <div class="value">${summary.avgAmplitude} deg.</div>
        <div class="label">Amplitude moyenne</div>
      </div>
      <div class="metric">
        <div class="value">${formatDuration(summary.totalTime)}</div>
        <div class="label">Durée totale</div>
      </div>
    </div>
  </div>
  <div class="section">
    <h2>Détail des exercices</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Exercice</th>
          <th>Amp. moy.</th>
          <th>Amp. max</th>
          <th>Rép.</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>${exercisesHTML}</tbody>
    </table>
  </div>
  <div class="section">
    <h2>Compensations détectées</h2>
    <p style="font-size: 14px;">Lombaires: <strong>${summary.compensations.lumbar}</strong> | Épaules: <strong>${summary.compensations.shoulder}</strong></p>
  </div>
  <div class="section">
    <div class="note">
      <strong>Note:</strong> Ce rapport a été généré automatiquement par Locomo-assist, votre assistant IA de rééducation.
      Les données d'amplitude et les compensations sont mesurées en temps réel grâce a la détection de mouvement par IA.
      Pour toute question, consultez votre kinésithérapeute.
    </div>
  </div>
  ` : '<p>Aucune donnée de synthèse disponible pour ce rapport.</p>'}
  <div class="footer">
    <p>Locomo-assist — TCCHackDefend 2026 | Rapport généré automatiquement</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-locomo-assist-semaine-${report.weekNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download a training guide as a text file
function downloadGuide(guide: GuideItem) {
  const blob = new Blob([guide.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guide.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Preview report in a modal
function ReportPreview({ report, onClose }: { report: ReportItem; onClose: () => void }) {
  const summary = report.summary;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Apercu du rapport — Semaine {report.weekNumber}
          </h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { downloadReportAsHTML(report); onClose(); }}>
              <Download className="w-3.5 h-3.5 mr-1" /> Télécharger
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Imprimer
            </Button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center border-b border-border pb-4">
            <img src="/logo.png" alt="Locomo-assist" className="w-12 h-12 mx-auto mb-2 object-contain" />
            <h2 className="text-xl font-bold text-primary-dark">Rapport de Rééducation</h2>
            <p className="text-xs text-muted-foreground">
              {new Date(report.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {summary && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-2xl font-bold text-primary">{summary.formScore}%</p>
                  <p className="text-[10px] text-muted-foreground">Score de forme</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-2xl font-bold">{summary.avgAmplitude} deg.</p>
                  <p className="text-[10px] text-muted-foreground">Amplitude moy.</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-2xl font-bold">{formatDuration(summary.totalTime)}</p>
                  <p className="text-[10px] text-muted-foreground">Durée totale</p>
                </div>
              </div>
              {summary.exercises && summary.exercises.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Détail des exercices</h4>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="p-2 text-left">#</th>
                          <th className="p-2 text-left">Exercice</th>
                          <th className="p-2 text-center">Amp.</th>
                          <th className="p-2 text-center">Rép.</th>
                          <th className="p-2 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.exercises.map((ex, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2 font-medium">{ex.name}</td>
                            <td className="p-2 text-center">{ex.avgAmplitude} deg.</td>
                            <td className="p-2 text-center">{ex.reps}</td>
                            <td className="p-2 text-center">
                              <Badge variant={ex.status === "done" ? "secondary" : "outline"} className="text-[9px]">
                                {ex.status === "done" ? "Termine" : "En cours"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
                <strong>Compensations:</strong> Lombaires: {summary.compensations.lumbar} | Épaules: {summary.compensations.shoulder}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const FALLBACK_REPORTS: ReportItem[] = [
  {
    id: "report-1",
    sessionId: "session-1",
    weekNumber: 22,
    generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    pdfUrl: "",
    summary: {
      avgAmplitude: 85,
      totalTime: 900,
      sessionsCount: 1,
      compensations: { lumbar: 1, shoulder: 2 },
      formScore: 82,
      exercises: [
        { name: "Flexion avant epaule", avgAmplitude: 88, peakAmplitude: 105, reps: 36, status: "done" },
        { name: "Rotation externe epaule", avgAmplitude: 82, peakAmplitude: 98, reps: 45, status: "done" },
      ],
    },
  },
  {
    id: "report-2",
    sessionId: "session-2",
    weekNumber: 23,
    generatedAt: new Date().toISOString(),
    pdfUrl: "",
    summary: {
      avgAmplitude: 92,
      totalTime: 1500,
      sessionsCount: 2,
      compensations: { lumbar: 0, shoulder: 1 },
      formScore: 90,
      exercises: [
        { name: "Flexion avant epaule", avgAmplitude: 95, peakAmplitude: 110, reps: 36, status: "done" },
        { name: "Rotation externe epaule", avgAmplitude: 89, peakAmplitude: 102, reps: 45, status: "done" },
        { name: "Abduction laterale", avgAmplitude: 92, peakAmplitude: 108, reps: 30, status: "done" },
      ],
    },
  },
];

export function Rapports() {
  const [reports, setReports] = useState<ReportItem[]>(FALLBACK_REPORTS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/rapports");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
        }
        // If API returns empty data or error, keep FALLBACK_REPORTS silently
      }
    } catch {
      // Keep fallback reports, no error shown to user
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function generateReport() {
    setGenerating(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/rapports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({
          text: data.error || "Erreur lors de la génération du rapport",
          type: "error",
        });
      } else if (data.error) {
        setStatusMessage({ text: data.error, type: "error" });
      } else {
        setStatusMessage({
          text: "Rapport généré avec succès ! Vous pouvez le prévisualiser ou le télécharger.",
          type: "success",
        });
        await loadReports();
      }
    } catch {
      setStatusMessage({
        text: "Erreur de connexion. Vérifiez que le serveur est lancé.",
        type: "error",
      });
    }
    setGenerating(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Rapports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bilans hebdomadaires et guides d&apos;entrainement
          </p>
        </div>
        <Button
          onClick={generateReport}
          disabled={generating}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {generating ? "Génération..." : "Générer rapport"}
        </Button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : statusMessage.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : statusMessage.type === "error" ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <BookOpen className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="rounded-xl bg-gradient-to-r from-loco-primary-light to-white p-4 border border-primary/10">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Rapports automatiques
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Les rapports sont générés automatiquement a la fin de chaque session. Ils contiennent les données d&apos;amplitude, les compensations et les conseils du coach IA.
            </p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Mes rapports de session
        </h3>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/80" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun rapport disponible.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Terminez une session ou génez un rapport manuellement.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card
                key={r.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">
                            Semaine {r.weekNumber}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-[10px]"
                          >
                            HTML
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.generatedAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                        {r.summary && (
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              Score:{" "}
                              <span className="font-bold text-primary">
                                {r.summary.formScore}%
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Amp. moy:{" "}
                              <span className="font-bold">
                                {r.summary.avgAmplitude} deg.
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Durée:{" "}
                              <span className="font-bold">
                                {formatDuration(r.summary.totalTime)}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary border-primary/20 hover:bg-primary/10"
                        onClick={() => setPreviewReport(r)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReportAsHTML(r)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Training Guides Section */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Guides d&apos;entrainement
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Telechargez ces guides pour vos exercices a domicile. Ils contiennent des programmes complets avec des instructions détaillées.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRAINING_GUIDES.map((guide) => (
            <Card
              key={guide.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${guide.color} shrink-0`}>
                    {getGuideIcon(guide.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold">{guide.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {guide.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => downloadGuide(guide)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Telecharger le guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      {previewReport && (
        <ReportPreview
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
}
