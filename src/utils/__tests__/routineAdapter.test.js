import { describe, it, expect } from 'vitest';
import { routineToProgram, routinesToProgramData, customProgramNames } from '../routineAdapter.js';

const routine = {
  id: 'r1',
  name: 'My Split',
  phases: [
    {
      name: 'Block A',
      days: [
        {
          name: 'Push',
          exercises: [{ name: 'Bench', targetSets: 4, targetReps: 8, rpe: 9, rest: '2 MIN', notes: 'brace' }],
        },
      ],
    },
  ],
};

describe('routineToProgram', () => {
  it('maps a routine into the nested programData shape', () => {
    const program = routineToProgram(routine);
    expect(program).toEqual({
      'Block A': {
        Push: [{ exercise: 'Bench', sets: 4, reps: '8', rpe: 9, rest: '2 MIN', notes: 'brace' }],
      },
    });
  });

  it('applies sensible defaults for missing fields', () => {
    const program = routineToProgram({ phases: [{ days: [{ exercises: [{}] }] }] });
    expect(program['Phase 1']['Day 1'][0]).toEqual({
      exercise: 'Exercise',
      sets: 3,
      reps: '',
      rpe: 0,
      rest: '',
      notes: '',
    });
  });
});

describe('routinesToProgramData', () => {
  it('keys programs by routine name and skips unnamed routines', () => {
    const map = routinesToProgramData([routine, { id: 'x', phases: [] }]);
    expect(Object.keys(map)).toEqual(['My Split']);
  });
});

describe('customProgramNames', () => {
  it('returns the set of routine names', () => {
    const names = customProgramNames([routine]);
    expect(names.has('My Split')).toBe(true);
    expect(names.size).toBe(1);
  });
});
