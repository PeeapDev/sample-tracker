import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get('SUPABASE_URL');
    const key = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (url && key) {
      this.client = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    return this.client;
  }

  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string> {
    const { data, error } = await this.getClient()
      .storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) throw error;

    const { data: urlData } = this.getClient()
      .storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  async sendPushNotification(subscription: any, payload: any): Promise<void> {
    const pushPublicKey = this.configService.get('PUSH_PUBLIC_KEY');
    const pushPrivateKey = this.configService.get('PUSH_PRIVATE_KEY');

    if (!pushPublicKey || !pushPrivateKey) return;

    try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${pushPrivateKey}`,
        },
        body: JSON.stringify({
          to: subscription,
          notification: payload,
        }),
      });
    } catch (error) {
      console.error('Push notification failed:', error);
    }
  }
}
