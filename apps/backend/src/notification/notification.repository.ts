import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link || null,
        read: false,
      },
    });
  }

  async findUserNotifications(userId: string, limit = 50, read?: boolean) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(read !== undefined ? { read } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
        deletedAt: null,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }
}
