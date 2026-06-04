'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CameraFeed.module.css';
import { formatTimer } from '@/lib/utils';

interface CameraFeedProps {
  timerSeconds: number;
  onStreamReady?: (video: HTMLVideoElement) => void;
}

export function CameraFeed({ timerSeconds, onStreamReady }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 },
          audio: false,
        });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          onStreamReady?.(video);
        }
        setError(null);
      } catch (e) {
        const msg =
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Accès caméra refusé. Autorisez la webcam dans les paramètres du navigateur.'
            : 'Impossible d’accéder à la webcam. Vérifiez qu’une caméra est connectée.';
        setError(msg);
      }
    }

    void startCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onStreamReady]);

  if (error) {
    return (
      <div className={styles.pipError}>
        <p className="text-[10px] leading-snug text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.pip}>
      <video ref={videoRef} className={styles.video} playsInline muted />
      <span className={styles.timer}>{formatTimer(timerSeconds)}</span>
    </div>
  );
}
