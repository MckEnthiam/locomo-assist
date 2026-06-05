import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

const SALT = "locomo-assist-hackathon-2026";

function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64).toString("hex");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const hashedInput = hashPassword(password);
    if (user.password && user.password !== hashedInput) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Return user data without password
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      birthDate: user.birthDate,
      condition: user.condition,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Erreur de connexion au serveur" },
      { status: 500 }
    );
  }
}
