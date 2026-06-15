import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsDateString,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SampleStatus } from '../../../database/enums';

export class CreateSampleDto {
  @IsString()
  sampleType: string;

  @IsString()
  diseaseProgram: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  facilityId: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  patientAge?: number;

  @IsOptional()
  @IsString()
  patientGender?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Optionally drop the sample straight into a batch/box at collection time.
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsDateString()
  collectedAt?: string;
}

export class UpdateSampleStatusDto {
  @IsEnum(SampleStatus)
  status: SampleStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  dispatcherId?: string;

  @IsOptional()
  @IsString()
  dispatchId?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}

export class ScanSampleDto {
  @IsString()
  sampleId: string;

  // Device GPS captured at the moment of the scan (chain-of-custody location).
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // 'advance' (default) moves the sample to its next stage; 'lost' flags it lost.
  @IsOptional()
  @IsIn(['advance', 'lost'])
  action?: 'advance' | 'lost';
}

export class CreateFeedbackDto {
  // 1–5 rating of the rider's delivery.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  riderRating?: number;

  // Sample condition on arrival.
  @IsOptional()
  @IsIn(['intact', 'compromised', 'damaged', 'leaking'])
  sampleCondition?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class SampleFilterDto {
  @IsOptional()
  @IsEnum(SampleStatus)
  status?: SampleStatus;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  diseaseProgram?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // Pagination. Omitted → the service returns a capped full set (back-compat).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}
