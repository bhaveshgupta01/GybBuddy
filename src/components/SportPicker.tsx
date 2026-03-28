import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SportMode } from '../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

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
      {MODES.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.option,
            selected === mode.id && styles.optionSelected,
          ]}
          onPress={() => onSelect(mode.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{mode.emoji}</Text>
          <Text
            style={[
              styles.label,
              selected === mode.id && styles.labelSelected,
            ]}
          >
            {mode.label}
          </Text>
        </TouchableOpacity>
      ))}
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
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    gap: Spacing.sm,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDark + '30',
  },
  emoji: {
    fontSize: FontSize.xl,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  labelSelected: {
    color: Colors.text,
  },
});
