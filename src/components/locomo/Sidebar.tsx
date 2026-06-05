import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  FileText,
  Activity,
  Settings,
} from "lucide-react";

const links = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "planning", label: "Planning", icon: CalendarDays },
  { key: "session", label: "Session live", icon: Activity },
  { key: "progression", label: "Progression", icon: TrendingUp },
  { key: "rapports", label: "Rapports", icon: FileText },
  { key: "parametres", label: "Paramètres", icon: Settings },
];

// Preview image mapping is hardcoded inline below to avoid dynamic variable lookup


interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
}: SidebarProps) {
  const [previewKey, setPreviewKey] = useState<string | undefined>(undefined);
  const currentPreview = previewKey ?? activeTab;
  let previewImage = "";
  if (currentPreview === "dashboard") {
    previewImage = "dashboard.png";
  } else if (currentPreview === "planning") {
    previewImage = "planning.png";
  } else if (currentPreview === "session") {
    previewImage = "session.png";
  } else if (currentPreview === "progression") {
    previewImage = "progression.png";
  } else if (currentPreview === "rapports") {
    previewImage = "rapports.png";
  } else if (currentPreview === "parametres") {
    previewImage = "parametres.png";
  } else {
    previewImage = `${currentPreview}.png`;
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
            <h1 className="text-2xl font-bold text-slate-900">locomo assist</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                onTabChange(key);
                setPreviewKey(undefined);
              }}
              onMouseEnter={() => setPreviewKey(key)}
              onMouseLeave={() => setPreviewKey(undefined)}
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm transition-all duration-200",
                active
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Image preview area for hovered/selected section */}
      <div className="px-3 py-4">
        <div className="w-full h-40 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
          <img
            src={`/memphis-assets/${previewImage}`}
            alt={currentPreview}
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              if (t && t.src.indexOf("/logo.png") === -1) t.src = "/logo.png";
            }}
          />
        </div>
      </div>
    </aside>
  );
}
