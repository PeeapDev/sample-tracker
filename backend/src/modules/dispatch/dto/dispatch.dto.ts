import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  IsArray,
} from 'class-validator';
import { DispatchStatus } from '../../database/enums';

export class CreateDispatchDto {
  @IsString()
  riderId: string;

  @IsString()
  originFacilityId: string;

  @IsString()
  destinationFacilityId: string;

  @IsArray()
  @IsString({ each: true })
  sampleIds: string[];

  @IsOptional()
  @IsString()
  coolerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDispatchStatusDto {
  @IsEnum(DispatchStatus)
  status: DispatchStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DispatchFilterDto {
  @IsOptional()
  @IsEnum(DispatchStatus)
  status?: DispatchStatus;

  @IsOptional()
  @IsString()
  riderId?: string;

  @IsOptional()
  @IsString()
  originFacilityId?: string;

  @IsOptional()
  @IsString()
  destinationFacilityId?: string;
}
