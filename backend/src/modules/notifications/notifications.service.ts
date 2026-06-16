import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { NotificationChannel, NotificationType } from '../../database/enums';
import { PushService } from './push.service';

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
    private pushService: PushService,
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

    // Fire the Web Push so it reaches the device even when the app is closed.
    // A specific recipient → their devices; a broadcast (no userId) → admins.
    const payload = {
      title: input.title,
      body: input.message,
      type: input.type,
      sampleId: input.sampleId,
      dispatchId: input.dispatchId,
      // Where clicking the OS notification should land — mirrors the in-app
      // routing (dispatch events open the dispatch, otherwise the sample).
      url: input.dispatchId
        ? `/dispatches?open=${input.dispatchId}`
        : input.sampleId
          ? `/samples?open=${input.sampleId}`
          : '/',
    };
    try {
      if (saved.userId) {
        await this.pushService.sendToUser(saved.userId, payload);
      } else {
        await this.pushService.sendToAdmins(payload);
      }
    } catch {
      // push is best-effort; the in-app notification is already saved
    }

    return saved;
  }

  // Admins also receive the network-wide "broadcast" copies (userId IS NULL)
  // that every sample event fires — so the admin bell reflects all activity,
  // not just notifications addressed to them personally.
  private isAdmin(role?: string): boolean {
    return role === 'admin';
  }

  async findAll(userId?: string, role?: string): Promise<Notification[]> {
    const where = this.isAdmin(role)
      ? [{ userId }, { userId: IsNull() }]
      : userId
        ? { userId }
        : {};

    return this.notificationRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findUnread(userId: string, role?: string): Promise<Notification[]> {
    const where = this.isAdmin(role)
      ? [
          { userId, isRead: false },
          { userId: IsNull(), isRead: false },
        ]
      : { userId, isRead: false };

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string, role?: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    // Admins also clear the broadcast copies they can see.
    if (this.isAdmin(role)) {
      await this.notificationRepository.update(
        { userId: IsNull(), isRead: false },
        { isRead: true },
      );
    }
  }

  async getUnreadCount(userId: string, role?: string): Promise<number> {
    const where = this.isAdmin(role)
      ? [
          { userId, isRead: false },
          { userId: IsNull(), isRead: false },
        ]
      : { userId, isRead: false };

    return this.notificationRepository.count({ where });
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
