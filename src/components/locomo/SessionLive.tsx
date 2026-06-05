"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Activity,
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Dumbbell,
  Mic,
  Play,
  SkipForward,
  Square,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { CameraView } from "./CameraView";
import type { JointAngles } from "@/lib/poseAngles";

const EXERCISE_NAMES = [
  "Élévation latérale du bras",
  "Abduction du bras",
  "Flexion du coude",
];

const EXERCISE_TARGETS: JointAngles[] = [
  { shoulderLeft: 90, shoulderRight: 90, elbowLeft: 175, elbowRight: 175, spine: 12, hip: 175 },
  { shoulderLeft: 90, shoulderRight: 90, elbowLeft: 175, elbowRight: 175, spine: 12, hip: 175 },
  { shoulderLeft: 45, shoulderRight: 45, elbowLeft: 60, elbowRight: 60, spine: 15, hip: 175 },
];

interface SessionLiveProps {
  isLive: boolean;
  onToggleLive: () => void;
}

export function SessionLive({ isLive, onToggleLive }: SessionLiveProps) {
  // === ALL HOOKS MUST BE CALLED HERE, BEFORE ANY CONDITIONAL RETURN ===
  const {
    signalHistory,
    compensations,
    coachMessages,
    timer,
    lumbarAlert,
    currentStep,
    exerciseCount,
    startLive,
    stopLive,
    addSignalPoint,
    addCompensation,
    addCoachMessage,
    tick,
    setLumbarAlert,
    nextStep,
    updateAngles,
    angles,
  } = useSessionStore();

  const [useCamera, setUseCamera] = useState(true);
  const [coachCallPending, setCoachCallPending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  // selected exercise (index into EXERCISE_NAMES) and duration in minutes
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(1);
  const lastCoachCall = useRef(0);
  const lastAngleUpdate = useRef(0);
  const lastSpokenRef = useRef("");
  const prevAnglesRef = useRef<Record<string, number>>({});
  const recentMessagesRef = useRef<string[]>([]);
  const consecutiveGoodRef = useRef(0);
  const lastCompensationSpokenRef = useRef(0);
  const exerciseStartTimeRef = useRef(0);
  const prevStepRef = useRef(-1);
  const sessionStartTimeRef = useRef(0);
  const lastTimeTipRef = useRef(0);

  const selectedExerciseName = EXERCISE_NAMES[selectedExerciseIndex];
  const exerciseIndex = isLive ? activeExerciseIndex : selectedExerciseIndex;

  // Text-to-Speech helper — speaks coach messages aloud using Web Speech API
  const speakCoachMessage = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    // Avoid repeating the same sentence
    if (text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    // Try to pick a French female voice if available
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(
      (v) => v.lang.startsWith("fr") && v.name.toLowerCase().includes("female")
    ) ?? voices.find(
      (v) => v.lang.startsWith("fr")
    );
    if (frenchVoice) utterance.voice = frenchVoice;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Preload voices (some browsers load them async)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Exercise intro messages for each exercise
  const EXERCISE_INTROS: string[] = [
    "Bienvenue ! Commencez l'exercice : Élévation latérale du bras. Levez le bras latéralement jusqu'à l'horizontale, en gardant l'épaule stable. Faites chaque mouvement lentement et contrôlé.",
    "Bienvenue ! Commencez l'exercice : Abduction du bras. Écartez le bras sur le côté en gardant le coude légèrement fléchi. Ne montez pas plus haut que l'épaule.",
    "Bienvenue ! Commencez l'exercice : Flexion du coude. Pliez le coude en gardant le bras près du corps et contrôlez la montée et la descente.",
  ];

  // Reset coaching state when exercise changes + add transition messages
  useEffect(() => {
    if (!isLive) return;
    const now = Date.now();
    // Session just started — welcome message for the selected exercise
    const welcomeMsg = EXERCISE_INTROS[exerciseIndex] || `Exercice : ${EXERCISE_NAMES[exerciseIndex]}. Suivez les consignes à l'écran.`;
    addCoachMessage({ id: `intro-${now}`, text: welcomeMsg, type: "info", timestamp: now });
    speakCoachMessage(welcomeMsg);
    prevStepRef.current = exerciseIndex;
    prevAnglesRef.current = {};
    consecutiveGoodRef.current = 0;
    exerciseStartTimeRef.current = now;
    lastCompensationSpokenRef.current = 0;
  }, [exerciseIndex, isLive, addCoachMessage, speakCoachMessage]);

  // Generate a dynamic, unique coaching message based on real-time data
  const generateDynamicMessage = useCallback((
    currentAngles: Record<string, number>,
    prevAngles: Record<string, number>,
    targets: JointAngles,
    exerciseName: string,
    exerciseTimeSec: number,
    compCount: { lumbar: number; shoulder: number }
  ): { text: string; type: "info" | "warn" | "success" } => {
    const jointNames: Record<string, string> = {
      shoulderLeft: "Épaule gauche", shoulderRight: "Épaule droite",
      elbowLeft: "Coude gauche", elbowRight: "Coude droit",
      spine: "Colonne vertébrale", hip: "Hanche",
    };

    // Compute deviations
    const deviations: { joint: string; label: string; diff: number; actual: number; target: number }[] = [];
    for (const [key, target] of Object.entries(targets)) {
      const actual = currentAngles[key] ?? 0;
      const diff = actual - target;
      deviations.push({ joint: key, label: jointNames[key] || key, diff, actual: Math.round(actual), target });
    }
    deviations.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    // Find worst deviation
    const worst = deviations[0];
    const goodDeviations = deviations.filter(d => Math.abs(d.diff) <= 8);
    const badDeviations = deviations.filter(d => Math.abs(d.diff) > 15);
    const improvingJoints = deviations.filter(d => {
      const prev = prevAngles[d.joint] ?? 0;
      const curr = currentAngles[d.joint] ?? 0;
      const prevDiff = Math.abs(prev - d.target);
      const currDiff = Math.abs(curr - d.target);
      return currDiff < prevDiff - 3;
    });
    const worseningJoints = deviations.filter(d => {
      const prev = prevAngles[d.joint] ?? 0;
      const curr = currentAngles[d.joint] ?? 0;
      const prevDiff = Math.abs(prev - d.target);
      const currDiff = Math.abs(curr - d.target);
      return currDiff > prevDiff + 3;
    });

    const isGood = goodDeviations.length >= 4 && badDeviations.length === 0;
    const isImproving = improvingJoints.length >= 2;
    const isCompensationHigh = compCount.lumbar > 3 || compCount.shoulder > 3;

    // Build a unique message that references real data
    let text = "";
    let type: "info" | "warn" | "success" = "info";

    if (isCompensationHigh) {
      const compPart = compCount.lumbar > compCount.shoulder
        ? `Trop de compensations lombaires (${compCount.lumbar}). Serrez les abdominaux et redressez le bassin.`
        : `Attention aux compensations d'épaule (${compCount.shoulder}). Détendez et recentrez.`;
      const jointHint = worst
        ? `Votre ${worst.label} est à ${worst.actual} degrés au lieu de ${worst.target}.`
        : "";
      text = compPart + (jointHint ? " " + jointHint : "");
      type = "warn";
    } else if (isGood && isImproving) {
      const jts = improvingJoints.map(j => j.label).slice(0, 2).join(" et ");
      const msgs = [
        `Excellente progression sur ${jts} ! L'amplitude s'améliore naturellement. Continuez exactement comme ça.`,
        `Bravo ! Vos angles sur ${jts} se rapprochent des cibles. Le mouvement devient plus fluide.`,
        `Je vois une nette amélioration sur ${jts}. Votre corps s'adapte bien à l'exercice ${exerciseName.toLowerCase()}.`,
        `Super ! ${jts} sont dans une bonne dynamique. Restez concentré sur la qualité du geste.`,
        `Fantastique ! Votre constance paie. Les articulations ${jts} montrent une réelle progression.`,
        `C'est exactement ce que nous recherchons. ${jts} s'améliorent séance après séance. Continuez !`,
        `Bel effort ! L'amplitude sur ${jts} progresse bien. N'oubliez pas de respirer calmement pendant le mouvement.`,
      ];
      text = msgs[Math.floor(Math.random() * msgs.length)];
      type = "success";
    } else if (isGood) {
      const msgs = [
        `Parfait, tous vos angles sont dans la zone cible pour ${exerciseName.toLowerCase()}. Maintenez ce contrôle.`,
        `Très bon positionnement. Votre ${worst.label} est à ${worst.actual} degrés, proche des ${worst.target} degrés attendus.`,
        `Amplitude stable et contrôlée. Respirez calmement et gardez ce rythme pendant ${exerciseName.toLowerCase()}.`,
        `Votre posture est alignée. Chaque répétition renforce les bons schémas moteurs. Continuez.`,
        `Bien équilibré ! Les ${goodDeviations.length} articulations sont dans la bonne amplitude.`,
        `N'oubliez pas de garder le dos droit. Votre position actuelle est excellente, maintenez-la.`,
        `Respirez calmement pendant le mouvement. Votre timing est parfait pour ${exerciseName.toLowerCase()}.`,
        `Bel troisième set ! Continuez ainsi. Votre régularité est la clé de la guérison.`,
        `Excellent travail ! Votre constance paie. Chaque répétition compte dans votre rééducation.`,
      ];
      text = msgs[Math.floor(Math.random() * msgs.length)];
      type = "success";
    } else if (worseningJoints.length > 0 && badDeviations.length > 0) {
      const worstJoint = badDeviations[0];
      const direction = worstJoint.diff > 0 ? "trop haut" : "trop bas";
      const msgs = [
        `Attention ! Votre ${worstJoint.label} est ${direction}, à ${worstJoint.actual} degrés pour une cible de ${worstJoint.target}. Réajustez doucement.`,
        `Je perds de la précision sur ${worstJoint.label}. Vous êtes à ${worstJoint.actual}°, visez ${worstJoint.target}°. Revenez lentement.`,
        `Votre ${worstJoint.label} a tendance à dériver (${worstJoint.actual}°). Concentrez-vous sur ce geste en particulier.`,
        `La qualité baisse sur ${worstJoint.label}. Reprenez le mouvement depuis le départ, plus lentement.`,
        `N'oubliez pas de garder le dos droit. Ajustez ${worstJoint.label} progressivement vers ${worstJoint.target}°.`,
        `Respirez calmement pendant le mouvement et recentrez ${worstJoint.label}. Vous pouvez le faire !`,
      ];
      text = msgs[Math.floor(Math.random() * msgs.length)];
      type = "warn";
    } else if (badDeviations.length > 0) {
      const j = badDeviations[0];
      const msgs = [
        `Votre ${j.label} est à ${j.actual}°, éloigné des ${j.target}° cibles. Ajustez l'angle progressivement.`,
        `Focus sur ${j.label} : vous êtes à ${Math.abs(j.diff)} degrés de la cible. Serrez un peu plus.`,
        `${j.label} a besoin d'attention : ${j.actual}° actuellement, visez ${j.target}°. Le reste est correct.`,
      ];
      text = msgs[Math.floor(Math.random() * msgs.length)];
      type = "warn";
    } else if (improvingJoints.length > 0) {
      const j = improvingJoints[0];
      const msgs = [
        `${j.label} s'améliore ! Vous approchez les ${j.target}°. La tendance est bonne pour ${exerciseName.toLowerCase()}.`,
        `Bonne direction sur ${j.label}. Continuez, vous êtes presque à la bonne amplitude.`,
        `Le mouvement sur ${j.label} est plus précis qu'avant. C'est exactement ce qu'on cherche.`,
      ];
      text = msgs[Math.floor(Math.random() * msgs.length)];
      type = "success";
    } else {
      // General guidance based on context
      const msgs = [
        `Continuez ${exerciseName.toLowerCase()}. Votre ${worst.label} est à ${worst.actual}°, soyez régulier dans le mouvement.`,
        `Vous êtes à ${Math.round(exerciseTimeSec)} secondes sur cet exercice. Gardez un rythme régulier et contrôlé.`,
        `Mouvement correct sur l'ensemble. Portez attention au retour à la position neutre avant chaque répétition.`,
        `La régularité est clé. Effectuez ${exerciseName.toLowerCase()} avec la même amplitude à chaque fois.`,
        `N'oubliez pas de respirer : expirez pendant l'effort, inspirez au retour. C'est ${exerciseName.toLowerCase()}.`,
        `N'oubliez pas de garder le dos droit pendant ${exerciseName.toLowerCase()}. Un bon alignement prévient les blessures.`,
        `Respirez calmement pendant le mouvement. La respiration aide à relâcher les tensions musculaires.`,
        `Buvez de l'eau entre les exercices si vous le pouvez. L'hydratation favorise la récupération musculaire.`,
        `Excellent travail ! Votre constance paie. Continuez à vous concentrer sur la qualité du geste.`,
        `Gardez les épaules détendues et basses. Montez les épaules vers les oreilles compense l'effort.`,
        `Chaque répétition renforce les connexions neuro-musculaires. Le corps apprend avec la répétition.`,
        `Essayez de garder le menton légèrement rentré. Cela aide à aligner la colonne vertébrale.`,
        `Vous êtes sur la bonne voie. La rééducation demande de la patience, et vous en avez beaucoup.`,
      ];
      text = msgs[Math.floor(Math.random() * msgs.length)];
      type = "info";
    }

    return { text, type };
  }, []);

  // Called by CameraView with real pose angles
  const handleCameraAngles = useCallback(
    (poseAngles: JointAngles, comps: { lumbar: boolean; shoulder: boolean }) => {
      updateAngles(poseAngles);

      const now = Date.now();
      if (now - lastAngleUpdate.current > 200) {
        lastAngleUpdate.current = now;
        const shoulderTarget = EXERCISE_TARGETS[exerciseIndex]?.shoulderLeft ?? 90;
        const shoulderSignal =
          ((poseAngles.shoulderLeft - shoulderTarget * 0.3) / Math.max(30, shoulderTarget * 0.7)) * 500;
        const spineSignal = ((poseAngles.spine - 10) / 20) * 500;
        addSignalPoint({ timestamp: now, shoulderLeft: Math.round(shoulderSignal), spine: Math.round(spineSignal) });
      }

      if (comps.lumbar) { setLumbarAlert(true); addCompensation("lumbar"); }
      else { setLumbarAlert(false); }
      if (comps.shoulder) addCompensation("shoulder");

      // Real-time compensation alert — speaks immediately
      if ((comps.lumbar || comps.shoulder) && now - lastCompensationSpokenRef.current > 8000) {
        lastCompensationSpokenRef.current = now;
        const compMsg = comps.lumbar
          ? "Compensation lombaire ! Redressez votre dos et serrez les abdominaux immédiatement."
          : "Compensation d'épaule détectée. Relâchez la tension et recentrez le mouvement.";
        addCoachMessage({ id: `comp-${now}`, text: compMsg, type: "warn", timestamp: now });
        speakCoachMessage(compMsg);
      }

      // Continuous dynamic coaching — every ~4 seconds based on real angle analysis
      if (now - lastCoachCall.current > 4000 && !coachCallPending) {
        lastCoachCall.current = now;
        // First try the AI API for richer feedback
        setCoachCallPending(true);
        fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            angles: poseAngles,
            exercise: { name: EXERCISE_NAMES[exerciseIndex], targetAngles: EXERCISE_TARGETS[exerciseIndex] ?? EXERCISE_TARGETS[0] },
            compensations: { lumbar: compensations.lumbar, shoulder: compensations.shoulder },
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.message) {
              addCoachMessage({ id: `coach-${now}`, text: data.message, type: data.type || "info", timestamp: now });
              speakCoachMessage(data.message);
            }
          })
          .catch(() => {
            // Fallback to dynamic local coaching if AI fails
            const targets = EXERCISE_TARGETS[exerciseIndex] ?? EXERCISE_TARGETS[0];
            const elapsed = (now - exerciseStartTimeRef.current) / 1000;
            const dynamic = generateDynamicMessage(
              poseAngles, prevAnglesRef.current, targets,
              EXERCISE_NAMES[exerciseIndex], elapsed,
              compensations
            );
            addCoachMessage({ id: `coach-${now}`, text: dynamic.text, type: dynamic.type, timestamp: now });
            speakCoachMessage(dynamic.text);
          })
          .finally(() => {
            setCoachCallPending(false);
            prevAnglesRef.current = { ...poseAngles };
          });
      }
    },
    [exerciseIndex, updateAngles, addSignalPoint, setLumbarAlert, addCompensation, coachCallPending, compensations, addCoachMessage, speakCoachMessage, generateDynamicMessage]
  );

  // Timer + session start tracking + periodic time-based tips
  useEffect(() => {
    if (!isLive) return;
    sessionStartTimeRef.current = Date.now();
    prevStepRef.current = -1;
    lastTimeTipRef.current = 0;

    const timerId = setInterval(() => tick(), 1000);

    // Periodic time-based coaching tips every 30 seconds
    const timeTipInterval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = (now - sessionStartTimeRef.current) / 1000;
      const secondsSinceLastTip = (now - lastTimeTipRef.current) / 1000;
      if (secondsSinceLastTip < 30) return;
      lastTimeTipRef.current = now;

      const minutes = Math.floor(totalElapsed / 60);
      const tips = [
        `${Math.round(totalElapsed)} secondes écoulées. Vous progressez bien ! Continuez à ce rythme.`,
        `Déjà ${minutes > 0 ? minutes + " minute" + (minutes > 1 ? "s" : "") : Math.round(totalElapsed) + " secondes"} de session. Votre persévérance est remarquable.`,
        `N'oubliez pas de boire de l'eau entre les exercices. L'hydratation est essentielle pendant la rééducation.`,
        `${minutes > 0 ? minutes + " min" : Math.round(totalElapsed) + "s"} écoulées. Si vous sentez une fatigue, accordez-vous une pause plus longue.`,
        `Temps de session : ${minutes > 0 ? minutes + " minute" + (minutes > 1 ? "s" : "") : Math.round(totalElapsed) + " secondes"}. Pensez à respirer calmement entre chaque répétition.`,
        `Excellent travail ! Vous êtes actif${minutes >= 2 ? " depuis " + minutes + " minutes" : ""}. La constance est la clé de la rééducation.`,
      ];
      const tip = tips[Math.floor(Math.random() * tips.length)];
      addCoachMessage({ id: `time-${now}`, text: tip, type: "info", timestamp: now });
      speakCoachMessage(tip);
    }, 5000);

    return () => { clearInterval(timerId); clearInterval(timeTipInterval); };
  }, [isLive, tick, addCoachMessage, speakCoachMessage]);

  // Demo mode simulation (when camera is OFF) — with realistic angle variation
  useEffect(() => {
    if (!isLive || useCamera) return;
    const targets = EXERCISE_TARGETS[exerciseIndex] ?? EXERCISE_TARGETS[0];
    // Simulate a realistic session: start bad, improve,偶尔 have bad moments
    const phaseRef = { value: 0 }; // 0=improving, 1=good, 2=slipping
    const phaseStart = { value: Date.now() };
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - phaseStart.value) / 1000;
      // Phase transitions every 15-20 seconds for variety
      if (elapsed > 18 + Math.random() * 7) {
        phaseRef.value = (phaseRef.value + 1) % 3;
        phaseStart.value = now;
      }
      const newAngles: Record<string, number> = {};
      for (const [key, target] of Object.entries(targets)) {
        let baseNoise = Math.sin(now / 1200 + Math.random()) * 6;
        if (phaseRef.value === 0) baseNoise += -12 + (now - phaseStart.value) / 1000 * 1.5; // improving
        else if (phaseRef.value === 1) baseNoise += -2; // good
        else baseNoise += 8 + Math.sin(now / 800) * 5; // slipping
        newAngles[key] = Math.round(Math.max(0, Math.min(180, target + baseNoise)));
      }
      // Spine is more variable
      newAngles.spine = Math.round(Math.max(0, targets.spine + (phaseRef.value === 2 ? 18 : Math.sin(now / 900) * 4)));
      updateAngles(newAngles);

      const shoulderTarget = targets.shoulderLeft ?? 90;
      const shoulderSignal = ((newAngles.shoulderLeft - shoulderTarget * 0.3) / Math.max(30, shoulderTarget * 0.7)) * 500;
      const spineSignal = ((newAngles.spine - 10) / 20) * 500;
      addSignalPoint({ timestamp: now, shoulderLeft: Math.round(shoulderSignal), spine: Math.round(spineSignal) });

      if (newAngles.spine > 25) { setLumbarAlert(true); if (Math.random() < 0.4) addCompensation("lumbar"); }
      else { setLumbarAlert(false); }
      if (Math.abs((newAngles.shoulderLeft ?? 0) - shoulderTarget) > 20 && Math.random() < 0.2) addCompensation("shoulder");
    }, 200);
    return () => clearInterval(interval);
  }, [isLive, useCamera, exerciseIndex, updateAngles, addSignalPoint, setLumbarAlert, addCompensation]);

  // Demo dynamic coaching (when camera is OFF) — uses the same smart engine
  useEffect(() => {
    if (!isLive || useCamera) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const targets = EXERCISE_TARGETS[exerciseIndex] ?? EXERCISE_TARGETS[0];
      const elapsed = (now - exerciseStartTimeRef.current) / 1000;
      const dynamic = generateDynamicMessage(
        angles, prevAnglesRef.current, targets,
        EXERCISE_NAMES[exerciseIndex], elapsed,
        compensations
      );
      // Skip if too similar to a recent message
      const isSimilar = recentMessagesRef.current.some(m =>
        m.split(" ").filter(w => w.length > 4).some(w => dynamic.text.includes(w))
      );
      if (!isSimilar) {
        const msgId = `coach-${now}`;
        addCoachMessage({ id: msgId, text: dynamic.text, type: dynamic.type, timestamp: now });
        speakCoachMessage(dynamic.text);
        recentMessagesRef.current = [...recentMessagesRef.current, dynamic.text].slice(-8);
      }
      prevAnglesRef.current = { ...angles };
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, useCamera, exerciseIndex, angles, compensations, lumbarAlert, addCoachMessage, speakCoachMessage, generateDynamicMessage]);

  // Auto-stop session when timer reaches selected session duration (in minutes)
  useEffect(() => {
    if (!isLive) return;
    if (!sessionDuration || sessionDuration <= 0) return;
    const maxSeconds = sessionDuration * 60;
    if (timer >= maxSeconds) {
      const now = Date.now();
      addCoachMessage({ id: `end-${now}`, text: "Session terminée — infos enregistrées.", type: "info", timestamp: now });
      stopLive();
      onToggleLive();
    }
  }, [timer, isLive, sessionDuration, stopLive, onToggleLive, addCoachMessage]);

  // Handlers
  const handleToggle = useCallback(() => {
    if (isLive) {
      stopLive();
      onToggleLive();
      return;
    }
    setActiveExerciseIndex(selectedExerciseIndex);
    setSessionDuration(selectedDuration);
    startLive(1);
    onToggleLive();
  }, [isLive, startLive, stopLive, onToggleLive, selectedExerciseIndex, selectedDuration]);

  // Derived values
  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const signalData = (() => {
    const now = Date.now();
    return signalHistory
      .filter((p) => now - p.timestamp <= 10000)
      .map((p) => ({
        t: ((p.timestamp - (now - 10000)) / 1000).toFixed(1),
        shoulder: p.shoulderLeft,
        spine: p.spine,
      }));
  })();

  const targets = EXERCISE_TARGETS[exerciseIndex] ?? EXERCISE_TARGETS[0];
  const epauleValue = Math.round(((angles.shoulderLeft ?? 0) + (angles.shoulderRight ?? 0)) / 2);
  const coudeValue = Math.round(((angles.elbowLeft ?? 0) + (angles.elbowRight ?? 0)) / 2);
  const angleLabels = [
    { key: "epaule", label: "Épaule", value: epauleValue, target: Math.round((targets.shoulderLeft + targets.shoulderRight) / 2) },
    { key: "coude", label: "Coude", value: coudeValue, target: Math.round((targets.elbowLeft + targets.elbowRight) / 2) },
    { key: "poigne", label: "Poigné", value: angles.spine ?? 0, target: targets.spine },
  ];

  // === CONDITIONAL RETURNS AFTER ALL HOOKS ===

  // Not started view
  if (!isLive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center p-2">
            <img src="/logo.png" alt="Locomo-assist" className="w-16 h-16 object-contain" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary animate-pulse flex items-center justify-center">
            <Mic className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Session en direct</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Lancez votre session de rééducation. Activez votre caméra pour que
            l&apos;IA analyse vos mouvements en temps réel et vous coach
            exercice par exercice.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button variant={useCamera ? "default" : "outline"} size="sm" onClick={() => setUseCamera(!useCamera)} className={useCamera ? "bg-primary hover:bg-primary/90" : ""}>
                <Camera className="w-4 h-4 mr-2" />
                Caméra {useCamera ? "activée" : "désactivée"}
              </Button>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Choisir l'exercice</p>
              <div className="flex gap-2 flex-wrap">
                {EXERCISE_NAMES.map((n, i) => (
                  <Button key={n} variant={i === selectedExerciseIndex ? "default" : "outline"} size="sm" onClick={() => setSelectedExerciseIndex(i)}>
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="w-48">
              <p className="text-sm font-medium mb-2">Durée: {selectedDuration} min</p>
              <Slider value={[selectedDuration]} min={1} max={30} onValueChange={(v: number[]) => setSelectedDuration(v[0])} />
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={handleToggle} size="lg" className="bg-primary hover:bg-primary/90 shadow-md px-8">
              <Play className="w-5 h-5 mr-2" />
              Démarrer la session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Live session view
  return (
    <div className="space-y-4">
      {/* Timer + Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-mono text-lg font-bold shadow-md">
            <Timer className="w-4 h-4" />
            {formatTimer(timer)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={voiceEnabled ? "default" : "outline"} size="sm" onClick={() => setVoiceEnabled(!voiceEnabled)} className={voiceEnabled ? "bg-primary hover:bg-primary/90" : ""}>
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 mr-1.5" /> : <VolumeX className="w-3.5 h-3.5 mr-1.5" />}
            Voix {voiceEnabled ? "ON" : "OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setUseCamera(!useCamera)}>
            {useCamera ? <><CameraOff className="w-3.5 h-3.5 mr-1.5" /> Caméra off</> : <><Camera className="w-3.5 h-3.5 mr-1.5" /> Caméra on</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggle} className="text-destructive hover:bg-destructive/10">
            <Square className="w-3.5 h-3.5 mr-1.5" /> Arrêter
          </Button>
          {/* Single-exercise mode: removed stepper 'Suivant' button */}
        </div>
      </div>

      {/* Active exercise info (single-exercise mode) */}
      <div className="p-3 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Exercice actif</p>
            <h3 className="text-lg font-bold">{EXERCISE_NAMES[exerciseIndex]}</h3>
            <p className="text-sm text-muted-foreground">Durée: {sessionDuration} min</p>
          </div>
          <div className="text-sm text-muted-foreground">{useCamera ? "Caméra activée" : "Mode démonstration"}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0 relative bg-white">
              <div className="absolute left-6 top-6 w-[320px] h-48 rounded-3xl border border-white/10 bg-slate-950/90 overflow-hidden shadow-2xl shadow-slate-950/20">
                {useCamera ? (
                  <CameraView active={isLive} onAngles={handleCameraAngles} />
                ) : (
                  <div className="w-full h-full relative bg-gradient-to-br from-[#085041] via-[#1D9E75] to-[#085041]">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center relative z-10 text-center px-3">
                      <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center">
                        <Dumbbell className="w-8 h-8 text-white/60" />
                      </div>
                      <p className="text-white/70 text-[10px] mt-3">Mode démonstration</p>
                      <p className="text-white/50 text-[10px]">{EXERCISE_NAMES[exerciseIndex]}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-52 px-6 pb-6">
                <div className="flex items-center justify-between gap-4 mb-0">
                  {lumbarAlert && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 border border-red-200">
                      <AlertTriangle className="w-4 h-4" /> Compensation lombaire détectée
                    </div>
                  )}
                </div>
                <div className="w-full h-[520px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signalData}>
                      <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94A3B8" }} stroke="#334155" />
                      <YAxis domain={[-500, 500]} tick={{ fontSize: 10, fill: "#94A3B8" }} stroke="#334155" />
                      <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" />
                      <Line type="linear" dataKey="shoulder" stroke="#22C55E" dot={false} strokeWidth={3} isAnimationActive={false} name="Épaule" />
                      <Line type="linear" dataKey="spine" stroke="#F97316" dot={false} strokeWidth={3} isAnimationActive={false} name="Colonne" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <aside className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                {useCamera ? "Angles articulaires (détection IA)" : "Angles articulaires (simulation)"}
              </p>
              <div className="space-y-3">
                {angleLabels.map(({ key, label, value, target }) => {
                  const v = value ?? 0;
                  const diff = Math.abs(v - target);
                  const ok = diff <= 10;
                  const pct = Math.min(100, Math.round((v / Math.max(1, target)) * 100));
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className={`text-xs font-bold ${ok ? "text-primary" : "text-chart-3"}`}>{Math.round(v)}°</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${ok ? "bg-primary" : "bg-chart-3"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground/50">Cible: {target}°</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-primary" />
                Coach IA {coachCallPending && <span className="text-[10px] text-primary animate-pulse">...analyse</span>}
                {voiceEnabled && <Volume2 className="w-3 h-3 text-primary/60 ml-1" />}
                {!voiceEnabled && <VolumeX className="w-3 h-3 text-muted-foreground/40 ml-1" />}
              </p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {coachMessages.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center"><Mic className="w-2.5 h-2.5 text-primary" /></div>
                    <p className="text-[11px] text-muted-foreground">Le coach vous guidera pendant l&apos;exercice...</p>
                  </div>
                ) : (
                  [...coachMessages].reverse().slice(0, 6).map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-2 p-2.5 rounded-lg text-[11px] leading-relaxed ${
                      msg.type === "warn" ? "bg-red-50 border-l-2 border-red-400 text-red-800"
                        : msg.type === "success" ? "bg-green-50 border-l-2 border-green-400 text-green-800"
                        : "bg-muted border-l-2 border-muted-foreground/20"
                    }`}>
                      {msg.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        : msg.type === "warn" ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        : <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                      <span>{msg.text}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Compensations</p>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-2.5 rounded-lg text-center ${compensations.lumbar > 0 ? "bg-red-50 border border-red-200" : "bg-muted/50"}`}>
                  <p className="text-lg font-bold text-red-600">{compensations.lumbar}</p>
                  <p className="text-[10px] text-muted-foreground">Lombaire</p>
                </div>
                <div className={`p-2.5 rounded-lg text-center ${compensations.shoulder > 0 ? "bg-red-50 border border-red-200" : "bg-muted/50"}`}>
                  <p className="text-lg font-bold text-red-600">{compensations.shoulder}</p>
                  <p className="text-[10px] text-muted-foreground">Épaule</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
