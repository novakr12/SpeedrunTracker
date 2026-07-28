import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
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
  imports: [RouterLink, RouterLinkActive, AsyncPipe, DatePipe],
  template: `
    <nav>
      <a class="brand" routerLink="/">SpeedrunTracker</a>

      @if (isAuthenticated$ | async) {
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/games" routerLinkActive="active">Games</a>
        <a routerLink="/runs" routerLinkActive="active">Runs</a>
        @if (isAdmin$ | async) {
          <a routerLink="/moderation" routerLinkActive="active">Review</a>
        }
        <span class="spacer"></span>

        @if (user$ | async; as user) {
          <a routerLink="/profile" routerLinkActive="active" class="user">{{
            user.username
          }}</a>

          @if (user.banned) {
            <span class="ban-wrap">
              <button
                type="button"
                class="banned-badge"
                [attr.aria-expanded]="showBanDetails"
                (click)="toggleBanDetails($event)"
              >
                Banned
              </button>

              @if (showBanDetails) {
                <div class="ban-popover" (click)="$event.stopPropagation()">
                  <h4>Account banned</h4>

                  <p class="label">Reason</p>
                  <p class="value">{{ user.banReason || 'No reason given.' }}</p>

                  <p class="label">Expires</p>
                  <p class="value">
                    @if (user.bannedUntil) {
                      {{ user.bannedUntil | date: 'medium' }}
                    } @else {
                      Never — this ban is permanent
                    }
                  </p>

                  <p class="note">You cannot submit runs while banned.</p>
                </div>
              }
            </span>
          }
        }

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

  showBanDetails = false;

  toggleBanDetails(event: MouseEvent): void {
    // Without this the document listener below would close the popover in the
    // same click that opened it.
    event.stopPropagation();
    this.showBanDetails = !this.showBanDetails;
  }

  @HostListener('document:click')
  closeBanDetails(): void {
    this.showBanDetails = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showBanDetails = false;
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
