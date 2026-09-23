import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Run } from '../runs/run.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminSeedService } from './admin-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Run])],
  controllers: [UsersController],
  providers: [UsersService, AdminSeedService],
  exports: [UsersService],
})
export class UsersModule {}
