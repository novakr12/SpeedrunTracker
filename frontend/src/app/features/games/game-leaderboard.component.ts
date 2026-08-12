import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { PLATFORMS } from '../../shared/platforms';
import { Category, Game } from '../../core/models/game.model';
import {
  LeaderboardCategory,
  LeaderboardEntry,
} from '../../core/models/leaderboard.model';
import { LeaderboardActions } from '../../store/leaderboard/leaderboard.actions';
import {
  selectLeaderboard,
  selectLeaderboardError,
  selectLeaderboardLoading,
} from '../../store/leaderboard/leaderboard.feature';
import { GamesActions } from '../../store/games/games.actions';
import {
  selectAllGames,
  selectFollowedGameIds,
} from '../../store/games/games.feature';
import { CategoriesActions } from '../../store/categories/categories.actions';
import { selectCategoriesByGame } from '../../store/categories/categories.feature';
import { selectIsAdmin } from '../../store/auth/auth.feature';

interface SplitRow {
  name: string;
  durationMs: number | null;
  deltaMs: number | null;
}

@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink, MsToTimePipe],
  template: `
    <section class="page">
      <header>
        <a class="back" routerLink="/games">Back to games</a>
        <h1>{{ game?.title || (view$ | async)?.gameTitle || 'Leaderboard' }}</h1>

        <div class="page-actions">
          <button
            type="button"
            class="btn follow"
            [class.following]="isFollowing"
            (click)="toggleFollow()"
          >
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>
          <a
            class="btn primary"
            routerLink="/runs/new"
            [queryParams]="{ gameId: gameId$ | async }"
            >+ Add run</a
          >
          @if ((isAdmin$ | async) && !editing) {
            <button type="button" class="btn" (click)="startEdit()">Edit</button>
          }
        </div>
      </header>

      @if (game && !editing) {
        <div class="game-meta">
          @if (game.releaseYear) {
            <span class="chip year">{{ game.releaseYear }}</span>
          }
          @for (platform of game.platforms; track platform) {
            <span class="chip platform">{{ platform }}</span>
          }
          @for (tag of game.tags; track tag) {
            <span class="chip tag">#{{ tag }}</span>
          }
        </div>
      }

      @if (editing) {
        <div class="edit-panel">
          <h2>Edit game</h2>

          <p class="label">Platforms</p>
          <div class="platforms">
            @for (platform of allPlatforms; track platform) {
              <label class="pf">
                <input
                  type="checkbox"
                  [checked]="editPlatforms.has(platform)"
                  (change)="togglePlatform(platform, $any($event.target).checked)"
                />
                {{ platform }}
              </label>
            }
          </div>

          <p class="label">Tags</p>
          <input
            type="text"
            class="tags-input"
            placeholder="Tags (comma separated)"
            [(ngModel)]="editTags"
          />

          @if (categories.length) {
            <p class="label">Categories and their splits</p>
            <div class="cat-editor">
              @for (category of categories; track category.id) {
                <div class="cat-block">
                  <div class="cat-row">
                    <input
                      type="text"
                      [(ngModel)]="categoryNames[category.id]"
                    />
                    <button
                      type="button"
                      (click)="saveCategory(category.id)"
                      [disabled]="!categoryNames[category.id]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      class="danger"
                      (click)="deleteCategory(category.id)"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    class="segments-input"
                    placeholder="Splits, in order (comma separated)"
                    [(ngModel)]="categorySegments[category.id]"
                  />
                </div>
              }
            </div>
          }

          <div class="edit-actions">
            <button type="button" class="btn primary" (click)="saveGame()">
              Save game
            </button>
            <button type="button" class="btn" (click)="editing = false">
              Done
            </button>
          </div>
        </div>
      }

      @if (loading$ | async) {
        <p class="muted">Loading…</p>
      }

      @if (error$ | async; as error) {
        <p class="error">{{ error }}</p>
      }

      @if (view$ | async; as view) {
        @if (view.categories.length) {
          <nav class="tabs">
            @for (category of view.categories; track category.categoryId) {
              <button
                type="button"
                class="tab"
                [class.active]="category.categoryId === view.active?.categoryId"
                (click)="selectCategory(category.categoryId)"
              >
                {{ category.categoryName }}
              </button>
            }
          </nav>
        }

        @if (view.active; as category) {
          @if (category.entries.length) {
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Runner</th>
                  <th>Time</th>
                  <th>Video</th>
                  <th>Played</th>
                  <th>Verified by</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of category.entries; track entry.runId) {
                  <tr>
                    <td class="rank">
                      {{ entry.rank }}
                      @if (entry.rank === 1) {
                        <span class="wr" title="World record">WR</span>
                      }
                    </td>
                    <td>{{ entry.username }}</td>
                    <td class="time">
                      {{ entry.timeMs | msToTime }}
                      @if (entry.segments.length) {
                        <button
                          type="button"
                          class="splits-toggle"
                          [attr.aria-expanded]="openSplitsRunId === entry.runId"
                          (click)="toggleSplits(entry, category, $event)"
                        >
                          splits
                        </button>
                      }
                    </td>
                    <td>
                      @if (entry.videoUrl) {
                        <a
                          [href]="entry.videoUrl"
                          target="_blank"
                          rel="noopener"
                          >Watch</a
                        >
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                    <td>
                      @if (entry.playedAt) {
                        {{ entry.playedAt | date: 'mediumDate' }}
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                    <td class="verified-cell">
                      @if (entry.verifiedBy) {
                        <button
                          type="button"
                          class="verified-by"
                          [attr.aria-expanded]="openRunId === entry.runId"
                          (click)="toggleVerified(entry.runId, $event)"
                        >
                          {{ entry.verifiedBy }}
                        </button>

                        @if (openRunId === entry.runId) {
                          <div
                            class="review-popover"
                            (click)="$event.stopPropagation()"
                          >
                            <p class="label">Verified by</p>
                            <p class="value">{{ entry.verifiedBy }}</p>

                            @if (entry.verifiedAt) {
                              <p class="label">When</p>
                              <p class="value">
                                {{ entry.verifiedAt | date: 'medium' }}
                              </p>
                            }

                            @if (entry.reviewComment) {
                              <p class="label">Comment</p>
                              <p class="value quote">
                                {{ entry.reviewComment }}
                              </p>
                            }
                          </div>
                        }
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                  </tr>

                  @if (openSplitsRunId === entry.runId) {
                    <tr class="splits-row">
                      <td colspan="6">
                        <table class="splits">
                          <tbody>
                            @for (split of openSplits; track split.name) {
                              <tr>
                                <td class="split-name">{{ split.name }}</td>
                                <td class="time">
                                  {{ split.durationMs | msToTime }}
                                </td>
                                <td class="split-delta">
                                  @if (split.deltaMs === null) {
                                    <span class="muted">—</span>
                                  } @else if (split.deltaMs === 0) {
                                    <span class="best">best</span>
                                  } @else {
                                    <span class="behind">{{
                                      formatDelta(split.deltaMs)
                                    }}</span>
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          } @else {
            <p class="muted">No accepted runs yet in {{ category.categoryName }}.</p>
          }

          @if (category.segmentBests.length) {
            <section class="segment-bests">
              <h2>Best segments</h2>
              <p class="muted">
                Fastest recorded time for each split, taken from every accepted
                run in this category.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Split</th>
                    <th>Best</th>
                    <th>Runner</th>
                  </tr>
                </thead>
                <tbody>
                  @for (best of category.segmentBests; track best.segmentId) {
                    <tr>
                      <td>{{ best.segmentName }}</td>
                      <td class="time">
                        @if (best.durationMs !== null) {
                          {{ best.durationMs | msToTime }}
                        } @else {
                          <span class="muted">—</span>
                        }
                      </td>
                      <td>
                        {{ best.username || '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              @if (category.sumOfBestMs !== null) {
                <p class="sum-of-best">
                  Sum of best segments:
                  <strong>{{ category.sumOfBestMs | msToTime }}</strong>
                  @if (bestTimeMs(category); as best) {
                    <span class="muted">
                      — {{ formatDelta(category.sumOfBestMs - best) }} against
                      the current record
                    </span>
                  }
                </p>
              }
            </section>
          }
        } @else {
          <p class="muted">This game has no categories yet.</p>
        }
      }
    </section>
  `,
  styleUrl: './game-leaderboard.css',
})
export class GameLeaderboardComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private readonly selectedCategoryId$ = new BehaviorSubject<string | null>(
    null,
  );

  readonly gameId$ = new BehaviorSubject<string | null>(null);
  readonly loading$ = this.store.select(selectLeaderboardLoading);
  readonly error$ = this.store.select(selectLeaderboardError);
  readonly isAdmin$ = this.store.select(selectIsAdmin);

  readonly allPlatforms = PLATFORMS;
  game: Game | null = null;
  categories: Category[] = [];
  editing = false;
  openRunId: string | null = null;
  openSplitsRunId: string | null = null;
  openSplits: SplitRow[] = [];
  isFollowing = false;
  editPlatforms = new Set<string>();
  editTags = '';
  categoryNames: Record<string, string> = {};
  categorySegments: Record<string, string> = {};

  readonly view$ = combineLatest([
    this.store.select(selectLeaderboard),
    this.selectedCategoryId$,
  ]).pipe(
    map(([board, selectedId]) => {
      if (!board) {
        return null;
      }
      const { categories } = board;
      const active = categories.length
        ? (categories.find((c) => c.categoryId === selectedId) ?? categories[0])
        : null;
      return { gameTitle: board.gameTitle, categories, active };
    }),
  );

  ngOnInit(): void {
    this.store.dispatch(GamesActions.load());
    this.store.dispatch(CategoriesActions.load());
    this.store.dispatch(GamesActions.loadFollowed());

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const gameId = params.get('id');
      if (gameId) {
        this.gameId$.next(gameId);
        this.store.dispatch(LeaderboardActions.load({ gameId }));
      }
    });

    combineLatest([this.store.select(selectAllGames), this.gameId$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([games, id]) => {
        this.game = games.find((g) => g.id === id) ?? null;
      });

    combineLatest([this.store.select(selectFollowedGameIds), this.gameId$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([followedIds, id]) => {
        this.isFollowing = !!id && followedIds.includes(id);
      });

    combineLatest([this.store.select(selectCategoriesByGame), this.gameId$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([grouped, id]) => {
        this.categories = id ? (grouped[id] ?? []) : [];
        if (this.editing) {
          this.syncCategoryNames();
        }
      });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId$.next(categoryId);
    this.openSplitsRunId = null;
  }

  toggleFollow(): void {
    const gameId = this.gameId$.value;
    if (!gameId) {
      return;
    }
    this.store.dispatch(
      this.isFollowing
        ? GamesActions.unfollow({ id: gameId })
        : GamesActions.follow({ id: gameId }),
    );
  }

  toggleVerified(runId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openRunId = this.openRunId === runId ? null : runId;
  }

  toggleSplits(
    entry: LeaderboardEntry,
    category: LeaderboardCategory,
    event: MouseEvent,
  ): void {
    event.stopPropagation();
    if (this.openSplitsRunId === entry.runId) {
      this.openSplitsRunId = null;
      this.openSplits = [];
      return;
    }
    this.openSplitsRunId = entry.runId;
    this.openSplits = category.segmentBests.map((best) => {
      const recorded = entry.segments.find(
        (segment) => segment.segmentId === best.segmentId,
      );
      return {
        name: best.segmentName,
        durationMs: recorded?.durationMs ?? null,
        deltaMs:
          recorded && best.durationMs !== null
            ? recorded.durationMs - best.durationMs
            : null,
      };
    });
  }

  bestTimeMs(category: LeaderboardCategory): number | null {
    return category.entries.length ? category.entries[0].timeMs : null;
  }

  formatDelta(deltaMs: number): string {
    const seconds = (Math.abs(deltaMs) / 1000).toFixed(2);
    return `${deltaMs > 0 ? '+' : '−'}${seconds}s`;
  }

  @HostListener('document:click')
  closeVerified(): void {
    this.openRunId = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openRunId = null;
  }

  startEdit(): void {
    this.editPlatforms = new Set(this.game?.platforms ?? []);
    this.editTags = (this.game?.tags ?? []).join(', ');
    this.syncCategoryNames();
    this.editing = true;
  }

  togglePlatform(platform: string, checked: boolean): void {
    if (checked) {
      this.editPlatforms.add(platform);
    } else {
      this.editPlatforms.delete(platform);
    }
  }

  saveGame(): void {
    if (!this.game) {
      return;
    }
    const tags = this.editTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    this.store.dispatch(
      GamesActions.update({
        id: this.game.id,
        changes: { platforms: Array.from(this.editPlatforms), tags },
      }),
    );
    this.editing = false;
  }

  saveCategory(id: string): void {
    const name = this.categoryNames[id]?.trim();
    if (!name) {
      return;
    }
    const segments = (this.categorySegments[id] ?? '')
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    this.store.dispatch(
      CategoriesActions.update({ id, changes: { name, segments } }),
    );
  }

  deleteCategory(id: string): void {
    this.store.dispatch(CategoriesActions.delete({ id }));
  }

  private syncCategoryNames(): void {
    const names: Record<string, string> = {};
    const segments: Record<string, string> = {};
    this.categories.forEach((category) => {
      names[category.id] = this.categoryNames[category.id] ?? category.name;
      segments[category.id] =
        this.categorySegments[category.id] ??
        [...(category.segments ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((segment) => segment.name)
          .join(', ');
    });
    this.categoryNames = names;
    this.categorySegments = segments;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
