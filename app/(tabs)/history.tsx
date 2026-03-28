import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, GlassCard } from '../../src/constants/theme';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>ACTIVITY</Text>
        <Text style={styles.title}>Run History</Text>
      </View>
      <View style={styles.empty}>
        <Text style={{ fontSize: 48 }}>🏃</Text>
        <Text style={styles.emptyTitle}>No runs yet</Text>
        <Text style={styles.emptySub}>Complete your first run and it'll show up here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  title: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '400' },
  emptySub: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '300', textAlign: 'center' },
});
