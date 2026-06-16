import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushService, SaveSubscriptionInput } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationType } from '../../database/enums';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  // The VAPID public key the browser needs to create a push subscription.
  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get the VAPID public key for web push' })
  getVapidKey() {
    return { publicKey: this.pushService.publicKey };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Register this device for web push' })
  async subscribe(@Body() body: SaveSubscriptionInput, @Req() req) {
    await this.pushService.saveSubscription(req.user.sub, body);
    return { ok: true };
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Remove a device push subscription' })
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.pushService.removeSubscription(body.endpoint);
    return { ok: true };
  }

  // Sends a notification to the caller so they can confirm the bell, the badge
  // count and (if subscribed) web push all work end-to-end.
  @Post('test')
  @ApiOperation({ summary: 'Send a test notification to the current user' })
  async sendTest(@Req() req) {
    const n = await this.notificationsService.createNotification({
      type: NotificationType.SAMPLE_REGISTERED,
      title: 'Test notification',
      message: 'If you can see this, notifications are working. 🎉',
      userId: req.user.sub,
    });
    return { ok: true, id: n.id };
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  async findAll(@Req() req) {
    return this.notificationsService.findAll(req.user.sub, req.user.role);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  async findUnread(@Req() req) {
    return this.notificationsService.findUnread(req.user.sub, req.user.role);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.sub,
      req.user.role,
    );
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id);
    return { message: 'Marked as read' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.sub, req.user.role);
    return { message: 'All marked as read' };
  }
}
