import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class AssignVendorDto {
  @IsString()
  @IsNotEmpty()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  taskId!: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  contractAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
