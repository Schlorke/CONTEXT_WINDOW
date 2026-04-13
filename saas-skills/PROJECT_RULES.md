# PROJECT RULES — Regras Universais para Projetos SaaS

**Propósito:** Este arquivo contém declarações universais ("sempre X", "nunca Y") que se aplicam a **todo** código em projetos SaaS do desenvolvedor. Diferente de skills (que são procedurais e ativadas por trigger), estas são regras sempre ativas.

**Como usar:** Copie o bloco de regras relevante para o arquivo de configuração do seu ambiente:

- Claude Code → `.claude/RULES.md` ou system prompt do projeto
- Cursor → `.cursorrules` na raiz do projeto
- VS Code Copilot → `.github/copilot-instructions.md`
- Continue.dev → `.continuerc.json` rules
- System prompt genérico → Cole no início do contexto

---

## Bloco Copiável (Inglês — melhor performance em todos os modelos)

```markdown
# Project Rules — Always Active

## TypeScript

- ALWAYS use TypeScript strict mode (`"strict": true` in tsconfig.json). Never disable strict checks.
- NEVER use `any` type. Use `unknown` when the type is truly unknown, then narrow with type guards. If you need a flexible type, use generics.
- ALWAYS define explicit return types for exported functions and public API methods.
- ALWAYS use `as const` for literal objects that should not be mutated.
- Prefer `interface` for object shapes that may be extended. Use `type` for unions, intersections, and mapped types.

## React / Next.js

- ALWAYS prefer React Server Components (RSC) for data fetching and static rendering. Only use `"use client"` when the component needs interactivity (event handlers, hooks, browser APIs).
- ALWAYS use the Next.js App Router (`app/` directory). Do not use the Pages Router for new code.
- ALWAYS use named exports for components, hooks, and utilities. Default exports are only acceptable for `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` (Next.js conventions).
- NEVER mutate props or state directly. Always use immutable patterns (spread, map, filter).
- ALWAYS co-locate tests, stories, and types next to their component file.

## Styling

- ALWAYS use Tailwind CSS for styling. Do not use CSS Modules, styled-components, or inline style objects unless integrating with a third-party library that requires it.
- ALWAYS use the project's design tokens (via CSS custom properties or Tailwind config) instead of hardcoded color/spacing values.
- NEVER use arbitrary Tailwind values (`w-[347px]`) when a token exists. If no token fits, add one to the design system first.

## Data & Validation

- ALWAYS use Zod for runtime input validation (API routes, form inputs, external data). TypeScript types alone are not sufficient — they don't exist at runtime.
- ALWAYS use `Decimal.js` (or Prisma's `Decimal` type) for monetary values and financial calculations. Never use `number` or `float` for money.
- ALWAYS validate and sanitize user input on the server side, even if client-side validation exists.

## Database (Prisma / PostgreSQL)

- ALWAYS add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` to every model.
- ALWAYS use `cuid()` or `uuid()` for primary key generation. Never expose auto-increment IDs in public APIs.
- NEVER edit generated Prisma migration files unless absolutely necessary (and document why in an ADR).
- ALWAYS add `@@index` on fields used in WHERE, ORDER BY, or JOIN clauses.

## Error Handling

- ALWAYS handle errors explicitly. Never use empty catch blocks. At minimum, log the error and re-throw or return a meaningful error response.
- ALWAYS use a standardized error response format in APIs: `{ error: { code: string, message: string, details?: unknown } }`.
- NEVER expose stack traces, internal paths, or database error details to the client in production.

## Security

- NEVER commit `.env` files, API keys, secrets, or credentials to version control. Use `.env.example` with placeholder values.
- ALWAYS validate authentication and authorization on every API route. Never rely solely on client-side checks.
- ALWAYS use parameterized queries (Prisma handles this by default). Never concatenate user input into raw SQL.

## Code Quality

- ALWAYS write meaningful variable and function names. Prefer `getUserById` over `getUser` or `fetch`. Prefer `isAuthenticated` over `auth` for booleans.
- NEVER leave `console.log` in production code. Use a structured logger (e.g., `pino`, `winston`) for server-side logging.
- ALWAYS keep components under 300 lines. If a component exceeds this, extract sub-components or hooks.
- ALWAYS keep functions under 50 lines. If a function exceeds this, extract helper functions.

## Accessibility

- ALWAYS use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`) instead of generic `<div>` with click handlers.
- ALWAYS provide `alt` text for images. Use `alt=""` for decorative images.
- ALWAYS ensure interactive elements are keyboard-accessible (focusable, operable with Enter/Space).

## Documentation

- ALWAYS update AGENTS.md when the project structure or key conventions change.
- ALWAYS create an ADR (Architecture Decision Record) for non-trivial architectural decisions.
- NEVER leave TODO comments without a linked issue or ticket number.
```

---

## Notas de Implementação

### Por que separar rules de skills?

Rules são declarações universais que SEMPRE se aplicam — não têm trigger condicional, não têm workflow com passos. Se você colocar "sempre use TypeScript strict" dentro de uma skill, ela só seria carregada quando o trigger da skill disparasse. Como rule, ela está sempre no contexto do agente.

### Personalização

As regras acima refletem a stack e as boas práticas identificadas no repositório Context_Window. Ajuste conforme necessário:

- **Se usar outra lib de validação** (ex: Yup, Valibot): substitua "Zod" pela sua escolha.
- **Se usar outro ORM** (ex: Drizzle, Kysely): adapte as regras de Prisma.
- **Se usar CSS Modules ou styled-components**: remova a regra de "ALWAYS use Tailwind CSS".
- **Se o projeto não lida com dinheiro**: remova a regra de Decimal.js.

### Relação com as Skills

Estas rules são complementares às 16 skills da biblioteca `saas-skills/`. As rules definem o que SEMPRE fazer. As skills definem COMO fazer quando um procedimento específico é necessário.

Exemplo: a rule diz "ALWAYS add createdAt/updatedAt to every model". A skill `prisma-database-design` ensina o workflow completo de schema design, migrations e otimização de queries.

---

## Formato por Ambiente

### Para `.cursorrules` (Cursor IDE)

Copie o bloco inteiro acima. O Cursor lê `.cursorrules` como system prompt.

### Para `.claude/RULES.md` (Claude Code)

Crie o arquivo `.claude/RULES.md` na raiz do projeto e cole o bloco. Claude Code carrega automaticamente.

### Para `.github/copilot-instructions.md` (GitHub Copilot)

Crie o arquivo e cole o bloco. Copilot usa como instrução de contexto.

### Para system prompt genérico

Adicione como primeiro bloco do system prompt, antes de qualquer skill ou contexto de projeto.
