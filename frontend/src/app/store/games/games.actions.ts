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
    'Set Followed Only': props<{ followedOnly: boolean }>(),
    'Load Followed': emptyProps(),
    'Load Followed Success': props<{ games: Game[] }>(),
    'Load Followed Failure': props<{ error: string }>(),
    Follow: props<{ id: string }>(),
    Unfollow: props<{ id: string }>(),
    'Follow Success': props<{ games: Game[] }>(),
    'Follow Failure': props<{ error: string }>(),
  },
});
