import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ValidateQrDto } from './dto/validate-qr.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr-code')
export class QrCodeController {
  constructor(private readonly qrService: QrCodeService) {}

  // ==================== ROOM QR CODES (ADMIN ONLY) ====================

  @Roles('ADMIN')
  @Get('room/:roomId')
  async getRoomQr(@Param('roomId') roomId: string) {
    return this.qrService.getRoomQr(roomId);
  }

  @Roles('ADMIN')
  @Post('room/:roomId/generate')
  async generateRoomQr(
    @Param('roomId') roomId: string,
    @Body() dto: GenerateQrDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.qrService.generateRoomQr(roomId, dto.regenerate, performingUserId);
  }

  // ==================== ASSET QR CODES (ADMIN ONLY) ====================

  @Roles('ADMIN')
  @Get('asset/:assetId')
  async getAssetQr(@Param('assetId') assetId: string) {
    return this.qrService.getAssetQr(assetId);
  }

  @Roles('ADMIN')
  @Post('asset/:assetId/generate')
  async generateAssetQr(
    @Param('assetId') assetId: string,
    @Body() dto: GenerateQrDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.qrService.generateAssetQr(assetId, dto.regenerate, performingUserId);
  }

  // ==================== AUTOMATIC LOCATION IDENTIFICATION (ALL ROLES) ====================

  @Post('validate')
  async validateQr(@Body() dto: ValidateQrDto) {
    return this.qrService.validateAndResolveQr(dto.qrData);
  }
}

