# EV-R3-eval-cursor-A

- client: Cursor (Task/Composer subagent)
- version: Cursor 3.22.8 (host)
- model: Composer
- prompt: literal A (see eval-pilot/prompts/A.txt)
- git: no agent writes to produto (install artifacts only)

## Descoberta

NÃO OBSERVÁVEL (sem log nativo de Read). META do subagente declarou:
`<sandbox>\eval-pilot\produto\.agents\skills\multiplatform-platform-architecture\SKILL.md`

## Seleção

PASS — família multiplatform-platform-architecture.

## Aplicação

PASS 3/3 — hosts web+mobile; UI em packages/frontend; DS/tokens em packages.

## Resposta completa

Para um produto SaaS com web e mobile desde o início, a topologia obrigatória é:

- **UI do produto:** `packages/frontend` — única árvore Feature-Sliced Design (`app → pages → widgets → features → entities → shared`), compartilhada pelos dois clientes.
- **Design system:** `packages/ui` (contrato público + implementações `.web.tsx` / `.native.tsx`) e `packages/design-tokens` (única fonte de cores, espaçamento e tipografia).
- **Clientes:** `apps/clients/web` (Next.js) e `apps/clients/mobile` (Expo) — hosts finos com rotas, bootstrap e adaptação de plataforma (`src/app`, e `src/host`/`src/shared` só quando necessário).

**Regras de importação que eu seguiria:**

1. Clientes importam só entry points dos pacotes (`…/frontend/app`, `…/frontend/pages/*`, `…/ui`, `…/design-tokens`) — nunca `packages/*/src` nem um ao outro (mobile não importa web).
2. `packages/ui` e `packages/design-tokens` nunca importam `packages/frontend` nem os clientes; tokens não dependem de nenhum outro pacote do workspace.
3. `packages/frontend` pode usar `ui` e `design-tokens` (`shared/ui` só delega ao design system); código universal não importa `next/*`, `react-dom`, `react-native`, Node built-ins nem pacotes server-only.
4. Dentro do FSD, cada fatia importa só camadas inferiores e via `index.ts` da outra fatia — sem barrel global e sem segunda árvore FSD nos clientes.

Isso concentra telas e regras de produto num só lugar, deixa o design system como foundation estável e reduz os clientes a mapeamento de rota + integrações nativas/web — o espelho web/mobile fica de verdade, não duas UIs paralelas.

## Célula

PASS (seleção+aplicação); descoberta NÃO OBSERVÁVEL.
