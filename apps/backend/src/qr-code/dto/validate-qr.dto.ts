import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateQrDto {
  @IsString()
  @IsNotEmpty()
  qrData!: string;
}
