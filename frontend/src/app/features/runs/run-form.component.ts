import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
import { Category, CategorySegment } from '../../core/models/game.model';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { GamesService } from '../../core/services/games.service';
import { GamesActions } from '../../store/games/games.actions';
import { selectAllGames } from '../../store/games/games.feature';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectRunsError } from '../../store/runs/runs.feature';

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

        <div class="time-row">
          <label>
            Minutes
            <input type="number" formControlName="minutes" min="0" />
          </label>
          <label>
            Seconds
            <input type="number" formControlName="seconds" min="0" max="59" />
          </label>
        </div>

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
              </div>
            }

            <p class="segment-total" [class.mismatch]="!segmentsMatchTotal">
              Splits add up to {{ segmentTotalMs | msToTime }} of
              {{ totalMs | msToTime }}
              @if (!segmentsMatchTotal) {
                <span class="delta">({{ segmentDeltaLabel }})</span>
              }
            </p>
          </fieldset>
        }

        <label>
          Video URL (optional)
          <input type="url" formControlName="videoUrl" />
        </label>

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

  categories: Category[] = [];
  segmentDefinitions: CategorySegment[] = [];
  segmentTotalMs = 0;
  totalMs = 0;

  readonly form = this.fb.nonNullable.group({
    gameId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    minutes: [0, [Validators.required, Validators.min(0)]],
    seconds: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    videoUrl: [''],
    segments: this.fb.array<
      ReturnType<RunFormComponent['createSegmentGroup']>
    >([]),
  });

  get segments(): FormArray {
    return this.form.controls.segments as FormArray;
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
          videoUrl: value.videoUrl || undefined,
          segments: this.segmentDefinitions.length
            ? value.segments.map((segment) => ({
                segmentId: segment.segmentId,
                durationMs: (segment.minutes * 60 + segment.seconds) * 1000,
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

  private createSegmentGroup(segmentId: string) {
    return this.fb.nonNullable.group({
      segmentId: [segmentId],
      minutes: [0, [Validators.required, Validators.min(0)]],
      seconds: [
        0,
        [Validators.required, Validators.min(0), Validators.max(59)],
      ],
    });
  }

  private recalculateTotals(): void {
    const value = this.form.getRawValue();
    this.totalMs = (value.minutes * 60 + value.seconds) * 1000;
    this.segmentTotalMs = value.segments.reduce(
      (sum, segment) => sum + (segment.minutes * 60 + segment.seconds) * 1000,
      0,
    );
  }
}
