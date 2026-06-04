'use client';

import type { CoachMessage } from '@/types';
import styles from './CoachPanel.module.css';

interface CoachPanelProps {
  messages: CoachMessage[];
}

export function CoachPanel({ messages }: CoachPanelProps) {
  const visible = messages.slice(-5).reverse();

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Coach IA</h3>
      {visible.length === 0 ? (
        <p className={styles.empty}>Le coach vous guidera pendant l’exercice.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((msg) => (
            <li key={msg.id} className={styles.item}>
              <span className={styles.dot} aria-hidden />
              <p
                className={
                  msg.type === 'warn' ? styles.textWarn : styles.textOk
                }
              >
                {msg.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
