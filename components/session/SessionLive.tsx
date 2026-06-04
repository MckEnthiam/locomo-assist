'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from '@mediapipe/camera_utils';
import type { Results } from '@mediapipe/pose';
import { computeAnglesFromLandmarks, hasAnglesOutOfTarget } from '@/lib/angles';
import { initPose } from '@/lib/mediapipe';
import { normalizeSignal, getRestAngle, getMaxAmplitude } from '@/lib/signal';
import { initTtsVoices, speakFrench } from '@/lib/tts';
import { useSessionStore } from '@/store/sessionStore';
import type { ExerciseDTO, SessionDTO } from '@/types';
import { AnglePanel } from './AnglePanel';
import { CoachPanel } from './CoachPanel';
import { ExerciseBar, type StepStatus } from './ExerciseBar';
import { RefVideoPlayer } from './RefVideoPlayer';
import { SessionHistory } from './SessionHistory';
import { SignalGraph } from './SignalGraph';
import styles from './SessionLive.module.css';

interface SessionLiveProps {
  session: SessionDTO;
  initialExercise: ExerciseDTO;
  allExercises: ExerciseDTO[];
}

export function SessionLive({ session, initialExercise, allExercises }: SessionLiveProps) {
  const router = useRouter();
  const poseRef = useRef<ReturnType<typeof initPose> | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastCoachCall = useRef(0);
  const exerciseStartRef = useRef(Date.now());
  const amplitudeSamples = useRef<number[]>([]);
  const peakAmplitude = useRef(0);

  const {
    angles,
    signalHistory,
    compensations,
    coachMessages,
    sessionTimer,
    lumbarAlertActive,
    currentExercise,
    exerciseQueue,
    startSession,
    updateAngles,
    appendSignal,
    addCompensation,
    addCoachMessage,
    setLumbarAlert,
    setLumbarOverTargetSince,
    tickTimer,
    nextExercise,
    endSession,
  } = useSessionStore();

  const [sessionExercises, setSessionExercises] = useState(session.exercises);
  const [poseResults, setPoseResults] = useState<Results | null>(null);

  useEffect(() => {
    initTtsVoices();
    startSession(session.id, allExercises, initialExercise);
  }, [session.id, allExercises, initialExercise, startSession]);

  useEffect(() => {
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [tickTimer]);

  const handleStreamReady = useCallback(
    (video: HTMLVideoElement) => {
      if (poseRef.current) return;

      const pose = initPose((results: Results) => {
        setPoseResults(results);
        if (!results.poseLandmarks) return;

        const computed = computeAnglesFromLandmarks(results.poseLandmarks);
        updateAngles(computed);

        const ex = useSessionStore.getState().currentExercise;
        if (!ex) return;

        const targets = ex.targetAngles;
        const now = Date.now();
        const shoulderTarget = targets.shoulderLeft ?? 90;
        const spineTarget = targets.spine ?? 15;

        const shoulderSignal = normalizeSignal(
          computed.shoulderLeft,
          getRestAngle(shoulderTarget),
          getMaxAmplitude(shoulderTarget),
        );
        const spineSignal = normalizeSignal(
          computed.spine,
          getRestAngle(spineTarget),
          getMaxAmplitude(spineTarget),
        );

        appendSignal({
          timestamp: now,
          shoulderLeft: shoulderSignal,
          spine: spineSignal,
        });

        amplitudeSamples.current.push(computed.shoulderLeft);
        peakAmplitude.current = Math.max(peakAmplitude.current, computed.shoulderLeft);

        const overSince = useSessionStore.getState().lumbarOverTargetSince;
        if (computed.spine > spineTarget + 15) {
          if (!overSince) {
            setLumbarOverTargetSince(now);
          } else if (now - overSince >= 2000) {
            setLumbarAlert(true);
            addCompensation('lumbar');
            setLumbarOverTargetSince(null);
          }
        } else {
          setLumbarOverTargetSince(null);
          setLumbarAlert(false);
        }
      });

      poseRef.current = pose;

      const camera = new Camera(video, {
        onFrame: async () => {
          await pose.send({ image: video });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      void camera.start();
    },
    [
      updateAngles,
      appendSignal,
      addCompensation,
      setLumbarAlert,
      setLumbarOverTargetSince,
    ],
  );

  useEffect(() => {
    return () => {
      cameraRef.current?.stop();
    };
  }, []);

  const callCoach = useCallback(async () => {
    const state = useSessionStore.getState();
    const ex = state.currentExercise;
    if (!ex) return;

    const outOfTarget = hasAnglesOutOfTarget(state.angles, ex.targetAngles, 10);
    const now = Date.now();
    const minInterval = outOfTarget ? 8000 : 30000;
    if (now - lastCoachCall.current < minInterval) return;
    lastCoachCall.current = now;

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angles: state.angles,
          exercise: { name: ex.name, targetAngles: ex.targetAngles },
          compensations: state.compensations,
          history: state.coachMessages,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { message: string; type: 'info' | 'warn' | 'success' };
      const msg = {
        id: `coach-${now}`,
        text: data.message,
        type: data.type,
        timestamp: now,
      };
      addCoachMessage(msg);
      speakFrench(data.message);
    } catch {
      /* silencieux côté UX */
    }
  }, [addCoachMessage]);

  useEffect(() => {
    const id = setInterval(() => {
      void callCoach();
    }, 2000);
    return () => clearInterval(id);
  }, [callCoach]);

  const completeCurrentExercise = useCallback(async () => {
    const state = useSessionStore.getState();
    const ex = state.currentExercise;
    if (!ex) return;

    const se = sessionExercises.find((s) => s.exerciseId === ex.id);
    if (!se) return;

    const duration = Math.floor((Date.now() - exerciseStartRef.current) / 1000);
    const samples = amplitudeSamples.current;
    const avg =
      samples.length > 0
        ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
        : 0;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-exercise',
          sessionExerciseId: se.id,
          payload: {
            setsCompleted: ex.sets,
            repsCompleted: ex.reps,
            avgAmplitude: avg,
            peakAmplitude: peakAmplitude.current,
            compensations: state.compensations,
            signalData: state.signalHistory.slice(-60),
            coachMessages: state.coachMessages,
            durationSeconds: duration,
          },
        }),
      });
    } catch {
      /* continue navigation */
    }

    setSessionExercises((prev) =>
      prev.map((item) =>
        item.id === se.id
          ? { ...item, status: 'done', durationSeconds: duration }
          : item,
      ),
    );

    const currentIdx = exerciseQueue.findIndex((e) => e.id === ex.id);
    const nextEx = exerciseQueue[currentIdx + 1];

    if (nextEx) {
      amplitudeSamples.current = [];
      peakAmplitude.current = 0;
      exerciseStartRef.current = Date.now();
      nextExercise(nextEx);
      router.replace(`/session/${nextEx.id}`);
    } else {
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end',
            sessionId: session.id,
            payload: { totalDuration: state.sessionTimer },
          }),
        });
        await fetch('/api/rapports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id }),
        });
      } catch {
        /* */
      }
      endSession();
      router.push('/rapports');
    }
  }, [session.id, sessionExercises, exerciseQueue, nextExercise, endSession, router]);

  useEffect(() => {
    const ex = currentExercise ?? initialExercise;
    const targetReps = ex.reps * ex.sets;
    const estimatedSeconds = targetReps * 3;
    if (sessionTimer > 0 && sessionTimer >= estimatedSeconds) {
      void completeCurrentExercise();
    }
  }, [sessionTimer, currentExercise, initialExercise, completeCurrentExercise]);

  const activeEx = currentExercise ?? initialExercise;
  const currentIdx = exerciseQueue.findIndex((e) => e.id === activeEx.id);

  const steps = exerciseQueue.slice(currentIdx, currentIdx + 4).map((ex, i) => {
    let status: StepStatus = 'idle';
    if (i === 0) status = 'active';
    const done = sessionExercises.find((s) => s.exerciseId === ex.id && s.status === 'done');
    if (done) status = 'done';
    return { exercise: ex, status };
  });

  while (steps.length < 4 && steps.length < exerciseQueue.length) {
    const nextIdx = currentIdx + steps.length;
    if (exerciseQueue[nextIdx]) {
      steps.push({ exercise: exerciseQueue[nextIdx], status: 'idle' });
    } else break;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.topRow}>
          <RefVideoPlayer videoUrl={activeEx.refVideoUrl} exerciseName={activeEx.name} />
          <SignalGraph
            signalHistory={signalHistory}
            lumbarAlert={lumbarAlertActive}
            timerSeconds={sessionTimer}
            onStreamReady={handleStreamReady}
          />
        </div>
        <ExerciseBar steps={steps} />
      </div>
      <aside className={styles.panel}>
        <AnglePanel angles={angles} targets={activeEx.targetAngles} />
        <CoachPanel messages={coachMessages} />
        <SessionHistory items={sessionExercises} />
      </aside>
    </div>
  );
}
