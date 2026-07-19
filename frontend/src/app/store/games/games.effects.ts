import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, of, switchMap } from 'rxjs';
import { GamesActions } from './games.actions';
import { GamesService } from '../../core/services/games.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class GamesEffects {
  private readonly actions$ = inject(Actions);
  private readonly gamesService = inject(GamesService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GamesActions.load),
      switchMap(() =>
        this.gamesService.getAll().pipe(
          map((games) => GamesActions.loadSuccess({ games })),
          catchError((err) =>
            of(GamesActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GamesActions.create),
      concatMap(({ dto }) =>
        this.gamesService.create(dto).pipe(
          map((game) => GamesActions.createSuccess({ game })),
          catchError((err) =>
            of(GamesActions.createFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
