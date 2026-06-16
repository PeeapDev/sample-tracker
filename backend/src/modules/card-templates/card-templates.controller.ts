import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardTemplatesService } from './card-templates.service';
import { SaveCardTemplateDto } from './dto/card-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/require-permission.decorator';

@ApiTags('Card Templates')
@Controller('card-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CardTemplatesController {
  constructor(private readonly service: CardTemplatesService) {}

  @Get()
  @RequirePermission('users.view')
  @ApiOperation({ summary: 'List saved ID-card templates' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Save a new ID-card template' })
  create(@Body() dto: SaveCardTemplateDto, @Req() req) {
    return this.service.create(dto, req.user?.sub);
  }

  @Patch(':id')
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Update an ID-card template' })
  update(@Param('id') id: string, @Body() dto: SaveCardTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('users.manage')
  @ApiOperation({ summary: 'Delete an ID-card template' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
