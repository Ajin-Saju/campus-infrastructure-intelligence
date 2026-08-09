import { IsBoolean, IsOptional } from 'class-validator';

export class GenerateQrDto {
  @IsBoolean()
  @IsOptional()
  regenerate?: boolean = false;
}
