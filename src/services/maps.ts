import { RouteStep, PlannedRoute, NearbyPlace, PlaceType } from '../types';

const MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
const BASE_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Get directions between two points using Google Directions API
 */
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[],
  mode: 'walking' | 'bicycling' = 'walking'
): Promise<PlannedRoute | null> {
  try {
    let url = `${BASE_URL}/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${MAPS_API_KEY}`;

    if (waypoints && waypoints.length > 0) {
      const wp = waypoints.map((w) => `${w.lat},${w.lng}`).join('|');
      url += `&waypoints=${wp}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes.length) return null;

    const route = data.routes[0];
    const leg = route.legs[0];

    const steps: RouteStep[] = leg.steps.map((step: any) => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
      distance: step.distance.value,
      duration: step.duration.value,
      startLocation: step.start_location,
      endLocation: step.end_location,
      maneuver: step.maneuver,
    }));

    const polyline = decodePolyline(route.overview_polyline.points);

    return {
      id: `route_${Date.now()}`,
      name: 'Generated Route',
      totalDistance: leg.distance.value,
      estimatedDuration: leg.duration.value,
      steps,
      polyline,
    };
  } catch (error) {
    console.error('Directions API error:', error);
    return null;
  }
}

/**
 * Search for nearby places using Google Places API
 */
export async function findNearbyPlaces(
  location: { lat: number; lng: number },
  type: PlaceType,
  radiusMeters: number = 1000
): Promise<NearbyPlace[]> {
  const placeTypeMap: Record<PlaceType, string> = {
    cafe: 'cafe',
    water_fountain: 'drinking_water',
    restroom: 'public_restroom',
    convenience_store: 'convenience_store',
    gym: 'gym',
    park: 'park',
  };

  try {
    const url = `${BASE_URL}/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radiusMeters}&type=${placeTypeMap[type] || type}&key=${MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') return [];

    return data.results.slice(0, 5).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      type,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      distance: 0, // Will be calculated client-side
      rating: place.rating,
      isOpen: place.opening_hours?.open_now,
    }));
  } catch (error) {
    console.error('Places API error:', error);
    return [];
  }
}

/**
 * Generate waypoints for a shaped route (heart, star, circle)
 */
export function generateShapeWaypoints(
  center: { lat: number; lng: number },
  shape: string,
  sizeKm: number = 1
): { lat: number; lng: number }[] {
  const sizeDeg = sizeKm / 111; // rough km to degrees

  switch (shape.toLowerCase()) {
    case 'heart':
      return generateHeartWaypoints(center, sizeDeg);
    case 'star':
      return generateStarWaypoints(center, sizeDeg);
    case 'circle':
      return generateCircleWaypoints(center, sizeDeg);
    default:
      return generateCircleWaypoints(center, sizeDeg);
  }
}

function generateHeartWaypoints(
  center: { lat: number; lng: number },
  size: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const numPoints = 12;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    // Heart parametric equation
    const x = size * 0.5 * (16 * Math.sin(t) ** 3) / 16;
    const y = size * 0.5 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;

    points.push({
      lat: center.lat + y,
      lng: center.lng + x,
    });
  }

  return points;
}

function generateStarWaypoints(
  center: { lat: number; lng: number },
  size: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const outerRadius = size * 0.5;
  const innerRadius = size * 0.2;

  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push({
      lat: center.lat + radius * Math.sin(angle),
      lng: center.lng + radius * Math.cos(angle),
    });
  }

  return points;
}

function generateCircleWaypoints(
  center: { lat: number; lng: number },
  size: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const numPoints = 8;
  const radius = size * 0.5;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    points.push({
      lat: center.lat + radius * Math.sin(angle),
      lng: center.lng + radius * Math.cos(angle),
    });
  }

  return points;
}

/**
 * Decode Google Maps encoded polyline
 */
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

/**
 * Get weather for a location using a free weather API
 */
export async function getWeather(
  lat: number,
  lng: number
): Promise<{ temp: number; description: string; feelsLike: number } | null> {
  try {
    // Using Open-Meteo (free, no API key needed)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();

    const weatherCodes: Record<number, string> = {
      0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
      45: 'foggy', 48: 'depositing rime fog',
      51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
      61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
      71: 'slight snow', 73: 'moderate snow', 75: 'heavy snow',
      80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
      95: 'thunderstorm',
    };

    return {
      temp: data.current.temperature_2m,
      description: weatherCodes[data.current.weather_code] || 'unknown',
      feelsLike: data.current.apparent_temperature,
    };
  } catch {
    return null;
  }
}
