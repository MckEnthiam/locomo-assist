'use client';

import type { SessionExerciseDTO } from '@/types';
import { formatDuration } from '@/lib/utils';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  items: SessionExerciseDTO[];
}

function statusColor(status: string): string {
  if (status === 'done') return 'var(--color-primary)';
  if (status === 'active') return 'var(--color-primary-dark)';
  if (status === 'skipped') return 'var(--color-text-tertiary)';
  return 'var(--color-border)';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    done: 'Terminé',
    active: 'En cours',
    pending: 'À faire',
    skipped: 'Ignoré',
  };
  return map[status] ?? status;
}

export function SessionHistory({ items }: SessionHistoryProps) {
  return (
    <section>
      <h3 className={styles.title}>Historique session</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.row}>
            <span
              className={styles.square}
              style={{ background: statusColor(item.status) }}
              aria-hidden
            />
            <div className={styles.meta}>
              <span className={styles.name}>{item.exercise.name}</span>
              <span className={styles.status}>{statusLabel(item.status)}</span>
            </div>
            {item.durationSeconds != null && item.status === 'done' && (
              <span className={styles.duration}>{formatDuration(item.durationSeconds)}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
