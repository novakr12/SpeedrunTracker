import { describe, expect, it } from 'vitest';
import { computeProfileStats } from './profile-stats.util';
import { Game } from '../core/models/game.model';
import { Run, RunStatus } from '../core/models/run.model';

function makeRun(overrides: Partial<Run> & { id: string }): Run {
  return {
    userId: 'user-1',
    gameId: 'game-1',
    categoryId: 'category-1',
    timeMs: 1000,
    status: 'accepted' as RunStatus,
    ...overrides,
  };
}

describe('computeProfileStats', () => {
  it('returns an empty profile when there are no runs', () => {
    expect(computeProfileStats([])).toEqual({
      totalRuns: 0,
      totalTimeMs: 0,
      averageTimeMs: 0,
      verifiedRuns: 0,
      distinctGames: 0,
      distinctCategories: 0,
      mostRunGame: null,
    });
  });

  it('counts distinct games and categories across accepted runs only', () => {
    const runs = [
      makeRun({ id: 'a', gameId: 'g1', categoryId: 'c1' }),
      makeRun({ id: 'b', gameId: 'g1', categoryId: 'c2' }),
      makeRun({ id: 'c', gameId: 'g2', categoryId: 'c1' }),
      makeRun({ id: 'd', gameId: 'g3', categoryId: 'c9', status: 'rejected' }),
    ];

    const stats = computeProfileStats(runs);

    expect(stats.distinctGames).toBe(2);
    expect(stats.distinctCategories).toBe(2);
  });

  it('reports the most played game', () => {
    const stats = computeProfileStats([
      makeRun({ id: 'a', game: { id: 'g1', title: 'Celeste' } as Game }),
      makeRun({ id: 'b', game: { id: 'g1', title: 'Celeste' } as Game }),
      makeRun({ id: 'c', game: { id: 'g2', title: 'Hades' } as Game }),
    ]);

    expect(stats.mostRunGame).toEqual({ game: 'Celeste', count: 2 });
  });

  it('separates submitted runs from verified ones', () => {
    const stats = computeProfileStats([
      makeRun({ id: 'a', status: 'accepted' }),
      makeRun({ id: 'b', status: 'pending' }),
      makeRun({ id: 'c', status: 'rejected' }),
    ]);

    expect(stats.totalRuns).toBe(2);
    expect(stats.verifiedRuns).toBe(1);
  });
});
