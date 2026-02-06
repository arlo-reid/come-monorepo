---
name: update-bruno-collection
description: Regenerate Bruno API collections from OpenAPI spec. Use after adding or modifying API endpoints to keep interactive API documentation in sync.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Bruno Collection (Update & Generate)

Regenerate Bruno API collections from OpenAPI specification to keep interactive API testing collections in sync with the codebase.

## When to Use This Skill

- "Update Bruno collection for the new endpoints"
- "Regenerate Bruno requests from OpenAPI"
- "Sync Bruno with API changes"
- After adding new endpoints or controllers
- After modifying endpoint signatures or DTOs
- After adding Swagger decorators

## Collection Location

```
tests/
├── collections/
│   └── core-api/
│       ├── bruno.json              # Collection config
│       ├── environments/           # Environment configs
│       │   ├── local.bru
│       │   ├── ci.bru
│       │   └── staging.bru
│       ├── organisations/          # Generated from OpenAPI
│       │   ├── create-organisation.bru
│       │   └── delete-organisation.bru
│       └── {tag}/                  # Other endpoints by tag
│           └── {operation}.bru
```

## Generation Pipeline

```
[NestJS API] → [Swagger/OpenAPI] → [generate-bruno.ts] → [.bru files]
```

1. API endpoints decorated with `@ApiOperation`, `@ApiResponse`, etc.
2. Swagger generates OpenAPI spec at `/api/docs/json`
3. Generator script parses spec and creates Bruno `.bru` files
4. Bruno files are organized by tag (controller name)

## Commands

```bash
# Generate/update Bruno collection (requires API server running)
npm run generate:bruno -w tests

# Run Bruno collection (for testing)
npm run bruno:run -w tests
```

## Prerequisites

Before generating:

1. **API server must be running** at `http://localhost:8000` (or set `API_BASE_URL`)
2. **Swagger must be configured** in the API (already done in core-api)
3. **Controllers must have Swagger decorators**

## Swagger Decorators (Required for Generation)

For endpoints to be properly generated, add these decorators:

```typescript
// Controller level
@Controller('entities')
@ApiTags('entities')  // Groups endpoints in Bruno folder
export class CreateEntityHttpController {

  @Post()
  @ApiOperation({ summary: 'Create a new entity' })  // Names the Bruno request
  @ApiCreatedResponse({
    description: 'Entity created successfully',
    type: EntityResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async handle(@Body() dto: CreateEntityRequestDto): Promise<EntityResponseDto> {
    // ...
  }
}
```

## Generated .bru File Format

```bru
meta {
  name: Create a new entity
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/entities
  body: json
  auth: bearer
}

auth:bearer {
  token: {{authToken}}
}

body:json {
  {
    "name": "Example Entity",
    "field": "value"
  }
}

assert {
  res.status: eq 201
}

docs {
  Creates a new entity in the system.
}
```

## Environment Variables

The generator uses these environment variables in `.bru` files:

| Variable | Description | Source |
|----------|-------------|--------|
| `{{baseUrl}}` | API base URL | `environments/*.bru` |
| `{{authToken}}` | Bearer token | `environments/*.bru` |

Environment files (`tests/collections/core-api/environments/`):

```bru
# local.bru
vars {
  baseUrl: http://localhost:8000
  authToken: <your-local-token>
}
```

## Workflow

### After Adding New Endpoint

1. Add Swagger decorators to the controller
2. Ensure server is running: `npm run dev -w apps/core-api`
3. Generate Bruno collection: `npm run generate:bruno -w tests`
4. Verify in Bruno UI or commit the `.bru` files

### After Modifying Endpoint

1. Update Swagger decorators if signature changed
2. Regenerate: `npm run generate:bruno -w tests`
3. Review changes in `.bru` files
4. Commit updated files

### Manual .bru Files

You can also create manual `.bru` files for:
- Complex test sequences
- Custom assertions
- Pre-request scripts
- Environment-specific tests

Place manual files alongside generated ones; they won't be overwritten unless they have the same name as a generated file.

## Generator Script

Location: `tests/scripts/generate-bruno.ts`

The generator:
1. Fetches OpenAPI spec from `/api/docs/json`
2. Groups endpoints by tag (first tag on operation)
3. Creates folder per tag
4. Generates `.bru` file per operation
5. Includes example request bodies from schema
6. Adds assertions based on response codes

## Troubleshooting

### "Failed to fetch OpenAPI spec"

- Ensure API server is running
- Check URL: `http://localhost:8000/api/docs/json`
- Verify `API_BASE_URL` environment variable if using custom URL

### Missing endpoints in collection

- Check controller has `@ApiTags()` decorator
- Check operation has `@ApiOperation()` decorator
- Verify controller is imported in module

### Wrong request body

- Add `@ApiProperty()` decorators to DTO properties
- Add `example` to `@ApiProperty({ example: 'value' })`

## Checklist

- [ ] API server running locally
- [ ] New endpoints have Swagger decorators
- [ ] Run `npm run generate:bruno -w tests`
- [ ] Review generated `.bru` files
- [ ] Test requests in Bruno UI
- [ ] Commit `.bru` files to git

## Reference

- See `tests/scripts/generate-bruno.ts` for generator implementation
- See `tests/collections/core-api/organisations/` for example output
- Bruno docs: https://docs.usebruno.com/
