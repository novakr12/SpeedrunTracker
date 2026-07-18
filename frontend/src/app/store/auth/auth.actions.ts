import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AuthResponse,
  AuthUser,
  LoginDto,
  RegisterDto,
} from '../../core/models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ dto: LoginDto }>(),
    'Login Success': props<{ response: AuthResponse }>(),
    'Login Failure': props<{ error: string }>(),
    Register: props<{ dto: RegisterDto }>(),
    'Register Success': props<{ response: AuthResponse }>(),
    'Register Failure': props<{ error: string }>(),
    'Restore Session': props<{ token: string; user: AuthUser }>(),
    Logout: emptyProps(),
  },
});
