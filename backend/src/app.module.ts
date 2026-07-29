import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { CategoriesModule } from './categories/categories.module';
import { RunsModule } from './runs/runs.module';
import { AuthModule } from './auth/auth.module';
import { AppealsModule } from './appeals/appeals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        synchronize: true,
      }),
    }),
    UsersModule,
    GamesModule,
    CategoriesModule,
    RunsModule,
    AuthModule,
    AppealsModule,
  ],
})
export class AppModule {}
