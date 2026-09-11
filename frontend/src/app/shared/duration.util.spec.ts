import { describe, expect, it } from 'vitest';
import { FormControl } from '@angular/forms';
import { Duration, durationToMs, positiveDuration } from './duration.util';

function durationControl(value: Duration) {
  return new FormControl<Duration>(value, { nonNullable: true });
}

describe('durationToMs', () => {
  it('combines minutes, seconds and milliseconds', () => {
    expect(durationToMs({ minutes: 1, seconds: 23, milliseconds: 456 })).toBe(
      83_456,
    );
  });

  it('returns zero for an empty duration', () => {
    expect(durationToMs({ minutes: 0, seconds: 0, milliseconds: 0 })).toBe(0);
  });

  it('rounds fractional input to a whole millisecond', () => {
    expect(durationToMs({ minutes: 0, seconds: 1.2345, milliseconds: 0 })).toBe(
      1_235,
    );
  });
});

describe('positiveDuration', () => {
  it('rejects a duration of zero', () => {
    const control = durationControl({ minutes: 0, seconds: 0, milliseconds: 0 });

    expect(positiveDuration(control)).toEqual({ zeroDuration: true });
  });

  it('accepts a single millisecond', () => {
    const control = durationControl({ minutes: 0, seconds: 0, milliseconds: 1 });

    expect(positiveDuration(control)).toBeNull();
  });
});
