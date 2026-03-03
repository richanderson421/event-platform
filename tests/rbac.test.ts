import { describe, it, expect } from 'vitest';
import { canEditEvent, canManageOrg } from '../lib/rbac/permissions';

describe('rbac', () => {
  it('editor can edit event', () => {
    expect(canEditEvent('EDITOR')).toBe(true);
  });

  it('viewer cannot manage org', () => {
    expect(canManageOrg('VIEWER')).toBe(false);
  });
});
