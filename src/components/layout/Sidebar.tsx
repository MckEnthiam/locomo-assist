import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/brand';
import {
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/planning', label: 'Planning', icon: Calendar },
  { to: '/progression', label: 'Progression', icon: TrendingUp },
  { to: '/rapports', label: 'Rapports', icon: FileText },
  { to: '/medecin', label: 'Médecin', icon: Stethoscope },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-[0.5px] border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-[0.5px] border-border px-4 py-4">
        <img src="./logo.png" alt={APP_NAME} className="h-7 w-7 shrink-0 object-contain" />
        <span className="text-sm font-medium text-primary-dark">{APP_NAME}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-inline px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-l-2 border-primary bg-primary-light pl-[10px] font-medium text-primary-dark'
                  : 'text-text-secondary hover:text-text-primary',
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
