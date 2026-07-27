import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { LeaderboardActions } from '../../store/leaderboard/leaderboard.actions';
import {
  selectLeaderboard,
  selectLeaderboardError,
  selectLeaderboardLoading,
} from '../../store/leaderboard/leaderboard.feature';

@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, MsToTimePipe],
  template: `
    <section class="page">
      <header>
        <a class="back" routerLink="/games">Back to games</a>
        <h1>{{ (view$ | async)?.gameTitle || 'Leaderboard' }}</h1>
      </header>

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
                </tr>
              </thead>
              <tbody>
                @for (entry of category.entries; track entry.runId) {
                  <tr>
                    <td class="rank">{{ entry.rank }}</td>
                    <td>{{ entry.username }}</td>
                    <td class="time">{{ entry.timeMs | msToTime }}</td>
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
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="muted">No accepted runs yet in {{ category.categoryName }}.</p>
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

  readonly loading$ = this.store.select(selectLeaderboardLoading);
  readonly error$ = this.store.select(selectLeaderboardError);

  // Resolving the active category by lookup-with-fallback means a stale
  // selection from a previously viewed game simply lands on the new game's
  // first category, with no imperative resetting.
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
    // paramMap rather than snapshot: the router reuses this component when
    // navigating between two games, so the snapshot would go stale.
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const gameId = params.get('id');
      if (gameId) {
        this.store.dispatch(LeaderboardActions.load({ gameId }));
      }
    });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId$.next(categoryId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
