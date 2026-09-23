# 📻 DemeRadio 94.9 FM

> **La emisora en español dedicada a la comunidad de Demenishki.**
> Locutor virtual con Inteligencia Artificial que genera intervenciones dinámicas, divertidas y enérgicas entre pistas musicales, clips de directos y estrenos de Shorts traducidos.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: >=3.10](https://img.shields.io/badge/Python->=3.10-blue.svg)](https://www.python.org/)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)

---

## 📋 Descripción y Rol

DemeRadio 94.9 FM actúa como el DJ y locutor oficial para streams, radios comunitarias y vídeos de la comunidad de Demenishki. Su tono es juvenil, dinámico y con humor sano de internet y gaming.

### 🎯 Objetivos Principales
1. **Identidad Sonora**: Siempre se identifica con la frecuencia oficial: *"DemeRadio 94.9 FM"*.
2. **Intervenciones Ágiles**: Locuciones de 15 a 30 segundos ideales para radio fórmula.
3. **Referencias a la Comunidad**: Clips de juegos, anécdotas de VODs, trabajo de los editores y traductores de Shorts, y fanarts.
4. **Formato JSON Estricto**: Diseñado para ser consumido e integrado fácilmente en bots de Discord, OBS, scripts de automatización de radio o streaming continuo.

---

## 📁 Estructura del Proyecto

```text
├── LICENSE                 # Licencia MIT Open Source
├── README.md               # Documentación completa del proyecto
├── requirements.txt        # Dependencias de Python
├── prompts/
│   └── system_prompt.txt   # Prompt del sistema con rol, pautas y esquema JSON
└── src/
    ├── main.py             # Script principal ejecutable (CLI y generador)
    ├── config.py           # Gestión de variables de entorno y configuración
    └── audio_engine.py     # Motor de síntesis vocal (edge-tts / gTTS) y modulación de pitch/rate
```

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/demeradio-94-9fm.git
cd demeradio-94-9fm
```

### 2. Crear entorno virtual (Recomendado)
```bash
python -m venv venv
# En Linux / macOS:
source venv/bin/activate
# En Windows:
venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar la clave de API
Crea un archivo `.env` en la raíz del proyecto (o copia `.env.example`):
```env
GEMINI_API_KEY="tu_gemini_api_key_aqui"
GEMINI_MODEL="gemini-2.5-flash"
DEMERADIO_VOICE="es-ES-AlvaroNeural"
```

---

## 🎙️ Uso Rápido (CLI)

### Generar una intervención estándar y sintetizarla a MP3:
```bash
python src/main.py --prompt "Anunciar nuevo Short traducido y mandar ánimos a los editores" --mood energetico
```

### Opciones de la línea de comandos:
- `--prompt`: Tema, evento o petición para la locución.
- `--mood`: Estado de ánimo: `energetico`, `relajado` o `bromista`.
- `--siguiente-pista`: Categoría a anunciar (ej. `shorts_traducidos`, `lofi_gaming`, `vod_highlights`).
- `--play`: Reproducir el audio directamente tras sintetizarlo.
- `--no-audio`: Emitir únicamente el objeto JSON sin generar el archivo MP3.

---

## 📦 Formato de Salida JSON

El motor responde con un objeto estructurado:

```json
{
  "dialogo": "¡Qué onda gente de Demenishki! Están en sintonía de DemeRadio 94.9 FM. Si pensaban que hoy no había contenido, agárrense porque los editores acaban de soltar un Short traducido fresquísimo. ¡Vamos con ese clip legendario!",
  "mood": "energetico",
  "siguiente_pista": "shorts_traducidos"
}
```

---

## 🔊 Motor de Audio (`audio_engine.py`)

El motor incluye modulación dinámica según el `mood`:
- **`energetico`**: Velocidad +12%, Tono +5Hz (ideal para subidones y clips de acción).
- **`relajado`**: Velocidad -6%, Tono -3Hz (ideal para bloques nocturnos y sesiones de charla).
- **`bromista`**: Velocidad +6%, Tono +2Hz (ideal para fallos en streams y anécdotas).

Soporta voces neurales de alta definición con `edge-tts` (ej: `es-ES-AlvaroNeural`, `es-MX-JorgeNeural`) y respaldo automático en `gTTS`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
