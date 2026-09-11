import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface Duration {
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export function durationToMs({
  minutes,
  seconds,
  milliseconds,
}: Duration): number {
  return Math.round((minutes * 60 + seconds) * 1000 + milliseconds);
}

export function positiveDuration(
  control: AbstractControl<Duration>,
): ValidationErrors | null {
  return durationToMs(control.value) > 0 ? null : { zeroDuration: true };
}
