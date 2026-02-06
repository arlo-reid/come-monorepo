# Unified Testing Strategy

A comprehensive plan for API testing, E2E testing, and interactive API exploration in the monorepo.

## Status: ✅ Complete

All phases have been implemented. See notes below for remaining work.

## Goals

1. **Interactive exploration** - Bruno collections for manual testing and API documentation
2. **Automated API tests** - Playwright for CI/CD and regression testing
3. **API scenario tests** - Multi-step API flows testing real business scenarios
4. **E2E scenario tests** - Full user journey testing (browser-based)
5. **Multi-environment support** - Local, CI ephemeral, staging, custom environments
6. **Generation pipeline** - OpenAPI → Bruno for deterministic collection generation

---

## Implemented Structure

```
tests/
├── collections/                    # Bruno collections (interactive)
│   └── core-api/
│       ├── bruno.json             ✅
│       ├── environments/          ✅ (local, ci, staging)
│       ├── organisations/         ✅ (generated from OpenAPI)
│       ├── app/                   ✅ (generated)
│       └── devtools/              ✅ (generated)
│
├── api/                            # Playwright API tests (automated)
│   ├── core-api/organisations/
│   │   └── crud.spec.ts           ✅
│   ├── scenarios/
│   │   └── organisations.spec.ts  ✅
│   └── fixtures/
│       └── test-data.ts           ✅
│
├── e2e/                            # Playwright E2E tests (browser)
│   └── web/
│       └── home.spec.ts           ✅
│
├── utils/
│   ├── test-config.ts             ✅
│   └── api-helpers.ts             ✅
│
├── scripts/
│   └── generate-bruno.ts          ✅
│
├── playwright.config.ts           ✅
└── package.json                   ✅
```

---

## Phase 1: Bruno Setup & Folder Structure ✅

- [x] Create `tests/` directory at repo root
- [x] Create `tests/package.json` with Bruno CLI and Playwright
- [x] Create folder structure
- [x] Create `tests/collections/core-api/bruno.json`
- [x] Create environment files (local, ci, staging)
- [x] Add `tests` workspace to root `package.json`
- [x] Add test tasks to `turbo.json`

---

## Phase 2: Organisations Bruno Collection ✅

- [x] Bruno requests created via OpenAPI generation
- [x] Requests execute against local server (returns 401 - auth required)
- [x] Environment switching works

---

## Phase 3: OpenAPI → Bruno Generation Pipeline ✅

- [x] Install `@nestjs/swagger` in core-api
- [x] Configure SwaggerModule in `main.ts`
- [x] Swagger docs at `/api/docs`, JSON at `/api/docs/json`
- [x] Add decorators to organisations DTOs and controllers
- [x] Create `tests/scripts/generate-bruno.ts`
- [x] `npm run generate:bruno -w tests` works

---

## Phase 4: Playwright API Tests ✅

- [x] `tests/playwright.config.ts` with api, e2e-web, e2e-devtools projects
- [x] `tests/utils/test-config.ts` for environment configuration
- [x] `tests/api/core-api/organisations/crud.spec.ts` - CRUD tests
- [x] `tests/api/scenarios/organisations.spec.ts` - Scenario tests
- [x] `tests/api/fixtures/test-data.ts` - Data generators
- [x] npm scripts: `test:api`, `test:api:crud`, `test:api:scenarios`

**Note:** API tests return 401 (Unauthorized) because authentication is required. Tests will pass once auth is configured.

---

## Phase 5: Playwright E2E Tests ✅

- [x] Browser projects configured in playwright.config.ts
- [x] `tests/e2e/web/home.spec.ts` - Basic smoke test
- [x] npm script: `test:e2e`
- [x] Chromium browser installed

---

## Available Commands

```bash
# API Tests
npm run test:api -w tests              # All API tests
npm run test:api:crud -w tests         # CRUD tests only
npm run test:api:scenarios -w tests    # Scenario tests only

# E2E Tests
npm run test:e2e -w tests              # All E2E tests

# Bruno
npm run bruno:run -w tests             # Run Bruno collection
npm run generate:bruno -w tests        # Regenerate from OpenAPI

# All Tests
npm run test -w tests
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8000` | Core API URL |
| `WEB_BASE_URL` | `http://localhost:3000` | Web app URL |
| `DEVTOOLS_BASE_URL` | `http://localhost:5173` | Devtools UI URL |
| `TEST_ENV` | `local` | Environment identifier |

---

## Remaining Work

1. **Authentication for tests** - Add Firebase auth token handling to Playwright tests
2. **More E2E tests** - Add user journey tests as features are built
3. **CI/CD integration** - Add test workflows to CI pipeline
4. **Expand scenarios** - Add cross-module scenarios as new modules are added

---

## Notes

- Bruno collections are git-committed (plain text `.bru` files)
- OpenAPI spec should be regenerated when API changes (`npm run generate:bruno -w tests`)
- Playwright tests should be independent (create own data, clean up after)
- Scenario tests are valuable for catching integration issues that CRUD tests miss
