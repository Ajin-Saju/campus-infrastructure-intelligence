import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class UploadInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  invoiceAmount!: number;

  @IsString()
  @IsOptional()
  invoiceUrl?: string;

  @IsString()
  @IsOptional()
  paymentStatus?: string;
}
