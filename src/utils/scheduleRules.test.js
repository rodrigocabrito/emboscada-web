import { describe, it, expect } from 'vitest';
import { sessionMinutes, availMinutes, formatHour, monitorAvail, monitorWarnings } from './scheduleRules';

describe('time parsing', () => {
  it('parses session times ("HH:MM")', () => {
    expect(sessionMinutes('14:00')).toBe(840);
    expect(sessionMinutes('09:30')).toBe(570);
    expect(sessionMinutes('')).toBeNull();
    expect(sessionMinutes(undefined)).toBeNull();
  });

  it('parses availability times ("HHhMM")', () => {
    expect(availMinutes('14h00')).toBe(840);
    expect(availMinutes('09h30')).toBe(570);
    expect(availMinutes('')).toBeNull();
  });

  it('formats hours compactly', () => {
    expect(formatHour('14h00')).toBe('14h');
    expect(formatHour('14h30')).toBe('14h30');
    expect(formatHour('')).toBe('');
  });
});

describe('monitorAvail', () => {
  it('handles missing availability', () => {
    expect(monitorAvail('u1', {}).status).toBe('none');
  });

  it('handles unavailable', () => {
    expect(monitorAvail('u1', { u1: { available: false } }).status).toBe('unavailable');
  });

  it('full day without limits', () => {
    const a = monitorAvail('u1', { u1: { available: true, typeOfAvailability: 'full' } });
    expect(a.status).toBe('full');
    expect(a.window).toBe('Dia inteiro');
  });

  it('full with limits still exposes the window', () => {
    const a = monitorAvail('u1', { u1: { available: true, typeOfAvailability: 'full', earlierLimit: '14h00' } });
    expect(a.status).toBe('full');
    expect(a.window).toBe('A partir das 14h');
    expect(a.earlier).toBe('14h00');
  });

  it('partial with both limits', () => {
    const a = monitorAvail('u1', { u1: { available: true, typeOfAvailability: 'part', earlierLimit: '10h00', laterLimit: '18h00' } });
    expect(a.status).toBe('part');
    expect(a.window).toBe('10h – 18h');
  });
});

describe('monitorWarnings', () => {
  const availOf = (entry) => monitorAvail('u1', { u1: entry });
  const session = (id, time, monitors = []) => ({ id, sessionTime: time, monitors });

  it('no warnings for a fully available monitor with no other sessions', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'full' });
    expect(monitorWarnings(avail, session('s1', '14:00'), 'u1', [])).toEqual([]);
  });

  it('flags unavailable monitors', () => {
    const avail = availOf({ available: false });
    expect(monitorWarnings(avail, session('s1', '14:00'), 'u1', [])).toEqual(['Indisponível neste dia']);
  });

  it('rule 1: needs 1h check-in margin before the start', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'part', earlierLimit: '14h00' });
    // Session at 14:30 → check-in 13:30 < 14h00 limit → warning
    expect(monitorWarnings(avail, session('s1', '14:30'), 'u1', [])).toHaveLength(1);
    // Session at 15:00 → check-in exactly at 14:00 → ok
    expect(monitorWarnings(avail, session('s1', '15:00'), 'u1', [])).toEqual([]);
  });

  it('rule 3: session must end 30min before the exit limit', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'part', laterLimit: '18h00' });
    // 15:00 session ends 17:00, +30min = 17:30 ≤ 18:00 → ok
    expect(monitorWarnings(avail, session('s1', '15:00'), 'u1', [])).toEqual([]);
    // 16:00 session ends 18:00, +30min = 18:30 > 18:00 → warning
    expect(monitorWarnings(avail, session('s1', '16:00'), 'u1', [])).toHaveLength(1);
  });

  it('rule 1 and 3 apply to "full" availability with limits too', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'full', earlierLimit: '14h00' });
    expect(monitorWarnings(avail, session('s1', '14:30'), 'u1', [])).toHaveLength(1);
  });

  it('rule 2: requires 1h gap between the monitor\'s sessions', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'full' });
    const day = [session('other', '10:00', ['u1'])]; // other session: 10:00–12:00
    // 13:00 start = exactly 1h after 12:00 end → ok
    expect(monitorWarnings(avail, session('s1', '13:00', ['u1']), 'u1', day)).toEqual([]);
    // 12:30 start = only 30min gap → warning
    expect(monitorWarnings(avail, session('s1', '12:30', ['u1']), 'u1', day)).toHaveLength(1);
  });

  it('rule 2 ignores sessions the monitor is not assigned to', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'full' });
    const day = [session('other', '10:00', ['someone-else'])];
    expect(monitorWarnings(avail, session('s1', '11:00'), 'u1', day)).toEqual([]);
  });

  it('multiple violations stack', () => {
    const avail = availOf({ available: true, typeOfAvailability: 'part', earlierLimit: '12h00', laterLimit: '14h00' });
    // 12:30: check-in 11:30 < 12h AND ends 14:30 (+30 = 15:00) > 14h → 2 warnings
    expect(monitorWarnings(avail, session('s1', '12:30'), 'u1', [])).toHaveLength(2);
  });
});
