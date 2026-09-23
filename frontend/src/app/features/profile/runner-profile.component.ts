import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { RunsService } from '../../core/services/runs.service';
import { RunnerProfile } from '../../core/models/leaderboard.model';

@Component({
  selector: 'app-runner-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DatePipe, RouterLink, MsToTimePipe],
  template: `
    <section class="page">
      @if (state$ | async; as state) {
        @if (state.runner; as runner) {
          <header class="profile-head">
            <div class="avatar">
              {{ runner.username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h1>{{ runner.username }}</h1>
              <p class="email">
                Runner since {{ runner.memberSince | date: 'mediumDate' }}
              </p>
            </div>
          </header>

          <div class="cards">
            <div class="card">
              <span class="value">{{ runner.totalRuns }}</span>
              <span class="label">Verified runs</span>
            </div>
            <div class="card">
              <span class="value">{{ runner.personalBests.length }}</span>
              <span class="label">Categories</span>
            </div>
            <div class="card">
              <span class="value">{{ worldRecords(runner) }}</span>
              <span class="label">World records</span>
            </div>
          </div>

          <h2>Personal bests</h2>
          @if (runner.personalBests.length) {
            <table class="records">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Category</th>
                  <th>Best</th>
                  <th>Played</th>
                </tr>
              </thead>
              <tbody>
                @for (best of runner.personalBests; track best.categoryId) {
                  <tr>
                    <td>
                      <a [routerLink]="['/games', best.gameId]">{{
                        best.gameTitle
                      }}</a>
                    </td>
                    <td>{{ best.categoryName }}</td>
                    <td class="time">
                      {{ best.timeMs | msToTime: 'milliseconds' }}
                      @if (best.isWorldRecord) {
                        <span class="wr" title="World record">WR</span>
                      }
                    </td>
                    <td>
                      @if (best.playedAt) {
                        {{ best.playedAt | date: 'mediumDate' }}
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="muted">No verified runs yet.</p>
          }
        } @else {
          <p class="muted">{{ state.error }}</p>
        }
      } @else {
        <p class="muted">Loading runner…</p>
      }
    </section>
  `,
  styleUrl: './profile.css',
})
export class RunnerProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly runsService = inject(RunsService);

  readonly state$ = this.route.paramMap.pipe(
    switchMap((params) =>
      this.runsService.getRunnerProfile(params.get('id') ?? '').pipe(
        map((runner) => ({ runner, error: '' })),
        catchError(() =>
          of({ runner: null, error: 'This runner could not be found.' }),
        ),
      ),
    ),
  );

  worldRecords(runner: RunnerProfile): number {
    return runner.personalBests.filter((best) => best.isWorldRecord).length;
  }
}
