import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ElementType } from '../../generated/prisma/client.js';

export class CreateElementDto {
  @IsEnum(ElementType)
  type!: ElementType;

  @Type(() => Number)
  @IsNumber()
  x!: number;

  @Type(() => Number)
  @IsNumber()
  y!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
