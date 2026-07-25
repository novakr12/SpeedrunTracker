import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import {
  selectAuthUser,
  selectIsAdmin,
  selectIsAuthenticated,
} from '../../store/auth/auth.feature';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <nav>
      <a class="brand" routerLink="/">🏁 SpeedrunTracker</a>

      @if (isAuthenticated$ | async) {
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/games" routerLinkActive="active">Games</a>
        <a routerLink="/runs" routerLinkActive="active">Runs</a>
        @if (isAdmin$ | async) {
          <a routerLink="/moderation" routerLinkActive="active">Review</a>
        }
        <span class="spacer"></span>
        <a routerLink="/profile" routerLinkActive="active" class="user">{{
          (user$ | async)?.username
        }}</a>
        <button type="button" (click)="logout()">Logout</button>
      } @else {
        <span class="spacer"></span>
        <a routerLink="/login" routerLinkActive="active">Log in</a>
        <a routerLink="/register" routerLinkActive="active">Register</a>
      }
    </nav>
  `,
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectAuthUser);
  readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  readonly isAdmin$ = this.store.select(selectIsAdmin);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
