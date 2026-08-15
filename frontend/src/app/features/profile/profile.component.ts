import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { computeProfileStats } from '../../shared/profile-stats.util';
import { buildProgressSeries } from '../../shared/progress.util';
import { ProgressChartComponent } from './progress-chart.component';
import { selectAuthUser } from '../../store/auth/auth.feature';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectAllRuns } from '../../store/runs/runs.feature';
import { RecordsActions } from '../../store/records/records.actions';
import {
  selectPersonalBests,
  selectWorldRecords,
} from '../../store/records/records.feature';
import { GamesActions } from '../../store/games/games.actions';
import { selectFollowedGames } from '../../store/games/games.feature';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterLink, MsToTimePipe, ProgressChartComponent],
  template: `
    <section class="page">
      @if (user$ | async; as user) {
        <header class="profile-head">
          <div class="avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
          <div>
            <h1>{{ user.username }}</h1>
            <p class="email">{{ user.email }}</p>
            <span class="role" [class.admin]="user.role === 'admin'">
              {{ user.role }}
            </span>
          </div>
        </header>
      }

      @if (stats$ | async; as stats) {
        <div class="cards">
          <div class="card">
            <span class="value">{{ stats.totalRuns }}</span>
            <span class="label">Runs submitted</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.totalTimeMs | msToTime }}</span>
            <span class="label">Total time played</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.averageTimeMs | msToTime }}</span>
            <span class="label">Average run</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.verifiedRuns }}</span>
            <span class="label">Verified</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.distinctGames }}</span>
            <span class="label">Games played</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.distinctCategories }}</span>
            <span class="label">Categories</span>
          </div>
        </div>

        <h2>Fun facts</h2>
        <ul class="facts">
          @if (stats.mostRunGame) {
            <li>
              <span>Most-run game</span>
              <strong
                >{{ stats.mostRunGame.game }} ({{
                  stats.mostRunGame.count
                }})</strong
              >
            </li>
          }
          @if (stats.fastestRun) {
            <li>
              <span>Personal best</span>
              <strong>
                {{ stats.fastestRun.timeMs | msToTime }} —
                {{ stats.fastestRun.game }} / {{ stats.fastestRun.category }}
              </strong>
            </li>
          }
          @if (stats.totalRuns === 0) {
            <li class="muted">No runs yet — submit one from the Games page!</li>
          } @else if (stats.verifiedRuns === 0) {
            <li class="muted">
              Nothing verified yet — these appear once a run is approved.
            </li>
          }
        </ul>
      }

      @if (personalBests$ | async; as bests) {
        @if (bests.length) {
          <h2>
            Personal bests
            @if (worldRecordCount$ | async; as held) {
              <span class="wr-count">{{ held }} world record(s)</span>
            }
          </h2>
          <table class="records">
            <thead>
              <tr>
                <th>Game</th>
                <th>Category</th>
                <th>Best</th>
              </tr>
            </thead>
            <tbody>
              @for (best of bests; track best.categoryId) {
                <tr>
                  <td>
                    <a [routerLink]="['/games', best.gameId]">{{
                      best.gameTitle
                    }}</a>
                  </td>
                  <td>{{ best.categoryName }}</td>
                  <td class="time">
                    {{ best.timeMs | msToTime }}
                    @if (best.isWorldRecord) {
                      <span class="wr" title="World record">WR</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      }

      @if (progress$ | async; as series) {
        @if (series.length) {
          <h2>Progress</h2>
          <p class="muted">
            Each accepted run in order. Green points are the ones that beat
            everything before them.
          </p>
          @for (item of series; track item.categoryId) {
            <app-progress-chart [series]="item" />
          }
        }
      }

      @if (followedGames$ | async; as followed) {
        @if (followed.length) {
          <h2>Followed games</h2>
          <div class="followed">
            @for (game of followed; track game.id) {
              <a class="followed-game" [routerLink]="['/games', game.id]">{{
                game.title
              }}</a>
            }
          </div>
        }
      }
    </section>
  `,
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectAuthUser);
  readonly personalBests$ = this.store.select(selectPersonalBests);
  readonly worldRecordCount$ = this.store
    .select(selectWorldRecords)
    .pipe(map((records) => records.length));
  readonly followedGames$ = this.store.select(selectFollowedGames);

  private readonly ownRuns$ = combineLatest([
    this.store.select(selectAuthUser),
    this.store.select(selectAllRuns),
  ]).pipe(
    map(([user, runs]) =>
      runs.filter((run) => !!user && run.userId === user.id),
    ),
  );

  readonly stats$ = this.ownRuns$.pipe(map(computeProfileStats));
  readonly progress$ = this.ownRuns$.pipe(
    map((runs) =>
      buildProgressSeries(runs).filter((series) => series.points.length > 1),
    ),
  );

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
    this.store.dispatch(RecordsActions.load());
    this.store.dispatch(GamesActions.load());
    this.store.dispatch(GamesActions.loadFollowed());
  }
}
