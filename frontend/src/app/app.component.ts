import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { NavbarComponent } from './core/components/navbar.component';
import { AuthActions } from './store/auth/auth.actions';
import { AuthUser } from './core/models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      main {
        max-width: 1000px;
        margin: 0 auto;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly store = inject(Store);

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    if (token && rawUser) {
      const user = JSON.parse(rawUser) as AuthUser;
      this.store.dispatch(AuthActions.restoreSession({ token, user }));
    }
  }
}
