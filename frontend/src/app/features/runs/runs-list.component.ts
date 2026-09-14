import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  Subject,
  combineLatest,
  filter,
  fromEvent,
  merge,
  takeUntil,
} from 'rxjs';
import { RunRowComponent } from './run-row.component';
import { RunsPageActions } from '../../store/runs-page/runs-page.actions';
import {
  DEFAULT_RUNS_PAGE_SIZE,
  selectRunsPageCount,
  selectRunsPageError,
  selectRunsPageLimit,
  selectRunsPageLoading,
  selectRunsPagePage,
  selectRunsPageRuns,
  selectRunsPageTotal,
} from '../../store/runs-page/runs-page.feature';

@Component({
  selector: 'app-runs-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterLink, RunRowComponent],
  template: `
    <section class="page">
      <header>
        <h1>All runs</h1>
        <a class="btn" routerLink="/runs/new">+ Submit run</a>
      </header>

      <p class="muted hint">
        Every submitted run, including ones still awaiting review. Click a
        reviewed status to see who decided it and why.
      </p>

      @if (loading$ | async) {
        <p class="muted">Loading…</p>
      }

      @if (error$ | async; as error) {
        <p class="error">{{ error }}</p>
      }

      <table>
        <thead>
          <tr>
            <th>Game</th>
            <th>Category</th>
            <th>Runner</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @for (run of runs$ | async; track run.id) {
            <tr
              app-run-row
              [run]="run"
              [expanded]="openRunId === run.id"
              (toggle)="toggleDetails($event)"
            ></tr>
          } @empty {
            <tr>
              <td colspan="5" class="muted">No runs yet.</td>
            </tr>
          }
        </tbody>
      </table>

      @if (pager$ | async; as pager) {
        @if (pager.pageCount > 1) {
          <nav class="pager" aria-label="Runs pages">
            <button
              type="button"
              [disabled]="pager.loading || pager.page <= 1"
              (click)="goTo(pager.page - 1, pager.limit)"
            >
              Previous
            </button>
            <span class="muted">
              Page {{ pager.page }} of {{ pager.pageCount }} ·
              {{ pager.total }} runs
            </span>
            <button
              type="button"
              [disabled]="pager.loading || pager.page >= pager.pageCount"
              (click)="goTo(pager.page + 1, pager.limit)"
            >
              Next
            </button>
          </nav>
        }
      }
    </section>
  `,
  styleUrl: './runs-list.css',
})
export class RunsListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly runs$ = this.store.select(selectRunsPageRuns);
  readonly loading$ = this.store.select(selectRunsPageLoading);
  readonly error$ = this.store.select(selectRunsPageError);

  readonly pager$ = combineLatest({
    page: this.store.select(selectRunsPagePage),
    pageCount: this.store.select(selectRunsPageCount),
    limit: this.store.select(selectRunsPageLimit),
    total: this.store.select(selectRunsPageTotal),
    loading: this.loading$,
  });

  openRunId: string | null = null;

  ngOnInit(): void {
    this.goTo(1, DEFAULT_RUNS_PAGE_SIZE);

    merge(
      fromEvent(document, 'click'),
      fromEvent<KeyboardEvent>(document, 'keydown').pipe(
        filter((event) => event.key === 'Escape'),
      ),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openRunId = null;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goTo(page: number, limit: number): void {
    this.openRunId = null;
    this.store.dispatch(RunsPageActions.load({ page, limit }));
  }

  toggleDetails(runId: string): void {
    this.openRunId = this.openRunId === runId ? null : runId;
  }
}
