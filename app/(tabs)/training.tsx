import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '../../src/constants/theme';

export default function TrainingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📋 Training Plan</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🎯</Text>
        <Text style={styles.emptyTitle}>No training plan yet</Text>
        <Text style={styles.emptySubtitle}>
          Tell your GymBro buddy about your race goals during a run, and they'll create a plan for you!
        </Text>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Try saying:</Text>
          <Text style={styles.exampleText}>"I have a marathon on June 15th"</Text>
          <Text style={styles.exampleText}>"Help me train for a 10k in 8 weeks"</Text>
          <Text style={styles.exampleText}>"I want to run a 5k under 25 minutes"</Text>
        </View>
      </View>
    </SafeAreaView>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  exampleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
  },
  exampleTitle: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  exampleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
});
