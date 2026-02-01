import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MarriageStatus } from '../entities/marriage.entity';

export class CreateMarriageDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  partner1Id: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  partner2Id?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    enum: MarriageStatus,
    default: MarriageStatus.MARRIED,
  })
  @IsEnum(MarriageStatus)
  @IsOptional()
  status?: MarriageStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
