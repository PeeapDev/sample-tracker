import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/require-permission.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('users.view')
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query('role') role?: string) {
    if (role) {
      return this.usersService.findByRole(role);
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission('users.view')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/card')
  @RequirePermission('users.view')
  @ApiOperation({
    summary: 'Full ID-card payload for a user (staffId + scannable QR + photo)',
  })
  async getCard(@Param('id') id: string) {
    return this.usersService.getCard(id);
  }

  @Post()
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivate(@Param('id') id: string) {
    await this.usersService.deactivate(id);
    return { message: 'User deactivated' };
  }

  @Patch(':id/activate')
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Activate user' })
  async activate(@Param('id') id: string) {
    await this.usersService.activate(id);
    return { message: 'User activated' };
  }
}
