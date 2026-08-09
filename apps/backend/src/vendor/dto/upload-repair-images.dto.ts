import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UploadRepairImagesDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  imageUrls!: string[];
}
