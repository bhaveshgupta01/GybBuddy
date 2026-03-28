import { Character, CharacterId } from '../types';

export const CHARACTERS: Record<CharacterId, Character> = {
  drill: {
    id: 'drill',
    name: 'Coach Drill',
    subtitle: 'No excuses. No mercy.',
    avatar: '🪖',
    sampleQuote: "You call that a pace? My grandmother runs faster. PICK IT UP!",
    color: '#FF4444',
    voiceConfig: { pitch: 0.8, rate: 1.1 },
  },
  chill: {
    id: 'chill',
    name: 'Chill Charlie',
    subtitle: 'Easy does it, friend.',
    avatar: '😎',
    sampleQuote: "Hey no worries, we're just out here vibing. You're doing great.",
    color: '#4ECDC4',
    voiceConfig: { pitch: 1.0, rate: 0.95 },
  },
  hype: {
    id: 'hype',
    name: 'Hype Queen',
    subtitle: 'ENERGY. ALWAYS.',
    avatar: '👑',
    sampleQuote: "YESSS you're absolutely CRUSHING this right now!! Let's GOOO!",
    color: '#FF69B4',
    voiceConfig: { pitch: 1.3, rate: 1.15 },
  },
  sensei: {
    id: 'sensei',
    name: 'Sensei',
    subtitle: 'Strength through stillness.',
    avatar: '🧘',
    sampleQuote: "Focus on your breath. Each step is a meditation. You are strong.",
    color: '#9B59B6',
    voiceConfig: { pitch: 0.9, rate: 0.85 },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
