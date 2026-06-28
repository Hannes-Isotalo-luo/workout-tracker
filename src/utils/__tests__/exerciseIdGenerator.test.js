import { describe, it, expect } from 'vitest';
import { generateExerciseId } from '../exerciseIdGenerator.js';

describe('generateExerciseId', () => {
  it('builds deterministic ids from known program/phase/day', () => {
    expect(generateExerciseId('Full Body', 'Weeks 1-4', 'Full Body #1', 0)).toBe('fb_w14_fb1_1');
    expect(generateExerciseId('Upper/Lower', 'Weeks 5-8', 'Lower Body #2', 3)).toBe('ul_w58_lb2_4');
    expect(generateExerciseId('Body Part Split', 'Weeks 1-4', 'Chest & Triceps', 0)).toBe('bps_w14_ct_1');
  });

  it('falls back to derived abbreviations for unknown names (e.g. custom routines)', () => {
    const id = generateExerciseId('Custom', 'Block 1', 'Heavy Day', 2);
    expect(id).toBe('cus_1_heav_3');
  });

  it('is stable for the same inputs', () => {
    const a = generateExerciseId('Full Body', 'Weeks 1-4', 'Full Body #1', 5);
    const b = generateExerciseId('Full Body', 'Weeks 1-4', 'Full Body #1', 5);
    expect(a).toBe(b);
  });
});
