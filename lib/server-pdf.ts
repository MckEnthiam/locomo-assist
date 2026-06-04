import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { APP_FOOTER_REPORT, APP_NAME } from '@/lib/brand';

export interface PdfExerciseRow {
  name: string;
  avgAmplitude: number;
  peakAmplitude: number;
  reps: number;
  compensations: string;
  status: string;
}

export interface PdfGenerationInput {
  weekNumber: number;
  formScore: number;
  totalDurationSeconds: number;
  completedCount: number;
  totalCount: number;
  exercises: PdfExerciseRow[];
  coachWarnings: string[];
  chartPngBase64?: string;
}

function decodeBase64Png(base64: string): Buffer {
  const data = base64.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(data, 'base64');
}

export async function generateServerPdf(input: PdfGenerationInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      let headerY = 50;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, headerY, { width: 36, height: 36 });
        doc.fontSize(18).fillColor('#1D9E75').text(APP_NAME, 94, headerY + 8);
      } else {
        doc.fontSize(18).fillColor('#1D9E75').text(APP_NAME, 50, headerY);
      }
      doc.fontSize(10).fillColor('#1A1A1A');
      doc.text(
        `Semaine ${input.weekNumber} — ${new Date().toLocaleDateString('fr-FR')}`,
        50,
        headerY + 4,
        { align: 'right', width: doc.page.width - 100 },
      );
      doc.moveDown(2);

      doc.fontSize(12).text('Résumé exécutif', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Score global : ${input.formScore}%`);
      doc.text(`Durée totale : ${Math.floor(input.totalDurationSeconds / 60)} min`);
      doc.text(`Exercices : ${input.completedCount}/${input.totalCount}`);
      doc.moveDown();

      doc.fontSize(12).text('Détail par exercice', { underline: true });
      doc.moveDown(0.5);
      const colWidths = [120, 70, 70, 40, 90, 60];
      const headers = ['Exercice', 'Amp. moy.', 'Amp. max', 'Reps', 'Compensations', 'Statut'];
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      let x = 50;
      headers.forEach((h, i) => {
        doc.text(h, x, y, { width: colWidths[i], continued: false });
        x += colWidths[i];
      });
      y += 16;
      doc.font('Helvetica');
      input.exercises.forEach((row) => {
        x = 50;
        const cells = [
          row.name,
          String(row.avgAmplitude),
          String(row.peakAmplitude),
          String(row.reps),
          row.compensations,
          row.status,
        ];
        cells.forEach((cell, i) => {
          doc.text(cell, x, y, { width: colWidths[i], continued: false });
          x += colWidths[i];
        });
        y += 14;
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      if (input.chartPngBase64) {
        doc.addPage();
        doc.fontSize(12).text('Progression amplitude', { underline: true });
        doc.moveDown();
        try {
          const img = decodeBase64Png(input.chartPngBase64);
          doc.image(img, 50, doc.y, { width: 500 });
        } catch {
          doc.fontSize(10).text('Graphique non disponible');
        }
      }

      if (input.coachWarnings.length > 0) {
        doc.addPage();
        doc.fontSize(12).text('Messages du coach (avertissements)', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        input.coachWarnings.forEach((w) => {
          doc.text(`• ${w}`);
        });
      }

      doc.fontSize(8).fillColor('#6B7280');
      doc.text(
        APP_FOOTER_REPORT,
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 },
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
