import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "demo-user-001",
    name: "Patient Démo",
    email: "demo@locomo.com",
    role: "PATIENT",
    avatar: null,
    phone: null,
    birthDate: null,
    condition: "Rééducation post-opératoire épaule",
    createdAt: new Date().toISOString(),
  });
}
