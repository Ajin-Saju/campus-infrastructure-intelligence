import { IsString, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  contextEntity?: string;

  @IsString()
  @IsOptional()
  contextEntityId?: string;

  @IsString()
  @IsOptional()
  initialMessage?: string;
}
