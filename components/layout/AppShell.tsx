import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
