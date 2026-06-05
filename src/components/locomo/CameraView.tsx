"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { computeJointAngles, detectCompensations, type JointAngles } from "@/lib/poseAngles";
import { AlertTriangle, Camera, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraViewProps {
  active: boolean;
  onAngles: (angles: JointAngles, comps: { lumbar: boolean; shoulder: boolean }) => void;
}

/** Dynamically load MediaPipe scripts from CDN */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

let mpLoaded = false;
async function loadMP() {
  if (mpLoaded) return;
  await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");
  mpLoaded = true;
}

/** Separate component for camera + pose detection — avoids hook ordering issues */
export function CameraView({ active, onAngles }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const onAnglesRef = useRef(onAngles);
  onAnglesRef.current = onAngles;

  const lastUpdate = useRef(0);

  const handleResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext("2d");

      if (ctx && video && results.poseLandmarks) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const connections = [
          [11, 13], [13, 15], [12, 14], [14, 16],
          [11, 12], [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28],
        ];
        ctx.strokeStyle = "#1D9E75";
        ctx.lineWidth = 3;
        for (const [a, b] of connections) {
          const la = results.poseLandmarks[a];
          const lb = results.poseLandmarks[b];
          if (la && lb && la.visibility > 0.5 && lb.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(la.x * canvas.width, la.y * canvas.height);
            ctx.lineTo(lb.x * canvas.width, lb.y * canvas.height);
            ctx.stroke();
          }
        }
        for (const lm of results.poseLandmarks) {
          if (lm.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "#085041";
            ctx.fill();
            ctx.strokeStyle = "#1D9E75";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      if (results.poseLandmarks) {
        const now = Date.now();
        if (now - lastUpdate.current < 200) return;
        lastUpdate.current = now;

        const lm = results.poseLandmarks.map((l: any) => ({
          x: l.x, y: l.y, z: l.z, visibility: l.visibility,
        }));
        const angles = computeJointAngles(lm);
        const comps = detectCompensations(angles, {});
        onAnglesRef.current(angles, comps);
      }
    },
    []
  );

  const start = useCallback(async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setError(null);

    try {
      await loadMP();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const PoseClass = (window as any).Pose;
      if (!PoseClass) throw new Error("MediaPipe Pose not loaded");

      const pose = new PoseClass({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
      });
      pose.setOptions({
        modelComplexity: 1, smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      pose.onResults(handleResults);
      poseRef.current = pose;

      const CameraClass = (window as any).Camera;
      if (CameraClass) {
        const cam = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640, height: 480,
        });
        await cam.start();
      }

      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur caméra");
    } finally {
      setLoading(false);
    }
  }, [handleResults]);

  const stop = useCallback(() => {
    if (poseRef.current) { poseRef.current.close(); poseRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; }
    setReady(false);
  }, []);

  useEffect(() => {
    if (active) start();
    else stop();
    return () => { stop(); };
  }, [active, start, stop]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-xs">Chargement détection de pose...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-white text-xs">{error}</p>
          </div>
        </div>
      )}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
      {!ready && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#085041] via-[#1D9E75] to-[#085041]">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <Camera className="w-10 h-10 text-white/60" />
            <p className="text-white/70 text-xs">Caméra en attente...</p>
          </div>
        </div>
      )}
    </div>
  );
}
