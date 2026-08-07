import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findPaginatedUsers(query: UserQueryDto) {
    return this.userRepository.findPaginated({
      search: query.search,
      role: query.role,
      departmentId: query.departmentId,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findById(id: string) {
    return this.getUserById(id);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async createUser(dto: CreateUserDto, performingUserId?: string) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const roleName = dto.roleName || 'STUDENT';
    let role = await this.userRepository.findRoleByName(roleName);
    if (!role) {
      role = await this.userRepository.createRole(roleName);
    }

    const user = await this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      avatarUrl: dto.avatarUrl || null,
      role: { connect: { id: role.id } },
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId || user.id,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role: role.name },
    });

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, performingUserId?: string) {
    const user = await this.getUserById(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updateData: any = {};
    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.password) {
      updateData.passwordHash = await argon2.hash(dto.password);
    }

    if (dto.roleName) {
      let role = await this.userRepository.findRoleByName(dto.roleName);
      if (!role) {
        role = await this.userRepository.createRole(dto.roleName);
      }
      updateData.role = { connect: { id: role.id } };
    }

    if (dto.departmentId !== undefined) {
      if (dto.departmentId) {
        updateData.department = { connect: { id: dto.departmentId } };
      } else {
        updateData.department = { disconnect: true };
      }
    }

    const updatedUser = await this.userRepository.update(id, updateData);

    await this.auditLogService.logEvent({
      userId: performingUserId || id,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      details: { updatedFields: Object.keys(dto) },
    });

    return updatedUser;
  }

  async updateUserRole(id: string, roleName: string, performingUserId?: string) {
    await this.getUserById(id);

    let role = await this.userRepository.findRoleByName(roleName);
    if (!role) {
      role = await this.userRepository.createRole(roleName);
    }

    const updatedUser = await this.userRepository.update(id, {
      role: { connect: { id: role.id } },
    });

    await this.auditLogService.logEvent({
      userId: performingUserId || id,
      action: 'USER_ROLE_ASSIGNED',
      entityType: 'USER',
      entityId: id,
      details: { newRole: roleName },
    });

    return updatedUser;
  }

  async updateUserAvatar(id: string, avatarUrl: string, performingUserId?: string) {
    await this.getUserById(id);

    const updatedUser = await this.userRepository.update(id, {
      avatarUrl,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId || id,
      action: 'USER_AVATAR_UPDATED',
      entityType: 'USER',
      entityId: id,
    });

    return updatedUser;
  }

  async softDeleteUser(id: string, performingUserId?: string) {
    await this.getUserById(id);

    const deletedUser = await this.userRepository.softDelete(id);

    await this.auditLogService.logEvent({
      userId: performingUserId || id,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: id,
    });

    return deletedUser;
  }

  async getOrCreateDefaultRole(roleName = 'STUDENT') {
    let role = await this.userRepository.findRoleByName(roleName);
    if (!role) {
      role = await this.userRepository.createRole(roleName);
    }
    return role;
  }

  async setRefreshTokenHash(userId: string, refreshToken: string | null) {
    const hash = refreshToken ? await argon2.hash(refreshToken) : null;
    return this.userRepository.update(userId, { refreshTokenHash: hash });
  }

  async setVerificationToken(userId: string, token: string, expires: Date) {
    return this.userRepository.update(userId, {
      verificationToken: token,
      verificationTokenExpires: expires,
    });
  }

  async verifyEmail(userId: string) {
    return this.userRepository.update(userId, {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });
  }

  async setResetPasswordToken(userId: string, token: string, expires: Date) {
    return this.userRepository.update(userId, {
      resetPasswordToken: token,
      resetPasswordTokenExpires: expires,
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);
    return this.userRepository.update(userId, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null,
    });
  }

  async updateLastLogin(userId: string) {
    return this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async getRoles() {
    return this.userRepository.findAllRoles();
  }
}
