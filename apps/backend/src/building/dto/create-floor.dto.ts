import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class CreateFloorDto {
  @IsInt()
  @IsNotEmpty()
  floorNumber!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateIf((o) => typeof o.mapUrl === 'string' && o.mapUrl.trim() !== '')
  @IsUrl({}, { message: 'Floor map must be a valid URL' })
  @IsOptional()
  mapUrl?: string;
}
