import { describe, it, expect } from 'vitest';
import { isClient } from '../lib/env';

describe('env helper', () => {
  it('isClient should be false in Node test environment', () => {
    // Vitest runs in a node environment by default; window is undefined
    expect(isClient).toBe(false);
  });
});

