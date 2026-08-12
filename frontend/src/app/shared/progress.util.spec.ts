import { describe, expect, it } from 'vitest';
import { buildProgressSeries } from './progress.util';
import { Category, Game } from '../core/models/game.model';
import { Run, RunStatus } from '../core/models/run.model';

function makeRun(overrides: Partial<Run> & { id: string }): Run {
  return {
    userId: 'user-1',
    gameId: 'game-1',
    categoryId: 'category-1',
    timeMs: 1000,
    status: 'accepted' as RunStatus,
    game: { id: 'game-1', title: 'Celeste' } as Game,
    category: { id: 'category-1', name: 'Any%' } as Category,
    ...overrides,
  };
}

describe('buildProgressSeries', () => {
  it('returns nothing when there are no accepted runs', () => {
    expect(buildProgressSeries([])).toEqual([]);
    expect(
      buildProgressSeries([makeRun({ id: 'a', status: 'pending' })]),
    ).toEqual([]);
  });

  it('orders points chronologically regardless of input order', () => {
    const series = buildProgressSeries([
      makeRun({ id: 'later', timeMs: 900, playedAt: '2026-03-01' }),
      makeRun({ id: 'earlier', timeMs: 1000, playedAt: '2026-01-01' }),
    ]);

    expect(series[0].points.map((point) => point.runId)).toEqual([
      'earlier',
      'later',
    ]);
  });

  it('marks a point as a record only when it beats every earlier run', () => {
    const series = buildProgressSeries([
      makeRun({ id: 'a', timeMs: 1000, playedAt: '2026-01-01' }),
      makeRun({ id: 'b', timeMs: 1200, playedAt: '2026-01-02' }),
      makeRun({ id: 'c', timeMs: 950, playedAt: '2026-01-03' }),
      makeRun({ id: 'd', timeMs: 960, playedAt: '2026-01-04' }),
    ]);

    expect(series[0].points.map((point) => point.isRecord)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  it('reports best, worst and total improvement', () => {
    const series = buildProgressSeries([
      makeRun({ id: 'a', timeMs: 5000, playedAt: '2026-01-01' }),
      makeRun({ id: 'b', timeMs: 3000, playedAt: '2026-01-02' }),
      makeRun({ id: 'c', timeMs: 8000, playedAt: '2026-01-03' }),
    ]);

    expect(series[0].bestMs).toBe(3000);
    expect(series[0].worstMs).toBe(8000);
    expect(series[0].improvementMs).toBe(2000);
  });

  it('splits runs into one series per category', () => {
    const series = buildProgressSeries([
      makeRun({ id: 'a', categoryId: 'c1', playedAt: '2026-01-01' }),
      makeRun({ id: 'b', categoryId: 'c1', playedAt: '2026-01-02' }),
      makeRun({ id: 'c', categoryId: 'c2', playedAt: '2026-01-03' }),
    ]);

    expect(series).toHaveLength(2);
    expect(series[0].points).toHaveLength(2);
    expect(series[1].points).toHaveLength(1);
  });

  it('excludes rejected and pending runs from the series', () => {
    const series = buildProgressSeries([
      makeRun({ id: 'a', timeMs: 1000, playedAt: '2026-01-01' }),
      makeRun({ id: 'b', timeMs: 1, status: 'rejected', playedAt: '2026-01-02' }),
      makeRun({ id: 'c', timeMs: 2, status: 'pending', playedAt: '2026-01-03' }),
    ]);

    expect(series[0].points).toHaveLength(1);
    expect(series[0].bestMs).toBe(1000);
  });

  it('falls back to the creation date when a run has no played date', () => {
    const series = buildProgressSeries([
      makeRun({ id: 'second', timeMs: 900, createdAt: '2026-02-01' }),
      makeRun({ id: 'first', timeMs: 1000, createdAt: '2026-01-01' }),
    ]);

    expect(series[0].points[0].runId).toBe('first');
  });
});
