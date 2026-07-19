import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'games',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/games/games-list.component').then(
        (m) => m.GamesListComponent,
      ),
  },
  {
    path: 'runs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/runs/runs-list.component').then(
        (m) => m.RunsListComponent,
      ),
  },
  {
    path: 'runs/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/runs/run-form.component').then(
        (m) => m.RunFormComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
