---
name: api-design-patterns
description: Design and implement REST APIs in Next.js SaaS with authentication, Zod validation, error handling, cursor pagination, rate limiting, webhooks, and multi-tenancy. Use when building REST endpoints, implementing auth flows, adding input validation, standardizing errors, paginating results, implementing webhooks, or configuring tenant isolation. Triggers on API design, REST, route handler, authentication, authorization, middleware, validation, Zod, pagination, rate limiting, webhook, multi-tenant API.
metadata:
  author: SaaS Skills Collection
  version: "1.0"
  last_validated: "2026-04-12"
  sources:
    - Alex Xu - "System Design Interview"
    - Martin Fowler - "REST architectural style"
    - Next.js Official Docs
    - Zod documentation
---

# When to Use This Skill

Use this skill when you need to:

- Design REST API endpoints and URL structures
- Implement authentication and authorization patterns
- Add input validation to route handlers
- Standardize API error responses across endpoints
- Implement cursor-based pagination for lists
- Add rate limiting to protect APIs
- Build webhook systems with signature verification
- Configure multi-tenant API isolation
- Refactor inconsistent API implementations
- Document API contracts

Triggered by: API design, REST endpoint, route handler, authentication, authorization, middleware, input validation, pagination, rate limiting, webhook, multi-tenant, error handling.

## Core Workflow

### Phase 1: Define Resource Model and Operations

0. Inspect the target repo first: `AGENTS.md`/`CLAUDE.md`, `package.json`, `tsconfig.json`, existing route handlers, auth helpers, permission helpers, and Prisma/client imports override generic examples.
1. Identify resources (User, Order, Invoice)
2. Define operations: Create (POST), Read (GET), Update (PUT/PATCH), Delete (DELETE), List (GET)
3. Design URL structure:
   - Resource: `/api/users`, `/api/orders`
   - Single resource: `/api/users/{id}`
   - Nested: `/api/users/{userId}/orders`
   - Actions: `/api/orders/{id}/ship`, `/api/orders/{id}/cancel`
4. Avoid query-based operations; use path and method semantics

### Phase 2: Design Standard Response Envelope

Never return raw arrays or objects. Always use consistent wrapper:

```typescript
// Success: { data, meta }
// List: { data: Array, meta: { cursor, hasMore } }
// Error: { error: { code, message, details? }, meta }
```

### Phase 3: Resolve Authentication and Authorization Context

Prefer the repository's existing server-side auth path. In a Next.js App Router repo, route handlers commonly live in `src/app/api/**/route.ts`; if the repo already uses a different root, follow it.

#### Session/auth helper pattern

```typescript
// src/app/api/invoices/route.ts
import { auth } from "@/auth";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const orgId = session?.user?.orgId;

  if (!userId || !orgId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED" } },
      { status: 401 },
    );
  }

  if (!can(session.user, "invoice:create")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN" } },
      { status: 403 },
    );
  }

  // Handler logic uses orgId from trusted session context.
}
```

Use middleware or proxy only when the repo already has `middleware.ts`, `proxy.ts`, or documented edge auth conventions. Do not invent request headers such as `x-user-id` or `x-tenant-id` unless the repo already uses that contract.

### Phase 4: Add Input Validation with Zod

Define schema for each endpoint:

```typescript
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required"),
  role: z.enum(["admin", "user"]).default("user"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validation = CreateUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          details: validation.error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }
  const input = validation.data; // Type-safe validated input
}
```

### Phase 5: Implement Standard Error Handling

Create error class:

```typescript
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
  }
}

export function mapError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof PrismaClientKnownRequestError) {
    return error.code === "P2002"
      ? new ApiError("UNIQUE_CONSTRAINT", "Resource already exists", 409)
      : new ApiError("DATABASE_ERROR", "Database operation failed", 500);
  }
  return new ApiError("INTERNAL_ERROR", "Unknown error", 500);
}
```

### Phase 6: Implement Cursor-Based Pagination

```typescript
const GetUsersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { cursor, limit } = GetUsersSchema.parse({
    cursor: searchParams.get("cursor"),
    limit: searchParams.get("limit"),
  });

  const users = await prisma.user.findMany({
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true },
  });

  const data = users.slice(0, limit);
  return NextResponse.json({
    data,
    meta: { cursor: data[data.length - 1]?.id, hasMore: users.length > limit },
  });
}
```

### Phase 7: Add Rate Limiting

Using Upstash Redis for serverless:

```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
});

export async function POST(req: NextRequest) {
  const { success, reset } = await ratelimit.limit(
    userId,
  );
  if (!success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED" } },
      { status: 429 },
    );
  }
}
```

### Phase 8: Implement Webhooks

Webhook signature verification:

```typescript
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature");
  const body = await req.text();
  const expected = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE" } },
      { status: 401 },
    );
  }

  const event = JSON.parse(body);
  const idempotencyKey = req.headers.get("x-idempotency-key")!;

  // Check if already processed
  const exists = await prisma.webhookEvent.findUnique({
    where: { idempotencyKey },
  });
  if (exists) return NextResponse.json({ success: true });

  // Handle and mark as processed
  await handleWebhookEvent(event);
  await prisma.webhookEvent.create({
    data: { idempotencyKey, eventType: event.type },
  });
  return NextResponse.json({ success: true });
}
```

### Phase 9: Configure Multi-Tenancy

Derive tenant or organization scope from trusted server context, then include it in every query. In OK Gas-style repos this is usually `orgId` from `auth()` plus `can()` checks and a shared Prisma client from `@/lib/prisma`.

```typescript
const invoices = await prisma.invoice.findMany({
  where: { orgId, deletedAt: null },
  orderBy: { createdAt: "desc" },
  take: limit + 1,
});
```

If the target repo has database RLS, Prisma middleware, or repository helpers, use that existing mechanism. Otherwise keep tenant filters explicit and near the query so reviewers can verify isolation.

## Advanced Cases

### Soft Deletes in API

```typescript
// Hide deleted resources
const orders = await prisma.order.findMany({
  where: { tenantId, deletedAt: null },
});

// Restore endpoint
export async function PATCH(req: NextRequest, { params }) {
  await prisma.order.update({
    where: { id: params.id },
    data: { deletedAt: null },
  });
  return NextResponse.json({ success: true });
}
```

### Bulk Operations

```typescript
const BulkUpdateSchema = z.object({
  ids: z.array(z.string()),
  status: z.enum(["active", "inactive"]),
});

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const validation = BulkUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR" } },
      { status: 422 },
    );
  }

const updated = await prisma.user.updateMany({
    where: {
      id: { in: validation.data.ids },
      orgId,
    },
    data: { status: validation.data.status },
  });
  return NextResponse.json({ data: { count: updated.count } });
}
```

## Fallback Clause

If information is missing:

- **Missing auth context**: Output `[INFORMATION NEEDED: auth method (JWT vs session) and where to find user/tenant ID]`
- **Unclear response format**: Output `[INFORMATION NEEDED: response envelope structure agreed with frontend team]`
- **No validation schema**: Output `[INFORMATION NEEDED: input schema documentation or Zod examples from similar endpoints]`
- **Missing error mapping**: Output `[INFORMATION NEEDED: list of domain errors and desired HTTP status codes]`

## Anti-Patterns

1. **Inconsistent response formats**: Some endpoints return arrays, others objects. Use standard envelope always.
2. **No input validation**: Trusting client data. Always validate with Zod before processing.
3. **Exposing internal IDs**: Returning Prisma IDs directly. Consider hashing or using UUIDs.
4. **Direct HTTP errors from database**: Exposing "unique constraint violation" to client. Map to friendly error codes.
5. **No rate limiting**: APIs open to brute force and DoS attacks.
6. **Offset-based pagination**: Doesn't scale with data growth. Use cursor-based.
7. **Mixing auth contexts**: Not verifying tenant ownership. Resolve tenant scope from trusted server auth and enforce it in permission checks and queries.
8. **No webhook signature verification**: Accepting unsigned webhooks. Always verify HMAC.
9. **Blocking handlers**: Awaiting all operations sequentially. Use Promise.all for parallel work.
10. **No error context in logs**: Swallowing error details. Log full error with request ID for debugging.

## Enforcement

### This skill is MANDATORY and must be followed without exception when its trigger fires

When designing or implementing APIs:

1. Always use standard response envelope with { data, meta } or { error, meta }
2. Always validate all inputs with Zod before processing
3. Always authenticate and authorize requests using the repo's existing auth/session and permission helpers; use middleware/proxy only when the repo already does
4. Always map domain errors to standard HTTP status codes
5. Always paginate list endpoints with cursor-based pagination
6. Always verify webhook signatures with HMAC-SHA256
7. Always isolate tenants in queries through explicit `tenantId`/`orgId` filters, existing RLS, or existing repository/middleware helpers
8. Never return raw errors to clients; wrap in error envelope
9. Never expose database error messages; map to error codes
10. Never skip rate limiting for public or sensitive endpoints

## Source References

### REST API Design

- REST resource modeling and contract-first API design
- HTTP semantics, idempotency, and status code mapping
- Explicit validation, authorization, and tenant-boundary enforcement
- Martin Fowler - "REST API design rulebook" - <https://martinfowler.com/articles/rest.html>
- Alex Xu - "System Design Interview" (API design chapter)
- HTTP Status Codes - <https://developer.mozilla.org/en-US/docs/Web/HTTP/Status>

#### Next.js Implementation

- Next.js Official Docs - Route Handlers - <https://nextjs.org/docs/app/building-your-application/routing/route-handlers>
- Next.js Middleware/Proxy - use only when it matches the target repo's current auth architecture

#### Input Validation

- Zod Documentation - <https://zod.dev/>
- OpenAPI/JSON Schema - <https://www.openapis.org/>

#### Authentication & Rate Limiting

- JWT.io - <https://jwt.io/>
- Upstash Ratelimit - <https://upstash.com/docs/redis/features/ratelimiting>
- OWASP API Security - <https://owasp.org/www-project-api-security/>

#### Webhooks

- Svix Webhook Security - <https://docs.svix.com/security>
- Stripe Webhook Documentation - <https://stripe.com/docs/webhooks>
