import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { authFeature } from './store/auth/auth.feature';
import { AuthEffects } from './store/auth/auth.effects';
import { gamesFeature } from './store/games/games.feature';
import { GamesEffects } from './store/games/games.effects';
import { runsFeature } from './store/runs/runs.feature';
import { RunsEffects } from './store/runs/runs.effects';
import { categoriesFeature } from './store/categories/categories.feature';
import { CategoriesEffects } from './store/categories/categories.effects';
import { usersFeature } from './store/users/users.feature';
import { UsersEffects } from './store/users/users.effects';
import { leaderboardFeature } from './store/leaderboard/leaderboard.feature';
import { LeaderboardEffects } from './store/leaderboard/leaderboard.effects';
import { appealsFeature } from './store/appeals/appeals.feature';
import { AppealsEffects } from './store/appeals/appeals.effects';
import { notificationsFeature } from './store/notifications/notifications.feature';
import { NotificationsEffects } from './store/notifications/notifications.effects';
import { recordsFeature } from './store/records/records.feature';
import { RecordsEffects } from './store/records/records.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(),
    provideState(authFeature),
    provideState(gamesFeature),
    provideState(runsFeature),
    provideState(categoriesFeature),
    provideState(usersFeature),
    provideState(leaderboardFeature),
    provideState(appealsFeature),
    provideState(notificationsFeature),
    provideState(recordsFeature),
    provideEffects(
      AuthEffects,
      GamesEffects,
      RunsEffects,
      CategoriesEffects,
      UsersEffects,
      LeaderboardEffects,
      AppealsEffects,
      NotificationsEffects,
      RecordsEffects,
    ),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
