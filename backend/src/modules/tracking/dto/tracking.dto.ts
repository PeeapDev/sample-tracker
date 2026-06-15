import { IsNumber, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PingLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  // The active dispatch this rider is currently running, if any.
  @IsOptional()
  @IsString()
  dispatchId?: string;
}

export class ActiveRidersQueryDto {
  // Only return riders seen within this many minutes (default 10).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  withinMinutes?: number;
}
