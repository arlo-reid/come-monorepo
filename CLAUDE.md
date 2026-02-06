## Code Conventions

### No Barrel Files (index.ts)

**Do NOT create barrel files (index.ts) that re-export from other modules.** Instead:

- Import directly from the specific file: `import { Foo } from './foo'`
- For packages, use `package.json` exports field to define public API
- This improves tree-shaking, build performance, and makes dependencies explicit

```typescript
// BAD - barrel file
// index.ts
export * from './foo';
export * from './bar';

// GOOD - direct imports
import { Foo } from './foo';
import { Bar } from './bar';
```

### Zod for Validation

**Use Zod schemas for all form and data validation.** This provides:

- Type-safe validation with inferred TypeScript types
- Consistent error messages across the application
- Composable and reusable validation schemas

```typescript
// BAD - manual validation
const validateForm = (data: FormData) => {
  const errors: Record<string, string> = {};
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Invalid email";
  }
  return errors;
};

// GOOD - Zod schema
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type SignupData = z.infer<typeof signupSchema>;

// Usage with react-hook-form
const form = useForm<SignupData>({
  resolver: zodResolver(signupSchema),
});
```

### Typed Object Constructors

**Use typed object parameters for constructors** instead of positional arguments. This prevents accidentally passing wrong fields and makes the code self-documenting.

```typescript
// BAD - positional arguments
export class CreateUserCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly age?: number,
  ) {}
}
new CreateUserCommand('John', 'john@example.com', 25);

// GOOD - typed object parameter
export interface CreateUserCommandProps {
  name: string;
  email: string;
  age?: number;
}

export class CreateUserCommand {
  public readonly name: string;
  public readonly email: string;
  public readonly age?: number;

  constructor(props: CreateUserCommandProps) {
    this.name = props.name;
    this.email = props.email;
    this.age = props.age;
  }
}
new CreateUserCommand({ name: 'John', email: 'john@example.com', age: 25 });
```

---

## Visual Development & Testing

### Design System

The project follows S-Tier SaaS design standards inspired by Stripe, Airbnb, and Linear. All UI development must adhere to:

- **Design Principles**: `/context/design-principles.md` - Comprehensive checklist for world-class UI
- **Component Library**: shadcn with custom Tailwind configuration

### Quick Visual Check

**IMMEDIATELY after implementing any front-end change:**

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages` ⚠️

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review

For significant UI changes or before merging PRs, use the design review agent:

```bash
# Option 1: Use the slash command
/design-review

# Option 2: Invoke the agent directly
@agent-design-review
```

The design review agent will:

- Test all interactive states and user flows
- Verify responsiveness (desktop/tablet/mobile)
- Check accessibility (WCAG 2.1 AA compliance)
- Validate visual polish and consistency
- Test edge cases and error states
- Provide categorized feedback (Blockers/High/Medium/Nitpicks)

### Playwright MCP Integration

#### Essential Commands for UI Testing

```javascript
// Navigation & Screenshots
mcp__playwright__browser_navigate(url); // Navigate to page
mcp__playwright__browser_take_screenshot(); // Capture visual evidence
mcp__playwright__browser_resize(width, height); // Test responsiveness

// Interaction Testing
mcp__playwright__browser_click(element); // Test clicks
mcp__playwright__browser_type(element, text); // Test input
mcp__playwright__browser_hover(element); // Test hover states

// Validation
mcp__playwright__browser_console_messages(); // Check for errors
mcp__playwright__browser_snapshot(); // Accessibility check
mcp__playwright__browser_wait_for(text / element); // Ensure loading
```

### Design Compliance Checklist

When implementing UI features, verify:

- [ ] **Visual Hierarchy**: Clear focus flow, appropriate spacing
- [ ] **Consistency**: Uses design tokens, follows patterns
- [ ] **Responsiveness**: Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] **Accessibility**: Keyboard navigable, proper contrast, semantic HTML
- [ ] **Performance**: Fast load times, smooth animations (150-300ms)
- [ ] **Error Handling**: Clear error states, helpful messages
- [ ] **Polish**: Micro-interactions, loading states, empty states

## When to Use Automated Visual Testing

### Use Quick Visual Check for:

- Every front-end change, no matter how small
- After implementing new components or features
- When modifying existing UI elements
- After fixing visual bugs
- Before committing UI changes

### Use Comprehensive Design Review for:

- Major feature implementations
- Before creating pull requests with UI changes
- When refactoring component architecture
- After significant design system updates
- When accessibility compliance is critical

### Skip Visual Testing for:

- Backend-only changes (API, database)
- Configuration file updates
- Documentation changes
- Test file modifications
- Non-visual utility functions
