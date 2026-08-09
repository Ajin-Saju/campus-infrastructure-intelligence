import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AIAssistantController } from './ai-assistant.controller';
import { AIAssistantService } from './ai-assistant.service';
import { AIAssistantRepository } from './ai-assistant.repository';
import { AIAssistantTools } from './tools/ai-assistant-tools';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AIAssistantController],
  providers: [AIAssistantService, AIAssistantRepository, AIAssistantTools],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}
