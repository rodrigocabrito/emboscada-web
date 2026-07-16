import { describe, it, expect } from 'vitest';
import { roleLabel, isAssignableMonitor, ROLE_OPTIONS } from './roles';

describe('roles', () => {
  it('labels all known roles', () => {
    expect(roleLabel('admin')).toBe('Administrador(a)');
    expect(roleLabel('monitor_leader')).toBe('Monitor(a) Líder');
    expect(roleLabel('monitor')).toBe('Monitor(a)');
  });

  it('falls back to the raw value for unknown roles', () => {
    expect(roleLabel('alien')).toBe('alien');
  });

  it('admins, leaders and monitors are assignable to sessions; customers are not', () => {
    expect(isAssignableMonitor('admin')).toBe(true);
    expect(isAssignableMonitor('monitor_leader')).toBe(true);
    expect(isAssignableMonitor('monitor')).toBe(true);
    expect(isAssignableMonitor('customer')).toBe(false);
    expect(isAssignableMonitor(undefined)).toBe(false);
  });

  it('every selectable role has a label', () => {
    for (const r of ROLE_OPTIONS) {
      expect(roleLabel(r.value)).toBe(r.label);
    }
  });
});
