import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIAssistantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string, title?: string, contextEntity?: string, contextEntityId?: string) {
    return this.prisma.aIConversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
        contextEntity: contextEntity || null,
        contextEntityId: contextEntityId || null,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findUserConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findConversationById(id: string, userId: string) {
    return this.prisma.aIConversation.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateConversationTitle(id: string, userId: string, title: string) {
    return this.prisma.aIConversation.updateMany({
      where: { id, userId, deletedAt: null },
      data: { title },
    });
  }

  async softDeleteConversation(id: string, userId: string) {
    return this.prisma.aIConversation.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }

  async addMessage(conversationId: string, role: string, content: string, toolCalls?: any) {
    const message = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        toolCalls: toolCalls || undefined,
      },
    });

    // Touch conversation updatedAt timestamp
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
