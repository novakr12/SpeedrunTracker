import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { NavbarComponent } from './core/components/navbar.component';
import { ToastComponent } from './core/components/toast.component';
import { AuthActions } from './store/auth/auth.actions';
import { NotificationsActions } from './store/notifications/notifications.actions';
import { selectNotifications } from './store/notifications/notifications.feature';
import { AuthUser } from './core/models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent, AsyncPipe],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-toast
      [notifications]="(notifications$ | async) ?? []"
      (dismiss)="dismissNotification($event)"
    />
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

  readonly notifications$ = this.store.select(selectNotifications);

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    if (token && rawUser) {
      const user = JSON.parse(rawUser) as AuthUser;
      this.store.dispatch(AuthActions.restoreSession({ token, user }));
    }
  }

  dismissNotification(id: number): void {
    this.store.dispatch(NotificationsActions.dismiss({ id }));
  }
}
