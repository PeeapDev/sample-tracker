import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parcel } from '../../database/entities/parcel.entity';
import { ParcelEvent } from '../../database/entities/parcel-event.entity';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Parcel, ParcelEvent]), PermissionsModule],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
