import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, exhaustMap, map, of, switchMap } from 'rxjs';
import { AppealsActions } from './appeals.actions';
import { AuthActions } from '../auth/auth.actions';
import { AppealsService } from '../../core/services/appeals.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class AppealsEffects {
  private readonly actions$ = inject(Actions);
  private readonly appealsService = inject(AppealsService);

  // exhaustMap: a double-click must not fire two appeals, since only one is
  // allowed per ban and the second would come back as a 409.
  submit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppealsActions.submit),
      exhaustMap(({ dto }) =>
        this.appealsService.submit(dto).pipe(
          map((appeal) => AppealsActions.submitSuccess({ appeal })),
          catchError((err) =>
            of(AppealsActions.submitFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  // The appeal's state lives on the auth profile, so refresh it to swap the
  // button for the submitted status without a page reload.
  refreshProfileOnSubmit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppealsActions.submitSuccess),
      map(() => AuthActions.refreshProfile()),
    ),
  );

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppealsActions.load),
      switchMap(() =>
        this.appealsService.getAll().pipe(
          map((appeals) => AppealsActions.loadSuccess({ appeals })),
          catchError((err) =>
            of(AppealsActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  resolve$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppealsActions.resolve),
      concatMap(({ id, dto }) =>
        this.appealsService.resolve(id, dto).pipe(
          map((appeal) => AppealsActions.resolveSuccess({ appeal })),
          catchError((err) =>
            of(AppealsActions.resolveFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
