import { Routes } from '@angular/router';

// Feature routes (dashboard, games, runs, profile) will be added as the
// corresponding standalone components are created.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
