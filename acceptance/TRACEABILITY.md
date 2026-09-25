# Rastreabilidade: achado → causa → mudança → teste → evidência → estado

Achados do parecer de 2026-09-24 (`ACH-001` a `ACH-028`). Testes citados pelo nome estão em `test/`
e a lista completa executada está em `evidence/TEST-2.0-names.txt`.

| Achado | Causa na 1.x | Mudança na 2.0 | Teste / evidência | Estado |
| --- | --- | --- | --- | --- |
| ACH-001 conteúdo alheio homônimo sobrescrito | cópia sem checar dono da pasta | `planSink`: `unmanaged-collision` bloqueia; `--adopt` com backup | unmanaged same-name content is never overwritten…; --adopt replaces … after backing it up | ENCERRADO |
| ACH-002 exportadores apagam a pasta de saída | `rmSync` recursivo no caminho informado | exportadores removidos; `build --out` só aceita pasta nova, vazia ou build anterior | build refuses directories it did not create and dangerous locations | ENCERRADO |
| ACH-003 `name` usado como caminho | sem validação do id | `SKILL_ID` + `name` = id no gate; manifest valida ids | rejects path traversal in name | ENCERRADO |
| ACH-004 caminhos não-ASCII | `fs.cpSync` (bug do Node 25.2) | `fsx.mjs` sem `cpSync`/`rmSync`, cópia por arquivo | non-ASCII, spaces and dashes in target and home paths | ENCERRADO |
| ACH-005 credencial em `dist/` | cópia de home do Codex dentro do repo | `pnpm secrets` detecta sem imprimir o valor; remoção não autorizada | tooling.test (secret scan); `pnpm secrets` aponta `dist/.../auth.json` | ABERTO (ação do dono) |
| ACH-006 drift invisível; verify aprova pacote incompleto | manifest sem hash | manifest v2 com hash por arquivo; `verify` compara tudo | content drift without version bump…; verify detects an incomplete package | ENCERRADO |
| ACH-007 manifest confiado (artefato `"."`) | guarda só contra `..` | `validateManifest` (ids seguros, caminhos relativos) | malicious manifest entries are rejected…; a manifest file path escaping… | ENCERRADO |
| ACH-008 edições locais sobrescritas | sem comparação com o instalado | conflito `locally-modified`; `--force-local` com backup | local edits are detected and never silently overwritten | ENCERRADO |
| ACH-009 atualização não atômica | escrita direta | staging, journal, rollback, manifest por último | an injected failure rolls back…; a killed process leaves a journal… | ENCERRADO |
| ACH-010 sem exclusão mútua | nenhum lock | lock publicado com `linkSync`, replanejamento sob lock | concurrent installs never produce a misleading success | ENCERRADO |
| ACH-011 destinos desalinhados; duplicatas | `$CODEX_HOME/skills`, `.mdc`, sem varredura | `.agents/skills`/`.claude/skills`; sink único Claude+Cursor; `doctor` por cliente até a raiz git | user scope honours CLAUDE_CONFIG_DIR…; doctor reports divergent…; clients.test (Codex 0.147, Claude 2.1.74) | PARCIAL (Cursor de projeto não verificado) |
| ACH-012 gate de QA quebrado | pipeline 1.x | `pnpm qa` novo | `pnpm qa` exit 0; cópia limpa (EV-clean-copy-qa.log) | ENCERRADO |
| ACH-013 instruções contraditórias; mandato sem critério | fonte e instalado divergentes; contrato universal | skills reescritas; contrato com escopo e `--without-contract`; `verify` acusa divergência | catalog gate; doctor no perfil real (somente leitura) | PARCIAL (perfis reais com cópias 1.x) |
| ACH-014 regras Cursor sem recursos | `.mdc` sem `references/` | Cursor lê a pasta da skill inteira | gate: referências dentro do pacote | ENCERRADO |
| ACH-015 globs amplos | auto-attach por glob | sem regras por glob | medição de contexto (TEST-context-2.0.json) | ENCERRADO |
| ACH-016 fix-markdownlint corrompe conteúdo | títulos alterados dentro de cercas | só MD040, fora de cercas | tooling.test (4 casos) | ENCERRADO |
| ACH-017 frontmatter por regex | parser ad hoc | js-yaml 4.1.1 vendorizado, schema failsafe | rejects invalid YAML…; valid multi-line YAML metadata… | ENCERRADO |
| ACH-018 escopo global implícito; flags aceitas | CLI permissivo | `--target`/`--user` obrigatório, parser estrito | unknown flags, positional paths… | ENCERRADO |
| ACH-019 prévia omite destrutivas | dry-run parcial | `plan` lista create/update/replace/remove/conflitos | dry-run and plan write nothing and announce removals… | ENCERRADO |
| ACH-020 hook Claude frágil | caminho relativo ao cwd | `$CLAUDE_PROJECT_DIR`, fallback, JSON estrito | installed hook answers from a subdirectory…; Claude Code real | ENCERRADO |
| ACH-021 roteador por palavra isolada | substring | gatilhos multipalavra, fronteira de palavra | no suggestion for neutral or ambiguous prompts | ENCERRADO |
| ACH-022 política Skills Used fraca | bloco sem hash | blocos gerenciados com hash; edição = conflito | an edited or malformed block is a conflict…; a 1.x usage-policy block… | ENCERRADO |
| ACH-023 instalador legado divergente | dois caminhos | scripts 1.x removidos | inventário de scripts | ENCERRADO |
| ACH-024 sem avaliação comportamental | nenhuma execução de modelo | ferramentas de replay atualizadas; execução não autorizada | `pnpm evals:init` / `evals:score` rodam (157 pendentes) | ABERTO |
| ACH-025 conteúdo dependente da máquina | caminhos `C:/...` | gate bloqueia caminhos de máquina | rejects machine-specific path; rejects POSIX home path | ENCERRADO |
| ACH-026 material alheio | importados sem procedência; `.backup-runtimes/` | registry com origem de 83/83; `.backup-runtimes/` removido | catalog gate | PARCIAL (licença declarada, não verificada; `cursor-rule-profiles.json` mantido) |
| ACH-027 sem testes/CI; duplicação | nenhum teste | 100 testes `node:test`; CI escrita; duplicação 41 → 0 janelas | `pnpm test`; EV-code-metrics-2.0.json | PARCIAL (CI não executada) |
| ACH-028 `metadata` fora da especificação | valores não-string | metadata sempre string (failsafe + render) | valid multi-line YAML metadata… | ENCERRADO |

Requisitos novos do contrato de implementação (NR-01 a NR-15), com estado e evidência, estão em
`contract.json` (`newRequirements`).
