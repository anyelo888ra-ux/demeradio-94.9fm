/**
 * DemeRadio 94.9 FM - Motor de Audio para Navegador (Web Audio & Speech)
 * Proporciona síntesis vocal, efectos de sonido de cabina (jingles, airhorn, scratch, static, aplausos, risas),
 * cama musical de radio con auto-ducking y filtro de transmisión FM.
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type RadioMood = 'energetico' | 'relajado' | 'bromista';

export interface SoundboardEffect {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const SOUNDBOARD_EFFECTS: SoundboardEffect[] = [
  { id: 'jingle', name: 'Jingle 94.9 FM', icon: '📻', description: 'Sintonía de identificación oficial' },
  { id: 'airhorn', name: 'Airhorn Hype', icon: '🎺', description: 'Bocina de stream para momentos cumbre' },
  { id: 'static', name: 'Estática Dial', icon: '⚡', description: 'Ruido de sintonización de frecuencia' },
  { id: 'scratch', name: 'Vinyl Scratch', icon: '🎧', description: 'Frenazo de disco para giros cómicos' },
  { id: 'applause', name: 'Aplausos Chat', icon: '👏', description: 'Ovación del público y espectadores' },
  { id: 'laughter', name: 'Risas Stream', icon: '😂', description: 'Risas para momentos de fail o meme' },
  { id: 'laser', name: 'Deme Laser', icon: '🔫', description: 'Efecto futurista de gaming' },
  { id: 'bell', name: 'Alerta Shorts', icon: '🔔', description: 'Notificación de nuevo short traducido' },
];

/**
 * Reproduce efectos de audio sintetizados puramente con Web Audio API.
 */
export function playSynthesizedSfx(effectId: string) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (effectId) {
      case 'jingle': {
        // Acorde armónico de radio (Do - Mi - Sol - Do agudo)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.42);
        });
        break;
      }

      case 'airhorn': {
        const freqs = [466.16, 622.25, 739.99]; // Bb4, Eb5, Gb5
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now);
          osc.frequency.exponentialRampToValueAtTime(f * 1.03, now + 0.1);
          osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + 0.4);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.setValueAtTime(0.12, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.56);
        });
        break;
      }

      case 'static': {
        const bufferSize = Math.floor(ctx.sampleRate * 0.18);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(2.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.19);
        break;
      }

      case 'scratch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'applause': {
        // Simulación acústica de multitud aplaudiendo (ráfagas aleatorias de ruido blanco filtrado)
        const duration = 1.4;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // Grano denso para imitar múltiples palmadas
          const clap = Math.random() > 0.94 ? (Math.random() * 2 - 1) * 2.5 : Math.random() * 0.4 - 0.2;
          data[i] = clap;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(1.2, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
        gain.gain.setValueAtTime(0.2, now + 0.9);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
        break;
      }

      case 'laughter': {
        // Efecto cómico tipo cartoon giggle / risa de streamer
        const pitches = [440, 520, 480, 560, 490, 530, 450];
        pitches.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          const t = now + i * 0.11;

          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.08);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.1);
        });
        break;
      }

      case 'laser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.21);
        break;
      }

      case 'bell': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now);
        osc.frequency.setValueAtTime(1760.0, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.46);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.warn('Audio effect playback error:', err);
  }
}

/**
 * Cama musical de fondo (Lo-Fi Radio Bed) sintetizada con Web Audio.
 * Incluye auto-ducking: cuando el locutor habla, baja el volumen suavemente.
 */
class RadioBedMusic {
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private intervalId: any = null;
  private step = 0;

  // Progresión Lo-Fi de acordes cálidos (Fmaj7, Em7, Dm7, Cmaj7)
  private chords = [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [164.81, 196.0, 246.94, 293.66], // Em7
    [146.83, 174.61, 220.0, 261.63], // Dm7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
  ];

  public start() {
    if (this.isPlaying) return;
    const ctx = getAudioContext();

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    this.isPlaying = true;
    this.step = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.masterGain) return;
      const chord = this.chords[this.step % this.chords.length];
      this.step++;
      const now = ctx.currentTime;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 3.3);
      });
    };

    playChord();
    this.intervalId = setInterval(playChord, 3200);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.masterGain) {
      const ctx = getAudioContext();
      this.masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    }
    this.isPlaying = false;
  }

  public setDucking(ducked: boolean) {
    if (!this.isPlaying || !this.masterGain) return;
    const ctx = getAudioContext();
    const targetVolume = ducked ? 0.02 : 0.06;
    this.masterGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.3);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const radioBedMusic = new RadioBedMusic();

/**
 * Gestor de Síntesis Vocal (Web Speech API) con soporte para mood, auto-ducking y desbloqueo de navegador.
 */
export class RadioSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private onStateChangeCb: ((speaking: boolean) => void) | null = null;
  private keepAliveTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setOnStateChange(cb: (speaking: boolean) => void) {
    this.onStateChangeCb = cb;
  }

  public getAvailableSpanishVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const all = this.synth.getVoices();
    return all.filter((v) => v.lang.toLowerCase().startsWith('es'));
  }

  public speak(
    text: string,
    mood: RadioMood = 'energetico',
    voiceName?: string,
    playJingleFirst: boolean = true
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('Web Speech API no disponible en este navegador.');
        resolve();
        return;
      }

      // Detener locución previa y limpiar timers
      this.stop();

      // Desbloquear estado de síntesis en Chrome si estuviera en pausa
      if (this.synth.paused) {
        this.synth.resume();
      }

      // Opcional: reproducir jingle de radio antes de hablar
      if (playJingleFirst) {
        playSynthesizedSfx('jingle');
      }

      const delay = playJingleFirst ? 380 : 60;

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Selección de voz en español
        const spanishVoices = this.getAvailableSpanishVoices();
        if (voiceName) {
          const selected = spanishVoices.find((v) => v.name === voiceName);
          if (selected) utterance.voice = selected;
        } else if (spanishVoices.length > 0) {
          const preferred =
            spanishVoices.find(
              (v) =>
                v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Alvaro') ||
                v.name.includes('Jorge')
            ) || spanishVoices[0];
          utterance.voice = preferred;
        }

        // Modulación dinámica según el mood del locutor
        if (mood === 'energetico') {
          utterance.rate = 1.15;
          utterance.pitch = 1.1;
        } else if (mood === 'relajado') {
          utterance.rate = 0.92;
          utterance.pitch = 0.95;
        } else if (mood === 'bromista') {
          utterance.rate = 1.08;
          utterance.pitch = 1.06;
        } else {
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
          this.onStateChangeCb?.(true);
          radioBedMusic.setDucking(true);

          // Workaround conocido para evitar que Chrome corte SpeechSynthesis tras 15 segundos
          if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = setInterval(() => {
            if (this.synth && this.isSpeaking) {
              this.synth.pause();
              this.synth.resume();
            }
          }, 10000);
        };

        const finalize = () => {
          if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
          }
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.onStateChangeCb?.(false);
          radioBedMusic.setDucking(false);
          resolve();
        };

        utterance.onend = finalize;
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error or cancel:', e);
          finalize();
        };

        this.synth?.speak(utterance);
      }, delay);
    });
  }

  public stop() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onStateChangeCb?.(false);
    radioBedMusic.setDucking(false);
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const radioSpeechEngine = new RadioSpeechEngine();
