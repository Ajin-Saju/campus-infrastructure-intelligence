import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LostFoundMatchStatus } from '@prisma/client';

export class ResolveMatchDto {
  @IsEnum(LostFoundMatchStatus)
  @IsNotEmpty()
  status!: LostFoundMatchStatus;

  @IsString()
  @IsOptional()
  resolvedNotes?: string;
}
