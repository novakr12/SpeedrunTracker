import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectAuthUser } from '../../store/auth/auth.feature';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <section class="page">
      <h1>Welcome, {{ (user$ | async)?.username }}</h1>
      <p>Your speedrun stats will appear here.</p>
    </section>
  `,
  styles: [
    `
      .page {
        padding: 1.5rem;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly store = inject(Store);
  readonly user$ = this.store.select(selectAuthUser);
}
