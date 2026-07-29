import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveAppealDto {
  @IsIn(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
