"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Settings,
  Volume2,
  VolumeX,
  Camera,
  Moon,
  Sun,
  Bell,
  BellOff,
  RefreshCw,
  Trash2,
  LogOut,
  Monitor,
  Shield,
  Globe,
  Info,
} from "lucide-react";

interface UserData {
  name: string;
  email: string;
  role: string;
}

const DEFAULT_USER: UserData = { name: "Patient D\u00e9mo", email: "demo@locomo.com", role: "PATIENT" };

export function Parametres() {
  const [user, setUser] = useState<UserData>(DEFAULT_USER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("locomo-user");
      if (stored) {
        const parsed = JSON.parse(stored) as UserData;
        setUser(parsed);
      }
    } catch {
      // use defaults
    }
  }, []);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("locomo-voice");
      if (v !== null) setVoiceEnabled(v === "true");
      const d = localStorage.getItem("locomo-dark");
      if (d !== null) setDarkMode(d === "true");
      const n = localStorage.getItem("locomo-notifications");
      if (n !== null) setNotifications(n === "true");
    }
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next);
    }
    localStorage.setItem("locomo-dark", String(next));
  }

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem("locomo-voice", String(next));
  }

  function toggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("locomo-notifications", String(next));
  }

  function handleResetData() {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser toutes vos données ? Cette action est irréversible.")) {
      localStorage.removeItem("locomo-voice");
      localStorage.removeItem("locomo-dark");
      localStorage.removeItem("locomo-notifications");
      setVoiceEnabled(true);
      setDarkMode(false);
      setNotifications(true);
      document.documentElement.classList.remove("dark");
    }
  }

  function handleDeleteAccount() {
    alert("Mode de\u0301monstration : suppression de compte non disponible.");
  }

  const SettingToggle = ({
    icon: Icon,
    label,
    description,
    enabled,
    onToggle,
    enabledColor = "bg-primary",
  }: {
    icon: React.ElementType;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    enabledColor?: string;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background shadow-sm shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? enabledColor : "bg-muted-foreground/30"}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Paramètres
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez votre expérience Locomo-assist
        </p>
      </div>

      {/* User info card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {user?.role === "THERAPIST" ? "Thérapeute" : "Patient"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Display */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          Affichage & Audio
        </h3>
        <div className="space-y-2">
          <SettingToggle
            icon={Volume2}
            label="Coach vocal"
            description="Le coach IA vous parle pendant les exercices"
            enabled={voiceEnabled}
            onToggle={toggleVoice}
          />
          <SettingToggle
            icon={darkMode ? Moon : Sun}
            label="Mode sombre"
            description="Basculer entre le thème clair et sombre"
            enabled={darkMode}
            onToggle={toggleDarkMode}
            enabledColor="bg-indigo-500"
          />
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notifications
        </h3>
        <div className="space-y-2">
          <SettingToggle
            icon={notifications ? Bell : BellOff}
            label="Rappels de séance"
            description="Recevoir des rappels pour vos exercices quotidiens"
            enabled={notifications}
            onToggle={toggleNotifications}
          />
        </div>
      </div>

      {/* Language */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Langue</p>
              <p className="text-[11px] text-muted-foreground">Langue de l&apos;interface et du coach vocal</p>
              <div className="mt-2 p-2.5 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-sm">Français (France)</span>
                <Badge variant="outline" className="text-[10px]">Par défaut</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Informations</p>
              <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <p>Version : <span className="font-medium text-foreground">2.0.0</span></p>
                <p>Plateforme : <span className="font-medium text-foreground">Web (Next.js 16)</span></p>
                <p>Moteur IA : <span className="font-medium text-foreground">z-ai-web-dev-sdk</span></p>
                <p>Vision : <span className="font-medium text-foreground">MediaPipe Pose</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-600">
          <Shield className="w-4 h-4" />
          Zone danger
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background shadow-sm shrink-0">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Réinitialiser les préférences</p>
                <p className="text-[11px] text-muted-foreground">Remettre tous les paramètres par défaut</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetData} className="text-xs shrink-0">
              Réinitialiser
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white shadow-sm shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Supprimer le compte</p>
                <p className="text-[11px] text-red-400">Toutes vos données seront perdues</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDeleteAccount} className="text-xs text-red-600 border-red-200 hover:bg-red-100 shrink-0">
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
