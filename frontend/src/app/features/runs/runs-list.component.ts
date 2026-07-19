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
        <h1>Leaderboard</h1>
        <a class="btn" routerLink="/runs/new">+ Submit run</a>
      </header>

      @if (loading$ | async) {
        <p class="muted">Loading…</p>
      }

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Game</th>
            <th>Category</th>
            <th>Runner</th>
            <th>Time</th>
            <th>Verified</th>
          </tr>
        </thead>
        <tbody>
          @for (run of runs$ | async; track run.id; let i = $index) {
            <tr>
              <td>{{ i + 1 }}</td>
              <td>{{ run.game?.title || '—' }}</td>
              <td>{{ run.category?.name || '—' }}</td>
              <td>{{ run.user?.username || '—' }}</td>
              <td class="time">{{ run.timeMs | msToTime }}</td>
              <td>{{ run.verified ? '✅' : '⏳' }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="muted">No runs yet.</td>
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
}
