'use client';

import { Dumbbell } from 'lucide-react';
import styles from './RefVideoPlayer.module.css';

interface RefVideoPlayerProps {
  videoUrl: string | null;
  exerciseName: string;
}

export function RefVideoPlayer({ videoUrl, exerciseName }: RefVideoPlayerProps) {
  if (!videoUrl) {
    return (
      <div className={styles.placeholder}>
        <Dumbbell className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
        <span className="mt-2 text-center text-[11px] text-text-secondary">{exerciseName}</span>
      </div>
    );
  }

  return (
    <video
      className={styles.video}
      src={videoUrl}
      loop
      muted
      autoPlay
      playsInline
    />
  );
}
