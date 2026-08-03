import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, of, switchMap, withLatestFrom } from 'rxjs';
import { LeaderboardActions } from './leaderboard.actions';
import { selectLeaderboard } from './leaderboard.feature';
import { CategoriesActions } from '../categories/categories.actions';
import { RunsService } from '../../core/services/runs.service';
import { GameLeaderboard } from '../../core/models/leaderboard.model';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class LeaderboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly runsService = inject(RunsService);
  private readonly store = inject(Store);

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

  refreshOnCategoryChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CategoriesActions.createSuccess,
        CategoriesActions.updateSuccess,
        CategoriesActions.deleteSuccess,
      ),
      withLatestFrom(this.store.select(selectLeaderboard)),
      filter(([, board]) => board !== null),
      map(([, board]) =>
        LeaderboardActions.load({ gameId: (board as GameLeaderboard).gameId }),
      ),
    ),
  );
}
