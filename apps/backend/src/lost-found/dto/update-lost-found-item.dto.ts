import {
  IsString,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsArray,
} from 'class-validator';
import { LostFoundStatus } from '@prisma/client';

export class UpdateLostFoundItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  @IsOptional()
  dateOccurred?: string;

  @IsString()
  @IsOptional()
  timeOccurred?: string;

  @IsString()
  @IsOptional()
  buildingId?: string;

  @IsString()
  @IsOptional()
  floorId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  locationDescription?: string;

  @IsString()
  @IsOptional()
  foundBy?: string;

  @IsString()
  @IsOptional()
  contactPreference?: string;

  @IsEnum(LostFoundStatus)
  @IsOptional()
  status?: LostFoundStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
