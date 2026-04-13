---
name: prisma-database-design
description: Design PostgreSQL schemas with Prisma ORM for SaaS projects, covering data modeling, relations, migrations, query optimization, indexing, multi-tenant schemas, and seeding. Use when designing database schemas, creating Prisma models, optimizing queries, adding indexes, implementing multi-tenancy at DB level, or managing migrations. Triggers on Prisma schema, database design, migration, PostgreSQL, query optimization, index, multi-tenant database, seed, data modeling, performance tuning.
metadata:
  author: SaaS Skills Collection
  version: "1.0"
  last_validated: "2026-04-12"
  sources:
    - Prisma Official Documentation
    - PostgreSQL Documentation
    - Alex Xu - "System Design Interview"
    - Database Optimization Resources
---

# When to Use This Skill

Use this skill when you need to:

- Design a new PostgreSQL schema with Prisma
- Define entities and relationships (1:1, 1:N, M:N)
- Create and manage database migrations
- Optimize slow queries
- Add indexes for query performance
- Implement multi-tenancy at the database level
- Write database seed scripts
- Implement soft delete patterns
- Refactor existing schemas
- Handle data integrity and constraints

Triggered by: Prisma schema, database design, PostgreSQL, migration, query optimization, index, multi-tenant, seed data, performance, denormalization.

## Core Workflow

### Phase 1: Design Data Model (Entity-Relationship)

1. Identify entities (User, Order, Product, Invoice)
2. Determine relationships:
   - 1:1 (User ↔ Profile)
   - 1:N (User → Orders)
   - M:N (Product ↔ Category via junction table)
3. Normalize to 3NF (third normal form)
4. Identify where denormalization helps (read-heavy queries, aggregations)

### Phase 2: Define Prisma Schema

Basic structure with best practices (see references for complete example):

```prisma
model User {
  id       String   @id @default(cuid())
  tenantId String
  email    String   @unique
  status   UserStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders   Order[]
  @@index([tenantId])
  @@unique([tenantId, email])
}

model Order {
  id       String    @id @default(cuid())
  tenantId String
  userId   String
  status   OrderStatus @default(PENDING)
  total    Decimal   @db.Decimal(10, 2)
  user     User      @relation(fields: [userId], references: [id])
  @@index([tenantId])
  @@index([userId])
  @@index([status])
}

enum UserStatus { PENDING; ACTIVE; INACTIVE }
enum OrderStatus { PENDING; SHIPPED; DELIVERED }
```

### Phase 3: Create Migrations

```bash
# After editing schema.prisma
npx prisma migrate dev --name create_initial_schema

# Review generated SQL before committing
# File: prisma/migrations/[timestamp]_create_initial_schema/migration.sql

# In production, use deploy
npx prisma migrate deploy
```

**Never edit generated migration SQL unless absolutely critical.** Always create new migrations for changes.

## Phase 4: Optimize Queries

### Use `select` to pick only needed fields

```typescript
// Good: only what's needed
const orders = await prisma.order.findMany({
  where: { tenantId },
  select: {
    id: true,
    total: true,
    createdAt: true,
  },
});
```

#### Use `include` sparingly (1 level deep)

```typescript
// Good: flat, minimal includes
const order = await prisma.order.findUnique({
  where: { id },
  include: {
    user: { select: { id: true, email: true } },
    items: true,
  },
});
```

#### Use pagination with cursor

```typescript
const orders = await prisma.order.findMany({
  where: { tenantId },
  take: 20,
  ...(cursor && { skip: 1, cursor: { id: cursor } }),
  orderBy: { createdAt: "desc" },
});
```

#### Avoid N+1 queries with batching

```typescript
// Good: 1 query with in()
const userIds = ["1", "2", "3", "4", "5"];
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
});
```

#### Use raw queries for complex aggregations

```typescript
const stats = await prisma.$queryRaw`
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as count,
    SUM(total) as revenue
  FROM "Order"
  WHERE tenant_id = ${tenantId}
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`;
```

### Phase 5: Add Strategic Indexes

```prisma
model Order {
  // ... fields

  @@index([tenantId])              // Filter by tenant
  @@index([userId])                // JOIN with User
  @@index([status])                // Filter by status
  @@index([createdAt])             // Sort by date
  @@index([tenantId, status])      // Composite: filter tenant AND status
  @@index([tenantId, createdAt])   // Composite: tenant + sort
}
```

#### Monitor with EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM "Order" WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC;
```

### Phase 6: Implement Multi-Tenancy

#### Recommended: Shared database + tenantId (simplest)

```prisma
model User {
  tenantId String
  // ... other fields
  @@unique([tenantId, email]) // Unique per tenant, not global
  @@index([tenantId])
}
```

#### Automatic filtering with Prisma middleware

```typescript
// lib/prisma.ts - auto-filter by tenantId
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const tenanted = ["User", "Order", "Product"].includes(params.model);
  if (tenanted) {
    const tenantId = getCurrentTenantId();
    params.args.where = { ...params.args.where, tenantId };
  }
  return next(params);
});

export default prisma;
```

### Phase 7: Write Seed Script

```typescript
// prisma/seed.ts - create deterministic test data
const prisma = new PrismaClient();

async function main() {
  const tenantId = "tenant-1";

  const user = await prisma.user.create({
    data: { tenantId, email: "test@example.com", status: "ACTIVE" },
  });

  const order = await prisma.order.create({
    data: {
      tenantId,
      userId: user.id,
      status: "PENDING",
      total: "99.99",
    },
  });

  console.log("Seeded:", { user, order });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### Run seed

```bash
npx prisma db seed
```

### Phase 8: Implement Soft Deletes

```typescript
// Hide soft-deleted records
prisma.$use(async (params, next) => {
  if (["findUnique", "findMany"].includes(params.action)) {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  return next(params);
});
```

#### Restore endpoint

```typescript
await prisma.order.update({
  where: { id },
  data: { deletedAt: null },
});
```

## Advanced Cases

### Self-Relations (Hierarchies)

```prisma
model Category {
  id       String    @id @default(cuid())
  name     String
  parentId String?

  parent   Category?  @relation("ParentChild", fields: [parentId], references: [id])
  children Category[] @relation("ParentChild")
}
```

### Polymorphic Relations (Multiple Types)

```prisma
model Comment {
  id       String @id @default(cuid())
  content  String
  targetType String // "Post" or "Product"
  targetId String

  @@index([targetType, targetId])
}
```

### Audit Trail

```prisma
model AuditLog {
  id       String   @id @default(cuid())
  tenantId String
  entity   String
  entityId String
  action   String   // "CREATE", "UPDATE", "DELETE"
  changes  Json     // Old and new values
  userId   String
  createdAt DateTime @default(now())

  @@index([tenantId, createdAt])
}
```

## Fallback Clause

If information is missing:

- **Missing performance requirements**: Output `[INFORMATION NEEDED: expected query patterns (read:write ratio, typical data volume)]`
- **Unclear tenancy model**: Output `[INFORMATION NEEDED: multi-tenancy approach (shared db, schema-per-tenant, or db-per-tenant)]`
- **No migration strategy**: Output `[INFORMATION NEEDED: rollout plan for schema changes in production]`
- **Ambiguous relationships**: Output `[INFORMATION NEEDED: cardinality and cascading delete behavior for this relation]`

## Anti-Patterns

1. **No indexes**: Queries become O(n) scans. Add indexes on WHERE, ORDER BY, JOIN fields.
2. **Using Float for money**: Rounding errors accumulate. Always use Decimal.
3. **No createdAt/updatedAt**: Can't audit or sort by creation time.
4. **Editing generated migrations**: Risk of data loss. Create new migrations for changes.
5. **Deep eager loading**: `include: { user: { include: { profile: { ... } } } }` causes bloated objects.
6. **M:N without explicit junction**: Implicit junction tables hide important data (e.g., order date).
7. **No soft delete for regulatory data**: Can't comply with audit requirements.
8. **UUID without prefix**: Can't distinguish between entity types in logs. Use prefixed IDs (usr_123).
9. **No database constraints**: Relying on application logic for uniqueness. Use database constraints.
10. **Leaking implementation details**: Exposing internal IDs in APIs. Hash or use proxy IDs.

## Enforcement

### This skill is MANDATORY and must be followed without exception when its trigger fires

When designing or modifying database schemas:

1. Always add tenantId and multi-tenancy index for SaaS
2. Always use Decimal for monetary fields, never Float
3. Always add createdAt, updatedAt, and deletedAt (soft delete)
4. Always create new migrations, never edit generated SQL
5. Always add indexes on fields used in WHERE, ORDER BY, JOIN
6. Always normalize to 3NF before denormalizing
7. Always use repository pattern with Prisma middleware for tenant isolation
8. Always use cursor-based pagination for large result sets
9. Always write seed scripts for deterministic test data
10. Always review EXPLAIN ANALYZE output before deploying queries

## Source References

### Prisma

- Prisma schema design, migrations, and tenant-safe data access
- Query planning with indexes, pagination, and explain plans
- Prisma Official Documentation - <https://www.prisma.io/docs/>
- Prisma Schema Reference - <https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference>
- Prisma Client API - <https://www.prisma.io/docs/reference/api-reference/prisma-client-reference>

#### PostgreSQL

- PostgreSQL Documentation - <https://www.postgresql.org/docs/>
- PostgreSQL Performance Tips - <https://www.postgresql.org/docs/current/performance-tips.html>
- EXPLAIN ANALYZE - <https://www.postgresql.org/docs/current/sql-explain.html>

#### Database Design

- Alex Xu - "System Design Interview" (data modeling chapter)
- Database Normalization - <https://en.wikipedia.org/wiki/Database_normalization>
- Decimal vs Float - <https://www.postgresql.org/docs/current/datatype-numeric.html>

#### Migrations

- Flyway Database Migrations - <https://flywaydb.org/>
- Liquibase - <https://www.liquibase.org/>
