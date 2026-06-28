import { describe, it, expect } from 'vitest';
import { epley1RM, computeSessionTotals } from '../volumeCalculator.js';

describe('epley1RM', () => {
  it('computes the Epley estimate', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 3);
    expect(epley1RM(60, 1)).toBeCloseTo(62, 5);
  });

  it('returns 0 for invalid input', () => {
    expect(epley1RM(0, 5)).toBe(0);
    expect(epley1RM(100, 0)).toBe(0);
    expect(epley1RM('', '')).toBe(0);
    expect(epley1RM('abc', 'def')).toBe(0);
  });
});

describe('computeSessionTotals', () => {
  it('counts only completed sets toward volume', () => {
    const session = {
      logs: [
        {
          exerciseName: 'Back Squat',
          sets: [
            { weight: '100', repsCompleted: '5', isComplete: true },
            { weight: '100', repsCompleted: '5', isComplete: true },
            { weight: '100', repsCompleted: '5', isComplete: false }, // ignored
          ],
        },
        {
          exerciseName: 'Bench',
          sets: [{ weight: '60', repsCompleted: '10', isComplete: true }],
        },
      ],
    };
    expect(computeSessionTotals(session)).toEqual({ completedSets: 3, totalVolume: 1600 });
  });

  it('is safe on empty / missing input', () => {
    expect(computeSessionTotals(null)).toEqual({ completedSets: 0, totalVolume: 0 });
    expect(computeSessionTotals({})).toEqual({ completedSets: 0, totalVolume: 0 });
  });
});
