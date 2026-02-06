import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadSecrets } from '@repo/nestjs-config/load-secrets';

import { AppModule } from './app.module';
import { ZenStackExceptionFilter } from './libs/db/zenstack-exception.filter';

async function bootstrap() {
  console.log('Bootstrapping application...');

  // Load secrets before NestJS bootstraps so they're available as env vars
  await loadSecrets();

  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for extra properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable type coercion
      },
    }),
  );

  // Enable global exception filter to convert ZenStack policy violations to 403
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ZenStackExceptionFilter(httpAdapter));

  // OpenAPI/Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Core API')
    .setDescription('The core API for the platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    jsonDocumentUrl: 'api/docs/json',
  });

  await app.listen(process.env.PORT ?? 8000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 8000}`,
  );
  console.log(
    `Swagger docs available at: http://localhost:${process.env.PORT ?? 8000}/api/docs`,
  );
}

bootstrap();
