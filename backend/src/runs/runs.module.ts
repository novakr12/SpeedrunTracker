import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Run } from './run.entity';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Run]),
    UsersModule,
    GamesModule,
    CategoriesModule,
  ],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
