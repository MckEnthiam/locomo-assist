"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Calendar,
  Activity,
  Trophy,
  Edit3,
  Save,
  X,
  Shield,
  Clock,
} from "lucide-react";

interface UserData {
  name: string;
  email: string;
  role: string;
  id: string;
  phone?: string | null;
  birthDate?: string | null;
  condition?: string | null;
  avatar?: string | null;
  createdAt?: string;
}

const DEFAULT_USER: UserData = {
  name: "Patient D\u00e9mo",
  email: "demo@locomo.com",
  role: "PATIENT",
  id: "demo-001",
  phone: "+228 90 12 34 56",
  birthDate: "1985-03-15",
  condition: "R\u00e9\u00e9ducation post-AVC",
  avatar: null,
  createdAt: "2025-06-05",
};

export function Profil() {
  const [user, setUser] = useState<UserData>(DEFAULT_USER);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: DEFAULT_USER.name,
    phone: DEFAULT_USER.phone || "",
    birthDate: DEFAULT_USER.birthDate || "",
    condition: DEFAULT_USER.condition || "",
  });
  const [newPassword, setNewPassword] = useState("");

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("locomo-user");
      if (stored) {
        const parsed = JSON.parse(stored) as UserData;
        setUser(parsed);
        setForm({
          name: parsed.name || "",
          phone: parsed.phone || "",
          birthDate: parsed.birthDate || "",
          condition: parsed.condition || "",
        });
      }
    } catch {
      // use defaults
    }
  }, []);

  async function handleSave() {
    setLoading(true);
    setSuccess("");
    try {
      const payload: Record<string, string> = {
        name: form.name,
        phone: form.phone,
        birthDate: form.birthDate,
        condition: form.condition,
      };
      if (newPassword) payload.password = newPassword;
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        // Update localStorage
        localStorage.setItem("locomo-user", JSON.stringify(updated));
        setEditing(false);
        setNewPassword("");
        setSuccess("Profil mis \u00e0 jour avec succ\u00e8s !");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Mon profil
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            G\u00e9rez vos informations personnelles
          </p>
        </div>
        {!editing ? (
          <Button
            onClick={() => setEditing(true)}
            variant="outline"
            size="sm"
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Enregistrer
            </Button>
            <Button
              onClick={() => setEditing(false)}
              variant="outline"
              size="sm"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold">{user.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3" /> {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    user.role === "THERAPIST"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {user.role === "THERAPIST" ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" /> Th\u00e9rapeute
                    </>
                  ) : (
                    <>
                      <Activity className="w-3 h-3 mr-1" /> Patient
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Calendar className="w-3 h-3 mr-1" /> Membre depuis{" "}
                  {memberSince}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-primary/5 text-center">
              <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-primary">900</p>
              <p className="text-[10px] text-muted-foreground">Points</p>
            </div>
            <div className="p-3 rounded-xl bg-chart-3/5 text-center">
              <Activity className="w-4 h-4 text-chart-3 mx-auto mb-1" />
              <p className="text-lg font-bold text-chart-3">5</p>
              <p className="text-[10px] text-muted-foreground">Sessions</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-center">
              <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-500">1h 40</p>
              <p className="text-[10px] text-muted-foreground">Dur\u00e9e</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            Informations personnelles
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Nom complet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!editing}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={user.email}
                disabled
                className="mt-1 h-10 bg-muted/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                L&apos;email ne peut pas \u00eatre modifi\u00e9
              </p>
            </div>
            <div>
              <Label className="text-xs">T\u00e9l\u00e9phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!editing}
                  className="pl-9 h-10"
                  placeholder="+228 90 12 34 56"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Date de naissance</Label>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                disabled={!editing}
                className="mt-1 h-10"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-xs">Condition m\u00e9dicale</Label>
            <div className="relative mt-1">
              <Stethoscope className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
                disabled={!editing}
                className="flex w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="AVC, traumatisme, chirurgie \u00e9paule..."
              />
            </div>
          </div>
          {editing && (
            <div className="mt-4">
              <Label className="text-xs">
                Nouveau mot de passe (laisser vide pour ne pas changer)
              </Label>
              <div className="relative mt-1">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="Nouveau mot de passe"
                  minLength={6}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
