import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SportMode } from '../types';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../constants/theme';

interface SportPickerProps {
  selected: SportMode;
  onSelect: (mode: SportMode) => void;
}

const MODES: { id: SportMode; label: string; emoji: string }[] = [
  { id: 'running', label: 'Run', emoji: '🏃' },
  { id: 'walking', label: 'Walk', emoji: '🚶' },
];

export function SportPicker({ selected, onSelect }: SportPickerProps) {
  return (
    <View style={styles.container}>
      {MODES.map((mode) => {
        const isSelected = selected === mode.id;
        return (
          <TouchableOpacity
            key={mode.id}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(mode.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{mode.emoji}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GlassCard,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: Colors.glassStrong,
    borderColor: Colors.primaryMint,
    borderWidth: 2,
  },
  emoji: {
    fontSize: FontSize.xl,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
