import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto, UpdateFacilityDto } from './dto/facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Facilities')
@Controller('facilities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'List facilities (optionally filtered by type)' })
  findAll(@Query('type') type?: string) {
    return this.facilitiesService.findAll(type);
  }

  @Get(':id')
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get a facility by ID' })
  findById(@Param('id') id: string) {
    return this.facilitiesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a facility (hub / lab / health facility)' })
  create(@Body() dto: CreateFacilityDto) {
    return this.facilitiesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a facility (incl. type & GPS location)' })
  update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.facilitiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a facility' })
  remove(@Param('id') id: string) {
    return this.facilitiesService.remove(id);
  }
}
