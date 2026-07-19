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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(),
    provideState(authFeature),
    provideState(gamesFeature),
    provideState(runsFeature),
    provideEffects(AuthEffects, GamesEffects, RunsEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
