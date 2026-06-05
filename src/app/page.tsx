"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/locomo/Sidebar";
import { Dashboard } from "@/components/locomo/Dashboard";
import { Planning } from "@/components/locomo/Planning";
import { SessionLive } from "@/components/locomo/SessionLive";
import { Progression } from "@/components/locomo/Progression";
import { Rapports } from "@/components/locomo/Rapports";
import { Profil } from "@/components/locomo/Profil";
import { Apropos } from "@/components/locomo/Apropos";
import { Parametres } from "@/components/locomo/Parametres";
import { Chatbot } from "@/components/locomo/Chatbot";
import { useSessionStore } from "@/store/sessionStore";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  birthDate?: string;
  condition?: string;
  avatar?: string | null;
  createdAt?: string;
}

/* ─── Beautiful Splash Screen ─── */
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Animate progress bar: 0 → 100 over ~4.5s
    const steps = [5, 12, 22, 30, 40, 50, 58, 65, 72, 80, 88, 95, 100];
    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step < steps.length) {
        setProgress(steps[step]);
      } else {
        clearInterval(timer);
      }
    }, 350);

    // After 5 seconds, start fade-out, then complete
    const fadeTimer = setTimeout(() => {
      setFading(true);
      setTimeout(() => onCompleteRef.current(), 600);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-600 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#F0F5F2" }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.08] rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.08] rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="absolute top-1/4 right-1/3 w-[150px] h-[150px] bg-white/[0.04] rounded-full" />
      <div className="absolute bottom-1/3 left-1/3 w-[120px] h-[120px] bg-white/[0.03] rounded-full" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo with minimal styling */}
        <div className="relative" style={{ animation: "splashScaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          <div className="relative w-24 h-24 rounded-3xl bg-white border border-gray-200 flex items-center justify-center p-3">
            <img src="/logo.png" alt="Locomo-assist" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center" style={{ animation: "splashFadeUp 0.7s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <h1 className="text-3xl font-bold text-[#085041] tracking-tight">Locomo-assist</h1>
          <p className="text-sm text-gray-600 mt-1.5 tracking-wide">Reeducation physique intelligente</p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-2" style={{ animation: "splashFadeUp 0.5s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gray-400/40"
                style={{ animation: `splashDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">Chargement</span>
        </div>

        {/* Progress bar */}
        <div className="w-64" style={{ animation: "splashFadeUp 0.5s 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <div className="h-[3px] bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#085041] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-gray-500">Initialisation...</span>
            <span className="text-[9px] text-gray-500 font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-6">
        <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">TCCHackDefend 2026</p>
      </div>
    </div>
  );
}

/* ─── Demo user factory ─── */
function createDemoUser(): UserInfo {
  return {
    id: "demo-user-001",
    name: "Patient Demo",
    email: "demo@locomo.com",
    role: "PATIENT",
    phone: "+228 90 12 34 56",
    birthDate: "1985-03-15",
    condition: "Readaptation post-AVC epaule gauche - Phase 2",
    avatar: null,
    createdAt: new Date().toISOString(),
  };
}

/* ─── Main App ─── */
export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const splashDoneRef = useRef(false);

  const isLive = useSessionStore((s) => s.isLive);

  // Check authentication on mount — auto-login as demo patient if needed
  useEffect(() => {
    const auth = localStorage.getItem("locomo-auth");
    const storedUser = localStorage.getItem("locomo-user");

    if (auth === "true" && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid stored data — fall through to auto-login
        const demoUser = createDemoUser();
        localStorage.setItem("locomo-user", JSON.stringify(demoUser));
        localStorage.setItem("locomo-auth", "true");
        setUser(demoUser);
      }
    } else {
      // Auto-login as demo patient — go directly to dashboard
      const demoUser = createDemoUser();
      localStorage.setItem("locomo-user", JSON.stringify(demoUser));
      localStorage.setItem("locomo-auth", "true");
      setUser(demoUser);
    }

    // Initialize dark mode preference
    const darkPref = localStorage.getItem("locomo-dark");
    if (darkPref === "true") {
      document.documentElement.classList.add("dark");
    }

    setAuthChecked(true);
  }, []);

  // (Removed login redirect — demo user is auto-created on mount)

  // Logout function
  const handleLogout = useCallback(() => {
    localStorage.removeItem("locomo-auth");
    localStorage.removeItem("locomo-user");
    setUser(null);
    router.replace("/login");
  }, [router]);

  // Default fallback data so dashboard always shows content
  const FALLBACK_DATA: Record<string, unknown> = {
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
    ],
    todayExercises: [
      { id: "ex-1", name: "Flexion avant epaule", sets: 3, reps: 12, bodyPart: "epaule" },
      { id: "ex-2", name: "Rotation externe epaule", sets: 3, reps: 15, bodyPart: "epaule" },
      { id: "ex-3", name: "Mobilisation hanche", sets: 3, reps: 12, bodyPart: "hanche" },
    ],
    dayType: "Epaule et Hanche",
  };

  // Load dashboard data
  useEffect(() => {
    if (!user || !splashDoneRef.current) return;
    async function loadDashboard() {
      setDashboardLoading(true);
      try {
        const res = await fetch("/api/sessions?scope=dashboard");
        if (res.ok) {
          const json = await res.json();
          setDashboardData(json);
        } else {
          setDashboardData(FALLBACK_DATA);
        }
      } catch {
        setDashboardData(FALLBACK_DATA);
      }
      setDashboardLoading(false);
    }
    void loadDashboard();
  }, [activeTab, isLive, user]);

  // Refresh dashboard when session ends
  useEffect(() => {
    if (!user || !splashDoneRef.current) return;
    if (!isLive && activeTab === "dashboard") {
      async function loadDashboard() {
        try {
          const res = await fetch("/api/sessions?scope=dashboard");
          if (res.ok) {
            setDashboardData(await res.json());
          }
        } catch {
          /* silent */
        }
      }
      void loadDashboard();
    }
  }, [isLive, activeTab, user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleStartSession = (_exerciseId?: string) => {
    setActiveTab("session");
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeTab === "dashboard") {
      return (
        <Dashboard
          dashboardData={dashboardData}
          onStartSession={handleStartSession}
          loading={dashboardLoading}
          userName={user.name}
        />
      );
    }
    if (activeTab === "planning") {
      return <Planning onStartSession={handleStartSession} />;
    }
    if (activeTab === "session") {
      return <SessionLive isLive={isLive} onToggleLive={() => {}} />;
    }
    if (activeTab === "progression") {
      return <Progression />;
    }
    if (activeTab === "rapports") {
      return <Rapports />;
    }
    if (activeTab === "profil") {
      return <Profil />;
    }
    if (activeTab === "parametres") {
      return <Parametres />;
    }
    if (activeTab === "apropos") {
      return <Apropos />;
    }
    return null;
  };

  // ─── Render flow ───

  // Step 1: Still checking auth — show simple spinner
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F5F2]">
        <div className="w-8 h-8 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Step 2: Not authenticated — should not happen (auto-login), but guard anyway
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F5F2]">
        <div className="w-8 h-8 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Step 3: Authenticated but splash not done yet — show splash
  if (!splashDone) {
    return <SplashScreen onComplete={() => { splashDoneRef.current = true; setSplashDone(true); }} />;
  }

  // Step 4: Authenticated and splash done — show the app
  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-40 md:hidden">
            <Sidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              userName={user.name}
              userEmail={user.email}
              userRole={user.role}
              onLogout={handleLogout}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Locomo-assist"
                className="w-7 h-7 rounded-lg object-contain"
              />
              <span className="font-bold text-primary-dark text-sm">Locomo-assist</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8">{renderContent()}</div>
      </main>

      {/* Global Chatbot */}
      <Chatbot />
    </div>
  );
}
