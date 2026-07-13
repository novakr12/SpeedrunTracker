import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRunDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  gameId: string;

  @IsUUID()
  categoryId: string;

  @IsInt()
  @Min(1)
  timeMs: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsDateString()
  playedAt?: string;
}
