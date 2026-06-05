"use client";

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
  Shield,
  MessageCircle,
} from "lucide-react";

const links = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "planning", label: "Planning", icon: CalendarDays },
  { key: "session", label: "Session live", icon: Activity },
  { key: "progression", label: "Progression", icon: TrendingUp },
  { key: "rapports", label: "Rapports", icon: FileText },
  { key: "chatbot", label: "Assistant IA", icon: MessageCircle },
];

const secondaryLinks = [
  { key: "profil", label: "Profil", icon: User },
  { key: "parametres", label: "Param\u00e8tres", icon: Settings },
  { key: "apropos", label: "\u00c0 propos", icon: Info },
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
  userName = "Patient D\u00e9mo",
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
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img
          src="/logo.png"
          alt="Locomo-assist"
          className="w-10 h-10 rounded-lg object-contain shadow-md"
        />
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">
            Locomo-assist
          </h1>
          <p className="text-[10px] text-white/50 tracking-wide uppercase">
            R&#233;&#233;ducation IA
          </p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">
              {userEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Main */}
      <nav className="flex-1 flex flex-col gap-1 p-3 mt-2">
        <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1">
          Navigation
        </p>
        {links.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 w-full text-left",
                active
                  ? "bg-primary text-white shadow-lg shadow-primary/30 font-medium"
                  : "text-sidebar-foreground/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon
                className="w-4.5 h-4.5"
                strokeWidth={active ? 2.2 : 1.5}
              />
              {label}
              {key === "session" && (
                <span
                  className={cn(
                    "ml-auto w-2 h-2 rounded-full",
                    active
                      ? "bg-white animate-pulse"
                      : "bg-primary animate-pulse"
                  )}
                />
              )}
              {key === "chatbot" && (
                <span
                  className={cn(
                    "ml-auto w-2 h-2 rounded-full",
                    active
                      ? "bg-white"
                      : "bg-green-400 animate-pulse"
                  )}
                />
              )}
            </button>
          );
        })}

        {/* Secondary */}
        <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mt-5 mb-1">
          Compte
        </p>
        {secondaryLinks.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 w-full text-left",
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-sidebar-foreground/50 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2 : 1.5} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-left text-sidebar-foreground/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <Moon className="w-4 h-4" />
          <span>Mode sombre</span>
        </button>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-left text-red-300 hover:text-white hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Deconnexion</span>
          </button>
        )}

        {/* Hackathon Badge */}
        <div className="rounded-lg bg-white/10 backdrop-blur-sm p-3 text-center mt-2">
          <p className="text-[10px] font-semibold text-primary tracking-wider uppercase">
            TCCHackDefend 2026
          </p>
          <p className="text-[9px] text-sidebar-foreground/40 mt-1">
            Hackathon Project
          </p>
        </div>
      </div>
    </aside>
  );
}
