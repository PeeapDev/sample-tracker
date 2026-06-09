import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SamplesController } from './samples.controller';
import { SamplesService } from './samples.service';
import { Sample } from '../../database/entities/sample.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sample, EventLog]),
    NotificationsModule,
  ],
  controllers: [SamplesController],
  providers: [SamplesService],
  exports: [SamplesService],
})
export class SamplesModule {}
