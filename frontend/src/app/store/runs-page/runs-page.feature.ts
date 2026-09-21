import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { Run } from '../../core/models/run.model';
import { RunsPageActions } from './runs-page.actions';
import { AuthActions } from '../auth/auth.actions';
export const DEFAULT_RUNS_PAGE_SIZE = 20;

export interface RunsPageState {
  runs: Run[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: RunsPageState = {
  runs: [],
  total: 0,
  page: 1,
  limit: DEFAULT_RUNS_PAGE_SIZE,
  loading: false,
  error: null,
};

export const runsPageFeature = createFeature({
  name: 'runsPage',
  reducer: createReducer(
    initialState,
    on(RunsPageActions.load, (state, { page, limit }) => ({
      ...state,
      page,
      limit,
      loading: true,
      error: null,
    })),
    on(RunsPageActions.loadSuccess, (state, { result }) => ({
      ...state,
      runs: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      loading: false,
    })),
    on(RunsPageActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(AuthActions.logout, AuthActions.loginSuccess, () => initialState),
  ),
  extraSelectors: ({ selectTotal, selectLimit }) => ({
    selectPageCount: createSelector(selectTotal, selectLimit, (total, limit) =>
      Math.max(1, Math.ceil(total / limit)),
    ),
  }),
});

export const {
  selectRuns: selectRunsPageRuns,
  selectTotal: selectRunsPageTotal,
  selectPage: selectRunsPagePage,
  selectLimit: selectRunsPageLimit,
  selectLoading: selectRunsPageLoading,
  selectError: selectRunsPageError,
  selectPageCount: selectRunsPageCount,
} = runsPageFeature;
