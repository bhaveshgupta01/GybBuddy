import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
  FunctionDeclarationSchemaType,
  Content,
} from '@google/generative-ai';
import { buildSystemPrompt, GEMINI_TOOLS_DESCRIPTION } from '../constants/prompts';
import { CharacterId, SportMode, RunStats, ChatMessage } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;
let chat: ChatSession | null = null;

// Tool execution handlers — set by the hook that manages run state
let toolHandlers: Record<string, (args: any) => Promise<any>> = {};

const GEMINI_TOOLS = [
  {
    name: 'get_current_stats',
    description: 'Get the runner\'s current stats including pace, distance, time, speed, elevation, and cadence.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_route_info',
    description: 'Get info about the current route: next turn direction, distance to next turn, total distance remaining, ETA.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_split_times',
    description: 'Get pace breakdown for each completed km/mile split.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'find_nearby_places',
    description: 'Search for nearby places like cafes, restrooms, water fountains, convenience stores, parks.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        type: {
          type: FunctionDeclarationSchemaType.STRING,
          description: 'Type of place to search for: cafe, water_fountain, restroom, convenience_store, gym, park',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather conditions and short forecast at the runner\'s current location.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'web_search',
    description: 'Search the internet for any information — news, sports scores, trivia, restaurant reviews, anything.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        query: {
          type: FunctionDeclarationSchemaType.STRING,
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_location_context',
    description: 'Get information about the current neighborhood, nearby landmarks, and points of interest.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'generate_route',
    description: 'Generate a new running/walking route. Can create shaped routes (heart, star) or mood-based routes.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        shape: {
          type: FunctionDeclarationSchemaType.STRING,
          description: 'Optional shape for the route: heart, star, circle',
        },
        distance_km: {
          type: FunctionDeclarationSchemaType.NUMBER,
          description: 'Target distance in kilometers',
        },
        mood: {
          type: FunctionDeclarationSchemaType.STRING,
          description: 'Route mood: flat, scenic, surprise, challenging',
        },
      },
    },
  },
  {
    name: 'get_training_plan',
    description: 'Get today\'s training plan and overall marathon/race prep progress.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_achievements',
    description: 'Check recent achievements, upcoming badges, current streak, and XP progress.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {},
    },
  },
];

/**
 * Initialize Gemini with character and sport mode
 */
export function initializeGemini(
  sportMode: SportMode,
  characterId: CharacterId
): void {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const systemPrompt = buildSystemPrompt(sportMode, characterId) + '\n\n' + GEMINI_TOOLS_DESCRIPTION;

  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    tools: [{ functionDeclarations: GEMINI_TOOLS }],
  });

  chat = model.startChat({
    history: [],
  });
}

/**
 * Register tool execution handlers
 */
export function registerToolHandlers(handlers: Record<string, (args: any) => Promise<any>>): void {
  toolHandlers = handlers;
}

/**
 * Send a message to Gemini and get a response (handles function calling loop)
 */
export async function sendMessage(message: string): Promise<string> {
  if (!chat) throw new Error('Gemini not initialized. Call initializeGemini first.');

  try {
    let response = await chat.sendMessage(message);
    let result = response.response;

    // Handle function calling loop
    while (result.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall)) {
      const functionCalls = result.candidates[0].content.parts.filter(
        (p: any) => p.functionCall
      );

      const functionResponses: any[] = [];

      for (const part of functionCalls) {
        const call = (part as any).functionCall;
        const handler = toolHandlers[call.name];

        let responseData: any;
        if (handler) {
          try {
            responseData = await handler(call.args || {});
          } catch (error) {
            responseData = { error: `Tool ${call.name} failed: ${error}` };
          }
        } else {
          responseData = { error: `No handler registered for tool: ${call.name}` };
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: responseData,
          },
        });
      }

      response = await chat.sendMessage(functionResponses);
      result = response.response;
    }

    return result.text() || "I'm here, just catching my breath!";
  } catch (error) {
    console.error('Gemini error:', error);
    return "Sorry, lost connection for a sec. I'm back!";
  }
}

/**
 * Send a context update (run stats) to Gemini as a system-like message
 */
export async function sendContextUpdate(stats: RunStats, extraContext?: string): Promise<string> {
  const statsText = `[CONTEXT UPDATE - Current stats: Distance: ${(stats.distance / 1000).toFixed(2)}km, ` +
    `Duration: ${Math.floor(stats.duration / 60)}:${Math.floor(stats.duration % 60).toString().padStart(2, '0')}, ` +
    `Current Pace: ${formatPaceForGemini(stats.currentPace)}/km, ` +
    `Avg Pace: ${formatPaceForGemini(stats.averagePace)}/km, ` +
    `Cadence: ${stats.cadence} spm` +
    `${extraContext ? ', ' + extraContext : ''}]` +
    `\nBased on these stats, if there's something worth mentioning, say it briefly. Otherwise just say "ok" and nothing else.`;

  return sendMessage(statsText);
}

/**
 * Get an initial greeting from the coach
 */
export async function getGreeting(sportMode: SportMode): Promise<string> {
  const greetings: Record<SportMode, string> = {
    running: "Hey! I just started a run. Let's go!",
    walking: "Hey! Going for a walk. Keep me company?",
    treadmill: "Hey! I'm on the treadmill. Let's make this fun.",
  };

  return sendMessage(greetings[sportMode]);
}

function formatPaceForGemini(secondsPerKm: number): string {
  if (secondsPerKm <= 0 || !isFinite(secondsPerKm)) return '--:--';
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * End the session and get a summary
 */
export async function getRunSummary(stats: RunStats): Promise<string> {
  const message = `[RUN COMPLETE] Final stats: Distance: ${(stats.distance / 1000).toFixed(2)}km, ` +
    `Duration: ${Math.floor(stats.duration / 60)}:${Math.floor(stats.duration % 60).toString().padStart(2, '0')}, ` +
    `Avg Pace: ${formatPaceForGemini(stats.averagePace)}/km, ` +
    `Splits: ${stats.splits.map((s, i) => `km${i + 1}: ${formatPaceForGemini(s.pace)}`).join(', ')}. ` +
    `Give me a fun, conversational post-run debrief. Highlight the best split, overall performance, and encouragement.`;

  return sendMessage(message);
}

/**
 * Clean up
 */
export function disconnectGemini(): void {
  chat = null;
  model = null;
  genAI = null;
  toolHandlers = {};
}
