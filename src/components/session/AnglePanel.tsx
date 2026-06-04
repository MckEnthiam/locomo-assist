'use client';

import { isAngleInTarget } from '@/lib/angles';
import type { AngleData, TargetAngles } from '@/types';
import styles from './AnglePanel.module.css';

const LABELS: { key: keyof AngleData; label: string; targetKey: string }[] = [
  { key: 'shoulderLeft', label: 'Épaule G.', targetKey: 'shoulderLeft' },
  { key: 'shoulderRight', label: 'Épaule D.', targetKey: 'shoulderRight' },
  { key: 'elbowLeft', label: 'Coude G.', targetKey: 'elbowLeft' },
  { key: 'spine', label: 'Colonne', targetKey: 'spine' },
  { key: 'hip', label: 'Hanche', targetKey: 'hip' },
];

interface AnglePanelProps {
  angles: AngleData;
  targets: TargetAngles;
}

export function AnglePanel({ angles, targets }: AnglePanelProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Angles articulaires</h3>
      <ul className={styles.list}>
        {LABELS.map(({ key, label, targetKey }) => {
          const value = angles[key];
          const target = targets[targetKey];
          const ok = isAngleInTarget(value, target, 10);
          const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
          return (
            <li key={key} className={styles.row}>
              <span className={styles.label}>{label}</span>
              <div className={styles.barTrack}>
                <div
                  className={ok ? styles.barOk : styles.barWarn}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className={ok ? styles.degOk : styles.degWarn}>{value}°</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
