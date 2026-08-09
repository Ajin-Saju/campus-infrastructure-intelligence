import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { AIAssistantService } from './ai-assistant.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@UseGuards(JwtAuthGuard)
@Controller('ai-assistant')
export class AIAssistantController {
  constructor(private readonly aiAssistantService: AIAssistantService) {}

  @Post('conversations')
  async createConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.aiAssistantService.createConversation(
      user,
      dto.title,
      dto.contextEntity,
      dto.contextEntityId,
      dto.initialMessage,
    );
  }

  @Get('conversations')
  async getUserConversations(@CurrentUser() user: any) {
    return this.aiAssistantService.getUserConversations(user);
  }

  @Get('conversations/:id')
  async getConversationById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.aiAssistantService.getConversationById(user, id);
  }

  @Patch('conversations/:id')
  async renameConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.aiAssistantService.renameConversation(user, id, dto.title);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.aiAssistantService.deleteConversation(user, id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiAssistantService.sendMessage(
      user,
      id,
      dto.content,
      dto.contextEntity,
      dto.contextEntityId,
    );
  }

  @Post('messages')
  async sendMessageDirect(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiAssistantService.sendMessage(
      user,
      dto.conversationId,
      dto.content,
      dto.contextEntity,
      dto.contextEntityId,
    );
  }

  @Sse('stream')
  streamMessage(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ): Observable<MessageEvent> {
    return from(
      this.aiAssistantService.sendMessage(
        user,
        dto.conversationId,
        dto.content,
        dto.contextEntity,
        dto.contextEntityId,
      ),
    ).pipe(
      map((result) => ({
        data: JSON.stringify(result),
      })),
    );
  }
}
