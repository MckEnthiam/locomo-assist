import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es un coach kinésithérapeute virtuel. Tu observes les angles articulaires d'un patient en temps réel pendant sa rééducation.
Réponds UNIQUEMENT avec un message court (max 20 mots), direct, en français.
Ton ton est encourageant mais précis. Jamais de formules de politesse.
Si tout est correct → encourage. Si déviation → corrige avec précision (quel angle, combien de degrés).
Format de réponse : texte brut uniquement, pas de markdown.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      angles: Record<string, number>;
      exercise: { name: string; targetAngles: Record<string, number> };
      compensations?: { lumbar: number; shoulder: number };
    };

    if (!body.angles || !body.exercise) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const userContent = `Exercice: ${body.exercise.name}
Angles actuels: ${JSON.stringify(body.angles)}
Angles cibles: ${JSON.stringify(body.exercise.targetAngles)}
Compensations détectées: ${JSON.stringify(body.compensations ?? { lumbar: 0, shoulder: 0 })}`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const message = completion.choices[0]?.message?.content ?? "Continuez vos efforts !";

    // Determine message type
    const targets = body.exercise.targetAngles;
    const angles = body.angles;
    const compensations = body.compensations ?? { lumbar: 0, shoulder: 0 };

    let type: "success" | "warn" = "success";
    if (compensations.lumbar > 0 || compensations.shoulder > 0) {
      type = "warn";
    } else {
      const keys = Object.keys(targets);
      const outOfTarget = keys.some((key) => {
        const t = targets[key];
        if (t === undefined) return false;
        return Math.abs((angles[key] ?? 0) - t) > 10;
      });
      if (outOfTarget) type = "warn";
    }

    return NextResponse.json({ message, type });
  } catch (e) {
    console.error("Coach error:", e);
    // Fallback to a default message if AI fails
    return NextResponse.json({
      message: "Gardez la position, vous progressez bien !",
      type: "success",
    });
  }
}
