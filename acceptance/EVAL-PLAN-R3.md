# Plano de avaliação comportamental (preparado, não executado)

Nada aqui foi executado. As avaliações chamam modelos e consomem cota ou orçamento; dependem de
autorização específica (pedido em [REPORT-R3.md](REPORT-R3.md)). Os arquivos em
`saas-skills/evals/results/` são modelos vazios (0 casos preenchidos) e não contam como resultado.

## O que mede

| Critério | Pergunta | Medida |
| --- | --- | --- |
| CR-041 | O cliente escolhe a skill certa e deixa de lado as erradas? | precisão e recall por skill e por cliente |
| CR-049 | Com a skill carregada, a resposta cumpre o contrato da skill? | expectativas `minimum_output` atendidas |
| CR-069 | Os resultados ficam registrados e reproduzíveis? | transcrições brutas com hash + `pnpm evals:score` |

## Casos alinhados à finalidade do produto (além da matriz de disparo)

Estes casos medem **seleção**, **aplicação** e **qualidade** como evidências separadas.
Não colar o corpo das skills nos prompts — o cliente deve descobrir/carregar do projeto.

| ID | Família | Tarefa | Não deve | Expectativas mínimas (aplicação) |
| --- | --- | --- | --- | --- |
| P-FSD | multiplatform / react-saas / design-system | Propor a topologia `apps/clients/web` + `apps/clients/mobile` + `packages/frontend` (FSD) + `packages/ui` + `packages/design-tokens` para um produto novo | Inventar segunda árvore FSD no mobile ou import web↔mobile | Cita as pastas canônicas; `app→…→shared`; hosts finos |
| P-TOK | design-system / saas-ui | Auditar um componente que usa a fonte canônica de tokens (sem literais) | Introduzir `#C0FFEE` ou redefinir token localmente | Aponta `packages/design-tokens`; gate `tokens`/`check:tokens` |
| P-LEG | legacy-code-refactoring / multiplatform | Plano incremental para portar uma tela do fixture legado para o template | Big-bang sem testes de caracterização | Hotspots; mesmos casos; gate arch/tokens |
| P-NEG | (nenhuma especializada) | “Atualize a data no README” / pergunta neutra de git | Disparar skills de domínio (Prisma, Remotion, etc.) | Roteador/seleção: zero skills especializadas; ou só docs genéricos |
| P-API | api-design-patterns | Revisar route handler com paginação e isolamento de tenant | Misturar regras de UI FSD | Auth, envelope de erro, tenant |
| P-CRT | (só se item criativo **ativo**) | Tarefa da ferramenta real (DaVinci/Remotion/…) | Substituir por conselho genérico de “vídeo” | Critérios da skill ativa; senão pendente NR-15 |

Seleção: evidência = leitura do `SKILL.md` pelo cliente (stream-json / eventos / transcrição), não a seção `Skills Used`.
Aplicação: ≥2 de 3 `minimum_output`; `git status` limpo.
Qualidade: rubrica da skill / expectativas; registrada à parte da seleção.

## Casos (matriz existente)

- Seleção: `saas-skills/evals/skill-trigger-matrix.json`. São 21 skills, 72 prompts que devem
  acionar a skill e 64 que não devem, 136 no total.
- Aplicação: 10 tarefas analíticas (sem editar código, sem build, conforme a política de smoke do
  `AGENTS.md`). Cada uma é avaliada pelas 3 expectativas `minimum_output` da skill correspondente:
  1. revisar um route handler com paginação e isolamento de tenant (`api-design-patterns`);
  2. propor a estrutura FSD de uma feature nova em `packages/frontend` (`multiplatform-platform-architecture`);
  3. definir a estratégia de testes de um módulo (`testing-strategies`);
  4. escrever um ADR de monólito modular × hexagonal (`clean-architecture-ddd`);
  5. planejar a migração de uma tela legada (`legacy-code-refactoring`);
  6. auditar o uso de tokens de um componente (`design-system-implementation`);
  7. revisar um schema Prisma multi-tenant (`prisma-database-design`);
  8. desenhar um C4 de contêineres em Mermaid (`ai-context-diagrams`);
  9. montar o orçamento de contexto de um agente (`context-window-optimization`);
  10. definir o contrato de saída estruturada de um prompt (`prompt-engineering-hybrid`).

## Critérios de aprovação

- A evidência de seleção é a leitura do `SKILL.md` registrada pelo próprio cliente: a chamada da
  ferramenta Skill no `stream-json` do Claude Code, a leitura do arquivo nos eventos de
  `codex exec --json` e a leitura do arquivo na transcrição do Cursor. A seção `Skills Used` é
  autorrelato e não conta.
- Seleção: recall ≥ 0,80 e taxa de acionamento indevido ≤ 0,10 por cliente, em nenhuma skill
  abaixo de 2 acertos em 3.
- Aplicação: pelo menos 2 das 3 expectativas `minimum_output` em cada tarefa; nenhum arquivo do
  projeto alterado (`git status` limpo depois de cada execução).

## Execuções e consumo estimado

| Etapa | Execuções | Tokens de entrada | Tokens de saída |
| --- | ---: | ---: | ---: |
| Piloto (12 prompts, Claude Code, 1 repetição) | 12 | 0,2–0,3 M | ≤ 0,01 M |
| Seleção (136 prompts × 3 clientes × 3 repetições) | 1.224 | 18–31 M | ≤ 1,2 M |
| Aplicação (10 tarefas × 3 clientes × 2 repetições) | 60 | 2,4–4,8 M | 0,12–0,24 M |

Base da estimativa: 15–25 mil tokens de entrada por prompt de seleção (prompt do cliente, lista de
skills de cerca de 1,2 mil tokens, contrato do `AGENTS.md` de cerca de 0,7 mil e a skill quando é
carregada) e 40–80 mil por tarefa de aplicação. O custo em dinheiro depende do plano e do modelo de
cada cliente; em planos por assinatura o consumo é de cota. Regra de parada: o piloto confirma a
estimativa antes de qualquer outra etapa, e cada cliente tem um teto de execuções aprovado pelo
dono.

## Ambiente e registro

- Projetos consumidores descartáveis gerados a partir do pacote final, como o kit do Cursor
  ([CURSOR-VERIFICATION.md](CURSOR-VERIFICATION.md)).
- Claude Code e Codex em perfis isolados (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`). O login nesses
  perfis é uma ação do dono; a credencial não é copiada para o repositório nem para o kit.
- `pnpm evals:init <cliente>` cria o modelo. Um script lê as transcrições brutas e preenche os
  resultados, sem preenchimento manual. `pnpm evals:score` consolida os resultados, e as
  transcrições ficam com hash em `acceptance/evidence/`.
