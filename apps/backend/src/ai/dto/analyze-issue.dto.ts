import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AnalyzeIssueTextDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  buildingId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  assetId?: string;
}
