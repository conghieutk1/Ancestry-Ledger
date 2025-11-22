import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
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
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAlive?: boolean;

  @ApiPropertyOptional({ enum: Visibility })
  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;
}
