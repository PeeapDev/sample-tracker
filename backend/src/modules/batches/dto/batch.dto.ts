import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateBatchDto {
  // The individual samples (their UUID ids) to pack into this box. Optional so a
  // batch can be created empty (e.g. on-the-fly from the collect form) and have
  // samples assigned to it afterwards.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sampleIds?: string[];

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddSamplesDto {
  // Samples to move into this batch — each entry may be a human sample code
  // (e.g. NSR-ABC123-XY12, from a scan) or an internal UUID. Samples already in
  // another batch are moved here, keeping their origin facility.
  @IsArray()
  @IsString({ each: true })
  sampleIds: string[];
}

export class ScanBatchDto {
  @IsString()
  batchId: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['advance', 'lost'])
  action?: 'advance' | 'lost';
}
