import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CharacterPicker } from '../../src/components/CharacterPicker';
import { SportPicker } from '../../src/components/SportPicker';
import { CharacterId, SportMode } from '../../src/types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('hype');
  const [sportMode, setSportMode] = useState<SportMode>('running');
  const [targetPace, setTargetPace] = useState('6:00');

  const handleStartRun = () => {
    // Parse target pace (M:SS format to seconds)
    const parts = targetPace.split(':');
    const paceSeconds = parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);

    router.push({
      pathname: '/run/[id]',
      params: {
        id: `run_${Date.now()}`,
        character: selectedCharacter,
        sport: sportMode,
        targetPace: paceSeconds.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💪 GymBro</Text>
          <Text style={styles.tagline}>Your AI Running Buddy</Text>
        </View>

        {/* Sport Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are we doing today?</Text>
          <SportPicker selected={sportMode} onSelect={setSportMode} />
        </View>

        {/* Target Pace */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Pace</Text>
          <View style={styles.paceRow}>
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

        {/* Quick Route Ideas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Routes</Text>
          <View style={styles.routeChips}>
            {['5K Loop', 'Heart Shape ❤️', 'Scenic Route', 'Surprise Me!'].map((route) => (
              <TouchableOpacity key={route} style={styles.routeChip}>
                <Text style={styles.routeChipText}>{route}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartRun} activeOpacity={0.8}>
          <Text style={styles.startButtonEmoji}>
            {sportMode === 'running' ? '🏃' : '🚶'}
          </Text>
          <Text style={styles.startButtonText}>
            Start {sportMode === 'running' ? 'Run' : 'Walk'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  paceInput: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    minWidth: 120,
    fontVariant: ['tabular-nums'],
  },
  paceUnit: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },
  routeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  routeChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  routeChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonEmoji: {
    fontSize: 28,
  },
  startButtonText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
});
