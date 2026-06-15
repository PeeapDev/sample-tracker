import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/require-permission.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get full dashboard data' })
  async getFullDashboard() {
    return this.dashboardService.getFullDashboard();
  }

  @Get('operational')
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get operational metrics' })
  async getOperationalMetrics() {
    return this.dashboardService.getOperationalMetrics();
  }

  @Get('management')
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get management metrics' })
  async getManagementMetrics() {
    return this.dashboardService.getManagementMetrics();
  }

  @Get('collection-volume')
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get collection volume over time' })
  async getCollectionVolume(@Query('days') days?: number) {
    return this.dashboardService.getCollectionVolume(days || 30);
  }

  @Get('status-distribution')
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get sample status distribution' })
  async getStatusDistribution() {
    return this.dashboardService.getStatusDistribution();
  }

  @Get('program-distribution')
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get disease program distribution' })
  async getProgramDistribution() {
    return this.dashboardService.getProgramDistribution();
  }

  @Get('recent-activity')
  @RequirePermission('dashboard.view')
  @ApiOperation({ summary: 'Get recent activity feed' })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit || 20);
  }
}
