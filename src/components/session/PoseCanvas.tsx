import { useEffect, useRef } from 'react';
import { POSE_CONNECTIONS, type Results } from '@/lib/mediapipe';
import styles from './PoseCanvas.module.css';

interface PoseCanvasProps {
  results: Results | null;
  width: number;
  height: number;
}

export function PoseCanvas({ results, width, height }: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (!results?.poseLandmarks) return;

    const landmarks = results.poseLandmarks;
    ctx.strokeStyle = '#1D9E75';
    ctx.lineWidth = 2;

    POSE_CONNECTIONS.forEach(([start, end]) => {
      const a = landmarks[start];
      const b = landmarks[end];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    });
  }, [results, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className={styles.canvas} aria-hidden />;
}
