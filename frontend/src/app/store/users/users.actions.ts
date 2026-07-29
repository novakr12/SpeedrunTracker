import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ManagedUser } from '../../core/models/user.model';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load Banned': emptyProps(),
    'Load Banned Success': props<{ users: ManagedUser[] }>(),
    'Load Banned Failure': props<{ error: string }>(),
    Ban: props<{
      id: string;
      durationDays?: number;
      reason?: string;
      runId?: string;
    }>(),
    'Ban Success': props<{ user: ManagedUser }>(),
    'Ban Failure': props<{ error: string }>(),
    Unban: props<{ id: string }>(),
    'Unban Success': props<{ id: string }>(),
    'Unban Failure': props<{ error: string }>(),
  },
});
