import { describe, expect, it } from 'vitest';
import { computeDashboardStats } from './stats.util';
import { Game } from '../core/models/game.model';
import { Run, RunStatus } from '../core/models/run.model';

function makeRun(
  id: string,
  timeMs: number,
  status: RunStatus,
  gameTitle?: string,
): Run {
  return {
    id,
    userId: 'user-1',
    gameId: 'game-1',
    categoryId: 'category-1',
    timeMs,
    status,
    game: gameTitle ? ({ id: 'game-1', title: gameTitle } as Game) : undefined,
  };
}

const games = [{ id: 'game-1', title: 'Celeste' } as Game];

describe('computeDashboardStats', () => {
  it('returns zeroes for empty input', () => {
    expect(computeDashboardStats([], [])).toEqual({
      totalGames: 0,
      totalRuns: 0,
      verifiedRuns: 0,
      totalTimeMs: 0,
      averageTimeMs: 0,
      runsPerGame: [],
    });
  });

  it('counts pending runs as submitted but not as verified', () => {
    const runs = [
      makeRun('a', 1000, 'accepted', 'Celeste'),
      makeRun('b', 2000, 'pending', 'Celeste'),
    ];

    const stats = computeDashboardStats(games, runs);

    expect(stats.totalRuns).toBe(2);
    expect(stats.verifiedRuns).toBe(1);
  });

  it('excludes rejected runs from every total', () => {
    const runs = [
      makeRun('a', 1000, 'accepted', 'Celeste'),
      makeRun('b', 9000, 'rejected', 'Celeste'),
    ];

    const stats = computeDashboardStats(games, runs);

    expect(stats.totalRuns).toBe(1);
    expect(stats.verifiedRuns).toBe(1);
    expect(stats.totalTimeMs).toBe(1000);
  });

  it('averages only accepted run times and rounds the result', () => {
    const runs = [
      makeRun('a', 1000, 'accepted', 'Celeste'),
      makeRun('b', 2000, 'accepted', 'Celeste'),
      makeRun('c', 2000, 'accepted', 'Celeste'),
    ];

    const stats = computeDashboardStats(games, runs);

    expect(stats.totalTimeMs).toBe(5000);
    expect(stats.averageTimeMs).toBe(1667);
  });

  it('avoids dividing by zero when nothing is accepted', () => {
    const stats = computeDashboardStats(games, [
      makeRun('a', 1000, 'pending', 'Celeste'),
    ]);

    expect(stats.averageTimeMs).toBe(0);
  });

  it('ranks games by accepted run count and keeps the top five', () => {
    const runs: Run[] = [];
    const titles = ['A', 'B', 'C', 'D', 'E', 'F'];
    titles.forEach((title, index) => {
      for (let i = 0; i <= index; i++) {
        runs.push(makeRun(`${title}-${i}`, 1000, 'accepted', title));
      }
    });

    const stats = computeDashboardStats(games, runs);

    expect(stats.runsPerGame).toHaveLength(5);
    expect(stats.runsPerGame[0]).toEqual({ game: 'F', count: 6 });
    expect(stats.runsPerGame.map((entry) => entry.game)).not.toContain('A');
  });

  it('labels runs without a loaded game relation as Unknown', () => {
    const stats = computeDashboardStats(games, [
      makeRun('a', 1000, 'accepted'),
    ]);

    expect(stats.runsPerGame).toEqual([{ game: 'Unknown', count: 1 }]);
  });
});
