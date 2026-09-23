"""
DemeRadio 94.9 FM - Motor de Audio y Síntesis de Voz (audio_engine.py)
Responsable de convertir el guión generado por la IA en audio realista de locutor de radio.
Soporta modulación de tono y velocidad según el estado de ánimo (mood),
así como reproducción opcional con pygame.
"""

import asyncio
import os
import time
from pathlib import Path
from typing import Optional

from src.config import OUTPUT_AUDIO_DIR, VOICE_NAME, FALLBACK_VOICE_LANG

class AudioEngine:
    """
    Motor de síntesis vocal y gestión de audio para DemeRadio 94.9 FM.
    """

    def __init__(self, voice: str = VOICE_NAME):
        self.voice = voice
        self._pygame_initialized = False

    def _init_pygame_mixer(self):
        """Inicializa el mezclador de pygame de forma perezosa."""
        if not self._pygame_initialized:
            try:
                import pygame
                pygame.mixer.init()
                self._pygame_initialized = True
            except Exception as e:
                print(f"[AudioEngine] Aviso: No se pudo iniciar pygame.mixer: {e}")

    def get_voice_modulation(self, mood: str) -> tuple[str, str]:
        """
        Calcula la modulación de velocidad (rate) y tono (pitch) según el mood del locutor.
        - energetico: mayor velocidad y tono arriba para hype.
        - relajado: ritmo más pausado para transiciones nocturnas.
        - bromista: entonación dinámica con cambios expresivos.
        """
        mood_clean = (mood or "energetico").strip().lower()

        if mood_clean == "energetico":
            rate = "+12%"
            pitch = "+5Hz"
        elif mood_clean == "relajado":
            rate = "-6%"
            pitch = "-3Hz"
        elif mood_clean == "bromista":
            rate = "+6%"
            pitch = "+2Hz"
        else:
            rate = "+0%"
            pitch = "+0Hz"

        return rate, pitch

    async def synthesize(self, text: str, mood: str = "energetico", filename: Optional[str] = None) -> Path:
        """
        Sintetiza el diálogo a un archivo MP3 usando edge-tts (voz neuronal de alta fidelidad).
        Si edge-tts falla o no está disponible, recurre a gTTS.
        """
        if not filename:
            timestamp = int(time.time())
            filename = f"demeradio_{mood}_{timestamp}.mp3"

        out_path = OUTPUT_AUDIO_DIR / filename
        rate, pitch = self.get_voice_modulation(mood)

        # 1. Intentar con edge-tts (calidad neuronal de estudio)
        try:
            import edge_tts
            communicate = edge_tts.Communicate(
                text=text,
                voice=self.voice,
                rate=rate,
                pitch=pitch
            )
            await communicate.save(str(out_path))
            return out_path
        except Exception as edge_err:
            print(f"[AudioEngine] edge-tts no disponible ({edge_err}). Usando gTTS como respaldo...")

        # 2. Respaldo: gTTS (Google Text-to-Speech básico)
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang=FALLBACK_VOICE_LANG, slow=(mood == "relajado"))
            tts.save(str(out_path))
            return out_path
        except Exception as gtts_err:
            raise RuntimeError(f"Error fatal en síntesis de audio: {gtts_err}")

    def synthesize_sync(self, text: str, mood: str = "energetico", filename: Optional[str] = None) -> Path:
        """Versión síncrona para simplificar el flujo en scripts sin bucle de eventos previo."""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            # Si ya hay un bucle corriendo, crear una tarea o usar nuevo thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                result = pool.submit(asyncio.run, self.synthesize(text, mood, filename)).result()
                return result
        else:
            return loop.run_until_complete(self.synthesize(text, mood, filename))

    def play_audio(self, audio_path: Path, block: bool = True):
        """
        Reproduce el archivo de audio utilizando pygame si está disponible.
        """
        self._init_pygame_mixer()
        try:
            import pygame
            if pygame.mixer.get_init():
                pygame.mixer.music.load(str(audio_path))
                pygame.mixer.music.play()
                if block:
                    while pygame.mixer.music.get_busy():
                        pygame.time.Clock().tick(10)
            else:
                print(f"[AudioEngine] Audio generado en: {audio_path} (reproductor no iniciado)")
        except Exception as e:
            print(f"[AudioEngine] No se pudo reproducir audio directamente: {e}")
            print(f"[AudioEngine] Archivo listo en: {audio_path}")

    @staticmethod
    def estimate_reading_time_seconds(text: str) -> float:
        """Estima la duración aproximada en segundos (basado en ~140 palabras por minuto)."""
        words = len(text.split())
        return round((words / 140.0) * 60.0, 1)
