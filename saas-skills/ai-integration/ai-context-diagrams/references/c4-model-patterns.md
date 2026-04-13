# C4 Model Detailed Patterns and Best Practices

## C4 Model Hierarchy

### C4 = Context, Container, Component, Code

Each level answers a different question:

| Level            | Question                                  | Scope                                     | Audience                                   |
| ---------------- | ----------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| **1: Context**   | "What is this system? What's around it?"  | Your system + external actors             | Non-technical stakeholders, executives     |
| **2: Container** | "What major applications/services exist?" | Internal breakdown into apps/services/DBs | Technical team, architects                 |
| **3: Component** | "What modules are inside this service?"   | Internal structure of one container       | Developers working on that service         |
| **4: Code**      | "How is this component implemented?"      | Classes, functions, methods               | Individual developers (rarely for AI docs) |

---

## Level 1: System Context Diagram

### What to Include

- **Your System** — Centered, clear label.
- **External Actors** — Users, admins, external services.
- **External Systems** — Payment APIs, email services, third-party tools.
- **Relationships** — Lines showing "uses", "calls", "manages".

### What to Exclude

- Internal services (those go in Level 2).
- Implementation details (databases, APIs).
- Technical stack.

### Example

```text
Your System (center)
  ← Uses by: Users, Admins
  → Calls: Payment API, Email Service
  ← Managed by: Support Team
```

### Audience

- Non-technical stakeholders.
- Executives.
- New team members (30-second overview).

---

## Level 2: Container Diagram

### What to Include (2)

- **Containers** — Applications, services, databases, caches, queues.
- **Technology Stack** — Add in parentheses: "(Node.js)", "(PostgreSQL)", "(Redis)".
- **Relationships** — Which container talks to which?
- **Persistence** — Data stores (databases, caches).
- **Communication** — Message queues, APIs.

### What to Exclude (2)

- Internal components (those go in Level 3).
- Implementation details of components.
- Line-by-line code references.

### Pattern: Typical SaaS Container Diagram

```text
Frontend Containers:
  - Web App (React)
  - Mobile App (React Native)

Backend Containers:
  - API Server (Node.js/Express)
  - Auth Service (Node.js)
  - Payment Service (Node.js)
  - Worker Queue (Node.js + RabbitMQ)

Data Containers:
  - PostgreSQL (Primary DB)
  - Redis (Cache)
  - RabbitMQ (Message Queue)

External:
  - Stripe API
  - SendGrid (Email)
  - CloudFlare (CDN)
```

### Audience (2)

- Technical team.
- Architects.
- New developers (first read: understand services, not implementation).

---

## Level 3: Component Diagram

### What to Include (3)

- **Components** — Logical groupings within one container.
- **Technology** — Frameworks, libraries used.
- **Relationships** — How components interact.
- **External Dependencies** — External APIs, databases (at container level).

### What to Exclude (3)

- Implementation details (classes, functions).
- Individual code files.
- Internal method calls.

### Pattern: API Server Component Diagram

```text
API Server Components:
  - Router (Express routing)
  - Auth Middleware (JWT verification)
  - Controllers (business logic)
    - ChargeController
    - UserController
    - RefundController
  - Services (data access, external calls)
    - StripeService
    - UserService
    - DatabaseService
  - Models (Prisma ORM)
  - Logger (Winston)

External:
  - PostgreSQL (read/write)
  - Stripe API (payment processing)
  - Redis (caching)
```

### Audience (3)

- Developers working on this service.
- Code reviewers.
- Architects drilling down on one area.

---

## Level 4: Code Diagram (Rarely Used)

### What to Include (4)

- **Classes** — Data structures, interfaces.
- **Methods** — Function signatures.
- **Relationships** — Inheritance, composition, dependencies.

### When to Use

- Rarely in AI context. Code is self-documenting.
- Only for complex domain models or architectural patterns (e.g., Domain-Driven Design).

### Audience (4)

- Individual developers implementing the code.

---

## Best Practices for C4 Diagrams

### 1. One Diagram = One Level

Don't mix C4 Level 1 and Level 2 in the same diagram. Creates confusion.

#### Bad

```text
[Your System (Level 1)]
├─ [Web App (Level 2)]
├─ [API Server (Level 2)]
├─ [Stripe (External, Level 1)]
```

#### Good

- Separate file: `ARCHITECTURE-L1-CONTEXT.md` (Level 1 only).
- Separate file: `ARCHITECTURE-L2-CONTAINERS.md` (Level 2 only).
- Separate files: `modules/api-server.md` (Level 3 for API).

### 2. Use Consistent Styling Across Levels

- **Your System** — Consistent color (e.g., blue).
- **External Systems** — Different color (e.g., red or gray).
- **Databases** — Cylinder or different shape.
- **Actors** — Person icon or consistent symbol.

### 3. Add Technology Stack

Always mention technology in parentheses:

- "API Server (Node.js + Express)"
- "Database (PostgreSQL 14)"
- "Cache (Redis 7)"
- "Message Queue (RabbitMQ 3.11)"

This helps developers quickly understand tech decisions.

### 4. Highlight Key Boundaries

Use subgraphs or visual grouping to show deployment boundaries, organizational boundaries, or responsibility areas.

```text
subgraph AWS["AWS Account"]
    API["API Server"]
    DB["RDS (PostgreSQL)"]
end

subgraph ThirdParty["Third-Party Services"]
    Stripe["Stripe API"]
end
```

### 5. Add Relationship Labels

Don't just show arrows. Explain what flows:

```text
API -->|POST /charges| Stripe
API -->|Read/Write| DB
Web -->|REST API| API
```

### 6. Document Decision Rationale

Add notes or comments explaining why you chose this architecture:

```text
note over API
    Monolithic for now (simpler ops).
    Can split into microservices in V2.
end

note over Cache
    Redis for session cache + feature flags.
    DB queries would be too slow.
end
```

---

## Multi-Service Example (Full C4 Hierarchy)

### Level 1: Context

```text
Your SaaS (payment processing)
  ← Used by: End Users, Admins
  → Calls: Stripe, SendGrid
  ← Managed by: Support Team
```

### Level 2: Containers

```text
Frontend:
  - Web App (React)

Backend:
  - API Server (Node.js)
  - Auth Service (Node.js)
  - Worker (Node.js)

Data:
  - PostgreSQL
  - Redis
  - RabbitMQ

External:
  - Stripe, SendGrid
```

### Level 3: Components (API Server)

```text
API Server:
  - Router
  - Auth Middleware
  - Charge Controller
  - Refund Controller
  - StripeService
  - UserService
  - DatabaseService
  - Logger
```

### Level 4: Code (ChargeController)

```text
ChargeController:
  - createCharge(request)
  - getCharge(id)
  - refundCharge(id)
  - validateCard(card)
```

---

## Documentation Structure

```text
/project
├─ AGENTS.md
│  └─ [C4 Level 1 System Context Diagram]
├─ /docs
│  ├─ ARCHITECTURE.md
│  │  ├─ [C4 Level 1 for reference]
│  │  └─ [C4 Level 2 Container Diagram]
│  └─ /modules
│     ├─ api-server.md
│     │  ├─ [C4 Level 3 Components diagram]
│     │  └─ [Sequence diagram for key flows]
│     ├─ auth-service.md
│     │  └─ [C4 Level 3 Components diagram]
│     └─ worker-service.md
│        └─ [C4 Level 3 Components diagram]
```

### AGENTS.md Template

Include these sections:

1. System Overview (C4 Level 1 diagram)
2. Service Architecture (C4 Level 2 diagram + container list)
3. Key Flows (sequence diagrams for critical user flows)
4. Module Breakdown (links to C4 Level 3 docs per module)

---

## Validation Checklist

For each C4 level created:

- [ ] Level is focused (no mixing with other levels).
- [ ] Labels are descriptive (not abbreviations like "API", "DB").
- [ ] Technology is documented (Node.js, PostgreSQL, etc.).
- [ ] Relationships are labeled (arrow labels explain data flow).
- [ ] Audience is clear (who is this for?).
- [ ] Diagram is current (dated, not stale).
- [ ] AI agent can parse it correctly (test by asking Claude).

---

## Common Pitfalls

### Pitfall 1: Too Many Nodes

Diagram has 50+ boxes. Unreadable.

**Fix:** Split by concern or level. Max 15-20 nodes per diagram.

### Pitfall 2: Mixed Levels

Shows some internal components (Level 3) alongside containers (Level 2).

**Fix:** One diagram = one level. Use separate files.

### Pitfall 3: Ambiguous Labels

"API", "DB", "Service1" — what do these mean?

**Fix:** Use full names: "API Server (Node.js)", "PostgreSQL 14", "Auth Service".

### Pitfall 4: Outdated Diagram

Diagram shows old architecture. No date. AI reads stale design.

**Fix:** Date all diagrams. Mark as "CURRENT as of 2026-04-12" or red warning if >3 months old.

### Pitfall 5: No Explanatory Text

Diagram exists but no legend or description.

**Fix:** Pair each diagram with explanatory text. Explain key design choices.
