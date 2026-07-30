import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import {
  selectAuthUser,
  selectIsAdmin,
  selectIsAuthenticated,
} from '../../store/auth/auth.feature';
import { AppealsActions } from '../../store/appeals/appeals.actions';
import {
  selectAppealsError,
  selectAppealSubmitting,
} from '../../store/appeals/appeals.feature';

const MIN_APPEAL_LENGTH = 20;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, DatePipe, FormsModule],
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

                  @if (user.appeal) {
                    <p class="label">Your appeal</p>
                    <p
                      class="value appeal-status"
                      [class.accepted]="user.appeal.status === 'accepted'"
                      [class.rejected]="user.appeal.status === 'rejected'"
                    >
                      @switch (user.appeal.status) {
                        @case ('open') {
                          Submitted — awaiting review
                        }
                        @case ('accepted') {
                          Accepted by a moderator
                        }
                        @case ('rejected') {
                          Rejected
                        }
                      }
                    </p>
                    @if (user.appeal.adminComment) {
                      <p class="value quote">{{ user.appeal.adminComment }}</p>
                    }
                  } @else if (user.canAppeal) {
                    @if (appealFormOpen) {
                      <p class="label">Your appeal</p>
                      <textarea
                        class="appeal-input"
                        rows="4"
                        [placeholder]="placeholder"
                        [(ngModel)]="appealText"
                      ></textarea>
                      <div class="appeal-actions">
                        <button
                          type="button"
                          class="appeal-send"
                          [disabled]="!canSend || (submitting$ | async)"
                          (click)="submitAppeal()"
                        >
                          Send appeal
                        </button>
                        <button type="button" (click)="cancelAppeal()">
                          Cancel
                        </button>
                      </div>
                      <p class="hint">A ban can only be appealed once.</p>
                    } @else {
                      <button
                        type="button"
                        class="appeal-open"
                        (click)="appealFormOpen = true"
                      >
                        Appeal this ban
                      </button>
                    }

                    @if (appealError$ | async; as appealError) {
                      <p class="value error">{{ appealError }}</p>
                    }
                  }

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
  readonly submitting$ = this.store.select(selectAppealSubmitting);
  readonly appealError$ = this.store.select(selectAppealsError);

  readonly placeholder = `Explain why this ban should be lifted (at least ${MIN_APPEAL_LENGTH} characters).`;

  showBanDetails = false;
  appealFormOpen = false;
  appealText = '';

  get canSend(): boolean {
    return this.appealText.trim().length >= MIN_APPEAL_LENGTH;
  }

  toggleBanDetails(event: MouseEvent): void {
    event.stopPropagation();
    this.showBanDetails = !this.showBanDetails;
  }

  submitAppeal(): void {
    if (!this.canSend) {
      return;
    }
    this.store.dispatch(
      AppealsActions.submit({ dto: { message: this.appealText.trim() } }),
    );
    this.appealFormOpen = false;
    this.appealText = '';
  }

  cancelAppeal(): void {
    this.appealFormOpen = false;
    this.appealText = '';
  }

  @HostListener('document:click')
  closeBanDetails(): void {
    this.showBanDetails = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.appealFormOpen) {
      this.cancelAppeal();
      return;
    }
    this.showBanDetails = false;
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
