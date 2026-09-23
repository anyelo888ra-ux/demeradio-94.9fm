import React, { useEffect, useRef } from 'react';
import { RadioMood } from '../utils/radioAudio';

interface WaveformCanvasProps {
  isSpeaking: boolean;
  mood: RadioMood;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ isSpeaking, mood }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const getColors = () => {
      if (mood === 'energetico') {
        return {
          primary: '#f43f5e', // rose
          secondary: '#fbbf24', // amber
          glow: 'rgba(244, 63, 94, 0.45)',
        };
      } else if (mood === 'relajado') {
        return {
          primary: '#06b6d4', // cyan
          secondary: '#3b82f6', // blue
          glow: 'rgba(6, 182, 212, 0.45)',
        };
      } else {
        return {
          primary: '#10b981', // emerald
          secondary: '#14b8a6', // teal
          glow: 'rgba(16, 185, 129, 0.45)',
        };
      }
    };

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const colors = getColors();

      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 10; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Center Baseline
      const centerY = height / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Spectrum Bars in background
      const barCount = 48;
      const barWidth = width / barCount;
      const amplitudeFactor = isSpeaking ? 1.0 : 0.15;

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const normalizedX = (i - barCount / 2) / (barCount / 2);
        const bellCurve = Math.exp(-Math.pow(normalizedX * 1.8, 2));

        const barHeight =
          Math.sin(phase * 2 + i * 0.4) * 12 * amplitudeFactor +
          Math.cos(phase * 1.5 + i * 0.25) * 8 * amplitudeFactor +
          (isSpeaking ? Math.random() * 16 : 3) * bellCurve;

        const grad = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        grad.addColorStop(0, colors.secondary);
        grad.addColorStop(0.5, colors.primary);
        grad.addColorStop(1, colors.secondary);

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, centerY - Math.abs(barHeight), barWidth - 2, Math.abs(barHeight) * 2);
      }

      // Glowing Sine Wave Line 1
      ctx.shadowBlur = isSpeaking ? 14 : 4;
      ctx.shadowColor = colors.glow;
      ctx.lineWidth = isSpeaking ? 2.5 : 1.5;
      ctx.strokeStyle = colors.primary;

      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const norm = x / width;
        const envelope = Math.sin(norm * Math.PI); // tapering edges
        const waveAmp = isSpeaking ? 22 : 4;

        const y =
          centerY +
          Math.sin(norm * 14 + phase * 4) * waveAmp * envelope +
          Math.sin(norm * 28 + phase * 2.5) * (waveAmp * 0.45) * envelope;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing Sine Wave Line 2 (inverted / harmonic)
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = isSpeaking ? 1.8 : 1.0;
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const norm = x / width;
        const envelope = Math.sin(norm * Math.PI);
        const waveAmp = isSpeaking ? 16 : 3;

        const y =
          centerY -
          Math.sin(norm * 18 - phase * 3) * waveAmp * envelope -
          Math.cos(norm * 32 + phase * 2) * (waveAmp * 0.4) * envelope;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      phase += isSpeaking ? 0.08 : 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, mood]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-950/90 border border-slate-800/80 shadow-inner">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
        <span
          className={`w-2 h-2 rounded-full ${
            isSpeaking ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
          }`}
        />
        <span>{isSpeaking ? 'MODULACIÓN DE ONDA EN VIVO' : 'ESPECTRO EN ESPERA • 94.9 FM'}</span>
      </div>

      <div className="absolute top-2 right-3 z-10 text-[10px] font-mono text-slate-500">
        {isSpeaking ? 'AUDIO ANALYZER: ACTIVO' : 'MODO: STANDBY'}
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={88}
        className="w-full h-[72px] sm:h-[84px] block"
      />
    </div>
  );
};
