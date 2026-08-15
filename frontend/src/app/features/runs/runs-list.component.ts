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
import { Subject, filter, fromEvent, merge, takeUntil } from 'rxjs';
import { RunRowComponent } from './run-row.component';
import { RunsActions } from '../../store/runs/runs.actions';
import {
  selectAllRuns,
  selectRunsLoading,
} from '../../store/runs/runs.feature';

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
    </section>
  `,
  styleUrl: './runs-list.css',
})
export class RunsListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly runs$ = this.store.select(selectAllRuns);
  readonly loading$ = this.store.select(selectRunsLoading);

  openRunId: string | null = null;

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());

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

  toggleDetails(runId: string): void {
    this.openRunId = this.openRunId === runId ? null : runId;
  }
}
