# Detailed Mermaid Examples for AI Context Diagrams

## Type 1: System Context (C4 Level 1)

**Use case:** Show your system + external actors.

### Mermaid code

```mermaid
graph TB
    User["👤 End User"]
    Admin["👤 Admin"]
    ExtAPI["🔗 External Payment API"]
    YourSystem["📦 Payment SaaS"]

    User -->|Uses| YourSystem
    Admin -->|Manages| YourSystem
    YourSystem -->|Calls| ExtAPI

    style YourSystem fill:#4A90E2
    style User fill:#E8F4F8
    style Admin fill:#E8F4F8
    style ExtAPI fill:#FFE5E5
```

**When to use:** Project overview. First diagram in AGENTS.md.

---

## Type 2: Container Diagram (C4 Level 2)

**Use case:** Show major applications/databases/services within your system.

### Mermaid code: (2)

```mermaid
graph TB
    Web["Web App (React)"]
    API["API Server (Node.js)"]
    Auth["Auth Service"]
    DB["PostgreSQL"]
    Cache["Redis"]
    Queue["Message Queue"]

    Web --> API
    API --> Auth
    API --> DB
    API --> Cache
    API --> Queue
```

**When to use:** Architecture docs. Module README files. First document for new engineers.

---

## Type 3: Component Diagram (C4 Level 3)

**Use case:** Internal structure of one container. What components/modules are inside?

### Mermaid code: (3)

```mermaid
graph TB
    subgraph API["API Server"]
        Router["Router"]
        Auth["Auth Middleware"]
        Charge["Charge Handler"]
        Log["Logger"]
    end
    Router --> Auth --> Charge
    Charge --> Log
    Charge -->|Call| Stripe["Stripe API"]
    Charge -->|Insert| DB["PostgreSQL"]
```

**When to use:** Deep-dive docs for a specific service. Code review guidance.

---

## Type 4: Sequence Diagram

**Use case:** Step-by-step message flow for a specific user action.

### Mermaid code: (4)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Web as 🌐 Web App
    participant API as ⚙️ API Server
    participant Auth as 🔐 Auth Service
    participant Payment as 💳 Payment Service

    User ->> Web: Click "Pay Now"
    Web ->> API: POST /charges (JWT in header)
    API ->> Auth: Validate JWT
    Auth -->> API: ✓ Valid
    API ->> Payment: Process Charge
    Payment -->> API: {id, status: "success"}
    API -->> Web: {charge_id, status}
    Web -->> User: "Payment Complete"
```

**When to use:** Feature documentation. Onboarding new devs. Debugging flows.

---

## Type 5: State Diagram

**Use case:** What states can an entity be in? How do they transition?

### Mermaid code: (5)

```mermaid
stateDiagram-v2
    [*] --> Pending: Charge Created
    Pending --> Processing: Processing Started
    Pending --> Failed: Validation Failed
    Processing --> Succeeded: Payment Approved
    Processing --> Failed: Payment Declined
    Processing --> Refunding: Refund Requested
    Refunding --> Refunded: Refund Complete
    Succeeded --> [*]
    Failed --> [*]
    Refunded --> [*]
```

**When to use:** Explaining order/charge/subscription lifecycle. State machine docs.

---

## Type 6: Flowchart (Data Flow or Process)

**Use case:** Algorithm, business logic, or process flow.

### Mermaid code: (6)

```mermaid
flowchart TD
    Start([User Submits Payment]) --> Input[Input: amount, card]
    Input --> Validate{Valid Card?}
    Validate -->|No| Error1["Error: Invalid Card"]
    Error1 --> End1([Return Error])
    Validate -->|Yes| Check{Sufficient Balance?}
    Check -->|No| Error2["Error: Insufficient Funds"]
    Error2 --> End1
    Check -->|Yes| Charge["Charge Card"]
    Charge --> Save["Save to Database"]
    Save --> Confirm["Send Confirmation"]
    Confirm --> End2([Success])
```

**When to use:** Algorithm explanations. Decision logic. Validation rules.

---

## Type 7: Entity Relationship Diagram (ER)

**Use case:** Database schema relationships.

### Mermaid code: (7)

```mermaid
erDiagram
    USER ||--o{ CHARGE : has
    CHARGE ||--o{ REFUND : "may have"
    USER { int user_id PK }
    CHARGE { int charge_id PK, decimal amount }
    REFUND { int refund_id PK, decimal amount }
```

**When to use:** Database documentation. Schema evolution docs.

---

## Type 8: Deployment Diagram

**Use case:** How is the system deployed? What runs where?

### Mermaid code: (8)

```mermaid
graph TB
    subgraph AWS["AWS (Prod)"]
        LB["Load Balancer"]
        API["API Pods (K8s)"]
        DB["RDS"]
    end
    CDN["CDN"]
    CDN --> LB
    LB --> API
    API --> DB
```

**When to use:** DevOps docs. Infrastructure overview.

---

## Advanced Pattern: Async Message Flows

Show Service A publishes to queue, Service B consumes.

```mermaid
graph TB
    OrderService["Order Service"]
    Queue["Message Queue (RabbitMQ)"]
    PaymentService["Payment Service"]
    EmailService["Email Service"]

    OrderService -->|Publish: order.created| Queue
    Queue -->|Subscribe| PaymentService
    Queue -->|Subscribe| EmailService

    style Queue fill:#FFD4B6
```

---

## Advanced Pattern: Conditional Flows

Show different paths based on conditions (success/failure).

```mermaid
flowchart TD
    Start["Payment Initiated"]
    Validate{Valid Card?}
    Process["Process with Stripe"]
    Success["Success"]
    Fail["Failure"]

    Start --> Validate
    Validate -->|Yes| Process
    Validate -->|No| Fail
    Process -->|Approved| Success
    Process -->|Declined| Fail
```

---

## Advanced Pattern: Multiple Environments

Show architecture differences by environment.

```mermaid
graph TB
    Web["Web App"]
    API["API Server"]
    DB["Database"]

    Web --> API
    API --> DB

    note over DB
        DEV: Postgres (local)
        STAGING: RDS (AWS)
        PROD: RDS + read replicas (AWS)
    end
```

---

## Advanced Pattern: Decision Tree for AI Agents

Help AI agent understand "when should you call which service?"

```mermaid
flowchart TD
    Query["User Query"]
    IsAuth{Is it about<br/>authentication?}
    IsPayment{Is it about<br/>payments?}
    IsData{Is it about<br/>user data?}

    Query --> IsAuth
    IsAuth -->|Yes| AuthSvc["Call Auth Service"]
    IsAuth -->|No| IsPayment
    IsPayment -->|Yes| PaymentSvc["Call Payment Service"]
    IsPayment -->|No| IsData
    IsData -->|Yes| DataSvc["Call API Server"]
    IsData -->|No| NotFound["Not found. Ask user"]
```

---

## Optimization Rules for LLM Parsing

### Rule 1: Keep Diagrams Focused (Max 15-20 Nodes)

#### Good (LLM Clear)

```mermaid
graph TB
    Web["Web App"]
    API["API Server"]
    Auth["Auth Service"]
    DB["Database"]

    Web --> API
    API --> Auth
    API --> DB
    Auth --> DB
```

### Rule 2: Use Descriptive Labels, Not Abbreviations

#### Good

```mermaid
graph TB
    Web["Web Server (React)"]
    API["API Server (Node.js)"]
    DB["PostgreSQL Database"]

    Web --> API
    API --> DB
```

### Rule 3: Add Comments for Context

```mermaid
graph TB
    %% Frontend
    Web["Web App (React)"]

    %% Backend Services
    API["API Server (Node.js)"]
    Auth["Auth Service (Node.js)"]

    %% Data
    DB["PostgreSQL"]

    %% Connections
    Web -->|REST API calls| API
    API -->|JWT validation| Auth
    API -->|Read/Write data| DB
    Auth -->|Query users| DB
```

### Rule 4: One Diagram = One Concern

Don't mix deployment boxes, service boxes, databases, external APIs, user roles, and message flows in one diagram. Use separate diagrams per concern.
