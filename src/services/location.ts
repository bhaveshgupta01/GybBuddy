import * as Location from 'expo-location';
import { GpsPoint } from '../types';

let locationSubscription: Location.LocationSubscription | null = null;
let permissionGranted = false;

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') {
      permissionGranted = false;
      return false;
    }

    permissionGranted = true;

    // Background permission — nice to have, don't crash if denied
    try {
      await Location.requestBackgroundPermissionsAsync();
    } catch {
      // Background location not available in Expo Go, that's fine
    }

    return true;
  } catch (error) {
    console.warn('Location permission request failed:', error);
    permissionGranted = false;
    return false;
  }
}

export async function getCurrentLocation(): Promise<GpsPoint | null> {
  if (!permissionGranted) return null;
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return locationToGpsPoint(location);
  } catch {
    return null;
  }
}

export function startLocationTracking(
  onLocation: (point: GpsPoint) => void,
  intervalMs: number = 1000
): void {
  if (!permissionGranted) {
    console.warn('Cannot start location tracking — permission not granted');
    return;
  }

  stopLocationTracking();

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs,
      distanceInterval: 1,
    },
    (location) => {
      onLocation(locationToGpsPoint(location));
    }
  ).then((sub) => {
    locationSubscription = sub;
  }).catch((error) => {
    console.warn('Location tracking failed:', error);
  });
}

export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}

function locationToGpsPoint(location: Location.LocationObject): GpsPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy,
    speed: location.coords.speed,
    heading: location.coords.heading,
    timestamp: location.timestamp,
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const r = results[0];
      return [r.street, r.district, r.city].filter(Boolean).join(', ');
    }
  } catch {
    // ignore
  }
  return 'Unknown location';
}
