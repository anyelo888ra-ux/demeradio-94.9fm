/**
 * DemeRadio 94.9 FM - Emisora Oficial y Locutor Virtual de la Comunidad de Demenishki
 * Consola de Transmisión en Vivo, Motor TTS Dinámico, Modo 24/7 y Exportación.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Mic,
  Play,
  Square,
  Sparkles,
  Volume2,
  Code2,
  BookOpen,
  Layers,
  Flame,
  Moon,
  Smile,
  Check,
  Copy,
  Clock,
  Music,
  Disc3,
  Sliders,
  Download,
  FileText,
  Repeat,
  RadioTower,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileJson,
} from 'lucide-react';
import { RadioDialVisualizer } from './components/RadioDialVisualizer';
import { Soundboard } from './components/Soundboard';
import { CodeExplorer } from './components/CodeExplorer';
import { PromptReference } from './components/PromptReference';
import {
  radioSpeechEngine,
  playSynthesizedSfx,
  RadioMood,
} from './utils/radioAudio';

interface RadioIntervention {
  dialogo: string;
  mood: RadioMood;
  siguiente_pista: string;
  wordsCount?: number;
  estimatedDurationSec?: number;
  timestamp?: string;
}

const PRESET_PROMPTS = [
  {
    title: '🚀 Nuevo Short Traducido',
    prompt: 'Anunciar el nuevo Short de Demenishki traducido al español con subtítulos de alta calidad y dar paso al clip',
    mood: 'energetico' as RadioMood,
    siguientePista: 'shorts_traducidos',
  },
  {
    title: '🎮 Pase a Clip Épico',
    prompt: 'Presentar una jugada maestra de clutch en un juego y mandar saludos a los viewers del directo',
    mood: 'energetico' as RadioMood,
    siguientePista: 'vod_highlights',
  },
  {
    title: '🌙 Momento Chill Nocturno',
    prompt: 'Conectar con el chat en una noche tranquila de streaming, dar paso a música relajante lo-fi para estudiar o jugar',
    mood: 'relajado' as RadioMood,
    siguientePista: 'lofi_gaming',
  },
  {
    title: '😂 Fail Gracioso / Bromista',
    prompt: 'Contar con humor el fail del último VOD donde Demenishki la lió en directo y dar paso al siguiente temardo',
    mood: 'bromista' as RadioMood,
    siguientePista: 'fail_del_dia',
  },
  {
    title: '🎨 Fanarts y Editores',
    prompt: 'Agradecer a los editores que traducen los vídeos y a los artistas que mandan fanarts al Discord oficial',
    mood: 'energetico' as RadioMood,
    siguientePista: 'comunidad_hype',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'code' | 'prompt'>('studio');

  // Input state
  const [customPrompt, setCustomPrompt] = useState(
    'Anunciar el nuevo Short traducido con subtítulos legendarios y dar paso a la música de la comunidad'
  );
  const [selectedMood, setSelectedMood] = useState<RadioMood>('energetico');
  const [siguientePista, setSiguientePista] = useState('shorts_traducidos');
  const [playJingleWithSpeech, setPlayJingleWithSpeech] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<RadioIntervention>({
    dialogo:
      '¡Qué onda gente de Demenishki! Están en sintonía de DemeRadio 94.9 FM. ' +
      'Nuestros editores acaban de soltar un nuevo Short traducido con subtítulos legendarios. ' +
      'Preparen sus auriculares porque se viene una jugada épica. ¡Súbanle al volumen y que empiece la música!',
    mood: 'energetico',
    siguiente_pista: 'shorts_traducidos',
    wordsCount: 42,
    estimatedDurationSec: 18,
    timestamp: new Date().toLocaleTimeString(),
  });

  // History state
  const [history, setHistory] = useState<RadioIntervention[]>([]);

  // Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedDialogo, setCopiedDialogo] = useState(false);
  const [spanishVoices, setSpanishVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // 24/7 Auto-Radio Mode State
  const [isAutoRadio, setIsAutoRadio] = useState<boolean>(false);
  const [autoIntervalSec, setAutoIntervalSec] = useState<number>(35);
  const [countdown, setCountdown] = useState<number>(35);
  const autoRadioTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const currentPresetIndexRef = useRef<number>(0);

  // API Status State
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    model: string;
    pingMs: number | null;
  }>({
    connected: true,
    model: 'gemini-3.8-flash',
    pingMs: null,
  });

  // Check API status & voices on mount
  useEffect(() => {
    radioSpeechEngine.setOnStateChange((speaking) => {
      setIsSpeaking(speaking);
    });

    const updateVoices = () => {
      const voices = radioSpeechEngine.getAvailableSpanishVoices();
      setSpanishVoices(voices);
      if (voices.length > 0 && !selectedVoiceName) {
        setSelectedVoiceName(voices[0].name);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Ping API
    const start = performance.now();
    fetch('/api/radio/status')
      .then((res) => res.json())
      .then((data) => {
        const diff = Math.round(performance.now() - start);
        setApiStatus({
          connected: data.connected !== false,
          model: data.model || 'gemini-3.8-flash',
          pingMs: diff,
        });
      })
      .catch(() => {
        setApiStatus({
          connected: false,
          model: 'gemini-3.8-flash (Offline Mode)',
          pingMs: null,
        });
      });

    return () => {
      radioSpeechEngine.stop();
      if (autoRadioTimerRef.current) clearInterval(autoRadioTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Handle Mood change with realistic radio static burst SFX
  const handleMoodChange = (newMood: RadioMood) => {
    setSelectedMood(newMood);
    playSynthesizedSfx('static');
  };

  // Generate an intervention
  const handleGenerate = async (presetPrompt?: string, presetMood?: RadioMood, presetPista?: string) => {
    const promptToUse = presetPrompt || customPrompt;
    const moodToUse = presetMood || selectedMood;
    const pistaToUse = presetPista || siguientePista;

    if (!promptToUse.trim()) return;
    setIsGenerating(true);
    radioSpeechEngine.stop();

    try {
      const res = await fetch('/api/radio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          mood: moodToUse,
          siguientePista: pistaToUse,
        }),
      });

      const json = await res.json();
      if (json.data) {
        const item: RadioIntervention = {
          ...json.data,
          mood: json.data.mood || moodToUse,
          siguiente_pista: json.data.siguiente_pista || pistaToUse,
          timestamp: new Date().toLocaleTimeString(),
        };
        setCurrentIntervention(item);
        setHistory((prev) => [item, ...prev.slice(0, 14)]);

        // Speak the speech automatically
        radioSpeechEngine.speak(item.dialogo, item.mood, selectedVoiceName, playJingleWithSpeech);
      }
    } catch (err) {
      console.error('Error generating radio cut:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle 24/7 Automated Radio Mode
  const toggleAutoRadio = () => {
    if (isAutoRadio) {
      // Turn OFF
      setIsAutoRadio(false);
      if (autoRadioTimerRef.current) clearInterval(autoRadioTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    } else {
      // Turn ON
      setIsAutoRadio(true);
      setCountdown(autoIntervalSec);
      playSynthesizedSfx('jingle');

      // Trigger first immediately
      const currentPreset = PRESET_PROMPTS[currentPresetIndexRef.current % PRESET_PROMPTS.length];
      currentPresetIndexRef.current++;
      handleGenerate(currentPreset.prompt, currentPreset.mood, currentPreset.siguientePista);

      // Countdown ticker
      let remaining = autoIntervalSec;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          remaining = autoIntervalSec;
          // Trigger next preset
          const nextPreset = PRESET_PROMPTS[currentPresetIndexRef.current % PRESET_PROMPTS.length];
          currentPresetIndexRef.current++;
          handleGenerate(nextPreset.prompt, nextPreset.mood, nextPreset.siguientePista);
        }
        setCountdown(remaining);
      }, 1000);
    }
  };

  const handlePlayVoice = () => {
    if (isSpeaking) {
      radioSpeechEngine.stop();
    } else {
      radioSpeechEngine.speak(
        currentIntervention.dialogo,
        currentIntervention.mood,
        selectedVoiceName,
        playJingleWithSpeech
      );
    }
  };

  const handleStopVoice = () => {
    radioSpeechEngine.stop();
  };

  const handleCopyJson = async () => {
    const payload = {
      dialogo: currentIntervention.dialogo,
      mood: currentIntervention.mood,
      siguiente_pista: currentIntervention.siguiente_pista,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyDialogo = async () => {
    try {
      await navigator.clipboard.writeText(currentIntervention.dialogo);
      setCopiedDialogo(true);
      setTimeout(() => setCopiedDialogo(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export functions
  const handleExportCurrentTxt = () => {
    const content =
      `====================================================\n` +
      `📻 DEMERADIO 94.9 FM - CORTE DE EMISIÓN OFICIAL\n` +
      `====================================================\n\n` +
      `Fecha/Hora: ${currentIntervention.timestamp || new Date().toLocaleString()}\n` +
      `Mood: ${currentIntervention.mood.toUpperCase()}\n` +
      `Siguiente Pista: ${currentIntervention.siguiente_pista}\n` +
      `Duración estimada: ~${currentIntervention.estimatedDurationSec || 20}s (${currentIntervention.wordsCount || 40} palabras)\n\n` +
      `[GUIÓN PARA LOCUTOR]:\n` +
      `"${currentIntervention.dialogo}"\n\n` +
      `====================================================\n` +
      `DemeRadio 94.9 FM • Comunidad de Demenishki (MIT License)\n`;

    downloadBlob(content, `demeradio_guion_${Date.now()}.txt`, 'text/plain;charset=utf-8');
  };

  const handleExportCurrentJson = () => {
    const payload = {
      estacion: 'DemeRadio 94.9 FM',
      timestamp: currentIntervention.timestamp || new Date().toISOString(),
      dialogo: currentIntervention.dialogo,
      mood: currentIntervention.mood,
      siguiente_pista: currentIntervention.siguiente_pista,
      duracion_estimada_segundos: currentIntervention.estimatedDurationSec || 20,
      palabras: currentIntervention.wordsCount || 42,
    };
    downloadBlob(JSON.stringify(payload, null, 2), `demeradio_corte_${Date.now()}.json`, 'application/json');
  };

  const handleExportHistoryJson = () => {
    const listToExport = history.length > 0 ? history : [currentIntervention];
    const payload = {
      emisora: 'DemeRadio 94.9 FM',
      comunidad: 'Demenishki',
      fecha_exportacion: new Date().toISOString(),
      total_cortes: listToExport.length,
      cortes: listToExport,
    };
    downloadBlob(JSON.stringify(payload, null, 2), `demeradio_escaleta_completa_${Date.now()}.json`, 'application/json');
  };

  const handleExportHistoryTxt = () => {
    const listToExport = history.length > 0 ? history : [currentIntervention];
    let output =
      `===============================================================\n` +
      `📻 DEMERADIO 94.9 FM - ESCALETA COMPLETA DE TRANSMISIÓN\n` +
      `===============================================================\n` +
      `Fecha: ${new Date().toLocaleString()}\n` +
      `Total de intervenciones registradas: ${listToExport.length}\n\n`;

    listToExport.forEach((item, index) => {
      output +=
        `---------------------------------------------------------------\n` +
        `CORTE #${listToExport.length - index} | HORA: ${item.timestamp || '00:00'} | MOOD: ${item.mood.toUpperCase()} | PASO A: ${item.siguiente_pista}\n` +
        `---------------------------------------------------------------\n` +
        `"${item.dialogo}"\n\n`;
    });

    output += `===============================================================\nFIN DE LA ESCALETA\n`;
    downloadBlob(output, `demeradio_escaleta_radio_${Date.now()}.txt`, 'text/plain;charset=utf-8');
  };

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyPreset = (preset: (typeof PRESET_PROMPTS)[0]) => {
    setCustomPrompt(preset.prompt);
    setSelectedMood(preset.mood);
    setSiguientePista(preset.siguientePista);
    playSynthesizedSfx('static');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  DemeRadio <span className="text-cyan-400 font-mono">94.9 FM</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  Oficial
                </span>

                {/* API Status Badge */}
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  title="Conexión de IA optimizada con baja latencia"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Gemini Flash En Vivo {apiStatus.pingMs ? `(${apiStatus.pingMs}ms)` : ''}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                La voz oficial de la comunidad de Demenishki
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Cabina en Vivo</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código Open Source</span>
            </button>

            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'prompt'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pautas & Prompt</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Top Dial Visualizer with Oscilloscope Waveform Canvas */}
            <RadioDialVisualizer
              isSpeaking={isSpeaking}
              frequency="94.9 FM"
              stationName="DemeRadio"
              mood={currentIntervention.mood}
              isAutoRadioActive={isAutoRadio}
            />

            {/* 24/7 Auto-Radio Banner Control */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-800/50 shadow-xl">
              <div className="flex items-center gap-3">
                <span
                  className={`p-2.5 rounded-xl border ${
                    isAutoRadio
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <RadioTower className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Modo Transmisión Automática 24/7
                    </h3>
                    {isAutoRadio && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Próximo corte en {countdown}s
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {isAutoRadio
                      ? 'Emisión continua activa: la IA genera y reproduce guiones alternando clips, shorts y comunidad.'
                      : 'Activa la emisión automática desatendida para simular una emisora real transmitiendo sin parar.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                  <span className="text-slate-400">Intervalo:</span>
                  <select
                    value={autoIntervalSec}
                    disabled={isAutoRadio}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAutoIntervalSec(val);
                      setCountdown(val);
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none disabled:opacity-50"
                  >
                    <option value={20}>20 seg</option>
                    <option value={35}>35 seg</option>
                    <option value={50}>50 seg</option>
                    <option value={75}>75 seg</option>
                  </select>
                </div>

                <button
                  onClick={toggleAutoRadio}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                    isAutoRadio
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                  }`}
                >
                  <Repeat className={`w-3.5 h-3.5 ${isAutoRadio ? 'animate-spin' : ''}`} />
                  <span>{isAutoRadio ? 'Detener Modo 24/7' : 'Iniciar Radio 24/7'}</span>
                </button>
              </div>
            </div>

            {/* Main Studio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Generator Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Control Panel */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      Generador de Cortes e Intervenciones
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Indica el evento, clip o anuncio de la comunidad para que el locutor elabore la locución (15-30s).
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wider">
                      Plantillas Rápidas de Emisión:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_PROMPTS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyPreset(preset)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Context prompt input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Contexto del Corte o Anuncio de Radio:
                    </label>
                    <textarea
                      rows={3}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Ej: Anunciar que se subió un nuevo short traducido y mandar saludos al chat de Twitch..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
                    />
                  </div>

                  {/* Mood and Track Category Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mood Selector (Plays static sound on change) */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                        Estado de Ánimo (Mood):
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoodChange('energetico')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedMood === 'energetico'
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Flame className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                          <span className="text-[11px] block">Energético</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoodChange('relajado')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedMood === 'relajado'
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Moon className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                          <span className="text-[11px] block">Relajado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoodChange('bromista')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedMood === 'bromista'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Smile className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                          <span className="text-[11px] block">Bromista</span>
                        </button>
                      </div>
                    </div>

                    {/* Siguiente Pista */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                        Siguiente Pista o Clip:
                      </label>
                      <select
                        value={siguientePista}
                        onChange={(e) => setSiguientePista(e.target.value)}
                        className="w-full h-[58px] rounded-xl bg-slate-950 border border-slate-800 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                      >
                        <option value="shorts_traducidos">📹 shorts_traducidos (Estrenos YouTube/TikTok)</option>
                        <option value="vod_highlights">🎮 vod_highlights (Clips épicos de juego)</option>
                        <option value="lofi_gaming">🎧 lofi_gaming (Beats para directos)</option>
                        <option value="fail_del_dia">💥 fail_del_dia (Momentos cómicos)</option>
                        <option value="comunidad_hype">🔥 comunidad_hype (Fanarts y agradecimientos)</option>
                      </select>
                    </div>
                  </div>

                  {/* Speech and voice options */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={playJingleWithSpeech}
                        onChange={(e) => setPlayJingleWithSpeech(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Tocar jingle de radio antes de hablar</span>
                    </label>

                    {spanishVoices.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Voz:</span>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => setSelectedVoiceName(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 focus:outline-none max-w-[200px] truncate"
                        >
                          {spanishVoices.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.name.slice(0, 22)} ({v.lang})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Big Action Button */}
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !customPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Disc3 className="w-5 h-5 animate-spin" />
                        <span>Locutor en directo redactando corte...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        <span>GENERAR CORTE EN VIVO (94.9 FM)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Soundboard Component with Lo-Fi background music bed */}
                <Soundboard />
              </div>

              {/* Right Column: On-Air Live Player & JSON Output (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Active Broadcast Box */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Mic className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Intervención en Cabina
                        </h3>
                        <div className="text-[11px] text-slate-400">
                          {currentIntervention.timestamp} • Siguiente:{' '}
                          <span className="text-cyan-400 font-mono">
                            {currentIntervention.siguiente_pista}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        currentIntervention.mood === 'energetico'
                          ? 'bg-amber-500/20 text-amber-300'
                          : currentIntervention.mood === 'relajado'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {currentIntervention.mood}
                    </span>
                  </div>

                  {/* Speech Text Box */}
                  <div className="relative p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm leading-relaxed text-slate-200">
                    <div className="text-slate-100 font-medium whitespace-pre-wrap">
                      "{currentIntervention.dialogo}"
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        ~{currentIntervention.estimatedDurationSec || 20}s de lectura (
                        {currentIntervention.wordsCount || 42} palabras)
                      </span>

                      <button
                        onClick={handleCopyDialogo}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copiar texto de locución"
                      >
                        {copiedDialogo ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar texto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Real Voice Player Controls */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handlePlayVoice}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        isSpeaking
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-4 h-4 fill-current" />
                          <span>Pausar Locutor</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Escuchar al Locutor</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleStopVoice}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Detener reproducción"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Export Options for this script */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">Exportar este corte:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleExportCurrentTxt}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                        title="Descargar guión en archivo de texto plano"
                      >
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>.txt</span>
                      </button>

                      <button
                        onClick={handleExportCurrentJson}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                        title="Descargar objeto estructurado en formato JSON"
                      >
                        <FileJson className="w-3 h-3 text-purple-400" />
                        <span>.json</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* JSON Output Viewer */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        Payload JSON de Salida
                      </span>
                    </div>

                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-mono">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="font-mono">Copiar JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs overflow-x-auto text-purple-300 border border-slate-800/80">
                    <pre>
                      {JSON.stringify(
                        {
                          dialogo: currentIntervention.dialogo,
                          mood: currentIntervention.mood,
                          siguiente_pista: currentIntervention.siguiente_pista,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Estructura estricta para scripts en Python, automatización de OBS o bots de Discord.
                  </p>
                </div>
              </div>
            </div>

            {/* Broadcast History Strip with Escaleta Export */}
            {history.length > 0 && (
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Historial de Cortes y Escaleta
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">({history.length} emitidos)</span>
                  </div>

                  {/* Export history buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportHistoryTxt}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      title="Descargar escaleta completa con timestamps en .txt"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Exportar Escaleta (.txt)</span>
                    </button>

                    <button
                      onClick={handleExportHistoryJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      title="Descargar historial de cortes en archivo .json"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-400" />
                      <span>Exportar Historial (.json)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-cyan-400">{item.siguiente_pista}</span>
                        <span className="text-slate-500">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">"{item.dialogo}"</p>
                      <button
                        onClick={() => {
                          setCurrentIntervention(item);
                          radioSpeechEngine.speak(
                            item.dialogo,
                            item.mood,
                            selectedVoiceName,
                            playJingleWithSpeech
                          );
                        }}
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Re-emitir este corte</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && <CodeExplorer />}

        {activeTab === 'prompt' && <PromptReference />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            📻 <strong>DemeRadio 94.9 FM</strong> • La emisora oficial de la comunidad de Demenishki
          </span>
          <span className="font-mono text-slate-600">
            Licencia MIT • Open Source Project • Python & Node.js
          </span>
        </div>
      </footer>
    </div>
  );
}
