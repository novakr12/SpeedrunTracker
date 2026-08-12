import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PersonalBest } from '../../core/models/leaderboard.model';

export const RecordsActions = createActionGroup({
  source: 'Records',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ personalBests: PersonalBest[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
