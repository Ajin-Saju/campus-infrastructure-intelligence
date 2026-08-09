import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  lostItemId!: string;

  @IsString()
  @IsNotEmpty()
  foundItemId!: string;

  @IsString()
  @IsOptional()
  matchNotes?: string;
}
