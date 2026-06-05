import os
import time

from data.exercises import Exercise
from data.session_state import AngleData, CoachMessage

SYSTEM_PROMPT = """Tu es un coach kinésithérapeute virtuel.
Réponds UNIQUEMENT avec un message court (max 20 mots), direct, en français.
Ton ton est encourageant mais précis. Jamais de formules de politesse.
Si tout est correct → encourage. Si déviation → corrige avec précision (quel angle, combien de degrés).
Format : texte brut uniquement, pas de markdown."""


class CoachAI:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

        self.groq_client = None
        self.gemini_model = None

        if groq_key:
            try:
                from groq import Groq

                self.groq_client = Groq(api_key=groq_key)
            except Exception:
                self.groq_client = None

        if gemini_key:
            try:
                import google.generativeai as genai

                genai.configure(api_key=gemini_key)
                self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            except Exception:
                self.gemini_model = None

        self._last_call_time = 0.0
        self._use_groq = True
        self.MIN_INTERVAL = 8.0

    def should_call(self) -> bool:
        return (time.time() - self._last_call_time) >= self.MIN_INTERVAL

    def get_message(
        self,
        angles: AngleData,
        exercise: Exercise,
        compensations: dict,
        history: list[CoachMessage],
    ) -> CoachMessage | None:
        if not self.should_call():
            return None

        prompt = f"""Exercice: {exercise.name}
Angles actuels: épaule G={angles.shoulder_left:.0f}°, épaule D={angles.shoulder_right:.0f}°, coude G={angles.elbow_left:.0f}°, colonne={angles.spine:.0f}°
Angles cibles: {exercise.target_angles}
Compensations détectées: {compensations}
Derniers messages: {[m.text for m in history[-2:]]}"""

        msg_type = (
            "warn"
            if (compensations.get("lumbar", 0) > 0 or compensations.get("shoulder", 0) > 0)
            else "info"
        )

        if not self.groq_client and not self.gemini_model:
            self._last_call_time = time.time()
            return self._static_feedback(angles, exercise, compensations)

        try:
            text = self._call_groq(prompt) if self._use_groq else self._call_gemini(prompt)
            self._use_groq = not self._use_groq
            self._last_call_time = time.time()
            return CoachMessage(text=text, msg_type=msg_type)
        except Exception:
            try:
                text = self._call_gemini(prompt) if self._use_groq else self._call_groq(prompt)
                self._last_call_time = time.time()
                return CoachMessage(text=text, msg_type=msg_type)
            except Exception:
                self._last_call_time = time.time()
                return self._static_feedback(angles, exercise, compensations)

    def _call_groq(self, prompt: str) -> str:
        if not self.groq_client:
            raise RuntimeError("Groq client unavailable")
        response = self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=60,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content.strip()

    def _call_gemini(self, prompt: str) -> str:
        if not self.gemini_model:
            raise RuntimeError("Gemini model unavailable")
        response = self.gemini_model.generate_content(
            f"{SYSTEM_PROMPT}\n\n{prompt}",
            generation_config={"max_output_tokens": 60},
        )
        return response.text.strip()

    def _static_feedback(
        self, angles: AngleData, exercise: Exercise, compensations: dict
    ) -> CoachMessage:
        if compensations.get("lumbar", 0) > 0:
            return CoachMessage(
                text="Compensation lombaire — contractez les abdominaux.", msg_type="warn"
            )
        target = exercise.target_angles
        diff = abs(angles.shoulder_left - target.get("shoulder_left", 90))
        if diff > 15:
            return CoachMessage(
                text=f"Épaule gauche : ajustez de {diff:.0f}°.", msg_type="warn"
            )
        return CoachMessage(text="Bonne exécution. Continuez ce rythme.", msg_type="success")
