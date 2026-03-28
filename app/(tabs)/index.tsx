import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CharacterPicker } from '../../src/components/CharacterPicker';
import { SportPicker } from '../../src/components/SportPicker';
import { CharacterId, SportMode } from '../../src/types';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../../src/constants/theme';
import { gatherAppContext, AppContext } from '../../src/services/context';
import { requestLocationPermissions } from '../../src/services/location';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('hype');
  const [sportMode, setSportMode] = useState<SportMode>('running');
  const [targetPace, setTargetPace] = useState('6:00');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [appContext, setAppContext] = useState<AppContext | null>(null);
  const [loading, setLoading] = useState(true);

  const ROUTE_OPTIONS = [
    { label: '5K Loop', shape: 'circle', distance: 5 },
    { label: 'Heart Shape ❤️', shape: 'heart', distance: 3 },
    { label: 'Scenic Route', shape: '', distance: 5, mood: 'scenic' },
    { label: 'Surprise Me', shape: '', distance: 0, mood: 'surprise' },
  ];

  // Gather context on mount
  useEffect(() => {
    const init = async () => {
      await requestLocationPermissions();
      try {
        const ctx = await gatherAppContext();
        setAppContext(ctx);
        // Auto-select treadmill if near a gym
        if (ctx.nearGym) setSportMode('treadmill');
      } catch {
        // fallback
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleStartRun = () => {
    const parts = targetPace.split(':');
    const paceSeconds = parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
    const routeOption = ROUTE_OPTIONS.find((r) => r.label === selectedRoute);

    router.push({
      pathname: '/run/[id]',
      params: {
        id: `run_${Date.now()}`,
        character: selectedCharacter,
        sport: sportMode,
        targetPace: paceSeconds.toString(),
        routeShape: routeOption?.shape || '',
        routeDistance: (routeOption?.distance || 0).toString(),
        routeMood: routeOption?.mood || '',
      },
    });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const timeLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateLabel}>{timeLabel.toUpperCase()}</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>

        {/* Smart Context Card */}
        <View style={styles.coachCard}>
          <View style={styles.coachIcon}>
            <Text style={styles.coachIconText}>✦</Text>
          </View>
          <View style={styles.coachContent}>
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={Colors.primaryLight} />
                <Text style={styles.coachText}>Reading your surroundings...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.coachText}>
                  {appContext?.suggestion || 'Ready for a run? Pick your buddy and let\'s go.'}
                </Text>

                {/* Gym detection prompt */}
                {appContext?.nearGym && (
                  <View style={styles.gymPrompt}>
                    <Text style={styles.gymPromptText}>
                      📍 Near {appContext.gymName}
                    </Text>
                    <View style={styles.gymButtons}>
                      <TouchableOpacity
                        style={[styles.gymBtn, sportMode === 'treadmill' && styles.gymBtnActive]}
                        onPress={() => setSportMode('treadmill')}
                      >
                        <Text style={[styles.gymBtnText, sportMode === 'treadmill' && styles.gymBtnTextActive]}>
                          🏋️ Treadmill
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.gymBtn, sportMode === 'running' && styles.gymBtnActive]}
                        onPress={() => setSportMode('running')}
                      >
                        <Text style={[styles.gymBtnText, sportMode === 'running' && styles.gymBtnTextActive]}>
                          🌳 Outdoor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Weather chip */}
                {appContext?.weather && (
                  <Text style={styles.weatherChip}>
                    {appContext.weather.temp}° · {appContext.weather.description}
                  </Text>
                )}

                <TouchableOpacity onPress={handleStartRun}>
                  <Text style={styles.coachAction}>Start Quick Run →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Sport Mode (hidden if gym detected — already shown in context card) */}
        {!appContext?.nearGym && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <SportPicker selected={sportMode} onSelect={setSportMode} />
          </View>
        )}

        {/* Target Pace */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Pace</Text>
          <View style={styles.paceCard}>
            <TextInput
              style={styles.paceInput}
              value={targetPace}
              onChangeText={setTargetPace}
              placeholder="6:00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.paceUnit}>/km</Text>
          </View>
        </View>

        {/* Character Picker */}
        <CharacterPicker selected={selectedCharacter} onSelect={setSelectedCharacter} />

        {/* Quick Route Ideas (only for outdoor) */}
        {sportMode !== 'treadmill' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Ideas</Text>
            <View style={styles.routeChips}>
              {ROUTE_OPTIONS.map((route) => (
                <TouchableOpacity
                  key={route.label}
                  style={[styles.routeChip, selectedRoute === route.label && styles.routeChipSelected]}
                  onPress={() => setSelectedRoute(selectedRoute === route.label ? null : route.label)}
                >
                  <Text style={[styles.routeChipText, selectedRoute === route.label && styles.routeChipTextSelected]}>
                    {route.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartRun} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>
            Begin {sportMode === 'running' ? 'Run' : sportMode === 'walking' ? 'Walk' : 'Workout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  dateLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  greeting: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  coachCard: { ...GlassCard, marginHorizontal: Spacing.lg, padding: Spacing.lg, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  coachIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryMint, shadowColor: Colors.primaryMint, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  coachIconText: { fontSize: 18, color: Colors.textOnPrimary },
  coachContent: { flex: 1, gap: Spacing.sm },
  coachText: { fontSize: 15, lineHeight: 22, color: Colors.text, fontWeight: '400' },
  coachAction: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primaryLight },
  gymPrompt: { marginTop: Spacing.xs },
  gymPromptText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.primary, marginBottom: Spacing.sm },
  gymButtons: { flexDirection: 'row', gap: Spacing.sm },
  gymBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLow, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  gymBtnActive: { backgroundColor: Colors.primaryMint, borderColor: Colors.primaryMint },
  gymBtnText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  gymBtnTextActive: { color: Colors.textOnPrimary, fontWeight: '600' },
  weatherChip: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '400' },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '300', letterSpacing: -0.5, marginBottom: Spacing.md },
  paceCard: { ...GlassCard, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  paceInput: { color: Colors.text, fontSize: FontSize.display, fontWeight: '300', letterSpacing: -1, textAlign: 'center', minWidth: 100, fontVariant: ['tabular-nums'] },
  paceUnit: { color: Colors.textMuted, fontSize: FontSize.lg, fontWeight: '300' },
  routeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  routeChip: { ...GlassCard, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  routeChipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },
  routeChipSelected: { backgroundColor: Colors.primaryMint, borderColor: Colors.primaryMint },
  routeChipTextSelected: { color: Colors.textOnPrimary, fontWeight: '600' },
  startButton: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.xl, paddingVertical: 18, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryMint,
    shadowColor: Colors.primaryMint, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  startButtonText: { color: Colors.textOnPrimary, fontSize: FontSize.lg, fontWeight: '600', letterSpacing: -0.3 },
});
