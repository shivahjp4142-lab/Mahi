import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveClient } from './services/liveClient';
import { ActionItem, AuraTheme, ConnectionState } from './types';
import { THEMES } from './utils/themeConfig';
import { Header } from './components/Header';
import { ZoyaOrb } from './components/ZoyaOrb';
import { ActionTray } from './components/ActionTray';
import { BanterChips } from './components/BanterChips';
import { ThemeModal } from './components/ThemeModal';
import { InfoModal } from './components/InfoModal';
import { AlertCircle, X, Volume2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [activeTheme, setActiveTheme] = useState<AuraTheme>('sassy-pink');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  const liveClientRef = useRef<LiveClient | null>(null);

  // Initialize or maintain LiveClient
  useEffect(() => {
    const client = new LiveClient({
      onStateChange: (state) => {
        setConnectionState(state);
      },
      onToolAction: (action) => {
        setActions((prev) => [action, ...prev.slice(0, 15)]);

        // If the tool is changing the theme, auto-apply it!
        if (action.type === 'changeTheme' && action.theme) {
          const validThemes: AuraTheme[] = [
            'sassy-pink',
            'cyber-violet',
            'neon-cyan',
            'emerald-matrix',
            'solar-flare',
          ];
          if (validThemes.includes(action.theme)) {
            setActiveTheme(action.theme);
          }
        }
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onInterrupted: () => {
        console.log('[App] Playback was interrupted');
      },
      onTurnComplete: () => {
        console.log('[App] Turn complete');
      },
    });

    liveClientRef.current = client;

    return () => {
      client.destroy();
    };
  }, []);

  const handleToggleConnection = useCallback(async () => {
    if (!liveClientRef.current) return;
    setErrorMessage(null);

    if (connectionState === 'disconnected') {
      await liveClientRef.current.connect();
    } else {
      liveClientRef.current.disconnect();
    }
  }, [connectionState]);

  const handleToggleMute = useCallback(() => {
    if (!liveClientRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    liveClientRef.current.setMute(newMuted);
  }, [isMuted]);

  const handleSelectPrompt = useCallback((prompt: string) => {
    if (!liveClientRef.current || connectionState === 'disconnected') return;
    liveClientRef.current.sendTextMessage(prompt);
  }, [connectionState]);

  const handleDismissAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleClearAllActions = useCallback(() => {
    setActions([]);
  }, []);

  const currentThemeConfig = THEMES[activeTheme] || THEMES['sassy-pink'];

  return (
    <div
      className="relative min-h-screen w-full bg-[#07090e] text-white flex flex-col justify-between overflow-x-hidden selection:bg-pink-500/30 selection:text-white"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${currentThemeConfig.glowColor.replace(
          '0.45',
          '0.14'
        )} 0%, #07090e 100%)`,
      }}
    >
      {/* High-tech cyberpunk subtle ambient grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <Header
        theme={activeTheme}
        state={connectionState}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full max-w-4xl mx-auto">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="w-full max-w-md mx-auto mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 backdrop-blur-md flex items-start justify-between gap-3 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-200 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Central Reactive Holographic Orb */}
        <ZoyaOrb
          state={connectionState}
          theme={activeTheme}
          isMuted={isMuted}
          streamer={liveClientRef.current ? liveClientRef.current.getStreamer() : null}
          recorder={liveClientRef.current ? liveClientRef.current.getRecorder() : null}
          onToggleConnection={handleToggleConnection}
          onToggleMute={handleToggleMute}
        />

        {/* Live Action Tray (Displays browser actions, notes, etc.) */}
        <ActionTray
          actions={actions}
          theme={activeTheme}
          onDismissAction={handleDismissAction}
          onClearAll={handleClearAllActions}
        />
      </main>

      {/* Bottom Footer & Banter Chips */}
      <footer className="relative z-10 w-full pb-4 pt-2">
        <BanterChips
          onSelectPrompt={handleSelectPrompt}
          disabled={connectionState === 'disconnected'}
          theme={activeTheme}
        />

        <div className="text-center px-4">
          <p className="text-[11px] text-zinc-600 tracking-wide font-mono">
            Powered by Gemini Live • Real-time Spoken Audio Engine
          </p>
        </div>
      </footer>

      {/* Theme Selection Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        activeTheme={activeTheme}
        onSelectTheme={(t) => setActiveTheme(t)}
      />

      {/* Persona Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        theme={activeTheme}
      />
    </div>
  );
}
