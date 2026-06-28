import { describe, it, expect } from 'vitest';
import { calculateNextSession } from '../nextSession.js';

const programData = {
  'Full Body': {
    'Weeks 1-4': { 'Day 1': [], 'Day 2': [] },
    'Weeks 5-8': { 'Day 1': [], 'Day 2': [] },
  },
};

describe('calculateNextSession', () => {
  it('returns null without program data', () => {
    expect(calculateNextSession(null, null, null, [])).toBeNull();
  });

  it('advances to the next day within the same phase', () => {
    const last = { program: 'Full Body', phase: 'Weeks 1-4', day: 'Day 1' };
    expect(calculateNextSession(programData, last)).toEqual({ program: 'Full Body', phase: 'Weeks 1-4', day: 'Day 2' });
  });

  it('rolls into the first day of the next phase', () => {
    const last = { program: 'Full Body', phase: 'Weeks 1-4', day: 'Day 2' };
    expect(calculateNextSession(programData, last)).toEqual({ program: 'Full Body', phase: 'Weeks 5-8', day: 'Day 1' });
  });

  it('loops back to the very first day after the final session', () => {
    const last = { program: 'Full Body', phase: 'Weeks 5-8', day: 'Day 2' };
    expect(calculateNextSession(programData, last)).toEqual({ program: 'Full Body', phase: 'Weeks 1-4', day: 'Day 1' });
  });

  it('starts an enrolled program from the beginning with no history', () => {
    expect(calculateNextSession(programData, null, 'Full Body', [])).toEqual({
      program: 'Full Body',
      phase: 'Weeks 1-4',
      day: 'Day 1',
    });
  });

  it('derives the next session from history for the enrolled program', () => {
    const history = [{ program: 'Full Body', phase: 'Weeks 1-4', day: 'Day 1' }];
    expect(calculateNextSession(programData, null, 'Full Body', history)).toEqual({
      program: 'Full Body',
      phase: 'Weeks 1-4',
      day: 'Day 2',
    });
  });
});
