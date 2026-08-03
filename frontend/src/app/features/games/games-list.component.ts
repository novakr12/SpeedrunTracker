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
import { Category, Game } from '../../core/models/game.model';
import { PLATFORMS } from '../../shared/platforms';
import { GamesActions } from '../../store/games/games.actions';
import {
  selectFilteredGames,
  selectGamesError,
  selectGamesLoading,
} from '../../store/games/games.feature';
import { CategoriesActions } from '../../store/categories/categories.actions';
import { selectCategoriesByGame } from '../../store/categories/categories.feature';
import { selectIsAdmin } from '../../store/auth/auth.feature';

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

      @if (isAdmin$ | async) {
      <form class="add-game" [formGroup]="addForm" (ngSubmit)="addGame()">
        <div class="row">
          <input type="text" placeholder="Title" formControlName="title" />
          <input
            type="number"
            placeholder="Year"
            formControlName="releaseYear"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            formControlName="tags"
          />
        </div>
        <div class="row">
          <input
            type="text"
            class="cover-url"
            placeholder="Cover image URL (optional)"
            formControlName="coverImage"
          />
        </div>
        @if (addForm.controls.coverImage.invalid) {
          <p class="field-error">
            Must start with http:// or https:// — leave empty for no cover.
          </p>
        }
        <div class="platforms">
          @for (platform of platforms; track platform) {
            <label class="pf">
              <input
                type="checkbox"
                [checked]="selectedPlatforms.has(platform)"
                (change)="togglePlatform(platform, $any($event.target).checked)"
              />
              {{ platform }}
            </label>
          }
        </div>
        <button type="submit" [disabled]="addForm.invalid">Add game</button>
      </form>

      <form class="add" [formGroup]="categoryForm" (ngSubmit)="addCategory()">
        <select formControlName="gameId">
          <option value="">— choose game —</option>
          @for (game of games$ | async; track game.id) {
            <option [value]="game.id">{{ game.title }}</option>
          }
        </select>
        <input
          type="text"
          placeholder="Category (e.g. 100%)"
          formControlName="name"
        />
        <button type="submit" [disabled]="categoryForm.invalid">
          Add category
        </button>
      </form>
      }

      @if (error$ | async; as error) {
        <p class="form-error">{{ error }}</p>
      }

      @if (loading$ | async) {
        <p class="muted">Loading…</p>
      }

      <div class="grid">
        @for (game of games$ | async; track game.id) {
          <app-game-card
            [game]="game"
            [categories]="categoriesByGame[game.id] || []"
            [canManage]="(isAdmin$ | async) ?? false"
            (open)="onOpen($event)"
            (remove)="onRemove($event)"
          />
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
  readonly error$ = this.store.select(selectGamesError);
  readonly isAdmin$ = this.store.select(selectIsAdmin);

  readonly search = new FormControl('', { nonNullable: true });

  readonly platforms = PLATFORMS;
  readonly selectedPlatforms = new Set<string>();

  readonly addForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    releaseYear: this.fb.control<number | null>(null),
    tags: [''],
    coverImage: ['', [Validators.pattern(/^https?:\/\/\S+$/i)]],
  });

  readonly categoryForm = this.fb.nonNullable.group({
    gameId: ['', [Validators.required]],
    name: ['', [Validators.required]],
  });

  categoriesByGame: Record<string, Category[]> = {};

  ngOnInit(): void {
    this.store.dispatch(GamesActions.load());
    this.store.dispatch(CategoriesActions.load());

    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) =>
        this.store.dispatch(GamesActions.setSearch({ search })),
      );

    this.store
      .select(selectCategoriesByGame)
      .pipe(takeUntil(this.destroy$))
      .subscribe((grouped) => (this.categoriesByGame = grouped));
  }

  onOpen(game: Game): void {
    this.router.navigate(['/games', game.id]);
  }

  onRemove(id: string): void {
    this.store.dispatch(GamesActions.delete({ id }));
  }

  togglePlatform(platform: string, checked: boolean): void {
    if (checked) {
      this.selectedPlatforms.add(platform);
    } else {
      this.selectedPlatforms.delete(platform);
    }
  }

  addGame(): void {
    if (this.addForm.invalid) {
      return;
    }
    const value = this.addForm.getRawValue();
    const tags = value.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    const coverImage = value.coverImage.trim();
    this.store.dispatch(
      GamesActions.create({
        dto: {
          title: value.title,
          releaseYear: value.releaseYear ?? undefined,
          platforms: Array.from(this.selectedPlatforms),
          tags,
          coverImage: coverImage || undefined,
        },
      }),
    );
    this.addForm.reset();
    this.selectedPlatforms.clear();
  }

  addCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }
    const value = this.categoryForm.getRawValue();
    this.store.dispatch(CategoriesActions.create({ dto: value }));
    this.categoryForm.controls.name.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
