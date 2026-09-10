import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRunDto } from './create-run.dto';

export class UpdateRunDto extends PartialType(
  OmitType(CreateRunDto, [
    'gameId',
    'categoryId',
    'timeMs',
    'segments',
  ] as const),
) {}
