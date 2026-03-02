import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure body parser with increased limit (for JSON payloads)
  // Note: File uploads use multipart/form-data and bypass this limit
  const bodyParserLimit = process.env.BODY_PARSER_LIMIT || '10mb';
  app.use(bodyParser.json({ limit: bodyParserLimit }));
  app.use(bodyParser.urlencoded({ limit: bodyParserLimit, extended: true }));

  // Enable cookie parser
  app.use(cookieParser());

  // Enable helmet with CORS policy for static files
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded from different origins
    }),
  );

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Register global response interceptor (wraps success responses in { success, data })
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Configure CORS with explicit settings for multiple frontends
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = frontendUrl.split(',').map((url) => url.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-workspace-id'],
    exposedHeaders: ['Set-Cookie', 'x-workspace-id'],
  });

  // Serve static files from uploads directory
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  logger.log(`Serving static files from: ${uploadsPath}`);

  // Serve static files from public directory (for branding)
  const publicPath = join(process.cwd(), 'public');
  app.useStaticAssets(publicPath, {
    prefix: '/public/',
  });
  logger.log(`Serving static files from: ${publicPath}`);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
