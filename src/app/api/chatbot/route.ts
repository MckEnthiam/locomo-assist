import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SYSTEM_PROMPT = `Tu es "Locomo", le chatbot assistant virtuel de Locomo-assist, une application de reeducation physique assistee par IA pour les patients togolais en post-AVC ou post-traumatisme.

TON DOMAINE STRICT — tu ne peux repondre QU'AUX QUESTIONS LIEES A :
- La reeducation physique, la physiotherapie, la kinesitherapie
- Les exercices therapeutiques (epaule, coude, hanche, colonne, genou)
- Les pathologies post-AVC, post-traumatisme, la recuperation motrice
- Les fonctionnalites de Locomo-assist (tableau de bord, planning, sessions live, coach IA, camera, rapports, progression, profil, parametres)
- Les conseils de sante lies a la reeducation (douleur, posture, amplitude, compensations, hydratation, fatigue)
- Le contexte du projet (Togo, Afrique de l'Ouest, TCCHackDefend 2026)

REGLE IMPORTANTE : Si la question est HORS de ton domaine (ex: politique, sport, meteo, cuisine, musique, technologie generale, actualite, etc.), tu DOIS refuser poliment en disant :
"Desole, je ne peux repondre qu'aux questions liees a la reeducation physique et l'application Locomo-assist. Posez-moi une question sur vos exercices, votre progression ou vos rapports."

Autres regles :
- Reponds en francais
- Sois concis (2-4 phrases max)
- Ton bienveillant, encourageant et professionnel
- Ne donne jamais de diagnostic medical — oriente vers un professionnel si necessaire
- Mentionne les fonctionnalites de Locomo-assist quand c'est pertinent`;

function getDomainFallback(): string {
  const messages = [
    "Desole, je ne peux repondre qu'aux questions liees a la reeducation physique et l'application Locomo-assist. Posez-moi une question sur vos exercices, votre progression ou vos rapports.",
    "Cette question est hors de mon domaine. Je suis specialise en reeducation physique — demandez-moi conseil sur vos exercices, votre amplitude, ou le fonctionnement de l'application.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// In-memory conversation history per session (demo mode)
const conversations = new Map<string, Array<{ role: string; content: string }>>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message: string;
      sessionId?: string;
    };

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId || "default";
    const userMessage = body.message.trim();

    // Get or create conversation history
    let history = conversations.get(sessionId) || [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Limit history to last 10 messages (+ system prompt) to avoid token limits
    if (history.length > 12) {
      history = [history[0], ...history.slice(-10)];
    }

    // Add user message
    history.push({ role: "user", content: userMessage });

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: history.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        max_tokens: 300,
      });

      const reply = completion.choices[0]?.message?.content || getDomainFallback();

      // Store assistant reply in history
      history.push({ role: "assistant", content: reply });
      conversations.set(sessionId, history);

      return NextResponse.json({ reply });
    } catch (aiError) {
      console.error("AI SDK error:", aiError);
      // Return a fallback reply if AI fails
      const fallbackReplies: Record<string, string> = {
        default: "Je suis desole, une erreur temporaire est survenue. Veuillez reessayer. En attendant, je vous encourage a continuer vos exercices regulierement.",
      };
      const reply = fallbackReplies.default;
      history.push({ role: "assistant", content: reply });
      conversations.set(sessionId, history);
      return NextResponse.json({ reply });
    }
  } catch (e) {
    console.error("Chatbot error:", e);
    return NextResponse.json({
      reply: "Une erreur est survenue. Veuillez reessayer.",
    });
  }
}
