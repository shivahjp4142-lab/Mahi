import React from 'react';
import { Sparkles, Palette, Info, Radio } from 'lucide-react';
import { AuraTheme, ConnectionState } from '../types';
import { THEMES } from '../utils/themeConfig';

interface HeaderProps {
  theme: AuraTheme;
  state: ConnectionState;
  onOpenThemeModal: () => void;
  onOpenInfoModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  state,
  onOpenThemeModal,
  onOpenInfoModal,
}) => {
  const currentTheme = THEMES[theme] || THEMES['sassy-pink'];

  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-4 flex items-center justify-between relative z-20">
      {/* Brand & Persona badge */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg relative overflow-hidden backdrop-blur-xl"
          style={{
            backgroundColor: `${currentTheme.primary}18`,
            boxShadow: `0 0 20px ${currentTheme.glowColor}`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
          <span className="font-extrabold text-sm tracking-tight text-white font-mono">
            Z
          </span>
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentTheme.primary }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
              ZOYA
              <span className="text-xs font-normal px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-300 font-mono">
                AI
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            Voice-to-Voice Companion
          </p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Live Audio indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-zinc-900/60 backdrop-blur text-xs font-mono text-zinc-300">
          <Radio
            className={`w-3.5 h-3.5 ${
              state === 'disconnected' ? 'text-zinc-500' : 'text-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-[11px]">24kHz PCM</span>
        </div>

        {/* Theme Aura Selector */}
        <button
          onClick={onOpenThemeModal}
          title="Change holographic aura theme"
          className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white backdrop-blur transition-all active:scale-95 cursor-pointer"
        >
          <Palette className="w-4 h-4" style={{ color: currentTheme.primary }} />
        </button>

        {/* Persona Info */}
        <button
          onClick={onOpenInfoModal}
          title="About Zoya persona"
          className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white backdrop-blur transition-all active:scale-95 cursor-pointer"
        >
          <Info className="w-4 h-4 text-zinc-400 hover:text-white" />
        </button>
      </div>
    </header>
  );
};
