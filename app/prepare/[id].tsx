import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RunMap } from '../../src/components/RunMap';
import { requestLocationPermissions, getCurrentLocation } from '../../src/services/location';
import { getDirections, generateShapeWaypoints } from '../../src/services/maps';
import { PlannedRoute } from '../../src/types';
import { formatDistance, formatDuration } from '../../src/utils/pace';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../../src/constants/theme';

type PrepState = 'locating' | 'generating' | 'ready' | 'error' | 'skipped';

export default function PrepareScreen() {
  const params = useLocalSearchParams<{
    id: string;
    character: string;
    sport: string;
    targetPace: string;
    routeShape: string;
    routeDistance: string;
    routeMood: string;
  }>();
  const router = useRouter();

  const [state, setState] = useState<PrepState>('locating');
  const [route, setRoute] = useState<PlannedRoute | null>(null);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const hasRouteRequest = !!(params.routeShape || params.routeMood);

  useEffect(() => {
    if (!hasRouteRequest) {
      // No route requested — go straight to run
      setState('skipped');
      goToRun(null);
      return;
    }

    generateRoute();
  }, []);

  async function generateRoute() {
    try {
      // Step 1: Get location
      setState('locating');
      await requestLocationPermissions();
      const loc = await getCurrentLocation();

      if (!loc) {
        setError('Could not get your location. Check GPS settings.');
        setState('error');
        return;
      }

      setLocation(loc);
      setState('generating');

      // Step 2: Generate route
      const origin = { lat: loc.latitude, lng: loc.longitude };
      const shape = params.routeShape;
      const distance = parseFloat(params.routeDistance || '3');
      const mood = params.routeMood;

      let waypoints: { lat: number; lng: number }[] | undefined;
      if (shape) {
        waypoints = generateShapeWaypoints(origin, shape, distance || 2);
      }

      const dest = waypoints?.length
        ? waypoints[waypoints.length - 1]
        : { lat: origin.lat + 0.01, lng: origin.lng + 0.01 };

      const generatedRoute = await getDirections(origin, dest, waypoints?.slice(0, -1));

      if (generatedRoute) {
        if (shape) generatedRoute.shape = shape;
        generatedRoute.name = shape ? `${shape} route` : mood ? `${mood} route` : 'Generated route';
        setRoute(generatedRoute);
        setState('ready');
      } else {
        setError('Could not generate route. Check your Maps API key and try again.');
        setState('error');
      }
    } catch (e) {
      console.error('Route generation error:', e);
      setError('Something went wrong generating your route.');
      setState('error');
    }
  }

  function goToRun(plannedRoute: PlannedRoute | null) {
    router.replace({
      pathname: '/run/[id]',
      params: {
        id: params.id,
        character: params.character,
        sport: params.sport,
        targetPace: params.targetPace,
        routeShape: params.routeShape || '',
        routeDistance: params.routeDistance || '0',
        routeMood: params.routeMood || '',
        // Pass serialized route if generated
        preGeneratedRoute: plannedRoute ? JSON.stringify(plannedRoute) : '',
      },
    });
  }

  const statusMessages: Record<PrepState, string> = {
    locating: 'Finding your location...',
    generating: 'Generating your route...',
    ready: 'Route ready!',
    error: error,
    skipped: 'Starting...',
  };

  const statusEmoji: Record<PrepState, string> = {
    locating: '📍',
    generating: '🗺️',
    ready: '✅',
    error: '⚠️',
    skipped: '🏃',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preparing Run</Text>
        <Text style={styles.subtitle}>
          {params.routeShape
            ? `${params.routeShape} shape · ${params.routeDistance || '3'}km`
            : params.routeMood
              ? `${params.routeMood} route`
              : 'Free run'}
        </Text>
      </View>

      {/* Map preview */}
      <View style={styles.mapContainer}>
        {location && route ? (
          <RunMap
            currentLocation={{
              latitude: location.latitude,
              longitude: location.longitude,
              altitude: null,
              accuracy: null,
              speed: null,
              heading: null,
              timestamp: Date.now(),
            }}
            breadcrumbs={[]}
            route={route}
            showMap={true}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={{ fontSize: 48 }}>{statusEmoji[state]}</Text>
            {(state === 'locating' || state === 'generating') && (
              <ActivityIndicator size="large" color={Colors.primaryLight} style={{ marginTop: Spacing.md }} />
            )}
          </View>
        )}
      </View>

      {/* Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>{statusMessages[state]}</Text>

        {state === 'ready' && route && (
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoValue}>{formatDistance(route.totalDistance)}</Text>
              <Text style={styles.routeInfoLabel}>Distance</Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoValue}>{formatDuration(route.estimatedDuration)}</Text>
              <Text style={styles.routeInfoLabel}>Est. Time</Text>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoValue}>{route.steps.length}</Text>
              <Text style={styles.routeInfoLabel}>Turns</Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {state === 'ready' && (
          <TouchableOpacity style={styles.startButton} onPress={() => goToRun(route)} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Start Run</Text>
          </TouchableOpacity>
        )}

        {state === 'error' && (
          <>
            <TouchableOpacity style={styles.retryButton} onPress={generateRoute}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={() => goToRun(null)}>
              <Text style={styles.skipButtonText}>Skip Route · Run Free</Text>
            </TouchableOpacity>
          </>
        )}

        {(state === 'locating' || state === 'generating') && (
          <TouchableOpacity style={styles.skipButton} onPress={() => goToRun(null)}>
            <Text style={styles.skipButtonText}>Skip · Run Without Route</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '300', color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs, textTransform: 'capitalize' },
  mapContainer: { flex: 1, margin: Spacing.lg, borderRadius: BorderRadius.md, overflow: 'hidden' },
  mapPlaceholder: {
    flex: 1, backgroundColor: Colors.surfaceLow, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  statusCard: { ...GlassCard, margin: Spacing.lg, padding: Spacing.lg, alignItems: 'center' },
  statusText: { fontSize: FontSize.lg, color: Colors.text, fontWeight: '400' },
  routeInfo: { flexDirection: 'row', marginTop: Spacing.lg, alignItems: 'center' },
  routeInfoItem: { alignItems: 'center', flex: 1 },
  routeInfoValue: { fontSize: FontSize.xl, fontWeight: '300', color: Colors.text, letterSpacing: -0.5 },
  routeInfoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  routeInfoDivider: { width: 1, height: 30, backgroundColor: Colors.surfaceHigh },
  actions: { padding: Spacing.lg, gap: Spacing.md },
  startButton: {
    backgroundColor: Colors.primaryMint, paddingVertical: 18, borderRadius: BorderRadius.lg,
    alignItems: 'center', shadowColor: Colors.primaryMint, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  startButtonText: { color: Colors.textOnPrimary, fontSize: FontSize.lg, fontWeight: '600' },
  retryButton: {
    ...GlassCard, paddingVertical: Spacing.md, alignItems: 'center',
  },
  retryButtonText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  skipButton: { paddingVertical: Spacing.sm, alignItems: 'center' },
  skipButtonText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '500' },
});
