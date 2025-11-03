import { describe, it, expect } from 'vitest';
import { dicebearUrl } from '../lib/avatar';

describe('dicebearUrl', () => {
  it('generates a predictable url with seed', () => {
    const url = dicebearUrl('Alice', { size: 128 });
    expect(url).toContain('seed=Alice');
    expect(url).toContain('/initials/');
    expect(url).toContain('size=128');
  });
  it('encodes names with spaces', () => {
    const url = dicebearUrl('Mary Jane');
    expect(url).toContain('seed=Mary%20Jane');
  });
});

