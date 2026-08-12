import { describe, expect, it } from 'vitest';
import { computeProfileStats } from './profile-stats.util';
import { Category, Game } from '../core/models/game.model';
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

function withGame(id: string, title: string, timeMs: number): Run {
  return makeRun({
    id,
    gameId: id,
    timeMs,
    game: { id, title } as Game,
    category: { id: 'category-1', name: 'Any%' } as Category,
  });
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
      fastestRun: null,
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

  it('picks the fastest accepted run', () => {
    const stats = computeProfileStats([
      withGame('g1', 'Celeste', 5000),
      withGame('g2', 'Hades', 2000),
      withGame('g3', 'Hollow Knight', 8000),
    ]);

    expect(stats.fastestRun).toEqual({
      game: 'Hades',
      category: 'Any%',
      timeMs: 2000,
    });
  });

  it('ignores rejected runs when picking the fastest', () => {
    const rejected = makeRun({
      id: 'fast',
      timeMs: 10,
      status: 'rejected',
      game: { id: 'g9', title: 'Rejected Game' } as Game,
      category: { id: 'c1', name: 'Any%' } as Category,
    });

    const stats = computeProfileStats([rejected, withGame('g1', 'Celeste', 5000)]);

    expect(stats.fastestRun?.game).toBe('Celeste');
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
