import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  BanAppeal,
  CreateAppealDto,
  ResolveAppealDto,
} from '../../core/models/appeal.model';

export const AppealsActions = createActionGroup({
  source: 'Appeals',
  events: {
    Submit: props<{ dto: CreateAppealDto }>(),
    'Submit Success': props<{ appeal: BanAppeal }>(),
    'Submit Failure': props<{ error: string }>(),
    Load: emptyProps(),
    'Load Success': props<{ appeals: BanAppeal[] }>(),
    'Load Failure': props<{ error: string }>(),
    Resolve: props<{ id: string; dto: ResolveAppealDto }>(),
    'Resolve Success': props<{ appeal: BanAppeal }>(),
    'Resolve Failure': props<{ error: string }>(),
  },
});
