import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RunMap } from '../../src/components/RunMap';
import { StatsPanel } from '../../src/components/StatsPanel';
import { VoiceOrb } from '../../src/components/VoiceOrb';
import { useRunTracker } from '../../src/hooks/useRunTracker';
import { useVoiceChat } from '../../src/hooks/useVoiceChat';
import { useCoaching } from '../../src/hooks/useCoaching';
import {
  registerToolHandlers,
  disconnectLive,
  sendTextMessage as liveSendText,
} from '../../src/services/geminiLive';
import { requestLocationPermissions } from '../../src/services/location';
import { findNearbyPlaces, getWeather, getDirections, generateShapeWaypoints } from '../../src/services/maps';
import { CharacterId, SportMode, PlannedRoute } from '../../src/types';
import { formatPace, formatDuration, formatDistance } from '../../src/utils/pace';
import { haversineDistance } from '../../src/utils/distance';
import { Colors, FontSize, Spacing, BorderRadius } from '../../src/constants/theme';

export default function ActiveRunScreen() {
  const params = useLocalSearchParams<{
    id: string;
    character: string;
    sport: string;
    targetPace: string;
  }>();
  const router = useRouter();

  const characterId = (params.character || 'hype') as CharacterId;
  const initialSportMode = (params.sport || 'running') as SportMode;
  const targetPace = parseInt(params.targetPace || '360');

  const [chatInput, setChatInput] = useState('');
  const [showChatInput, setShowChatInput] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);

  const {
    state: runState,
    stats,
    breadcrumbs,
    sportMode,
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    currentLocation,
    setSportMode,
  } = useRunTracker(targetPace);

  const {
    orbState,
    isListening,
    isConnected,
    sendTextMessage,
    toggleMicrophone,
    latestMessage,
  } = useVoiceChat(characterId, initialSportMode);

  useCoaching({
    stats,
    sportMode,
    targetPace,
    isActive: runState === 'active',
    currentLocation,
  });

  // Off-route detection + rerouting
  useEffect(() => {
    if (!currentLocation || !plannedRoute || runState !== 'active') return;

    // Check if runner is off-route (>50m from nearest polyline point)
    const minDist = plannedRoute.polyline.reduce((min, point) => {
      const dist = haversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        point.latitude,
        point.longitude
      );
      return Math.min(min, dist);
    }, Infinity);

    if (minDist > 50) {
      // Send reroute suggestion via voice
      liveSendText(
        `[REROUTE ALERT: Runner is ${Math.round(minDist)}m off the planned route. ` +
        `Ask them if they want to be rerouted back, or if they want to freestyle.] `
      );
    }
  }, [currentLocation, plannedRoute, runState]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        console.warn('Location permission denied');
      }
      setSportMode(initialSportMode);

      // Register tool handlers for Gemini Live
      registerToolHandlers({
        get_current_stats: async () => ({
          distance_km: (stats.distance / 1000).toFixed(2),
          duration: formatDuration(stats.duration),
          current_pace: formatPace(stats.currentPace) + '/km',
          average_pace: formatPace(stats.averagePace) + '/km',
          cadence: stats.cadence + ' spm',
          elevation_gain: Math.round(stats.elevationGain) + 'm',
          calories: stats.calories,
        }),
        get_route_info: async () => {
          if (!plannedRoute) return { message: 'No planned route. Running freely.' };
          if (!currentLocation) return { message: 'Location unavailable.' };

          // Find the nearest upcoming step
          const remaining = plannedRoute.totalDistance - stats.distance;
          return {
            total_distance: formatDistance(plannedRoute.totalDistance),
            distance_remaining: formatDistance(Math.max(0, remaining)),
            next_turn: plannedRoute.steps[0]?.instruction || 'Continue straight',
            distance_to_turn: plannedRoute.steps[0]?.distance + 'm',
          };
        },
        get_split_times: async () => ({
          splits: stats.splits.map((s, i) => ({
            km: i + 1,
            pace: formatPace(s.pace),
            time: formatDuration(s.time),
          })),
        }),
        find_nearby_places: async (args: { type: string }) => {
          if (!currentLocation) return { error: 'Location not available' };
          const places = await findNearbyPlaces(
            { lat: currentLocation.latitude, lng: currentLocation.longitude },
            args.type as any
          );
          return { places: places.map((p) => ({ name: p.name, rating: p.rating, open: p.isOpen })) };
        },
        get_weather: async () => {
          if (!currentLocation) return { error: 'Location not available' };
          return await getWeather(currentLocation.latitude, currentLocation.longitude) || { error: 'Unavailable' };
        },
        web_search: async (args: { query: string }) => ({
          message: `Search for "${args.query}" — search integration pending.`,
        }),
        get_location_context: async () => ({
          lat: currentLocation?.latitude?.toFixed(4),
          lng: currentLocation?.longitude?.toFixed(4),
          message: currentLocation ? 'Location available' : 'Location unavailable',
        }),
        generate_route: async (args: { shape?: string; distance_km?: number; mood?: string }) => {
          if (!currentLocation) return { error: 'Location not available' };

          const origin = { lat: currentLocation.latitude, lng: currentLocation.longitude };
          let waypoints: { lat: number; lng: number }[] | undefined;

          if (args.shape) {
            waypoints = generateShapeWaypoints(origin, args.shape, args.distance_km || 2);
          }

          const destination = waypoints && waypoints.length > 0
            ? waypoints[waypoints.length - 1]
            : { lat: origin.lat + 0.01, lng: origin.lng + 0.01 };

          const route = await getDirections(origin, destination, waypoints?.slice(0, -1));
          if (route) {
            if (args.shape) route.shape = args.shape;
            route.name = args.shape ? `${args.shape} route` : args.mood ? `${args.mood} route` : 'Generated route';
            setPlannedRoute(route);
            return {
              success: true,
              name: route.name,
              distance: formatDistance(route.totalDistance),
              duration: formatDuration(route.estimatedDuration),
              message: `Route generated! ${route.name} - ${formatDistance(route.totalDistance)}`,
            };
          }
          return { error: 'Could not generate route. Try a different shape or distance.' };
        },
        get_training_plan: async () => ({
          message: 'No training plan set. Ask user if they want to create one!',
        }),
        get_achievements: async () => ({
          total_distance: formatDistance(stats.distance),
          message: 'Achievement tracking active.',
        }),
      });

      // Start the run
      startRun();

      // Send greeting after countdown
      setTimeout(() => {
        if (isConnected) {
          liveSendText("Hey! I just started my workout. Let's go!");
        }
      }, 4000);
    };

    init();

    return () => {
      disconnectLive();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrbPress = () => {
    if (orbState === 'speaking') {
      // Could stop playback
    } else {
      toggleMicrophone();
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendTextMessage(chatInput.trim());
      setChatInput('');
      setShowChatInput(false);
    }
  };

  const handleFinish = () => {
    finishRun();
    liveSendText(
      `[RUN COMPLETE] Final: ${formatDistance(stats.distance)}, ` +
      `${formatDuration(stats.duration)}, Avg ${formatPace(stats.averagePace)}/km. ` +
      `Give a fun post-run debrief!`
    );
  };

  const isTreadmill = sportMode === 'treadmill';

  return (
    <SafeAreaView style={styles.container}>
      {/* Countdown overlay */}
      {runState === 'countdown' && (
        <View style={styles.countdownOverlay}>
          <CountdownTimer />
        </View>
      )}

      {/* Connection indicator */}
      <View style={styles.connectionBar}>
        <View style={[styles.connectionDot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
        <Text style={styles.connectionText}>
          {isConnected ? 'GymBro connected' : 'Connecting...'}
        </Text>
        {isListening && <Text style={styles.micBadge}>🎙️ LIVE</Text>}
      </View>

      {/* Map (hidden on treadmill) */}
      <View style={[styles.mapSection, isTreadmill && styles.mapHidden]}>
        {isTreadmill ? (
          <View style={styles.treadmillBanner}>
            <Text style={styles.treadmillEmoji}>🏋️</Text>
            <Text style={styles.treadmillText}>Treadmill Mode</Text>
            <Text style={styles.treadmillSubtext}>Auto-detected indoor workout</Text>
          </View>
        ) : (
          <RunMap
            currentLocation={currentLocation}
            breadcrumbs={breadcrumbs}
            route={plannedRoute}
            showMap={runState === 'active' || runState === 'paused' || runState === 'finished'}
          />
        )}
      </View>

      {/* Stats Panel */}
      <View style={styles.statsSection}>
        <StatsPanel stats={stats} sportMode={sportMode} targetPace={targetPace} />
      </View>

      {/* Voice Orb + Chat */}
      <View style={styles.voiceSection}>
        {showChatInput && (
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Talk to your buddy..."
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={handleSendChat}
              returnKeyType="send"
              autoFocus
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendChat}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

        <VoiceOrb
          state={orbState}
          latestMessage={latestMessage}
          onPress={handleOrbPress}
        />

        {/* Text chat toggle */}
        <TouchableOpacity
          style={styles.textChatToggle}
          onPress={() => setShowChatInput(!showChatInput)}
        >
          <Text style={styles.textChatToggleText}>
            {showChatInput ? '✕ Close' : '⌨️ Type'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {runState === 'active' && (
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlButton} onPress={pauseRun}>
              <Text style={styles.controlEmoji}>⏸️</Text>
              <Text style={styles.controlLabel}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.finishButton]}
              onPress={handleFinish}
            >
              <Text style={styles.controlEmoji}>🏁</Text>
              <Text style={styles.controlLabel}>Finish</Text>
            </TouchableOpacity>
          </View>
        )}
        {runState === 'paused' && (
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlButton} onPress={resumeRun}>
              <Text style={styles.controlEmoji}>▶️</Text>
              <Text style={styles.controlLabel}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.finishButton]}
              onPress={handleFinish}
            >
              <Text style={styles.controlEmoji}>🏁</Text>
              <Text style={styles.controlLabel}>Finish</Text>
            </TouchableOpacity>
          </View>
        )}
        {runState === 'finished' && (
          <TouchableOpacity
            style={[styles.controlButton, { flex: 1 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.controlEmoji}>🏠</Text>
            <Text style={styles.controlLabel}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function CountdownTimer() {
  const [count, setCount] = React.useState(3);

  React.useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <Text style={countdownStyles.text}>
      {count > 0 ? count : 'GO!'}
    </Text>
  );
}

const countdownStyles = StyleSheet.create({
  text: {
    fontSize: 96,
    fontWeight: '900',
    color: Colors.primary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: Colors.background + 'EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: Colors.success,
  },
  dotDisconnected: {
    backgroundColor: Colors.error,
  },
  connectionText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  micBadge: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  mapSection: {
    flex: 3,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  mapHidden: {
    flex: 1.5,
  },
  treadmillBanner: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  treadmillEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  treadmillText: {
    color: Colors.treadmill,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  treadmillSubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  statsSection: {
    flex: 2,
    justifyContent: 'center',
  },
  voiceSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInputRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    width: '100%',
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
  sendButtonText: {
    color: Colors.text,
    fontWeight: '700',
  },
  textChatToggle: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  textChatToggleText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  controls: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  finishButton: {
    backgroundColor: Colors.error + '30',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  controlEmoji: {
    fontSize: 20,
  },
  controlLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
