# API and CI Test Examples

Reference file for `testing-strategies`.

## API Route Example

```text
import { GET } from "@/app/api/users/route";

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
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```
