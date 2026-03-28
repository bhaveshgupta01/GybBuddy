import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RunStats, SportMode } from '../types';
import { formatPace, formatDuration, formatDistance } from '../utils/pace';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../constants/theme';

interface StatsPanelProps {
  stats: RunStats;
  sportMode: SportMode;
  targetPace?: number;
}

export function StatsPanel({ stats, sportMode, targetPace }: StatsPanelProps) {
  const paceColor = getPaceColor(stats.currentPace, targetPace);
  const modeLabel = sportMode === 'running' ? 'Running' : sportMode === 'walking' ? 'Walking' : 'Treadmill';

  return (
    <View style={styles.container}>
      {/* Mode indicator */}
      <Text style={styles.modeLabel}>{modeLabel.toUpperCase()}</Text>

      {/* Main stats row */}
      <View style={styles.mainRow}>
        <View style={styles.mainStat}>
          <Text style={[styles.mainValue, { color: paceColor }]}>
            {formatPace(stats.currentPace)}
          </Text>
          <Text style={styles.mainUnit}>/km pace</Text>
        </View>

        <View style={styles.mainStat}>
          <Text style={styles.mainValueLarge}>
            {formatDistance(stats.distance)}
          </Text>
          <Text style={styles.mainUnit}>distance</Text>
        </View>

        <View style={styles.mainStat}>
          <Text style={styles.mainValue}>
            {formatDuration(stats.duration)}
          </Text>
          <Text style={styles.mainUnit}>time</Text>
        </View>
      </View>

      {/* Secondary stats */}
      <View style={styles.secondaryRow}>
        <MiniStat label="Avg Pace" value={formatPace(stats.averagePace)} />
        <MiniStat label="Cadence" value={`${stats.cadence}`} unit="spm" />
        <MiniStat label="Calories" value={`${stats.calories}`} unit="kcal" />
      </View>
    </View>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>
        {value}{unit ? <Text style={styles.miniUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.miniLabel}>{label}</Text>
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
    ...GlassCard,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  modeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  mainStat: {
    alignItems: 'center',
  },
  mainValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '300',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  mainValueLarge: {
    color: Colors.text,
    fontSize: FontSize.display,
    fontWeight: '300',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  mainUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  miniUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  miniLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
