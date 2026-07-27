import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { computeProfileStats } from '../../shared/profile-stats.util';
import { selectAuthUser } from '../../store/auth/auth.feature';
import { RunsActions } from '../../store/runs/runs.actions';
import { selectAllRuns } from '../../store/runs/runs.feature';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe, MsToTimePipe],
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
          }
        </ul>
      }
    </section>
  `,
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectAuthUser);
  readonly stats$ = combineLatest([
    this.store.select(selectAuthUser),
    this.store.select(selectAllRuns),
  ]).pipe(
    map(([user, runs]) =>
      computeProfileStats(
        runs.filter((run) => !!user && run.userId === user.id),
      ),
    ),
  );

  ngOnInit(): void {
    this.store.dispatch(RunsActions.load());
  }
}
