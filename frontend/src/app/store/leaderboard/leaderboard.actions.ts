import { createActionGroup, props } from '@ngrx/store';
import { GameLeaderboard } from '../../core/models/leaderboard.model';

export const LeaderboardActions = createActionGroup({
  source: 'Leaderboard',
  events: {
    Load: props<{ gameId: string }>(),
    'Load Success': props<{ leaderboard: GameLeaderboard }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
