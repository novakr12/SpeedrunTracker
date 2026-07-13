import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Run } from './run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Run])],
})
export class RunsModule {}
