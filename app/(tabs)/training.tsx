import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, GlassCard } from '../../src/constants/theme';

export default function TrainingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>GOALS</Text>
        <Text style={styles.title}>Training Plan</Text>
      </View>
      <View style={styles.empty}>
        <Text style={{ fontSize: 48 }}>🎯</Text>
        <Text style={styles.emptyTitle}>No plan yet</Text>
        <Text style={styles.emptySub}>
          Tell your buddy about your goals during a run and they'll create a plan for you
        </Text>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleLabel}>Try saying</Text>
          <Text style={styles.exampleText}>"I have a marathon on June 15th"</Text>
          <Text style={styles.exampleText}>"Help me train for a 10k in 8 weeks"</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, letterSpacing: 2 },
  title: { fontSize: FontSize.display, fontWeight: '300', color: Colors.text, letterSpacing: -1.5, marginTop: Spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  emptyTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '400' },
  emptySub: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '300', textAlign: 'center' },
  exampleCard: { ...GlassCard, padding: Spacing.lg, width: '100%', marginTop: Spacing.md },
  exampleLabel: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm },
  exampleText: { color: Colors.textSecondary, fontSize: FontSize.md, fontStyle: 'italic', marginBottom: Spacing.sm },
});
