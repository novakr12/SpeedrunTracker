import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { BanAppeal } from '../../core/models/appeal.model';
import { AppealsActions } from './appeals.actions';

export const appealsAdapter = createEntityAdapter<BanAppeal>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

export interface AppealsState extends EntityState<BanAppeal> {
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: AppealsState = appealsAdapter.getInitialState({
  loading: false,
  submitting: false,
  error: null,
});

export const appealsFeature = createFeature({
  name: 'appeals',
  reducer: createReducer(
    initialState,
    on(AppealsActions.submit, (state) => ({
      ...state,
      submitting: true,
      error: null,
    })),
    on(AppealsActions.submitSuccess, (state) => ({
      ...state,
      submitting: false,
      error: null,
    })),
    on(AppealsActions.submitFailure, (state, { error }) => ({
      ...state,
      submitting: false,
      error,
    })),
    on(AppealsActions.load, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(AppealsActions.loadSuccess, (state, { appeals }) =>
      appealsAdapter.setAll(appeals, { ...state, loading: false }),
    ),
    on(AppealsActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(AppealsActions.resolveSuccess, (state, { appeal }) =>
      appealsAdapter.upsertOne(appeal, state),
    ),
    on(AppealsActions.resolveFailure, (state, { error }) => ({
      ...state,
      error,
    })),
  ),
  extraSelectors: ({ selectAppealsState }) => {
    const { selectAll } = appealsAdapter.getSelectors(selectAppealsState);
    return {
      selectAllAppeals: selectAll,
      selectOpenAppeals: createSelector(selectAll, (appeals) =>
        appeals.filter((appeal) => appeal.status === 'open'),
      ),
      selectResolvedAppeals: createSelector(selectAll, (appeals) =>
        appeals.filter((appeal) => appeal.status !== 'open'),
      ),
    };
  },
});

export const {
  selectLoading: selectAppealsLoading,
  selectSubmitting: selectAppealSubmitting,
  selectError: selectAppealsError,
  selectAllAppeals,
  selectOpenAppeals,
  selectResolvedAppeals,
} = appealsFeature;
