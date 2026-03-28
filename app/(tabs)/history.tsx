import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, FontSize, Spacing, GlassCard } from '../../src/constants/theme';
import { getRuns, SavedRun } from '../../src/services/storage';
import { formatPace, formatDistance, formatDuration } from '../../src/utils/pace';

export default function HistoryScreen() {
  const [runs, setRuns] = useState<SavedRun[]>([]);

  // Reload runs every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      getRuns().then(setRuns);
    }, [])
  );

  const weekDistance = runs
    .filter((r) => new Date(r.date).getTime() > Date.now() - 7 * 86400000)
    .reduce((sum, r) => sum + r.distance, 0);
  const weekRuns = runs.filter((r) => new Date(r.date).getTime() > Date.now() - 7 * 86400000).length;
  const weekMins = runs
    .filter((r) => new Date(r.date).getTime() > Date.now() - 7 * 86400000)
    .reduce((sum, r) => sum + r.duration, 0);

  // Which days this week had a run
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const runDays = new Set(
    runs
      .filter((r) => new Date(r.date).getTime() > Date.now() - 7 * 86400000)
      .map((r) => new Date(r.date).getDay())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.label}>ACTIVITY</Text>
          <Text style={styles.title}>History</Text>
        </View>

        {/* Weekly summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>THIS WEEK</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{weekRuns}</Text>
              <Text style={styles.summaryUnit}>runs</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{(weekDistance / 1000).toFixed(1)}</Text>
              <Text style={styles.summaryUnit}>km</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{Math.round(weekMins / 60)}</Text>
              <Text style={styles.summaryUnit}>min</Text>
            </View>
          </View>
          <View style={styles.weekDots}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const dayIndex = (i + 1) % 7; // Mon=1 ... Sun=0
              const active = runDays.has(dayIndex);
              return (
                <View key={i} style={styles.dayCol}>
                  <View style={[styles.dot, active && styles.dotActive]} />
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Run list */}
        {runs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏃</Text>
            <Text style={styles.emptyTitle}>No runs yet</Text>
            <Text style={styles.emptySub}>Complete your first run and it'll appear here</Text>
          </View>
        ) : (
          runs.map((run) => {
            const d = new Date(run.date);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const modeEmoji = run.sportMode === 'running' ? '🏃' : run.sportMode === 'walking' ? '🚶' : '🏋️';

            return (
              <View key={run.id} style={styles.runCard}>
                <View style={styles.runHeader}>
                  <Text style={styles.runDate}>{dateStr} · {timeStr}</Text>
                  <Text>{modeEmoji}</Text>
                </View>
                <View style={styles.runStats}>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{formatDistance(run.distance)}</Text>
                    <Text style={styles.runStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{formatDuration(run.duration)}</Text>
                    <Text style={styles.runStatLabel}>Time</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{formatPace(run.averagePace)}</Text>
                    <Text style={styles.runStatLabel}>Avg Pace</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{run.calories}</Text>
                    <Text style={styles.runStatLabel}>kcal</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  title: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  summaryCard: { ...GlassCard, padding: Spacing.lg, marginBottom: Spacing.lg },
  summaryLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: Spacing.lg },
  summaryStat: { alignItems: 'center' },
  summaryValue: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1 },
  summaryUnit: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.surfaceHigh },
  weekDots: { flexDirection: 'row', justifyContent: 'space-around' },
  dayCol: { alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceHigh },
  dotActive: { backgroundColor: Colors.primaryMint },
  dayLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingTop: Spacing.xxl * 2 },
  emptyTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '400' },
  emptySub: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '300', textAlign: 'center' },
  runCard: { ...GlassCard, padding: Spacing.md, marginBottom: Spacing.sm },
  runHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  runDate: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  runStats: { flexDirection: 'row', justifyContent: 'space-around' },
  runStat: { alignItems: 'center' },
  runStatValue: { fontSize: FontSize.lg, fontWeight: '300', color: Colors.text },
  runStatLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
});
