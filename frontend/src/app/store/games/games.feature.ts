import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Game } from '../../core/models/game.model';
import { GamesActions } from './games.actions';

export const gamesAdapter = createEntityAdapter<Game>();

export interface GamesState extends EntityState<Game> {
  loading: boolean;
  error: string | null;
  search: string;
  followedIds: string[];
  followedOnly: boolean;
}

const initialState: GamesState = gamesAdapter.getInitialState({
  loading: false,
  error: null,
  search: '',
  followedIds: [],
  followedOnly: false,
});

export const gamesFeature = createFeature({
  name: 'games',
  reducer: createReducer(
    initialState,
    on(GamesActions.load, (state) => ({ ...state, loading: true, error: null })),
    on(GamesActions.loadSuccess, (state, { games }) =>
      gamesAdapter.setAll(games, { ...state, loading: false }),
    ),
    on(GamesActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(
      GamesActions.create,
      GamesActions.update,
      GamesActions.delete,
      (state) => ({ ...state, error: null }),
    ),
    on(GamesActions.createSuccess, (state, { game }) =>
      gamesAdapter.addOne(game, state),
    ),
    on(GamesActions.createFailure, (state, { error }) => ({ ...state, error })),
    on(GamesActions.updateSuccess, (state, { game }) =>
      gamesAdapter.upsertOne(game, state),
    ),
    on(GamesActions.updateFailure, (state, { error }) => ({ ...state, error })),
    on(GamesActions.deleteSuccess, (state, { id }) =>
      gamesAdapter.removeOne(id, state),
    ),
    on(GamesActions.deleteFailure, (state, { error }) => ({ ...state, error })),
    on(GamesActions.setSearch, (state, { search }) => ({ ...state, search })),
    on(GamesActions.setFollowedOnly, (state, { followedOnly }) => ({
      ...state,
      followedOnly,
    })),
    on(
      GamesActions.loadFollowedSuccess,
      GamesActions.followSuccess,
      (state, { games }) => ({
        ...state,
        followedIds: games.map((game) => game.id),
      }),
    ),
    on(
      GamesActions.loadFollowedFailure,
      GamesActions.followFailure,
      (state, { error }) => ({ ...state, error }),
    ),
  ),
  extraSelectors: ({
    selectGamesState,
    selectSearch,
    selectFollowedIds,
    selectFollowedOnly,
  }) => {
    const { selectAll } = gamesAdapter.getSelectors(selectGamesState);
    return {
      selectAllGames: selectAll,
      selectFilteredGames: createSelector(
        selectAll,
        selectSearch,
        selectFollowedIds,
        selectFollowedOnly,
        (games, search, followedIds, followedOnly) => {
          const term = search.trim().toLowerCase();
          const followed = new Set(followedIds);
          return games.filter((game) => {
            if (followedOnly && !followed.has(game.id)) {
              return false;
            }
            if (!term) {
              return true;
            }
            const inTitle = game.title.toLowerCase().includes(term);
            const inTags = (game.tags ?? []).some((tag) =>
              tag.toLowerCase().includes(term),
            );
            const inPlatforms = (game.platforms ?? []).some((platform) =>
              platform.toLowerCase().includes(term),
            );
            return inTitle || inTags || inPlatforms;
          });
        },
      ),
      selectFollowedGames: createSelector(
        selectAll,
        selectFollowedIds,
        (games, followedIds) => {
          const followed = new Set(followedIds);
          return games.filter((game) => followed.has(game.id));
        },
      ),
    };
  },
});

export const {
  selectLoading: selectGamesLoading,
  selectError: selectGamesError,
  selectSearch: selectGamesSearch,
  selectFollowedIds: selectFollowedGameIds,
  selectFollowedOnly: selectGamesFollowedOnly,
  selectAllGames,
  selectFilteredGames,
  selectFollowedGames,
} = gamesFeature;
