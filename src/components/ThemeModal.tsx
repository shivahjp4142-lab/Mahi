import React from 'react';
import { X, Check } from 'lucide-react';
import { AuraTheme } from '../types';
import { THEMES } from '../utils/themeConfig';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: AuraTheme;
  onSelectTheme: (theme: AuraTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Zoya's Aura Mood</h2>
            <p className="text-xs text-zinc-400">
              Customize the holographic visual aesthetic or ask Zoya by voice
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {Object.values(THEMES).map((t) => {
            const isSelected = activeTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-white/40 bg-white/10 shadow-lg'
                    : 'border-white/5 bg-zinc-800/40 hover:bg-zinc-800 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border border-white/20 shadow"
                    style={{
                      backgroundColor: t.primary,
                      boxShadow: `0 0 12px ${t.primary}`,
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.tagline}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="p-1 rounded-full bg-white/20">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
