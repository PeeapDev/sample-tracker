import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParcelStatus, ParcelType } from '../../../database/enums';

export class CreateParcelDto {
  @IsEnum(ParcelType)
  type: ParcelType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  originFacilityId?: string;

  @IsString()
  destinationFacilityId: string;

  @IsOptional()
  @IsString()
  riderId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateParcelStatusDto {
  @IsEnum(ParcelStatus)
  status: ParcelStatus;

  @IsOptional()
  @IsString()
  riderId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScanParcelDto {
  @IsString()
  parcelId: string;

  // 'advance' = move to the next stage; 'lost' = flag it lost/damaged.
  @IsOptional()
  @IsString()
  action?: 'advance' | 'lost';

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ParcelFilterDto {
  @IsOptional()
  @IsEnum(ParcelStatus)
  status?: ParcelStatus;

  @IsOptional()
  @IsEnum(ParcelType)
  type?: ParcelType;

  @IsOptional()
  @IsString()
  destinationFacilityId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
