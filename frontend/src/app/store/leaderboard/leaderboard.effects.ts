import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { LeaderboardActions } from './leaderboard.actions';
import { RunsService } from '../../core/services/runs.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class LeaderboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly runsService = inject(RunsService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.load),
      switchMap(({ gameId }) =>
        this.runsService.getGameLeaderboard(gameId).pipe(
          map((leaderboard) => LeaderboardActions.loadSuccess({ leaderboard })),
          catchError((err) =>
            of(LeaderboardActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
