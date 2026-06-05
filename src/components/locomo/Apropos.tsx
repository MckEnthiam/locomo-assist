"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Brain,
  Camera,
  Cpu,
  Globe,
  Heart,
  Mic,
  Monitor,
  Shield,
  Smartphone,
  TrendingUp,
  Wifi,
  Zap,
  Code2,
  Database,
  Palette,
} from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    title: "Détection de mouvement en temps réel",
    description: "MediaPipe Pose analyse 33 points du corps via la caméra pour un suivi précis de chaque articulation pendant les exercices.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Brain,
    title: "Coach IA intelligent",
    description: "Un coach virtuel qui analyse vos angles articulaires, détecte les compensations et vous guide en temps réel avec des consignes adaptées.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Mic,
    title: "Retour vocal (Text-to-Speech)",
    description: "Le coach vous parle pendant l'exercice en français avec la Web Speech API, pour un feedback mains libres et immersif.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Suivi de progression",
    description: "Graphiques d'amplitude sur 4 semaines, score de forme, rapport hebdomadaire automatique et détection de tendances.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Shield,
    title: "Détection de compensations",
    description: "Alertes immediates quand une compensation lombaire ou épaule est détectée, pour prévenir les blessures.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Smartphone,
    title: "Mobile-friendly",
    description: "Interface responsive adaptée aux smartphones, tablettes et ordinateurs pour une utilisation partout.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Database,
    title: "Rapports détaillés",
    description: "Génération et téléchargement de rapports de séance avec données d'amplitude, compensations et conseils.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Heart,
    title: "Guides d'entrainement",
    description: "Guides de rééducation complets a télécharger pour les exercices a domicile : épaule, hanche, posture, nutrition.",
    color: "bg-pink-100 text-pink-600",
  },
];

const TECH_STACK = [
  { icon: Monitor, name: "Next.js 16", desc: "React framework" },
  { icon: Palette, name: "Tailwind CSS + shadcn/ui", desc: "UI & Design" },
  { icon: Database, name: "Prisma + SQLite", desc: "Base de données" },
  { icon: Camera, name: "MediaPipe Pose", desc: "Computer Vision" },
  { icon: Brain, name: "z-ai-web-dev-sdk", desc: "IA / LLM" },
  { icon: Code2, name: "TypeScript", desc: "Typage statique" },
  { icon: Cpu, name: "Zustand", desc: "State management" },
  { icon: Zap, name: "Framer Motion", desc: "Animations" },
];

export function Apropos() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-loco-primary-dark to-sidebar p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-start gap-4">
          <img src="/logo.png" alt="Locomo-assist" className="w-16 h-16 rounded-xl object-contain shadow-lg bg-white/10 p-1.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">Locomo-assist</h2>
              <Badge className="bg-white/20 text-white border-0 text-[10px]">v2.0</Badge>
            </div>
            <p className="text-sm text-white/80">
              Application de rééducation physique assistée par IA, conçue pour les patients tógolais en post-AVC ou post-traumatisme.
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Notre mission
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Locomo-assist a été conçu pour répondre a un problème majeur au Togo et en Afrique de l&apos;Ouest : l&apos;accès limité a la kénésithérapie qualifiée après un AVC ou un traumatisme. En combinant l&apos;intelligence artificielle, la vision par ordinateur et le suivi de progression, notre application permet aux patients de suivre un programme de rééducation structuré depuis chez eux, avec un feedback en temps réel qui remplace le guidance d&apos;un thérapeute.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Le nom &quot;Locomo-assist&quot; combine &quot;locomotion&quot; (mouvement) et &quot;assist&quot; (assistance), reflétant notre vision : assister chaque patient dans la récupération de sa mobilité grace a la technologie. Le coach IA parle en français, s&apos;adapte au rythme du patient, et génere des rapports détaillés pour les professionnels de santé.
          </p>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Fonctionnalités principales
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feat) => (
            <Card key={feat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${feat.color} shrink-0`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{feat.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            Stack technologique
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="p-3 rounded-xl bg-muted/50 text-center hover:bg-muted transition-colors">
                <tech.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <p className="text-xs font-medium">{tech.name}</p>
                <p className="text-[10px] text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team / Hackathon */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            TCCHackDefend 2026
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ce projet a été développé dans le cadre du hackathon TCCHackDefend 2026. Notre équipe est passionnée par l&apos;innovation au service de la santé en Afrique. Nous croyons que la technologie peut pallier le déficit de personnels de santé spécialisés dans les pays en développement.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Badge className="bg-primary text-white text-xs">Hackathon</Badge>
            <Badge variant="outline" className="text-xs">Santé</Badge>
            <Badge variant="outline" className="text-xs">IA</Badge>
            <Badge variant="outline" className="text-xs">Togo</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
