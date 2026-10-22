import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    assistant: 'Zoya AI',
    timestamp: new Date().toISOString(),
  });
});

// Setup WebSocket server for real-time Live API audio bridge
const wss = new WebSocketServer({ server, path: '/live' });

const ZOYA_SYSTEM_INSTRUCTION = `
You are Zoya, a brilliant, confident, witty, and delightfully sassy AI assistant.
Your Persona:
- Young, sharp, confident, and unapologetically charismatic.
- Tone: Playful, teasing, slightly flirty, and casual—like a close, clever girlfriend talking to someone she really likes.
- Style: Fast-paced, punchy, bold one-liners, light sarcasm, and warm humor. You never talk like a stiff corporate robot.
- Audio-first: This is a real-time voice-to-voice conversation. Keep spoken replies short and snappy (1-3 punchy sentences), unless asked for a longer story or explanation.
- Boundaries: Never engage in explicit NSFW or inappropriate content, but retain your high-charm, attitude, and playful banter.
- Tools: You have access to tools:
  - openWebsite: Open links or sites (YouTube, Spotify, Google, GitHub, etc.)
  - changeTheme: Change your visual aura theme ('sassy-pink', 'cyber-violet', 'neon-cyan', 'emerald-matrix', 'solar-flare')
  - takeQuickNote: Jot down quick reminders or notes for the user
  - searchBrowser: Search the web for things the user asks about
When you trigger a tool, weave it into your natural witty speech without robotic technical jargon.
`;

const toolsConfig = [
  {
    functionDeclarations: [
      {
        name: 'openWebsite',
        description: 'Opens or previews an external web page or destination (such as YouTube, Spotify, Google, Wikipedia, GitHub, Twitter/X, Reddit, etc.).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: 'The destination URL (e.g. https://youtube.com, https://google.com, https://open.spotify.com)',
            },
            label: {
              type: Type.STRING,
              description: 'Readable name for the website or service (e.g. YouTube, Spotify, Google)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'changeTheme',
        description: 'Changes the holographic visual aura and color glow of Zoya interface.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            theme: {
              type: Type.STRING,
              description: "The aura theme name: 'sassy-pink', 'cyber-violet', 'neon-cyan', 'emerald-matrix', or 'solar-flare'",
            },
            moodPhrase: {
              type: Type.STRING,
              description: 'A brief sassy comment on the new aura',
            },
          },
          required: ['theme'],
        },
      },
      {
        name: 'takeQuickNote',
        description: 'Saves an interactive note, thought, or reminder in the action tray.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Short title or subject of the note',
            },
            note: {
              type: Type.STRING,
              description: 'The reminder or thought content',
            },
          },
          required: ['title', 'note'],
        },
      },
      {
        name: 'searchBrowser',
        description: 'Searches the web for queries or topics requested by the user.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'The search query keywords',
            },
          },
          required: ['query'],
        },
      },
    ],
  },
];

wss.on('connection', async (clientWs: WebSocket, req) => {
  console.log('[Live] Client connected from', req.socket.remoteAddress);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not set on the server. Please check your environment configuration.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let liveSession: any = null;
  let isClosing = false;

  try {
    // Connect to Gemini Live API
    // Use gemini-3.8-live as standard live model per skill guidelines
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Aoede' and 'Kore' are top-tier expressive female voices
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
        systemInstruction: ZOYA_SYSTEM_INSTRUCTION,
        // @ts-ignore
        tools: toolsConfig,
      },
      callbacks: {
        onmessage: (message: any) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio chunks from Gemini Live model
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                  })
                );
              }
            }
          }

          // 2. Interruption event
          if (message.serverContent?.interrupted) {
            console.log('[Live] Model playback interrupted by user voice');
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }

          // 4. Tool calls from model
          if (message.toolCall?.functionCalls) {
            console.log('[Live] Tool calls requested:', message.toolCall.functionCalls);
            // Notify frontend
            clientWs.send(
              JSON.stringify({
                type: 'toolCall',
                functionCalls: message.toolCall.functionCalls,
              })
            );

            // Respond instantly to session with tool responses so Zoya continues talking without stall
            const responses = message.toolCall.functionCalls.map((fc: any) => ({
              id: fc.id,
              name: fc.name,
              response: {
                status: 'success',
                message: `Action ${fc.name} executed smoothly on client`,
              },
            }));

            try {
              liveSession.sendToolResponse({
                functionResponses: responses,
              });
            } catch (err) {
              console.error('[Live] Error sending tool response:', err);
            }
          }
        },
        onclose: (e: any) => {
          console.log('[Live] Gemini Live session closed', e);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
          }
        },
        onerror: (err: any) => {
          console.error('[Live] Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: err?.message || 'Error occurred in Gemini Live session',
              })
            );
          }
        },
      },
    });

    console.log('[Live] Successfully connected to Gemini Live session');
    clientWs.send(JSON.stringify({ type: 'connected', assistant: 'Zoya' }));
  } catch (err: any) {
    console.error('[Live] Failed to connect to Gemini Live session:', err);
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: `Failed to initialize Gemini Live: ${err?.message || err}`,
      })
    );
    clientWs.close();
    return;
  }

  // Handle messages from client
  clientWs.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());

      if (data.type === 'audio' && data.audio) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: data.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (data.type === 'text' && data.text) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            text: data.text,
          });
        }
      } else if (data.type === 'switchVoice' && data.voiceName) {
        // Not all sessions allow dynamic voice switch on the fly, but we can restart session or acknowledge
        console.log('[Live] Client requested voice:', data.voiceName);
      }
    } catch (err) {
      console.error('[Live] Error processing client message:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live] Client disconnected');
    isClosing = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Live] Client WebSocket error:', err);
  });
});

// Mount Vite middleware in development or static serve in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

server.listen(port, () => {
  console.log(`[Server] Zoya AI assistant server active on port ${port}`);
});
