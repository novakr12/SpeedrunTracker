import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateGameDto,
  Game,
  UpdateGameDto,
} from '../../core/models/game.model';

export const GamesActions = createActionGroup({
  source: 'Games',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ games: Game[] }>(),
    'Load Failure': props<{ error: string }>(),
    Create: props<{ dto: CreateGameDto }>(),
    'Create Success': props<{ game: Game }>(),
    'Create Failure': props<{ error: string }>(),
    Update: props<{ id: string; changes: UpdateGameDto }>(),
    'Update Success': props<{ game: Game }>(),
    'Update Failure': props<{ error: string }>(),
    Delete: props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),
    'Set Search': props<{ search: string }>(),
  },
});
