import { IsNumber, IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';

export class UploadQuotationDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  quotationAmount!: number;

  @IsString()
  @IsOptional()
  quotationUrl?: string;

  @IsString()
  @IsOptional()
  quotationNotes?: string;
}
