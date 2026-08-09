import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddAssetImageDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}
