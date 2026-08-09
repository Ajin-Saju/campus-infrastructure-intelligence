import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  assetTag!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

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
  status?: AssetStatus = AssetStatus.OPERATIONAL;

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
