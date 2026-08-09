import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsArray()
  @IsOptional()
  serviceTypes?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  rating?: number;
}
