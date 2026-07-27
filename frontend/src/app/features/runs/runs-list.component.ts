import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { RunsActions } from '../../store/runs/runs.actions';
import {
  selectAllRuns,
  selectRunsLoading,
} from '../../store/runs/runs.feature';

@Component({
  selector: 'app-runs-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink, MsToTimePipe],
  template: `
    <section class="page">
      <header>
        <h1>All runs</h1>
        <a class="btn" routerLink="/runs/new">+ Submit run</a>
      </header>

      <p class="muted hint">
        Every submitted run, including ones still awaiting review. For ranked
        leaderboards, open a game from the Games page.
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
            <tr>
              <td>{{ run.game?.title || '—' }}</td>
              <td>{{ run.category?.name || '—' }}</td>
              <td>{{ run.user?.username || '—' }}</td>
              <td class="time">{{ run.timeMs | msToTime }}</td>
              <td [title]="run.reviewComment || ''">
                {{ statusLabel(run.status) }}
              </td>
            </tr>
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
export class RunsListComponent implements OnInit {
  private readonly store = inject(Store);

  readonly runs$ = this.store.select(selectAllRuns);
  readonly loading$ = this.store.select(selectRunsLoading);

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
  }

  statusLabel(status: string): string {
    if (status === 'accepted') {
      return 'Accepted';
    }
    if (status === 'rejected') {
      return 'Rejected';
    }
    return 'Pending';
  }
}
