import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Game } from '../../core/models/game.model';
import { GamesActions } from './games.actions';

export const gamesAdapter = createEntityAdapter<Game>();

export interface GamesState extends EntityState<Game> {
  loading: boolean;
  error: string | null;
  search: string;
}

const initialState: GamesState = gamesAdapter.getInitialState({
  loading: false,
  error: null,
  search: '',
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
  ),
  extraSelectors: ({ selectGamesState, selectSearch }) => {
    const { selectAll } = gamesAdapter.getSelectors(selectGamesState);
    return {
      selectAllGames: selectAll,
      selectFilteredGames: createSelector(
        selectAll,
        selectSearch,
        (games, search) => {
          const term = search.trim().toLowerCase();
          if (!term) {
            return games;
          }
          return games.filter((game) => {
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
    };
  },
});

export const {
  selectLoading: selectGamesLoading,
  selectError: selectGamesError,
  selectSearch: selectGamesSearch,
  selectAllGames,
  selectFilteredGames,
} = gamesFeature;
