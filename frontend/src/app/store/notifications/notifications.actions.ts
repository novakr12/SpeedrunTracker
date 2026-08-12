import { createActionGroup, props } from '@ngrx/store';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    Show: props<{ id: number; message: string }>(),
    Dismiss: props<{ id: number }>(),
  },
});
