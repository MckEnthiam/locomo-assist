'use client';

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';
import type { SignalPoint } from '@/types';
import { CameraFeed } from './CameraFeed';
import styles from './SignalGraph.module.css';

interface SignalGraphProps {
  signalHistory: SignalPoint[];
  lumbarAlert: boolean;
  timerSeconds: number;
  onStreamReady?: (video: HTMLVideoElement) => void;
}

export function SignalGraph({
  signalHistory,
  lumbarAlert,
  timerSeconds,
  onStreamReady,
}: SignalGraphProps) {
  const data = useMemo(() => {
    const now = Date.now();
    const windowMs = 10000;
    return signalHistory
      .filter((p) => now - p.timestamp <= windowMs)
      .map((p) => ({
        t: ((p.timestamp - (now - windowMs)) / 1000).toFixed(1),
        shoulder: p.shoulderLeft,
        spine: p.spine,
      }));
  }, [signalHistory]);

  return (
    <div className={styles.wrap}>
      {lumbarAlert && (
        <p className={styles.alert}>Compensation lombaire détectée</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
          <YAxis domain={[-1000, 1000]} tick={{ fontSize: 10 }} stroke="#9CA3AF" />
          <ReferenceLine y={0} stroke="rgba(0,0,0,0.12)" />
          <Line
            type="monotone"
            dataKey="shoulder"
            stroke="#1D9E75"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="spine"
            stroke="#EF9F27"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <CameraFeed timerSeconds={timerSeconds} onStreamReady={onStreamReady} />
    </div>
  );
}
