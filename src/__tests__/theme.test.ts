import { Colors, Spacing, FontSize, BorderRadius, GlassCard } from '../constants/theme';

describe('Theme', () => {
  it('has ethereal minimalist background (light, not dark)', () => {
    expect(Colors.background).toBe('#F4F7F9');
  });

  it('text color is slate, not pure black', () => {
    expect(Colors.text).toBe('#2C3E4A');
    expect(Colors.text).not.toBe('#000000');
  });

  it('has sage green primary', () => {
    expect(Colors.primary).toBe('#45674A');
    expect(Colors.primaryMint).toBe('#A8D5C2');
  });

  it('has terracotta secondary', () => {
    expect(Colors.secondary).toBe('#88513D');
  });

  it('glass card has transparent background', () => {
    expect(GlassCard.backgroundColor).toContain('rgba');
    expect(GlassCard.borderRadius).toBe(BorderRadius.md);
  });

  it('default border radius is 24px (soft brand)', () => {
    expect(BorderRadius.md).toBe(24);
  });

  it('spacing scale is consistent', () => {
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.lg);
    expect(Spacing.lg).toBeLessThan(Spacing.xl);
  });

  it('font sizes are ordered', () => {
    expect(FontSize.xs).toBeLessThan(FontSize.sm);
    expect(FontSize.sm).toBeLessThan(FontSize.md);
    expect(FontSize.md).toBeLessThan(FontSize.lg);
    expect(FontSize.lg).toBeLessThan(FontSize.xl);
  });
});
