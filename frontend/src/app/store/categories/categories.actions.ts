import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../core/models/game.model';

export const CategoriesActions = createActionGroup({
  source: 'Categories',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ categories: Category[] }>(),
    'Load Failure': props<{ error: string }>(),
    Create: props<{ dto: CreateCategoryDto }>(),
    'Create Success': props<{ category: Category }>(),
    'Create Failure': props<{ error: string }>(),
    Update: props<{ id: string; changes: UpdateCategoryDto }>(),
    'Update Success': props<{ category: Category }>(),
    'Update Failure': props<{ error: string }>(),
    Delete: props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),
  },
});
