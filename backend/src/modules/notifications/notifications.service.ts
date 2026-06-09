import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { NotificationChannel, NotificationType } from '../../database/enums';

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  sampleId?: string;
  dispatchId?: string;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...input,
      channel: input.channel || NotificationChannel.PUSH,
    });

    const saved = await this.notificationRepository.save(notification);

    if (input.channel === NotificationChannel.SMS && input.userId) {
      await this.sendSms(input.userId, input.message);
    }

    return saved;
  }

  async findAll(userId?: string): Promise<Notification[]> {
    const where: any = {};
    if (userId) where.userId = userId;

    return this.notificationRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  private async sendSms(userId: string, message: string): Promise<void> {
    const smsApiKey = process.env.SMS_API_KEY;
    if (!smsApiKey) return;

    try {
      await fetch('https://sms-gateway.example.com/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${smsApiKey}`,
        },
        body: JSON.stringify({
          to: userId,
          message,
          senderId: process.env.SMS_SENDER_ID || 'NSRTMS',
        }),
      });
    } catch (error) {
      console.error('SMS send failed:', error);
    }
  }
}
