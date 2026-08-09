import { Module } from '@nestjs/common';
import { QrCodeController } from './qr-code.controller';
import { QrCodeService } from './qr-code.service';
import { QrCodeRepository } from './qr-code.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [QrCodeController],
  providers: [QrCodeService, QrCodeRepository],
  exports: [QrCodeService, QrCodeRepository],
})
export class QrCodeModule {}
