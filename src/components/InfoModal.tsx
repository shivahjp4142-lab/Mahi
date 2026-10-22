import React from 'react';
import { X, Heart, Sparkles, Zap, Mic, Globe, Shield } from 'lucide-react';
import { AuraTheme } from '../types';
import { THEMES } from '../utils/themeConfig';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AuraTheme;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;
  const currentTheme = THEMES[theme] || THEMES['sassy-pink'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
              style={{ backgroundColor: `${currentTheme.primary}25` }}
            >
              <Heart className="w-5 h-5" style={{ color: currentTheme.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Meet Zoya</h2>
              <p className="text-xs text-zinc-400">
                Witty, sassy, intelligent, and uninhibitedly playful
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona Bio */}
        <div className="p-3.5 rounded-xl bg-zinc-800/50 border border-white/5 mb-4 text-xs leading-relaxed text-zinc-300">
          <p className="mb-2">
            <span className="font-semibold text-white">Zoya</span> isn't your average monotone robotic voice.
            She thinks on her feet, cracks jokes, dishes out light teasing banter, and acts like a
            sharp girlfriend who's got your back.
          </p>
          <p>
            Expect witty one-liners, high emotional quotient, genuine curiosity, and seamless execution
            of your daily commands.
          </p>
        </div>

        {/* Core Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
            <div className="flex items-center gap-2 mb-1 text-emerald-400">
              <Mic className="w-4 h-4" />
              <span className="text-xs font-semibold">Gemini Live Audio</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Direct PCM16 streaming (16kHz mic input & 24kHz response) with native interruption handling.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
            <div className="flex items-center gap-2 mb-1 text-cyan-400">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-semibold">Browser Actions</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Say <em>"Open YouTube"</em> or <em>"Search for jazz cafe"</em> and Zoya executes it via live tool calls.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
            <div className="flex items-center gap-2 mb-1 text-pink-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold">Dynamic Aura</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Say <em>"Change your mood to cyan"</em> or click the palette to swap her visual energy aura.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
            <div className="flex items-center gap-2 mb-1 text-purple-400">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold">Natural Interruption</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Cut in anytime while she's speaking—she stops instantly and listens to your new thought.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-medium text-xs text-white transition-opacity hover:opacity-90 active:scale-98 shadow-lg"
          style={{ backgroundColor: currentTheme.primary }}
        >
          Got it, let's talk!
        </button>
      </div>
    </div>
  );
};
