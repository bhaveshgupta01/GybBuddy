import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CharacterId } from '../types';
import { CHARACTER_LIST } from '../constants/characters';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface CharacterPickerProps {
  selected: CharacterId;
  onSelect: (id: CharacterId) => void;
}

export function CharacterPicker({ selected, onSelect }: CharacterPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Buddy</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CHARACTER_LIST.map((char) => (
          <TouchableOpacity
            key={char.id}
            style={[
              styles.card,
              selected === char.id && { borderColor: char.color, borderWidth: 2 },
            ]}
            onPress={() => onSelect(char.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.avatar}>{char.avatar}</Text>
            <Text style={styles.name}>{char.name}</Text>
            <Text style={styles.subtitle}>{char.subtitle}</Text>
            <Text style={styles.quote}>"{char.sampleQuote}"</Text>
            {selected === char.id && (
              <View style={[styles.selectedBadge, { backgroundColor: char.color }]}>
                <Text style={styles.selectedText}>Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginLeft: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 180,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  avatar: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  quote: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  selectedText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
});
