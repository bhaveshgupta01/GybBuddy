// ==========================================
// GymBro Type Definitions
// ==========================================

// --- Sport & Activity Types ---

export type SportMode = 'running' | 'walking' | 'treadmill';

export type RunState = 'idle' | 'countdown' | 'active' | 'paused' | 'finished';

export type PaceZone = 'easy' | 'tempo' | 'threshold' | 'interval' | 'sprint';

// --- Character System ---

export type CharacterId = 'drill' | 'chill' | 'hype' | 'sensei';

export interface Character {
  id: CharacterId;
  name: string;
  subtitle: string;
  avatar: string;
  sampleQuote: string;
  color: string;
  voiceConfig: {
    pitch: number;
    rate: number;
  };
}

// --- Location & GPS ---

export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  maneuver?: string;
}

export interface PlannedRoute {
  id: string;
  name: string;
  totalDistance: number; // meters
  estimatedDuration: number; // seconds
  steps: RouteStep[];
  polyline: { latitude: number; longitude: number }[];
  shape?: string; // 'heart', 'star', etc.
}

// --- Run Tracking ---

export interface SplitTime {
  distance: number; // meters (1000 = 1km)
  time: number; // seconds
  pace: number; // seconds per km
}

export interface RunStats {
  distance: number; // meters
  duration: number; // seconds
  currentPace: number; // seconds per km
  averagePace: number; // seconds per km
  currentSpeed: number; // m/s
  elevation: number; // meters
  elevationGain: number; // meters
  calories: number;
  cadence: number; // steps per minute
  splits: SplitTime[];
  heartRate?: number;
}

export interface RunSession {
  id: string;
  sportMode: SportMode;
  state: RunState;
  characterId: CharacterId;
  startTime: number;
  endTime?: number;
  stats: RunStats;
  breadcrumbs: GpsPoint[];
  route?: PlannedRoute;
  targetPace?: number; // seconds per km
}

// --- Gemini Agent ---

export type GeminiConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface CoachingEvent {
  type: 'navigation' | 'pace' | 'milestone' | 'safety' | 'weather' | 'social' | 'place' | 'achievement';
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// --- Gemini Function Calling Tool Definitions ---

export interface GeminiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// --- Nearby Places ---

export interface NearbyPlace {
  id: string;
  name: string;
  type: PlaceType;
  location: { lat: number; lng: number };
  distance: number; // meters from user
  rating?: number;
  isOpen?: boolean;
}

export type PlaceType = 'cafe' | 'water_fountain' | 'restroom' | 'convenience_store' | 'gym' | 'park';

// --- Training Plan ---

export type WorkoutType = 'easy' | 'tempo' | 'long' | 'interval' | 'recovery' | 'rest' | 'race';

export interface TrainingDay {
  date: string; // ISO date string
  workoutType: WorkoutType;
  targetDistance?: number; // meters
  targetPace?: number; // seconds per km
  notes?: string;
  completed?: boolean;
  actualDistance?: number;
  actualPace?: number;
}

export interface TrainingPlan {
  id: string;
  goalRace: string;
  raceDate: string;
  startDate: string;
  weeks: TrainingDay[][];
}

// --- Gamification ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  category: 'distance' | 'streak' | 'speed' | 'social' | 'fun';
}

export interface UserProfile {
  id: string;
  displayName: string;
  selectedCharacter: CharacterId;
  totalDistance: number; // meters, all time
  totalRuns: number;
  currentStreak: number; // days
  longestStreak: number;
  level: number;
  xp: number;
  achievements: string[]; // achievement IDs
  strideLength?: number; // meters, for treadmill calibration
}

// --- Config ---

export interface AppConfig {
  googleMapsApiKey: string;
  geminiApiKey: string;
  firebaseConfig: Record<string, string>;
  units: 'metric' | 'imperial';
}
