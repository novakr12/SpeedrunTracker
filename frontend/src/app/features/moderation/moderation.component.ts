import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectPendingRuns } from '../../store/runs/runs.feature';
import { UsersActions } from '../../store/users/users.actions';
import { selectBannedUsers } from '../../store/users/users.feature';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, MsToTimePipe],
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
                  Watch video
                </a>
              } @else {
                <span class="no-video">No video provided</span>
              }
            </div>

            <div class="review">
              <input
                type="text"
                placeholder="Comment / ban reason"
                [(ngModel)]="comments[run.id]"
              />
              <div class="buttons">
                <button class="accept" (click)="accept(run.id)">Accept</button>
                <button class="reject" (click)="reject(run.id)">Reject</button>
              </div>

              <div class="ban-row">
                <select
                  [ngModel]="banDuration[run.id] ?? '7'"
                  (ngModelChange)="banDuration[run.id] = $event"
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="permanent">Permanent</option>
                </select>
                <button
                  class="ban"
                  [disabled]="!run.userId"
                  (click)="rejectAndBan(run.id, run.userId)"
                >
                  Reject &amp; ban
                </button>
              </div>
            </div>
          </article>
        } @empty {
          <p class="muted">No runs waiting for verification.</p>
        }
      </div>

      <h2>Banned runners</h2>
      <div class="list">
        @for (user of banned$ | async; track user.id) {
          <article class="run banned-row">
            <div class="info">
              <h3>{{ user.username }}</h3>
              <p class="meta">
                @if (user.bannedUntil) {
                  Banned until {{ user.bannedUntil | date: 'mediumDate' }}
                } @else {
                  <span class="perm">Permanently banned</span>
                }
              </p>
              @if (user.banReason) {
                <p class="reason">“{{ user.banReason }}”</p>
              }
            </div>
            <div class="review">
              <button class="unban" (click)="unban(user.id)">Unban</button>
            </div>
          </article>
        } @empty {
          <p class="muted">No banned runners.</p>
        }
      </div>
    </section>
  `,
  styleUrl: './moderation.css',
})
export class ModerationComponent implements OnInit {
  private readonly store = inject(Store);

  readonly pending$ = this.store.select(selectPendingRuns);
  readonly banned$ = this.store.select(selectBannedUsers);

  comments: Record<string, string> = {};
  banDuration: Record<string, string> = {};

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
    this.store.dispatch(UsersActions.loadBanned());
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

  rejectAndBan(runId: string, userId: string): void {
    const reason = this.comments[runId];
    const choice = this.banDuration[runId] ?? '7';
    this.store.dispatch(
      RunsActions.review({ id: runId, status: 'rejected', comment: reason }),
    );
    this.store.dispatch(
      UsersActions.ban({
        id: userId,
        durationDays: choice === 'permanent' ? undefined : Number(choice),
        reason,
      }),
    );
  }

  unban(id: string): void {
    this.store.dispatch(UsersActions.unban({ id }));
  }
}
