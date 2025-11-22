import { PartialType } from '@nestjs/swagger';
import { CreateMarriageDto } from './create-marriage.dto';

export class UpdateMarriageDto extends PartialType(CreateMarriageDto) {}
