# API and CI Test Examples

Reference file for `testing-strategies`.

## API Route Example

```text
import { GET } from "@/app/api/users/route";
// If the repo uses a src root, this resolves to src/app/api/users/route.ts.

describe("GET /api/users", () => {
  it("should return users list", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/api/users"));
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.any(Number), name: expect.any(String) }),
    ]));
  });

  it("should return 401 when unauthorized", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/api/users"), {
      headers: { Authorization: "" },
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

## GitHub Actions Example

```text
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: "18" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:run
      - run: pnpm test:run:storybook
      - run: pnpm test:e2e
```

## Coverage as an Incremental Gate

Coverage must measure the intended production surface, not only files imported
by the current tests. Configure an explicit `include` for production source and
exclude generated code, declarations, stories, fixtures and test files.

For an established codebase:

1. Measure statements, branches, functions and lines across the full source
   scope.
2. Record the measured baseline and set initial thresholds at or slightly below
   it so CI prevents regression immediately.
3. Raise thresholds deliberately as tests improve. Do not introduce an
   aspirational 80% threshold that makes the first gate unusable or encourages
   exclusions.
4. Publish machine-readable summary and LCOV artifacts in CI so changes are
   reviewable.
5. Keep coverage separate from paid or external-service E2E suites. Never spend
   real provider tokens merely to prove suite separation.

For a new repository, 80% can be a useful starting target when risk and test
economics justify it; behavior and critical-path coverage remain more important
than a single aggregate percentage.

## Validation Cadence

- While implementation is changing, run focused tests for the touched behavior.
- Complete code, tests, documentation and generated registries before the full
  suite.
- Run the comprehensive local/CI-equivalent gate once at closeout. After a
  failure, rerun the smallest failed stage until fixed; repeat the full gate
  only when final evidence is actually required.
- Keep logs concise: report exit status, counts and actionable failures instead
  of repeatedly streaming thousands of successful lines into an agent context.
- Respect explicit user limits on time, commands, paid suites and output volume.
