import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { map, zip } from 'rxjs';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { computeDashboardStats } from '../../shared/stats.util';
import { GamesService } from '../../core/services/games.service';
import { RunsService } from '../../core/services/runs.service';
import { StatsService, ServerSummary } from '../../core/services/stats.service';
import { selectAuthUser } from '../../store/auth/auth.feature';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, MsToTimePipe],
  template: `
    <section class="page">
      <h1>Welcome, {{ (user$ | async)?.username }}</h1>

      @if (stats$ | async; as stats) {
        <div class="cards">
          <div class="card">
            <span class="value">{{ stats.totalGames }}</span>
            <span class="label">Games</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.totalRuns }}</span>
            <span class="label">Runs</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.verifiedRuns }}</span>
            <span class="label">Verified</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.totalTimeMs | msToTime }}</span>
            <span class="label">Total time</span>
          </div>
          <div class="card">
            <span class="value">{{ stats.averageTimeMs | msToTime }}</span>
            <span class="label">Average</span>
          </div>
        </div>

        <h2>Top games by runs</h2>
        <ul class="ranking">
          @for (row of stats.runsPerGame; track row.game) {
            <li>
              <span>{{ row.game }}</span>
              <span class="count">{{ row.count }}</span>
            </li>
          } @empty {
            <li class="muted">No runs recorded yet.</li>
          }
        </ul>
      } @else {
        <p class="muted">Loading stats…</p>
      }

      @if (summary) {
        <p class="summary">
          Live totals (fetch): {{ summary.games }} games · {{ summary.runs }} runs
        </p>
      }
    </section>
  `,
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly gamesService = inject(GamesService);
  private readonly runsService = inject(RunsService);
  private readonly statsService = inject(StatsService);

  readonly user$ = this.store.select(selectAuthUser);

  readonly stats$ = zip(
    this.gamesService.getAll(),
    this.runsService.getAll(),
  ).pipe(map(([games, runs]) => computeDashboardStats(games, runs)));

  summary: ServerSummary | null = null;

  ngOnInit(): void {
    this.statsService
      .loadSummary()
      .then((summary) => (this.summary = summary))
      .catch(() => (this.summary = null));
  }
}
