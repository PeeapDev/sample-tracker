import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { Notification } from '../../database/entities/notification.entity';
import { PushSubscription } from '../../database/entities/push-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, PushSubscription])],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
