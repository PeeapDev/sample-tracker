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
import { SamplesService } from './samples.service';
import {
  CreateSampleDto,
  UpdateSampleStatusDto,
  ScanSampleDto,
  SampleFilterDto,
  CreateFeedbackDto,
} from './dto/sample.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/require-permission.decorator';
import { UserRole, SampleStatus } from '../../database/enums';

@ApiTags('Samples')
@Controller('samples')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}

  @Post()
  @Roles(UserRole.COLLECTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new sample' })
  async create(@Body() dto: CreateSampleDto, @Req() req) {
    return this.samplesService.create(dto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.COLLECTOR, UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all samples with filters' })
  async findAll(@Query() filters: SampleFilterDto) {
    return this.samplesService.findAll(filters);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER)
  @ApiOperation({ summary: 'Get sample statistics' })
  async getStats() {
    return this.samplesService.getStats();
  }

  @Get('district-stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get district-level statistics' })
  async getDistrictStats() {
    return this.samplesService.getDistrictStats();
  }

  // Scanning (camera) is open to any role with the samples.scan permission,
  // toggleable per role from the admin Roles & Permissions page. The service
  // still enforces who may advance a sample to each next stage.
  @Post('scan')
  @UseGuards(PermissionsGuard)
  @RequirePermission('samples.scan')
  @ApiOperation({
    summary: 'Scan a QR to advance the sample to its next stage (role-aware, GPS-logged)',
  })
  async scanAdvance(@Body() dto: ScanSampleDto, @Req() req) {
    return this.samplesService.scanAdvance(dto.sampleId, req.user, dto);
  }

  @Get('scan/:sampleId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('samples.scan')
  @ApiOperation({ summary: 'Look up a sample by sampleId (QR code) without changing it' })
  async scan(@Param('sampleId') sampleId: string) {
    return this.samplesService.findBySampleId(sampleId);
  }

  @Get(':id')
  @Roles(UserRole.COLLECTOR, UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sample by ID' })
  async findById(@Param('id') id: string) {
    return this.samplesService.findById(id);
  }

  @Get(':id/timeline')
  @Roles(UserRole.COLLECTOR, UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sample timeline/event log' })
  async getTimeline(@Param('id') id: string) {
    const sample = await this.samplesService.findById(id);
    return this.samplesService.getTimeline(sample.sampleId);
  }

  @Get(':id/feedback')
  @Roles(UserRole.COLLECTOR, UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List feedback (rider rating + sample condition) for a sample' })
  async getFeedback(@Param('id') id: string) {
    return this.samplesService.getFeedback(id);
  }

  @Post(':id/feedback')
  @Roles(UserRole.COLLECTOR, UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Leave feedback on a sample handoff (rider rating + condition)' })
  async addFeedback(
    @Param('id') id: string,
    @Body() dto: CreateFeedbackDto,
    @Req() req,
  ) {
    return this.samplesService.addFeedback(id, dto, req.user.sub);
  }

  @Patch(':id/status')
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update sample status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSampleStatusDto,
    @Req() req,
  ) {
    return this.samplesService.updateStatus(
      id,
      dto,
      req.user.sub,
      req.user.facilityId,
    );
  }

  @Patch(':id/lost')
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark sample as lost' })
  async markLost(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req,
  ) {
    return this.samplesService.markLost(id, req.user.sub, notes);
  }
}
