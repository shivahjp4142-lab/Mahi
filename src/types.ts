export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking';

export type AuraTheme = 'sassy-pink' | 'cyber-violet' | 'neon-cyan' | 'emerald-matrix' | 'solar-flare';

export interface ThemeConfig {
  id: AuraTheme;
  name: string;
  tagline: string;
  primary: string; // Tailwind/hex color
  glowColor: string;
  ringColor: string;
  gradient: string;
  bgAura: string;
}

export interface WebsiteAction {
  id: string;
  type: 'openWebsite';
  url: string;
  label?: string;
  timestamp: number;
}

export interface ThemeAction {
  id: string;
  type: 'changeTheme';
  theme: AuraTheme;
  moodPhrase?: string;
  timestamp: number;
}

export interface NoteAction {
  id: string;
  type: 'takeQuickNote';
  title: string;
  note: string;
  timestamp: number;
}

export interface SearchAction {
  id: string;
  type: 'searchBrowser';
  query: string;
  timestamp: number;
}

export type ActionItem = WebsiteAction | ThemeAction | NoteAction | SearchAction;

export interface LiveClientCallbacks {
  onStateChange: (state: ConnectionState) => void;
  onToolAction: (action: ActionItem) => void;
  onError: (error: string) => void;
  onInterrupted: () => void;
  onTurnComplete: () => void;
}
