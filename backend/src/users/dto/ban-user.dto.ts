import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class BanUserDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
