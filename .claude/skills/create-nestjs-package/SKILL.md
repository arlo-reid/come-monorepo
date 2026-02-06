---
name: create-nestjs-package
description: Create reusable NestJS packages for the SaaS monorepo. Use when adding a new shared NestJS module, creating common functionality like auth, caching, queues, or database modules that should be reusable across SaaS projects.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Create Reusable NestJS Package

Create shared NestJS packages that follow monorepo conventions and can be reused across SaaS applications.

## Package Location

All NestJS packages go in: `packages/nestjs-{name}/`

## Step-by-Step Process

### 1. Create Package Structure

```
packages/nestjs-{name}/
├── src/
│   ├── {name}.module.ts          # Main module with forRoot()/forRootAsync()
│   ├── {name}.service.ts         # Primary service (if needed)
│   ├── guards/                   # Guards (if needed)
│   ├── decorators/               # Decorators (if needed)
│   ├── strategies/               # Strategy implementations (if needed)
│   └── types/
│       └── {name}-options.interface.ts  # Module options interface
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

**Important**: Do NOT create barrel files (index.ts). Export each file directly via package.json exports.

### 2. Package.json Template

```json
{
  "name": "@repo/nestjs-{name}",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/{name}.module.js",
  "types": "./dist/{name}.module.d.ts",
  "exports": {
    ".": {
      "types": "./dist/{name}.module.d.ts",
      "default": "./dist/{name}.module.js"
    },
    "./module": {
      "types": "./dist/{name}.module.d.ts",
      "default": "./dist/{name}.module.js"
    },
    "./service": {
      "types": "./dist/{name}.service.d.ts",
      "default": "./dist/{name}.service.js"
    },
    "./types": {
      "types": "./dist/types/{name}-options.interface.d.ts",
      "default": "./dist/types/{name}-options.interface.js"
    }
  },
  "typesVersions": {
    "*": {
      "module": ["./dist/{name}.module.d.ts"],
      "service": ["./dist/{name}.service.d.ts"],
      "types": ["./dist/types/{name}-options.interface.d.ts"]
    }
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rm -rf dist",
    "dev": "tsc --watch",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "peerDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0"
  },
  "devDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^20.0.0",
    "reflect-metadata": "^0.2.0",
    "typescript": "^5.0.0"
  }
}
```

**Critical**: The `typesVersions` field is required for `moduleResolution: Node` compatibility. Without it, TypeScript won't resolve subpath imports like `@repo/nestjs-{name}/module`.

### 3. TSConfig Template

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/typescript-config/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Note**: Extends the shared `nestjs.json` config which includes CommonJS, decorators, and all NestJS-specific settings.

### 4. Module Pattern (Dynamic Module with forRoot)

Follow this pattern for configurable modules:

```typescript
// {name}.module.ts
import { DynamicModule, Module, Global } from '@nestjs/common';
import { {Name}Service } from './{name}.service';
import { {NAME}_OPTIONS } from './types/{name}-options.interface';
import type { {Name}ModuleOptions, {Name}ModuleAsyncOptions } from './types/{name}-options.interface';

@Global()
@Module({})
export class {Name}Module {
  static forRoot(options: {Name}ModuleOptions): DynamicModule {
    return {
      module: {Name}Module,
      providers: [
        {
          provide: {NAME}_OPTIONS,
          useValue: options,
        },
        {Name}Service,
      ],
      exports: [{Name}Service],
    };
  }

  static forRootAsync(options: {Name}ModuleAsyncOptions): DynamicModule {
    return {
      module: {Name}Module,
      imports: options.imports || [],
      providers: [
        {
          provide: {NAME}_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {Name}Service,
      ],
      exports: [{Name}Service],
    };
  }
}
```

### 5. Options Interface Pattern

```typescript
// types/{name}-options.interface.ts
import { ModuleMetadata } from '@nestjs/common';

export const {NAME}_OPTIONS = Symbol('{NAME}_OPTIONS');

export interface {Name}ModuleOptions {
  // Define configuration options here
}

export interface {Name}ModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: unknown[]) => Promise<{Name}ModuleOptions> | {Name}ModuleOptions;
  inject?: unknown[];
}
```

### 6. Service Pattern

```typescript
// {name}.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { {NAME}_OPTIONS, {Name}ModuleOptions } from './types/{name}-options.interface';

@Injectable()
export class {Name}Service implements OnModuleInit {
  constructor(
    @Inject({NAME}_OPTIONS)
    private readonly options: {Name}ModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    // Initialize connections, validate config, etc.
  }

  // Add service methods here
}
```

### 7. ESLint Config

Create `eslint.config.mjs`:

```javascript
import nestjsConfig from '@repo/eslint-config/nestjs';

export default nestjsConfig;
```

## After Creating the Package

1. **Run `pnpm install`** from workspace root to link the new package
2. **Build the package**: `cd packages/nestjs-{name} && pnpm build`
3. **Add to consuming app's package.json**:
   ```json
   "dependencies": {
     "@repo/nestjs-{name}": "workspace:*"
   }
   ```
4. **Also add `@repo/typescript-config`** to the consuming app's devDependencies (required for tsconfig extends):
   ```json
   "devDependencies": {
     "@repo/typescript-config": "workspace:*"
   }
   ```
5. **Run `pnpm install`** again to link in the app
6. **Import in app module**:
   ```typescript
   import { {Name}Module } from '@repo/nestjs-{name}/module';

   @Module({
     imports: [{Name}Module.forRoot({ /* options */ })],
   })
   export class AppModule {}
   ```

## Adding New Exports

When adding new files (guards, decorators, etc.), update both `exports` and `typesVersions` in package.json:

```json
{
  "exports": {
    "./guards/{guard-name}": {
      "types": "./dist/guards/{guard-name}.guard.d.ts",
      "default": "./dist/guards/{guard-name}.guard.js"
    }
  },
  "typesVersions": {
    "*": {
      "guards/{guard-name}": ["./dist/guards/{guard-name}.guard.d.ts"]
    }
  }
}
```

## Naming Conventions

- Package name: `@repo/nestjs-{name}` (lowercase, hyphenated)
- Module class: `{Name}Module` (PascalCase)
- Service class: `{Name}Service` (PascalCase)
- Options token: `{NAME}_OPTIONS` (SCREAMING_SNAKE_CASE Symbol)
- Options interface: `{Name}ModuleOptions` (PascalCase)

## Common SaaS Package Ideas

- `nestjs-auth` - Authentication with guards (Firebase, JWT, OAuth) ✅ Created
- `nestjs-cache` - Redis caching with decorators
- `nestjs-queue` - Background job processing (BullMQ)
- `nestjs-database` - Prisma/TypeORM setup with multi-tenancy
- `nestjs-logging` - Structured logging with correlation IDs
- `nestjs-health` - Health checks and readiness probes
- `nestjs-events` - Domain event publishing/subscribing
- `nestjs-multitenancy` - Tenant resolution and isolation

## Reference Implementations

- `packages/nestjs-config/` - Configuration with Google Secret Manager
- `packages/nestjs-auth/` - Firebase authentication with guards and decorators
