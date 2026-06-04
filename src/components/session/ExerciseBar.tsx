'use client';

import type { ExerciseDTO } from '@/types';
import styles from './ExerciseBar.module.css';

export type StepStatus = 'done' | 'active' | 'idle';

interface ExerciseBarProps {
  steps: { exercise: ExerciseDTO; status: StepStatus }[];
}

export function ExerciseBar({ steps }: ExerciseBarProps) {
  return (
    <div className={styles.bar}>
      {steps.map((step, i) => (
        <div key={step.exercise.id} className={styles.step}>
          <span
            className={
              step.status === 'done'
                ? styles.circleDone
                : step.status === 'active'
                  ? styles.circleActive
                  : styles.circleIdle
            }
          >
            {i + 1}
          </span>
          <span
            className={
              step.status === 'active' ? styles.nameActive : styles.name
            }
          >
            {step.exercise.name}
          </span>
        </div>
      ))}
    </div>
  );
}
