import { createFeature, createReducer, on } from '@ngrx/store';
import { GameLeaderboard } from '../../core/models/leaderboard.model';
import { LeaderboardActions } from './leaderboard.actions';

export interface LeaderboardState {
  leaderboard: GameLeaderboard | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  leaderboard: null,
  loading: false,
  error: null,
};

export const leaderboardFeature = createFeature({
  name: 'leaderboard',
  reducer: createReducer(
    initialState,
    on(LeaderboardActions.load, (state) => ({
      ...state,
      leaderboard: null,
      loading: true,
      error: null,
    })),
    on(LeaderboardActions.loadSuccess, (state, { leaderboard }) => ({
      ...state,
      loading: false,
      error: null,
      leaderboard,
    })),
    on(LeaderboardActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      leaderboard: null,
      error,
    })),
  ),
});

export const {
  selectLeaderboard,
  selectLoading: selectLeaderboardLoading,
  selectError: selectLeaderboardError,
} = leaderboardFeature;
