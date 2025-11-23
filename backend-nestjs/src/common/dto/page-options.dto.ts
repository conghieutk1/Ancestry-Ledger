import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PageOptionsDto {
  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 1000,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  readonly take?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  readonly q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  readonly branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  readonly gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  readonly isAlive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  readonly generation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  readonly placeOfBirth?: string;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
