---
name: code-review
description: Flexible code review for any part of the monorepo - modules, packages, apps, or git changes
argument: Optional scope specification (e.g., "organisations", "libs/ui", "apps/web", or leave empty to review git changes)
---

# Code Review

## Scope Detection

Determine what to review based on `$ARGUMENTS`:

### If No Arguments Provided
Review files changed in the current git session:
```bash
git diff --name-only HEAD
git diff --name-only --cached
git status --porcelain
```

### If Arguments Provided
Parse the scope from `$ARGUMENTS`. The user may specify:

| Input Pattern | Interpretation |
|---------------|----------------|
| `organisations` | Bounded context at `apps/core-api/src/modules/organisations/` |
| `organisations domain` | Only domain layer of organisations module |
| `organisations application` | Only application layer of organisations module |
| `libs/ui` or `packages/ui` | UI package at `packages/ui/` |
| `libs/nestjs-auth` | NestJS auth package |
| `apps/web` | Next.js web app |
| `apps/devtools-ui` | Vite React devtools app |
| `apps/core-api` | Entire NestJS API (not a specific module) |
| `core-api` | Same as above |
| File path | Specific file or directory |

---

## Technology Detection

After identifying the scope, detect the technology stack:

### NestJS Backend (`apps/core-api`)
- Look for `nest-cli.json`, `@nestjs/*` dependencies
- Uses hexagonal architecture with CQRS
- Bounded contexts in `src/modules/{context}/`
- Layers: domain, application, infrastructure, interface

### Next.js Frontend (`apps/web`)
- Look for `next.config.js`, `next` dependency
- App router in `app/` or pages in `pages/`
- React Server Components, API routes

### Vite React (`apps/devtools-ui`)
- Look for `vite.config.ts`, `vite` dependency
- Standard React SPA patterns
- Component-based architecture

### NestJS Packages (`packages/nestjs-*`)
- Reusable NestJS modules
- Should export providers, modules, interfaces

### UI Package (`packages/ui`)
- Shared React components
- Design system components (shadcn-based)

---

## Review Strategy

### For Bounded Context Modules (NestJS)

Use the specialized layer review skills:

1. **Full Context Review** - Use `code-review` skill
2. **Domain Layer Only** - Use `code-review-domain` skill
3. **Application Layer Only** - Use `code-review-application` skill
4. **Infrastructure Layer Only** - Use `code-review-infrastructure` skill
5. **Interface Layer Only** - Use `code-review-interface` skill

Focus areas:
- DDD patterns and aggregate design
- CQRS command/query separation
- Transaction handling with UoW
- Port/adapter patterns
- Swagger documentation

### For Next.js Apps

Focus areas:
- Server vs Client component usage
- Data fetching patterns (RSC, server actions)
- Route organization and layouts
- Loading and error states
- Metadata and SEO
- TypeScript types for API responses

### For Vite/React Apps

Focus areas:
- Component composition and reusability
- State management patterns
- Hook usage and custom hooks
- Performance (memoization, lazy loading)
- Accessibility
- TypeScript usage

### For NestJS Packages

Focus areas:
- Module exports and provider patterns
- Configuration and DI patterns
- Testing coverage
- Documentation
- Versioning and breaking changes

### For UI Packages

Focus areas:
- Component API design
- Prop types and documentation
- Accessibility (a11y)
- Design token usage
- Responsive design
- Test coverage

---

## Git-Based Review

When reviewing git changes:

1. **Identify changed files:**
   ```bash
   git diff --name-only HEAD~1..HEAD  # Last commit
   git diff --name-only               # Unstaged changes
   git diff --name-only --cached      # Staged changes
   ```

2. **Group by area:**
   - Backend changes → Apply NestJS patterns
   - Frontend changes → Apply React/Next patterns
   - Package changes → Apply package patterns

3. **Review each group** with appropriate focus areas

---

## Output Format

Produce a structured review report:

```markdown
# Code Review Report

## Scope
- **Target:** {what was reviewed}
- **Technology:** {NestJS/Next.js/React/Package}
- **Files Reviewed:** {count}

## Summary
- **Critical Issues:** {count}
- **Warnings:** {count}
- **Overall Score:** {score}/10

---

## Findings

### Critical Issues
- **[CRITICAL]** {issue} in [{file}]({file}:{line})

### Warnings
- **[WARNING]** {issue} in [{file}]({file}:{line})

### Suggestions
- **[SUGGESTION]** {improvement}

---

## Recommendations

### Must Fix Before Merge
1. {item}

### Should Address
1. {item}

### Nice to Have
1. {item}
```

---

## Examples

```bash
# Review git changes from this session
/code-review

# Review entire organisations bounded context
/code-review organisations

# Review only the domain layer
/code-review organisations domain

# Review the web app
/code-review apps/web

# Review a specific package
/code-review packages/ui

# Review a specific file
/code-review apps/core-api/src/modules/organisations/domain/aggregates/organisation.aggregate.ts
```
