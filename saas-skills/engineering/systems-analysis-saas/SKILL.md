---
name: systems-analysis-saas
description: Procedural framework for systems analysis in SaaS B2B projects, covering requirements elicitation (functional and non-functional), system modeling (C4, BPMN, ER diagrams), wireframe specifications, MVP definition, product roadmap planning, business rules documentation, and validation checklists. Use when starting a new SaaS project, gathering requirements, creating system models, defining MVP scope, writing business rules, or validating architecture decisions with stakeholders.
metadata:
  author: Engineering Standards Team
  version: "1.0"
  last_validated: "2026-04-12"
  sources:
    - Simon Brown, "Software Architecture for Developers: The C4 Model"
    - Leffingwell, A. and Cohn, M., "Safe: Scaling Agile Framework"
    - Alan Davis, "Just Enough Requirements Management"
    - Object Management Group, "BPMN 2.0 Specification"
    - Larman, C., "Applying UML and Patterns"
---

# When to Use This Skill

Trigger this skill when:

- You start a new SaaS project and need to define scope and architecture.
- You gather requirements from stakeholders for a feature or product.
- You create system models (C4 diagrams, BPMN processes, ER data models).
- You define MVP scope and prioritize features.
- You write business rules and validation logic.
- You validate architecture decisions with technical and business stakeholders.
- You plan product roadmaps across multiple releases.

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Analyst Role in SaaS

The analyst bridges business stakeholders and development teams. Responsibilities:

- Translate business problems into technical requirements.
- Ensure requirements are complete, consistent, testable, and traceable.
- Model systems using standard notations (C4, BPMN, ER).
- Validate architecture decisions against business needs.
- Communicate trade-offs to non-technical stakeholders.
- Document decisions and rationale for future reference.

## Core Workflow

### Phase 1: Requirements Elicitation (2–3 days)

#### Functional Requirements (What the system DOES)

1. **Stakeholder interviews**: Identify primary users, their goals, and pain points.
   - Question: "What problem does this system solve?"
   - Question: "How do you currently solve this problem?"
   - Question: "What would success look like?"

2. **Observation**: Watch users perform current workflows. Identify bottlenecks.

3. **Document analysis**: Review existing systems, contracts, compliance requirements.

4. **Collaborative workshops**: Facilitate group discovery sessions to reach consensus.

5. **Format requirements as user stories or statements**:

   ```text
   The system SHALL [verb] [object] when [condition].
   Example: The system SHALL calculate invoice totals when an order is finalized.
   ```

#### Non-Functional Requirements (How the system PERFORMS)

Capture performance, scalability, security, availability, accessibility, compliance:

- **Performance**: Response time <200ms for page load, <500ms for API calls.
- **Scalability**: Support 10,000 concurrent users; handle 1 billion database records.
- **Security**: OWASP Top 10 compliance; encryption at rest and in transit; role-based access control (RBAC).
- **Availability**: 99.9% uptime SLA; RTO (recovery time) <1 hour; RPO (recovery point) <15 min.
- **Accessibility**: WCAG 2.2 Level AA compliance; screen reader support.
- **Compliance**: GDPR, CCPA, HIPAA, SOC 2 if applicable.

### Phase 2: Prioritization (MoSCoW Method)

Classify each requirement:

- **Must Have**: Core functionality to solve the main problem. Blocks MVP.
- **Should Have**: Important, but not blocking MVP. Target V1.0.
- **Could Have**: Nice-to-have. Future releases.
- **Won't Have**: Out of scope for this roadmap.

**MVP = All "Must Have" requirements**. Validate: Can a user complete the core job-to-be-done with just MVP features?

### Phase 3: System Modeling

**C4 Model** (Context, Containers, Components, Code):

1. **Level 1 – System Context**: Show your system as a black box. External actors (users, third-party APIs). One diagram.
2. **Level 2 – Containers**: Internal building blocks (web app, API server, database, message queue). Data flows between containers.
3. **Optional Level 3 – Components**: Inside one container, show internal components (services, controllers, repositories).

**Example (Mermaid C4)**:

```text
graph TB
    User["User"]
    WebApp["Next.js Web App"]
    API["Node.js API"]
    DB["PostgreSQL Database"]

    User -->|Uses| WebApp
    WebApp -->|Calls| API
    API -->|Reads/Writes| DB
```

**BPMN (Business Process Modeling Notation)**:

- Swim lanes for actors (user, system, admin).
- Tasks (activities), gateways (decisions), events (start/end).
- Shows workflow and error handling.

**Example**: Order fulfillment flow with decision gateway (Manual review required? Yes → Admin approves; No → Auto-approve).

**ER Diagram (Entity-Relationship)**:

- Entities (User, Order, Product).
- Attributes (id, email, created_at).
- Relationships (User has many Orders; Order contains many Products).

**Tools**: Draw.io, Mermaid, Figma, Excalidraw. Embed diagrams in requirements document.

### Phase 4: Wireframe Specification

Create low-fidelity wireframes for key screens:

- **Data sources**: Where does data come from? (API endpoint, local state, cache)
- **Component behavior**: Button click → modal opens? Form submit → API call?
- **Validation rules**: Required fields? Email format validation?
- **Error states**: What happens if API fails? Show error message.
- **Loading states**: Skeleton loader? Spinner? Disabled state?
- **Accessibility**: Form labels, ARIA roles, keyboard navigation.

**Wireframe annotation example**:

```text
[Login Form]
- Email field (required, email validation)
- Password field (required, min 8 chars)
- Submit button (disabled until form valid)
- Error state: Show error message in red below form
- Loading: Show spinner on button, disable submit
- Success: Redirect to dashboard
```

### Phase 5: MVP Definition

1. **List all features** from functional requirements.
2. **Apply MoSCoW**: Mark each as Must/Should/Could/Won't.
3. **Must Have features = MVP scope**.
4. **Estimate effort**: Story points or days per feature.
5. **Set timeline**: "We can deliver MVP in 8 weeks."
6. **Validate**: Core job-to-be-done completable with MVP alone? If no, reprioritize.

**Example MVP** (Project Management SaaS):

- Must Have: Create project, add tasks, assign to team members, mark tasks done.
- Should Have: Kanban board, due dates, comments, file attachments (V1.0).
- Could Have: Integrations, advanced reporting, mobile app (V2.0+).

### Phase 6: Product Roadmap

Structure releases:

- **MVP**: Target date, must-have features, success metrics.
- **V1.0**: Should-have features, timeline, dependencies on MVP.
- **V2.0**: Could-have features, timeline, estimated effort.

Example:

```text
MVP (Week 8): Basic task management
V1.0 (Week 16): Kanban board, comments, file uploads
V2.0 (Week 24): Integrations (Slack, GitHub), advanced search
```

### Phase 7: Business Rules Documentation

Structured rule format:

```text
Rule ID: BR-001
Name: Invoice Tax Calculation
Description: IF customer address is in state X AND order total > $1000
             THEN apply state tax rate to subtotal
             ELSE apply standard rate.
Source: Finance team (Sarah Chen)
Priority: High (revenue impact)
Validation: Unit test in invoice service
```

Categories of business rules:

- **Validation rules**: "Email must be unique per tenant."
- **Calculation rules**: "Discount = quantity \* 0.1."
- **Authorization rules**: "Only admins can delete users."
- **Workflow rules**: "Order → Payment → Fulfillment → Delivery."

### Phase 8: Risk Assessment

For each major architectural decision:

| Risk                            | Probability | Impact | Mitigation                                |
| ------------------------------- | ----------- | ------ | ----------------------------------------- |
| Database scaling bottleneck     | High        | High   | Use read replicas; plan sharding early    |
| Third-party API downtime        | Medium      | Medium | Implement retry logic; local fallback     |
| Team knowledge gaps (new stack) | High        | Medium | Training, pair programming, documentation |

### Phase 9: Architecture Decision Records (ADRs)

Record key decisions:

```text
# ADR-001: Choose PostgreSQL for primary database

## Status
Accepted

## Context
Need a scalable, ACID-compliant database. Considered: PostgreSQL, MySQL, MongoDB.

## Decision
Use PostgreSQL.

## Consequences
+ Strong ACID guarantees, JSON support, full-text search
- Vertical scaling limits; needs careful schema design
```

### Phase 10: Validation Checklists

**Requirements Checklist**:

- [ ] All requirements have clear acceptance criteria.
- [ ] No two requirements conflict.
- [ ] Requirements are testable (can be verified).
- [ ] Each requirement is traceable to a stakeholder need.
- [ ] Non-functional requirements are measurable.

**Architecture Checklist**:

- [ ] System design is scalable (handles 10x load).
- [ ] Security architecture covers authentication, authorization, data encryption.
- [ ] Disaster recovery plan exists (backup, failover).
- [ ] Monitoring and alerting designed for operational visibility.

**MVP Checklist**:

- [ ] MVP solves the core user problem.
- [ ] All must-have features are included.
- [ ] MVP is deliverable within timeline and budget.
- [ ] Success criteria are defined and measurable.

## Advanced Cases

**Multi-tenant SaaS**: Isolate data per customer using tenant ID in schema, queries, and API responses. Document isolation strategy clearly.

**Compliance-heavy domains** (healthcare, finance): Document every business rule tied to regulation. Add compliance row to requirements table.

**Integration with legacy systems**: Model data contracts clearly. Use adapters/ETL to bridge old and new systems.

**High-concurrency scenarios**: Design for eventual consistency if needed. Document trade-offs between consistency and availability.

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- `[INFORMATION NEEDED: stakeholder sign-off on MVP scope]` if business approval is absent.
- `[INFORMATION NEEDED: compliance requirements (GDPR, HIPAA, etc.)]` if applicable regulations are unstated.
- `[INFORMATION NEEDED: scalability target (concurrent users, data volume)]` if performance requirements are vague.
- `[INFORMATION NEEDED: current system architecture]` if modeling an integration point.
- `[INFORMATION NEEDED: budget and timeline constraints]` before finalizing roadmap.

## Anti-Patterns

- **Skipping non-functional requirements**: NFRs (performance, security, compliance) must be explicit. Ignoring them delays delivery.
- **Gold-plating MVP**: Adding should-have features to MVP delays launch. Ship MVP, iterate.
- **No business rules documentation**: Vague logic leads to bugs and inconsistent behavior. Document every rule.
- **No stakeholder validation before coding**: Discover misalignment early. Review all models with stakeholders before development starts.
- **Requirements without traceability**: Each requirement must link to a stakeholder need. Prevents scope creep.
- **Inadequate risk assessment**: Major decisions need documented trade-offs. Surprises derail projects.

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires. Skipping system modeling, MVP definition, or stakeholder validation will result in misalignment, scope creep, and project delays.

## Source References

- Brown, Simon. _Software Architecture for Developers: The C4 Model_. Leanpub, 2021.
- Leffingwell, D. and Cohn, M. _SAFe 6.0: Scaling Agile Framework_. Addison-Wesley, 2021.
- Davis, Alan M. _Just Enough Requirements Management_. Dorset House, 2005.
- Object Management Group. _Business Process Model and Notation (BPMN) 2.0_. OMG, 2011.
- Larman, Craig. _Applying UML and Patterns: An Introduction to Object-Oriented Analysis and Design_. Prentice Hall, 2004.
