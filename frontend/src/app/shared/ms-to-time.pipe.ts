import { Pipe, PipeTransform } from '@angular/core';

export type TimePrecision = 'seconds' | 'milliseconds';

@Pipe({ name: 'msToTime', standalone: true })
export class MsToTimePipe implements PipeTransform {
  transform(
    ms: number | null | undefined,
    precision: TimePrecision = 'seconds',
  ): string {
    if (ms == null || ms < 0) {
      return '—';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    const clock = hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
    if (precision === 'seconds') {
      return clock;
    }
    const millis = Math.floor(ms % 1000)
      .toString()
      .padStart(3, '0');
    return `${clock}.${millis}`;
  }
}
