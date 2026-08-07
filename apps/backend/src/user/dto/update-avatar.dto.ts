import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @IsUrl({}, { message: 'Avatar URL must be a valid web URL' })
  @IsNotEmpty()
  avatarUrl!: string;
}
