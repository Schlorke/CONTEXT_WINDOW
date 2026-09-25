---
name: clean-architecture-ddd
description: "Choose and implement backend architecture: modular monolith by default, ports-and-adapters where domain rules and integrations justify it, DDD patterns, use cases, repositories, ADRs; no FSD in the backend. Use when designing backend modules, domain models or bounded contexts."
metadata:
  author: SaaS Skills Collection
  version: "1.1"
  last_validated: "2026-04-12"
  sources:
    - references/ddd-tactical-patterns.md
    - Robert C. Martin - "Clean Architecture"
    - Eric Evans - "Domain-Driven Design: Tackling Complexity"
    - Vaughn Vernon - "Implementing Domain-Driven Design"
    - Martin Fowler - "Refactoring patterns"
---

# When to Use This Skill

**Platform scope:** monorepo topology (apps/packages/products), modular-API
module anatomy and extraction playbooks belong to
`multiplatform-platform-architecture`; this skill governs domain modeling and
layering INSIDE a module or feature that the platform structure has placed.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Choose and implement a backend architecture whose boundaries are real: modular monolith by default, ports-and-adapters where the domain and integrations justify it. |
| Use when | Designing backend modules, use cases, domain models, repositories, ports/adapters, ADRs for backend structure. |
| Do not use when | Frontend code (FSD rules live in react-saas-architecture), API endpoint details (api-design-patterns), schema design (prisma-database-design). |
| Inputs | Business rules, integrations, isolation and testability needs, measured scale requirements, current backend code. |
| Preconditions | Bounded contexts or at least module candidates are identified; shared contracts are kept apart from server code. |
| Tools | TypeScript, the repository's test runner, a dependency rule tool (dependency-cruiser or eslint-plugin-boundaries) for domain/infrastructure boundaries. |
| Procedure | Backend Architecture Decision below, then the Core Workflow. |
| Output | Decision record (ADR) plus modules with domain, application (use cases and ports), adapters and entrypoints. |
| Validation | Domain code imports no framework, ORM or I/O; use cases are tested with in-memory adapters; dependency rules run in CI. |
| Known failures | Hexagonal folder names without real ports, domain importing Prisma, microservices or CQRS without a measured driver, contracts package importing server code. |

## Backend Architecture Decision (MANDATORY)

Feature-Sliced Design is a frontend methodology and is never applied to backend code. Backend code
lives in `apps/services/api` (or in Next.js route handlers while the API is still hosted there) and
uses modules:

| Situation | Choice |
| --- | --- |
| Default for a product backend | Modular monolith: one deployable, modules with public `index.ts`, no cross-module internals |
| Rich domain rules, several external integrations to swap or fake, long-lived core | Ports-and-adapters inside the affected modules |
| CRUD with little logic | Module with service + repository; do not add ports for their own sake |
| Independent scaling, isolation or ownership proven by metrics | Extract that module to a service (playbook in multiplatform-platform-architecture) |
| Audit/temporal query need proven by a requirement | Event sourcing for that aggregate only, with an ADR |

Module anatomy when ports-and-adapters is adopted:

```text
apps/services/api/src/modules/billing/
├── domain/           entities, value objects, domain services — pure TypeScript
├── application/      use cases + ports (interfaces owned by the use cases)
├── adapters/         implementations of ports: prisma repositories, payment gateway client
├── entrypoints/      http handlers/controllers mapping contracts to use cases
└── index.ts          public API of the module (use cases, events), nothing else
```

Real boundaries, not folder names:

- `domain/` imports nothing from `adapters/`, `entrypoints/`, Prisma, HTTP frameworks or Node I/O.
- `application/` depends on port interfaces; adapters are injected at the composition root.
- Every port has an in-memory or fake adapter used by use-case tests.
- Network contracts (Zod schemas, DTO types) live in `packages/contracts`; clients import contracts,
  never server modules. Server-only packages declare `"contextWindow": { "runtime": "server" }` so the
  frontend architecture gate rejects client imports.

Dependency rule example (dependency-cruiser):

```js
module.exports = {
  forbidden: [
    { name: "domain-is-pure", from: { path: "/domain/" }, to: { path: "(/adapters/|/entrypoints/|@prisma|express|fastify|^node:)" } },
    { name: "no-cross-module-internals", from: { path: "modules/([^/]+)/" }, to: { path: "modules/(?!$1)[^/]+/(?!index)" } },
  ],
};
```

Scale is prepared by modules and contracts. Do not introduce microservices, CQRS, message brokers or
event sourcing without a measured driver recorded in an ADR.

## Core Workflow

Before adding architecture, inspect the target repo instructions, current folders, auth/session helpers, Prisma client pattern, and ADR location. Use the repo's existing `src/app`, `src/lib`, service/use-case, and docs conventions before applying generic examples.

### Phase 1: Understand Domain and Identify Bounded Contexts

1. Interview domain experts and stakeholders
2. Extract core domains and subdomains
3. Identify context boundaries (features, modules, teams)
4. Map relationships: Shared Kernel, Customer-Supplier, Anti-Corruption Layer, Separate Ways, Conformist
5. Document context map in code comments and architecture diagrams

### Phase 2: Define Ubiquitous Language

- Use domain terminology consistently in code (classes, methods, variable names)
- Avoid generic names like "Manager", "Processor", "Helper"
- Document key terms in a project glossary
- Ensure developers and domain experts use same vocabulary

### Phase 3: Design the Layered Architecture

For a Next.js SaaS, structure as:

**Domain Layer** (pure TypeScript, no framework dependencies)

- Entities: Mutable objects with identity (e.g., User, Order)
- Value Objects: Immutable, compared by value (e.g., Email, Money, Address)
- Aggregates: Consistency boundaries (root entity + related objects)
- Domain Events: Facts about state changes (UserRegistered, OrderShipped)
- Domain Services: Logic spanning multiple entities (PricingService)
- Repository Interfaces: Contracts for data access (no Prisma imports here)

**Application Layer** (use cases, DTOs, ports)

- Use Cases: Orchestrate domain logic, return DTOs (CreateUserUseCase)
- DTOs: Transfer data between layers, no business logic
- Ports/Interfaces: Contracts for repositories and external services
- Application Services: Thin coordinators (call repositories, domain logic, emit events)

**Infrastructure Layer** (external concerns)

- Prisma Repositories: Implement repository interfaces
- API Clients: Call external services
- Email/SMS Adapters: Implement ports
- Event Bus: Publish/subscribe domain events
- Database Seeders, Migrations

**Presentation Layer** (UI concerns)

- Next.js Route Handlers (`src/app/api/[route]` when the repo uses a `src/` root; otherwise follow the existing route root)
- React Components
- API endpoint handlers (thin, call use cases)
- Formal layouts/widgets when the repository uses them; these compose feature
  APIs but do not own domain rules

### Phase 4: Implement Domain Models

Example structure:

```typescript
// Domain entity with business logic
export class User {
  private readonly id: UserId;
  private email: Email;
  private status: UserStatus;

  constructor(id: UserId, email: Email, status: UserStatus) {
    this.id = id;
    this.email = email;
    this.status = status;
  }

  static create(email: Email): User {
    return new User(UserId.generate(), email, UserStatus.PENDING);
  }

  activate(): void {
    if (this.status !== UserStatus.PENDING) throw new Error("Invalid state");
    this.status = UserStatus.ACTIVE;
  }

  getId(): UserId {
    return this.id;
  }
}
```

### Phase 5: Create Use Cases (Application Services)

```typescript
export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string): Promise<CreateUserOutput> {
    const userEmail = new Email(email);
    if (await this.userRepository.findByEmail(userEmail)) {
      throw new UserAlreadyExistsError();
    }
    const user = User.create(userEmail);
    await this.userRepository.save(user);
    return { userId: user.getId().value };
  }
}
```

### Phase 6: Wire Infrastructure and Dependency Injection

```typescript
// Use factory to assemble dependencies
export function makeCreateUserUseCase(): CreateUserUseCase {
  const userRepository = new PrismaUserRepository(prisma);
  return new CreateUserUseCase(userRepository);
}

// In Next.js route handler, for example src/app/api/users/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const useCase = makeCreateUserUseCase();
  const result = await useCase.execute(body.email);
  return NextResponse.json(result);
}
```

### Phase 7: Document with Architectural Decision Records (ADR)

Create an ADR in the repository's established ADR location, for example `docs/decisions/ADR-001-chosen-architecture/ADR-001-chosen-architecture.md` or `docs/adr/001-chosen-architecture.md` if that is the local convention:

```text
# 001: Layered Architecture with Domain-Driven Design

## Status
Accepted

## Context
We need to structure a multi-tenant SaaS. We chose layered + DDD because:
- Domain logic is complex and business-critical
- Multiple teams work on different features (need bounded contexts)
- Testability and maintainability are priorities

## Decision
Implement Clean Architecture with 4 layers (Domain, Application, Infrastructure, Presentation).
Use DDD strategic patterns for context mapping and tactical patterns for domain models.

## Consequences
- More upfront ceremony (entities, value objects, use cases)
- Easier to test and refactor
- Clearer dependency flow and separation of concerns
- Requires discipline from developers
```

## SOLID Principles in Practice

### Single Responsibility (S)

- One class = one reason to change
- Bad: UserService doing registration, email, and billing
- Good: CreateUserUseCase, SendWelcomeEmailUseCase, ChargeSubscriptionUseCase

#### Open/Closed (O)

- Open for extension, closed for modification
- Use composition over inheritance
- Bad: if-else chains checking user type
- Good: polymorphic domain services accepting UserRepository interface

#### Liskov Substitution (L)

- Subtypes must be substitutable for base types
- Bad: Admin extends User but overrides save() to throw error
- Good: All repositories implement interface contract fully

#### Interface Segregation (I)

- Clients depend on small, focused interfaces
- Bad: Repository with 20 methods
- Good: UserFinder, UserSaver, UserRemover (segregated)

#### Dependency Inversion (D)

- Depend on abstractions, not concretions
- Bad: `new PrismaUserRepository()` in use case
- Good: Inject `UserRepository` interface via constructor

## Advanced Cases

### Multi-Bounded Context Architecture

When domains are complex, establish Context Maps:

- **Shared Kernel**: Common types shared between contexts (UserId, Email)
- **Customer-Supplier**: One context owns API, other consumes (Billing owns pricing, Orders consumes)
- **Anti-Corruption Layer**: Translate external domain language to internal (e.g., third-party payment provider)
- **Separate Ways**: Duplicate data; contexts don't communicate

### Event-Driven Architecture

For eventual consistency across contexts:

```typescript
// Domain event
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }
}

// Publish from domain model
user.register(); // User emits UserRegisteredEvent
await eventBus.publish(user.getDomainEvents());

// Subscribe in application service
eventBus.subscribe(UserRegisteredEvent, async (event) => {
  await sendWelcomeEmailUseCase.execute(event.email);
});
```

### Testing Domain Models

```typescript
it("should activate a pending user", () => {
  const user = new User(userId, email, UserStatus.PENDING, now);
  user.activate();
  expect(user.getStatus()).toBe(UserStatus.ACTIVE);
});
```

### Refactoring Legacy Code

1. Extract domain models from anemic services
2. Move validation into value objects
3. Create repository interfaces for data access only where the domain behavior, test seam, or existing repo pattern justifies it
4. Wrap Prisma calls in repository implementations when the repo already uses repositories or the use case would otherwise couple complex domain logic to persistence
5. Build use cases layer around domain models

## Fallback Clause

If information is missing:

- **Missing domain terminology**: Output `[INFORMATION NEEDED: ubiquitous language glossary]` and ask stakeholders for core terms
- **Unclear context boundaries**: Output `[INFORMATION NEEDED: feature/team ownership map]` before designing contexts
- **No existing domain logic to extract**: Output `[INFORMATION NEEDED: business rules documentation or subject matter expert interview]`
- **Ambiguous SOLID violation**: Output `[INFORMATION NEEDED: specific code example and desired refactoring goal]`

## Anti-Patterns

1. **Anemic Domain Models**: All logic in services, entities just hold data. Violates Domain-Driven Design.
2. **Service Layer Bloat**: ServiceLocator pattern with God services doing everything. Hard to test and reason about.
3. **Direct Prisma in Complex Use Cases**: Complex domain rules coupled to ORM are hard to test. Use repository interfaces or application services when complexity warrants it.
4. **No Bounded Contexts**: Treating entire application as one domain. Leads to tangled code and team friction.
5. **Ignoring Ubiquitous Language**: Inconsistent naming (User vs. Account vs. Member). Confuses team.
6. **Over-Architecting**: Creating entities, value objects, services for simple CRUD. Use pragmatism.
7. **Mixing Layers**: Presentation logic in domain, database queries in services. Violates dependency rule.
8. **Mechanical Repository Interfaces**: Creating repository abstractions for trivial CRUD adds ceremony. Use them when they protect domain logic or match the repo pattern.
9. **Event Subscribers in Domain**: Domain should not depend on event subscribers. Publish at application layer.
10. **Ignoring ADRs**: Not documenting why architectural decisions were made. Leads to confusion and rework.

## Enforcement

### This skill is MANDATORY and must be followed without exception when its trigger fires

When designing architecture, defining domains, implementing use cases, or applying SOLID:

1. Always start with bounded context identification and ubiquitous language
2. Never allow dependencies to point outward (Domain → nothing, Application → Domain, Infra → Application)
3. Introduce repository interfaces before Prisma only when the domain is non-trivial, needs a stable test boundary, or the repository already follows that pattern
4. Always test domain models independently of frameworks
5. Always document architectural decisions in ADRs
6. Always enforce SOLID by code review, never accept God objects or Service Locators
7. Never put business logic outside the domain layer
8. When formal presentation layers exist, enforce downward imports and prohibit
   `features -> widgets`, `features -> layouts`, and `widgets -> layouts`
9. Separate browser, server and neutral contracts through curated
   `client`/`server`/`contracts` entrypoints and enforce the split in dependency
   gates

## Source References

### Clean Architecture

- Reference file: `references/ddd-tactical-patterns.md` (domain patterns and tactical building blocks)
- Robert C. Martin - "Clean Architecture: A Craftsman's Guide to Software Structure and Design" (Prentice Hall, 2017)
- Martin Fowler - "Refactoring: Improving the Design of Existing Code" (Addison-Wesley)
- SOLID Principles - <https://en.wikipedia.org/wiki/SOLID>

#### Domain-Driven Design

- Eric Evans - "Domain-Driven Design: Tackling Complexity in the Heart of Software" (Addison-Wesley, 2003)
- Vaughn Vernon - "Implementing Domain-Driven Design" (Addison-Wesley, 2013)
- Martin Fowler - "Bounded Contexts" - <https://martinfowler.com/bliki/BoundedContext.html>

#### TypeScript/Next.js Implementation

- Next.js Official Docs - <https://nextjs.org/docs>
- Prisma Docs - <https://www.prisma.io/docs/>

**Reference Document:** See `references/ddd-tactical-patterns.md` for detailed entity, value object, aggregate, repository, and domain event patterns with TypeScript examples.
