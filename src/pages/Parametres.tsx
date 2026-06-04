import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getParametres, getSyncStatus, pushSync, saveParametres } from '@/lib/ipc';
import { speak } from '@/lib/tts';
import type { ParametresDTO } from '@/types';

export default function Parametres() {
  const [params, setParams] = useState<ParametresDTO | null>(null);
  const [syncLabel, setSyncLabel] = useState('Jamais synchronisé');
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const persist = useCallback(async (patch: Partial<ParametresDTO>) => {
    if (!params) return;
    const next = { ...params, ...patch };
    setParams(next);
    try {
      await saveParametres(next as unknown as Record<string, unknown>);
    } catch {
      /* */
    }
  }, [params]);

  useEffect(() => {
    getParametres()
      .then((p) => {
        if (p) setParams(p);
      })
      .catch(() => undefined);
    getSyncStatus()
      .then((s) => {
        setSyncLabel(
          s.lastSyncAt
            ? `Dernière sync : ${new Date(s.lastSyncAt).toLocaleString('fr-FR')}`
            : 'Jamais synchronisé',
        );
      })
      .catch(() => undefined);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  async function syncNow() {
    if (!online) return;
    setSyncing(true);
    try {
      const result = await pushSync();
      setSyncLabel(
        result.lastSyncAt
          ? `Dernière sync : ${new Date(result.lastSyncAt).toLocaleString('fr-FR')}`
          : 'Synchronisation terminée',
      );
    } finally {
      setSyncing(false);
    }
  }

  if (!params) {
    return (
      <AppShell title="Paramètres">
        <p className="text-sm text-text-tertiary">Chargement…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Paramètres" subtitle="Configuration locale">
      <div className="grid max-w-2xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-sm">
              Nom du patient
              <input
                className="mt-1 w-full rounded-inline border border-[0.5px] border-border px-3 py-2"
                value={params.nomPatient ?? ''}
                onChange={(e) => void persist({ nomPatient: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Zone de rééducation
              <select
                className="mt-1 w-full rounded-inline border border-[0.5px] border-border px-3 py-2"
                value={params.zoneReeducation}
                onChange={(e) => void persist({ zoneReeducation: e.target.value })}
              >
                {['epaule', 'coude', 'hanche', 'genou', 'colonne'].map((z) => (
                  <option key={z} value={z}>
                    {z.charAt(0).toUpperCase() + z.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coach vocal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.coachVocalEnabled}
                onChange={(e) => void persist({ coachVocalEnabled: e.target.checked })}
              />
              Activer le coach vocal
            </label>
            <label className="block text-sm">
              Vitesse ({params.vitesseTts.toFixed(1)}×)
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                className="mt-1 w-full"
                value={params.vitesseTts}
                onChange={(e) => void persist({ vitesseTts: parseFloat(e.target.value) })}
              />
            </label>
            <label className="block text-sm">
              Langue
              <select
                className="mt-1 w-full rounded-inline border border-[0.5px] border-border px-3 py-2"
                value={params.langue}
                onChange={(e) => {
                  const lang = e.target.value;
                  void persist({
                    langue: lang,
                    voixCoach: lang === 'en' ? 'en-US' : 'fr-FR',
                  });
                }}
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
              onClick={() => speak('Bonjour, je suis votre coach de rééducation.', params.voixCoach, params.vitesseTts)}
            >
              Tester la voix
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-sm" title="Au-delà de ce seuil, une compensation est signalée">
              Seuil compensation ({params.seuilCompensation}°)
              <input
                type="range"
                min={5}
                max={30}
                className="mt-1 w-full"
                value={params.seuilCompensation}
                onChange={(e) => void persist({ seuilCompensation: parseInt(e.target.value, 10) })}
              />
            </label>
            <label className="block text-sm">
              Fréquence messages coach ({params.frequenceCoach}s)
              <input
                type="range"
                min={5}
                max={60}
                className="mt-1 w-full"
                value={params.frequenceCoach}
                onChange={(e) => void persist({ frequenceCoach: parseInt(e.target.value, 10) })}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Synchronisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.autoSync}
                onChange={(e) => void persist({ autoSync: e.target.checked })}
              />
              Sync automatique quand en ligne
            </label>
            <p className="text-sm text-text-secondary">{syncLabel}</p>
            {!online && (
              <p className="text-sm text-warn">Hors ligne — sync indisponible</p>
            )}
            <button
              type="button"
              disabled={!online || syncing}
              className="rounded-inline bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void syncNow()}
            >
              {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
            </button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
