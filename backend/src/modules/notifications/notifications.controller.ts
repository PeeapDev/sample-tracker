import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  async findAll(@Req() req) {
    return this.notificationsService.findAll(req.user.sub);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  async findUnread(@Req() req) {
    return this.notificationsService.findUnread(req.user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
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
    await this.notificationsService.markAllAsRead(req.user.sub);
    return { message: 'All marked as read' };
  }
}
