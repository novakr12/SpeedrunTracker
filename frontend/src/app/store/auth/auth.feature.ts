import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthUser } from '../../core/models/auth.model';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(AuthActions.login, AuthActions.register, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(
      AuthActions.loginSuccess,
      AuthActions.registerSuccess,
      (state, { response }) => ({
        ...state,
        loading: false,
        error: null,
        user: response.user,
        token: response.accessToken,
      }),
    ),
    on(
      AuthActions.loginFailure,
      AuthActions.registerFailure,
      (state, { error }) => ({ ...state, loading: false, error }),
    ),
    on(AuthActions.restoreSession, (state, { token, user }) => ({
      ...state,
      token,
      user,
    })),
    on(AuthActions.logout, () => initialState),
  ),
  extraSelectors: ({ selectToken, selectUser }) => ({
    selectIsAuthenticated: createSelector(selectToken, (token) => !!token),
    selectIsAdmin: createSelector(
      selectUser,
      (user) => user?.role === 'admin',
    ),
  }),
});

export const {
  name: authFeatureKey,
  reducer: authReducer,
  selectUser: selectAuthUser,
  selectToken: selectAuthToken,
  selectLoading: selectAuthLoading,
  selectError: selectAuthError,
  selectIsAuthenticated,
  selectIsAdmin,
} = authFeature;
