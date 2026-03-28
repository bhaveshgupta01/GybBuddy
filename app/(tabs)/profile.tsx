import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../../src/constants/theme';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>YOU</Text>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Total Runs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0 km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      {['First Steps — Complete your first run', '5K Club — Run 5km in one session', 'Heart Artist — Complete a heart-shaped route'].map((a) => (
        <View key={a} style={styles.achieveCard}>
          <Text style={{ fontSize: 24 }}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achieveName}>{a.split(' — ')[0]}</Text>
            <Text style={styles.achieveDesc}>{a.split(' — ')[1]}</Text>
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  title: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: {
    ...GlassCard, width: '47%', padding: Spacing.lg, alignItems: 'center',
  },
  statValue: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '300', letterSpacing: -1 },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '300', letterSpacing: -0.5, marginBottom: Spacing.md },
  achieveCard: {
    ...GlassCard, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm,
  },
  achieveName: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '500' },
  achieveDesc: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '300' },
});
