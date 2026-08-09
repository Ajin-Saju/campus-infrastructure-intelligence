import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BuildingModule } from './building/building.module';
import { AssetModule } from './asset/asset.module';
import { QrCodeModule } from './qr-code/qr-code.module';
import { IssueModule } from './issue/issue.module';
import { AiModule } from './ai/ai.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { VendorModule } from './vendor/vendor.module';
import { NotificationModule } from './notification/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { LostFoundModule } from './lost-found/lost-found.module';
import { AIAssistantModule } from './ai-assistant/ai-assistant.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuditLogModule,
    UserModule,
    AuthModule,
    BuildingModule,
    AssetModule,
    QrCodeModule,
    IssueModule,
    AiModule,
    MaintenanceModule,
    VendorModule,
    NotificationModule,
    DashboardModule,
    SearchModule,
    LostFoundModule,
    AIAssistantModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
