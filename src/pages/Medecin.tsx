import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMedecin, getRapports, openPdf, saveMedecin } from '@/lib/ipc';
import type { MedecinDTO, ReportDTO } from '@/types';
import { Stethoscope } from 'lucide-react';

const schema = z.object({
  nom: z.string().optional(),
  prenom: z.string().optional(),
  specialite: z.string().optional(),
  hopital: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Medecin() {
  const [saved, setSaved] = useState<MedecinDTO | null>(null);
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    Promise.all([getMedecin(), getRapports()])
      .then(([med, r]) => {
        if (med) {
          setSaved(med);
          reset({
            nom: med.nom ?? '',
            prenom: med.prenom ?? '',
            specialite: med.specialite ?? '',
            hopital: med.hopital ?? '',
            email: med.email ?? '',
            telephone: med.telephone ?? '',
          });
        }
        setReports(r);
        if (r[0]) setSelectedReport(r[0].id);
      })
      .catch(() => setMessage('Impossible de charger les données'));
  }, [reset]);

  async function onSubmit(values: FormValues) {
    try {
      await saveMedecin(values);
      setSaved({
        id: 'singleton',
        nom: values.nom ?? null,
        prenom: values.prenom ?? null,
        email: values.email || null,
        telephone: values.telephone ?? null,
        specialite: values.specialite ?? null,
        hopital: values.hopital ?? null,
      });
      setMessage('Informations enregistrées.');
    } catch {
      setMessage('Erreur lors de l’enregistrement.');
    }
  }

  function sendEmail() {
    const report = reports.find((r) => r.id === selectedReport);
    if (!report || !saved?.email) {
      setMessage('Sélectionnez un rapport et renseignez l’email du médecin.');
      return;
    }
    const subject = encodeURIComponent(`Rapport locomo assist — semaine ${report.weekNumber}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver mon rapport de rééducation (semaine ${report.weekNumber}).\n\nLe fichier PDF est disponible sur mon ordinateur :\n${report.pdfPath}\n\nCordialement.`,
    );
    window.open(`mailto:${saved.email}?subject=${subject}&body=${body}`, '_blank');
    setMessage(
      'Client mail ouvert. Joignez le PDF manuellement depuis le chemin indiqué dans le message.',
    );
  }

  return (
    <AppShell title="Médecin référent" subtitle="Pour vos rapports PDF">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <input
                className="w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                placeholder="Nom"
                {...register('nom')}
              />
              <input
                className="w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                placeholder="Prénom"
                {...register('prenom')}
              />
              <input
                className="w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                placeholder="Spécialité"
                {...register('specialite')}
              />
              <input
                className="w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                placeholder="Hôpital / Clinique"
                {...register('hopital')}
              />
              <input
                className="w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                placeholder="Email"
                {...register('email')}
              />
              {formState.errors.email && (
                <p className="text-xs text-danger">{formState.errors.email.message}</p>
              )}
              <input
                className="w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                placeholder="Téléphone"
                {...register('telephone')}
              />
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {saved ? (
              <>
                <p>
                  Dr {saved.prenom} {saved.nom}
                </p>
                <p className="text-text-secondary">{saved.specialite}</p>
                <p className="text-text-secondary">{saved.hopital}</p>
                <p className="text-text-secondary">{saved.email}</p>
              </>
            ) : (
              <p className="text-text-tertiary">Aucune information enregistrée.</p>
            )}

            <div className="border-t border-[0.5px] border-border pt-4">
              <p className="mb-2 font-medium">Envoyer un rapport</p>
              <select
                className="mb-2 w-full rounded-inline border border-[0.5px] border-border px-3 py-2 text-sm"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    Semaine {r.weekNumber} — {new Date(r.generatedAt).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={sendEmail}>
                  Envoyer par email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const r = reports.find((x) => x.id === selectedReport);
                    if (r) void openPdf(r.pdfPath);
                  }}
                >
                  Ouvrir PDF
                </Button>
              </div>
              <p className="mt-2 text-xs text-text-tertiary">
                Le rapport sera inclus dans l’email à votre prochain rendez-vous. Les pièces jointes
                mailto dépendent de votre client mail.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {message && <p className="mt-4 text-sm text-text-secondary">{message}</p>}
    </AppShell>
  );
}
