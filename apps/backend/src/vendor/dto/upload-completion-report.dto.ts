import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadCompletionReportDto {
  @IsString()
  @IsOptional()
  completionReportUrl?: string;

  @IsString()
  @IsNotEmpty()
  completionNotes!: string;
}
