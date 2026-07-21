import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, of, switchMap } from 'rxjs';
import { CategoriesActions } from './categories.actions';
import { CategoriesService } from '../../core/services/categories.service';
import { toMessage } from '../../core/utils/http-error';

@Injectable()
export class CategoriesEffects {
  private readonly actions$ = inject(Actions);
  private readonly categoriesService = inject(CategoriesService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.load),
      switchMap(() =>
        this.categoriesService.getAll().pipe(
          map((categories) => CategoriesActions.loadSuccess({ categories })),
          catchError((err) =>
            of(CategoriesActions.loadFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.create),
      concatMap(({ dto }) =>
        this.categoriesService.create(dto).pipe(
          map((category) => CategoriesActions.createSuccess({ category })),
          catchError((err) =>
            of(CategoriesActions.createFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.update),
      concatMap(({ id, changes }) =>
        this.categoriesService.update(id, changes).pipe(
          map((category) => CategoriesActions.updateSuccess({ category })),
          catchError((err) =>
            of(CategoriesActions.updateFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoriesActions.delete),
      concatMap(({ id }) =>
        this.categoriesService.delete(id).pipe(
          map(() => CategoriesActions.deleteSuccess({ id })),
          catchError((err) =>
            of(CategoriesActions.deleteFailure({ error: toMessage(err) })),
          ),
        ),
      ),
    ),
  );
}
