import { buildSystemPrompt } from '../constants/prompts';
import { CharacterId, SportMode, RunStats } from '../types';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

// State
let ws: WebSocket | null = null;
let isConnected = false;
let isSetupComplete = false;
let recording: Audio.Recording | null = null;
let toolHandlers: Record<string, (args: any) => Promise<any>> = {};

// Callbacks
let onTranscript: ((text: string, role: 'user' | 'assistant') => void) | null = null;
let onAudioResponse: ((audioBase64: string) => void) | null = null;
let onConnectionChange: ((connected: boolean) => void) | null = null;
let onError: ((error: string) => void) | null = null;

// Audio playback queue
let audioQueue: string[] = [];
let isPlaying = false;
let currentSound: Audio.Sound | null = null;

const GEMINI_TOOLS = [
  {
    name: 'get_current_stats',
    description: "Get the runner's current stats: pace, distance, time, speed, elevation, cadence.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_route_info',
    description: 'Get current route info: next turn, distance to turn, distance remaining, ETA.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_split_times',
    description: 'Get pace breakdown for each completed km split.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'find_nearby_places',
    description: 'Find nearby cafes, restrooms, water fountains, convenience stores, parks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', description: 'Place type: cafe, water_fountain, restroom, convenience_store, gym, park' },
      },
      required: ['type'],
    },
  },
  {
    name: 'get_weather',
    description: "Get current weather and forecast at the runner's location.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'web_search',
    description: 'Search the internet for anything — news, scores, trivia, restaurants.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_location_context',
    description: 'Get info about the current neighborhood, landmarks, points of interest.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'generate_route',
    description: 'Generate a running/walking route. Supports shapes (heart, star) and moods (flat, scenic).',
    parameters: {
      type: 'OBJECT',
      properties: {
        shape: { type: 'STRING', description: 'Route shape: heart, star, circle' },
        distance_km: { type: 'NUMBER', description: 'Target distance in km' },
        mood: { type: 'STRING', description: 'Route mood: flat, scenic, surprise, challenging' },
      },
    },
  },
  {
    name: 'get_training_plan',
    description: "Get today's training plan and marathon prep progress.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_achievements',
    description: 'Check recent achievements, badges, streak, and XP.',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

/**
 * Connect to Gemini Live API via WebSocket
 */
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
  onAudioResponse = callbacks.onAudioResponse;
  onConnectionChange = callbacks.onConnectionChange;
  onError = callbacks.onError;

  disconnectLive();

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[GeminiLive] WebSocket connected, sending setup...');
    isConnected = true;
    onConnectionChange?.(true);

    const systemPrompt = buildSystemPrompt(sportMode, characterId);

    // Send setup message
    const setup = {
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
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [{ functionDeclarations: GEMINI_TOOLS }],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            startOfSpeechSensitivity: 'HIGH',
            endOfSpeechSensitivity: 'MEDIUM',
            prefixPaddingMs: 100,
            silenceDurationMs: 1000,
          },
        },
      },
    };

    ws!.send(JSON.stringify(setup));
  };

  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(typeof event.data === 'string' ? event.data : '{}');

      // Setup complete
      if (data.setupComplete) {
        console.log('[GeminiLive] Setup complete');
        isSetupComplete = true;
        return;
      }

      // Tool call from Gemini
      if (data.toolCall) {
        await handleToolCall(data.toolCall);
        return;
      }

      // Tool call cancellation
      if (data.toolCallCancellation) {
        console.log('[GeminiLive] Tool call cancelled:', data.toolCallCancellation.ids);
        return;
      }

      // Server content (audio/text response)
      if (data.serverContent) {
        const content = data.serverContent;

        // Handle audio parts — collect chunks
        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              audioQueue.push(part.inlineData.data);
            }
            if (part.text) {
              onTranscript?.(part.text, 'assistant');
            }
          }
        }

        // Turn complete — play all collected audio
        if (content.turnComplete) {
          if (audioQueue.length > 0) {
            playNextAudio();
          }
        }

        // Output transcription (what Gemini said as text)
        if (content.outputTranscription?.text) {
          const text = content.outputTranscription.text.trim();
          if (text) onTranscript?.(text, 'assistant');
        }

        // Input transcription (what user said as text)
        if (content.inputTranscription?.text) {
          const text = content.inputTranscription.text.trim();
          if (text) onTranscript?.(text, 'user');
        }

        // Model interrupted by user (barge-in)
        if (content.interrupted) {
          stopAudioPlayback();
        }
      }
    } catch (error) {
      console.error('[GeminiLive] Message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('[GeminiLive] WebSocket error:', error);
    onError?.('Connection error with Gemini');
    isConnected = false;
    onConnectionChange?.(false);
  };

  ws.onclose = (event) => {
    console.log('[GeminiLive] WebSocket closed:', event.code, event.reason);
    isConnected = false;
    isSetupComplete = false;
    onConnectionChange?.(false);

    // Auto-reconnect after 3 seconds (for session timeout)
    if (event.code !== 1000) {
      setTimeout(() => {
        if (!isConnected && onTranscript) {
          console.log('[GeminiLive] Attempting reconnect...');
          connectLive(sportMode, characterId, callbacks);
        }
      }, 3000);
    }
  };
}

/**
 * Get appropriate voice for character
 */
function getVoiceForCharacter(characterId: CharacterId): string {
  const voices: Record<CharacterId, string> = {
    drill: 'Orus',     // Deep, commanding
    chill: 'Vale',     // Relaxed, smooth
    hype: 'Zephyr',    // Energetic, bright
    sensei: 'Puck',    // Calm, measured
  };
  return voices[characterId];
}

/**
 * Handle function calls from Gemini
 */
async function handleToolCall(toolCall: any): Promise<void> {
  const responses: any[] = [];

  for (const call of toolCall.functionCalls) {
    const handler = toolHandlers[call.name];
    let responseData: any;

    if (handler) {
      try {
        responseData = await handler(call.args || {});
      } catch (error) {
        responseData = { error: `Tool ${call.name} failed: ${error}` };
      }
    } else {
      responseData = { error: `No handler for tool: ${call.name}` };
    }

    responses.push({
      id: call.id,
      response: responseData,
    });
  }

  // Send tool responses back
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      toolResponse: {
        functionResponses: responses,
      },
    }));
  }
}

/**
 * Start microphone recording and stream audio to Gemini
 */
export async function startMicrophone(): Promise<void> {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      onError?.('Microphone permission denied');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Start recording with PCM format
    const { recording: newRecording } = await Audio.Recording.createAsync({
      isMeteringEnabled: false,
      android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
      },
      ios: {
        extension: '.wav',
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    });

    recording = newRecording;
    console.log('[GeminiLive] Microphone recording started');

    // Stream audio chunks every 250ms
    startAudioStreaming();
  } catch (error) {
    console.error('[GeminiLive] Microphone start error:', error);
    onError?.('Failed to start microphone');
  }
}

let streamingInterval: ReturnType<typeof setInterval> | null = null;
let lastFileSize = 0;

function startAudioStreaming(): void {
  stopAudioStreaming();

  streamingInterval = setInterval(async () => {
    if (!recording || !ws || !isConnected || !isSetupComplete) return;

    try {
      const uri = recording.getURI();
      if (!uri) return;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !('size' in fileInfo)) return;

      const currentSize = fileInfo.size;
      if (currentSize <= lastFileSize) return;

      // Read the new audio data
      const audioData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (audioData && audioData.length > 0) {
        ws.send(JSON.stringify({
          realtimeInput: {
            audio: {
              data: audioData,
              mimeType: 'audio/pcm;rate=16000',
            },
          },
        }));
        lastFileSize = currentSize;
      }
    } catch (error) {
      // Silently handle streaming errors
    }
  }, 250);
}

function stopAudioStreaming(): void {
  if (streamingInterval) {
    clearInterval(streamingInterval);
    streamingInterval = null;
  }
  lastFileSize = 0;
}

/**
 * Stop microphone recording
 */
export async function stopMicrophone(): Promise<void> {
  stopAudioStreaming();

  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // ignore
    }
    recording = null;
  }
}

/**
 * Play audio response from Gemini (24kHz PCM)
 */
async function playNextAudio(): Promise<void> {
  if (isPlaying || audioQueue.length === 0) return;
  isPlaying = true;

  try {
    // Combine queued audio chunks
    const audioData = audioQueue.splice(0, audioQueue.length).join('');

    // Write PCM data to a temp file as WAV
    const wavBase64 = createWavFromPcm(audioData, 24000);
    const fileUri = FileSystem.cacheDirectory + `gemini_audio_${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(fileUri, wavBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
        isPlaying = false;
        // Play next chunk if available
        if (audioQueue.length > 0) {
          playNextAudio();
        }
      }
    });

    await sound.playAsync();
  } catch (error) {
    console.error('[GeminiLive] Audio playback error:', error);
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

/**
 * Create a WAV file header for raw PCM data
 */
function createWavFromPcm(pcmBase64: string, sampleRate: number): string {
  const pcmBytes = atob(pcmBase64);
  const pcmLength = pcmBytes.length;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmLength, true);

  // Combine header + PCM data
  const headerBytes = new Uint8Array(header);
  const combined = new Uint8Array(44 + pcmLength);
  combined.set(headerBytes);
  for (let i = 0; i < pcmLength; i++) {
    combined[44 + i] = pcmBytes.charCodeAt(i);
  }

  // Convert to base64
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Send a text message through the Live API
 */
export function sendTextMessage(text: string): void {
  if (!ws || !isConnected || !isSetupComplete) {
    onError?.('Not connected to Gemini');
    return;
  }

  ws.send(JSON.stringify({
    clientContent: {
      turns: [{
        role: 'user',
        parts: [{ text }],
      }],
      turnComplete: true,
    },
  }));

  onTranscript?.(text, 'user');
}

/**
 * Send context update (stats) as text
 */
export function sendContextUpdate(stats: RunStats, extraContext?: string): void {
  if (!ws || !isConnected || !isSetupComplete) return;

  const statsText = `[STATS UPDATE: Distance: ${(stats.distance / 1000).toFixed(2)}km, ` +
    `Pace: ${formatPace(stats.currentPace)}/km, ` +
    `Avg: ${formatPace(stats.averagePace)}/km, ` +
    `Duration: ${Math.floor(stats.duration / 60)}:${Math.floor(stats.duration % 60).toString().padStart(2, '0')}, ` +
    `Cadence: ${stats.cadence}spm` +
    `${extraContext ? ' | ' + extraContext : ''}]`;

  ws.send(JSON.stringify({
    clientContent: {
      turns: [{
        role: 'user',
        parts: [{ text: statsText }],
      }],
      turnComplete: true,
    },
  }));
}

function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0 || !isFinite(secondsPerKm)) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Register tool handlers
 */
export function registerToolHandlers(handlers: Record<string, (args: any) => Promise<any>>): void {
  toolHandlers = handlers;
}

/**
 * Disconnect and clean up
 */
export function disconnectLive(): void {
  stopMicrophone();
  stopAudioPlayback();

  if (ws) {
    ws.close(1000, 'Session ended');
    ws = null;
  }

  isConnected = false;
  isSetupComplete = false;
  toolHandlers = {};
  onTranscript = null;
  onAudioResponse = null;
  onConnectionChange = null;
  onError = null;
}

/**
 * Check connection status
 */
export function isLiveConnected(): boolean {
  return isConnected && isSetupComplete;
}
