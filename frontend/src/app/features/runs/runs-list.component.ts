import { Component, HostListener, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
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
  imports: [AsyncPipe, DatePipe, RouterLink, MsToTimePipe],
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
            <tr>
              <td>{{ run.game?.title || '—' }}</td>
              <td>{{ run.category?.name || '—' }}</td>
              <td>{{ run.user?.username || '—' }}</td>
              <td class="time">{{ run.timeMs | msToTime }}</td>
              <td class="status-cell">
                @if (run.status === 'pending') {
                  <span class="status-badge pending">Pending</span>
                } @else {
                  <button
                    type="button"
                    class="status-badge"
                    [class.accepted]="run.status === 'accepted'"
                    [class.rejected]="run.status === 'rejected'"
                    [attr.aria-expanded]="openRunId === run.id"
                    (click)="toggleDetails(run.id, $event)"
                  >
                    {{ statusLabel(run.status) }}
                  </button>

                  @if (openRunId === run.id) {
                    <div
                      class="review-popover"
                      (click)="$event.stopPropagation()"
                    >
                      <p class="label">{{ statusLabel(run.status) }} by</p>
                      <p class="value">
                        {{ run.reviewedBy?.username || 'Unknown moderator' }}
                      </p>

                      @if (run.reviewedAt) {
                        <p class="label">When</p>
                        <p class="value">
                          {{ run.reviewedAt | date: 'medium' }}
                        </p>
                      }

                      @if (run.reviewComment) {
                        <p class="label">Comment</p>
                        <p class="value quote">{{ run.reviewComment }}</p>
                      }
                    </div>
                  }
                }
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

  openRunId: string | null = null;

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
  }

  toggleDetails(runId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openRunId = this.openRunId === runId ? null : runId;
  }

  @HostListener('document:click')
  closeDetails(): void {
    this.openRunId = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openRunId = null;
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
