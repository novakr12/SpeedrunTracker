import { describe, expect, it } from 'vitest';
import { MsToTimePipe } from './ms-to-time.pipe';

describe('MsToTimePipe', () => {
  const pipe = new MsToTimePipe();

  it('formats sub-hour times as m:ss', () => {
    expect(pipe.transform(90_000)).toBe('1:30');
  });

  it('formats times past an hour as h:mm:ss', () => {
    expect(pipe.transform(3_723_000)).toBe('1:02:03');
  });

  it('pads minutes and seconds to two digits past an hour', () => {
    expect(pipe.transform(3_600_000)).toBe('1:00:00');
  });

  it('truncates milliseconds instead of rounding up', () => {
    expect(pipe.transform(1_999)).toBe('0:01');
  });

  it('renders zero as a valid time', () => {
    expect(pipe.transform(0)).toBe('0:00');
  });

  it('returns a dash for missing or negative values', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(-1)).toBe('—');
  });
});
