import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { Batch } from '../../database/entities/batch.entity';
import { Sample } from '../../database/entities/sample.entity';
import { SamplesModule } from '../samples/samples.module';

@Module({
  imports: [TypeOrmModule.forFeature([Batch, Sample]), SamplesModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
