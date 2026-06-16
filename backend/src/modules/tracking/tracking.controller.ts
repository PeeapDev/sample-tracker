import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { PingLocationDto, ActiveRidersQueryDto } from './dto/tracking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Tracking')
@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // Riders ping their live position from the mobile app (only while on an
  // active dispatch). The riderId comes from the JWT, never the body.
  @Post('ping')
  @Roles(UserRole.DISPATCHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rider reports current GPS location' })
  async ping(@Body() dto: PingLocationDto, @Req() req) {
    return this.trackingService.ping(req.user.sub, dto);
  }

  // The live feed for the web console — riders seen recently, with their latest
  // position and active dispatch.
  @Get('riders')
  @Roles(
    UserRole.ADMIN,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
  )
  @ApiOperation({ summary: 'List active riders and their latest positions' })
  async activeRiders(@Query() query: ActiveRidersQueryDto) {
    return this.trackingService.getActiveRiders(query.withinMinutes ?? 10);
  }

  // Sample-centric convergence feed: every in-flight dispatch leg with its
  // origin, destination, sample count and live position — what the map uses to
  // draw samples converging on a hub from different facilities.
  @Get('legs')
  @Roles(
    UserRole.ADMIN,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
  )
  @ApiOperation({ summary: 'List active dispatch legs (sample convergence)' })
  async activeLegs(@Query() query: ActiveRidersQueryDto) {
    return this.trackingService.getActiveLegs(query.withinMinutes ?? 30);
  }
}
