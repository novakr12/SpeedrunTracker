import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { PersonalBest } from '../../core/models/leaderboard.model';
import { RecordsActions } from './records.actions';

export const personalBestsAdapter = createEntityAdapter<PersonalBest>({
  selectId: (best) => best.categoryId,
  sortComparer: (a, b) =>
    a.gameTitle.localeCompare(b.gameTitle) ||
    a.categoryName.localeCompare(b.categoryName),
});

export interface RecordsState extends EntityState<PersonalBest> {
  loading: boolean;
  error: string | null;
}

const initialState: RecordsState = personalBestsAdapter.getInitialState({
  loading: false,
  error: null,
});

export const recordsFeature = createFeature({
  name: 'records',
  reducer: createReducer(
    initialState,
    on(RecordsActions.load, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(RecordsActions.loadSuccess, (state, { personalBests }) =>
      personalBestsAdapter.setAll(personalBests, { ...state, loading: false }),
    ),
    on(RecordsActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
  ),
  extraSelectors: ({ selectRecordsState }) => {
    const { selectAll } = personalBestsAdapter.getSelectors(selectRecordsState);
    return {
      selectPersonalBests: selectAll,
      selectWorldRecords: createSelector(selectAll, (bests) =>
        bests.filter((best) => best.isWorldRecord),
      ),
    };
  },
});

export const {
  selectLoading: selectRecordsLoading,
  selectError: selectRecordsError,
  selectPersonalBests,
  selectWorldRecords,
} = recordsFeature;
