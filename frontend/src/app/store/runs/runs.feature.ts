import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Run } from '../../core/models/run.model';
import { RunsActions } from './runs.actions';

export const runsAdapter = createEntityAdapter<Run>({
  sortComparer: (a, b) => a.timeMs - b.timeMs,
});

export interface RunsState extends EntityState<Run> {
  loading: boolean;
  error: string | null;
}

const initialState: RunsState = runsAdapter.getInitialState({
  loading: false,
  error: null,
});

export const runsFeature = createFeature({
  name: 'runs',
  reducer: createReducer(
    initialState,
    on(RunsActions.load, (state) => ({ ...state, loading: true, error: null })),
    on(RunsActions.loadSuccess, (state, { runs }) =>
      runsAdapter.setAll(runs, { ...state, loading: false }),
    ),
    on(RunsActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(RunsActions.submitFailure, (state, { error }) => ({ ...state, error })),
    on(RunsActions.reviewSuccess, (state, { run }) =>
      runsAdapter.upsertOne(run, state),
    ),
    on(RunsActions.reviewFailure, (state, { error }) => ({ ...state, error })),
  ),
  extraSelectors: ({ selectRunsState }) => {
    const { selectAll, selectTotal } = runsAdapter.getSelectors(
      selectRunsState,
    );
    return {
      selectAllRuns: selectAll,
      selectRunsTotal: selectTotal,
      selectPendingRuns: createSelector(selectAll, (runs) =>
        runs.filter((run) => run.status === 'pending'),
      ),
    };
  },
});

export const {
  selectLoading: selectRunsLoading,
  selectError: selectRunsError,
  selectAllRuns,
  selectRunsTotal,
  selectPendingRuns,
} = runsFeature;
