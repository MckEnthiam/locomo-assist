import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      birthDate?: string;
      condition?: string;
    };

    // Return demo user, optionally merging provided fields
    return NextResponse.json({
      id: "demo-user-001",
      name: body.name ?? "Patient Démo",
      email: "demo@locomo.com",
      role: "PATIENT",
      avatar: null,
      phone: body.phone ?? null,
      birthDate: body.birthDate ?? null,
      condition: body.condition ?? "Rééducation post-opératoire épaule",
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Profile error:", e);
    return NextResponse.json(
      { error: "Erreur de mise à jour du profil." },
      { status: 500 }
    );
  }
}
