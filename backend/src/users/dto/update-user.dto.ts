import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Required when a non-admin changes `password`. Declared here so the global
  // ValidationPipe (whitelist: true) does not strip it off the request.
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
