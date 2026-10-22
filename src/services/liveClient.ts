import { AudioStreamer } from './audioStreamer';
import { AudioRecorder } from './audioRecorder';
import { ActionItem, ConnectionState, LiveClientCallbacks } from '../types';

export class LiveClient {
  private ws: WebSocket | null = null;
  private streamer: AudioStreamer;
  private recorder: AudioRecorder;
  private callbacks: LiveClientCallbacks;
  private state: ConnectionState = 'disconnected';
  private reconnectTimer: any = null;
  private isExplicitDisconnect: boolean = false;

  constructor(callbacks: LiveClientCallbacks) {
    this.callbacks = callbacks;

    this.streamer = new AudioStreamer((isSpeaking) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      const newState: ConnectionState = isSpeaking ? 'speaking' : 'listening';
      this.setState(newState);
    });

    this.recorder = new AudioRecorder((base64Chunk) => {
      this.sendAudioChunk(base64Chunk);
    });
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public getStreamer(): AudioStreamer {
    return this.streamer;
  }

  public getRecorder(): AudioRecorder {
    return this.recorder;
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'connected' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.isExplicitDisconnect = false;
    this.setState('connecting');

    try {
      // Initialize audio playback context
      await this.streamer.initialize();

      // Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('[LiveClient] WebSocket open');
        try {
          // Start mic capture
          await this.recorder.start();
          this.setState('listening');
        } catch (err: any) {
          console.error('[LiveClient] Failed to access microphone:', err);
          this.callbacks.onError(
            'Microphone access was denied or is not available. Please allow mic permissions to speak with Zoya.'
          );
          this.disconnect();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('[LiveClient] Live session linked with Zoya');
          } else if (data.type === 'audio' && data.audio) {
            this.streamer.addPCMChunk(data.audio);
          } else if (data.type === 'interrupted') {
            console.log('[LiveClient] AI speech interrupted');
            this.streamer.stop();
            this.callbacks.onInterrupted();
            this.setState('listening');
          } else if (data.type === 'turnComplete') {
            this.callbacks.onTurnComplete();
          } else if (data.type === 'toolCall' && data.functionCalls) {
            this.handleFunctionCalls(data.functionCalls);
          } else if (data.type === 'error') {
            console.error('[LiveClient] Server error:', data.message);
            this.callbacks.onError(data.message || 'Live session error');
          } else if (data.type === 'sessionClosed') {
            this.disconnect();
          }
        } catch (err) {
          console.error('[LiveClient] Error handling WS message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[LiveClient] WebSocket error:', err);
        this.callbacks.onError('Connection error encountered with Zoya server.');
      };

      this.ws.onclose = () => {
        console.log('[LiveClient] WebSocket closed');
        if (!this.isExplicitDisconnect) {
          this.disconnect();
        }
      };
    } catch (err: any) {
      console.error('[LiveClient] Connect error:', err);
      this.callbacks.onError(err?.message || 'Failed to initialize session');
      this.disconnect();
    }
  }

  public sendAudioChunk(base64Chunk: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'audio',
          audio: base64Chunk,
        })
      );
    }
  }

  public sendTextMessage(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    }
  }

  public setMute(muted: boolean): void {
    this.recorder.setMute(muted);
  }

  public isMuted(): boolean {
    return this.recorder.getIsMuted();
  }

  private handleFunctionCalls(functionCalls: any[]): void {
    for (const call of functionCalls) {
      const { name, args } = call;
      console.log(`[LiveClient] Executing tool: ${name}`, args);

      const timestamp = Date.now();
      const id = `${name}-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;

      if (name === 'openWebsite') {
        const action: ActionItem = {
          id,
          type: 'openWebsite',
          url: args.url,
          label: args.label || args.url,
          timestamp,
        };
        this.callbacks.onToolAction(action);
      } else if (name === 'changeTheme') {
        const action: ActionItem = {
          id,
          type: 'changeTheme',
          theme: args.theme,
          moodPhrase: args.moodPhrase,
          timestamp,
        };
        this.callbacks.onToolAction(action);
      } else if (name === 'takeQuickNote') {
        const action: ActionItem = {
          id,
          type: 'takeQuickNote',
          title: args.title || 'Quick Note',
          note: args.note,
          timestamp,
        };
        this.callbacks.onToolAction(action);
      } else if (name === 'searchBrowser') {
        const action: ActionItem = {
          id,
          type: 'searchBrowser',
          query: args.query,
          timestamp,
        };
        this.callbacks.onToolAction(action);
      }
    }
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.recorder.stop();
    this.streamer.stop();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.setState('disconnected');
  }

  public destroy(): void {
    this.disconnect();
    this.streamer.close();
  }
}
