import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// Database core provider
import { PrismaService } from './prisma.service';

// Storage driver provider
import { StorageService } from './storage/storage.service';

// Modules logic, services, and controllers
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';

import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';

import { QrService } from './qr/qr.service';
import { QrController } from './qr/qr.controller';

import { AnalyticsService } from './analytics/analytics.service';
import { AnalyticsController } from './analytics/analytics.controller';

@Module({
  imports: [
    // Configure default symmetric signing tokens
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'enterprise_jwt_secret_token_rotation_key_2026_spatial',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    AuthController,
    ProductsController,
    QrController,
    AnalyticsController,
  ],
  providers: [
    PrismaService,
    StorageService,
    AuthService,
    ProductsService,
    QrService,
    AnalyticsService,
  ],
  exports: [
    PrismaService,
    StorageService,
    ProductsService,
    QrService,
  ],
})
export class AppModule {}
