// ==========================================
// GymBro Design System: "The Ethereal Minimalist"
// Inspired by Morning Mist / Google Stitch mockup
// ==========================================

export const Colors = {
  // Backgrounds — Ice-white canvas
  background: '#F4F7F9',
  backgroundGradientStart: '#D6EAF4',
  backgroundGradientMid: '#E8F5EE',
  backgroundGradientEnd: '#F4F0EB',

  // Surface tiers (no borders — use these for depth)
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#EFF4F7',
  surface: '#E8EFF2',
  surfaceHigh: '#E2E9ED',
  surfaceHighest: '#DBE4E8',

  // Glass card
  glass: 'rgba(255, 255, 255, 0.45)',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
  glassStrong: 'rgba(255, 255, 255, 0.65)',

  // Primary — Sage green
  primary: '#45674A',
  primaryLight: '#8BAF8E',
  primaryMint: '#A8D5C2',
  primaryContainer: '#C6ECC8',
  primaryGradientStart: '#A8D5C2',
  primaryGradientEnd: '#8BAF8E',

  // Secondary — Terracotta
  secondary: '#88513D',
  secondaryLight: '#D4917A',
  secondaryWarm: '#C4785A',
  secondaryContainer: '#FFDBCF',
  secondaryGradientStart: '#D4917A',
  secondaryGradientEnd: '#C4785A',

  // Text — Slate palette (never pure black)
  text: '#2C3E4A',
  textSecondary: 'rgba(44, 62, 74, 0.6)',
  textMuted: 'rgba(44, 62, 74, 0.4)',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFF7F5',

  // Status
  success: '#8BAF8E',
  warning: '#D4917A',
  error: '#A83836',
  info: '#4F626A',

  // Pace indicators
  paceOnTarget: '#8BAF8E',
  paceFast: '#4F626A',
  paceSlow: '#C4785A',

  // Sport mode colors
  running: '#8BAF8E',
  walking: '#A8D5C2',
  treadmill: '#D4917A',

  // Character colors
  drill: '#C4785A',
  chill: '#A8D5C2',
  hype: '#D4917A',
  sensei: '#8BAF8E',

  // Voice orb
  orbIdle: '#A8D5C2',
  orbListening: '#8BAF8E',
  orbThinking: '#D4917A',
  orbSpeaking: '#45674A',

  // Map
  routePlanned: '#A8D5C2',
  routeCompleted: '#45674A',

  // Outline
  outline: '#737C80',
  outlineVariant: 'rgba(170, 179, 183, 0.15)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  display: 36,
  hero: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 24, // Default — "Soft" brand promise
  lg: 32,
  xl: 48,
  round: 9999,
};

// Glass card style mixin
export const GlassCard = {
  backgroundColor: Colors.glass,
  borderRadius: BorderRadius.md,
  borderWidth: 1,
  borderColor: Colors.glassBorder,
  // Note: backdrop-filter not supported in RN, we use solid glass color
};

export const GlassCardStrong = {
  backgroundColor: Colors.glassStrong,
  borderRadius: BorderRadius.md,
  borderWidth: 1,
  borderColor: Colors.glassBorder,
};
