import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const user = await this.userService.createUser(dto);

    // Generate Email Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await this.userService.setVerificationToken(user.id, verificationToken, expires);

    await this.auditLogService.logEvent({
      userId: user.id,
      action: 'REGISTER',
      ipAddress,
      userAgent,
      details: { email: user.email, role: user.role.name },
    });

    return {
      message: 'Registration successful. Please verify your email.',
      verificationToken, // Provided for easy development / demo testing
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !user.passwordHash || !user.isActive) {
      await this.auditLogService.logEvent({
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        details: { email: dto.email, reason: 'Invalid email or user inactive' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    } catch (_err) {
      isPasswordValid = false;
    }
    if (!isPasswordValid) {
      await this.auditLogService.logEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        details: { email: dto.email, reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);
    await this.userService.setRefreshTokenHash(user.id, tokens.refreshToken);
    await this.userService.updateLastLogin(user.id);

    await this.auditLogService.logEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      details: { email: user.email, role: user.role.name },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: user.role.permissions,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'super-secret-refresh-key-change-in-prod',
      });

      const user = await this.userService.findById(payload.sub);
      if (!user || !user.refreshTokenHash) {
        throw new ForbiddenException('Access denied');
      }

      const isRefreshTokenValid = await argon2.verify(user.refreshTokenHash, refreshToken);
      if (!isRefreshTokenValid) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role.name);
      await this.userService.setRefreshTokenHash(user.id, tokens.refreshToken);

      await this.auditLogService.logEvent({
        userId: user.id,
        action: 'TOKEN_REFRESH',
        ipAddress,
        userAgent,
      });

      return tokens;
    } catch (e) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.userService.setRefreshTokenHash(userId, null);
    await this.auditLogService.logEvent({
      userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent,
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string, userAgent?: string) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been generated.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userService.setResetPasswordToken(user.id, resetToken, expires);

    await this.auditLogService.logEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      ipAddress,
      userAgent,
    });

    return {
      message: 'Password reset token generated successfully.',
      resetToken, // Returned for testing / frontend demo
    };
  }

  async resetPassword(token: string, newPassword: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    await this.userService.updatePassword(user.id, newPassword);

    await this.auditLogService.logEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      ipAddress,
      userAgent,
    });

    return {
      message: 'Password has been successfully updated. You may now login with your new password.',
    };
  }

  async verifyEmail(token: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userService.verifyEmail(user.id);

    await this.auditLogService.logEvent({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      ipAddress,
      userAgent,
    });

    return { message: 'Email verified successfully. Your account is fully active.' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-access-key-change-in-prod';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-key-change-in-prod';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
