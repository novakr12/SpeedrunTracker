import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RunSegmentDto {
  @IsUUID()
  segmentId: string;

  @IsInt()
  @Min(1)
  durationMs: number;
}

export class CreateRunDto {
  @IsUUID()
  gameId: string;

  @IsUUID()
  categoryId: string;

  @IsInt()
  @Min(1)
  timeMs: number;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  videoUrl?: string;

  @IsOptional()
  @IsDateString()
  playedAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RunSegmentDto)
  segments?: RunSegmentDto[];
}
