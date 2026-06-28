import { describe, it, expect } from 'vitest';
import { computePRMap, sessionMaxWeight, annotateSessionPRs, detectSessionPRs } from '../prs.js';

const history = [
  {
    id: 's1',
    logs: [
      {
        exerciseName: 'Back Squat',
        sets: [
          { weight: '100', repsCompleted: '5', isComplete: true },
          { weight: '110', repsCompleted: '5', isComplete: true },
          { weight: '120', repsCompleted: '5', isComplete: false }, // not completed
        ],
      },
    ],
  },
  {
    id: 's2',
    logs: [{ exerciseName: 'Back Squat', sets: [{ weight: '115', repsCompleted: '3', isComplete: true }] }],
  },
];

describe('computePRMap', () => {
  it('tracks heaviest completed weight per exercise', () => {
    expect(computePRMap(history)).toEqual({ 'Back Squat': 115 });
  });

  it('can exclude a session by id', () => {
    expect(computePRMap(history, 's2')).toEqual({ 'Back Squat': 110 });
  });

  it('is safe on empty input', () => {
    expect(computePRMap()).toEqual({});
    expect(computePRMap([])).toEqual({});
  });
});

describe('sessionMaxWeight', () => {
  it('returns the heaviest completed weight in a single log', () => {
    expect(sessionMaxWeight(history[0].logs[0])).toBe(110);
  });
});

describe('annotateSessionPRs', () => {
  it('flags completed sets that beat the prior record, advancing the running max', () => {
    const session = {
      logs: [
        {
          exerciseName: 'Back Squat',
          sets: [
            { weight: '110', repsCompleted: '5', isComplete: true }, // ties record, not a PR
            { weight: '120', repsCompleted: '5', isComplete: true }, // new PR
            { weight: '125', repsCompleted: '5', isComplete: false }, // heavier but not completed
          ],
        },
      ],
    };
    const out = annotateSessionPRs(session, { 'Back Squat': 110 });
    expect(out.logs[0].sets[0].isPR).toBeUndefined();
    expect(out.logs[0].sets[1].isPR).toBe(true);
    expect(out.logs[0].sets[2].isPR).toBeUndefined();
  });

  it('does not mutate the input session', () => {
    const session = { logs: [{ exerciseName: 'X', sets: [{ weight: '50', repsCompleted: '5', isComplete: true }] }] };
    annotateSessionPRs(session, {});
    expect(session.logs[0].sets[0].isPR).toBeUndefined();
  });
});

describe('detectSessionPRs', () => {
  it('returns the records a session beats', () => {
    const session = { logs: [{ exerciseName: 'Back Squat', sets: [{ weight: '130', repsCompleted: '3', isComplete: true }] }] };
    expect(detectSessionPRs(session, { 'Back Squat': 115 })).toEqual([
      { exerciseName: 'Back Squat', weight: 130, previousWeight: 115 },
    ]);
  });

  it('returns nothing when no record is beaten', () => {
    const session = { logs: [{ exerciseName: 'Back Squat', sets: [{ weight: '100', repsCompleted: '3', isComplete: true }] }] };
    expect(detectSessionPRs(session, { 'Back Squat': 115 })).toEqual([]);
  });
});
