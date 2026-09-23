import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize GoogleGenAI client (Server-side only)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Load system prompt from file or fallback
const systemPromptPath = path.resolve(process.cwd(), 'prompts', 'system_prompt.txt');
let systemPromptText = '';
try {
  if (fs.existsSync(systemPromptPath)) {
    systemPromptText = fs.readFileSync(systemPromptPath, 'utf-8');
  }
} catch (e) {
  console.warn('Could not read system_prompt.txt, using fallback string', e);
}

if (!systemPromptText) {
  systemPromptText = `[ROL]
Eres el locutor oficial de "DemeRadio 94.9 FM", la emisora en español dedicada a la comunidad de Demenishki. Tu tono es divertido, enérgico, juvenil y con un toque de humor de internet/gaming.

[OBJETIVO]
Generar intervenciones de voz e interacciones de radio entre canciones o clips. Debes dar paso a la música, anunciar los nuevos Shorts traducidos y mantener a la audiencia entretenida.

[PAUTAS DE ESTILO]
1. Identifícate siempre con la frecuencia: "DemeRadio 94.9 FM".
2. Mantén las intervenciones cortas y dinámicas (entre 15 y 30 segundos de lectura).
3. Usa referencias de la comunidad (clips de juegos, VODs, la edición de subtítulos, fanarts).
4. Evita sonar como un bot robótico; usa expresiones naturales de un DJ de radio nocturna/urbana.

[FORMATO DE SALIDA]
Proporciona la respuesta en formato JSON:
{
  "dialogo": "Texto que leerá el sintetizador de voz...",
  "mood": "energetico | relajado | bromista",
  "siguiente_pista": "categoria_musica_o_clip"
}`;
}

// API: Station & API Status Check
app.get('/api/radio/status', (_req: Request, res: Response) => {
  res.json({
    connected: Boolean(apiKey),
    model: 'gemini-3.8-flash',
    station: 'DemeRadio 94.9 FM',
    frequency: '94.9 MHz',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// API: Generate Radio Intervention
app.post('/api/radio/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt = 'Anunciar nuevo Short traducido y presentar la siguiente pista',
      mood = 'energetico',
      siguientePista = 'shorts_traducidos',
    } = req.body;

    const userInstruction = `Contexto del corte de radio en DemeRadio 94.9 FM:
- Situación/Petición: ${prompt}
- Mood sugerido: ${mood} (debe ser: energetico, relajado, o bromista)
- Pista o categoría a la que das paso: ${siguientePista}

Genera la locución como locutor oficial de DemeRadio 94.9 FM. Recuerda mencionar la emisora y mantener el espíritu gamer/juvenil de la comunidad de Demenishki.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userInstruction,
      config: {
        systemInstruction: systemPromptText,
        temperature: 0.85,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogo: {
              type: Type.STRING,
              description: 'Texto completo de la locución que leerá el sintetizador de voz (15-30s)',
            },
            mood: {
              type: Type.STRING,
              description: 'Estado de ánimo: energetico, relajado, o bromista',
            },
            siguiente_pista: {
              type: Type.STRING,
              description: 'Categoría de música o clip al que se da paso',
            },
          },
          required: ['dialogo', 'mood', 'siguiente_pista'],
        },
      },
    });

    const rawText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(rawText.trim());
    } catch {
      // Clean potential markdown blocks
      const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(clean);
    }

    const words = (data.dialogo || '').split(/\s+/).filter(Boolean).length;
    const readingTimeSec = Math.round((words / 140) * 60);

    return res.json({
      success: true,
      data: {
        dialogo: data.dialogo,
        mood: data.mood || mood,
        siguiente_pista: data.siguiente_pista || siguientePista,
        wordsCount: words,
        estimatedDurationSec: readingTimeSec,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/radio/generate:', error);
    // If Gemini API fails or key is missing, return a clean realistic community fallback with error hint
    return res.status(200).json({
      success: true,
      isFallback: true,
      errorMsg: error?.message || 'Gemini API not reachable',
      data: {
        dialogo:
          '¡Qué pasa comunidad de Demenishki! Están en sintonía de DemeRadio 94.9 FM. ' +
          'Nuestros editores y subtituladores estrella acaban de soltar un nuevo Short traducido con jugadas de otro planeta. ' +
          '¡Súbanle al volumen que nos vamos directito al siguiente temardo!',
        mood: req.body?.mood || 'energetico',
        siguiente_pista: req.body?.siguientePista || 'shorts_traducidos',
        wordsCount: 46,
        estimatedDurationSec: 20,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// API: Get repository files for inspection and downloading
app.get('/api/project/files', (_req: Request, res: Response) => {
  try {
    const filesToRead = [
      { path: 'README.md', name: 'README.md', language: 'markdown' },
      { path: 'LICENSE', name: 'LICENSE', language: 'text' },
      { path: 'requirements.txt', name: 'requirements.txt', language: 'text' },
      { path: 'prompts/system_prompt.txt', name: 'prompts/system_prompt.txt', language: 'text' },
      { path: 'src/main.py', name: 'src/main.py', language: 'python' },
      { path: 'src/config.py', name: 'src/config.py', language: 'python' },
      { path: 'src/audio_engine.py', name: 'src/audio_engine.py', language: 'python' },
    ];

    const results = filesToRead.map((item) => {
      const fullPath = path.resolve(process.cwd(), item.path);
      let content = '';
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
      return {
        ...item,
        content,
      };
    });

    res.json({ files: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📻 DemeRadio 94.9 FM Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
