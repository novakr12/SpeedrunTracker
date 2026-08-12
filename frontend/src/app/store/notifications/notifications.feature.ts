import { createFeature, createReducer, on } from '@ngrx/store';
import { NotificationsActions } from './notifications.actions';

export const MAX_VISIBLE_NOTIFICATIONS = 3;

export interface Notification {
  id: number;
  message: string;
}

export interface NotificationsState {
  items: Notification[];
}

const initialState: NotificationsState = {
  items: [],
};

export const notificationsFeature = createFeature({
  name: 'notifications',
  reducer: createReducer(
    initialState,
    on(NotificationsActions.show, (state, { id, message }) => ({
      ...state,
      items: [...state.items, { id, message }].slice(
        -MAX_VISIBLE_NOTIFICATIONS,
      ),
    })),
    on(NotificationsActions.dismiss, (state, { id }) => ({
      ...state,
      items: state.items.filter((item) => item.id !== id),
    })),
  ),
});

export const { selectItems: selectNotifications } = notificationsFeature;
