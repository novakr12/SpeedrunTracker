import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRunDto } from './create-run.dto';

export class UpdateRunDto extends PartialType(CreateRunDto) {
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
