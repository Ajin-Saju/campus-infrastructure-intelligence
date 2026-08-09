import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles('ADMIN')
  @Get()
  async findAll(@Query() query: UserQueryDto) {
    return this.userService.findPaginatedUsers(query);
  }

  @Roles('ADMIN')
  @Get('roles')
  async getRoles() {
    return this.userService.getRoles();
  }

  @Roles('ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Roles('ADMIN')
  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') performingUserId: string) {
    return this.userService.createUser(dto, performingUserId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    const performingUserId = currentUser?.id;
    const performingUserRole = currentUser?.role?.name || '';
    return this.userService.updateUser(id, dto, performingUserId, performingUserRole);
  }

  @Roles('ADMIN')
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.userService.updateUserRole(id, dto.roleName, performingUserId);
  }

  @Post(':id/avatar')
  @HttpCode(HttpStatus.OK)
  async updateAvatar(
    @Param('id') id: string,
    @Body() dto: UpdateAvatarDto,
    @CurrentUser() currentUser: any,
  ) {
    const performingUserId = currentUser?.id;
    const performingUserRole = currentUser?.role?.name || '';
    return this.userService.updateUserAvatar(id, dto.avatarUrl, performingUserId, performingUserRole);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') performingUserId: string) {
    await this.userService.softDeleteUser(id, performingUserId);
    return { message: `User with ID "${id}" has been deleted successfully` };
  }
}
