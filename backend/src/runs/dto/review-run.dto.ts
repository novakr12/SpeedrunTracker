import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRunDto {
  @IsIn(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
