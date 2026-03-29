import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { buildSystemPrompt } from '../constants/prompts';
import { CharacterId, SportMode, RunStats } from '../types';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

// ==========================================
// State
// ==========================================
let ws: WebSocket | null = null;
let isConnected = false;
let isSetupComplete = false;
let recording: Audio.Recording | null = null;
let toolHandlers: Record<string, (args: any) => Promise<any>> = {};

// REST API fallback for text chat
let restChat: ChatSession | null = null;
let restModel: any = null;

// Callbacks
let onTranscript: ((text: string, role: 'user' | 'assistant') => void) | null = null;
let onConnectionChange: ((connected: boolean) => void) | null = null;
let onError: ((error: string) => void) | null = null;

// Audio playback
let audioQueue: string[] = [];
let isPlaying = false;
let currentSound: Audio.Sound | null = null;

// Saved config for reconnection
let savedSportMode: SportMode = 'running';
let savedCharacterId: CharacterId = 'hype';

const GEMINI_TOOLS_DECL = [
  { name: 'get_current_stats', description: "Get runner's current pace, distance, time, speed, cadence.", parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_route_info', description: 'Get route info: next turn, distance remaining.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_split_times', description: 'Get pace for each completed km.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'find_nearby_places', description: 'Find cafes, restrooms, water, stores nearby.', parameters: { type: 'OBJECT', properties: { type: { type: 'STRING', description: 'Place type' } }, required: ['type'] } },
  { name: 'get_weather', description: 'Get current weather at runner location.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'web_search', description: 'Search internet for anything.', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Query' } }, required: ['query'] } },
  { name: 'get_location_context', description: 'Get neighborhood and landmarks info.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'generate_route', description: 'Generate a route (shapes or mood-based).', parameters: { type: 'OBJECT', properties: { shape: { type: 'STRING' }, distance_km: { type: 'NUMBER' }, mood: { type: 'STRING' } } } },
  { name: 'get_training_plan', description: 'Get training plan and progress.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_achievements', description: 'Check achievements, badges, XP.', parameters: { type: 'OBJECT', properties: {} } },
];

// ==========================================
// REST API (reliable text fallback)
// ==========================================
function initRestApi(sportMode: SportMode, characterId: CharacterId): void {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const prompt = buildSystemPrompt(sportMode, characterId);

  restModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: prompt,
    tools: [{ functionDeclarations: GEMINI_TOOLS_DECL as any }],
  });

  restChat = restModel.startChat({ history: [] });
}

async function sendViaRest(message: string): Promise<string> {
  if (!restChat) return "I'm not connected yet. Give me a sec!";

  try {
    let response = await restChat.sendMessage(message);
    let result = response.response;

    // Handle function calling
    while (result.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall)) {
      const calls = result.candidates[0].content.parts.filter((p: any) => p.functionCall);
      const responses: any[] = [];

      for (const part of calls) {
        const call = (part as any).functionCall;
        const handler = toolHandlers[call.name];
        let data: any;
        try {
          data = handler ? await handler(call.args || {}) : { error: `No handler: ${call.name}` };
        } catch (e) {
          data = { error: String(e) };
        }
        responses.push({ functionResponse: { name: call.name, response: data } });
      }

      response = await restChat.sendMessage(responses);
      result = response.response;
    }

    return result.text() || "I'm here!";
  } catch (error) {
    console.error('[GeminiRest] Error:', error);
    return "Lost connection for a sec. I'm back!";
  }
}

// ==========================================
// WebSocket Live API (voice)
// ==========================================
export function connectLive(
  sportMode: SportMode,
  characterId: CharacterId,
  callbacks: {
    onTranscript: (text: string, role: 'user' | 'assistant') => void;
    onAudioResponse: (audioBase64: string) => void;
    onConnectionChange: (connected: boolean) => void;
    onError: (error: string) => void;
  }
): void {
  onTranscript = callbacks.onTranscript;
  onConnectionChange = callbacks.onConnectionChange;
  onError = callbacks.onError;
  savedSportMode = sportMode;
  savedCharacterId = characterId;

  // Always init REST as fallback
  initRestApi(sportMode, characterId);
  onConnectionChange?.(true); // REST is always "connected"

  disconnectWebSocket();

  try {
    ws = new WebSocket(WS_URL);
    // Force text mode so onmessage delivers strings, not Blobs
    ws.binaryType = 'blob'; // RN default, but let's also handle in onmessage
  } catch (e) {
    console.error('[GeminiLive] WebSocket create failed:', e);
    isConnected = false;
    return;
  }

  ws.onopen = () => {
    console.log('[GeminiLive] WebSocket connected, sending setup...');
    isConnected = true;

    const systemPrompt = buildSystemPrompt(sportMode, characterId);

    ws!.send(JSON.stringify({
      setup: {
        model: 'models/gemini-2.5-flash-native-audio-latest',
        generationConfig: {
          responseModalities: ['AUDIO'],
          temperature: 0.8,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: getVoiceForCharacter(characterId),
              },
            },
          },
        },
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ functionDeclarations: GEMINI_TOOLS_DECL }],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    }));
  };

  ws.onmessage = (event: any) => {
    const processMessage = (text: string) => {
      try {
        const data = JSON.parse(text);
        handleServerMessage(data);
      } catch (e) {
        // Not valid JSON — likely a binary audio frame, ignore
      }
    };

    const raw = event.data;
    if (typeof raw === 'string') {
      processMessage(raw);
    } else if (raw && typeof raw === 'object') {
      // Blob in React Native — use FileReader
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processMessage(reader.result);
        }
      };
      reader.readAsText(raw);
    }
  };

  async function handleServerMessage(data: any) {
    try {
      if (data.setupComplete) {
        console.log('[GeminiLive] ✅ Setup complete — LIVE VOICE READY');
        isSetupComplete = true;
        onConnectionChange?.(true);
        return;
      }

      if (data.toolCall) {
        handleToolCall(data.toolCall);
        return;
      }

      if (data.toolCallCancellation) return;

      if (data.serverContent) {
        const content = data.serverContent;

        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              audioQueue.push(part.inlineData.data);
            }
          }
        }

        if (content.turnComplete && audioQueue.length > 0) {
          playCollectedAudio();
        }

        if (content.outputTranscription?.text?.trim()) {
          onTranscript?.(content.outputTranscription.text.trim(), 'assistant');
        }

        if (content.inputTranscription?.text?.trim()) {
          onTranscript?.(content.inputTranscription.text.trim(), 'user');
        }

        if (content.interrupted) {
          stopAudioPlayback();
        }
      }
    } catch (error) {
      console.error('[GeminiLive] Message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.warn('[GeminiLive] WebSocket error — using REST fallback');
    isConnected = false;
  };

  ws.onclose = (event: any) => {
    const reason = event?.reason || event?.message || 'unknown';
    console.log(`[GeminiLive] WebSocket closed — code: ${event?.code}, reason: ${reason}`);
    isConnected = false;
    isSetupComplete = false;
  };
}

function getVoiceForCharacter(characterId: CharacterId): string {
  return { drill: 'Orus', chill: 'Aoede', hype: 'Zephyr', sensei: 'Puck' }[characterId];
}

async function handleToolCall(toolCall: any): Promise<void> {
  const responses: any[] = [];
  for (const call of toolCall.functionCalls) {
    const handler = toolHandlers[call.name];
    let data: any;
    try {
      data = handler ? await handler(call.args || {}) : { error: `No handler: ${call.name}` };
    } catch (e) {
      data = { error: String(e) };
    }
    responses.push({ id: call.id, response: data });
  }
  if (ws && isConnected) {
    ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
  }
}

// ==========================================
// Wait for Live API setup
// ==========================================
function waitForSetup(timeoutMs: number = 10000): Promise<boolean> {
  if (isSetupComplete) return Promise.resolve(true);
  return new Promise((resolve) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (isSetupComplete) {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 200);
  });
}

// ==========================================
// Text messaging — Live API first, REST fallback
// ==========================================
export async function sendTextMessage(text: string): Promise<void> {
  onTranscript?.(text, 'user');

  // Wait up to 8 seconds for Live API setup
  const liveReady = await waitForSetup(8000);

  if (liveReady && ws && isConnected) {
    try {
      console.log('[Gemini] Sending via LIVE API (voice response)');
      ws.send(JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      }));
      // Response comes back as audio via onmessage handler
      return;
    } catch (e) {
      console.warn('[Gemini] WebSocket send failed, using REST:', e);
    }
  }

  // REST fallback only if Live API truly failed
  console.log('[Gemini] Live API not available — using REST + TTS fallback');
  const response = await sendViaRest(text);
  onTranscript?.(response, 'assistant');

  try {
    const Speech = require('expo-speech');
    const chars = require('../constants/characters');
    const character = chars.CHARACTERS[savedCharacterId];
    Speech.speak(response, {
      pitch: character?.voiceConfig?.pitch || 1.0,
      rate: character?.voiceConfig?.rate || 1.0,
    });
  } catch {}
}

// ==========================================
// Context updates — via Live API when available
// ==========================================
export async function sendContextUpdate(stats: RunStats, extraContext?: string): Promise<void> {
  const msg = `[STATS: ${(stats.distance / 1000).toFixed(2)}km, Pace: ${fmtPace(stats.currentPace)}/km, Avg: ${fmtPace(stats.averagePace)}/km, ${Math.floor(stats.duration / 60)}:${Math.floor(stats.duration % 60).toString().padStart(2, '0')}, ${stats.cadence}spm${extraContext ? ' | ' + extraContext : ''}] If noteworthy, comment briefly. Otherwise stay silent.`;

  // Prefer Live API for context updates too (gets voice responses)
  if (isSetupComplete && ws && isConnected) {
    try {
      ws.send(JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: msg }] }],
          turnComplete: true,
        },
      }));
      return;
    } catch {}
  }

  // REST fallback
  sendViaRest(msg).then((response) => {
    if (response.toLowerCase().trim() !== 'ok' && response.length > 5) {
      onTranscript?.(response, 'assistant');
      try {
        const Speech = require('expo-speech');
        const chars = require('../constants/characters');
        const character = chars.CHARACTERS[savedCharacterId];
        Speech.speak(response, { pitch: character?.voiceConfig?.pitch || 1.0, rate: character?.voiceConfig?.rate || 1.0 });
      } catch {}
    }
  }).catch(() => {});
}

function fmtPace(s: number): string {
  if (s <= 0 || !isFinite(s)) return '--:--';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

// ==========================================
// Microphone (streams to WebSocket)
// ==========================================
export async function startMicrophone(): Promise<void> {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) { onError?.('Mic permission denied'); return; }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Use HIGH_QUALITY preset then override — avoids iOS format errors
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = rec;
    console.log('[GeminiLive] Microphone started');
    startAudioStreaming();
  } catch (error) {
    console.error('[GeminiLive] Mic error:', error);
    onError?.('Microphone failed');
  }
}

let streamInterval: ReturnType<typeof setInterval> | null = null;
let isRecording = false;

/**
 * Chunked recording: record 2-second clips, send each to Gemini, repeat.
 * This avoids iOS file-locking issues with reading partial recordings.
 */
function startAudioStreaming(): void {
  stopAudioStreaming();
  isRecording = true;

  const recordAndSendChunk = async () => {
    if (!isRecording || !ws || !isConnected || !isSetupComplete) return;

    try {
      // Stop current recording to get the file
      if (recording) {
        const uri = recording.getURI();
        await recording.stopAndUnloadAsync();

        // Read and send the recorded chunk
        if (uri) {
          const data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          if (data && data.length > 100) {
            ws!.send(JSON.stringify({
              realtimeInput: {
                audio: { data, mimeType: 'audio/mp4' },
              },
            }));
          }
          // Clean up temp file
          try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
        }
        recording = null;
      }

      // Start a new recording chunk (if still active)
      if (!isRecording) return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording = newRec;

      // Wait 2 seconds then send this chunk and start next
      streamInterval = setTimeout(recordAndSendChunk, 2000) as any;
    } catch (error) {
      console.warn('[GeminiLive] Chunk recording error:', error);
      // Try again after a brief delay
      if (isRecording) {
        streamInterval = setTimeout(recordAndSendChunk, 1000) as any;
      }
    }
  };

  // Start first chunk after a tiny delay
  streamInterval = setTimeout(recordAndSendChunk, 500) as any;
}

function stopAudioStreaming(): void {
  isRecording = false;
  if (streamInterval) { clearTimeout(streamInterval as any); streamInterval = null; }
}

export async function stopMicrophone(): Promise<void> {
  stopAudioStreaming();
  if (recording) {
    try {
      // Send the final chunk
      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();
      if (uri && ws && isConnected && isSetupComplete) {
        const data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        if (data && data.length > 100) {
          ws.send(JSON.stringify({ realtimeInput: { audio: { data, mimeType: 'audio/mp4' } } }));
        }
        try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
      }
    } catch {}
    recording = null;
  }
}

// ==========================================
// Audio playback
// ==========================================
async function playCollectedAudio(): Promise<void> {
  if (isPlaying || audioQueue.length === 0) return;
  isPlaying = true;

  try {
    const allAudio = audioQueue.splice(0, audioQueue.length).join('');
    const wavB64 = pcmToWav(allAudio, 24000);
    const uri = FileSystem.cacheDirectory + `gemini_${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(uri, wavB64, { encoding: FileSystem.EncodingType.Base64 });

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri });
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
        isPlaying = false;
        if (audioQueue.length > 0) playCollectedAudio();
      }
    });
    await sound.playAsync();
  } catch (error) {
    console.error('[GeminiLive] Playback error:', error);
    isPlaying = false;
  }
}

function stopAudioPlayback(): void {
  audioQueue = [];
  if (currentSound) {
    currentSound.stopAsync().catch(() => {});
    currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
  isPlaying = false;
}

function pcmToWav(pcmB64: string, sampleRate: number): string {
  const raw = atob(pcmB64);
  const len = raw.length;
  const buf = new ArrayBuffer(44);
  const v = new DataView(buf);

  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, len, true);

  const hdr = new Uint8Array(buf);
  const out = new Uint8Array(44 + len);
  out.set(hdr);
  for (let i = 0; i < len; i++) out[44 + i] = raw.charCodeAt(i);

  let bin = '';
  for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
  return btoa(bin);
}

// ==========================================
// Tool handlers & cleanup
// ==========================================
export function registerToolHandlers(handlers: Record<string, (args: any) => Promise<any>>): void {
  toolHandlers = handlers;
}

function disconnectWebSocket(): void {
  stopMicrophone();
  stopAudioPlayback();
  if (ws) { try { ws.close(1000); } catch {} ws = null; }
  isConnected = false;
  isSetupComplete = false;
}

export function disconnectLive(): void {
  disconnectWebSocket();
  restChat = null;
  restModel = null;
  toolHandlers = {};
  onTranscript = null;
  onConnectionChange = null;
  onError = null;
}

export function isLiveConnected(): boolean {
  return true; // REST fallback always available
}
