import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Category } from '../../core/models/game.model';
import { GamesService } from '../../core/services/games.service';
import { GamesActions } from '../../store/games/games.actions';
import { selectAllGames } from '../../store/games/games.feature';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectRunsError } from '../../store/runs/runs.feature';

@Component({
  selector: 'app-run-form',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule],
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

        <label>
          Video URL (optional)
          <input type="url" formControlName="videoUrl" />
        </label>

        @if (error$ | async; as error) {
          <p class="error">{{ error }}</p>
        }

        <button type="submit" [disabled]="form.invalid">Submit run</button>
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
  private readonly destroy$ = new Subject<void>();

  readonly games$ = this.store.select(selectAllGames);
  readonly error$ = this.store.select(selectRunsError);

  categories: Category[] = [];

  readonly form = this.fb.nonNullable.group({
    gameId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    minutes: [0, [Validators.required, Validators.min(0)]],
    seconds: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    videoUrl: [''],
  });

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
      });

    const preselectedGame = this.route.snapshot.queryParamMap.get('gameId');
    if (preselectedGame) {
      this.form.controls.gameId.setValue(preselectedGame);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const timeMs = (value.minutes * 60 + value.seconds) * 1000;
    this.store.dispatch(
      RunsActions.submit({
        dto: {
          gameId: value.gameId,
          categoryId: value.categoryId,
          timeMs,
          videoUrl: value.videoUrl || undefined,
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
