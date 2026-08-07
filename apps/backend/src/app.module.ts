import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BuildingModule } from './building/building.module';
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
