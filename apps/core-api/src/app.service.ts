import { Injectable } from '@nestjs/common';
import { ConfigService } from '@repo/nestjs-config/service';

import { AppConfig } from './config/app.config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  getHello(): string {
    // Type-safe access to configuration
    const env = this.configService.config.NODE_ENV;
    const port = this.configService.config.PORT;
    console.log(this.configService.config.SKIP_SECRETS);

    // Check if secrets are loaded
    const secretsStatus = this.configService.hasSecret('DATABASE_URL')
      ? 'Secrets loaded from Google Secret Manager'
      : 'Running in local mode (SKIP_SECRETS=true)';

    return `Hello World! Running in ${env} on port ${port}. ${secretsStatus}`;
  }
}
