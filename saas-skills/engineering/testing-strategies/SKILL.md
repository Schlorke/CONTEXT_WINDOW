---
name: testing-strategies
description: Procedural guide for implementing testing strategies in Next.js/React/TypeScript SaaS projects, covering the testing pyramid, TDD workflow (Red-Green-Refactor), unit tests (Vitest), integration tests, E2E tests (Playwright), React component testing (Testing Library), API route testing, and test organization patterns. Use when setting up a testing framework, writing unit tests, implementing TDD, testing React components, creating E2E test suites, testing API routes, or defining a testing strategy for a new project.
metadata:
  author: Engineering Standards Team
  version: "1.0"
  last_validated: "2026-04-12"
  sources:
    - references/test-examples.md
    - Kent Beck, "Test-Driven Development: By Example"
    - Martin Fowler, "Testing Strategies"
    - Testing Library Documentation
    - Playwright Documentation
    - Vitest Documentation
---

# When to Use This Skill

Trigger this skill when:

- You set up a testing framework for a new project.
- You write unit tests for functions, hooks, or utilities.
- You implement test-driven development (TDD) workflow.
- You test React components with Testing Library.
- You create end-to-end test suites with Playwright.
- You test API routes in Next.js.
- You need to define a testing strategy for your team.
- You review code and assess test coverage.

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Testing Pyramid

The testing pyramid illustrates optimal test distribution:

```text
        /\
       /  \  E2E Tests (few, slow, expensive)
      /    \
     /------\
    /        \  Integration Tests (medium)
   /          \
  /------------\
 /              \ Unit Tests (many, fast, cheap)
/________________\
```

**Principle**: Write many fast unit tests, fewer integration tests, and few E2E tests. An inverted pyramid (many E2E tests) signals fragile, slow test suite.

**Metrics**:

- Unit tests: 60–70% of test count
- Integration tests: 20–30%
- E2E tests: 5–10%

## TDD Cycle (Kent Beck)

Test-driven development enforces clear API design and catches regressions instantly.

**Red → Green → Refactor**:

1. **RED**: Write a failing test for desired behavior.

   ```text
   it("should return user by ID", () => {
     const user = getUserById(123);
     expect(user.id).toBe(123);
     expect(user.name).toBe("Alice");
   });
   ```

2. **GREEN**: Write minimal code to pass the test.

   ```text
   function getUserById(id) {
     return { id: 123, name: "Alice" };
   }
   ```

3. **REFACTOR**: Improve code while tests pass. No behavior changes.

   ```text
   function getUserById(id) {
     const user = database.find(u => u.id === id);
     return user || null;
   }
   ```

**Benefits**:

- Forces clear, simple APIs (what would be easy to test?).
- Instant regression detection (test fails → bug found).
- Living documentation (tests show how to use code).
- Confidence to refactor (tests verify behavior).

## Unit Testing with Vitest

Unit tests verify individual functions, hooks, or utilities in isolation.

**Characteristics**:

- Mock external dependencies (APIs, databases, file systems).
- Fast (<5ms per test).
- Deterministic (same input → same output).
- Isolated (no shared state between tests).

**Setup** (`vitest.config.ts`):

```text
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
});
```

**Naming convention**:

```text
describe("functionName", () => {
  it("should [behavior] when [condition]", () => {
    // Arrange: Set up test data
    const input = 5;

    // Act: Execute function
    const result = add(input, 3);

    // Assert: Verify result
    expect(result).toBe(8);
  });
});
```

**Example unit tests**:

```text
describe("calculateDiscount", () => {
  it("should apply 10% discount when quantity > 100", () => {
    const discount = calculateDiscount(150);
    expect(discount).toBe(0.1);
  });

  it("should apply 0% discount when quantity <= 100", () => {
    const discount = calculateDiscount(50);
    expect(discount).toBe(0);
  });

  it("should throw error for negative quantity", () => {
    expect(() => calculateDiscount(-5)).toThrow();
  });
});
```

## React Component Testing (Testing Library)

Test component BEHAVIOR, not implementation. Query by accessible role/text. Simulate user interaction.

**Philosophy**:

- Don't test state directly. Test what the user SEES.
- Don't query by CSS class. Query by accessible attributes.
- Use `screen` API (encourages accessible queries).

**Setup** (`vitest.config.ts`):

```text
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

afterEach(() => cleanup());
```

**Common queries** (in priority order):

1. `screen.getByRole("button", { name: /submit/i })` — Most accessible.
2. `screen.getByLabelText("Email")` — Form inputs.
3. `screen.getByPlaceholderText("Enter email")` — If label unavailable.
4. `screen.getByText("Welcome")` — Text content.
5. Avoid: `getByTestId`, `container.querySelector` (implementation details).

**Example component test**:

```text
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("should submit form with valid credentials", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /submit/i });

    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("should show error when email is invalid", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.tab();

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

## Hook Testing

Test custom hooks using `renderHook` and `act`:

```text
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("should increment counter on click", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

## Integration Testing

Test multiple units working together (e.g., component + API call + state management).

**Characteristics**:

- Use real database or in-memory test database.
- Mock external APIs if they're not part of the test.
- Slower than unit tests (seconds, not milliseconds).
- Reset database state between tests.

**Example** (component + API route):

```text
describe("UserList integration", () => {
  beforeEach(() => {
    // Reset database
    db.clear();
    db.insert("users", [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  it("should fetch and display users from API", async () => {
    render(<UserList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });
});
```

## E2E Testing with Playwright

Test full user journeys in a real browser.

**Setup** (`playwright.config.ts`):

```text
import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: { command: "npm run dev", port: 3000 },
  use: { baseURL: "http://localhost:3000" },
  testDir: "./e2e",
  retries: 1,
});
```

**Page Object Pattern** (for maintainability):

```text
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async fillEmail(email: string) {
    await this.page.fill("input[type=email]", email);
  }

  async fillPassword(password: string) {
    await this.page.fill("input[type=password]", password);
  }

  async clickSubmit() {
    await this.page.click("button[type=submit]");
  }

  async isDashboardVisible() {
    return this.page.isVisible("h1:has-text('Dashboard')");
  }
}
```

**Example E2E test**:

```text
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("should log in and view dashboard", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.fillEmail("user@example.com");
  await loginPage.fillPassword("password123");
  await loginPage.clickSubmit();

  expect(await loginPage.isDashboardVisible()).toBe(true);
});
```

**E2E best practices**:

- Test critical user paths only (10–30 total).
- Use Page Object pattern to reduce maintenance.
- Run E2E on main branch or nightly (too slow for every PR).
- Use `waitFor` instead of `sleep`.
- Screenshot on failure for debugging.

## API Route Testing

Test Next.js API routes with `NextRequest` or supertest. Keep one happy-path case and one authorization/error case per handler. See `references/test-examples.md` for a concrete GET route example.

## Mocking Patterns

**Mock external APIs** with Mock Service Worker (MSW):

```text
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("https://api.example.com/users/:id", () => {
    return HttpResponse.json({ id: 1, name: "Alice" });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Mock functions**:

```text
const mockCallback = vi.fn();
mockCallback("arg1", "arg2");
expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2");
expect(mockCallback).toHaveBeenCalledTimes(1);
```

## What to Test (Priority)

1. **Business logic** (calculations, validations): High impact, easy to test.
2. **User flows** (critical paths): Login, checkout, payment. High impact, slower.
3. **Edge cases** (boundaries, empty states, errors): Prevent surprises in production.
4. **Regressions** (bugs that were fixed): Prevent re-introducing bugs.

**What NOT to test**:

- Implementation details (internal state, function internals).
- Third-party library internals (trust that lodash.sort works).
- Pure visual styling (CSS changes frequently; low test ROI).
- Getters and setters (trivial, high maintenance).

## Test Organization

**Co-location** (preferred):

```text
src/
  Button.tsx
  Button.test.tsx
  hooks/
    useAuth.ts
    useAuth.test.ts
```

**Alternative** (`__tests__/` folder):

```text
src/
  Button.tsx
  hooks/
    useAuth.ts
__tests__/
  Button.test.tsx
  hooks/
    useAuth.test.ts
```

Choose one pattern; be consistent across project.

## CI Integration

1. **Run unit + integration tests** on every PR. Fail PR if coverage drops.
2. **Run E2E tests** on main branch merges or nightly (optional for PRs if too slow).
3. **Generate coverage reports** and track trends.
4. **Set coverage thresholds**: Aim 80% overall (diminishing returns above this).

Use `references/test-examples.md` for a baseline GitHub Actions workflow. Keep the canonical skill focused on deciding what to test and when to gate merges.

## Advanced Cases

**Snapshot testing**: Use sparingly for stable output (formatted dates, calculations). Prevent visual regression but require frequent updates.

**Concurrency**: Use `test.concurrent()` in Vitest to parallelize and speed up CI. Ensure tests don't share state.

**Performance and accessibility**: Profile render times with `performance.mark()`. Use `jest-axe` for WCAG compliance.

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- `[INFORMATION NEEDED: test database setup]` if integration tests lack DB configuration.
- `[INFORMATION NEEDED: E2E critical paths list]` if test suite scope is unclear.
- `[INFORMATION NEEDED: API authentication strategy]` before testing protected routes.
- `[INFORMATION NEEDED: mock API contracts]` if external API responses are undefined.
- `[INFORMATION NEEDED: coverage threshold targets]` before setting up CI gates.

## Anti-Patterns

- **Testing implementation details**: Query by CSS class instead of accessible role. Brittle tests break on refactor.
- **Snapshot abuse**: Snapshot every component. Leads to "snapshot roulette" (developers approving all changes without review).
- **No test isolation**: Tests depend on each other; run order matters. Each test must be independent.
- **Slow test suite**: No one runs it locally. Tests must complete in <5 minutes. Parallelize, mock external calls.
- **100% coverage goal**: Diminishing returns after 80%. Focus on behavior, not line count.
- **Ignoring flaky tests**: Tests that pass 90% of the time are worse than useless. Fix root cause (async issues, timing).
- **E2E for everything**: E2E tests are expensive and slow. Use unit/integration tests for edge cases.

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires. Skipping tests or ignoring test failures will result in regressions, production bugs, and team friction.

## Source References

- **Reference file:** `references/test-examples.md`
- Beck, K. _Test-Driven Development: By Example_. Addison-Wesley, 2002.
- Fowler, M. "TestPyramid." _Martinfowler.com_, 2021.
- Testing Library, Playwright, Vitest official documentation.
