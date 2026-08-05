import { describe, expect, it } from 'vitest';
import { parseDuration } from '../src/duration';

describe('parseDuration', () => {
  it('parses compact duration strings into seconds', () => {
    expect(parseDuration('2h30m')).toBe(9_000);
    expect(parseDuration('1d2h3m4s')).toBe(93_784);
  });

  it('parses single-unit durations', () => {
    expect(parseDuration('45s')).toBe(45);
    expect(parseDuration('15m')).toBe(900);
    expect(parseDuration('3h')).toBe(10_800);
    expect(parseDuration('2d')).toBe(172_800);
  });

  it('allows whitespace and case-insensitive units', () => {
    expect(parseDuration(' 1H 5m 10S ')).toBe(3_910);
  });

  it('rejects invalid duration strings', () => {
    expect(() => parseDuration('')).toThrowError(/empty/);
    expect(() => parseDuration('30')).toThrowError(/invalid duration/);
    expect(() => parseDuration('m30')).toThrowError(/invalid duration/);
    expect(() => parseDuration('1h bananas')).toThrowError(/invalid duration/);
    expect(() => parseDuration('-1h')).toThrowError(/invalid duration/);
    expect(() => parseDuration('1.5h')).toThrowError(/invalid duration/);
  });
});
