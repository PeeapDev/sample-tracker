import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import {
  CreateDispatchDto,
  UpdateDispatchStatusDto,
  DispatchFilterDto,
} from './dto/dispatch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Dispatches')
@Controller('dispatches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post()
  @Roles(UserRole.HUB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new dispatch' })
  async create(@Body() dto: CreateDispatchDto, @Req() req) {
    return this.dispatchService.create(dto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all dispatches' })
  async findAll(@Query() filters: DispatchFilterDto) {
    return this.dispatchService.findAll(filters);
  }

  @Get('rider-stats')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER)
  @ApiOperation({ summary: 'Get rider utilization stats' })
  async getRiderStats() {
    return this.dispatchService.getRiderStats();
  }

  @Get(':id')
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get dispatch by ID' })
  async findById(@Param('id') id: string) {
    return this.dispatchService.findById(id);
  }

  @Get(':id/samples')
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get samples in a dispatch' })
  async getSamples(@Param('id') id: string) {
    return this.dispatchService.getDispatchSamples(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update dispatch status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDispatchStatusDto,
    @Req() req,
  ) {
    return this.dispatchService.updateStatus(id, dto, req.user.sub);
  }
}
