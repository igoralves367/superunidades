import { describe, expect, it } from 'vitest';
import { getCurrentClubQuarter } from './trimestre';

describe('getCurrentClubQuarter', () => {
  it.each([
    ['março', new Date(2026, 2, 1), 1],
    ['maio', new Date(2026, 4, 31), 1],
    ['junho', new Date(2026, 5, 1), 2],
    ['julho', new Date(2026, 6, 10), 2],
    ['agosto', new Date(2026, 7, 31), 2],
    ['setembro', new Date(2026, 8, 1), 3],
    ['janeiro', new Date(2026, 0, 1), 3],
  ] as const)('classifica %s no trimestre correto', (_label, date, expected) => {
    expect(getCurrentClubQuarter(date)).toBe(expected);
  });
});
