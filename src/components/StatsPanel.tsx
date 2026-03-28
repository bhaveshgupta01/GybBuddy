import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RunStats, SportMode } from '../types';
import { formatPace, formatDuration, formatDistance } from '../utils/pace';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface StatsPanelProps {
  stats: RunStats;
  sportMode: SportMode;
  targetPace?: number;
}

export function StatsPanel({ stats, sportMode, targetPace }: StatsPanelProps) {
  const paceColor = getPaceColor(stats.currentPace, targetPace);
  const modeEmoji = sportMode === 'running' ? '🏃' : sportMode === 'walking' ? '🚶' : '🏋️';

  return (
    <View style={styles.container}>
      <View style={styles.modeIndicator}>
        <Text style={styles.modeEmoji}>{modeEmoji}</Text>
        <Text style={styles.modeText}>{sportMode.toUpperCase()}</Text>
      </View>

      <View style={styles.mainStats}>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: paceColor }]}>
            {formatPace(stats.currentPace)}
          </Text>
          <Text style={styles.statLabel}>PACE /km</Text>
        </View>

        <View style={styles.statBlock}>
          <Text style={styles.statValueLarge}>
            {formatDistance(stats.distance)}
          </Text>
          <Text style={styles.statLabel}>DISTANCE</Text>
        </View>

        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {formatDuration(stats.duration)}
          </Text>
          <Text style={styles.statLabel}>TIME</Text>
        </View>
      </View>

      <View style={styles.secondaryStats}>
        <StatChip label="AVG PACE" value={formatPace(stats.averagePace)} />
        <StatChip label="CADENCE" value={`${stats.cadence}`} unit="spm" />
        <StatChip label="CALORIES" value={`${stats.calories}`} unit="kcal" />
        {stats.elevationGain > 0 && (
          <StatChip label="ELEV ↑" value={`${Math.round(stats.elevationGain)}`} unit="m" />
        )}
      </View>
    </View>
  );
}

function StatChip({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>
        {value}
        {unit && <Text style={styles.chipUnit}> {unit}</Text>}
      </Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function getPaceColor(currentPace: number, targetPace?: number): string {
  if (!targetPace || currentPace <= 0) return Colors.text;
  const ratio = currentPace / targetPace;
  if (ratio < 0.95) return Colors.paceFast;
  if (ratio > 1.1) return Colors.paceSlow;
  return Colors.paceOnTarget;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  modeEmoji: {
    fontSize: FontSize.lg,
    marginRight: Spacing.xs,
  },
  modeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 2,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statValueLarge: {
    color: Colors.text,
    fontSize: FontSize.hero * 0.7,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
  },
  chip: {
    alignItems: 'center',
  },
  chipValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chipUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  chipLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
