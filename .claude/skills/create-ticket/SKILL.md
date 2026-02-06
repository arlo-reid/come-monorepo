---
name: create-ticket
description: Create comprehensive Linear tickets for new features with domain model, implementation tasks, Bruno collection updates, and scenario tests. Use when planning new bounded contexts, features, or significant enhancements.
allowed-tools: Read, Glob, Grep, mcp__linear__*
---

# Create Ticket (Linear)

Create comprehensive, well-structured Linear tickets for new features following the project's hexagonal architecture patterns.

## When to Use This Skill

- "Create a ticket for adding memberships"
- "Let's plan the billing feature as a ticket"
- "Make a Linear issue for user notifications"
- When starting a new bounded context
- When planning significant feature enhancements

## Prerequisites

- Linear MCP server connected
- Understanding of existing domain model (read relevant aggregates/entities)

## Ticket Structure

Every ticket should include these sections:

### 1. Overview
A 2-3 sentence summary of what the feature does and why it's needed.

### 2. User Stories
User-centric descriptions of capabilities:
```markdown
**As a [role], I can:**
- [capability 1]
- [capability 2]
```

### 3. Domain Model
Technical design showing new aggregates, entities, value objects:
```markdown
### New: `{Entity}` Aggregate
\`\`\`typescript
interface {Entity}Props {
  id: string;
  // fields...
}
\`\`\`

### New: `{ValueObject}` Value Object
\`\`\`typescript
enum {ValueObject} {
  VALUE_1 = 'VALUE_1',
}
\`\`\`
```

### 4. Implementation Tasks
Phased checklist following hexagonal architecture:
```markdown
### Phase 1: Domain Layer
- [ ] Create `{Entity}` aggregate
- [ ] Create domain events

### Phase 2: Application Layer
- [ ] `{Action}{Entity}Command`
- [ ] `{Action}{Entity}Handler`

### Phase 3: Infrastructure Layer
- [ ] ZenStack schema
- [ ] Repository implementation

### Phase 4: Interface Layer
- [ ] HTTP controllers
- [ ] DTOs and mappers

### Phase 5: Integration & Testing
- [ ] Update Bruno collection
- [ ] Add scenario tests
```

### 5. Bruno Collection Updates
List the API endpoints that will need Bruno `.bru` files:
```markdown
## Bruno Collection Updates

After implementation, regenerate Bruno collection (`npm run generate:bruno -w tests`).

**New endpoints to document:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/entities` | Create entity |
| GET | `/entities/:id` | Get entity by ID |
| DELETE | `/entities/:id` | Delete entity |
```

### 6. Scenarios
Test scenarios that will form the basis for `tests/api/scenarios/` tests:
```markdown
## Scenarios

These scenarios form the basis for API scenario tests in `tests/api/scenarios/{context}.spec.ts`.

### Scenario 1: Complete Lifecycle
**Given** a user is authenticated
**When** they create → read → update → delete an entity
**Then** each operation succeeds and the entity is gone after deletion

### Scenario 2: Duplicate Handling
**Given** an entity with unique field X exists
**When** user tries to create another entity with same X
**Then** API returns 409 Conflict

### Scenario 3: Cross-Entity Workflow
**Given** a parent entity exists
**When** user creates a child entity linked to parent
**Then** the relationship is established and queryable

### Scenario 4: Authorization
**Given** user A owns an entity
**When** user B tries to modify it
**Then** API returns 403 Forbidden
```

### 7. Technical Considerations
Notes on relationships, authorization, backwards compatibility.

### 8. Out of Scope
Explicit list of what's NOT included to prevent scope creep.

## Workflow

### Step 1: Gather Context
Before creating the ticket, understand the existing domain:
```bash
# Read relevant aggregates
Read apps/core-api/src/modules/{related-context}/domain/aggregates/*.ts

# Check existing patterns
Glob apps/core-api/src/modules/**/domain/**/*.ts
```

### Step 2: List Linear Team
```typescript
mcp__linear__list_teams()
```

### Step 3: Create the Issue
```typescript
mcp__linear__create_issue({
  team: "Team Name",
  title: "Add {Feature} bounded context with {capability}",
  labels: ["Feature"],
  description: `## Overview
...full markdown content...`
})
```

## Template: Membership-style Feature

```markdown
## Overview

{Brief description of what the feature enables and why it's valuable.}

## User Stories

**As a user, I can:**
- {Capability 1}
- {Capability 2}

**As an admin, I can:**
- {Admin capability 1}
- {Admin capability 2}

## Domain Model

### New: `{Entity}` Aggregate
\`\`\`typescript
interface {Entity}Props {
  id: string;
  // Core fields
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

### New: `{Status}` Value Object
\`\`\`typescript
enum {Status} {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
\`\`\`

## Implementation Tasks

### Phase 1: Domain Layer
- [ ] Create `{Status}` value object
- [ ] Create `{Entity}` aggregate with domain events
- [ ] Domain events: `{Entity}CreatedEvent`, `{Entity}DeletedEvent`

### Phase 2: Application Layer
- [ ] `Create{Entity}Command` / `Handler`
- [ ] `Delete{Entity}Command` / `Handler`
- [ ] `Get{Entity}Query` / `Handler`
- [ ] `List{Entities}Query` / `Handler`

### Phase 3: Infrastructure Layer
- [ ] Add `{Entity}` ZenStack schema
- [ ] Create `{Entity}WriteRepository`
- [ ] Create `{Entity}ReadRepository`
- [ ] Create `{Entity}PersistenceMapper`

### Phase 4: Interface Layer
- [ ] POST `/{entities}` - Create
- [ ] GET `/{entities}/:id` - Get by ID
- [ ] GET `/{entities}` - List (paginated)
- [ ] DELETE `/{entities}/:id` - Delete
- [ ] Request/Response DTOs
- [ ] Swagger decorators

### Phase 5: Integration & Testing
- [ ] Regenerate Bruno collection
- [ ] Add CRUD tests
- [ ] Add scenario tests

## Bruno Collection Updates

After implementation, regenerate Bruno collection:
\`\`\`bash
npm run generate:bruno -w tests
\`\`\`

**New endpoints to document:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/{entities}` | Create {entity} |
| GET | `/{entities}/:id` | Get {entity} by ID |
| GET | `/{entities}` | List {entities} (paginated) |
| DELETE | `/{entities}/:id` | Delete {entity} |

## Scenarios

These scenarios form the basis for API scenario tests.

### Scenario 1: Complete Lifecycle
**Given** a user is authenticated
**When** they create a {entity}, then read it, then delete it
**Then** each operation succeeds and the {entity} is gone after deletion

**Test steps:**
1. POST `/{entities}` → 201, capture ID
2. GET `/{entities}/{id}` → 200
3. DELETE `/{entities}/{id}` → 204
4. GET `/{entities}/{id}` → 404

### Scenario 2: Duplicate Handling
**Given** a {entity} with unique field exists
**When** user tries to create another with same unique field
**Then** API returns 409 Conflict

### Scenario 3: Pagination
**Given** 15 {entities} exist
**When** user requests page 1 with limit 10
**Then** API returns 10 items with hasMore=true

### Scenario 4: Authorization
**Given** user A owns a {entity}
**When** user B (non-admin) tries to delete it
**Then** API returns 403 Forbidden

## Technical Considerations

- **Relationship to existing model**: {How this integrates with existing entities}
- **Authorization**: {How permissions will be checked}
- **Backwards compatibility**: {Any migration considerations}

## Out of Scope (Future)
- {Future enhancement 1}
- {Future enhancement 2}
```

## Checklist

- [ ] Read relevant existing aggregates for context
- [ ] Include all 8 sections in ticket
- [ ] User stories cover all user roles
- [ ] Domain model uses project conventions (typed constructors, value objects)
- [ ] Implementation tasks follow hexagonal architecture phases
- [ ] Bruno endpoints table matches interface layer endpoints
- [ ] Scenarios cover: lifecycle, duplicates, edge cases, authorization
- [ ] Technical considerations address integration with existing code
- [ ] Out of scope explicitly lists what's NOT included

## Reference

- See `apps/core-api/src/modules/organisations/` for domain model patterns
- See `apps/core-api/src/modules/users/` for role/permission patterns
- See `tests/api/scenarios/organisations.spec.ts` for scenario test format
- See `tests/collections/core-api/` for Bruno collection structure
