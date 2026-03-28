import React, { useEffect, useState } from 'react';
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
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../../src/constants/theme';

export default function ActiveRunScreen() {
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

  // Off-route detection
  useEffect(() => {
    if (!currentLocation || !plannedRoute || runState !== 'active') return;
    const minDist = plannedRoute.polyline.reduce((min, point) => {
      const dist = haversineDistance(currentLocation.latitude, currentLocation.longitude, point.latitude, point.longitude);
      return Math.min(min, dist);
    }, Infinity);
    if (minDist > 50) {
      liveSendText(`[REROUTE: Runner is ${Math.round(minDist)}m off route. Ask if they want rerouting.]`);
    }
  }, [currentLocation, plannedRoute, runState]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await requestLocationPermissions();
      setSportMode(initialSportMode);

      registerToolHandlers({
        get_current_stats: async () => ({
          distance_km: (stats.distance / 1000).toFixed(2),
          duration: formatDuration(stats.duration),
          current_pace: formatPace(stats.currentPace) + '/km',
          average_pace: formatPace(stats.averagePace) + '/km',
          cadence: stats.cadence + ' spm',
          calories: stats.calories,
        }),
        get_route_info: async () => {
          if (!plannedRoute) return { message: 'Running freely, no planned route.' };
          return {
            total_distance: formatDistance(plannedRoute.totalDistance),
            distance_remaining: formatDistance(Math.max(0, plannedRoute.totalDistance - stats.distance)),
            next_turn: plannedRoute.steps[0]?.instruction || 'Continue straight',
          };
        },
        get_split_times: async () => ({
          splits: stats.splits.map((s, i) => ({ km: i + 1, pace: formatPace(s.pace) })),
        }),
        find_nearby_places: async (args: { type: string }) => {
          if (!currentLocation) return { error: 'No location' };
          const places = await findNearbyPlaces({ lat: currentLocation.latitude, lng: currentLocation.longitude }, args.type as any);
          return { places: places.map((p) => ({ name: p.name, rating: p.rating })) };
        },
        get_weather: async () => {
          if (!currentLocation) return { error: 'No location' };
          return await getWeather(currentLocation.latitude, currentLocation.longitude) || { error: 'Unavailable' };
        },
        web_search: async (args: { query: string }) => ({ message: `Search: "${args.query}"` }),
        get_location_context: async () => ({ lat: currentLocation?.latitude?.toFixed(4), lng: currentLocation?.longitude?.toFixed(4) }),
        generate_route: async (args: { shape?: string; distance_km?: number; mood?: string }) => {
          if (!currentLocation) return { error: 'No location' };
          const origin = { lat: currentLocation.latitude, lng: currentLocation.longitude };
          let waypoints: { lat: number; lng: number }[] | undefined;
          if (args.shape) waypoints = generateShapeWaypoints(origin, args.shape, args.distance_km || 2);
          const dest = waypoints?.length ? waypoints[waypoints.length - 1] : { lat: origin.lat + 0.01, lng: origin.lng + 0.01 };
          const route = await getDirections(origin, dest, waypoints?.slice(0, -1));
          if (route) {
            if (args.shape) route.shape = args.shape;
            route.name = args.shape ? `${args.shape} route` : 'Generated route';
            setPlannedRoute(route);
            return { success: true, name: route.name, distance: formatDistance(route.totalDistance) };
          }
          return { error: 'Could not generate route' };
        },
        get_training_plan: async () => ({ message: 'No plan set yet.' }),
        get_achievements: async () => ({ total_distance: formatDistance(stats.distance) }),
      });

      startRun();

      // Auto-generate route if selected on home screen
      setTimeout(async () => {
        if (isConnected) liveSendText("Hey! Just started my workout. Let's go!");

        const shape = params.routeShape;
        const distance = parseFloat(params.routeDistance || '0');
        const mood = params.routeMood;

        if ((shape || mood) && currentLocation) {
          const origin = { lat: currentLocation.latitude, lng: currentLocation.longitude };
          let waypoints: { lat: number; lng: number }[] | undefined;
          if (shape) waypoints = generateShapeWaypoints(origin, shape, distance || 2);
          const dest = waypoints?.length ? waypoints[waypoints.length - 1] : { lat: origin.lat + 0.01, lng: origin.lng + 0.01 };
          const route = await getDirections(origin, dest, waypoints?.slice(0, -1));
          if (route) {
            if (shape) route.shape = shape;
            route.name = shape ? `${shape} route` : `${mood} route`;
            setPlannedRoute(route);
          }
        }
      }, 5000);
    };
    init();
    return () => { disconnectLive(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrbPress = () => toggleMicrophone();
  const handleSendChat = () => {
    if (chatInput.trim()) { sendTextMessage(chatInput.trim()); setChatInput(''); setShowChatInput(false); }
  };
  const handleFinish = () => {
    finishRun();
    liveSendText(`[RUN COMPLETE] ${formatDistance(stats.distance)}, ${formatDuration(stats.duration)}, Avg ${formatPace(stats.averagePace)}/km. Give a fun debrief!`);
  };

  const isTreadmill = sportMode === 'treadmill';

  return (
    <SafeAreaView style={styles.container}>
      {runState === 'countdown' && (
        <View style={styles.countdownOverlay}><CountdownTimer /></View>
      )}

      {/* Connection bar */}
      <View style={styles.connectionBar}>
        <View style={[styles.dot, isConnected ? styles.dotOn : styles.dotOff]} />
        <Text style={styles.connectionText}>{isConnected ? 'GymBro connected' : 'Connecting...'}</Text>
        {isListening && <Text style={styles.liveBadge}>● LIVE</Text>}
      </View>

      {/* Map */}
      <View style={[styles.mapSection, isTreadmill && styles.mapSmall]}>
        {isTreadmill ? (
          <View style={styles.treadmillCard}>
            <Text style={{ fontSize: 40 }}>🏋️</Text>
            <Text style={styles.treadmillTitle}>Treadmill Mode</Text>
            <Text style={styles.treadmillSub}>Auto-detected indoor workout</Text>
          </View>
        ) : (
          <RunMap currentLocation={currentLocation} breadcrumbs={breadcrumbs} route={plannedRoute} showMap={runState !== 'idle'} />
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <StatsPanel stats={stats} sportMode={sportMode} targetPace={targetPace} />
      </View>

      {/* Voice */}
      <View style={styles.voiceSection}>
        {showChatInput && (
          <View style={styles.chatRow}>
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
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        )}
        <VoiceOrb state={orbState} latestMessage={latestMessage} onPress={handleOrbPress} />
        <TouchableOpacity onPress={() => setShowChatInput(!showChatInput)}>
          <Text style={styles.typeToggle}>{showChatInput ? '✕ Close' : '⌨️ Type instead'}</Text>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {runState === 'active' && (
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={pauseRun}>
              <Text style={styles.controlText}>⏸ Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.finishText}>🏁 Finish</Text>
            </TouchableOpacity>
          </View>
        )}
        {runState === 'paused' && (
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={resumeRun}>
              <Text style={styles.controlText}>▶ Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.finishText}>🏁 Finish</Text>
            </TouchableOpacity>
          </View>
        )}
        {runState === 'finished' && (
          <TouchableOpacity style={[styles.controlBtn, { flex: 1 }]} onPress={() => router.back()}>
            <Text style={styles.controlText}>Done</Text>
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
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);
  return <Text style={cdStyles.text}>{count > 0 ? count : 'Go'}</Text>;
}

const cdStyles = StyleSheet.create({
  text: { fontSize: 80, fontWeight: '200', color: Colors.primary, letterSpacing: -3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: 'rgba(244, 247, 249, 0.95)', alignItems: 'center', justifyContent: 'center',
  },
  connectionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: Colors.primaryLight },
  dotOff: { backgroundColor: Colors.secondaryWarm },
  connectionText: { color: Colors.textMuted, fontSize: FontSize.xs },
  liveBadge: { color: Colors.secondaryWarm, fontSize: FontSize.xs, fontWeight: '700' },
  mapSection: { flex: 3, margin: Spacing.md, borderRadius: BorderRadius.md, overflow: 'hidden' },
  mapSmall: { flex: 1.5 },
  treadmillCard: {
    flex: 1, ...GlassCard, alignItems: 'center', justifyContent: 'center',
  },
  treadmillTitle: { color: Colors.secondaryWarm, fontSize: FontSize.xl, fontWeight: '500', marginTop: Spacing.sm },
  treadmillSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  statsSection: { flex: 2, justifyContent: 'center' },
  voiceSection: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  chatRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm, width: '100%' },
  chatInput: {
    flex: 1, backgroundColor: Colors.surfaceLow, color: Colors.text, fontSize: FontSize.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  sendBtn: {
    backgroundColor: Colors.primaryMint, paddingHorizontal: Spacing.md, justifyContent: 'center', borderRadius: BorderRadius.md,
  },
  sendBtnText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: FontSize.lg },
  typeToggle: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.xs },
  controls: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  controlRow: { flexDirection: 'row', gap: Spacing.md },
  controlBtn: {
    flex: 1, ...GlassCard, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  controlText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  finishBtn: {
    flex: 1, backgroundColor: 'rgba(168, 56, 54, 0.08)', borderWidth: 1, borderColor: 'rgba(168, 56, 54, 0.2)',
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  finishText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '500' },
});
