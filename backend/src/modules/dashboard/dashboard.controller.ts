import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER)
  @ApiOperation({ summary: 'Get full dashboard data' })
  async getFullDashboard() {
    return this.dashboardService.getFullDashboard();
  }

  @Get('operational')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER)
  @ApiOperation({ summary: 'Get operational metrics' })
  async getOperationalMetrics() {
    return this.dashboardService.getOperationalMetrics();
  }

  @Get('management')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get management metrics' })
  async getManagementMetrics() {
    return this.dashboardService.getManagementMetrics();
  }

  @Get('collection-volume')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER)
  @ApiOperation({ summary: 'Get collection volume over time' })
  async getCollectionVolume(@Query('days') days?: number) {
    return this.dashboardService.getCollectionVolume(days || 30);
  }

  @Get('status-distribution')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER)
  @ApiOperation({ summary: 'Get sample status distribution' })
  async getStatusDistribution() {
    return this.dashboardService.getStatusDistribution();
  }

  @Get('program-distribution')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER)
  @ApiOperation({ summary: 'Get disease program distribution' })
  async getProgramDistribution() {
    return this.dashboardService.getProgramDistribution();
  }

  @Get('recent-activity')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER)
  @ApiOperation({ summary: 'Get recent activity feed' })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit || 20);
  }
}
