import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../../src/constants/theme';
import { generatePersona, UserPersona, DEFAULT_PERSONA } from '../../src/services/persona';
import { getProfile, ProfileStats } from '../../src/services/storage';
import { formatDistance } from '../../src/utils/pace';

export default function ProfileScreen() {
  const [persona, setPersona] = useState<UserPersona>(DEFAULT_PERSONA);
  const [profileStats, setProfileStats] = useState<ProfileStats>({ totalRuns: 0, totalDistance: 0, totalDuration: 0, lastRunDate: null });

  useFocusEffect(
    React.useCallback(() => {
      getProfile().then(setProfileStats);
    }, [])
  );
  const [generating, setGenerating] = useState(false);

  const totalRuns = profileStats.totalRuns;
  const totalDistance = profileStats.totalDistance;
  const avgPace = profileStats.totalDuration > 0 ? profileStats.totalDuration / (profileStats.totalDistance / 1000) : 0;
  const currentStreak = 0;

  const handleGeneratePersona = async () => {
    setGenerating(true);
    const newPersona = await generatePersona(
      totalRuns, totalDistance, avgPace, currentStreak, 'morning', []
    );
    setPersona(newPersona);
    setGenerating(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.header}>
        <Text style={styles.label}>YOU</Text>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* AI Persona Card */}
      <View style={[styles.personaCard, { borderColor: persona.color + '60' }]}>
        <Text style={styles.personaEmoji}>{persona.emoji}</Text>
        <Text style={styles.personaTitle}>{persona.title}</Text>
        <Text style={styles.personaDesc}>{persona.description}</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: persona.color + '20' }]}
          onPress={handleGeneratePersona}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color={persona.color} />
          ) : (
            <Text style={[styles.refreshBtnText, { color: persona.color }]}>
              {totalRuns === 0 ? '🏃 Go run to unlock your persona' : '✦ Generate new persona'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard value={`${totalRuns}`} label="Runs" />
        <StatCard value={formatDistance(totalDistance)} label="Distance" />
        <StatCard value={`${currentStreak}`} label="Streak" />
        <StatCard value={`${Math.floor(totalRuns / 3) + 1}`} label="Level" />
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      {[
        { name: 'First Steps', desc: 'Complete your first run', icon: '👟' },
        { name: '5K Club', desc: 'Run 5km in one session', icon: '🏅' },
        { name: 'Heart Artist', desc: 'Complete a heart-shaped route', icon: '❤️' },
        { name: 'Early Bird', desc: 'Run before 6 AM', icon: '🌅' },
      ].map((a) => (
        <View key={a.name} style={styles.achieveCard}>
          <Text style={{ fontSize: 24, opacity: 0.4 }}>{a.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achieveName}>{a.name}</Text>
            <Text style={styles.achieveDesc}>{a.desc}</Text>
          </View>
          <Text style={{ fontSize: 16, opacity: 0.3 }}>🔒</Text>
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  title: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  personaCard: {
    ...GlassCard, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 2,
  },
  personaEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  personaTitle: { fontSize: FontSize.xxl, fontWeight: '300', color: Colors.text, letterSpacing: -1, marginBottom: 4 },
  personaDesc: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '400', fontStyle: 'italic', textAlign: 'center', marginBottom: Spacing.md },
  refreshBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round },
  refreshBtnText: { fontSize: FontSize.sm, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { ...GlassCard, width: '47%', padding: Spacing.lg, alignItems: 'center' },
  statValue: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '300', letterSpacing: -1 },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '300', letterSpacing: -0.5, marginBottom: Spacing.md },
  achieveCard: { ...GlassCard, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  achieveName: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '500' },
  achieveDesc: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '300' },
});
