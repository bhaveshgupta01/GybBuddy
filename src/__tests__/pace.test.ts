import {
  speedToPace,
  formatPace,
  formatDuration,
  formatDistance,
  paceDeviation,
  paceComparisonText,
  getPaceZone,
  estimateCalories,
  calculateCadence,
} from '../utils/pace';

describe('Pace Utilities', () => {
  describe('speedToPace', () => {
    it('converts m/s to seconds per km', () => {
      // 1000m / 3.33 m/s = ~300 seconds = 5:00/km
      expect(Math.round(speedToPace(3.333))).toBe(300);
    });

    it('returns 0 for zero speed', () => {
      expect(speedToPace(0)).toBe(0);
    });

    it('returns 0 for negative speed', () => {
      expect(speedToPace(-1)).toBe(0);
    });
  });

  describe('formatPace', () => {
    it('formats 300 seconds as 5:00', () => {
      expect(formatPace(300)).toBe('5:00');
    });

    it('formats 330 seconds as 5:30', () => {
      expect(formatPace(330)).toBe('5:30');
    });

    it('formats 365 seconds as 6:05', () => {
      expect(formatPace(365)).toBe('6:05');
    });

    it('returns --:-- for zero', () => {
      expect(formatPace(0)).toBe('--:--');
    });

    it('returns --:-- for Infinity', () => {
      expect(formatPace(Infinity)).toBe('--:--');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('formats hours', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
    });
  });

  describe('formatDistance', () => {
    it('formats meters under 1km', () => {
      expect(formatDistance(500)).toBe('500m');
    });

    it('formats km with decimal', () => {
      expect(formatDistance(5230)).toBe('5.23km');
    });

    it('formats exactly 1km', () => {
      expect(formatDistance(1000)).toBe('1.00km');
    });
  });

  describe('paceDeviation', () => {
    it('returns negative when faster than target', () => {
      expect(paceDeviation(280, 300)).toBe(-20);
    });

    it('returns positive when slower than target', () => {
      expect(paceDeviation(320, 300)).toBe(20);
    });

    it('returns zero when on target', () => {
      expect(paceDeviation(300, 300)).toBe(0);
    });
  });

  describe('paceComparisonText', () => {
    it('says on target when close', () => {
      expect(paceComparisonText(301, 300)).toBe('right on target');
    });

    it('says faster when ahead', () => {
      expect(paceComparisonText(280, 300)).toContain('faster');
    });

    it('says slower when behind', () => {
      expect(paceComparisonText(330, 300)).toContain('slower');
    });
  });

  describe('getPaceZone', () => {
    it('returns easy for slow pace', () => {
      expect(getPaceZone(400, 300)).toBe('easy');
    });

    it('returns threshold for on-target pace', () => {
      expect(getPaceZone(300, 300)).toBe('threshold');
    });

    it('returns sprint for very fast pace', () => {
      expect(getPaceZone(240, 300)).toBe('sprint');
    });
  });

  describe('estimateCalories', () => {
    it('returns positive value for running', () => {
      const cals = estimateCalories(5000, 1800, 70, true);
      expect(cals).toBeGreaterThan(0);
    });

    it('returns less for walking than running', () => {
      const run = estimateCalories(5000, 1800, 70, true);
      const walk = estimateCalories(5000, 1800, 70, false);
      expect(walk).toBeLessThan(run);
    });
  });

  describe('calculateCadence', () => {
    it('calculates steps per minute', () => {
      expect(calculateCadence(180, 60)).toBe(180);
    });

    it('returns 0 for zero duration', () => {
      expect(calculateCadence(100, 0)).toBe(0);
    });
  });
});
