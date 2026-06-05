"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  Shield,
  Heart,
  Camera,
  Brain,
} from "lucide-react";

// Demo credentials shown to the user
const DEMO_ACCOUNTS = [
  { email: "demo@locomo.com", password: "demo123", label: "Patient Demo", role: "PATIENT" },
  { email: "koffi@locomo.com", password: "demo123", label: "Dr. Koffi (Therapeute)", role: "THERAPIST" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      // Store user in localStorage
      localStorage.setItem("locomo-user", JSON.stringify(data));
      localStorage.setItem("locomo-auth", "true");

      // Redirect to main app
      router.push("/");
    } catch {
      setError("Impossible de se connecter au serveur. Verifiez que l'application est lancee.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(demo: (typeof DEMO_ACCOUNTS)[0]) {
    // Demo mode: bypass API entirely, set localStorage directly and redirect
    const userData = {
      id: demo.role === "THERAPIST" ? "therapist-001" : "demo-user-001",
      name: demo.label,
      email: demo.email,
      role: demo.role,
      phone: demo.role === "THERAPIST" ? "+228 91 23 45 67" : "+228 90 12 34 56",
      birthDate: "1985-03-15",
      condition: demo.role === "THERAPIST"
        ? "Kinesitherapeute - Centre de readaptation de Lome"
        : "Readaptation post-AVC epaule gauche - Phase 2",
      avatar: null,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("locomo-user", JSON.stringify(userData));
    localStorage.setItem("locomo-auth", "true");
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#F0F5F2]" />
      <div className="absolute inset-0 bg-white/70" />

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/8 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/6 rounded-full" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-gray-200 p-2 mb-4">
            <img
              src="/logo.png"
              alt="Locomo-assist"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Locomo-assist
          </h1>
          <p className="text-sm text-white/70 mt-2 max-w-xs mx-auto">
            Reeducation physique assistee par IA pour les patients togolais
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="bg-white/20 text-white border-0 text-[10px]">
              TCCHackDefend 2026
            </Badge>
            <Badge className="bg-white/20 text-white border-0 text-[10px]">
              Hackathon
            </Badge>
          </div>
        </div>

        {/* Login card */}
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#085041]">
                Connexion
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Accedez a votre espace de reeducation
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@locomo.com"
                    className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#1D9E75] focus:ring-[#1D9E75]/20"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus:border-[#1D9E75] focus:ring-[#1D9E75]/20"
                    required
                    autoComplete="current-password"
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 rounded-xl bg-[#1D9E75] hover:bg-[#085041] text-white font-medium shadow-lg shadow-[#1D9E75]/25 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider">
                  Comptes de demonstration
                </span>
              </div>

              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.email}
                    onClick={() => handleDemoLogin(demo)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#1D9E75] hover:bg-[#E1F5EE]/50 transition-all duration-200 text-left group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1D9E75]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1D9E75]/20 transition-colors">
                      {demo.role === "THERAPIST" ? (
                        <Shield className="w-4 h-4 text-[#1D9E75]" />
                      ) : (
                        <Heart className="w-4 h-4 text-[#1D9E75]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {demo.label}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {demo.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-[#1D9E75] border-[#1D9E75]/20 group-hover:bg-[#1D9E75] group-hover:text-white group-hover:border-[#1D9E75] transition-all"
                    >
                      Demo
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features bar */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
            <Camera className="w-3.5 h-3.5" />
            <span>Detection IA</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
            <Brain className="w-3.5 h-3.5" />
            <span>Coach intelligent</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
            <Shield className="w-3.5 h-3.5" />
            <span>Donnees securisees</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-[10px] mt-4">
          Locomo-assist v2.0 - TCCHackDefend 2026
        </p>
      </div>
    </div>
  );
}
