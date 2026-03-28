import { Pedometer, Accelerometer } from 'expo-sensors';

let pedometerSubscription: { remove: () => void } | null = null;
let accelerometerSubscription: { remove: () => void } | null = null;

export async function isPedometerAvailable(): Promise<boolean> {
  return Pedometer.isAvailableAsync();
}

export function startPedometer(
  onStepCount: (steps: number) => void
): void {
  stopPedometer();

  const start = new Date();
  pedometerSubscription = Pedometer.watchStepCount((result) => {
    onStepCount(result.steps);
  });
}

export function stopPedometer(): void {
  if (pedometerSubscription) {
    pedometerSubscription.remove();
    pedometerSubscription = null;
  }
}

export async function getStepsSince(start: Date): Promise<number> {
  try {
    const result = await Pedometer.getStepCountAsync(start, new Date());
    return result.steps;
  } catch {
    return 0;
  }
}

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export function startAccelerometer(
  onData: (data: AccelerometerData) => void,
  intervalMs: number = 100
): void {
  stopAccelerometer();
  Accelerometer.setUpdateInterval(intervalMs);
  accelerometerSubscription = Accelerometer.addListener((raw) => {
    const magnitude = Math.sqrt(raw.x ** 2 + raw.y ** 2 + raw.z ** 2);
    onData({ ...raw, magnitude });
  });
}

export function stopAccelerometer(): void {
  if (accelerometerSubscription) {
    accelerometerSubscription.remove();
    accelerometerSubscription = null;
  }
}

/**
 * Detect if user is physically moving based on accelerometer variance.
 * High variance = movement, low variance = stationary.
 */
export function detectMovement(samples: AccelerometerData[], threshold: number = 0.15): boolean {
  if (samples.length < 5) return false;

  const magnitudes = samples.map((s) => s.magnitude);
  const avg = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const variance = magnitudes.reduce((sum, m) => sum + (m - avg) ** 2, 0) / magnitudes.length;

  return variance > threshold;
}
