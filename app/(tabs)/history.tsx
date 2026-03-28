import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, GlassCard } from '../../src/constants/theme';

// In production, this comes from Firestore
const MOCK_RUNS: any[] = [];

export default function HistoryScreen() {
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
              <Text style={styles.summaryValue}>0</Text>
              <Text style={styles.summaryUnit}>runs</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>0</Text>
              <Text style={styles.summaryUnit}>km</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>0</Text>
              <Text style={styles.summaryUnit}>min</Text>
            </View>
          </View>
          {/* Week dots */}
          <View style={styles.weekDots}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View style={styles.dot} />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Run list */}
        {MOCK_RUNS.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏃</Text>
            <Text style={styles.emptyTitle}>No runs yet</Text>
            <Text style={styles.emptySub}>
              Complete your first run and your history will appear here
            </Text>
          </View>
        ) : (
          MOCK_RUNS.map((run, i) => (
            <View key={i} style={styles.runCard}>
              <Text>{run.distance}</Text>
            </View>
          ))
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
  dayLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingTop: Spacing.xxl * 2 },
  emptyTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '400' },
  emptySub: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '300', textAlign: 'center' },
  runCard: { ...GlassCard, padding: Spacing.md, marginBottom: Spacing.sm },
});
