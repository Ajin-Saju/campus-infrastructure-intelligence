import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string = 'CLASSROOM';

  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;
}
