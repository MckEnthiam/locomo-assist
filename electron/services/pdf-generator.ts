import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { APP_FOOTER_REPORT, APP_NAME } from '../../src/lib/brand';
import type { CoachMessage } from '../../src/types';
import { parseJson } from './db-helpers';

export interface PdfSessionData {
  weekNumber: number;
  formScore: number;
  totalDurationSeconds: number;
  patientName: string;
  medecinLabel: string;
  exercises: {
    name: string;
    avgAmplitude: number;
    peakAmplitude: number;
    reps: number;
    compensations: string;
    status: string;
  }[];
  coachWarnings: string[];
  logoPath?: string;
}

export async function generatePdfToPath(
  outputPath: string,
  input: PdfSessionData,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let headerY = 50;
    if (input.logoPath && fs.existsSync(input.logoPath)) {
      doc.image(input.logoPath, 50, headerY, { width: 36, height: 36 });
      doc.fontSize(18).fillColor('#1D9E75').text(APP_NAME, 94, headerY + 8);
    } else {
      doc.fontSize(18).fillColor('#1D9E75').text(APP_NAME, 50, headerY);
    }

    doc.fontSize(10).fillColor('#1A1A1A');
    doc.text('Rapport de rééducation', 50, headerY + 28);
    doc.text(
      `Semaine ${input.weekNumber} — ${new Date().toLocaleDateString('fr-FR')}`,
      50,
      headerY + 42,
      { align: 'right', width: doc.page.width - 100 },
    );
    doc.moveDown(2);

    doc.fontSize(11).text(`Patient : ${input.patientName}`);
    doc.text(`Médecin référent : ${input.medecinLabel}`);
    doc.moveDown();

    doc.fontSize(12).text('Résumé session', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Score global : ${input.formScore}%`);
    doc.text(`Durée : ${Math.floor(input.totalDurationSeconds / 60)} min`);
    doc.text(`Exercices : ${input.exercises.filter((e) => e.status === 'done').length}/${input.exercises.length}`);
    doc.moveDown();

    doc.fontSize(12).text('Détail par exercice', { underline: true });
    doc.moveDown(0.5);
    const colWidths = [120, 70, 70, 40, 90, 60];
    const headers = ['Exercice', 'Amp. moy.', 'Amp. max', 'Reps', 'Compensations', 'Statut'];
    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    let x = 50;
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });
    y += 16;
    doc.font('Helvetica');
    input.exercises.forEach((row) => {
      x = 50;
      [row.name, String(row.avgAmplitude), String(row.peakAmplitude), String(row.reps), row.compensations, row.status].forEach(
        (cell, i) => {
          doc.text(cell, x, y, { width: colWidths[i] });
          x += colWidths[i];
        },
      );
      y += 14;
    });

    if (input.coachWarnings.length > 0) {
      doc.addPage();
      doc.fontSize(12).text('Messages du coach (avertissements)', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      input.coachWarnings.forEach((w) => doc.text(`• ${w}`));
    }

    doc.fontSize(8).fillColor('#6B7280');
    doc.text(APP_FOOTER_REPORT, 50, doc.page.height - 60, {
      align: 'center',
      width: doc.page.width - 100,
    });
    doc.text(outputPath, 50, doc.page.height - 45, {
      align: 'center',
      width: doc.page.width - 100,
    });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

export function extractCoachWarnings(
  coachMessagesRaw: string | null,
  exerciseName: string,
): string[] {
  const messages = parseJson<CoachMessage[]>(coachMessagesRaw, []);
  return messages
    .filter((m) => m.type === 'warn')
    .map((m) => `${exerciseName}: ${m.text}`);
}
