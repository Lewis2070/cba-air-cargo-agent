import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FlightService } from './flight.service';
import { CreateFlightDto, UpdateFlightDto, FlightListQueryDto } from './dto/flight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Flights')
@Controller('flights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FlightController {
  constructor(private flightService: FlightService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new flight' })
  create(@Body() createFlightDto: CreateFlightDto) {
    return this.flightService.create(createFlightDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all flights' })
  findAll(@Query() query: FlightListQueryDto) {
    return this.flightService.findAll(query);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get flight statistics' })
  getStats(@Param('id') id: string) {
    return this.flightService.getFlightStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flight by ID' })
  findOne(@Param('id') id: string) {
    return this.flightService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update flight' })
  update(@Param('id') id: string, @Body() updateFlightDto: UpdateFlightDto) {
    return this.flightService.update(id, updateFlightDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete flight' })
  remove(@Param('id') id: string) {
    return this.flightService.remove(id);
  }
}
