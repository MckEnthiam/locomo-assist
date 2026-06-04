'use client';

import { useEffect, useRef } from 'react';
import { POSE_CONNECTIONS } from '@/lib/mediapipe';
import type { Results } from '@mediapipe/pose';
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

    landmarks.forEach((lm) => {
      ctx.fillStyle = '#085041';
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [results, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={styles.canvas}
      aria-hidden
    />
  );
}
