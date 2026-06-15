import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsBoolean,
} from 'class-validator';

const FACILITY_TYPES = ['health_facility', 'hub', 'laboratory'];

export class CreateFacilityDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsIn(FACILITY_TYPES)
  type: string;

  @IsString()
  district: string;

  @IsOptional()
  @IsString()
  chiefdom?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateFacilityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(FACILITY_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  chiefdom?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
