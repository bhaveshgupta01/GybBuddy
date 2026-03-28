import { useRef, useEffect } from 'react';
import { RunStats, SportMode, GpsPoint } from '../types';
import { sendContextUpdate } from '../services/geminiLive';
import { formatPace } from '../utils/pace';

interface UseCoachingProps {
  stats: RunStats;
  sportMode: SportMode;
  targetPace?: number;
  isActive: boolean;
  currentLocation: GpsPoint | null;
}

/**
 * Sends periodic context updates to Gemini Live so it stays informed.
 * With the Live API, Gemini decides when to speak proactively based on the data.
 */
export function useCoaching({
  stats,
  sportMode,
  targetPace,
  isActive,
  currentLocation,
}: UseCoachingProps) {
  const lastMilestoneRef = useRef<number>(0);
  const lastContextRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Km milestone — flag it in the context
      const kmCompleted = Math.floor(stats.distance / 1000);
      let extra = '';

      if (kmCompleted > lastMilestoneRef.current && kmCompleted > 0) {
        lastMilestoneRef.current = kmCompleted;
        const splitPace = stats.splits.length > 0
          ? formatPace(stats.splits[stats.splits.length - 1].pace)
          : formatPace(stats.averagePace);
        extra = `MILESTONE: km ${kmCompleted} done! Split: ${splitPace}/km. Celebrate!`;
      }

      // Pace drift
      if (!extra && targetPace && stats.distance > 200) {
        const deviation = Math.abs(stats.currentPace - targetPace) / targetPace;
        if (deviation > 0.1) {
          const dir = stats.currentPace > targetPace ? 'slower' : 'faster';
          extra = `Pace is ${dir} than target ${formatPace(targetPace)}/km`;
        }
      }

      // Treadmill-specific
      if (!extra && sportMode === 'treadmill' && stats.duration > 0 && stats.duration % 300 < 30) {
        extra = 'Treadmill mode — suggest a speed or incline change to keep it interesting';
      }

      // Send context update every 60s, or immediately if there's a milestone
      if (extra || now - lastContextRef.current > 60000) {
        lastContextRef.current = now;
        sendContextUpdate(stats, extra || undefined);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isActive, stats, sportMode, targetPace]);
}
