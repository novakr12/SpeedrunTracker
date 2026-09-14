import { createActionGroup, props } from '@ngrx/store';
import { Page } from '../../core/models/page.model';
import { Run } from '../../core/models/run.model';

export const RunsPageActions = createActionGroup({
  source: 'Runs Page',
  events: {
    Load: props<{ page: number; limit: number }>(),
    'Load Success': props<{ result: Page<Run> }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
