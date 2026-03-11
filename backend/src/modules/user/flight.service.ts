import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFlightDto, UpdateFlightDto, FlightListQueryDto } from './dto/flight.dto';

@Injectable()
export class FlightService {
  constructor(private prisma: PrismaService) {}

  async create(createFlightDto: CreateFlightDto) {
    return this.prisma.flights.create({
      data: {
        flight_number: createFlightDto.flightNumber,
        flight_date: new Date(createFlightDto.flightDate),
        departure_airport: createFlightDto.departureAirport,
        arrival_airport: createFlightDto.arrivalAirport,
        aircraft_type: createFlightDto.aircraftType,
        capacity_weight: createFlightDto.capacityWeight,
        capacity_volume: createFlightDto.capacityVolume,
        capacity_pieces: createFlightDto.capacityPieces,
        status: 'scheduled',
      },
    });
  }

  async findAll(query: FlightListQueryDto) {
    const { page = 1, limit = 20, status, departure, arrival, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (departure) where.departure_airport = departure;
    if (arrival) where.arrival_airport = arrival;
    if (dateFrom || dateTo) {
      where.flight_date = {};
      if (dateFrom) where.flight_date.gte = new Date(dateFrom);
      if (dateTo) where.flight_date.lte = new Date(dateTo);
    }

    const [flights, total] = await Promise.all([
      this.prisma.flights.findMany({
        where,
        skip,
        take: limit,
        orderBy: { flight_date: 'asc' },
      }),
      this.prisma.flights.count({ where }),
    ]);

    return {
      data: flights,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const flight = await this.prisma.flights.findUnique({
      where: { id },
      include: {
        bookings: {
          take: 10,
          orderBy: { booking_date: 'desc' },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException(`Flight ${id} not found`);
    }

    return flight;
  }

  async update(id: string, updateFlightDto: UpdateFlightDto) {
    const data: any = {};
    
    if (updateFlightDto.flightNumber) data.flight_number = updateFlightDto.flightNumber;
    if (updateFlightDto.flightDate) data.flight_date = new Date(updateFlightDto.flightDate);
    if (updateFlightDto.departureAirport) data.departure_airport = updateFlightDto.departureAirport;
    if (updateFlightDto.arrivalAirport) data.arrival_airport = updateFlightDto.arrivalAirport;
    if (updateFlightDto.aircraftType) data.aircraft_type = updateFlightDto.aircraftType;
    if (updateFlightDto.capacityWeight) data.capacity_weight = updateFlightDto.capacityWeight;
    if (updateFlightDto.capacityVolume) data.capacity_volume = updateFlightDto.capacityVolume;
    if (updateFlightDto.status) data.status = updateFlightDto.status;

    return this.prisma.flights.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.flights.delete({
      where: { id },
    });
  }

  async getFlightStats(id: string) {
    const flight = await this.findOne(id);
    
    return {
      flightId: id,
      flightNumber: flight.flight_number,
      date: flight.flight_date,
      capacity: {
        weight: flight.capacity_weight,
        volume: flight.capacity_volume,
        pieces: flight.capacity_pieces,
      },
      booked: {
        weight: flight.booked_weight,
        volume: flight.booked_volume,
        pieces: flight.booked_pieces,
        bookingCount: flight.booking_count,
      },
      utilization: {
        weight: flight.capacity_weight > 0 
          ? (flight.booked_weight / flight.capacity_weight * 100).toFixed(1) + '%'
          : '0%',
        volume: flight.capacity_volume > 0
          ? (flight.booked_volume / flight.capacity_volume * 100).toFixed(1) + '%'
          : '0%',
      },
      revenue: {
        total: flight.total_revenue,
        cost: flight.total_cost,
        profit: flight.total_revenue - flight.total_cost,
      },
    };
  }
}
