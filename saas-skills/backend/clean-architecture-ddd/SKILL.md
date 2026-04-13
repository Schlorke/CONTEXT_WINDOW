---
name: clean-architecture-ddd
description: Apply Clean Architecture layers, SOLID principles, and Domain-Driven Design patterns to TypeScript/Next.js/Prisma SaaS. Use when architecting application layers, defining domain boundaries, implementing use cases, applying SOLID to React/Node, choosing DDD patterns, or writing Architectural Decision Records. Triggers on clean architecture, SOLID, DDD, domain layer, use cases, bounded context, aggregate, entity, value object, architectural decision, ADR.
metadata:
  author: SaaS Skills Collection
  version: "1.0"
  last_validated: "2026-04-12"
  sources:
    - references/ddd-tactical-patterns.md
    - Robert C. Martin - "Clean Architecture"
    - Eric Evans - "Domain-Driven Design: Tackling Complexity"
    - Vaughn Vernon - "Implementing Domain-Driven Design"
    - Martin Fowler - "Refactoring patterns"
---

# When to Use This Skill

Use this skill when you need to:

- Design layered architecture for a new SaaS module or entire application
- Define and enforce SOLID principles in TypeScript services, React components, or Node.js handlers
- Decompose a domain into bounded contexts and context maps
- Implement domain models (entities, value objects, aggregates)
- Create use case/application service classes
- Make architectural decisions and document them with ADRs
- Refactor procedural code into domain-driven patterns
- Establish domain terminology and ubiquitous language across teams
- Define repository interfaces and infrastructure implementations

Triggered by: clean architecture, SOLID design, DDD, domain models, bounded context, aggregate, entity, value object, use cases, context map, architectural decision, ADR.

## Core Workflow

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

- Next.js Route Handlers (`app/api/[route]`)
- React Components
- API endpoint handlers (thin, call use cases)

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

// In Next.js route handler
export async function POST(req: NextRequest) {
  const body = await req.json();
  const useCase = makeCreateUserUseCase();
  const result = await useCase.execute(body.email);
  return NextResponse.json(result);
}
```

### Phase 7: Document with Architectural Decision Records (ADR)

Create `docs/adr/001-chosen-architecture.md`:

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
3. Create repository interfaces for data access
4. Wrap Prisma calls in repository implementations
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
3. **Direct Prisma in Use Cases**: Creates tight coupling to ORM. Use repository interfaces instead.
4. **No Bounded Contexts**: Treating entire application as one domain. Leads to tangled code and team friction.
5. **Ignoring Ubiquitous Language**: Inconsistent naming (User vs. Account vs. Member). Confuses team.
6. **Over-Architecting**: Creating entities, value objects, services for simple CRUD. Use pragmatism.
7. **Mixing Layers**: Presentation logic in domain, database queries in services. Violates dependency rule.
8. **No Repository Interfaces**: Coupling application to Prisma directly. Hard to swap implementations.
9. **Event Subscribers in Domain**: Domain should not depend on event subscribers. Publish at application layer.
10. **Ignoring ADRs**: Not documenting why architectural decisions were made. Leads to confusion and rework.

## Enforcement

### This skill is MANDATORY and must be followed without exception when its trigger fires

When designing architecture, defining domains, implementing use cases, or applying SOLID:

1. Always start with bounded context identification and ubiquitous language
2. Never allow dependencies to point outward (Domain → nothing, Application → Domain, Infra → Application)
3. Always extract repository interfaces before implementing with Prisma
4. Always test domain models independently of frameworks
5. Always document architectural decisions in ADRs
6. Always enforce SOLID by code review, never accept God objects or Service Locators
7. Never put business logic outside the domain layer

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
