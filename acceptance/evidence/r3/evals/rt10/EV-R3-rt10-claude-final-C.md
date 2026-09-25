# Claude final C

- executable: <user-home>\.local\bin\claude.exe
- version: 2.1.74
- model: claude-opus-4-6
- cost_usd: 0.42864425
- usage: {"input_tokens":15,"cache_creation_input_tokens":35373,"cache_read_input_tokens":249726,"output_tokens":3305,"server_tool_use":{"web_search_requests":0,"web_fetch_requests":0},"service_tier":"standard","cache_creation":{"ephemeral_1h_input_tokens":35373,"ephemeral_5m_input_tokens":0},"inference_geo":"","iterations":[],"speed":"standard"}
- result_field: 
- reads: 
- skill_tool: 
- writes_outside_or_plans: <user-home>\.claude\plans\polished-knitting-thunder.md

## Texts observed

Let me explore the repository to understand the current state before planning.
---
Now I have the full picture from the two governing skills. Let me write the plan.
---
[plan/write] # Ordem de trabalho: modernizar uma tela legada para o padr├úo web+mobile

## Contexto

O reposit├│rio adota o contrato de arquitetura multiplatform (AGENTS.md): clientes finos Next.js e Expo consumindo `packages/frontend` (FSD), `packages/ui` e `packages/design-tokens`. Uma tela antiga (legada) precisa ser migrada para essa topologia sem big-bang e sem quebrar comportamento.

As duas skills governantes s├úo `legacy-code-refactoring` e `multiplatform-platform-architecture`.

---

## Ordem de trabalho (7 etapas sequenciais)

### 1. Inventariar antes de mover qualquer coisa

- Rodar `legacy-inventory.mjs --root <repo>` para listar a estrutura atual, pastas por tipo (`components/`, `hooks/`, `utils/`), gaps contra a topologia-alvo e uma proposta de mapeamento.
- Registrar os **contratos publicos que nao podem mudar**: rota/URL, metadados SEO, chamadas de API, eventos de analytics, dados persistidos, autorizacao/RBAC.
- Fazer hotspot analysis via `git log` para identificar arquivos de alta rotatividade + baixa cobertura = prioridade real.

**Por que primeiro:** sem inventario, qualquer movimentacao e um chute. O inventario define o escopo real e evita mover codigo morto.

---

### 2. Escrever testes de caracterizacao (antes de tocar no codigo)

- Capturar o comportamento **atual** da tela (mesmo bugs): texto renderizado, roles acessiveis, payloads de API, side effects.
- Guardar os casos como dados (`characterization/cases.json`) com dois adaptadores finos ÔÇö um roda contra o codigo legado, outro contra o codigo migrado.
- Cobrir: logica pura (model/hooks), renderizacao (componente com dados mockados), chamada de API (contract test).

**Por que antes:** esses testes sao a rede de seguranca. Sem eles, nao ha como provar que a movimentacao nao mudou comportamento.

---

### 3. Garantir que o esqueleto-alvo existe

- Se o repo ainda nao tem a topologia (`apps/clients/web`, `apps/clients/mobile`, `packages/frontend`, `packages/ui`, `packages/design-tokens`), criar apenas as pastas e configs faltantes usando o template de `multiplatform-platform-architecture`.
- O cliente web assume as rotas legadas; o mobile renderiza as mesmas paginas via packages.
- **Nao mover codigo nesta etapa** ÔÇö so garantir que o destino existe e compila vazio.

---

### 4. Mover incrementalmente, um conceito por vez

Ordem de movimentacao (de baixo para cima no grafo de dependencias):

| Passo | O que mover | Destino |
|-------|-------------|---------|
| 4a | Tokens hardcoded (cores, espacamento, tipografia) | `packages/design-tokens` |
| 4b | Primitivos de UI genericos (Button, Input, Layout) | `packages/ui` (contrato + `.web.tsx` + `.native.tsx`) |
| 4c | Hooks/services de dados da entidade | `packages/frontend/src/entities/<noun>/api` |
| 4d | Modelos e logica de negocio | `packages/frontend/src/entities/<noun>/model` |
| 4e | UI de negocio (cards, listas da entidade) | `packages/frontend/src/entities/<noun>/ui` |
| 4f | Interacoes do usuario (acoes, mutations) | `packages/frontend/src/features/<verb>/` |
| 4g | Blocos compostos (toolbar, sidebar, filtros) | `packages/frontend/src/widgets/<bloco>/` |
| 4h | Conteudo da tela inteira | `packages/frontend/src/pages/<pagina>/ui` |
| 4i | Arquivo de rota | `apps/clients/web/src/app/<rota>/page.tsx` (server component importando a page) |

**Regra por movimento:**
- Cada commit move **um conceito** e corrige os imports na mesma mudanca.
- Rodar testes de caracterizacao + `pnpm arch` apos cada commit.
- Se o gate falhar, corrigir antes de avancar ÔÇö nunca acumular violacoes.

---

### 5. Evitar big-bang: regime de transicao

- Manter o codigo legado funcionando enquanto o migrado nao passa nos mesmos testes de caracterizacao.
- Deletar a estrutura legada **somente** apos a substituicao passar nos mesmos casos.
- Estados intermediarios sao rotulados como "intermediate" no log de migracao ÔÇö nunca como conformidade final.
- Feature flags so se houver mudanca de comportamento em runtime; movimentacoes puramente e
---
A ordem de trabalho est├í descrita no plano. Resumindo os tr├¬s pontos centrais:

**O que validar antes de mover c├│digo:**
1. Invent├írio completo (estrutura, contratos p├║blicos: rotas, SEO, APIs, analytics)
2. Testes de caracteriza├º├úo verdes contra o c├│digo legado (a rede de seguran├ºa)
3. Hotspots via git (alta rotatividade + baixa cobertura = onde come├ºar)
4. Esqueleto-alvo compilando vazio

**Como evitar big-bang:**
- Um conceito por commit, de baixo para cima (tokens ÔåÆ primitivos UI ÔåÆ entidades ÔåÆ features ÔåÆ widgets ÔåÆ pages ÔåÆ rotas)
- Gate (`pnpm arch` + testes de caracteriza├º├úo) a cada commit
- C├│digo legado s├│ ├® deletado ap├│s a substitui├º├úo passar nos mesmos testes
- Estados intermedi├írios rotulados como tal, nunca como conformidade final

**Estrutura-alvo:**
- Clientes finos (`apps/clients/web` e `mobile`) com apenas rotas e bootstrap
- Tela inteira em `packages/frontend/src/pages/<pagina>/`
- L├│gica de neg├│cio em `entities/` e `features/` (FSD estrito)
- UI gen├®rica em `packages/ui` com variantes `.web.tsx`/`.native.tsx`
- Tokens em `packages/design-tokens` como ├║nica fonte de verdade
