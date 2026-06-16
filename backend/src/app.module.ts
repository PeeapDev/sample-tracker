import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SamplesModule } from './modules/samples/samples.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { BatchesModule } from './modules/batches/batches.module';
import { ParcelsModule } from './modules/parcels/parcels.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { CardTemplatesModule } from './modules/card-templates/card-templates.module';
import { SupabaseService } from './services/supabase.service';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    SamplesModule,
    DispatchModule,
    FacilitiesModule,
    BatchesModule,
    ParcelsModule,
    TrackingModule,
    NotificationsModule,
    DashboardModule,
    PermissionsModule,
    CardTemplatesModule,
  ],
  providers: [
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
