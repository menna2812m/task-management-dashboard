import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  const now = new Date('2026-09-03T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;

  it('treats anything under a minute as just now', () => {
    expect(formatRelativeTime(ago(0), now)).toBe('just now');
    expect(formatRelativeTime(ago(59 * second), now)).toBe('just now');
  });

  it('formats minutes', () => {
    expect(formatRelativeTime(ago(minute), now)).toBe('1 min ago');
    expect(formatRelativeTime(ago(45 * minute), now)).toBe('45 min ago');
  });

  it('formats hours', () => {
    expect(formatRelativeTime(ago(hour), now)).toBe('1 hour ago');
    expect(formatRelativeTime(ago(5 * hour), now)).toBe('5 hours ago');
  });

  it('formats days up to a week', () => {
    expect(formatRelativeTime(ago(day), now)).toBe('yesterday');
    expect(formatRelativeTime(ago(6 * day), now)).toBe('6 days ago');
  });

  it('falls back to a short date beyond a week', () => {
    expect(formatRelativeTime(ago(8 * day), now)).toBe('Aug 26');
  });

  it('never reports the future as ago', () => {
    expect(formatRelativeTime(ago(-5 * minute), now)).toBe('just now');
  });
});
