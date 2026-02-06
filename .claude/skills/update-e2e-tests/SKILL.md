---
name: update-e2e-tests
description: Update or create Playwright browser-based E2E tests for user journey testing. Use when testing UI interactions, user flows, or full application behavior through the browser.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# E2E Browser Tests (Update & Create)

Update or create Playwright browser-based E2E tests that validate complete user journeys through the application UI.

## When to Use This Skill

- "Add E2E tests for the login flow"
- "Test the checkout user journey"
- "Create browser tests for the dashboard"
- After adding new pages or UI features
- When testing user interactions and visual flows

## Test Location

```
tests/
├── e2e/
│   ├── web/                        # Main web app tests
│   │   └── {feature}.spec.ts
│   └── devtools-ui/                # Devtools UI tests
│       └── {feature}.spec.ts
```

## Playwright Projects

Defined in `tests/playwright.config.ts`:

| Project | Test Directory | Base URL |
|---------|----------------|----------|
| `e2e-web` | `tests/e2e/web/` | `http://localhost:3000` |
| `e2e-devtools` | `tests/e2e/devtools-ui/` | `http://localhost:5173` |

## E2E Test Pattern

### Basic Page Test

```typescript
/**
 * {Feature} E2E Tests
 *
 * Tests user journeys for {feature description}.
 *
 * @tags @e2e
 */

import { test, expect } from '@playwright/test';

test.describe('{Feature} @e2e', () => {
  test('renders the {feature} page', async ({ page }) => {
    await page.goto('/{route}');

    // Verify page loads
    await expect(page).toHaveTitle(/{expected title}/);

    // Verify key content is visible
    await expect(page.getByRole('heading', { name: '{heading}' })).toBeVisible();
    await expect(page.getByText('{expected text}')).toBeVisible();
  });
});
```

### User Interaction Test

```typescript
test.describe('{Feature} Interactions @e2e', () => {
  test('user can complete {action}', async ({ page }) => {
    await page.goto('/{route}');

    // Step 1: Fill form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Step 2: Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Step 3: Verify result
    await expect(page.getByText('Success')).toBeVisible();
    await expect(page).toHaveURL('/{success-route}');
  });
});
```

### Navigation Flow Test

```typescript
test.describe('{Feature} Navigation @e2e', () => {
  test('user can navigate through {flow}', async ({ page }) => {
    // Step 1: Start at home
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    // Step 2: Navigate to feature
    await page.getByRole('link', { name: '{Feature}' }).click();
    await expect(page).toHaveURL('/{feature}');

    // Step 3: Interact with feature
    await page.getByRole('button', { name: 'Action' }).click();

    // Step 4: Verify navigation
    await expect(page).toHaveURL('/{result}');
  });
});
```

### Form Validation Test

```typescript
test.describe('{Feature} Validation @e2e', () => {
  test('shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/{form-route}');

    // Submit empty form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify validation messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows field-level errors on blur', async ({ page }) => {
    await page.goto('/{form-route}');

    // Focus and blur email field
    await page.getByLabel('Email').focus();
    await page.getByLabel('Email').blur();

    // Verify error
    await expect(page.getByText('Email is required')).toBeVisible();
  });
});
```

### Authentication Flow Test

```typescript
test.describe('Authentication @e2e', () => {
  test('user can log in and access protected route', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('/login');

    // Step 2: Enter credentials
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log In' }).click();

    // Step 3: Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('redirects unauthenticated user to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Verify redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

## Common Locator Patterns

```typescript
// By role (preferred)
page.getByRole('button', { name: 'Submit' })
page.getByRole('link', { name: 'Home' })
page.getByRole('heading', { name: 'Title' })
page.getByRole('textbox', { name: 'Email' })

// By label (for form fields)
page.getByLabel('Email')
page.getByLabel('Password')

// By text content
page.getByText('Welcome')
page.getByText(/Welcome .+/)

// By placeholder
page.getByPlaceholder('Enter your email')

// By alt text (for images)
page.getByAltText('Logo')

// By test ID (when needed)
page.getByTestId('submit-button')
```

## Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('exact text');
await expect(element).toContainText('partial');

// URL
await expect(page).toHaveURL('/expected');
await expect(page).toHaveURL(/regex/);

// Title
await expect(page).toHaveTitle('Page Title');
await expect(page).toHaveTitle(/Title/);

// Value (for inputs)
await expect(input).toHaveValue('expected value');

// State
await expect(button).toBeEnabled();
await expect(button).toBeDisabled();
await expect(checkbox).toBeChecked();

// Count
await expect(page.getByRole('listitem')).toHaveCount(3);
```

## Test Configuration

The E2E tests use these settings from `playwright.config.ts`:

```typescript
{
  name: 'e2e-web',
  testDir: './e2e/web',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
  },
}
```

## Key Principles

1. **User-centric**: Test from the user's perspective, not implementation details
2. **Real journeys**: Test complete flows, not isolated clicks
3. **Stable selectors**: Prefer role-based and label-based selectors
4. **Wait for readiness**: Use Playwright's auto-waiting, add explicit waits when needed
5. **Visual verification**: Verify what the user sees, not internal state

## Test Commands

```bash
# Run all E2E tests
npm run test:e2e -w tests

# Run web app E2E tests only
npx playwright test --project=e2e-web -w tests

# Run devtools E2E tests only
npx playwright test --project=e2e-devtools -w tests

# Run specific test file
npx playwright test e2e/web/home.spec.ts -w tests

# Run in headed mode (watch browser)
npx playwright test --headed -w tests

# Run with UI mode
npx playwright test --ui -w tests
```

## Checklist for New E2E Tests

- [ ] Create test file in appropriate directory (`e2e/web/` or `e2e/devtools-ui/`)
- [ ] Use descriptive test names that describe user journeys
- [ ] Use role-based and label-based locators (avoid CSS selectors)
- [ ] Test happy path and common error cases
- [ ] Include page load verification
- [ ] Add appropriate tags (`@e2e`)
- [ ] Verify tests pass in headless mode

## Reference

- See `tests/e2e/web/home.spec.ts` for working example
- See `tests/playwright.config.ts` for project configuration
- Playwright docs: https://playwright.dev/docs/test-assertions
