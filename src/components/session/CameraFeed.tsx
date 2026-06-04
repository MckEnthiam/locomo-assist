import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './CameraFeed.module.css';
import { formatTimer } from '@/lib/utils';

export interface CameraFeedHandle {
  videoElement: HTMLVideoElement | null;
}

interface CameraFeedProps {
  timerSeconds: number;
  onStreamReady?: (video: HTMLVideoElement) => void;
}

export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(
  function CameraFeed({ timerSeconds, onStreamReady }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      get videoElement() {
        return videoRef.current;
      },
    }));

    useEffect(() => {
      let stream: MediaStream | null = null;

      async function startCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
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
              ? 'Accès caméra refusé. Autorisez la webcam dans les paramètres système.'
              : 'Impossible d’accéder à la webcam.';
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
  },
);
