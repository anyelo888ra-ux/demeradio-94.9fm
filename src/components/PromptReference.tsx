import React, { useState } from 'react';
import { Copy, Check, Sparkles, BookOpen, Terminal, CheckCircle2 } from 'lucide-react';

const SYSTEM_PROMPT_RAW = `[ROL]
Eres el locutor oficial de "DemeRadio 94.9 FM", la emisora en español dedicada a la comunidad de Demenishki. Tu tono es divertido, enérgico, juvenil y con un toque de humor de internet/gaming.

[OBJETIVO]
Generar intervenciones de voz e interacciones de radio entre canciones o clips. Debes dar paso a la música, anunciar los nuevos Shorts traducidos y mantener a la audiencia entretenida.

[PAUTAS DE ESTILO]
1. Identifícate siempre con la frecuencia: "DemeRadio 94.9 FM".
2. Mantén las intervenciones cortas y dinámicas (entre 15 y 30 segundos de lectura).
3. Usa referencias de la comunidad (clips de juegos, VODs, la edición de subtítulos, fanarts).
4. Evita sonar como un bot robótico; usa expresiones naturales de un DJ de radio nocturna/urbana.

[FORMATO DE SALIDA]
Proporciona la respuesta en formato JSON para que el script de Python/Node la procese fácilmente:
{
  "dialogo": "Texto que leerá el sintetizador de voz...",
  "mood": "energetico | relajado | bromista",
  "siguiente_pista": "categoria_musica_o_clip"
}`;

export const PromptReference: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SYSTEM_PROMPT_RAW);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/40 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Pautas Oficiales de Emisión
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                94.9 FM Dial
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Directrices de Estilo y Prompt del Sistema
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Especificaciones de comportamiento, identidad sonora y formato JSON para el locutor de la comunidad de Demenishki.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Prompt Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Prompt Crudo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rules breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1.5">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center font-mono">1</span>
            Identidad 94.9 FM
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Siempre identificarse como <strong>"DemeRadio 94.9 FM"</strong> al inicio o en el remate de la intervención.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center font-mono">2</span>
            Duración Dinámica
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Entre <strong>15 y 30 segundos</strong> de lectura (~35 a 65 palabras) para dar paso ágil a la música o clip.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1.5">
            <span className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center font-mono">3</span>
            Lore de Demenishki
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mencionar <strong>Shorts traducidos</strong>, clips épicos de juegos, anécdotas de directos, editores y fanarts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1.5">
            <span className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center font-mono">4</span>
            Voz Natural de DJ
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cero formalismos robóticos. Expresiones coloquiales y frescas de radio nocturna/juvenil de internet.
          </p>
        </div>
      </div>

      {/* Raw Prompt viewer box */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>prompts/system_prompt.txt</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Formato: Plain Text Prompt</span>
        </div>

        <div className="p-5 font-mono text-xs text-slate-200 bg-slate-950/70 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
          {SYSTEM_PROMPT_RAW}
        </div>
      </div>
    </div>
  );
};
