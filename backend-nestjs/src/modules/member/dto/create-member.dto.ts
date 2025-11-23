import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender, Visibility } from '../entities/member.entity';

export class CreateMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value || value === '') return null;
    // Accept date-only format (YYYY-MM-DD) and convert to Date
    return value;
  })
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAlive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value || value === '') return null;
    return value;
  })
  dateOfDeath?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeOfDeath?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  generationIndex?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fatherId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  motherId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ enum: Visibility })
  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;
}
