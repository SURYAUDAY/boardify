import { describe, it, expect } from 'vitest';
import { calculateStrength } from '../passwordStrength';

describe('calculateStrength', () => {
  it('empty password → score 0, label ""', () => {
    expect(calculateStrength('')).toEqual({ score: 0, label: '' });
  });

  it('"abc" → score 0 (Weak)', () => {
    expect(calculateStrength('abc')).toEqual({ score: 0, label: 'Weak' });
  });

  it('"abcdefgh" → score 1 (Weak)', () => {
    expect(calculateStrength('abcdefgh')).toEqual({ score: 1, label: 'Weak' });
  });

  it('"abcdefg1" → score 2 (Fair)', () => {
    expect(calculateStrength('abcdefg1')).toEqual({ score: 2, label: 'Fair' });
  });

  it('"Abcdefg1" → score 3 (Good)', () => {
    expect(calculateStrength('Abcdefg1')).toEqual({ score: 3, label: 'Good' });
  });

  it('"Abcdefg1!" → score 4 (Strong)', () => {
    expect(calculateStrength('Abcdefg1!')).toEqual({ score: 4, label: 'Strong' });
  });
});
