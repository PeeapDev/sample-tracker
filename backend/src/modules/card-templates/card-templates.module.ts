import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardTemplate } from '../../database/entities/card-template.entity';
import { CardTemplatesController } from './card-templates.controller';
import { CardTemplatesService } from './card-templates.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([CardTemplate]), PermissionsModule],
  controllers: [CardTemplatesController],
  providers: [CardTemplatesService],
})
export class CardTemplatesModule {}
