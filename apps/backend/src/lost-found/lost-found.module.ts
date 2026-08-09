import { Module } from '@nestjs/common';
import { LostFoundController } from './lost-found.controller';
import { LostFoundService } from './lost-found.service';
import { LostFoundRepository } from './lost-found.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LostFoundController],
  providers: [LostFoundService, LostFoundRepository],
  exports: [LostFoundService],
})
export class LostFoundModule {}
