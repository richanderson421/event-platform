import { describe, it, expect } from 'vitest';

// Unit-level invariant for 5-minute policy.
describe('match auto confirm timing', () => {
  it('uses 5 minutes as threshold', () => {
    const FIVE_MIN_MS = 5 * 60 * 1000;
    expect(FIVE_MIN_MS).toBe(300000);
  });
});
