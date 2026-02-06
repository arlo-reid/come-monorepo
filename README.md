# Monorepo

## Testing

This monorepo has a unified testing strategy using Playwright and Bruno.

### Test Structure

```
tests/
├── collections/          # Bruno collections (interactive API testing)
├── api/                  # Playwright API tests (automated)
│   ├── core-api/        # CRUD tests per module
│   └── scenarios/       # Multi-step business flows
├── e2e/                 # Playwright E2E tests (browser)
│   └── web/
└── scripts/             # Generation utilities
```

### Running Tests

```bash
# Start the applications first
npm run dev

# Run all API tests
npm run test:api -w tests

# Run CRUD tests only
npm run test:api:crud -w tests

# Run scenario tests only
npm run test:api:scenarios -w tests

# Run E2E browser tests
npm run test:e2e -w tests

# Run all tests
npm run test -w tests
```

### Interactive API Testing (Bruno)

Bruno collections provide interactive API exploration:

```bash
# Run Bruno collection via CLI
npm run bruno:run -w tests

# Or open Bruno app and import from tests/collections/core-api
```

### Targeting Different Environments

```bash
# Local (default)
npm run test:api -w tests

# CI/CD ephemeral environment
API_BASE_URL=https://pr-123.preview.example.com npm run test:api -w tests

# Staging
API_BASE_URL=https://staging.example.com npm run test:api -w tests
```

### Regenerating Bruno from OpenAPI

When API endpoints change, regenerate Bruno collections:

```bash
# Ensure core-api is running, then:
npm run generate:bruno -w tests
```

### API Documentation

Swagger UI is available at `http://localhost:8000/api/docs` when core-api is running.

---

# DEV Container helpers

## Restart Proxy

`docker compose -p tpl-monorepo-v6_devcontainer -f .devcontainer/docker-compose.yml up -d --force-recreate proxy`
