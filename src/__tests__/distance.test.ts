import {
  haversineDistance,
  totalDistance,
  isStationary,
  bearing,
  elevationGain,
} from '../utils/distance';
import { GpsPoint } from '../types';

function makePoint(lat: number, lng: number, alt: number | null = null): GpsPoint {
  return { latitude: lat, longitude: lng, altitude: alt, accuracy: 10, speed: 0, heading: 0, timestamp: Date.now() };
}

describe('Distance Utilities', () => {
  describe('haversineDistance', () => {
    it('returns 0 for same point', () => {
      expect(haversineDistance(0, 0, 0, 0)).toBe(0);
    });

    it('calculates roughly correct distance for known points', () => {
      // NYC to LA is about 3944 km
      const dist = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(dist).toBeGreaterThan(3900000);
      expect(dist).toBeLessThan(4000000);
    });

    it('calculates short distances accurately', () => {
      // ~111m per 0.001 degree latitude
      const dist = haversineDistance(0, 0, 0.001, 0);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(120);
    });
  });

  describe('totalDistance', () => {
    it('returns 0 for empty array', () => {
      expect(totalDistance([])).toBe(0);
    });

    it('returns 0 for single point', () => {
      expect(totalDistance([makePoint(0, 0)])).toBe(0);
    });

    it('sums distances between points', () => {
      const points = [
        makePoint(0, 0),
        makePoint(0.001, 0),
        makePoint(0.002, 0),
      ];
      const dist = totalDistance(points);
      expect(dist).toBeGreaterThan(200);
      expect(dist).toBeLessThan(230);
    });
  });

  describe('isStationary', () => {
    it('returns false with too few points', () => {
      const points = [makePoint(0, 0)];
      expect(isStationary(points, 10, 10)).toBe(false);
    });

    it('returns true when all points are close together', () => {
      const points = Array(15).fill(null).map(() => makePoint(0, 0));
      expect(isStationary(points, 10, 10)).toBe(true);
    });

    it('returns false when points are spread out', () => {
      const points = Array(15).fill(null).map((_, i) => makePoint(i * 0.001, 0));
      expect(isStationary(points, 10, 10)).toBe(false);
    });
  });

  describe('bearing', () => {
    it('returns ~0 for due north', () => {
      const b = bearing(0, 0, 1, 0);
      expect(b).toBeCloseTo(0, 0);
    });

    it('returns ~90 for due east', () => {
      const b = bearing(0, 0, 0, 1);
      expect(b).toBeCloseTo(90, 0);
    });

    it('returns ~180 for due south', () => {
      const b = bearing(0, 0, -1, 0);
      expect(b).toBeCloseTo(180, 0);
    });
  });

  describe('elevationGain', () => {
    it('returns 0 for flat terrain', () => {
      const points = [makePoint(0, 0, 100), makePoint(0, 0, 100), makePoint(0, 0, 100)];
      expect(elevationGain(points)).toBe(0);
    });

    it('counts only uphill', () => {
      const points = [
        makePoint(0, 0, 100),
        makePoint(0, 0, 150), // +50
        makePoint(0, 0, 130), // downhill, ignored
        makePoint(0, 0, 180), // +50
      ];
      expect(elevationGain(points)).toBe(100);
    });

    it('handles null altitudes', () => {
      const points = [makePoint(0, 0, null), makePoint(0, 0, 100)];
      expect(elevationGain(points)).toBe(0);
    });
  });
});
