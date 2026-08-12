import { describe, expect, it } from 'vitest';
import {
  MAX_VISIBLE_NOTIFICATIONS,
  notificationsFeature,
  selectNotifications,
} from './notifications.feature';
import { NotificationsActions } from './notifications.actions';

const { reducer, name } = notificationsFeature;

function show(id: number, message: string) {
  return NotificationsActions.show({ id, message });
}

describe('notifications reducer', () => {
  it('starts with nothing to show', () => {
    expect(reducer(undefined, { type: '@@init' }).items).toEqual([]);
  });

  it('appends a shown notification', () => {
    const state = reducer(undefined, show(1, 'Delete failed'));

    expect(state.items).toEqual([{ id: 1, message: 'Delete failed' }]);
  });

  it('keeps notifications in the order they arrived', () => {
    let state = reducer(undefined, show(1, 'first'));
    state = reducer(state, show(2, 'second'));

    expect(state.items.map((item) => item.message)).toEqual([
      'first',
      'second',
    ]);
  });

  it('drops the oldest once the visible limit is exceeded', () => {
    let state = reducer(undefined, show(1, 'first'));
    for (let id = 2; id <= MAX_VISIBLE_NOTIFICATIONS + 1; id++) {
      state = reducer(state, show(id, `message ${id}`));
    }

    expect(state.items).toHaveLength(MAX_VISIBLE_NOTIFICATIONS);
    expect(state.items.map((item) => item.id)).not.toContain(1);
  });

  it('removes only the dismissed notification', () => {
    let state = reducer(undefined, show(1, 'first'));
    state = reducer(state, show(2, 'second'));
    state = reducer(state, NotificationsActions.dismiss({ id: 1 }));

    expect(state.items).toEqual([{ id: 2, message: 'second' }]);
  });

  it('ignores a dismiss for an unknown id', () => {
    const state = reducer(
      reducer(undefined, show(1, 'first')),
      NotificationsActions.dismiss({ id: 99 }),
    );

    expect(state.items).toHaveLength(1);
  });

  it('selects the visible notifications', () => {
    const state = { [name]: reducer(undefined, show(1, 'Ban failed')) };

    expect(selectNotifications(state)).toEqual([
      { id: 1, message: 'Ban failed' },
    ]);
  });
});
