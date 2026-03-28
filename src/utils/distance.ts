import { GpsPoint } from '../types';

const EARTH_RADIUS_M = 6371000;

/**
 * Haversine formula: calculate distance between two GPS coordinates in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate total distance from an array of GPS breadcrumbs
 */
export function totalDistance(points: GpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return total;
}

/**
 * Simple moving average GPS smoothing
 * Smooths GPS jitter by averaging the last N points
 */
export function smoothGpsPoint(
  points: GpsPoint[],
  windowSize: number = 3
): GpsPoint | null {
  if (points.length === 0) return null;

  const window = points.slice(-windowSize);
  const avgLat = window.reduce((sum, p) => sum + p.latitude, 0) / window.length;
  const avgLon = window.reduce((sum, p) => sum + p.longitude, 0) / window.length;
  const latest = window[window.length - 1];

  return {
    ...latest,
    latitude: avgLat,
    longitude: avgLon,
  };
}

/**
 * Check if GPS location is stationary (within threshold meters)
 * Used for treadmill detection
 */
export function isStationary(
  points: GpsPoint[],
  thresholdMeters: number = 10,
  windowSize: number = 10
): boolean {
  if (points.length < windowSize) return false;

  const recent = points.slice(-windowSize);
  const first = recent[0];

  return recent.every(
    (p) => haversineDistance(first.latitude, first.longitude, p.latitude, p.longitude) < thresholdMeters
  );
}

/**
 * Calculate bearing between two points (for map heading)
 */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  const brng = Math.atan2(y, x);
  return ((brng * 180) / Math.PI + 360) % 360;
}

/**
 * Calculate elevation gain from GPS breadcrumbs
 */
export function elevationGain(points: GpsPoint[]): number {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].altitude;
    const curr = points[i].altitude;
    if (prev != null && curr != null && curr > prev) {
      gain += curr - prev;
    }
  }
  return gain;
}
