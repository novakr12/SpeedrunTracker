import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, concatMap, map, of, switchMap, tap } from 'rxjs';
import { RunsActions } from './runs.actions';
import { RunsService } from '../../core/services/runs.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class RunsEffects {
  private readonly actions$ = inject(Actions);
  private readonly runsService = inject(RunsService);
  private readonly router = inject(Router);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RunsActions.load),
      switchMap(() =>
        this.runsService.getAll().pipe(
          map((runs) => RunsActions.loadSuccess({ runs })),
          catchError((err) =>
            of(RunsActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  submit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RunsActions.submit),
      concatMap(({ dto }) =>
        this.runsService.create(dto).pipe(
          map((run) => RunsActions.submitSuccess({ run })),
          catchError((err) =>
            of(RunsActions.submitFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  reloadOnSubmit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RunsActions.submitSuccess),
      map(() => RunsActions.load()),
    ),
  );

  navigateOnSubmit$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RunsActions.submitSuccess),
        tap(() => this.router.navigate(['/runs'])),
      ),
    { dispatch: false },
  );

  review$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RunsActions.review),
      concatMap(({ id, status, comment }) =>
        this.runsService.review(id, { status, comment }).pipe(
          map((run) => RunsActions.reviewSuccess({ run })),
          catchError((err) =>
            of(RunsActions.reviewFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
