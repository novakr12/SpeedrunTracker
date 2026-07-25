import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectPendingRuns } from '../../store/runs/runs.feature';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [AsyncPipe, FormsModule, MsToTimePipe],
  template: `
    <section class="page">
      <h1>Run verification queue</h1>

      <div class="list">
        @for (run of pending$ | async; track run.id) {
          <article class="run">
            <div class="info">
              <h3>{{ run.game?.title }} — {{ run.category?.name }}</h3>
              <p class="meta">
                by <strong>{{ run.user?.username }}</strong> ·
                <span class="time">{{ run.timeMs | msToTime }}</span>
              </p>
              @if (run.videoUrl) {
                <a class="video" [href]="run.videoUrl" target="_blank" rel="noopener">
                  ▶ Watch video
                </a>
              } @else {
                <span class="no-video">No video provided</span>
              }
            </div>

            <div class="review">
              <input
                type="text"
                placeholder="Comment (optional)"
                [(ngModel)]="comments[run.id]"
              />
              <div class="buttons">
                <button class="accept" (click)="accept(run.id)">Accept</button>
                <button class="reject" (click)="reject(run.id)">Reject</button>
              </div>
            </div>
          </article>
        } @empty {
          <p class="muted">🎉 No runs waiting for verification.</p>
        }
      </div>
    </section>
  `,
  styleUrl: './moderation.css',
})
export class ModerationComponent implements OnInit {
  private readonly store = inject(Store);

  readonly pending$ = this.store.select(selectPendingRuns);
  comments: Record<string, string> = {};

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
  }

  accept(id: string): void {
    this.store.dispatch(
      RunsActions.review({ id, status: 'accepted', comment: this.comments[id] }),
    );
  }

  reject(id: string): void {
    this.store.dispatch(
      RunsActions.review({ id, status: 'rejected', comment: this.comments[id] }),
    );
  }
}
