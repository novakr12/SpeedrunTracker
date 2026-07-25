import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateRunDto, Run } from '../../core/models/run.model';

export const RunsActions = createActionGroup({
  source: 'Runs',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ runs: Run[] }>(),
    'Load Failure': props<{ error: string }>(),
    Submit: props<{ dto: CreateRunDto }>(),
    'Submit Success': props<{ run: Run }>(),
    'Submit Failure': props<{ error: string }>(),
    Review: props<{
      id: string;
      status: 'accepted' | 'rejected';
      comment?: string;
    }>(),
    'Review Success': props<{ run: Run }>(),
    'Review Failure': props<{ error: string }>(),
  },
});
