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
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      // Pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      glow.start();
      return () => {
        pulse.stop();
        glow.stop();
      };
    } else if (state === 'thinking') {
      // Faster pulse for thinking
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
    }
  }, [state, pulseAnim, glowAnim]);

  const orbColor = {
    idle: Colors.orbIdle,
    listening: Colors.orbListening,
    thinking: Colors.orbThinking,
    speaking: Colors.orbSpeaking,
  }[state];

  const statusText = {
    idle: 'Tap to talk',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  }[state];

  return (
    <View style={styles.container}>
      {/* Transcript */}
      {latestMessage && (
        <View style={styles.transcriptContainer}>
          <Text
            style={[
              styles.transcript,
              latestMessage.role === 'user' && styles.transcriptUser,
            ]}
            numberOfLines={2}
          >
            {latestMessage.role === 'user' ? '🎤 ' : '🤖 '}
            {latestMessage.content}
          </Text>
        </View>
      )}

      {/* Orb */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Animated.View
          style={[
            styles.orbOuter,
            {
              opacity: glowAnim,
              backgroundColor: orbColor,
              transform: [{ scale: Animated.multiply(pulseAnim, 1.3) }],
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
            {state === 'idle' ? '🎙️' : state === 'listening' ? '👂' : state === 'thinking' ? '💭' : '🗣️'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
}

const ORB_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  transcriptContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    maxWidth: '90%',
  },
  transcript: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  transcriptUser: {
    color: Colors.primary,
  },
  orbOuter: {
    position: 'absolute',
    width: ORB_SIZE + 20,
    height: ORB_SIZE + 20,
    borderRadius: (ORB_SIZE + 20) / 2,
    top: -10,
    left: -10,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  orbIcon: {
    fontSize: 28,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
  },
});
