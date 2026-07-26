import { createFeature, createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { ManagedUser } from '../../core/models/user.model';
import { UsersActions } from './users.actions';

export const bannedUsersAdapter = createEntityAdapter<ManagedUser>();

export interface UsersState extends EntityState<ManagedUser> {
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = bannedUsersAdapter.getInitialState({
  loading: false,
  error: null,
});

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersActions.loadBanned, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(UsersActions.loadBannedSuccess, (state, { users }) =>
      bannedUsersAdapter.setAll(users, { ...state, loading: false }),
    ),
    on(UsersActions.loadBannedFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(UsersActions.banSuccess, (state, { user }) =>
      bannedUsersAdapter.upsertOne(user, state),
    ),
    on(UsersActions.unbanSuccess, (state, { id }) =>
      bannedUsersAdapter.removeOne(id, state),
    ),
    on(
      UsersActions.banFailure,
      UsersActions.unbanFailure,
      (state, { error }) => ({ ...state, error }),
    ),
  ),
  extraSelectors: ({ selectUsersState }) => {
    const { selectAll } = bannedUsersAdapter.getSelectors(selectUsersState);
    return { selectBannedUsers: selectAll };
  },
});

export const {
  selectLoading: selectUsersLoading,
  selectError: selectUsersError,
  selectBannedUsers,
} = usersFeature;
