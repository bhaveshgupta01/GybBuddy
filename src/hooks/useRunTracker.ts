import { useState, useRef, useCallback, useEffect } from 'react';
import { GpsPoint, RunState, RunStats, SportMode, SplitTime } from '../types';
import { startLocationTracking, stopLocationTracking } from '../services/location';
import { startPedometer, stopPedometer } from '../services/sensors';
import { haversineDistance, isStationary, elevationGain } from '../utils/distance';
import { speedToPace, estimateCalories, calculateCadence } from '../utils/pace';

interface UseRunTrackerReturn {
  state: RunState;
  stats: RunStats;
  breadcrumbs: GpsPoint[];
  sportMode: SportMode;
  setSportMode: (mode: SportMode) => void;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  finishRun: () => void;
  currentLocation: GpsPoint | null;
}

const INITIAL_STATS: RunStats = {
  distance: 0,
  duration: 0,
  currentPace: 0,
  averagePace: 0,
  currentSpeed: 0,
  elevation: 0,
  elevationGain: 0,
  calories: 0,
  cadence: 0,
  splits: [],
};

export function useRunTracker(targetPace?: number): UseRunTrackerReturn {
  const [state, setState] = useState<RunState>('idle');
  const [stats, setStats] = useState<RunStats>(INITIAL_STATS);
  const [breadcrumbs, setBreadcrumbs] = useState<GpsPoint[]>([]);
  const [sportMode, setSportMode] = useState<SportMode>('running');
  const [currentLocation, setCurrentLocation] = useState<GpsPoint | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef = useRef<number>(0);
  const lastSplitDistanceRef = useRef<number>(0);
  const breadcrumbsRef = useRef<GpsPoint[]>([]);

  // Auto-detect treadmill mode
  const recentPointsRef = useRef<GpsPoint[]>([]);
  const isMovingRef = useRef<boolean>(false);

  const handleLocationUpdate = useCallback((point: GpsPoint) => {
    setCurrentLocation(point);

    // Track recent points for treadmill detection
    recentPointsRef.current.push(point);
    if (recentPointsRef.current.length > 20) {
      recentPointsRef.current = recentPointsRef.current.slice(-20);
    }

    // Auto-detect treadmill: pedometer active but GPS stationary
    if (isMovingRef.current && isStationary(recentPointsRef.current, 10, 15)) {
      setSportMode('treadmill');
    } else if (sportMode === 'treadmill' && !isStationary(recentPointsRef.current, 10, 15)) {
      // Switched back to outdoor
      setSportMode('running');
    }

    if (state !== 'active') return;

    const crumbs = breadcrumbsRef.current;

    // Calculate distance from last point
    if (crumbs.length > 0) {
      const lastPoint = crumbs[crumbs.length - 1];
      const segmentDistance = haversineDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        point.latitude,
        point.longitude
      );

      // Filter out GPS jumps (> 50m in 1 second is unrealistic for running)
      if (segmentDistance > 50) return;

      setStats((prev) => {
        const newDistance = prev.distance + segmentDistance;
        const currentSpeed = point.speed ?? segmentDistance;
        const currentPace = speedToPace(currentSpeed);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const averagePace = duration > 0 ? (duration / (newDistance / 1000)) : 0;

        // Check for new split (every 1000m = 1km)
        const newSplits = [...prev.splits];
        if (newDistance - lastSplitDistanceRef.current >= 1000) {
          const splitTime = duration - (newSplits.length > 0 ? newSplits.reduce((sum, s) => sum + s.time, 0) : 0);
          newSplits.push({
            distance: 1000,
            time: splitTime,
            pace: splitTime, // seconds for this km
          });
          lastSplitDistanceRef.current = Math.floor(newDistance / 1000) * 1000;
        }

        return {
          ...prev,
          distance: newDistance,
          currentPace,
          averagePace,
          currentSpeed,
          elevation: point.altitude ?? prev.elevation,
          elevationGain: elevationGain([...crumbs, point]),
          calories: estimateCalories(newDistance, duration, 70, sportMode === 'running'),
          splits: newSplits,
        };
      });
    }

    breadcrumbsRef.current.push(point);
    setBreadcrumbs([...breadcrumbsRef.current]);
  }, [state, sportMode]);

  const handleStepCount = useCallback((steps: number) => {
    stepsRef.current = steps;
    isMovingRef.current = steps > 0;

    setStats((prev) => ({
      ...prev,
      cadence: calculateCadence(steps, prev.duration),
    }));
  }, []);

  const startRun = useCallback(() => {
    setState('countdown');

    // 3-second countdown then start
    setTimeout(() => {
      setState('active');
      startTimeRef.current = Date.now();
      breadcrumbsRef.current = [];
      lastSplitDistanceRef.current = 0;
      stepsRef.current = 0;
      setStats(INITIAL_STATS);
      setBreadcrumbs([]);

      // Start tracking
      startLocationTracking(handleLocationUpdate);
      startPedometer(handleStepCount);

      // Duration timer
      timerRef.current = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          duration: (Date.now() - startTimeRef.current) / 1000,
        }));
      }, 1000);
    }, 3000);
  }, [handleLocationUpdate, handleStepCount]);

  const pauseRun = useCallback(() => {
    setState('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeRun = useCallback(() => {
    setState('active');
    timerRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        duration: (Date.now() - startTimeRef.current) / 1000,
      }));
    }, 1000);
  }, []);

  const finishRun = useCallback(() => {
    setState('finished');
    stopLocationTracking();
    stopPedometer();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      stopPedometer();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    state,
    stats,
    breadcrumbs,
    sportMode,
    setSportMode,
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    currentLocation,
  };
}
