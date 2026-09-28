import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getErrorMessage(): Promise<string> {
    return 'Too many attempts. Please wait a minute and try again.';
  }
}
