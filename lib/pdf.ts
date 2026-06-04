'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_FOOTER_REPORT } from '@/lib/brand';

export interface ClientPdfRow {
  name: string;
  avgAmplitude: number;
  peakAmplitude: number;
  reps: number;
  compensations: string;
  status: string;
}

export function generateClientSummaryPdf(
  title: string,
  rows: ClientPdfRow[],
  chartBase64?: string,
): Blob {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [['Exercice', 'Amp. moy.', 'Amp. max', 'Reps', 'Compensations', 'Statut']],
    body: rows.map((r) => [
      r.name,
      String(r.avgAmplitude),
      String(r.peakAmplitude),
      String(r.reps),
      r.compensations,
      r.status,
    ]),
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;
  if (chartBase64) {
    doc.addImage(chartBase64, 'PNG', 14, finalY + 10, 180, 60);
  }

  doc.setFontSize(8);
  doc.text(APP_FOOTER_REPORT, 14, 280);
  return doc.output('blob');
}
