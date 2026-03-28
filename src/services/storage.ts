import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunStats, SportMode, CharacterId } from '../types';
import { formatPace, formatDistance, formatDuration } from '../utils/pace';

export interface SavedRun {
  id: string;
  date: string; // ISO string
  sportMode: SportMode;
  characterId: CharacterId;
  distance: number;
  duration: number;
  averagePace: number;
  calories: number;
  splits: { km: number; pace: string }[];
}

const RUNS_KEY = '@gymbro_runs';
const PROFILE_KEY = '@gymbro_profile';

export async function saveRun(
  stats: RunStats,
  sportMode: SportMode,
  characterId: CharacterId
): Promise<SavedRun> {
  const run: SavedRun = {
    id: `run_${Date.now()}`,
    date: new Date().toISOString(),
    sportMode,
    characterId,
    distance: stats.distance,
    duration: stats.duration,
    averagePace: stats.averagePace,
    calories: stats.calories,
    splits: stats.splits.map((s, i) => ({ km: i + 1, pace: formatPace(s.pace) })),
  };

  const runs = await getRuns();
  runs.unshift(run); // newest first
  await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(runs));

  // Update profile stats
  const profile = await getProfile();
  profile.totalRuns += 1;
  profile.totalDistance += stats.distance;
  profile.totalDuration += stats.duration;
  profile.lastRunDate = run.date;
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  return run;
}

export async function getRuns(): Promise<SavedRun[]> {
  try {
    const data = await AsyncStorage.getItem(RUNS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export interface ProfileStats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  lastRunDate: string | null;
}

export async function getProfile(): Promise<ProfileStats> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { totalRuns: 0, totalDistance: 0, totalDuration: 0, lastRunDate: null };
  } catch {
    return { totalRuns: 0, totalDistance: 0, totalDuration: 0, lastRunDate: null };
  }
}
