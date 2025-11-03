import { salaryPerSecond, safeSlug } from '../lib/utils';
import { describe, it, expect } from 'vitest';

describe('utils', () => {
  it('calculates salary per second', () => {
    const per = salaryPerSecond(365 * 24 * 60 * 60); // 1 per second
    expect(per).toBeCloseTo(1);
  });
  it('generates slug', () => {
    const s = safeSlug('Alice', 'Bob');
    expect(typeof s).toBe('string');
    expect(s.includes('alice-vs-bob')).toBe(true);
  });
});

