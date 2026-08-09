import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  assetTag?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  buildingId?: string;

  @IsString()
  @IsOptional()
  floorId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  modelNumber?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  purchaseCost?: number;

  @IsString()
  @IsOptional()
  warrantyExpiry?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  expectedLifespanYears?: number;
}
