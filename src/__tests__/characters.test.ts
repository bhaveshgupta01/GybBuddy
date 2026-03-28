import { CHARACTERS, CHARACTER_LIST } from '../constants/characters';
import { buildSystemPrompt } from '../constants/prompts';

describe('Characters', () => {
  it('has 4 characters', () => {
    expect(CHARACTER_LIST.length).toBe(4);
  });

  it('each character has required fields', () => {
    CHARACTER_LIST.forEach((char) => {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.subtitle).toBeTruthy();
      expect(char.avatar).toBeTruthy();
      expect(char.sampleQuote).toBeTruthy();
      expect(char.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(char.voiceConfig.pitch).toBeGreaterThan(0);
      expect(char.voiceConfig.rate).toBeGreaterThan(0);
    });
  });

  it('character IDs are unique', () => {
    const ids = CHARACTER_LIST.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('CHARACTERS lookup works for all IDs', () => {
    expect(CHARACTERS.drill).toBeDefined();
    expect(CHARACTERS.chill).toBeDefined();
    expect(CHARACTERS.hype).toBeDefined();
    expect(CHARACTERS.sensei).toBeDefined();
  });
});

describe('System Prompts', () => {
  it('builds prompts for all character+mode combos', () => {
    const modes = ['running', 'walking', 'treadmill'] as const;
    const chars = ['drill', 'chill', 'hype', 'sensei'] as const;

    modes.forEach((mode) => {
      chars.forEach((char) => {
        const prompt = buildSystemPrompt(mode, char);
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(200);
        expect(prompt).toContain('GymBro');
      });
    });
  });

  it('running prompt mentions pace', () => {
    const prompt = buildSystemPrompt('running', 'drill');
    expect(prompt.toLowerCase()).toContain('pace');
  });

  it('treadmill prompt mentions treadmill', () => {
    const prompt = buildSystemPrompt('treadmill', 'chill');
    expect(prompt.toLowerCase()).toContain('treadmill');
  });

  it('drill character prompt is tough', () => {
    const prompt = buildSystemPrompt('running', 'drill');
    expect(prompt).toContain('Coach Drill');
  });

  it('hype character prompt is energetic', () => {
    const prompt = buildSystemPrompt('running', 'hype');
    expect(prompt).toContain('Hype Queen');
    expect(prompt).toContain('ENERGY');
  });
});
