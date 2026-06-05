import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Activity,
  TrendingUp,
  FileText,
  User,
  Settings,
  Info,
  Moon,
  LogOut,
  MessageCircle,
} from "lucide-react";

const links = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "planning", label: "Planning", icon: CalendarDays },
  { key: "session", label: "Session live", icon: Activity },
  { key: "progression", label: "Progression", icon: TrendingUp },
  { key: "rapports", label: "Rapports", icon: FileText },
  { key: "chatbot", label: "Assistant IA", icon: MessageCircle },
];

const secondaryLinks = [
  { key: "profil", label: "Profil", icon: User },
  { key: "parametres", label: "Paramètres", icon: Settings },
  { key: "apropos", label: "À propos", icon: Info },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  userName = "Patient Démo",
  userEmail = "demo@locomo.com",
  userRole = "PATIENT",
  onLogout,
}: SidebarProps) {
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", !isDark);
    localStorage.setItem("locomo-dark", String(!isDark));
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-white border-r border-slate-200/80 shadow-sm h-screen overflow-y-auto">
      <div className="p-6 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Locomo-assist"
            className="w-11 h-11 rounded-2xl object-contain border border-slate-200/80"
          />
          <div>
            <h1 className="text-base font-semibold text-slate-900">Locomo-assist</h1>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mt-1">
              Coaching physique
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-5">{userRole === "THERAPIST" ? "Thérapeute" : "Patient"}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 px-3 mb-2">
          Navigation
        </p>
        {links.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm transition-all duration-200",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          );
        })}

        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 px-3 mt-6 mb-2">
          Compte
        </p>
        {secondaryLinks.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm transition-all duration-200",
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 pb-6 pt-4 space-y-3">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex w-full items-center gap-3 rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition"
        >
          <Moon className="w-5 h-5" />
          Mode sombre
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600 hover:bg-red-100 transition"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        )}

        <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
            TCCHackDefend 2026
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Prototype</p>
        </div>
      </div>
    </aside>
  );
}
