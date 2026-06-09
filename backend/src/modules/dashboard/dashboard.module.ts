import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Sample } from '../../database/entities/sample.entity';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { User } from '../../database/entities/user.entity';
import { Facility } from '../../database/entities/facility.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sample, Dispatch, EventLog, User, Facility])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
