import React from 'react';
import { Sparkles, MessageCircleHeart, Flame, Music, Palette, Laugh } from 'lucide-react';
import { AuraTheme } from '../types';
import { THEMES } from '../utils/themeConfig';

interface BanterChipsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled: boolean;
  theme: AuraTheme;
}

const CHIPS = [
  {
    icon: MessageCircleHeart,
    text: 'Who are you really, Zoya?',
    short: 'Who are you?',
  },
  {
    icon: Flame,
    text: 'Give me your sassiest one-liner today.',
    short: 'Sassy one-liner',
  },
  {
    icon: Music,
    text: 'Open YouTube and play some music for me.',
    short: 'Play YouTube',
  },
  {
    icon: Palette,
    text: 'Change your aura theme to sassy pink.',
    short: 'Shift aura',
  },
  {
    icon: Laugh,
    text: 'Roast me playfully for procrastinating.',
    short: 'Playful roast',
  },
];

export const BanterChips: React.FC<BanterChipsProps> = ({
  onSelectPrompt,
  disabled,
  theme,
}) => {
  const themeConfig = THEMES[theme] || THEMES['sassy-pink'];

  return (
    <div className="w-full max-w-lg mx-auto px-4 mt-2 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3 text-zinc-500" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Quick Spoken Cues
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {CHIPS.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(chip.text)}
              disabled={disabled}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-zinc-900/60 backdrop-blur-md text-zinc-300 transition-all ${
                disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:text-white hover:border-white/20 hover:scale-[1.02] active:scale-95 cursor-pointer'
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: themeConfig.primary }} />
              <span>{chip.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
