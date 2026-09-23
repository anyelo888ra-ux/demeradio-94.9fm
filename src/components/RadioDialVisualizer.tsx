import React, { useEffect, useState } from 'react';
import { Radio, Activity, Mic, Disc3 } from 'lucide-react';
import { WaveformCanvas } from './WaveformCanvas';
import { RadioMood } from '../utils/radioAudio';

interface RadioDialVisualizerProps {
  isSpeaking: boolean;
  frequency?: string;
  stationName?: string;
  mood?: RadioMood;
  isAutoRadioActive?: boolean;
}

export const RadioDialVisualizer: React.FC<RadioDialVisualizerProps> = ({
  isSpeaking,
  frequency = '94.9 FM',
  stationName = 'DemeRadio',
  mood = 'energetico',
  isAutoRadioActive = false,
}) => {
  const [bars, setBars] = useState<number[]>([15, 25, 40, 60, 45, 30, 20, 10]);

  useEffect(() => {
    let interval: any;
    if (isSpeaking) {
      interval = setInterval(() => {
        setBars([
          Math.floor(20 + Math.random() * 70),
          Math.floor(35 + Math.random() * 60),
          Math.floor(45 + Math.random() * 55),
          Math.floor(60 + Math.random() * 40),
          Math.floor(50 + Math.random() * 50),
          Math.floor(40 + Math.random() * 55),
          Math.floor(25 + Math.random() * 65),
          Math.floor(15 + Math.random() * 45),
        ]);
      }, 90);
    } else {
      setBars([8, 12, 16, 18, 15, 12, 10, 6]);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const getMoodColor = () => {
    if (mood === 'energetico') return 'from-amber-400 via-rose-500 to-pink-500';
    if (mood === 'relajado') return 'from-cyan-400 via-blue-500 to-indigo-500';
    return 'from-emerald-400 via-teal-500 to-cyan-500';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-2xl space-y-4">
      {/* Ambient background glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
          isSpeaking ? 'bg-cyan-400 opacity-40 scale-125' : 'bg-blue-600'
        }`}
      />

      {/* Top Station Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/25">
            <Radio className="w-6 h-6 animate-pulse" />
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-900" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                {frequency}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors ${
                  isSpeaking
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                {isSpeaking ? 'ON AIR • LOCUCIÓN EN VIVO' : 'CABINA LISTA'}
              </span>

              {isAutoRadioActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  PROGRAMA AUTO 24/7
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {stationName} • Emisora Oficial de la Comunidad de Demenishki
            </p>
          </div>
        </div>

        {/* Studio Status Pills */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Disc3 className={`w-3.5 h-3.5 text-cyan-400 ${isSpeaking ? 'animate-spin' : ''}`} />
            <span>FM STEREO 320k</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>94.90 MHz</span>
          </div>
        </div>
      </div>

      {/* Live Waveform Oscilloscope */}
      <WaveformCanvas isSpeaking={isSpeaking} mood={mood} />

      {/* Simulated FM Dial Scale */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 select-none">
          <span>88.0</span>
          <span>90.5</span>
          <span>92.7</span>
          <span className="text-cyan-400 font-bold underline underline-offset-4">94.9 FM</span>
          <span>98.3</span>
          <span>102.1</span>
          <span>108.0</span>
        </div>

        <div className="relative h-5 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center px-2">
          <div className="absolute inset-0 flex justify-between items-center px-3 opacity-20 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className={`w-0.5 bg-slate-400 ${i % 4 === 0 ? 'h-3' : 'h-1.5'}`}
              />
            ))}
          </div>

          <div className="absolute left-[52%] -translate-x-1/2 flex flex-col items-center z-10">
            <div className="w-1.5 h-4 bg-cyan-400 shadow-lg shadow-cyan-400/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Mic className={`w-4 h-4 ${isSpeaking ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          <span>Voz del Locutor:</span>
          <span className="font-semibold text-slate-200 capitalize">{mood}</span>
        </div>

        <div className="flex items-end gap-1.5 h-6">
          {bars.map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}%` }}
              className={`w-2 rounded-t transition-all duration-100 bg-gradient-to-t ${getMoodColor()} ${
                isSpeaking ? 'opacity-100 shadow-sm shadow-cyan-400/30' : 'opacity-30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
