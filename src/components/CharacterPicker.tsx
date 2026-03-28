import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CharacterId } from '../types';
import { CHARACTER_LIST } from '../constants/characters';
import { Colors, FontSize, Spacing, BorderRadius, GlassCard } from '../constants/theme';

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
        {CHARACTER_LIST.map((char) => {
          const isSelected = selected === char.id;
          return (
            <TouchableOpacity
              key={char.id}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => onSelect(char.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatar}>{char.avatar}</Text>
              <Text style={styles.name}>{char.name}</Text>
              <Text style={styles.subtitle}>{char.subtitle}</Text>
              <Text style={styles.quote}>"{char.sampleQuote}"</Text>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
    fontSize: FontSize.xl,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
    marginLeft: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    ...GlassCard,
    padding: Spacing.md,
    width: 170,
  },
  cardSelected: {
    backgroundColor: Colors.glassStrong,
    borderColor: Colors.primaryMint,
    borderWidth: 2,
  },
  avatar: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '500',
    letterSpacing: -0.3,
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
    backgroundColor: Colors.primaryMint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  selectedText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
});
