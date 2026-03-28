import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { VoiceOrbState, ChatMessage } from '../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface VoiceOrbProps {
  state: VoiceOrbState;
  latestMessage: ChatMessage | null;
  onPress: () => void;
}

export function VoiceOrb({ state, latestMessage, onPress }: VoiceOrbProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else if (state === 'thinking') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.2);
    }
  }, [state, pulseAnim, glowAnim]);

  const orbColor = {
    idle: Colors.orbIdle,
    listening: Colors.orbListening,
    thinking: Colors.orbThinking,
    speaking: Colors.orbSpeaking,
  }[state];

  const statusText = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  }[state];

  return (
    <View style={styles.container}>
      {/* Transcript bubble */}
      {latestMessage && (
        <View style={styles.transcriptBubble}>
          <Text style={styles.transcript} numberOfLines={2}>
            {latestMessage.content}
          </Text>
        </View>
      )}

      {/* Orb */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Animated.View
          style={[
            styles.orbGlow,
            {
              opacity: glowAnim,
              backgroundColor: orbColor,
              transform: [{ scale: Animated.multiply(pulseAnim, 1.4) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.orb,
            {
              backgroundColor: orbColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.orbIcon}>
            {state === 'idle' ? '🎙' : state === 'listening' ? '👂' : state === 'thinking' ? '✦' : '♪'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
}

const ORB_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  transcriptBubble: {
    backgroundColor: Colors.glassStrong,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  transcript: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  orbGlow: {
    position: 'absolute',
    width: ORB_SIZE + 24,
    height: ORB_SIZE + 24,
    borderRadius: (ORB_SIZE + 24) / 2,
    top: -12,
    left: -12,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryMint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  orbIcon: {
    fontSize: 24,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
});
