import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../../src/constants/theme';
import QRCode from 'react-native-qrcode-svg';

export default function PackScreen() {
  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'You', distance: '0 km', streak: 0, emoji: '🌅' },
    { rank: 2, name: 'Invite a friend', distance: '—', streak: 0, emoji: '👋' },
  ];

  const shareUrl = 'https://gymbro.app/join/abc123';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.label}>COMMUNITY</Text>
          <Text style={styles.title}>Your Pack</Text>
        </View>

        {/* QR Code Share Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrLeft}>
            <Text style={styles.qrTitle}>Invite Friends</Text>
            <Text style={styles.qrDesc}>Scan to join your pack, share routes, and compete together</Text>
          </View>
          <View style={styles.qrCode}>
            <QRCode
              value={shareUrl}
              size={80}
              backgroundColor="transparent"
              color={Colors.primary}
            />
          </View>
        </View>

        {/* Weekly Leaderboard */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderHeader}>
            <Text style={styles.leaderCol}>Rank</Text>
            <Text style={[styles.leaderCol, { flex: 1 }]}>Runner</Text>
            <Text style={styles.leaderCol}>Distance</Text>
            <Text style={styles.leaderCol}>Streak</Text>
          </View>
          {leaderboard.map((runner) => (
            <View key={runner.rank} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>{runner.rank}</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>{runner.emoji}</Text>
                <Text style={styles.leaderName}>{runner.name}</Text>
              </View>
              <Text style={styles.leaderStat}>{runner.distance}</Text>
              <Text style={styles.leaderStat}>{runner.streak > 0 ? `${runner.streak}🔥` : '—'}</Text>
            </View>
          ))}
        </View>

        {/* Pack stats */}
        <Text style={styles.sectionTitle}>Pack Stats</Text>
        <View style={styles.packStatsRow}>
          <View style={styles.packStatCard}>
            <Text style={styles.packStatValue}>0</Text>
            <Text style={styles.packStatLabel}>Members</Text>
          </View>
          <View style={styles.packStatCard}>
            <Text style={styles.packStatValue}>0 km</Text>
            <Text style={styles.packStatLabel}>Total Distance</Text>
          </View>
          <View style={styles.packStatCard}>
            <Text style={styles.packStatValue}>0</Text>
            <Text style={styles.packStatLabel}>Runs This Week</Text>
          </View>
        </View>

        {/* Challenges */}
        <Text style={styles.sectionTitle}>Challenges</Text>
        <View style={styles.challengeCard}>
          <Text style={{ fontSize: 28 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeTitle}>Weekly 25K</Text>
            <Text style={styles.challengeDesc}>Run 25km as a pack this week</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={styles.challengeProgress}>0 / 25 km</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  title: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  qrCard: {
    ...GlassCard, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg,
  },
  qrLeft: { flex: 1 },
  qrTitle: { fontSize: FontSize.lg, fontWeight: '500', color: Colors.text, marginBottom: 4 },
  qrDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '300', lineHeight: 18 },
  qrCode: { padding: 8, backgroundColor: Colors.surfaceLowest, borderRadius: BorderRadius.sm },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '300', letterSpacing: -0.5, marginBottom: Spacing.md, marginTop: Spacing.md },
  leaderboardCard: { ...GlassCard, padding: Spacing.md, marginBottom: Spacing.md },
  leaderHeader: { flexDirection: 'row', paddingBottom: Spacing.sm, gap: Spacing.md },
  leaderCol: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', minWidth: 50 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  leaderRank: { fontSize: FontSize.lg, fontWeight: '300', color: Colors.text, minWidth: 50 },
  leaderName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  leaderStat: { fontSize: FontSize.sm, fontWeight: '400', color: Colors.textSecondary, minWidth: 50, textAlign: 'center' },
  packStatsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  packStatCard: { ...GlassCard, flex: 1, padding: Spacing.md, alignItems: 'center' },
  packStatValue: { fontSize: FontSize.xl, fontWeight: '300', color: Colors.text, letterSpacing: -0.5 },
  packStatLabel: { fontSize: 9, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  challengeCard: { ...GlassCard, padding: Spacing.lg, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  challengeTitle: { fontSize: FontSize.lg, fontWeight: '500', color: Colors.text },
  challengeDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '300', marginBottom: Spacing.sm },
  progressBar: { height: 6, backgroundColor: Colors.surfaceHigh, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primaryMint, borderRadius: 3 },
  challengeProgress: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});
