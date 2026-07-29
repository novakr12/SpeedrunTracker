import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, of, switchMap } from 'rxjs';
import { UsersActions } from './users.actions';
import { UsersService } from '../../core/services/users.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class UsersEffects {
  private readonly actions$ = inject(Actions);
  private readonly usersService = inject(UsersService);

  loadBanned$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadBanned),
      switchMap(() =>
        this.usersService.getBanned().pipe(
          map((users) => UsersActions.loadBannedSuccess({ users })),
          catchError((err) =>
            of(UsersActions.loadBannedFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  ban$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.ban),
      concatMap(({ id, durationDays, reason, runId }) =>
        this.usersService.ban(id, { durationDays, reason, runId }).pipe(
          map((user) => UsersActions.banSuccess({ user })),
          catchError((err) =>
            of(UsersActions.banFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  unban$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.unban),
      concatMap(({ id }) =>
        this.usersService.unban(id).pipe(
          map(() => UsersActions.unbanSuccess({ id })),
          catchError((err) =>
            of(UsersActions.unbanFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
