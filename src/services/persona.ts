import { GoogleGenerativeAI } from '@google/generative-ai';
import { RunStats } from '../types';
import { formatPace, formatDistance, formatDuration } from '../utils/pace';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface UserPersona {
  title: string;        // e.g. "The Dawn Strider"
  description: string;  // one-line motivation
  emoji: string;        // avatar emoji combo
  color: string;        // accent color hex
  generatedAt: number;
}

const DEFAULT_PERSONA: UserPersona = {
  title: 'New Runner',
  description: 'Go for your first run and discover your persona',
  emoji: '🌅',
  color: '#A8D5C2',
  generatedAt: 0,
};

/**
 * Generate a unique AI persona based on the user's run history
 */
export async function generatePersona(
  totalRuns: number,
  totalDistance: number,
  avgPace: number,
  currentStreak: number,
  favoriteTime: string,
  recentSplits: number[],
): Promise<UserPersona> {
  if (totalRuns === 0) return DEFAULT_PERSONA;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are creating a unique runner persona/identity for a fitness app user based on their running data.

User stats:
- Total runs: ${totalRuns}
- Total distance: ${formatDistance(totalDistance)}
- Average pace: ${formatPace(avgPace)}/km
- Current streak: ${currentStreak} days
- Favorite time to run: ${favoriteTime}
- Recent split consistency: ${recentSplits.length > 0 ? 'varies' : 'no data'}

Generate a persona with:
1. A creative title (2-3 words, like "The Dawn Strider", "Midnight Phoenix", "Steady Flame", "Iron Gazelle")
2. A one-line motivational description (max 12 words, personal and inspiring)
3. A single emoji that represents this persona
4. A hex color that represents their energy

Respond in this exact JSON format, nothing else:
{"title": "...", "description": "...", "emoji": "...", "color": "#..."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || 'Runner',
        description: parsed.description || 'Keep moving forward',
        emoji: parsed.emoji || '🏃',
        color: parsed.color || '#A8D5C2',
        generatedAt: Date.now(),
      };
    }
  } catch (error) {
    console.error('Persona generation error:', error);
  }

  return {
    title: totalRuns < 5 ? 'Rising Star' : 'Steady Runner',
    description: totalRuns < 5 ? 'Every step writes your story' : 'Consistency is your superpower',
    emoji: totalRuns < 5 ? '⭐' : '🔥',
    color: '#A8D5C2',
    generatedAt: Date.now(),
  };
}

export { DEFAULT_PERSONA };
