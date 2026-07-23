import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get('ADMIN_EMAIL', 'admin@speedrun.local');
    const username = this.config.get('ADMIN_USERNAME', 'admin');
    const password = this.config.get('ADMIN_PASSWORD', 'admin1234');

    await this.usersService.ensureAdmin(username, email, password);
    this.logger.log(`Admin account ensured for ${email}`);
  }
}
