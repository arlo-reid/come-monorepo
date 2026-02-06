---
name: code-review-interface
description: Review interface layer code (HTTP controllers, DTOs, request/response mappers, Swagger decorators) for API design, validation, and proper separation from business logic.
allowed-tools: Read, Glob, Grep
---

# Interface Layer Code Review

Review interface layer code for proper API design, validation, documentation, and separation from business logic.

## When to Use

- Reviewing HTTP controllers
- Reviewing request/response DTOs
- Reviewing interface mappers
- Reviewing Swagger/OpenAPI decorators
- Reviewing GraphQL resolvers (if applicable)

## Interface Layer Location

`apps/core-api/src/modules/{context}/interface/`

## Structure

```
interface/
├── commands/
│   └── {action}-{entity}.command.http.ts
├── queries/
│   └── {query-name}.query.http.ts
├── mappers/
│   ├── {entity}.request.mapper.ts
│   └── {entity}.response.mapper.ts
└── dtos/
    ├── {action}-{entity}.request.dto.ts
    └── {entity}.response.dto.ts
```

---

## Review Checklist

### HTTP Controllers

**Structure:**

- [ ] Single responsibility (one action per controller class)
- [ ] Named: `{Action}{Entity}HttpController`
- [ ] Uses `@Controller('{context-plural}')` decorator
- [ ] Has single public `handle()` method

**NestJS Decorators:**

- [ ] `@Controller()` with proper route prefix
- [ ] HTTP method decorator (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`)
- [ ] `@HttpCode()` for non-default status codes
- [ ] `@Body()`, `@Param()`, `@Query()` for input binding

**Swagger Documentation (required):**

- [ ] `@ApiTags('{ContextName}')` - groups endpoints
- [ ] `@ApiBearerAuth()` - if authenticated
- [ ] `@ApiOperation({ summary: '...' })` - describes endpoint
- [ ] `@ApiResponse()` decorators for each status code
- [ ] `@ApiParam()` for path parameters with examples

**Flow Pattern:**

```typescript
async handle(@Body() dto: RequestDto): Promise<ResponseDto> {
  // 1. Map DTO to Command/Query (via mapper)
  const command = Mapper.toCommand(dto);

  // 2. Execute handler
  const result = await this.handler.execute(command);

  // 3. Map domain entity to Response DTO
  return ResponseMapper.toDto(result);
}
```

**Example Pattern:**

```typescript
@ApiTags('Organisations')
@ApiBearerAuth()
@Controller('organisations')
export class CreateOrganisationHttpController {
  constructor(private readonly handler: CreateOrganisationHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organisation' })
  @ApiCreatedResponse({
    description: 'Organisation created successfully',
    type: OrganisationResponseDto,
  })
  @ApiConflictResponse({ description: 'Slug already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Body() dto: CreateOrganisationRequestDto,
  ): Promise<OrganisationResponseDto> {
    const command = OrganisationRequestMapper.toCreateCommand(dto);
    const organisation = await this.handler.execute(command);
    return OrganisationResponseMapper.toDto(organisation);
  }
}
```

**Common Issues:**

```typescript
// BAD - business logic in controller
@Post()
async handle(@Body() dto: CreateDto): Promise<ResponseDto> {
  if (dto.name.length < 2) {  // WRONG: validation in controller
    throw new BadRequestException();
  }
  const entity = new Entity();  // WRONG: creating entities here
  entity.name = dto.name;
}

// GOOD - delegate to handler
@Post()
async handle(@Body() dto: CreateDto): Promise<ResponseDto> {
  const command = Mapper.toCommand(dto);  // Just mapping
  const result = await this.handler.execute(command);  // Delegate
  return ResponseMapper.toDto(result);  // Just mapping
}
```

```typescript
// BAD - missing Swagger documentation
@Post()
async handle(@Body() dto: CreateDto) { }

// GOOD - fully documented
@Post()
@ApiOperation({ summary: 'Create entity' })
@ApiCreatedResponse({ type: ResponseDto })
@ApiBadRequestResponse({ description: 'Invalid input' })
async handle(@Body() dto: CreateDto) { }
```

---

### Request DTOs

**Structure:**

- [ ] Named: `{Action}{Entity}RequestDto`
- [ ] Located in `interface/dtos/`
- [ ] Properties use `!` definite assignment assertion
- [ ] Uses class-validator decorators for validation
- [ ] Uses Swagger decorators for documentation

**Validation Decorators:**

- [ ] `@IsString()`, `@IsNumber()`, `@IsBoolean()` - type validation
- [ ] `@MinLength()`, `@MaxLength()` - string constraints
- [ ] `@IsOptional()` - for optional fields
- [ ] `@Matches()` - for pattern validation
- [ ] Custom error messages for user-friendly feedback

**Swagger Decorators:**

- [ ] `@ApiProperty()` for required fields
- [ ] `@ApiPropertyOptional()` for optional fields
- [ ] Include `description`, `example`, constraints

**Example Pattern:**

```typescript
export class CreateOrganisationRequestDto {
  @ApiProperty({
    description: 'The name of the organisation',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-friendly identifier',
    example: 'acme-corporation',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;
}
```

**Common Issues:**

```typescript
// BAD - no validation
export class CreateUserDto {
  name: string;  // No validation!
  email: string;
}

// GOOD - proper validation
export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;
}
```

```typescript
// BAD - no Swagger docs
export class CreateUserDto {
  @IsString()
  name!: string;
}

// GOOD - documented
export class CreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  name!: string;
}
```

---

### Response DTOs

**Structure:**

- [ ] Named: `{Entity}ResponseDto`
- [ ] Located in `interface/dtos/`
- [ ] Contains only serializable data (strings, numbers, booleans, nested DTOs)
- [ ] Uses Swagger decorators for documentation
- [ ] Dates as ISO strings

**Swagger Documentation:**

- [ ] All properties have `@ApiProperty()`
- [ ] Include `description` and `example` for each
- [ ] Nested objects use appropriate DTO types

**Example Pattern:**

```typescript
export class OrganisationResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 'org_abc123',
  })
  id!: string;

  @ApiProperty({
    description: 'Organisation name',
    example: 'Acme Corporation',
  })
  name!: string;

  @ApiProperty({
    description: 'URL-friendly identifier',
    example: 'acme-corporation',
  })
  slug!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: string;  // ISO string, not Date

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: string;
}
```

**Common Issues:**

```typescript
// BAD - Date type (not JSON serializable as expected)
export class ResponseDto {
  createdAt!: Date;
}

// GOOD - ISO string
export class ResponseDto {
  createdAt!: string;  // Controller mapper converts Date to ISO string
}
```

```typescript
// BAD - exposing internal fields
export class UserResponseDto {
  passwordHash!: string;  // NEVER expose
  internalNotes!: string;  // Internal only
}
```

---

### Interface Mappers

**Purpose:**
- Convert between DTOs and domain commands
- Convert between domain entities and response DTOs
- Keep controllers thin and focused

**Types:**

| Mapper | Direction | Location |
|--------|-----------|----------|
| `{Entity}RequestMapper` | DTO → Command | `interface/mappers/` |
| `{Entity}ResponseMapper` | Entity → DTO | `interface/mappers/` |

**Structure:**

- [ ] Static class with static methods
- [ ] Named clearly: `{Entity}RequestMapper`, `{Entity}ResponseMapper`
- [ ] Methods named: `toCommand()`, `toDto()`, `toListDto()`
- [ ] Handle type conversions (Dates, enums)

**Example Patterns:**

```typescript
// Request Mapper
export class OrganisationRequestMapper {
  static toCreateCommand(
    dto: CreateOrganisationRequestDto,
  ): CreateOrganisationCommand {
    return new CreateOrganisationCommand({
      name: dto.name,
      slug: dto.slug,
    });
  }

  static toUpdateCommand(
    slug: string,
    dto: UpdateOrganisationRequestDto,
  ): UpdateOrganisationCommand {
    return new UpdateOrganisationCommand({
      slug,
      name: dto.name,
    });
  }
}
```

```typescript
// Response Mapper
export class OrganisationResponseMapper {
  static toDto(entity: Organisation): OrganisationResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toListDto(entities: Organisation[]): OrganisationResponseDto[] {
    return entities.map((e) => this.toDto(e));
  }
}
```

**Common Issues:**

```typescript
// BAD - mapping in controller
@Post()
async handle(@Body() dto: CreateDto) {
  const command = new CreateCommand({  // Mapping inline
    name: dto.name,
    slug: dto.slug,
  });
}

// GOOD - use mapper
@Post()
async handle(@Body() dto: CreateDto) {
  const command = RequestMapper.toCreateCommand(dto);
}
```

---

## Swagger Best Practices

### Response Status Codes

| Status | Decorator | Use Case |
|--------|-----------|----------|
| 200 | `@ApiOkResponse()` | Successful GET, PUT, PATCH |
| 201 | `@ApiCreatedResponse()` | Successful POST (create) |
| 204 | `@ApiNoContentResponse()` | Successful DELETE |
| 400 | `@ApiBadRequestResponse()` | Validation errors |
| 401 | `@ApiUnauthorizedResponse()` | Missing/invalid auth |
| 403 | `@ApiForbiddenResponse()` | Insufficient permissions |
| 404 | `@ApiNotFoundResponse()` | Resource not found |
| 409 | `@ApiConflictResponse()` | Uniqueness violation |

### Path Parameters

```typescript
@Delete(':slug')
@ApiParam({
  name: 'slug',
  description: 'URL-friendly identifier',
  example: 'acme-corporation',
})
async handle(@Param('slug') slug: string) { }
```

### Query Parameters (Pagination)

```typescript
@Get()
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
async handle(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) { }
```

---

## Red Flags

### Critical Issues

1. **Business Logic in Controller** - Controllers should only map and delegate
2. **Missing Validation** - DTOs without class-validator decorators
3. **Missing Swagger Docs** - Undocumented endpoints
4. **Direct Entity Exposure** - Returning domain entities without mapping
5. **Security Data in Response** - Exposing passwords, tokens, internal IDs

### Warnings

1. **Missing Error Responses** - No `@ApiNotFoundResponse()` etc.
2. **Inconsistent Naming** - DTO/controller naming doesn't follow convention
3. **Missing Examples** - Swagger properties without examples
4. **Large DTOs** - Consider splitting or using composition

---

## Report Format

```markdown
## Interface Layer Review: {ContextName}

### Files Reviewed
- {file1}
- {file2}

### Critical Issues
- **[CRITICAL]** {issue description} in {file}:{line}
  - Problem: {explanation}
  - Fix: {suggested fix}

### Warnings
- **[WARNING]** {issue description} in {file}:{line}
  - {explanation}

### Swagger Coverage
- Endpoints documented: {count}/{total}
- Response codes documented: {yes/no}
- Examples provided: {yes/no}

### Validation Coverage
- Request DTOs with validation: {count}/{total}
- Custom error messages: {yes/no}

### Suggestions
- {suggestion for improvement}

### Compliance Score
- API Design: {score}/10
- Documentation: {score}/10
- Validation: {score}/10
- Overall: {score}/10
```
