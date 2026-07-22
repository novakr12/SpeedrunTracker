import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  Max,
  Min,
} from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(1970)
  @Max(2100)
  releaseYear?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;
}
