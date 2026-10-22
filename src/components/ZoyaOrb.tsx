import React, { useEffect, useRef } from 'react';
import { ConnectionState, AuraTheme } from '../types';
import { THEMES } from '../utils/themeConfig';
import { AudioStreamer } from '../services/audioStreamer';
import { AudioRecorder } from '../services/audioRecorder';
import { Mic, MicOff, Power, Sparkles, Volume2 } from 'lucide-react';

interface ZoyaOrbProps {
  state: ConnectionState;
  theme: AuraTheme;
  isMuted: boolean;
  streamer: AudioStreamer | null;
  recorder: AudioRecorder | null;
  onToggleConnection: () => void;
  onToggleMute: () => void;
}

export const ZoyaOrb: React.FC<ZoyaOrbProps> = ({
  state,
  theme,
  isMuted,
  streamer,
  recorder,
  onToggleConnection,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeConfig = THEMES[theme] || THEMES['sassy-pink'];
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      dist: number;
      speed: number;
      alpha: number;
    }> = [];

    // Initialize decorative ambient floating particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: 0,
        y: 0,
        radius: Math.random() * 2 + 0.8,
        angle: Math.random() * Math.PI * 2,
        dist: 70 + Math.random() * 90,
        speed: (Math.random() - 0.5) * 0.015,
        alpha: Math.random() * 0.7 + 0.2,
      });
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Audio level calculation
      let audioLevel = 0;
      let freqData: Uint8Array = new Uint8Array(0);

      if (state === 'speaking' && streamer) {
        audioLevel = streamer.getVolumeLevel();
        freqData = streamer.getFrequencyData();
      } else if (state === 'listening' && recorder && !isMuted) {
        audioLevel = recorder.getMicVolume();
        freqData = recorder.getMicFrequencies();
      }

      // Smooth amplification
      const boostedLevel = Math.min(1.0, audioLevel * 2.8);
      angle += 0.015 + boostedLevel * 0.04;

      // Outer glowing ambient ring
      const baseRadius = 85;
      const dynamicRadius = baseRadius + boostedLevel * 30;

      // Draw subtle orbital rings
      const numRings = 3;
      for (let r = 0; r < numRings; r++) {
        ctx.beginPath();
        const rDist = baseRadius + 22 * (r + 1) + Math.sin(angle * 1.5 + r) * 6;
        ctx.arc(centerX, centerY, rDist, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle =
          state === 'disconnected'
            ? 'rgba(255, 255, 255, 0.05)'
            : state === 'connecting'
            ? 'rgba(255, 255, 255, 0.15)'
            : `${themeConfig.glowColor.replace('0.45', '0.18')}`;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw responsive frequency spikes if active
      if ((state === 'speaking' || state === 'listening') && freqData.length > 0) {
        const step = Math.floor(freqData.length / 48);
        const barCount = 48;

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const barHeight = (val / 255) * 45;
          const theta = (i / barCount) * Math.PI * 2 + angle;

          const x1 = centerX + Math.cos(theta) * (dynamicRadius + 4);
          const y1 = centerY + Math.sin(theta) * (dynamicRadius + 4);
          const x2 = centerX + Math.cos(theta) * (dynamicRadius + 8 + barHeight);
          const y2 = centerY + Math.sin(theta) * (dynamicRadius + 8 + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = themeConfig.primary;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Draw particles orbiting
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.angle += p.speed;
        const currentDist = p.dist + Math.sin(angle * 2 + i) * (boostedLevel * 20);
        const px = centerX + Math.cos(p.angle) * currentDist;
        const py = centerY + Math.sin(p.angle) * currentDist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          state === 'disconnected'
            ? `rgba(180, 190, 210, ${p.alpha * 0.2})`
            : `${themeConfig.glowColor.replace('0.45', (p.alpha * (0.4 + boostedLevel * 0.5)).toFixed(2))}`;
        ctx.fill();
      }

      // Inner pulsating core aura
      const grad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        dynamicRadius + 30
      );

      if (state === 'disconnected') {
        grad.addColorStop(0, 'rgba(75, 85, 99, 0.4)');
        grad.addColorStop(0.5, 'rgba(31, 41, 55, 0.2)');
        grad.addColorStop(1, 'transparent');
      } else if (state === 'connecting') {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        grad.addColorStop(0.3, themeConfig.glowColor);
        grad.addColorStop(0.7, 'rgba(139, 92, 246, 0.15)');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, themeConfig.primary);
        grad.addColorStop(0.6, themeConfig.glowColor);
        grad.addColorStop(1, 'transparent');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius + 20, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core sphere stroke
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
      ctx.strokeStyle = state === 'disconnected' ? 'rgba(156, 163, 175, 0.3)' : themeConfig.ringColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = themeConfig.primary;
      ctx.shadowBlur = state === 'disconnected' ? 4 : 20 + boostedLevel * 30;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, theme, isMuted, streamer, recorder]);

  const getStateDescription = () => {
    switch (state) {
      case 'connecting':
        return 'Syncing neural stream...';
      case 'listening':
        return isMuted ? 'Mic is muted' : 'Listening to you...';
      case 'speaking':
        return 'Zoya is speaking...';
      case 'connected':
        return 'Live channel active';
      default:
        return 'Dormant • Tap to wake Zoya';
    }
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'connecting':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-400 animate-ping',
          text: 'CONNECTING',
        };
      case 'listening':
        return {
          bg: isMuted ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          dot: isMuted ? 'bg-yellow-400' : 'bg-emerald-400 animate-pulse',
          text: isMuted ? 'MUTED' : 'LISTENING',
        };
      case 'speaking':
        return {
          bg: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
          dot: 'bg-pink-400 animate-bounce',
          text: 'SPEAKING',
        };
      default:
        return {
          bg: 'bg-zinc-800/80 border-zinc-700/50 text-zinc-400',
          dot: 'bg-zinc-500',
          text: 'OFFLINE',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto py-4 select-none">
      {/* Status Pill */}
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono tracking-wider mb-6 transition-all duration-300 backdrop-blur-md shadow-lg ${badge.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
        <span>{badge.text}</span>
        {state === 'speaking' && <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
      </div>

      {/* Visual Canvas and Interaction Center */}
      <div className="relative flex items-center justify-center w-[320px] h-[320px] sm:w-[360px] sm:h-[360px]">
        {/* Canvas for reactive visualizer & orbital rings */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Center tactile control button */}
        <button
          onClick={onToggleConnection}
          aria-label={state === 'disconnected' ? 'Start conversation with Zoya' : 'End conversation'}
          className={`group relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-transform active:scale-95 duration-200 cursor-pointer shadow-2xl backdrop-blur-xl border border-white/20 overflow-hidden ${
            state === 'disconnected'
              ? 'bg-zinc-900/80 hover:bg-zinc-800/80 text-zinc-300'
              : 'bg-black/60 text-white'
          }`}
          style={{
            boxShadow:
              state === 'disconnected'
                ? '0 0 30px rgba(0,0,0,0.5)'
                : `0 0 50px ${themeConfig.glowColor}, inset 0 0 20px rgba(255,255,255,0.2)`,
          }}
        >
          {/* Subtle light sweep reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

          {state === 'disconnected' ? (
            <>
              <Power className="w-8 h-8 mb-1 text-zinc-400 group-hover:text-white transition-colors group-hover:scale-110 duration-200" />
              <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400 group-hover:text-zinc-200">
                Connect
              </span>
            </>
          ) : (
            <>
              {state === 'speaking' ? (
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-1 h-5 bg-pink-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
                  <span className="w-1 h-8 bg-white rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s]" />
                  <span className="w-1 h-6 bg-pink-400 rounded-full animate-[pulse_0.35s_ease-in-out_infinite_0.2s]" />
                  <span className="w-1 h-4 bg-white rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.15s]" />
                </div>
              ) : (
                <Mic
                  className={`w-8 h-8 mb-1 transition-all duration-300 ${
                    isMuted ? 'text-amber-400 line-through' : 'text-white scale-105'
                  }`}
                />
              )}
              <span className="text-[11px] font-semibold tracking-wide uppercase text-white/90">
                {state === 'speaking' ? 'Talking' : isMuted ? 'Muted' : 'Live'}
              </span>
            </>
          )}
        </button>

        {/* Small floating quick mute control button on the orb rim */}
        {state !== 'disconnected' && (
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`absolute bottom-3 right-6 z-20 p-2.5 rounded-full border backdrop-blur-lg shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900/80 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Real-time Subtitle / Contextual Status */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium tracking-wide text-zinc-300 transition-colors">
          {getStateDescription()}
        </p>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          {state === 'disconnected'
            ? 'Voice-to-voice stream with zero latency'
            : state === 'listening'
            ? 'Speak casually—Zoya will banter right back'
            : 'Zoya is answering you live'}
        </p>
      </div>
    </div>
  );
};
