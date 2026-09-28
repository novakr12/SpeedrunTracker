import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { CategoriesModule } from './categories/categories.module';
import { RunsModule } from './runs/runs.module';
import { AuthModule } from './auth/auth.module';
import { AppealsModule } from './appeals/appeals.module';
import { RateLimitGuard } from './auth/guards/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'speedrun'),
        password: config.get('DB_PASSWORD', 'speedrun'),
        database: config.get('DB_NAME', 'speedrun'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
    }),
    UsersModule,
    GamesModule,
    CategoriesModule,
    RunsModule,
    AuthModule,
    AppealsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
