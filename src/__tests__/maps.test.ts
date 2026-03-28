import { generateShapeWaypoints } from '../services/maps';

describe('Maps Service', () => {
  describe('generateShapeWaypoints', () => {
    const center = { lat: 28.6139, lng: 77.2090 }; // Delhi

    it('generates heart waypoints', () => {
      const points = generateShapeWaypoints(center, 'heart', 2);
      expect(points.length).toBeGreaterThan(5);
      points.forEach((p) => {
        expect(p.lat).toBeDefined();
        expect(p.lng).toBeDefined();
        expect(typeof p.lat).toBe('number');
        expect(typeof p.lng).toBe('number');
      });
    });

    it('generates star waypoints', () => {
      const points = generateShapeWaypoints(center, 'star', 2);
      expect(points.length).toBe(10); // 5-pointed star = 10 vertices
    });

    it('generates circle waypoints', () => {
      const points = generateShapeWaypoints(center, 'circle', 2);
      expect(points.length).toBe(8);
    });

    it('defaults to circle for unknown shape', () => {
      const points = generateShapeWaypoints(center, 'triangle', 2);
      expect(points.length).toBe(8); // falls back to circle
    });

    it('waypoints are near the center', () => {
      const points = generateShapeWaypoints(center, 'heart', 1);
      points.forEach((p) => {
        // Should be within ~0.01 degrees (~1km)
        expect(Math.abs(p.lat - center.lat)).toBeLessThan(0.02);
        expect(Math.abs(p.lng - center.lng)).toBeLessThan(0.02);
      });
    });

    it('larger size produces wider spread', () => {
      const small = generateShapeWaypoints(center, 'circle', 1);
      const large = generateShapeWaypoints(center, 'circle', 5);

      const smallSpread = Math.max(...small.map((p) => Math.abs(p.lat - center.lat)));
      const largeSpread = Math.max(...large.map((p) => Math.abs(p.lat - center.lat)));

      expect(largeSpread).toBeGreaterThan(smallSpread);
    });
  });
});
