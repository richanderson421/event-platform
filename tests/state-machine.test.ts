import { describe, it, expect } from 'vitest';
import { canTransition } from '../lib/events/state-machine';

describe('event state machine', () => {
  it('allows draft to published', () => {
    expect(canTransition('DRAFT', 'PUBLISHED')).toBe(true);
  });

  it('blocks completed back to in progress', () => {
    expect(canTransition('COMPLETED', 'IN_PROGRESS')).toBe(false);
  });
});
