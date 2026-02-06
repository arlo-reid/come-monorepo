---
name: code-review
description: Comprehensive code review for bounded context modules. Reviews domain, application, infrastructure, and interface layers for architectural compliance, DDD patterns, and best practices.
allowed-tools: Read, Glob, Grep, Task
---

# Bounded Context Code Review

Comprehensive code review agent that coordinates layer-specific reviews for bounded context modules following hexagonal architecture with CQRS.

## When to Use

- "Review the organisations module"
- "Code review the new billing context"
- "Review my changes to the users bounded context"
- "Check if the products module follows our patterns"
- After creating or extending a bounded context

## Overview

This skill orchestrates reviews across all four architectural layers:

1. **Domain Layer** - Aggregates, entities, events, value objects, domain services
2. **Application Layer** - Use cases, handlers, ports, event handlers
3. **Infrastructure Layer** - Repositories, persistence mappers, ORM schemas
4. **Interface Layer** - Controllers, DTOs, request/response mappers, Swagger

---

## Review Process

### Step 1: Identify Scope

Determine what to review:

**Full Context Review:**
```
apps/core-api/src/modules/{context}/
```

**Specific Layer Review:**
```
apps/core-api/src/modules/{context}/{layer}/
```

**Changed Files Only:**
Use git diff to identify modified files in the context.

### Step 2: Discover Files

For each layer, identify files to review:

```bash
# Domain layer
ls apps/core-api/src/modules/{context}/domain/**/*.ts

# Application layer
ls apps/core-api/src/modules/{context}/application/**/*.ts

# Infrastructure layer
ls apps/core-api/src/modules/{context}/infrastructure/**/*.ts

# Interface layer
ls apps/core-api/src/modules/{context}/interface/**/*.ts
```

### Step 3: Layer Reviews

Review each layer using the specialized review skills:

| Layer | Skill | Focus Areas |
|-------|-------|-------------|
| Domain | `code-review-domain` | Aggregates, events, encapsulation, DDD |
| Application | `code-review-application` | CQRS, handlers, ports, transactions |
| Infrastructure | `code-review-infrastructure` | Repositories, mappers, ORM |
| Interface | `code-review-interface` | Controllers, DTOs, Swagger, validation |

### Step 4: Cross-Layer Analysis

After individual reviews, check cross-cutting concerns:

**Dependency Direction:**
```
Interface → Application → Domain
              ↑
         Infrastructure
```

- Interface imports Application (handlers) and Domain (types)
- Application imports Domain only, defines Ports
- Infrastructure imports Application (ports) and Domain (entities)
- Domain imports nothing from other layers

**Naming Consistency:**
- Entity name consistent across all layers
- Command/Query names match handler names
- DTO names follow conventions

**Event Flow:**
- Domain events defined in domain layer
- Events emitted by aggregates
- Event handlers in application layer
- Repository publishes events via UoW

---

## Quick Review Checklist

### Domain Layer
- [ ] Aggregates extend `BaseEntity`
- [ ] Private constructor, static factories
- [ ] Events emitted on state changes
- [ ] No infrastructure imports

### Application Layer
- [ ] Handlers use `@Injectable()`
- [ ] Inject via port interfaces
- [ ] Mutations in `unitOfWork.withTransaction()`
- [ ] Command/Query use typed props

### Infrastructure Layer
- [ ] Repos extend `ZenStackRepositoryBase`
- [ ] Implement corresponding port
- [ ] `toDomain()` and `toPersistence()` mappers
- [ ] Soft delete filtering

### Interface Layer
- [ ] Full Swagger documentation
- [ ] class-validator on request DTOs
- [ ] Response mapper for domain → DTO
- [ ] Single-purpose controllers

---

## Review Output Format

```markdown
# Code Review: {ContextName} Bounded Context

## Summary
- **Files Reviewed:** {count}
- **Critical Issues:** {count}
- **Warnings:** {count}
- **Overall Score:** {score}/10

---

## Domain Layer

### Files Reviewed
- domain/aggregates/{entity}.aggregate.ts
- domain/events/*.event.ts

### Findings
- **[CRITICAL]** {issue} in {file}:{line}
- **[WARNING]** {issue} in {file}:{line}

### Score: {score}/10

---

## Application Layer

### Files Reviewed
- application/use-cases/**/*.ts
- application/ports/*.ts
- application/event-handlers/*.ts

### Findings
- **[CRITICAL]** {issue} in {file}:{line}
- **[WARNING]** {issue} in {file}:{line}

### Score: {score}/10

---

## Infrastructure Layer

### Files Reviewed
- infrastructure/persistence/**/*.ts
- infrastructure/persistence/orm/*.zmodel

### Findings
- **[CRITICAL]** {issue} in {file}:{line}
- **[WARNING]** {issue} in {file}:{line}

### Score: {score}/10

---

## Interface Layer

### Files Reviewed
- interface/commands/*.ts
- interface/queries/*.ts
- interface/dtos/*.ts
- interface/mappers/*.ts

### Findings
- **[CRITICAL]** {issue} in {file}:{line}
- **[WARNING]** {issue} in {file}:{line}

### Score: {score}/10

---

## Cross-Layer Analysis

### Dependency Direction
- {observation about dependency flow}

### Naming Consistency
- {observation about naming conventions}

### Event Flow
- {observation about domain events}

---

## Recommendations

### Critical (Must Fix)
1. {recommendation}

### High Priority
1. {recommendation}

### Suggested Improvements
1. {recommendation}

---

## Layer Scores Summary

| Layer | Score |
|-------|-------|
| Domain | {score}/10 |
| Application | {score}/10 |
| Infrastructure | {score}/10 |
| Interface | {score}/10 |
| **Overall** | **{score}/10** |
```

---

## Severity Levels

### Critical
Issues that must be fixed before merge:
- Security vulnerabilities
- Data integrity risks
- Broken architectural boundaries
- Missing required patterns (transactions, validation)

### Warning
Issues that should be addressed:
- Missing documentation
- Suboptimal patterns
- Potential bugs
- Inconsistent naming

### Suggestion
Optional improvements:
- Performance optimizations
- Code clarity
- Additional tests
- Enhanced error messages

---

## Common Cross-Layer Issues

### 1. Circular Dependencies
```
Application imports from Infrastructure  ← WRONG
Infrastructure should implement Application ports
```

### 2. Anemic Domain Model
```
Handler does all the work, aggregate is just data  ← WRONG
Business logic should live in aggregates
```

### 3. Missing Transaction Wrapper
```typescript
// WRONG - no transaction
await this.repository.save(entity);

// CORRECT - wrapped in transaction
await this.unitOfWork.withTransaction(async (tx) => {
  const repoWithTx = this.repository.withTransaction(tx, this.unitOfWork);
  await repoWithTx.save(entity);
});
```

### 4. DTO Leaking to Domain
```typescript
// WRONG - handler returns DTO
async execute(command: CreateCommand): Promise<ResponseDto>

// CORRECT - handler returns domain entity
async execute(command: CreateCommand): Promise<Entity>
```

### 5. Missing Swagger Documentation
```typescript
// WRONG - no documentation
@Post()
async handle(@Body() dto: CreateDto) { }

// CORRECT - fully documented
@Post()
@ApiOperation({ summary: 'Create entity' })
@ApiCreatedResponse({ type: ResponseDto })
async handle(@Body() dto: CreateDto) { }
```

---

## Usage Examples

### Review Entire Context

```
Review the organisations bounded context for architectural compliance
```

### Review Specific Layer

```
Review only the domain layer of the billing context
```

### Review Changed Files

```
Review the files I changed in the organisations module
```

### Review Before PR

```
Do a full code review of the users context before I create a PR
```

---

## Related Skills

- `code-review-domain` - Domain layer specific review
- `code-review-application` - Application layer specific review
- `code-review-infrastructure` - Infrastructure layer specific review
- `code-review-interface` - Interface layer specific review
- `create-bounded-context` - Create new bounded contexts
