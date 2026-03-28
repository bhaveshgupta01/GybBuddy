import { PaceZone } from '../types';

/**
 * Convert speed in m/s to pace in seconds per km
 */
export function speedToPace(speedMs: number): number {
  if (speedMs <= 0) return 0;
  return 1000 / speedMs;
}

/**
 * Format pace (seconds per km) to "M:SS" string
 */
export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0 || !isFinite(secondsPerKm)) return '--:--';
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format pace for imperial (seconds per mile)
 */
export function paceToMile(secondsPerKm: number): number {
  return secondsPerKm * 1.60934;
}

/**
 * Format duration in seconds to "HH:MM:SS" or "MM:SS"
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters to readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Calculate how far ahead/behind target pace (negative = ahead/faster)
 */
export function paceDeviation(currentPace: number, targetPace: number): number {
  return currentPace - targetPace;
}

/**
 * Get human-readable pace comparison
 */
export function paceComparisonText(currentPace: number, targetPace: number): string {
  const diff = paceDeviation(currentPace, targetPace);
  const absDiff = Math.abs(diff);

  if (absDiff < 5) return 'right on target';

  const amount = `${Math.floor(absDiff)}s/km`;
  if (diff < 0) return `${amount} faster than target`;
  return `${amount} slower than target`;
}

/**
 * Categorize pace into zones based on target pace
 */
export function getPaceZone(currentPace: number, targetPace: number): PaceZone {
  const ratio = currentPace / targetPace;

  if (ratio > 1.2) return 'easy';
  if (ratio > 1.05) return 'tempo';
  if (ratio > 0.95) return 'threshold';
  if (ratio > 0.85) return 'interval';
  return 'sprint';
}

/**
 * Estimate calories burned (rough approximation)
 * MET values: running ~10, walking ~3.5
 */
export function estimateCalories(
  distanceMeters: number,
  durationSeconds: number,
  weightKg: number = 70,
  isRunning: boolean = true
): number {
  const met = isRunning ? 10 : 3.5;
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}

/**
 * Calculate cadence from step count over a time window
 */
export function calculateCadence(steps: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((steps / durationSeconds) * 60);
}
