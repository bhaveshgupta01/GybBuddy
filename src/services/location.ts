import * as Location from 'expo-location';
import { GpsPoint } from '../types';

let locationSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') return false;

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  // Background is nice to have but not required
  return foreground === 'granted';
}

export async function getCurrentLocation(): Promise<GpsPoint | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
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
  stopLocationTracking();

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: intervalMs,
      distanceInterval: 1, // minimum 1 meter
    },
    (location) => {
      onLocation(locationToGpsPoint(location));
    }
  ).then((sub) => {
    locationSubscription = sub;
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
