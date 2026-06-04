'use client';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-[0.5px] border-border bg-surface px-6 py-4">
      <div>
        <h1 className="text-base font-medium text-text-primary">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
      </div>
    </header>
  );
}
