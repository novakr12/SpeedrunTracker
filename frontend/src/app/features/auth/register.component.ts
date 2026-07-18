import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
} from '../../store/auth/auth.feature';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe],
  template: `
    <section class="auth">
      <h2>Create account</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Username
          <input type="text" formControlName="username" autocomplete="username" />
        </label>
        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            formControlName="password"
            autocomplete="new-password"
          />
        </label>

        @if (error$ | async; as error) {
          <p class="error">{{ error }}</p>
        }

        <button type="submit" [disabled]="form.invalid || (loading$ | async)">
          {{ (loading$ | async) ? 'Creating…' : 'Register' }}
        </button>
      </form>
      <p class="switch">
        Already registered? <a routerLink="/login">Log in</a>
      </p>
    </section>
  `,
  styleUrl: './auth.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly loading$ = this.store.select(selectAuthLoading);
  readonly error$ = this.store.select(selectAuthError);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.valid) {
      this.store.dispatch(
        AuthActions.register({ dto: this.form.getRawValue() }),
      );
    }
  }
}
