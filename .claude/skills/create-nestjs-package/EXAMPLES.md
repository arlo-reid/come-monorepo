# NestJS Package Examples

Detailed examples for common SaaS package patterns.

## Example 1: Cache Module with Redis

### Structure

```
packages/nestjs-cache/
├── src/
│   ├── cache.module.ts
│   ├── cache.service.ts
│   ├── decorators/
│   │   └── cacheable.decorator.ts
│   └── types/
│       └── cache-options.interface.ts
├── package.json
└── tsconfig.json
```

### cache-options.interface.ts

```typescript
import { ModuleMetadata } from '@nestjs/common';

export const CACHE_OPTIONS = Symbol('CACHE_OPTIONS');

export interface CacheModuleOptions {
  host: string;
  port: number;
  password?: string;
  ttl?: number;  // Default TTL in seconds
  prefix?: string;  // Key prefix for multi-tenancy
}

export interface CacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: unknown[]) => Promise<CacheModuleOptions> | CacheModuleOptions;
  inject?: unknown[];
}
```

### cache.service.ts

```typescript
import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CACHE_OPTIONS, CacheModuleOptions } from './types/cache-options.interface';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    @Inject(CACHE_OPTIONS)
    private readonly options: CacheModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis({
      host: this.options.host,
      port: this.options.port,
      password: this.options.password,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private prefixKey(key: string): string {
    return this.options.prefix ? `${this.options.prefix}:${key}` : key;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(this.prefixKey(key));
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const seconds = ttl ?? this.options.ttl ?? 3600;
    await this.client.setex(
      this.prefixKey(key),
      seconds,
      JSON.stringify(value),
    );
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.prefixKey(key));
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    const pattern = this.prefixKey(`${prefix}:*`);
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
```

---

## Example 2: Auth Module with JWT

### Structure

```
packages/nestjs-auth/
├── src/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── types/
│       ├── auth-options.interface.ts
│       └── jwt-payload.interface.ts
├── package.json
└── tsconfig.json
```

### auth-options.interface.ts

```typescript
import { ModuleMetadata } from '@nestjs/common';

export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

export interface AuthModuleOptions {
  jwtSecret: string;
  jwtExpiresIn?: string;  // e.g., '1d', '7d'
  refreshTokenExpiresIn?: string;
  issuer?: string;
  audience?: string;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: unknown[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: unknown[];
}
```

### jwt-auth.guard.ts

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: Error, user: unknown) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
```

### current-user.decorator.ts

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
  tenantId?: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    return data ? user?.[data] : user;
  },
);
```

---

## Example 3: Multi-tenancy Module

### Structure

```
packages/nestjs-multitenancy/
├── src/
│   ├── multitenancy.module.ts
│   ├── tenant.service.ts
│   ├── middleware/
│   │   └── tenant-resolver.middleware.ts
│   ├── decorators/
│   │   └── tenant.decorator.ts
│   └── types/
│       └── multitenancy-options.interface.ts
├── package.json
└── tsconfig.json
```

### tenant-resolver.middleware.ts

```typescript
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Resolve tenant from subdomain, header, or JWT claim
    const tenantId = this.resolveTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('Tenant identifier required');
    }

    const isValid = await this.tenantService.validateTenant(tenantId);
    if (!isValid) {
      throw new BadRequestException('Invalid tenant');
    }

    req.tenantId = tenantId;
    next();
  }

  private resolveTenantId(req: Request): string | undefined {
    // Priority: Header > Subdomain > JWT claim
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) return headerTenant;

    const host = req.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
      }
    }

    // From JWT (if already authenticated)
    const user = req.user as { tenantId?: string } | undefined;
    return user?.tenantId;
  }
}
```

### tenant.decorator.ts

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

---

## Using forRootAsync with ConfigService

Common pattern for loading options from configuration:

```typescript
// In app.module.ts
import { CacheModule } from '@repo/nestjs-cache/module';
import { ConfigModule } from '@repo/nestjs-config/module';
import { ConfigService } from '@repo/nestjs-config/service';
import { AppConfig } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot(AppConfig),
    CacheModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        host: configService.config.REDIS_HOST,
        port: configService.config.REDIS_PORT,
        password: configService.getSecret('REDIS_PASSWORD'),
        ttl: 3600,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## Package.json with External Dependencies

When the package needs external npm dependencies:

```json
{
  "name": "@repo/nestjs-cache",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./module": {
      "types": "./dist/cache.module.d.ts",
      "default": "./dist/cache.module.js"
    },
    "./service": {
      "types": "./dist/cache.service.d.ts",
      "default": "./dist/cache.service.js"
    },
    "./decorators": {
      "types": "./dist/decorators/cacheable.decorator.d.ts",
      "default": "./dist/decorators/cacheable.decorator.js"
    }
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rm -rf dist",
    "dev": "tsc --watch",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "ioredis": "^5.3.0"
  },
  "peerDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@types/node": "^20.0.0",
    "reflect-metadata": "^0.2.0",
    "typescript": "^5.0.0"
  }
}
```
