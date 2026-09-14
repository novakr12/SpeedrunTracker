import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RUNS_PAGE_SIZE,
  runsPageFeature,
  selectRunsPageCount,
} from './runs-page.feature';
import { RunsPageActions } from './runs-page.actions';
import { Run } from '../../core/models/run.model';

const { reducer, name } = runsPageFeature;

function makeRun(id: string): Run {
  return {
    id,
    userId: 'user-1',
    gameId: 'game-1',
    categoryId: 'category-1',
    timeMs: 1000,
    status: 'accepted',
  };
}

describe('runs page reducer', () => {
  it('starts on the first page with the default size', () => {
    const state = reducer(undefined, { type: '@@init' });

    expect(state.page).toBe(1);
    expect(state.limit).toBe(DEFAULT_RUNS_PAGE_SIZE);
    expect(state.runs).toEqual([]);
  });

  it('remembers the requested page and clears a previous error', () => {
    const failed = reducer(
      undefined,
      RunsPageActions.loadFailure({ error: 'Request failed' }),
    );

    const state = reducer(failed, RunsPageActions.load({ page: 3, limit: 10 }));

    expect(state.page).toBe(3);
    expect(state.limit).toBe(10);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('replaces the runs with the loaded page', () => {
    const first = reducer(
      undefined,
      RunsPageActions.loadSuccess({
        result: { items: [makeRun('a')], total: 2, page: 1, limit: 1 },
      }),
    );

    const state = reducer(
      first,
      RunsPageActions.loadSuccess({
        result: { items: [makeRun('b')], total: 2, page: 2, limit: 1 },
      }),
    );

    expect(state.runs.map((run) => run.id)).toEqual(['b']);
    expect(state.page).toBe(2);
    expect(state.loading).toBe(false);
  });

  it('keeps the shown runs when a page fails to load', () => {
    const loaded = reducer(
      undefined,
      RunsPageActions.loadSuccess({
        result: { items: [makeRun('a')], total: 1, page: 1, limit: 20 },
      }),
    );

    const state = reducer(
      loaded,
      RunsPageActions.loadFailure({ error: 'Request failed' }),
    );

    expect(state.runs).toHaveLength(1);
    expect(state.error).toBe('Request failed');
  });
});

describe('runs page selectors', () => {
  function countFor(total: number, limit: number) {
    return selectRunsPageCount({
      [name]: reducer(
        undefined,
        RunsPageActions.loadSuccess({
          result: { items: [], total, page: 1, limit },
        }),
      ),
    });
  }

  it('rounds a partial last page up', () => {
    expect(countFor(41, 20)).toBe(3);
  });

  it('counts an exact fit without an extra page', () => {
    expect(countFor(40, 20)).toBe(2);
  });

  it('reports a single page when there are no runs', () => {
    expect(countFor(0, 20)).toBe(1);
  });
});
