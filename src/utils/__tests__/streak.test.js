import { describe, it, expect } from 'vitest';
import { computeStreak, computeWeekStreak } from '../streak.js';

// Noon-anchored to avoid midnight/DST edge cases in the test fixtures.
const daysAgo = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const weeksAgo = (n) => daysAgo(n * 7);
const session = (iso) => ({ completedAt: iso });

describe('computeStreak (consecutive days)', () => {
  it('counts back-to-back days ending today', () => {
    expect(computeStreak([session(daysAgo(0)), session(daysAgo(1)), session(daysAgo(2))].map((s) => s))).toBe(3);
  });

  it('still counts when the latest day is yesterday', () => {
    expect(computeStreak([session(daysAgo(1)), session(daysAgo(2))])).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(computeStreak([session(daysAgo(0)), session(daysAgo(2))])).toBe(1);
  });

  it('is 0 when the latest workout is too old', () => {
    expect(computeStreak([session(daysAgo(5))])).toBe(0);
  });

  it('is 0 for empty history', () => {
    expect(computeStreak([])).toBe(0);
  });
});

describe('computeWeekStreak (consecutive weeks)', () => {
  it('counts consecutive weeks with at least one session', () => {
    expect(computeWeekStreak([session(weeksAgo(0)), session(weeksAgo(1)), session(weeksAgo(2))])).toBe(3);
  });

  it('collapses multiple sessions in the same week to one', () => {
    expect(computeWeekStreak([session(daysAgo(0)), session(daysAgo(1)), session(weeksAgo(1))])).toBe(2);
  });

  it('breaks when a week is skipped', () => {
    expect(computeWeekStreak([session(weeksAgo(0)), session(weeksAgo(2))])).toBe(1);
  });

  it('is 0 when the latest week is too old', () => {
    expect(computeWeekStreak([session(weeksAgo(3))])).toBe(0);
  });
});
