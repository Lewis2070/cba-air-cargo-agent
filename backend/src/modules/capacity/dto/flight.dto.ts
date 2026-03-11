import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFlightDto {
  @ApiProperty({ example: 'CA1001' })
  @IsString()
  flightNumber: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  flightDate: string;

  @ApiProperty({ example: 'PVG' })
  @IsString()
  departureAirport: string;

  @ApiProperty({ example: 'LAX' })
  @IsString()
  arrivalAirport: string;

  @ApiProperty({ example: 'B777' })
  @IsString()
  aircraftType: string;

  @ApiProperty({ example: 80000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  capacityWeight: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  capacityVolume: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacityPieces?: number;
}

export class UpdateFlightDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flightNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  flightDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departureAirport?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  arrivalAirport?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aircraftType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacityWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacityVolume?: number;

  @ApiPropertyOptional({ example: 'scheduled' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class FlightListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'scheduled' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'PVG' })
  @IsOptional()
  @IsString()
  departure?: string;

  @ApiPropertyOptional({ example: 'LAX' })
  @IsOptional()
  @IsString()
  arrival?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
