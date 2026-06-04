'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/brand';
import { Calendar, FileText, LayoutDashboard, TrendingUp } from 'lucide-react';

const links = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/planning', label: 'Planning', icon: Calendar },
  { href: '/progression', label: 'Progression', icon: TrendingUp },
  { href: '/rapports', label: 'Rapports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-[0.5px] border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-[0.5px] border-border px-4 py-4">
        <Image
          src="/logo.png"
          alt={APP_NAME}
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
          priority
        />
        <span className="text-sm font-medium text-primary-dark">{APP_NAME}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-inline px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-l-2 border-primary bg-primary-light pl-[10px] font-medium text-primary-dark'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
