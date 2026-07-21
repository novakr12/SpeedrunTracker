import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Category } from '../../core/models/game.model';
import { CategoriesActions } from './categories.actions';

export const categoriesAdapter = createEntityAdapter<Category>();

export interface CategoriesState extends EntityState<Category> {
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = categoriesAdapter.getInitialState({
  loading: false,
  error: null,
});

export const categoriesFeature = createFeature({
  name: 'categories',
  reducer: createReducer(
    initialState,
    on(CategoriesActions.load, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(CategoriesActions.loadSuccess, (state, { categories }) =>
      categoriesAdapter.setAll(categories, { ...state, loading: false }),
    ),
    on(CategoriesActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(CategoriesActions.createSuccess, (state, { category }) =>
      categoriesAdapter.addOne(category, state),
    ),
    on(CategoriesActions.createFailure, (state, { error }) => ({
      ...state,
      error,
    })),
    on(CategoriesActions.updateSuccess, (state, { category }) =>
      categoriesAdapter.upsertOne(category, state),
    ),
    on(CategoriesActions.updateFailure, (state, { error }) => ({
      ...state,
      error,
    })),
    on(CategoriesActions.deleteSuccess, (state, { id }) =>
      categoriesAdapter.removeOne(id, state),
    ),
    on(CategoriesActions.deleteFailure, (state, { error }) => ({
      ...state,
      error,
    })),
  ),
  extraSelectors: ({ selectCategoriesState }) => {
    const { selectAll } = categoriesAdapter.getSelectors(selectCategoriesState);
    return {
      selectAllCategories: selectAll,
      selectCategoriesByGame: createSelector(selectAll, (categories) => {
        const grouped: Record<string, Category[]> = {};
        categories.forEach((category) => {
          (grouped[category.gameId] ??= []).push(category);
        });
        return grouped;
      }),
    };
  },
});

export const {
  selectLoading: selectCategoriesLoading,
  selectError: selectCategoriesError,
  selectAllCategories,
  selectCategoriesByGame,
} = categoriesFeature;
