"""
DemeRadio 94.9 FM - Módulo de Configuración (config.py)
Gestiona las variables de entorno, modelos de IA, configuraciones de audio y prompts.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Rutas del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "system_prompt.txt"
OUTPUT_AUDIO_DIR = BASE_DIR / "output_audio"

# Asegurar que el directorio de audio exista
OUTPUT_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Configuración de Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Configuración de la Emisora
STATION_NAME = "DemeRadio 94.9 FM"
COMMUNITY_NAME = "Comunidad de Demenishki"
DEFAULT_LANGUAGE = "es-ES"

# Configuración del Motor de Audio (edge-tts / gTTS)
# Voces recomendadas:
# - es-ES-AlvaroNeural (Enérgica, juvenil, estilo DJ español)
# - es-MX-JorgeNeural (Locutor dinámico mexicano)
# - es-ES-AbrilNeural (Voz femenina juvenil)
VOICE_NAME = os.getenv("DEMERADIO_VOICE", "es-ES-AlvaroNeural")
FALLBACK_VOICE_LANG = "es"

def load_system_prompt() -> str:
    """
    Carga el prompt del sistema desde prompts/system_prompt.txt.
    Si no existe, devuelve una plantilla por defecto con las directrices oficiales.
    """
    if SYSTEM_PROMPT_PATH.exists():
        with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read().strip()
    
    return (
        '[ROL]\n'
        'Eres el locutor oficial de "DemeRadio 94.9 FM", la emisora en español dedicada a la comunidad de Demenishki.\n'
        'Tu tono es divertido, enérgico, juvenil y con un toque de humor de internet/gaming.\n\n'
        '[OBJETIVO]\n'
        'Generar intervenciones de voz e interacciones de radio entre canciones o clips.\n'
        'Debes dar paso a la música, anunciar los nuevos Shorts traducidos y mantener a la audiencia entretenida.\n\n'
        '[PAUTAS DE ESTILO]\n'
        '1. Identifícate siempre con la frecuencia: "DemeRadio 94.9 FM".\n'
        '2. Mantén las intervenciones cortas y dinámicas (entre 15 y 30 segundos de lectura).\n'
        '3. Usa referencias de la comunidad (clips de juegos, VODs, la edición de subtítulos, fanarts).\n'
        '4. Evita sonar como un bot robótico; usa expresiones naturales de un DJ de radio nocturna/urbana.\n\n'
        '[FORMATO DE SALIDA]\n'
        'Proporciona la respuesta en formato JSON:\n'
        '{\n'
        '  "dialogo": "Texto que leerá el sintetizador de voz...",\n'
        '  "mood": "energetico | relajado | bromista",\n'
        '  "siguiente_pista": "categoria_musica_o_clip"\n'
        '}'
    )
