import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  initializeGemini,
  registerToolHandlers,
  disconnectGemini,
} from '../../src/services/gemini';
import { requestLocationPermissions } from '../../src/services/location';
import { findNearbyPlaces, getWeather } from '../../src/services/maps';
import { CharacterId, SportMode } from '../../src/types';
import { formatPace, formatDuration, formatDistance } from '../../src/utils/pace';
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
    messages,
    orbState,
    sendTextMessage,
    requestGreeting,
    requestSummary,
    speakMessage,
    stopSpeaking,
    latestMessage,
  } = useVoiceChat(characterId);

  // Coaching callback
  const handleCoachMessage = useCallback(
    (message: string) => {
      speakMessage(message);
    },
    [speakMessage]
  );

  useCoaching({
    stats,
    sportMode,
    targetPace,
    isActive: runState === 'active',
    currentLocation,
    onCoachMessage: handleCoachMessage,
  });

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await requestLocationPermissions();
      setSportMode(initialSportMode);
      initializeGemini(initialSportMode, characterId);

      // Register tool handlers
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
        get_route_info: async () => ({
          message: 'No planned route set. Running freely.',
        }),
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
          return {
            places: places.map((p) => ({
              name: p.name,
              distance: `${p.distance}m away`,
              rating: p.rating,
              open: p.isOpen,
            })),
          };
        },
        get_weather: async () => {
          if (!currentLocation) return { error: 'Location not available' };
          const weather = await getWeather(
            currentLocation.latitude,
            currentLocation.longitude
          );
          return weather || { error: 'Weather data unavailable' };
        },
        web_search: async (args: { query: string }) => ({
          message: `Web search for "${args.query}" — this feature requires a search API integration.`,
        }),
        get_location_context: async () => ({
          message: currentLocation
            ? `Currently at ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            : 'Location unavailable',
        }),
        generate_route: async (args: any) => ({
          message: `Route generation requested: ${JSON.stringify(args)}. This would generate waypoints and display on the map.`,
        }),
        get_training_plan: async () => ({
          message: 'No training plan set yet. Ask the user if they want to create one!',
        }),
        get_achievements: async () => ({
          total_distance: formatDistance(stats.distance),
          message: 'Achievement system coming soon!',
        }),
      });

      // Start the run and get a greeting
      startRun();
      setTimeout(() => {
        requestGreeting(initialSportMode);
      }, 3500); // After countdown
    };

    init();

    return () => {
      disconnectGemini();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrbPress = () => {
    if (orbState === 'speaking') {
      stopSpeaking();
    } else {
      setShowChatInput(!showChatInput);
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendTextMessage(chatInput.trim());
      setChatInput('');
      setShowChatInput(false);
    }
  };

  const handleFinish = async () => {
    finishRun();
    await requestSummary(stats);
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
            showMap={runState === 'active' || runState === 'paused'}
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
  mapSection: {
    flex: 3.5,
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
    flex: 2.5,
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
