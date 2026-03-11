import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FlightModule } from './modules/flight/flight.module';
import { BookingModule } from './modules/booking/booking.module';
import { CapacityModule } from './modules/capacity/capacity.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    FlightModule,
    BookingModule,
    CapacityModule,
    RevenueModule,
    UserModule,
  ],
})
export class AppModule {}
