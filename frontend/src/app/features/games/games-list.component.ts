import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { GameCardComponent } from './game-card.component';
import { Game } from '../../core/models/game.model';
import { GamesActions } from '../../store/games/games.actions';
import {
  selectFilteredGames,
  selectGamesLoading,
} from '../../store/games/games.feature';

@Component({
  selector: 'app-games-list',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, GameCardComponent],
  template: `
    <section class="page">
      <header>
        <h1>Games</h1>
        <input
          class="search"
          type="search"
          placeholder="Search games…"
          [formControl]="search"
        />
      </header>

      <form class="add" [formGroup]="addForm" (ngSubmit)="addGame()">
        <input type="text" placeholder="Title" formControlName="title" />
        <input type="text" placeholder="Platform" formControlName="platform" />
        <input
          type="number"
          placeholder="Year"
          formControlName="releaseYear"
        />
        <button type="submit" [disabled]="addForm.invalid">Add game</button>
      </form>

      @if (loading$ | async) {
        <p class="muted">Loading…</p>
      }

      <div class="grid">
        @for (game of games$ | async; track game.id) {
          <app-game-card [game]="game" (select)="onSelect($event)" />
        } @empty {
          <p class="muted">No games found.</p>
        }
      </div>
    </section>
  `,
  styleUrl: './games-list.css',
})
export class GamesListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  readonly games$ = this.store.select(selectFilteredGames);
  readonly loading$ = this.store.select(selectGamesLoading);

  readonly search = new FormControl('', { nonNullable: true });

  readonly addForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    platform: [''],
    releaseYear: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    this.store.dispatch(GamesActions.load());

    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) =>
        this.store.dispatch(GamesActions.setSearch({ search })),
      );
  }

  onSelect(game: Game): void {
    this.router.navigate(['/runs/new'], { queryParams: { gameId: game.id } });
  }

  addGame(): void {
    if (this.addForm.invalid) {
      return;
    }
    const value = this.addForm.getRawValue();
    this.store.dispatch(
      GamesActions.create({
        dto: {
          title: value.title,
          platform: value.platform || undefined,
          releaseYear: value.releaseYear ?? undefined,
        },
      }),
    );
    this.addForm.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
