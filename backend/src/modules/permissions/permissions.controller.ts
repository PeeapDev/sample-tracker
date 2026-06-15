import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ALL_PERMISSIONS } from './permissions.constants';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the role → permission matrix' })
  async getMatrix() {
    return {
      permissions: ALL_PERMISSIONS,
      matrix: await this.permissionsService.getMatrix(),
    };
  }

  @Put(':role')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.manage')
  @ApiOperation({ summary: 'Replace the permissions for a role' })
  async setRole(@Param('role') role: string, @Body() body: { permissions: string[] }) {
    await this.permissionsService.setRole(role, body?.permissions ?? []);
    return this.permissionsService.getMatrix();
  }

  @Post('reset')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.manage')
  @ApiOperation({ summary: 'Reset the matrix to defaults' })
  async reset() {
    await this.permissionsService.resetDefaults();
    return this.permissionsService.getMatrix();
  }
}
