import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { AuthActions } from './auth.actions';
import { selectIsAuthenticated } from './auth.feature';
import { AuthService } from '../../core/services/auth.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ dto }) =>
        this.authService.login(dto).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((err) =>
            of(AuthActions.loginFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ dto }) =>
        this.authService.register(dto).pipe(
          map((response) => AuthActions.registerSuccess({ response })),
          catchError((err) =>
            of(AuthActions.registerFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  persistSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
        tap(({ response }) => {
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.router.navigate(['/dashboard']);
        }),
      ),
    { dispatch: false },
  );

  refreshOnNavigation$ = createEffect(() =>
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      withLatestFrom(this.store.select(selectIsAuthenticated)),
      filter(([, isAuthenticated]) => isAuthenticated),
      map(() => AuthActions.refreshProfile()),
    ),
  );

  refreshProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshProfile),
      switchMap(() =>
        this.authService.me().pipe(
          map((user) => AuthActions.refreshProfileSuccess({ user })),
          catchError((err) =>
            of(AuthActions.refreshProfileFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  persistProfile$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshProfileSuccess),
        tap(({ user }) => localStorage.setItem('user', JSON.stringify(user))),
      ),
    { dispatch: false },
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );
}
