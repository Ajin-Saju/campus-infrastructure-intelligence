import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  roleName!: string;
}
