import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap, timer } from 'rxjs';
import { NotificationsActions } from './notifications.actions';
import { GamesActions } from '../games/games.actions';
import { CategoriesActions } from '../categories/categories.actions';
import { RunsActions } from '../runs/runs.actions';
import { UsersActions } from '../users/users.actions';
import { AppealsActions } from '../appeals/appeals.actions';

export const NOTIFICATION_TIMEOUT_MS = 6000;

@Injectable()
export class NotificationsEffects {
  private readonly actions$ = inject(Actions);

  private nextId = 0;

  readonly showMutationFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        GamesActions.createFailure,
        GamesActions.updateFailure,
        GamesActions.deleteFailure,
        CategoriesActions.createFailure,
        CategoriesActions.updateFailure,
        CategoriesActions.deleteFailure,
        RunsActions.reviewFailure,
        UsersActions.banFailure,
        UsersActions.unbanFailure,
        AppealsActions.resolveFailure,
      ),
      map(({ error }) =>
        NotificationsActions.show({ id: ++this.nextId, message: error }),
      ),
    ),
  );

  readonly dismissAfterTimeout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.show),
      mergeMap(({ id }) =>
        timer(NOTIFICATION_TIMEOUT_MS).pipe(
          map(() => NotificationsActions.dismiss({ id })),
        ),
      ),
    ),
  );
}
