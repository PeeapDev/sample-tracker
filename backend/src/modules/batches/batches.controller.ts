import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { CreateBatchDto, ScanBatchDto } from './dto/batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Batches')
@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(UserRole.COLLECTOR, UserRole.HUB_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Pack selected samples into a batch/box (generates a box QR)' })
  create(@Body() dto: CreateBatchDto, @Req() req) {
    return this.batchesService.create(dto, req.user.sub);
  }

  @Get()
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'List all batches' })
  findAll() {
    return this.batchesService.findAll();
  }

  @Post('scan')
  @Roles(UserRole.DISPATCHER, UserRole.HUB_OFFICER, UserRole.LAB_OFFICER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Scan a box QR to advance every sample inside (role-aware, GPS-logged)',
  })
  scanBatch(@Body() dto: ScanBatchDto, @Req() req) {
    return this.batchesService.scanBatch(dto.batchId, req.user, dto);
  }

  @Get('scan/:batchId')
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Scan a box QR to view its manifest (samples + data)' })
  scanManifest(@Param('batchId') batchId: string) {
    return this.batchesService.findByBatchId(batchId);
  }

  @Get(':id')
  @Roles(
    UserRole.COLLECTOR,
    UserRole.DISPATCHER,
    UserRole.HUB_OFFICER,
    UserRole.LAB_OFFICER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get a batch by ID with its sample manifest' })
  findById(@Param('id') id: string) {
    return this.batchesService.findById(id);
  }
}
