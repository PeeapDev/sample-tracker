import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { Sample } from '../../database/entities/sample.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispatch, Sample, EventLog]),
    NotificationsModule,
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
