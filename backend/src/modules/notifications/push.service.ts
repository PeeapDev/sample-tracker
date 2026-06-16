import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from '../../database/entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  type?: string;
  sampleId?: string;
  url?: string;
}

export interface SaveSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

/// Thin wrapper over `web-push`. Configures VAPID once and delivers payloads to
/// a user's (or all admins') stored device subscriptions, pruning any that the
/// push service reports as gone (404/410).
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
  ) {
    const pub = process.env.PUSH_PUBLIC_KEY;
    const priv = process.env.PUSH_PRIVATE_KEY;
    if (pub && priv) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@nsrtms.gov.sl',
        pub,
        priv,
      );
      this.enabled = true;
    } else {
      this.logger.warn('Web push disabled — PUSH_PUBLIC_KEY/PUSH_PRIVATE_KEY not set');
    }
  }

  get publicKey(): string | null {
    return process.env.PUSH_PUBLIC_KEY || null;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async saveSubscription(userId: string, input: SaveSubscriptionInput): Promise<void> {
    await this.subscriptions.upsert(
      {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent,
      },
      ['endpoint'],
    );
  }

  async removeSubscription(endpoint: string): Promise<void> {
    await this.subscriptions.delete({ endpoint });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;
    const list = await this.subscriptions.find({ where: { userId } });
    await this.deliver(list, payload);
  }

  /// Broadcast events (no specific recipient) push to every admin's devices.
  async sendToAdmins(payload: PushPayload): Promise<void> {
    if (!this.enabled) return;
    const list = await this.subscriptions
      .createQueryBuilder('s')
      .innerJoin('s.user', 'u')
      .where('u.role = :role', { role: 'admin' })
      .getMany();
    await this.deliver(list, payload);
  }

  private async deliver(list: PushSubscription[], payload: PushPayload): Promise<void> {
    if (list.length === 0) return;
    const body = JSON.stringify(payload);
    await Promise.all(
      list.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
        } catch (err: any) {
          // 404/410 → the subscription is dead; drop it so we stop trying.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await this.subscriptions.delete({ endpoint: s.endpoint }).catch(() => {});
          } else {
            this.logger.warn(`push send failed (${err?.statusCode ?? '?'})`);
          }
        }
      }),
    );
  }
}
