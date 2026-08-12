import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { RecordsActions } from './records.actions';
import { RunsActions } from '../runs/runs.actions';
import { RunsService } from '../../core/services/runs.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class RecordsEffects {
  private readonly actions$ = inject(Actions);
  private readonly runsService = inject(RunsService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecordsActions.load),
      switchMap(() =>
        this.runsService.getPersonalBests().pipe(
          map((personalBests) =>
            RecordsActions.loadSuccess({ personalBests }),
          ),
          catchError((err) =>
            of(RecordsActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  refreshAfterReview$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RunsActions.reviewSuccess, RunsActions.submitSuccess),
      map(() => RecordsActions.load()),
    ),
  );
}
