import { describe, expect, it } from 'vitest';
import {
  runsFeature,
  selectAllRuns,
  selectPendingRuns,
  selectRunsError,
  selectRunsLoading,
} from './runs.feature';
import { RunsActions } from './runs.actions';
import { Run, RunStatus } from '../../core/models/run.model';

const { reducer, name } = runsFeature;

function makeRun(id: string, timeMs: number, status: RunStatus = 'accepted'): Run {
  return {
    id,
    userId: 'user-1',
    gameId: 'game-1',
    categoryId: 'category-1',
    timeMs,
    status,
  };
}

function stateWith(runs: Run[]) {
  return reducer(undefined, RunsActions.loadSuccess({ runs }));
}

describe('runs reducer', () => {
  it('starts empty and idle', () => {
    const state = reducer(undefined, { type: '@@init' });

    expect(state.ids).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('flags loading and clears a previous error on load', () => {
    const failed = reducer(
      undefined,
      RunsActions.loadFailure({ error: 'Network down' }),
    );

    const state = reducer(failed, RunsActions.load());

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('stores runs sorted by time and stops loading on success', () => {
    const state = stateWith([
      makeRun('slow', 9000),
      makeRun('fast', 1000),
      makeRun('mid', 5000),
    ]);

    expect(state.ids).toEqual(['fast', 'mid', 'slow']);
    expect(state.loading).toBe(false);
  });

  it('replaces the previous runs instead of appending them', () => {
    const first = stateWith([makeRun('a', 1000)]);
    const second = reducer(
      first,
      RunsActions.loadSuccess({ runs: [makeRun('b', 2000)] }),
    );

    expect(second.ids).toEqual(['b']);
  });

  it('keeps the error and stops loading on failure', () => {
    const loading = reducer(undefined, RunsActions.load());
    const state = reducer(
      loading,
      RunsActions.loadFailure({ error: 'Request failed' }),
    );

    expect(state.loading).toBe(false);
    expect(state.error).toBe('Request failed');
  });

  it('records a submit failure without touching the loaded runs', () => {
    const loaded = stateWith([makeRun('a', 1000)]);
    const state = reducer(
      loaded,
      RunsActions.submitFailure({ error: 'Invalid time' }),
    );

    expect(state.error).toBe('Invalid time');
    expect(state.ids).toEqual(['a']);
  });

  it('upserts the reviewed run and re-sorts it', () => {
    const loaded = stateWith([makeRun('a', 1000), makeRun('b', 5000)]);
    const state = reducer(
      loaded,
      RunsActions.reviewSuccess({
        run: { ...makeRun('b', 500), status: 'accepted' },
      }),
    );

    expect(state.ids).toEqual(['b', 'a']);
    expect(state.entities['b']?.timeMs).toBe(500);
  });
});

describe('runs selectors', () => {
  it('exposes the sorted runs', () => {
    const state = { [name]: stateWith([makeRun('slow', 9000), makeRun('fast', 1000)]) };

    expect(selectAllRuns(state).map((run) => run.id)).toEqual(['fast', 'slow']);
  });

  it('narrows to pending runs only', () => {
    const state = {
      [name]: stateWith([
        makeRun('a', 1000, 'accepted'),
        makeRun('b', 2000, 'pending'),
        makeRun('c', 3000, 'rejected'),
      ]),
    };

    expect(selectPendingRuns(state).map((run) => run.id)).toEqual(['b']);
  });

  it('exposes loading and error state', () => {
    const state = {
      [name]: reducer(
        undefined,
        RunsActions.loadFailure({ error: 'Request failed' }),
      ),
    };

    expect(selectRunsLoading(state)).toBe(false);
    expect(selectRunsError(state)).toBe('Request failed');
  });
});
