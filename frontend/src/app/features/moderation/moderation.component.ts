import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { banStateOf } from '../../shared/ban-state.util';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectAllRuns, selectPendingRuns } from '../../store/runs/runs.feature';
import { UsersActions } from '../../store/users/users.actions';
import { selectBannedUsers } from '../../store/users/users.feature';
import { AppealsActions } from '../../store/appeals/appeals.actions';
import {
  selectOpenAppeals,
  selectResolvedAppeals,
} from '../../store/appeals/appeals.feature';

type ModerationTab = 'runs' | 'appeals' | 'banned';

@Component({
  selector: 'app-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DatePipe, FormsModule, MsToTimePipe],
  template: `
    <section class="page">
      <h1>Moderation</h1>

      @if (counts$ | async; as counts) {
        <nav class="tabs">
          <button
            type="button"
            class="tab"
            [class.active]="activeTab === 'runs'"
            (click)="activeTab = 'runs'"
          >
            Run verification
            @if (counts.runs) {
              <span class="tab-count">{{ counts.runs }}</span>
            }
          </button>
          <button
            type="button"
            class="tab"
            [class.active]="activeTab === 'appeals'"
            (click)="activeTab = 'appeals'"
          >
            Ban appeals
            @if (counts.appeals) {
              <span class="tab-count">{{ counts.appeals }}</span>
            }
          </button>
          <button
            type="button"
            class="tab"
            [class.active]="activeTab === 'banned'"
            (click)="activeTab = 'banned'"
          >
            Banned runners
            @if (counts.banned) {
              <span class="tab-count">{{ counts.banned }}</span>
            }
          </button>
        </nav>
      }

      @switch (activeTab) {
        @case ('runs') {
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
                    <a
                      class="video"
                      [href]="run.videoUrl"
                      target="_blank"
                      rel="noopener"
                    >
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
                    <button class="accept" (click)="accept(run.id)">
                      Accept
                    </button>
                    <button class="reject" (click)="reject(run.id)">
                      Reject
                    </button>
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
        }

        @case ('appeals') {
          <div class="list">
            @for (row of openAppeals$ | async; track row.appeal.id) {
              <article class="run appeal-row">
                <div class="info">
                  <h3>{{ row.appeal.user?.username || 'Unknown user' }}</h3>
                  <p class="meta">{{ row.appeal.user?.email }}</p>

                  <dl class="ban-facts">
                    <dt>Ban status</dt>
                    <dd
                      [class.state-active]="row.banState === 'active'"
                      [class.state-stale]="row.banState !== 'active'"
                    >
                      @switch (row.banState) {
                        @case ('active') {
                          Still in force
                        }
                        @case ('expired') {
                          Already expired on its own
                        }
                        @case ('lifted') {
                          No longer in force — appeal refers to an older ban
                        }
                      }
                    </dd>

                    <dt>Ban reason</dt>
                    <dd>
                      {{ row.appeal.user?.banReason || 'No reason was recorded' }}
                    </dd>

                    <dt>Duration</dt>
                    <dd>
                      @if (row.appeal.user?.bannedUntil; as bannedUntil) {
                        Until {{ bannedUntil | date: 'medium' }}
                      } @else {
                        Permanent
                      }
                    </dd>

                    <dt>Banned on</dt>
                    <dd>{{ row.appeal.banIssuedAt | date: 'medium' }}</dd>

                    <dt>Triggered by</dt>
                    <dd>
                      @if (row.banRun; as run) {
                        {{ run.game?.title || 'Unknown game' }} /
                        {{ run.category?.name || 'Unknown category' }} —
                        {{ run.timeMs | msToTime }}
                        <span class="run-flag">{{ run.status }}</span>
                        @if (run.videoUrl) {
                          <a
                            class="run-video"
                            [href]="run.videoUrl"
                            target="_blank"
                            rel="noopener"
                            >video</a
                          >
                        }
                      } @else if (row.banRunId) {
                        Run has since been deleted
                      } @else {
                        Not recorded — ban was issued without a linked run
                      }
                    </dd>

                    <dt>Rejected runs</dt>
                    <dd>{{ row.rejectedRuns }}</dd>
                  </dl>

                  <p class="label">
                    Their appeal · {{ row.appeal.createdAt | date: 'medium' }}
                  </p>
                  <p class="reason">{{ row.appeal.message }}</p>
                </div>
                <div class="review">
                  <input
                    type="text"
                    placeholder="Reply to the appeal"
                    [(ngModel)]="appealComments[row.appeal.id]"
                  />
                  <div class="buttons">
                    <button
                      class="accept"
                      (click)="resolveAppeal(row.appeal.id, 'accepted')"
                    >
                      Accept
                    </button>
                    <button
                      class="reject"
                      (click)="resolveAppeal(row.appeal.id, 'rejected')"
                    >
                      Reject
                    </button>
                  </div>
                  <p class="hint">
                    Accepting records the decision. Lift the ban from the Banned
                    runners tab.
                  </p>
                </div>
              </article>
            } @empty {
              <p class="muted">No open appeals.</p>
            }
          </div>

          @if ((resolvedAppeals$ | async)?.length) {
            <h2>Resolved appeals</h2>
            <div class="list">
              @for (appeal of resolvedAppeals$ | async; track appeal.id) {
                <article class="run appeal-row resolved">
                  <div class="info">
                    <h3>{{ appeal.user?.username || 'Unknown user' }}</h3>
                    <p class="meta">
                      <span
                        class="appeal-verdict"
                        [class.accepted]="appeal.status === 'accepted'"
                        [class.rejected]="appeal.status === 'rejected'"
                        >{{ appeal.status }}</span
                      >
                      · {{ appeal.resolvedAt | date: 'mediumDate' }}
                    </p>
                    <p class="reason">{{ appeal.message }}</p>
                    @if (appeal.adminComment) {
                      <p class="meta">Reply: {{ appeal.adminComment }}</p>
                    }
                  </div>
                </article>
              }
            </div>
          }
        }

        @case ('banned') {
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
        }
      }
    </section>
  `,
  styleUrl: './moderation.css',
})
export class ModerationComponent implements OnInit {
  private readonly store = inject(Store);

  activeTab: ModerationTab = 'runs';

  readonly pending$ = this.store.select(selectPendingRuns);
  readonly banned$ = this.store.select(selectBannedUsers);
  readonly resolvedAppeals$ = this.store.select(selectResolvedAppeals);

  readonly openAppeals$ = combineLatest([
    this.store.select(selectOpenAppeals),
    this.store.select(selectAllRuns),
  ]).pipe(
    map(([appeals, runs]) =>
      appeals.map((appeal) => {
        const banRunId = appeal.user?.banRunId ?? null;
        return {
          appeal,
          banState: banStateOf(appeal),
          rejectedRuns: runs.filter(
            (run) => run.userId === appeal.userId && run.status === 'rejected',
          ).length,
          banRunId,
          banRun: banRunId
            ? (runs.find((run) => run.id === banRunId) ?? null)
            : null,
        };
      }),
    ),
  );

  readonly counts$ = combineLatest([
    this.pending$,
    this.store.select(selectOpenAppeals),
    this.banned$,
  ]).pipe(
    map(([pending, appeals, banned]) => ({
      runs: pending.length,
      appeals: appeals.length,
      banned: banned.length,
    })),
  );

  comments: Record<string, string> = {};
  banDuration: Record<string, string | undefined> = {};
  appealComments: Record<string, string> = {};

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
    this.store.dispatch(UsersActions.loadBanned());
    this.store.dispatch(AppealsActions.load());
  }

  resolveAppeal(id: string, status: 'accepted' | 'rejected'): void {
    this.store.dispatch(
      AppealsActions.resolve({
        id,
        dto: { status, comment: this.appealComments[id] },
      }),
    );
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
        runId,
      }),
    );
  }

  unban(id: string): void {
    this.store.dispatch(UsersActions.unban({ id }));
  }
}
