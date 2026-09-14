import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { RunsPageActions } from './runs-page.actions';
import { RunsService } from '../../core/services/runs.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class RunsPageEffects {
  private readonly actions$ = inject(Actions);
  private readonly runsService = inject(RunsService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RunsPageActions.load),
      switchMap(({ page, limit }) =>
        this.runsService.getPage(page, limit).pipe(
          map((result) => RunsPageActions.loadSuccess({ result })),
          catchError((err) =>
            of(RunsPageActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
