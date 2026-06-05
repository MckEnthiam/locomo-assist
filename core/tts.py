import threading

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None


class TTSEngine:
    def __init__(self):
        self._engine = None
        self._lock = threading.Lock()
        self._speaking = False
        self._available = False
        if pyttsx3 is not None:
            try:
                self._engine = pyttsx3.init()
                self._configure()
                self._available = True
            except Exception:
                self._engine = None

    def _configure(self):
        if not self._engine:
            return
        voices = self._engine.getProperty("voices")
        fr_voice = next(
            (v for v in voices if "fr" in v.id.lower() or "french" in v.name.lower()),
            None,
        )
        if fr_voice:
            self._engine.setProperty("voice", fr_voice.id)
        self._engine.setProperty("rate", 160)
        self._engine.setProperty("volume", 0.9)

    def speak(self, text: str):
        if not self._available or not self._engine:
            return

        def _run():
            with self._lock:
                self._speaking = True
                self._engine.say(text)
                self._engine.runAndWait()
                self._speaking = False

        if not self._speaking:
            threading.Thread(target=_run, daemon=True).start()

    def set_rate(self, rate: int):
        if self._engine:
            self._engine.setProperty("rate", rate)

    def stop(self):
        if self._engine:
            self._engine.stop()
