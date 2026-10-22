import React from 'react';
import { ActionItem, AuraTheme } from '../types';
import { THEMES } from '../utils/themeConfig';
import {
  ExternalLink,
  StickyNote,
  Palette,
  Search,
  X,
  Check,
  Copy,
  Sparkles,
} from 'lucide-react';

interface ActionTrayProps {
  actions: ActionItem[];
  theme: AuraTheme;
  onDismissAction: (id: string) => void;
  onClearAll: () => void;
}

export const ActionTray: React.FC<ActionTrayProps> = ({
  actions,
  theme,
  onDismissAction,
  onClearAll,
}) => {
  const themeConfig = THEMES[theme] || THEMES['sassy-pink'];
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (actions.length === 0) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-4 px-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.primary }} />
          <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">
            Live Action HUD ({actions.length})
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {actions.map((action) => {
          if (action.type === 'openWebsite') {
            return (
              <div
                key={action.id}
                className="relative flex items-center justify-between p-3 rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur-md shadow-lg group hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${themeConfig.primary}20` }}
                  >
                    <ExternalLink className="w-4 h-4" style={{ color: themeConfig.primary }} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {action.label || 'Website Request'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{action.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={action.url.startsWith('http') ? action.url : `https://${action.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-medium rounded-lg text-white transition-opacity hover:opacity-90 active:scale-95 flex items-center gap-1 shadow"
                    style={{ backgroundColor: themeConfig.primary }}
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onDismissAction(action.id)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          if (action.type === 'takeQuickNote') {
            return (
              <div
                key={action.id}
                className="relative p-3 rounded-xl border border-amber-500/20 bg-amber-950/20 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-200">
                      {action.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(action.note, action.id)}
                      title="Copy note"
                      className="p-1 rounded text-zinc-400 hover:text-white"
                    >
                      {copiedId === action.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDismissAction(action.id)}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap pl-6">
                  {action.note}
                </p>
              </div>
            );
          }

          if (action.type === 'changeTheme') {
            return (
              <div
                key={action.id}
                className="relative flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-md"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4" style={{ color: themeConfig.primary }} />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200">Aura shifted: </span>
                    <span className="text-zinc-300 font-mono">{action.theme}</span>
                    {action.moodPhrase && (
                      <p className="text-[11px] text-zinc-400 italic">"{action.moodPhrase}"</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDismissAction(action.id)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          if (action.type === 'searchBrowser') {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(action.query)}`;
            return (
              <div
                key={action.id}
                className="relative flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-md"
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium text-zinc-300 truncate">
                      Search: <span className="text-white">"{action.query}"</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-1 transition-colors"
                  >
                    <span>Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onDismissAction(action.id)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
