import { IsInt, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateFloorDto {
  @IsInt()
  @IsOptional()
  floorNumber?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @ValidateIf((o) => typeof o.mapUrl === 'string' && o.mapUrl.trim() !== '')
  @IsUrl({}, { message: 'Floor map must be a valid URL' })
  @IsOptional()
  mapUrl?: string;
}
