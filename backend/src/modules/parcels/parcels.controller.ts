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
import { ParcelsService } from './parcels.service';
import {
  CreateParcelDto,
  UpdateParcelStatusDto,
  ScanParcelDto,
  ParcelFilterDto,
} from './dto/parcel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/require-permission.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Parcels')
@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post()
  @Roles(UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a return parcel (letters/supplies from the center)' })
  async create(@Body() dto: CreateParcelDto, @Req() req) {
    return this.parcelsService.create(dto, req.user.sub);
  }

  @Get()
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'List parcels with filters' })
  async findAll(@Query() filters: ParcelFilterDto) {
    return this.parcelsService.findAll(filters);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER)
  @ApiOperation({ summary: 'Parcel statistics' })
  async getStats() {
    return this.parcelsService.getStats();
  }

  // Scanning reuses the same samples.scan permission — a rider/officer who can
  // scan samples can scan parcels. The service enforces who advances each stage.
  @Post('scan')
  @UseGuards(PermissionsGuard)
  @RequirePermission('samples.scan')
  @ApiOperation({ summary: 'Scan a parcel QR to advance it (role-aware, GPS-logged)' })
  async scanAdvance(@Body() dto: ScanParcelDto, @Req() req) {
    return this.parcelsService.scanAdvance(dto.parcelId, req.user, dto);
  }

  @Get('scan/:parcelId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('samples.scan')
  @ApiOperation({ summary: 'Look up a parcel by parcelId (QR) without changing it' })
  async scan(@Param('parcelId') parcelId: string) {
    return this.parcelsService.findByParcelId(parcelId);
  }

  @Get(':id')
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get parcel by ID' })
  async findById(@Param('id') id: string) {
    return this.parcelsService.findById(id);
  }

  @Get(':id/timeline')
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get parcel timeline/event log' })
  async getTimeline(@Param('id') id: string) {
    const parcel = await this.parcelsService.findById(id);
    return this.parcelsService.getTimeline(parcel.parcelId);
  }

  @Patch(':id/status')
  @Roles(
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.COLLECTOR,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Update parcel status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateParcelStatusDto,
    @Req() req,
  ) {
    return this.parcelsService.updateStatus(id, dto, req.user.sub, req.user.facilityId);
  }
}
