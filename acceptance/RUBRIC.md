# Rubrica recalculada (mesma do parecer de 2026-09-24)

Fórmulas por dimensão: nota = 10·A/(A+R+U), limite = 10·(A+U)/(A+R+U), cobertura = (A+R)/(A+R+U). Pesos e critérios idênticos aos do parecer; nenhum critério excluído. † = crítico.

## Critérios

| CR | Dim. | Critério | Antes | Agora | Evidência |
| --- | --- | --- | --- | --- | --- |
| CR-001† | 1 | Gate `qa:skills` passa no estado auditado | REPROVADO | APROVADO | `pnpm qa` exit 0 no estado final (catálogo, 100 testes, lint, segredos, formatação) |
| CR-002 | 1 | Gate passa em clone limpo do HEAD | APROVADO | APROVADO | cópia limpa de 599 arquivos publicáveis: `pnpm install --frozen-lockfile` + `pnpm qa` (EV-clean-copy-qa.log) |
| CR-003 | 1 | Instalação+verify em destino limpo geram todos os artefatos | APROVADO | APROVADO | test: install into projects; EV-final-e2e (install + verify a partir do pacote) |
| CR-004† | 1 | Instalação funciona com caminhos não-ASCII no ambiente real | REPROVADO | APROVADO | test: non-ASCII, spaces and dashes in target and home paths; test: installed hook answers from a subdirectory of a non-ASCII project (Windows 11, Node 25.2.1) |
| CR-005 | 1 | Metadados lidos corretamente para YAML válido | REPROVADO | APROVADO | test: valid multi-line YAML metadata is parsed and rendered as the same value; test: rejects invalid YAML frontmatter |
| CR-006 | 1 | Exportações padrão geradas | APROVADO | APROVADO | exportações 2.0 = pacote `build --out` e texto de User Rules: tests `the bundle installs outside the checkout…`, `contract export for Cursor User Rules…` (critério reinterpretado: exportadores 1.x removidos) |
| CR-007 | 1 | Hook: saída no contrato e acertos em positivos | APROVADO | APROVADO | test: expected skill suggested for positive prompts; Claude Code 2.1.74 real: `provided additionalContext` |
| CR-008 | 1 | Infra de evals executa | APROVADO | APROVADO | `pnpm evals:init` + `pnpm evals:score` executam sobre a matriz 2.0 (157 casos pendentes) |
| CR-009 | 2 | Idempotência | APROVADO | APROVADO | test: second run is a no-op (idempotent) |
| CR-010 | 2 | Atualização com bump chega a todos os destinos | APROVADO | APROVADO | test: a version bump alone marks entries outdated because identity metadata changes |
| CR-011 | 2 | Remoção/renomeação sem resíduos e sem tocar alheios | APROVADO | APROVADO | test: removal and rename in the source clean managed entries only |
| CR-012† | 2 | Conteúdo alheio homônimo preservado ou conflito explícito | REPROVADO | APROVADO | test: unmanaged same-name content is never overwritten; conflict and nothing written; test: --adopt replaces an unmanaged folder only after backing it up |
| CR-013 | 2 | Edição local detectada e não perdida | REPROVADO | APROVADO | test: local edits are detected and never silently overwritten |
| CR-014† | 2 | Drift com mesma versão detectado | REPROVADO | APROVADO | test: content drift without version bump is reported and fixed by sync |
| CR-015 | 2 | Falha preserva estado anterior | REPROVADO | APROVADO | test: an injected failure rolls back to the exact previous state |
| CR-016 | 2 | Estado parcial detectável e recuperável | APROVADO | APROVADO | test: a killed process leaves a journal; status reports it and recover restores the previous state |
| CR-017 | 2 | Concorrência sem sucesso enganoso | REPROVADO | APROVADO | test: concurrent installs never produce a misleading success |
| CR-018 | 2 | Dry-run sem efeitos | APROVADO | APROVADO | test: dry-run and plan write nothing and announce removals and conflicts |
| CR-019 | 2 | Dry-run antecipa remoções/sobrescritas | REPROVADO | APROVADO | test: dry-run and plan write nothing and announce removals and conflicts |
| CR-020 | 2 | Verify detecta pacote incompleto | REPROVADO | APROVADO | test: verify detects an incomplete package (missing auxiliary file) |
| CR-021 | 2 | Superfície global do Cursor rastreável/atual | REPROVADO | NÃO VERIFICADO | pastas de usuário gerenciadas com manifest e `verify`; o texto de User Rules tem versão e hash, mas colar e conferir no Cursor é manual. O texto hoje colado nesta máquina ainda é o bootstrap 1.x (observado na sessão). |
| CR-078 | 2 | Colisão de nomes na fonte bloqueia a instalação | REPROVADO | APROVADO | test: rejects duplicate id across collections |
| CR-079 | 2 | Isolamento entre projetos com perfis diferentes | APROVADO | APROVADO | test: projects with different selections stay isolated from each other |
| CR-080 | 2 | Escopo de escrita explícito (sem efeito global implícito; flags inválidas rejeitadas) | REPROVADO | APROVADO | test: unknown flags, positional paths and missing destination are usage errors; test: project install writes only inside the target (no global side effect) |
| CR-022 | 3 | SKILL.md Claude conforme contrato | APROVADO | APROVADO | Claude Code 2.1.74 carrega as 21 skills (`Loaded 21 unique skills … project: 21`) |
| CR-023 | 3 | Hook conforme contrato de eventos/saída/timeout | APROVADO | APROVADO | test: hook install merges settings, preserves project entries and fails on non-strict JSON; Claude Code 2.1.74: hook `UserPromptSubmit` com `additionalContext` |
| CR-024 | 3 | Hook funciona fora da raiz do projeto | REPROVADO | APROVADO | test: installed hook answers from a subdirectory of a non-ASCII project |
| CR-025 | 3 | `.mdc` no formato documentado de globs | NÃO VERIFICADO | APROVADO | sem `.mdc` na 2.0; o artefato do Cursor é `SKILL.md` no formato documentado (nome = pasta, minúsculas/hífens), exigido pelo gate do catálogo (critério reinterpretado) |
| CR-026 | 3 | Descoberta nativa no Cursor | APROVADO | APROVADO | Cursor 3.22.7 lista nesta sessão skills de `~/.claude/skills`, `~/.codex/skills`, `~/.agents/skills` (observado, escopo de usuário) |
| CR-027 | 3 | `~/.cursor/rules` consumido | NÃO VERIFICADO | APROVADO | a 2.0 não escreve em `~/.cursor/rules`; as superfícies escritas (`~/.claude/skills`, `~/.agents/skills`) são lidas pelo Cursor (observado). Critério reinterpretado. |
| CR-028 | 3 | Skills com `paths:` disponíveis no Cursor sem arquivo correspondente | REPROVADO | APROVADO | nenhuma skill tem `paths:`; Claude Code: `21 unconditional, 0 conditional` |
| CR-029 | 3 | Alvo Codex = local documentado atual | REPROVADO | APROVADO | test: user scope honours CLAUDE_CONFIG_DIR and writes ~/.agents/skills for Codex/Cursor; Codex 0.147: raiz `.agents/skills` do projeto no prompt |
| CR-030 | 3 | Respeita `CLAUDE_CONFIG_DIR` | REPROVADO | APROVADO | test: user scope honours CLAUDE_CONFIG_DIR…; Claude Code real com `CLAUDE_CONFIG_DIR` isolado |
| CR-031 | 3 | Detecta cópias divergentes nos diretórios lidos pelos clientes | REPROVADO | APROVADO | test: doctor reports divergent homonymous copies…; test: project discovery stops at the git root, like the clients do; doctor somente leitura no perfil real |
| CR-032 | 3 | Ponta a ponta nativo no Claude Code | NÃO VERIFICADO | APROVADO | Claude Code 2.1.74: instalação → descoberta (projeto e usuário) → hook, sem chamada de modelo (escopo: até a fronteira do modelo) |
| CR-033 | 3 | Ponta a ponta nativo no Codex | NÃO VERIFICADO | APROVADO | Codex CLI 0.147.0-alpha.1.2: instalação → `debug prompt-input` lista as skills e os blocos do AGENTS.md (escopo: projeto; até a fronteira do modelo) |
| CR-034 | 4 | Listagem dentro do orçamento do cliente | NÃO VERIFICADO | APROVADO | lista = 1.179 tokens (o200k) para 20 skills; orçamento do Claude ≈ 1% da janela (≈ 2.000 em 200k); teste de orçamento de bytes |
| CR-035 | 4 | SKILL.md < 5.000 tokens e < 500 linhas | APROVADO | APROVADO | maior SKILL.md = 3.728 tokens; gate ≤ 500 linhas |
| CR-036 | 4 | Globs não anexam regras grandes a quase todo arquivo | REPROVADO | APROVADO | nenhuma regra por glob na 2.0 |
| CR-037 | 4 | Stub com custo baixo | APROVADO | APROVADO | custo sempre ativo = 730 tokens (contrato + política); stubs deixaram de existir (critério reinterpretado) |
| CR-038 | 4 | Mesma instrução não repetida em várias superfícies do mesmo cliente | REPROVADO | NÃO VERIFICADO | AGENTS.md/CLAUDE.md sem repetição (CLAUDE.md só importa); com Claude e Codex no mesmo projeto, o Cursor vê duas cópias idênticas (`.claude/skills` e `.agents/skills`) — deduplicação do Cursor no escopo de projeto não verificada |
| CR-039 | 4 | Roteador sem falsos positivos em neutros | APROVADO | APROVADO | test: no suggestion for neutral or ambiguous prompts |
| CR-040 | 4 | Roteador robusto a termos ambíguos | REPROVADO | APROVADO | test: no suggestion for neutral or ambiguous prompts; test: word boundaries: api does not match rapid |
| CR-041 | 4 | Precisão/recall de seleção medidos em cliente real | NÃO VERIFICADO | NÃO VERIFICADO | exige chamadas de modelo (não autorizadas) |
| CR-042 | 5 | Frontmatter válido e conforme (21/21) | APROVADO | APROVADO | gate do catálogo: 21/21 |
| CR-043 | 5 | Conteúdo autossuficiente e portátil | REPROVADO | APROVADO | gate: referências dentro do pacote e nenhum caminho de máquina (21/21) |
| CR-044 | 5 | Referências resolvíveis no runtime Cursor | REPROVADO | APROVADO | o Cursor lê a pasta copiada inteira; todas as referências resolvem dentro do pacote (gate) |
| CR-045 | 5 | Afirmações sobre runtimes corretas | REPROVADO | APROVADO | IDE_RUNTIME_GUIDE reescrito com provas reais (Codex, Claude) e limites declarados |
| CR-046 | 5 | Critérios de aplicabilidade explícitos | REPROVADO | APROVADO | `Operational Contract` (Use when / Do not use when) em 21/21; contrato com escopo e `--without-contract` |
| CR-047 | 5 | Fonte e instalado sem instruções contraditórias ativas | REPROVADO | REPROVADO | no repositório, instalado = fonte (hash); mas os perfis reais desta máquina seguem com cópias 1.x divergentes (doctor: DIVERGENT) — atualização global não autorizada |
| CR-048 | 5 | Estrutura mínima presente | APROVADO | APROVADO | gate do catálogo |
| CR-049 | 5 | Eficácia comportamental comprovada | NÃO VERIFICADO | NÃO VERIFICADO | exige chamadas de modelo (não autorizadas) |
| CR-081 | 5 | Ferramentas do repositório preservam o conteúdo operacional | REPROVADO | APROVADO | fix-markdownlint só corrige MD040 fora de cercas; 4 testes |
| CR-050 | 6 | Fonte única e geração unidirecional | APROVADO | APROVADO | fonte `saas-skills/` + registry → render → destinos |
| CR-051 | 6 | Adaptadores isolados, sem dependência de runtime | APROVADO | APROVADO | render.mjs único para todos os destinos; bytes idênticos (test identical bytes in every sink) |
| CR-052 | 6 | Modelo de estado suficiente para propriedade e identidade de conteúdo | REPROVADO | APROVADO | manifest v2 com hash por arquivo + registro de instalação |
| CR-053 | 6 | Modelo de destinos alinhado a quem lê cada diretório | REPROVADO | APROVADO | targets.mjs alinhado a Claude/Codex reais; Cursor pela documentação e observação |
| CR-054 | 6 | Material importado segregado do pipeline | APROVADO | APROVADO | test: imported/quarantined items are inventoried but never distributed |
| CR-055 | 6 | Procedência/licença do material importado | REPROVADO | REPROVADO | procedência registrada 83/83; licença declarada pelo dono como interna em 76 (não verificada) e desconhecida em 7 (remotion-*) |
| CR-056 | 6 | Um único caminho de instalação por runtime | REPROVADO | APROVADO | scripts 1.x removidos; único caminho `cw.mjs` |
| CR-057† | 7 | `name` validado antes de virar caminho | REPROVADO | APROVADO | test: rejects path traversal in name |
| CR-058 | 7 | Remoção via manifest confinada às entradas gerenciadas | REPROVADO | APROVADO | test: malicious manifest entries are rejected and nothing is deleted |
| CR-059† | 7 | Operação destrutiva sobre caminho informado protegida | REPROVADO | APROVADO | test: build refuses directories it did not create and dangerous locations |
| CR-060 | 7 | Links/junctions não removem conteúdo externo | APROVADO | APROVADO | test: a junction at an entry is a conflict and its target is untouched |
| CR-061 | 7 | Escrita confinada ao destino declarado | REPROVADO | APROVADO | test: a project runtime dir that is a junction to outside the project is refused; testes sob `--permission` confinados ao sandbox |
| CR-062 | 7 | Sem rede/subprocesso no instalador | APROVADO | APROVADO | cw.mjs e lib/ sem child_process nem rede (testes rodam sob `--permission`, que bloqueia subprocessos) |
| CR-063† | 7 | Árvore do repositório sem credenciais | REPROVADO | REPROVADO | `dist/global-runtime-validation-20260413/codex-home/auth.json` continua na árvore (ignorado pelo git); `pnpm secrets` o aponta; remoção/rotação depende do dono |
| CR-064 | 7 | Integridade/proveniência do instalado verificável | REPROVADO | APROVADO | hash por arquivo + `cw-source-hash` + `verify` |
| CR-065 | 8 | Testes automatizados do instalador | REPROVADO | APROVADO | 31 testes do motor + 28 de catálogo/blocos/hook/build |
| CR-066 | 8 | CI executando o gate | REPROVADO | NÃO VERIFICADO | `.github/workflows/qa.yml` criado; não executado (sem push autorizado) |
| CR-067 | 8 | Gate cobre cenários de risco | REPROVADO | APROVADO | `pnpm qa` inclui os cenários de risco (colisão, drift, rollback, concorrência, links, Unicode) |
| CR-068 | 8 | Smoke em sandbox com homes sintéticos | APROVADO | APROVADO | testes com homes sintéticos; perfis isolados nos testes de cliente |
| CR-069 | 8 | Resultados de evals registrados | REPROVADO | REPROVADO | nenhum resultado de avaliação comportamental registrado (sem chamadas de modelo autorizadas) |
| CR-070 | 9 | Pastas separam fonte, geradores e saídas | APROVADO | APROVADO | catalog/, scripts/, saas-skills/, imported-skills/, test/, acceptance/ |
| CR-071 | 9 | Sem duplicação relevante de lógica | REPROVADO | APROVADO | janelas de 6 linhas duplicadas entre arquivos: 41 → 0 (EV-code-metrics-2.0.json) |
| CR-072 | 9 | Lógica em funções testáveis | REPROVADO | APROVADO | lógica em scripts/lib/*.mjs; gate, inventário, fixer e roteador testados por import direto |
| CR-073 | 9 | Sem artefatos órfãos/alheios versionados | REPROVADO | REPROVADO | `.backup-runtimes/` removido; `saas-skills/integrations/cursor-rule-profiles.json` segue sem uso, mantido porque tem alteração local não commitada do dono |
| CR-074 | 10 | Manifest registra versão, origem, data e artefatos | APROVADO | APROVADO | manifest: versão, commit, data, entradas com hashes |
| CR-075 | 10 | Release rastreável a commit/tag | REPROVADO | REPROVADO | a 2.0 não está em commit nem tag (commit/tag/release não autorizados); manifests gravam o commit do HEAD |
| CR-076 | 10 | Pré-requisitos de ambiente declarados | REPROVADO | APROVADO | `engines.node >=22.13`; README declara Node e pnpm |
| CR-077 | 10 | Falhas de instalação sinalizadas por exit ≠ 0 | REPROVADO | APROVADO | códigos 1/2/3/64 testados |

## Cálculo por dimensão

| Dim. | Peso | A | R | U | Nota | Limite | Cobertura |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 Correção funcional | 20 | 8 | 0 | 0 | 10,000 | 10,000 | 100,0% |
| 2 Distribuição/estado | 15 | 15 | 0 | 1 | 9,375 | 10,000 | 93,8% |
| 3 Compatibilidade | 10 | 12 | 0 | 0 | 10,000 | 10,000 | 100,0% |
| 4 Seleção/contexto | 10 | 6 | 0 | 2 | 7,500 | 10,000 | 75,0% |
| 5 Instruções | 10 | 7 | 1 | 1 | 7,778 | 8,889 | 88,9% |
| 6 Arquitetura | 10 | 6 | 1 | 0 | 8,571 | 8,571 | 100,0% |
| 7 Segurança | 10 | 7 | 1 | 0 | 8,750 | 8,750 | 100,0% |
| 8 Testes | 7 | 3 | 1 | 1 | 6,000 | 8,000 | 80,0% |
| 9 Clean Code/pastas | 5 | 3 | 1 | 0 | 7,500 | 7,500 | 100,0% |
| 10 Operação | 3 | 3 | 1 | 0 | 7,500 | 7,500 | 100,0% |

- **Nota comprovada** = Σ(peso × nota) / 100 = **8,69** (antes: 3,7).
- **Limite superior** = **9,28** (antes: 4,4).
- **Cobertura**: 76 de 81 critérios com veredito; ponderada 94,1% (antes: 74 de 81, 93,1%).
- **Impedimentos de aprovação** (críticos não aprovados): CR-063.

Critérios reinterpretados porque o mecanismo avaliado deixou de existir na 2.0 (a intenção foi mantida e a justificativa está na linha): CR-006, CR-025, CR-027, CR-037.
