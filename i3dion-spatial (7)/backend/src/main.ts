import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('I3DIONSpatialGateway');
  const app = await NestFactory.create(AppModule);

  // Enable global validation filters for all ingress packages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global versioning prefix path rule
  app.setGlobalPrefix('api/v1');

  // Configure CORS for cross-domain mobile deployment & dashboard connectivity
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Documentation Setup for Enterprise Developers
  const swaggerConfig = new DocumentBuilder()
    .setTitle('I3DION Spatial Enterprise API')
    .setDescription('Production-grade REST endpoints supporting real-time industrial 3D AR loading, pipeline asset compression, QR scans tracking, and device telemetry.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`================================================================`);
  logger.log(`  I3DION SPATIAL GATEWAY ACTIVE AT: http://localhost:${port}/api/v1 `);
  logger.log(`  SWAGGER DEV SPECIFICATION OPEN AT: http://localhost:${port}/api/docs`);
  logger.log(`================================================================`);
}
bootstrap();
