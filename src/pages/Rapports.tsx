import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generatePdf, getRapports, openPdf } from '@/lib/ipc';
import type { ReportDTO } from '@/types';

export default function Rapports() {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await getRapports());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateNow() {
    setGenerating(true);
    try {
      const result = await generatePdf();
      if (!result.success) throw new Error(result.error ?? 'Échec génération');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell title="Rapports" subtitle="PDF pour votre médecin">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => void generateNow()} disabled={generating}>
          {generating ? 'Génération…' : 'Générer rapport maintenant'}
        </Button>
      </div>
      {loading && <p className="text-sm text-text-tertiary">Chargement…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && reports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-text-tertiary">
            Aucun rapport. Terminez une session pour en générer un.
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
              <Button variant="outline" size="sm" onClick={() => void openPdf(r.pdfPath)}>
                Ouvrir le PDF
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
