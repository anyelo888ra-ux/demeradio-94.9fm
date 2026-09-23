import React, { useState, useEffect } from 'react';
import { Volume2, Music, Sparkles } from 'lucide-react';
import { SOUNDBOARD_EFFECTS, playSynthesizedSfx, radioBedMusic } from '../utils/radioAudio';

export const Soundboard: React.FC = () => {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [isBedMusicActive, setIsBedMusicActive] = useState(false);

  useEffect(() => {
    return () => {
      radioBedMusic.stop();
    };
  }, []);

  const triggerSfx = (id: string) => {
    setActiveEffect(id);
    playSynthesizedSfx(id);
    setTimeout(() => {
      setActiveEffect((current) => (current === id ? null : current));
    }, 600);
  };

  const toggleBedMusic = () => {
    if (isBedMusicActive) {
      radioBedMusic.stop();
      setIsBedMusicActive(false);
    } else {
      radioBedMusic.start();
      setIsBedMusicActive(true);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Volume2 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Soundboard & Música de Fondo
            </h3>
            <p className="text-xs text-slate-400">
              Efectos sonoros de radio y cama musical con auto-ducking
            </p>
          </div>
        </div>

        {/* Toggle Lo-Fi Radio Bed Music */}
        <button
          onClick={toggleBedMusic}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
            isBedMusicActive
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title="Reproduce música relajante de fondo que baja el volumen automáticamente cuando el locutor habla"
        >
          <Music className={`w-3.5 h-3.5 ${isBedMusicActive ? 'animate-bounce text-purple-400' : ''}`} />
          <span>{isBedMusicActive ? 'Música Lo-Fi: ON (Ducking)' : 'Activar Cama Lo-Fi'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SOUNDBOARD_EFFECTS.map((sfx) => {
          const isActive = activeEffect === sfx.id;
          return (
            <button
              key={sfx.id}
              onClick={() => triggerSfx(sfx.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-200'
              }`}
              title={sfx.description}
            >
              <span className="text-lg">{sfx.icon}</span>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold truncate">{sfx.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{sfx.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
