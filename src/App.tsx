import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Dashboard from '@/pages/Dashboard';
import SessionLive from '@/pages/SessionLive';
import Planning from '@/pages/Planning';
import Progression from '@/pages/Progression';
import Rapports from '@/pages/Rapports';
import Medecin from '@/pages/Medecin';
import Parametres from '@/pages/Parametres';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session/:exerciseId" element={<SessionLive />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/progression" element={<Progression />} />
        <Route path="/rapports" element={<Rapports />} />
        <Route path="/medecin" element={<Medecin />} />
        <Route path="/parametres" element={<Parametres />} />
      </Routes>
    </ErrorBoundary>
  );
}
