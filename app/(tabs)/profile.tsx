import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '../../src/constants/theme';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>

      {/* Stats Overview */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <StatBlock label="Total Runs" value="0" emoji="🏃" />
          <StatBlock label="Distance" value="0 km" emoji="📏" />
          <StatBlock label="Streak" value="0 days" emoji="🔥" />
        </View>
        <View style={styles.statRow}>
          <StatBlock label="Level" value="1" emoji="⭐" />
          <StatBlock label="XP" value="0" emoji="✨" />
          <StatBlock label="Badges" value="0" emoji="🏅" />
        </View>
      </View>

      {/* Achievements Preview */}
      <Text style={styles.sectionTitle}>🏆 Achievements</Text>
      <View style={styles.achievementCard}>
        <Text style={styles.achievementEmoji}>🔒</Text>
        <View>
          <Text style={styles.achievementName}>First Steps</Text>
          <Text style={styles.achievementDesc}>Complete your first run</Text>
        </View>
      </View>
      <View style={styles.achievementCard}>
        <Text style={styles.achievementEmoji}>🔒</Text>
        <View>
          <Text style={styles.achievementName}>5K Club</Text>
          <Text style={styles.achievementDesc}>Run 5 kilometers in a single session</Text>
        </View>
      </View>
      <View style={styles.achievementCard}>
        <Text style={styles.achievementEmoji}>🔒</Text>
        <View>
          <Text style={styles.achievementName}>Heart Artist</Text>
          <Text style={styles.achievementDesc}>Complete a heart-shaped route</Text>
        </View>
      </View>

      {/* Settings Link */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsText}>⚙️ Settings</Text>
        <Text style={styles.settingsSubtext}>API keys, units, stride length calibration</Text>
      </View>
    </SafeAreaView>
  );
}

function StatBlock({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  achievementCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementName: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  achievementDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  settingsText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  settingsSubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});
