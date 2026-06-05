"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const QUICK_REPLIES = [
  "Comment ameliorer mon amplitude ?",
  "Exercice pour l'epaule ?",
  "Comment lire mes rapports ?",
  "Conseil pour aujourd'hui",
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis Locomo, votre assistant de rehabilitation. Posez-moi vos questions sur les exercices, la progression, les sessions live ou l'application Locomo-assist.",
  timestamp: Date.now(),
};

// Check if question is related to the project domain
function isProjectDomain(q: string): boolean {
  const domain = [
    // Rehabilitation / medical
    "reeducat", "rehabilit", "kinesithe", "physio", " AVC", "avc", "traumatism",
    "recuper", "guerison", "soin", "therapie", "traitement", "mobilit", "muscl",
    "articul", "tendinit", "fractur", "paralys", "hemipleg",
    // Exercises
    "exercice", "epaule", "coude", "hanche", "colonne", "genou", "cheville",
    "flexion", "rotation", "abduction", "extension", "pont", "etirement",
    "mouvement", "posture", "serie", "repetit", "amplitude", "angle",
    // Locomo-assist features
    "locomo", "loco-assist", "locom assist", "application", "appli", "app ",
    "session", " live", "live", "camera", "coach ia", "coach", "rapport",
    "planning", "plannin", "programme", "progression", "tableau de bord", "dashboard",
    "profil", "parametre", "paramettr", "statistique", "graphique", "historique",
    // Symptoms & advice
    "douleur", "mal ", "fatigue", "courbatur", "etourdi", "vertige",
    "compens", "lombair", "scoliose", "inflammat",
    // Greetings
    "bonjour", "salut", "hello", "bonsoir", "merci", "au revoir",
    // Help / questions about the app
    "aide", "comment ", "fonctionn", "commentaire", "connaisse",
    "qu'est-ce", "quest-ce", "c'est quoi", "c quoi", "pourquoi", "quand",
    "combien", "ou se trouve", "comment faire", "ouvrir", "acceder",
    // Togo / Africa context
    "togo", "togolais", "afric", "lome", "hackathon",
  ];
  return domain.some((keyword) => q.includes(keyword));
}

// Smart local fallback responses when API is unavailable
function getLocalFallback(question: string): string {
  const q = question.toLowerCase();

  // Domain check — only answer project-related questions
  if (!isProjectDomain(q)) {
    return "Desole, je ne peux repondre qu'aux questions liees a la reeducation physique, les exercices, et l'application Locomo-assist. Posez-moi par exemple une question sur vos exercices, votre progression, ou vos rapports.";
  }

  if (q.includes("amplitude") || q.includes("ameliorer") || q.includes("progresser")) {
    return "Pour ameliorer votre amplitude, pratiquez vos exercices regulierement (5 fois/semaine), respectez les consignes du coach IA pendant les sessions, et evitez les compensations. L'echauffement avant chaque seance est aussi important. La constance est la cle de la reeducation.";
  }
  if (q.includes("epaule") || (q.includes("exercice") && q.includes("pour"))) {
    return "Pour l'epaule, voici les exercices recommandes : 1) Flexion avant (3x12), 2) Rotation externe (3x15), 3) Abduction laterale (3x10), 4) Pendule Codman (2x20). Commencez par des mouvements lents et augmentez progressivement l'amplitude.";
  }
  if (q.includes("rapport") || q.includes("bilan")) {
    return "Vos rapports sont accessibles dans l'onglet 'Rapports' du menu. Ils contiennent vos donnees d'amplitude par articulation, les compensations detectees, et le score de forme. Vous pouvez les telecharger en HTML ou les imprimer pour votre kinesitherapeute.";
  }
  if (q.includes("conseil") || q.includes("aujourd'hui") || q.includes("jour")) {
    return "Conseil du jour : commencez votre seance par 5 minutes d'echauffement (mouvements lents de l'epaule). Puis faites vos 3 exercices avec une bonne posture. N'oubliez pas de respirer calmement et de garder le dos droit. Consultez votre Planning pour le programme exact.";
  }
  if (q.includes("hanche") || q.includes("mobilisation")) {
    return "Pour la hanche, les exercices cles sont : mobilisation en flexion (3x12), abduction (3x15), pont fessier (3x12 tenir 5s), et marche sur place (2 min). Allongez-vous sur le cote pour les mouvements de rotation.";
  }
  if (q.includes("douleur") || q.includes("mal")) {
    return "Attention : si vous ressentez une douleur vive pendant un exercice, arretez immediatement. Une legere tension est normale, mais la douleur aigue signale qu'il faut consulter votre kinesitherapeute. Ne forcez jamais un mouvement.";
  }
  if (q.includes("session") || q.includes("live") || q.includes("caméra") || q.includes("camera")) {
    return "Pour lancer une session live, allez dans 'Session live' dans le menu. Activez votre camera pour que l'IA analyse vos mouvements en temps reel. Le coach IA vous guidera exercice par exercice.";
  }
  if (q.includes("planning") || q.includes("plannin")) {
    return "Votre planning hebdomadaire se trouve dans l'onglet 'Planning' du menu. Il contient le programme detaille de chaque jour avec les exercices, series et repetitions. Le planning est mis a jour selon votre progression.";
  }
  if (q.includes("progression") || q.includes("statistique") || q.includes("graphique")) {
    return "L'onglet 'Progression' affiche vos courbes d'amplitude sur 4 semaines, votre score de forme, et un tableau recapitulatif. Vous pouvez suivre l'evolution de chaque articulation et detecter les tendances d'amelioration.";
  }
  if (q.includes("profil") || q.includes("parametre") || q.includes("paramettr")) {
    return "Dans 'Profil', vous trouvez vos informations personnelles et votre score global. Dans 'Parametres', vous pouvez configurer les notifications, le mode sombre, la langue, et la gestion des donnees.";
  }
  if (q.includes("avc") || q.includes("traumatism") || q.includes("reeducat")) {
    return "Locomo-assist est specialement concu pour les patients en post-AVC et post-traumatisme au Togo. Le programme de reeducation cible les articulations les plus affectees : epaule, coude, hanche et colonne. La detection IA en temps reel vous aide a corriger vos mouvements.";
  }
  if (q.includes("togo") || q.includes("togolais") || q.includes("afric")) {
    return "Locomo-assist est un projet developpe pour le Togo et l'Afrique de l'Ouest dans le cadre du TCCHackDefend 2026. L'objectif est de rendre la reeducation accessible grace a l'IA et la detection de mouvement.";
  }
  if (q.includes("bonjour") || q.includes("salut") || q.includes("hello") || q.includes("bonsoir")) {
    return "Bonjour ! Je suis la pour vous aider dans votre reeducation. N'hesitez pas a me poser des questions sur vos exercices, votre progression, ou l'application.";
  }
  if (q.includes("merci")) {
    return "Avec plaisir ! Continuez vos efforts, chaque seance vous rapproche de votre objectif. Je suis la pour vous accompagner.";
  }
  if (q.includes("aide") || q.includes("fonctionn") || q.includes("comment")) {
    return "Locomo-assist offre : un tableau de bord avec vos statistiques, un planning hebdomadaire, des sessions live avec coach IA, un suivi de progression sur 4 semaines, et des rapports detailles. Utilisez le menu pour naviguer.";
  }

  return "Je peux vous aider avec vos exercices de reeducation, votre progression, vos sessions live, vos rapports, ou le fonctionnement de Locomo-assist. Quelle est votre question ?";
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const loadingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(`chat-${Date.now()}`);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      let reply = "";

      try {
        // Try API with an 8-second timeout (local fallback is reliable)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionIdRef.current,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          reply = data.reply || getLocalFallback(trimmed);
        } else {
          reply = getLocalFallback(trimmed);
        }
      } catch (err: unknown) {
        // Network error, timeout, or API failure — use local fallback
        const isTimeout = err instanceof Error && err.name === "AbortError";
        if (isTimeout) {
          reply = getLocalFallback(trimmed);
        } else {
          reply = getLocalFallback(trimmed);
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);

      loadingRef.current = false;
      setIsLoading(false);
    },
    // No dependencies needed — uses refs for loading state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-800 rotate-0"
            : "bg-primary hover:bg-primary/90 animate-bounce-gentle"
        }`}
        title={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out ${
            isMinimized
              ? "bottom-24 right-6 w-64"
              : "bottom-24 right-6 w-72 max-w-[calc(100vw-2rem)]"
          }`}
        >
          <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-sidebar px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Locomo"
                  className="w-5 h-5 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white flex items-center gap-1">
                  Locomo
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                </h3>
                <p className="text-[9px] text-white/60">
                  Assistant IA de reeducation
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                  title={isMinimized ? "Agrandir" : "Reduire"}
                >
                  <Minimize2 className="w-3 h-3 text-white/70" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                  title="Fermer"
                >
                  <X className="w-3 h-3 text-white/70" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <CardContent className="p-0">
                  <div className="h-52 overflow-y-auto p-3 space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${
                          msg.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0">
                          {msg.role === "assistant" ? (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              <img
                                src="/logo.png"
                                alt="Locomo"
                                className="w-3.5 h-3.5 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">
                                V
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Message bubble */}
                        <div
                          className={`max-w-[80%] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-white rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src="/logo.png"
                            alt="Locomo"
                            className="w-3.5 h-3.5 object-contain"
                          />
                        </div>
                        <div className="bg-muted px-2.5 py-1.5 rounded-lg rounded-tl-sm">
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" />
                            <span className="text-[9px] text-muted-foreground">
                              Reflechit...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Quick Replies */}
                {messages.length <= 1 && !isLoading && (
                  <div className="px-3 pb-1.5 flex flex-wrap gap-1">
                    {QUICK_REPLIES.map((text) => (
                      <button
                        key={text}
                        onClick={() => handleQuickReply(text)}
                        className="text-[9px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="border-t border-border p-2">
                  <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Posez votre question..."
                      disabled={isLoading}
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50 disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      size="sm"
                      className="w-7 h-7 p-0 rounded-lg bg-primary hover:bg-primary/90 shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
