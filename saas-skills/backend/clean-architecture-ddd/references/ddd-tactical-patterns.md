# DDD Tactical Patterns Reference

This document provides detailed TypeScript implementations of core Domain-Driven Design tactical patterns.

## Entity Pattern

An **Entity** is a mutable object with a persistent identity. Two entities are equal if they have the same ID, regardless of other attributes.

```typescript
// Value object for identity
export class UserId {
  constructor(readonly value: string) {
    if (!value) throw new Error("UserId cannot be empty");
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}

// Entity
export class User {
  private id: UserId;
  private email: string;
  private status: "pending" | "active" | "inactive";
  private createdAt: Date;

  constructor(id: UserId, email: string, status: string, createdAt: Date) {
    this.id = id;
    this.email = email;
    this.status = status;
    this.createdAt = createdAt;
  }

  getId(): UserId {
    return this.id;
  }

  // Business method
  deactivate(): void {
    if (this.status === "inactive") {
      throw new Error("User already inactive");
    }
    this.status = "inactive";
  }

  equals(other: User): boolean {
    return this.id.value === other.id.value;
  }
}
```

## Value Object Pattern

A **Value Object** is an immutable object with no identity, compared by value. Two value objects are equal if all their attributes are equal.

```typescript
export class Email {
  readonly value: string;

  constructor(email: string) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new Error("Invalid email format");
    }
    this.value = email.toLowerCase();
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

export class Money {
  readonly amount: number;
  readonly currency: "USD" | "EUR";

  constructor(amount: number, currency: "USD" | "EUR") {
    if (amount < 0) throw new Error("Amount cannot be negative");
    this.amount = amount;
    this.currency = currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add different currencies");
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

export class Address {
  readonly street: string;
  readonly city: string;
  readonly country: string;

  constructor(street: string, city: string, country: string) {
    this.street = street;
    this.city = city;
    this.country = country;
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.country === other.country
    );
  }
}
```

## Aggregate Pattern

An **Aggregate** is a cluster of domain objects (entities and value objects) bound together by a root entity. Only the root is accessible from outside; internal consistency is maintained within the aggregate boundary.

```typescript
export class Order {
  private id: OrderId;
  private customerId: UserId;
  private items: OrderItem[] = [];
  private status: "pending" | "shipped" | "delivered";
  private total: Money;
  private createdAt: Date;

  constructor(
    id: OrderId,
    customerId: UserId,
    status: string,
    total: Money,
    createdAt: Date,
  ) {
    this.id = id;
    this.customerId = customerId;
    this.status = status;
    this.total = total;
    this.createdAt = createdAt;
  }

  getId(): OrderId {
    return this.id;
  }
  getItems(): OrderItem[] {
    return this.items;
  }

  addItem(product: Product, quantity: number): void {
    if (this.status !== "pending") {
      throw new Error("Cannot add items to non-pending order");
    }
    const item = new OrderItem(product, quantity);
    this.items.push(item);
    this.recalculateTotal();
  }

  ship(): void {
    if (this.status !== "pending") {
      throw new Error("Can only ship pending orders");
    }
    if (this.items.length === 0) {
      throw new Error("Cannot ship empty order");
    }
    this.status = "shipped";
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      new Money(0, this.total.currency),
    );
  }
}

export class OrderItem {
  readonly product: Product;
  readonly quantity: number;

  constructor(product: Product, quantity: number) {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    this.product = product;
    this.quantity = quantity;
  }

  getSubtotal(): Money {
    return this.product.getPrice().multiply(this.quantity);
  }
}
```

## Repository Interface Pattern

A **Repository** provides a collection-like interface for persisting and retrieving aggregates. Define in domain layer, implement in infrastructure.

```typescript
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: UserId): Promise<void>;
}

import { PrismaClient } from "@prisma/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.getId().value },
      update: { email: user.getEmail().value },
      create: {
        id: user.getId().value,
        email: user.getEmail().value,
        status: user.getStatus(),
      },
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: id.value },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return record ? this.toDomain(record) : null;
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({ where: { id: id.value } });
  }

  private toDomain(record: any): User {
    return new User(
      new UserId(record.id),
      record.email,
      record.status,
      record.createdAt,
    );
  }
}
```

## Domain Event Pattern

A **Domain Event** represents something important that happened in the domain. Events are published by aggregates and subscribed to by application services.

```typescript
export abstract class DomainEvent {
  readonly occurredAt: Date = new Date();
  abstract getAggregateId(): string;
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.userId;
  }
}

export class OrderShippedEvent extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId;
  }
}

export class User {
  private domainEvents: DomainEvent[] = [];

  register(email: Email): void {
    this.email = email;
    this.status = "active";
    this.domainEvents.push(new UserRegisteredEvent(this.id.value, email.value));
  }

  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus,
  ) {}

  async execute(email: string): Promise<void> {
    const user = User.create(new Email(email));
    await this.userRepository.save(user);
    await this.eventBus.publishAll(user.getDomainEvents());
    user.clearDomainEvents();
  }
}
```

## Domain Service Pattern

A **Domain Service** contains logic that belongs to the domain but doesn't naturally fit within a single entity or value object.

```typescript
export class PricingService {
  private discountRates: Map<string, number> = new Map([
    ["GOLD", 0.1],
    ["SILVER", 0.05],
  ]);

  calculatePrice(
    basePrice: Money,
    customerTier: string,
    quantity: number,
  ): Money {
    const discount = this.discountRates.get(customerTier) || 0;
    const discountedAmount = basePrice.amount * (1 - discount);
    return new Money(discountedAmount * quantity, basePrice.currency);
  }
}

export class CalculateOrderPriceUseCase {
  constructor(private pricingService: PricingService) {}

  async execute(items: OrderItem[], customerTier: string): Promise<Money> {
    let total = new Money(0, "USD");
    for (const item of items) {
      const price = this.pricingService.calculatePrice(
        item.product.getPrice(),
        customerTier,
        item.quantity,
      );
      total = total.add(price);
    }
    return total;
  }
}
```

## Factory Pattern

A **Factory** encapsulates complex object creation logic, returning properly initialized domain objects.

```typescript
export class UserFactory {
  static createNewUser(email: Email): User {
    return new User(UserId.generate(), email, "pending", new Date());
  }

  static createFromDatabase(record: any): User {
    return new User(
      new UserId(record.id),
      record.email,
      record.status,
      record.createdAt,
    );
  }
}

export class OrderFactory {
  static createNewOrder(customerId: UserId): Order {
    return new Order(
      OrderId.generate(),
      customerId,
      "pending",
      new Money(0, "USD"),
      new Date(),
    );
  }
}
```

## Key Patterns Summary

| Pattern        | Purpose                      | Characteristics                                     |
| -------------- | ---------------------------- | --------------------------------------------------- |
| Entity         | Mutable object with identity | Identified by ID, testable, encapsulates logic      |
| Value Object   | Immutable, no identity       | Compared by value, reusable, side-effect free       |
| Aggregate      | Consistency boundary         | Root entity, internal objects, enforces invariants  |
| Repository     | Data access                  | Collection-like, interface in domain, impl in infra |
| Domain Event   | State change notification    | Published by aggregates, consumed by services       |
| Domain Service | Cross-entity logic           | Stateless, contains domain rules                    |
| Factory        | Complex creation             | Encapsulates construction, returns domain objects   |

Use these patterns to keep business logic in the domain layer, separate from frameworks and infrastructure concerns.
