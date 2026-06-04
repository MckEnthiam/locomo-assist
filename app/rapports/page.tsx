'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportDTO } from '@/types';

export default function RapportsPage() {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rapports');
      if (!res.ok) throw new Error('Impossible de charger les rapports');
      const data = (await res.json()) as ReportDTO[];
      setReports(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function generateNow() {
    setGenerating(true);
    try {
      const res = await fetch('/api/rapports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Échec génération');
      }
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell title="Rapports" subtitle="PDF hebdomadaires pour votre médecin">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Rapports générés automatiquement en fin de session.
        </p>
        <Button onClick={() => void generateNow()} disabled={generating}>
          {generating ? 'Génération…' : 'Générer rapport maintenant'}
        </Button>
      </div>

      {loading && <p className="text-sm text-text-tertiary">Chargement…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!loading && reports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-text-tertiary">
            Aucun rapport disponible. Terminez une session ou générez un rapport manuellement.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <div>
                <CardTitle className="text-sm">Semaine {r.weekNumber}</CardTitle>
                <p className="text-xs text-text-secondary">
                  {new Date(r.generatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer">
                  Télécharger
                </a>
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
