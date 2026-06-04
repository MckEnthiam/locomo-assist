import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera } from '@mediapipe/camera_utils';
import type { Results } from '@mediapipe/pose';
import { AppShell } from '@/components/layout/AppShell';
import { AnglePanel } from '@/components/session/AnglePanel';
import { CoachPanel } from '@/components/session/CoachPanel';
import { ExerciseBar, type StepStatus } from '@/components/session/ExerciseBar';
import { RefVideoPlayer } from '@/components/session/RefVideoPlayer';
import { SessionHistory } from '@/components/session/SessionHistory';
import { SignalGraph } from '@/components/session/SignalGraph';
import styles from '@/components/session/SessionLive.module.css';
import { computeAnglesFromLandmarks } from '@/lib/angles';
import { getCoachMessage } from '@/lib/coach';
import { createPose } from '@/lib/mediapipe';
import {
  endSession,
  generatePdf,
  getActiveSession,
  pushSync,
  updateSessionExercise,
} from '@/lib/ipc';
import { getMaxAmplitude, getRestAngle, normalizeSignal } from '@/lib/signal';
import { initTtsVoices, speakFrench, stopSpeech } from '@/lib/tts';
import { useSessionStore } from '@/store/sessionStore';
import type { ExerciseDTO, SessionDTO } from '@/types';

export default function SessionLivePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const poseRef = useRef<ReturnType<typeof createPose> | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastCoachCall = useRef(0);
  const exerciseStartRef = useRef(Date.now());
  const amplitudeSamples = useRef<number[]>([]);
  const peakAmplitude = useRef(0);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [sessionExercises, setSessionExercises] = useState<SessionDTO['exercises']>([]);

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
    endSession: endSessionStore,
  } = useSessionStore();

  useEffect(() => {
    async function load() {
      try {
        const active = await getActiveSession();
        if (!active) {
          navigate('/planning');
          return;
        }
        setSession(active);
        setSessionExercises(active.exercises);
        const ex =
          active.exercises.find((e) => e.exerciseId === exerciseId)?.exercise ??
          active.exercises.find((e) => e.status === 'active')?.exercise ??
          active.exercises[0]?.exercise;
        if (!ex) {
          navigate('/planning');
          return;
        }
        const queue = active.exercises.map((se) => se.exercise);
        initTtsVoices();
        startSession(active.id, queue, ex);
      } catch {
        navigate('/planning');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [exerciseId, navigate, startSession]);

  useEffect(() => {
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [tickTimer]);

  useEffect(() => () => stopSpeech(), []);

  const handleStreamReady = useCallback(
    (video: HTMLVideoElement) => {
      if (poseRef.current) return;

      const pose = createPose((results: Results) => {
        if (!results.poseLandmarks) return;
        const computed = computeAnglesFromLandmarks(results.poseLandmarks);
        updateAngles(computed);

        const ex = useSessionStore.getState().currentExercise;
        if (!ex) return;

        const targets = ex.targetAngles;
        const now = Date.now();
        const shoulderTarget = targets.shoulderLeft ?? 90;
        const spineTarget = targets.spine ?? 15;

        appendSignal({
          timestamp: now,
          shoulderLeft: normalizeSignal(
            computed.shoulderLeft,
            getRestAngle(shoulderTarget),
            getMaxAmplitude(shoulderTarget),
          ),
          spine: normalizeSignal(
            computed.spine,
            getRestAngle(spineTarget),
            getMaxAmplitude(spineTarget),
          ),
        });

        amplitudeSamples.current.push(computed.shoulderLeft);
        peakAmplitude.current = Math.max(peakAmplitude.current, computed.shoulderLeft);

        const overSince = useSessionStore.getState().lumbarOverTargetSince;
        if (computed.spine > spineTarget + 15) {
          if (!overSince) setLumbarOverTargetSince(now);
          else if (now - overSince >= 2000) {
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

  useEffect(
    () => () => {
      cameraRef.current?.stop();
    },
    [],
  );

  const callCoach = useCallback(async () => {
    const state = useSessionStore.getState();
    const ex = state.currentExercise;
    if (!ex) return;

    const now = Date.now();
    const minInterval = (state.compensations.lumbar > 0 ? 8 : 30) * 1000;
    if (now - lastCoachCall.current < minInterval) return;
    lastCoachCall.current = now;

    try {
      const result = await getCoachMessage(
        state.angles,
        ex,
        state.compensations,
        state.coachMessages,
      );
      addCoachMessage({
        id: `coach-${now}`,
        text: result.text,
        type: result.type,
        timestamp: now,
      });
      speakFrench(result.text);
    } catch {
      /* fallback silencieux */
    }
  }, [addCoachMessage]);

  useEffect(() => {
    const id = setInterval(() => {
      void callCoach();
    }, 2000);
    return () => clearInterval(id);
  }, [callCoach]);

  const completeCurrentExercise = useCallback(async () => {
    if (!session) return;
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
      await updateSessionExercise(se.id, {
        status: 'done',
        setsCompleted: ex.sets,
        repsCompleted: ex.reps,
        avgAmplitude: avg,
        peakAmplitude: peakAmplitude.current,
        compensations: state.compensations,
        signalData: state.signalHistory.slice(-60),
        coachMessages: state.coachMessages,
        durationSeconds: duration,
      });
    } catch {
      /* continue */
    }

    setSessionExercises((prev) =>
      prev.map((item) =>
        item.id === se.id ? { ...item, status: 'done', durationSeconds: duration } : item,
      ),
    );

    const currentIdx = exerciseQueue.findIndex((e) => e.id === ex.id);
    const nextEx = exerciseQueue[currentIdx + 1];

    if (nextEx) {
      amplitudeSamples.current = [];
      peakAmplitude.current = 0;
      exerciseStartRef.current = Date.now();
      nextExercise(nextEx);
      navigate(`/session/${nextEx.id}`);
    } else {
      try {
        await endSession(session.id, state.sessionTimer);
        await generatePdf(session.id);
        if (navigator.onLine) await pushSync();
      } catch {
        /* */
      }
      endSessionStore();
      navigate('/rapports');
    }
  }, [session, sessionExercises, exerciseQueue, nextExercise, endSessionStore, navigate]);

  useEffect(() => {
    const ex = currentExercise;
    if (!ex) return;
    const estimatedSeconds = ex.reps * ex.sets * 3;
    if (sessionTimer > 0 && sessionTimer >= estimatedSeconds) {
      void completeCurrentExercise();
    }
  }, [sessionTimer, currentExercise, completeCurrentExercise]);

  if (loading || !currentExercise) {
    return (
      <AppShell title="Session live" subtitle="Chargement…">
        <p className="text-sm text-text-tertiary">Préparation de la session…</p>
      </AppShell>
    );
  }

  const currentIdx = exerciseQueue.findIndex((e) => e.id === currentExercise.id);
  const steps: { exercise: ExerciseDTO; status: StepStatus }[] = [];
  for (let i = 0; i < 4 && currentIdx + i < exerciseQueue.length; i++) {
    const ex = exerciseQueue[currentIdx + i];
    let status: StepStatus = i === 0 ? 'active' : 'idle';
    if (sessionExercises.find((s) => s.exerciseId === ex.id && s.status === 'done')) {
      status = 'done';
    }
    steps.push({ exercise: ex, status });
  }

  return (
    <AppShell title="Session live" subtitle={currentExercise.name}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.topRow}>
            <RefVideoPlayer exercise={currentExercise} />
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
          <AnglePanel angles={angles} targets={currentExercise.targetAngles} />
          <CoachPanel messages={coachMessages} />
          <SessionHistory items={sessionExercises} />
        </aside>
      </div>
    </AppShell>
  );
}
