import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsArray,
} from 'class-validator';

export class CreateFoundItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsISO8601()
  @IsNotEmpty()
  dateOccurred!: string;

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
