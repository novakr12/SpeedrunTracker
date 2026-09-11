import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
import { Category, CategorySegment } from '../../core/models/game.model';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { durationToMs, positiveDuration } from '../../shared/duration.util';
import { GamesService } from '../../core/services/games.service';
import { GamesActions } from '../../store/games/games.actions';
import { selectAllGames } from '../../store/games/games.feature';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectRunsError } from '../../store/runs/runs.feature';

function todayAsIsoDate(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-run-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, ReactiveFormsModule, MsToTimePipe],
  template: `
    <section class="page">
      <h1>Submit a run</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Game
          <select formControlName="gameId">
            <option value="">— choose game —</option>
            @for (game of games$ | async; track game.id) {
              <option [value]="game.id">{{ game.title }}</option>
            }
          </select>
        </label>

        <label>
          Category
          <select formControlName="categoryId">
            <option value="">— choose category —</option>
            @for (category of categories; track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>

        <div class="time-row" formGroupName="time">
          <label>
            Minutes
            <input type="number" formControlName="minutes" min="0" />
          </label>
          <label>
            Seconds
            <input type="number" formControlName="seconds" min="0" max="59" />
          </label>
          <label>
            Milliseconds
            <input
              type="number"
              formControlName="milliseconds"
              min="0"
              max="999"
            />
          </label>
        </div>
        @if (showZeroTimeError) {
          <p class="error">The total time has to be above zero.</p>
        }

        @if (segmentDefinitions.length) {
          <fieldset class="segments" formArrayName="segments">
            <legend>Splits</legend>
            <p class="muted">
              This category is split into {{ segmentDefinitions.length }}
              segments. Their times have to add up to the total above.
            </p>

            @for (
              segment of segmentDefinitions;
              track segment.id;
              let i = $index
            ) {
              <div class="segment-row" [formGroupName]="i">
                <span class="segment-name">{{ segment.name }}</span>
                <ng-container formGroupName="time">
                  <label>
                    Min
                    <input type="number" formControlName="minutes" min="0" />
                  </label>
                  <label>
                    Sec
                    <input
                      type="number"
                      formControlName="seconds"
                      min="0"
                      max="59"
                    />
                  </label>
                  <label>
                    Ms
                    <input
                      type="number"
                      formControlName="milliseconds"
                      min="0"
                      max="999"
                    />
                  </label>
                </ng-container>
              </div>
            }

            <p class="segment-total" [class.mismatch]="!segmentsMatchTotal">
              Splits add up to
              {{ segmentTotalMs | msToTime: 'milliseconds' }} of
              {{ totalMs | msToTime: 'milliseconds' }}
              @if (!segmentsMatchTotal) {
                <span class="delta">({{ segmentDeltaLabel }})</span>
              }
            </p>
            @if (showZeroSplitError) {
              <p class="error">Every split needs a time above zero.</p>
            }
          </fieldset>
        }

        <label>
          Played on
          <input type="date" formControlName="playedAt" [max]="today" />
        </label>

        <label>
          Video URL (optional)
          <input type="url" formControlName="videoUrl" />
        </label>
        @if (form.controls.videoUrl.invalid) {
          <p class="error">
            Must start with http:// or https:// — leave empty for no video.
          </p>
        }

        @if (error$ | async; as error) {
          <p class="error">{{ error }}</p>
        }

        <button type="submit" [disabled]="form.invalid || !segmentsMatchTotal">
          Submit run
        </button>
      </form>
    </section>
  `,
  styleUrl: './run-form.css',
})
export class RunFormComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly gamesService = inject(GamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly games$ = this.store.select(selectAllGames);
  readonly error$ = this.store.select(selectRunsError);
  readonly today = todayAsIsoDate();

  categories: Category[] = [];
  segmentDefinitions: CategorySegment[] = [];
  segmentTotalMs = 0;
  totalMs = 0;

  readonly form = this.fb.nonNullable.group({
    gameId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    time: this.createDurationGroup(),
    playedAt: [this.today],
    videoUrl: ['', [Validators.pattern(/^https?:\/\/\S+$/i)]],
    segments: this.fb.array<
      ReturnType<RunFormComponent['createSegmentGroup']>
    >([]),
  });

  get segments() {
    return this.form.controls.segments;
  }

  get segmentsMatchTotal(): boolean {
    return (
      !this.segmentDefinitions.length || this.segmentTotalMs === this.totalMs
    );
  }

  get segmentDeltaLabel(): string {
    const delta = this.segmentTotalMs - this.totalMs;
    const seconds = (Math.abs(delta) / 1000).toFixed(3);
    return `${delta > 0 ? '+' : '−'}${seconds}s`;
  }

  get showZeroTimeError(): boolean {
    const time = this.form.controls.time;
    return time.dirty && time.hasError('zeroDuration');
  }

  get showZeroSplitError(): boolean {
    return (
      this.totalMs > 0 &&
      this.segmentsMatchTotal &&
      this.segments.controls.some((group) =>
        group.controls.time.hasError('zeroDuration'),
      )
    );
  }

  ngOnInit(): void {
    this.store.dispatch(GamesActions.load());

    this.form.controls.gameId.valueChanges
      .pipe(
        switchMap((gameId) =>
          gameId ? this.gamesService.getOne(gameId) : of(null),
        ),
        map((game) => game?.categories ?? []),
        takeUntil(this.destroy$),
      )
      .subscribe((categories) => {
        this.categories = categories;
        this.form.controls.categoryId.setValue('');
        this.cdr.markForCheck();
      });

    this.form.controls.categoryId.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((categoryId) => {
        this.rebuildSegments(categoryId);
        this.cdr.markForCheck();
      });

    this.form.valueChanges
      .pipe(startWith(null), takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateTotals();
        this.cdr.markForCheck();
      });

    const preselectedGame = this.route.snapshot.queryParamMap.get('gameId');
    if (preselectedGame) {
      this.form.controls.gameId.setValue(preselectedGame);
    }
  }

  submit(): void {
    if (this.form.invalid || !this.segmentsMatchTotal) {
      return;
    }
    const value = this.form.getRawValue();
    this.store.dispatch(
      RunsActions.submit({
        dto: {
          gameId: value.gameId,
          categoryId: value.categoryId,
          timeMs: this.totalMs,
          playedAt: value.playedAt || undefined,
          videoUrl: value.videoUrl || undefined,
          segments: this.segmentDefinitions.length
            ? value.segments.map((segment) => ({
                segmentId: segment.segmentId,
                durationMs: durationToMs(segment.time),
              }))
            : undefined,
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private rebuildSegments(categoryId: string): void {
    const category = this.categories.find((item) => item.id === categoryId);
    this.segmentDefinitions = [...(category?.segments ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    this.segments.clear();
    for (const segment of this.segmentDefinitions) {
      this.segments.push(this.createSegmentGroup(segment.id));
    }
  }

  private createDurationGroup() {
    return this.fb.nonNullable.group(
      {
        minutes: [0, [Validators.required, Validators.min(0)]],
        seconds: [
          0,
          [Validators.required, Validators.min(0), Validators.max(59)],
        ],
        milliseconds: [
          0,
          [Validators.required, Validators.min(0), Validators.max(999)],
        ],
      },
      { validators: positiveDuration },
    );
  }

  private createSegmentGroup(segmentId: string) {
    return this.fb.nonNullable.group({
      segmentId: [segmentId],
      time: this.createDurationGroup(),
    });
  }

  private recalculateTotals(): void {
    const value = this.form.getRawValue();
    this.totalMs = durationToMs(value.time);
    this.segmentTotalMs = value.segments.reduce(
      (sum, segment) => sum + durationToMs(segment.time),
      0,
    );
  }
}
