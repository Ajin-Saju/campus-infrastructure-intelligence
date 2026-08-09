import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly gateway: NotificationGateway,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string,
  ) {
    try {
      // 1. Save in-app notification to database
      const notif = await this.repository.createNotification(
        userId,
        title,
        message,
        type,
        link,
      );

      // 2. Push real-time WebSocket event
      this.gateway.emitToUser(userId, 'notification:new', notif);

      // 3. Dispatch Email Notification asynchronously
      const recipient = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      if (recipient?.email) {
        const html = this.emailService.generateNotificationHtml(
          title,
          message,
          type,
          link,
        );
        this.emailService.sendEmail(
          recipient.email,
          `Campus Alert: ${title}`,
          html,
        );
      }

      return notif;
    } catch (err) {
      this.logger.error(`Error sending notification to user ${userId}`, err);
    }
  }

  async getUserNotifications(userId: string, limit = 50) {
    return this.repository.findUserNotifications(userId, limit);
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.repository.countUnread(userId);
    return { unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    await this.repository.markAsRead(id, userId);
    const unreadCount = await this.repository.countUnread(userId);
    this.gateway.emitToUser(userId, 'notification:unread_count', { unreadCount });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);
    this.gateway.emitToUser(userId, 'notification:unread_count', { unreadCount: 0 });
    return { success: true };
  }

  async deleteNotification(id: string, userId: string) {
    await this.repository.deleteNotification(id, userId);
    return { success: true };
  }
}
