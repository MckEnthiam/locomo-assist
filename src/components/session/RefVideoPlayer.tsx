import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { ExerciseDTO } from '@/types';
import { getResourcePath } from '@/lib/ipc';
import styles from './RefVideoPlayer.module.css';

interface RefVideoPlayerProps {
  exercise: ExerciseDTO;
}

export function RefVideoPlayer({ exercise }: RefVideoPlayerProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!exercise.refVideoPath) {
        setSrc(null);
        return;
      }
      try {
        const path = await getResourcePath(exercise.refVideoPath);
        if (!cancelled) setSrc(`file://${path.replace(/\\/g, '/')}`);
      } catch {
        if (!cancelled) setSrc(null);
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [exercise.refVideoPath]);

  if (!src) {
    return (
      <div className={styles.placeholder}>
        <Dumbbell className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
        <span className="mt-2 text-center text-[11px] text-text-secondary">{exercise.name}</span>
      </div>
    );
  }

  return <video className={styles.video} src={src} loop muted autoPlay playsInline />;
}
