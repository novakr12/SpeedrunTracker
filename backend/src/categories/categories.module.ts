import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategorySegment } from './category-segment.entity';
import { RunSegment } from '../runs/run-segment.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategorySegment, RunSegment]),
    GamesModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
