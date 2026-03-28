import { useRef, useCallback, useEffect } from 'react';
import { RunStats, SportMode, GpsPoint, CoachingEvent } from '../types';
import { sendContextUpdate } from '../services/gemini';
import { formatPace } from '../utils/pace';

interface UseCoachingProps {
  stats: RunStats;
  sportMode: SportMode;
  targetPace?: number;
  isActive: boolean;
  currentLocation: GpsPoint | null;
  onCoachMessage: (message: string) => void;
}

/**
 * Manages proactive coaching — decides when Gemini should speak up
 * without the user asking.
 */
export function useCoaching({
  stats,
  sportMode,
  targetPace,
  isActive,
  currentLocation,
  onCoachMessage,
}: UseCoachingProps) {
  const lastMilestoneRef = useRef<number>(0);
  const lastPaceAlertRef = useRef<number>(0);
  const lastProactiveRef = useRef<number>(0);
  const contextUpdateRef = useRef<number>(0);

  const checkCoachingTriggers = useCallback(async () => {
    if (!isActive) return;

    const now = Date.now();

    // 1. Km milestone (every 1000m)
    const kmCompleted = Math.floor(stats.distance / 1000);
    if (kmCompleted > lastMilestoneRef.current && kmCompleted > 0) {
      lastMilestoneRef.current = kmCompleted;
      const splitPace = stats.splits.length > 0
        ? formatPace(stats.splits[stats.splits.length - 1].pace)
        : formatPace(stats.averagePace);

      const response = await sendContextUpdate(stats,
        `MILESTONE: Just completed km ${kmCompleted}! Latest split: ${splitPace}/km. Celebrate this!`
      );
      if (response.toLowerCase().trim() !== 'ok') {
        onCoachMessage(response);
      }
      return;
    }

    // 2. Pace drift alert (every 30 seconds, only if >10% off target)
    if (targetPace && now - lastPaceAlertRef.current > 30000) {
      const deviation = Math.abs(stats.currentPace - targetPace) / targetPace;
      if (deviation > 0.1 && stats.distance > 200) {
        lastPaceAlertRef.current = now;
        const direction = stats.currentPace > targetPace ? 'slower' : 'faster';
        const response = await sendContextUpdate(stats,
          `PACE: Runner is ${direction} than target (${formatPace(targetPace)}/km). Mention it casually.`
        );
        if (response.toLowerCase().trim() !== 'ok') {
          onCoachMessage(response);
        }
        return;
      }
    }

    // 3. Periodic context update + potential proactive chat (every 2 min)
    if (now - lastProactiveRef.current > 120000) {
      lastProactiveRef.current = now;

      const minutesIn = Math.floor(stats.duration / 60);
      const extras: string[] = [];

      if (minutesIn > 0 && minutesIn % 5 === 0) {
        extras.push('It\'s been a while since you said something. Start a casual conversation or share something interesting.');
      }

      if (sportMode === 'treadmill') {
        extras.push('They\'re on the treadmill. Suggest an interval or incline change to keep things interesting.');
      }

      const response = await sendContextUpdate(stats, extras.join(' '));
      if (response.toLowerCase().trim() !== 'ok') {
        onCoachMessage(response);
      }
    }

    // 4. Regular context updates (every 30s) so Gemini stays informed
    if (now - contextUpdateRef.current > 30000) {
      contextUpdateRef.current = now;
      // Silent update — just keep Gemini informed, don't expect a response worth speaking
      await sendContextUpdate(stats);
    }
  }, [isActive, stats, sportMode, targetPace, onCoachMessage]);

  // Run coaching checks periodically
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(checkCoachingTriggers, 5000);
    return () => clearInterval(interval);
  }, [isActive, checkCoachingTriggers]);
}
