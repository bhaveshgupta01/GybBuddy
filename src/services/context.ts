import { getCurrentLocation } from './location';
import { findNearbyPlaces, getWeather } from './maps';

export interface AppContext {
  nearGym: boolean;
  gymName?: string;
  gymDistance?: number;
  weather?: { temp: number; description: string; feelsLike: number };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  suggestion: string;
}

/**
 * Gather context about the user's current situation
 * Used on app open to provide smart suggestions
 */
export async function gatherAppContext(): Promise<AppContext> {
  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  const location = await getCurrentLocation();

  let nearGym = false;
  let gymName: string | undefined;
  let gymDistance: number | undefined;
  let weather: AppContext['weather'] | undefined;

  if (location) {
    // Check for nearby gyms (within 200m)
    try {
      const gyms = await findNearbyPlaces(
        { lat: location.latitude, lng: location.longitude },
        'gym',
        200
      );
      if (gyms.length > 0) {
        nearGym = true;
        gymName = gyms[0].name;
        gymDistance = gyms[0].distance;
      }
    } catch {
      // ignore
    }

    // Get weather
    try {
      weather = await getWeather(location.latitude, location.longitude) || undefined;
    } catch {
      // ignore
    }
  }

  // Generate suggestion
  let suggestion = '';
  if (nearGym) {
    suggestion = `Looks like you're near ${gymName}. Treadmill session today?`;
  } else if (weather) {
    if (weather.description.includes('rain')) {
      suggestion = `It's rainy outside (${weather.temp}°). Maybe an indoor workout?`;
    } else if (weather.temp > 30) {
      suggestion = `It's ${weather.temp}° out — stay hydrated! A morning or evening run would be cooler.`;
    } else if (timeOfDay === 'morning') {
      suggestion = `Perfect ${weather.temp}° morning. A run would be a great way to start the day.`;
    } else if (timeOfDay === 'evening') {
      suggestion = `Nice ${weather.temp}° evening. Wind down with a walk or easy run?`;
    } else {
      suggestion = `${weather.temp}° and ${weather.description}. Great conditions for a run!`;
    }
  } else {
    const suggestions: Record<string, string> = {
      morning: 'Good morning! Ready to get moving?',
      afternoon: 'Afternoon energy boost? Let\'s go for a run.',
      evening: 'Evening run to unwind? Pick your buddy and let\'s go.',
      night: 'Late night energy? A walk might be just right.',
    };
    suggestion = suggestions[timeOfDay];
  }

  return { nearGym, gymName, gymDistance, weather, timeOfDay, suggestion };
}
