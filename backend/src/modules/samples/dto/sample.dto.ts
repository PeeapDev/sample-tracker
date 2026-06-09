import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';
import { SampleStatus } from '../../database/enums';

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
}
