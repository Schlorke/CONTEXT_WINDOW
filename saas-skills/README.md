# saas-skills

Biblioteca portátil de `Agent Skills` para desenvolvimento SaaS, com adapters operacionais para Codex, Claude e Cursor.

Esta pasta é a fonte de verdade da biblioteca. O runtime final por plataforma não é esta árvore diretamente; ele é gerado ou instalado a partir dela.

## O Que Esta Biblioteca Resolve

`saas-skills` transforma conhecimento recorrente de desenvolvimento SaaS em workflows acionáveis para agentes de IA.

Na prática, ela entrega:

- `17` skills organizadas em `5` coleções
- referências locais por skill quando necessário
- adapters de runtime para Codex, Claude e Cursor
- tooling para instalar em projetos-alvo sem tocar no código da aplicação
- tooling para instalar seletivamente em apenas uma IA
- tooling para sincronizar updates e detectar drift entre runtimes
- documentação operacional e QA

## Coleções

| Coleção          | Skills | Finalidade                                                                              |
| ---------------- | -----: | --------------------------------------------------------------------------------------- |
| `frontend`       |      4 | Design system, arquitetura React, especificações visuais e portabilidade de componentes |
| `backend`        |      3 | Clean Architecture, APIs REST e modelagem Prisma/PostgreSQL                             |
| `ai-integration` |      4 | Prompt engineering, AI UX, contexto e diagramas para agentes                            |
| `documentation`  |      2 | Documentação persistente e escrita técnica                                              |
| `engineering`    |      3 | Refatoração, análise de sistemas e estratégia de testes                                 |

## Catálogo

### frontend

- `design-system-implementation`
- `react-saas-architecture`
- `saas-ui-specifications`
- `component-reuse-portability`

### backend

- `clean-architecture-ddd`
- `api-design-patterns`
- `prisma-database-design`

### ai-integration

- `prompt-engineering-hybrid`
- `ai-interface-design`
- `context-window-optimization`
- `multi-agent-skill-installer`
- `ai-context-diagrams`

### documentation

- `intelligent-project-docs`
- `technical-research-writing`

### engineering

- `legacy-code-refactoring`
- `systems-analysis-saas`
- `testing-strategies`

## Fonte de Verdade vs Runtime

Este é o ponto mais importante da biblioteca.

### Fonte de verdade

`saas-skills/` é a fonte de verdade editorial e operacional.

Ela é usada para:

- manutenção das skills
- QA
- export de runtimes
- instalação em outros projetos
- sincronização dos runtimes já instalados

### Política de manutenção

As cópias em runtime são artefatos gerados.

- edite sempre `saas-skills/...`
- sincronize a IA desejada depois de cada alteração
- confirme o estado com `verify` e `status`

Cada runtime gerenciado recebe `.saas-skills-manifest.json` com a versão instalada. Isso permite detectar runtime ausente, legado ou desatualizado.

### Runtime Codex

Codex usa:

```text
$CODEX_HOME/skills/<skill>/SKILL.md
```

Na prática:

- se `CODEX_HOME` estiver definido, o runtime é `<CODEX_HOME>/skills/`
- se não estiver, o runtime padrão é `~/.codex/skills/`

### Runtime Claude

Claude Code usa:

```text
.claude/skills/<skill>/SKILL.md
```

e também suporta um runtime global em:

```text
~/.claude/skills/<skill>/SKILL.md
```

Para este runtime, a biblioteca instala diretórios imediatos de skill.

### Runtime Cursor

Cursor usa:

```text
.cursor/rules/*.mdc
```

e, para uso global neste repositório, também materializa rules em:

```text
~/.cursor/rules/*.mdc
```

Para este runtime, a biblioteca gera adapters `.mdc` a partir das skills canônicas.

### O Que Não Fazer

Não assuma que estes caminhos são equivalentes:

- `.claude/skills/saas-skills/...`
- `.cursor/skills/...`
- `$CODEX_HOME/skills/saas-skills/...`

Eles não são o runtime recomendado desta biblioteca.

## Documentos de Runtime

- [../AGENTS.md](../AGENTS.md): ponto de entrada para agentes no repositório
- [IDE_RUNTIME_GUIDE.md](IDE_RUNTIME_GUIDE.md): instalação correta por plataforma
- [TARGET_REPO_AGENT_GUIDE.md](TARGET_REPO_AGENT_GUIDE.md): arquivo copiável para agentes
- [PORTABILITY_MATRIX.md](PORTABILITY_MATRIX.md): matriz de instalação por ambiente

## Comandos Principais

| Comando                                       | O que faz                                                                              | Quando usar                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `pnpm export:flat-skills`                     | Gera `dist/flat-skills/`                                                               | Para Claude runtime e loaders rasos                   |
| `pnpm export:cursor-rules`                    | Gera `dist/cursor-rules/`                                                              | Para Cursor runtime                                   |
| `pnpm install:codex -- <target-dir>`          | Instala somente a Codex                                                                | Quando você quer só `$CODEX_HOME/skills/`             |
| `pnpm install:claude -- <target-dir>`         | Instala somente o Claude do projeto                                                    | Quando você quer só `.claude/skills/`                 |
| `pnpm install:cursor -- <target-dir>`         | Instala somente o Cursor do projeto                                                    | Quando você quer só `.cursor/rules/`                  |
| `pnpm install:claude-global`                  | Instala somente o Claude global                                                        | Quando você quer só `~/.claude/skills/`               |
| `pnpm install:cursor-global`                  | Instala somente o Cursor global                                                        | Quando você quer só `~/.cursor/rules/`                |
| `pnpm install:ide-runtime -- <target-dir>`    | Instala apenas Claude e Cursor no projeto-alvo                                         | Quando a Codex não entra no escopo                    |
| `pnpm verify:ide-runtime -- <target-dir>`     | Verifica apenas Claude e Cursor                                                        | Depois da instalação de projeto                       |
| `pnpm install:agent-runtimes -- <target-dir>` | Instala Codex global e Claude/Cursor no projeto                                        | Para um único fluxo multi-IA por projeto              |
| `pnpm verify:agent-runtimes -- <target-dir>`  | Verifica Codex global e Claude/Cursor no projeto                                       | Depois da instalação unificada                        |
| `pnpm sync:agent-runtimes -- <target-dir>`    | Reaplica a fonte de verdade nos runtimes selecionados                                  | Quando uma skill mudou em `saas-skills/`              |
| `pnpm sync:global-runtimes`                   | Reaplica a fonte de verdade nos runtimes globais                                       | Quando você quer atualizar tudo                       |
| `pnpm status:agent-runtimes -- <target-dir>`  | Mostra `current`, `outdated`, `missing` ou `foreign` por runtime                       | Para diagnosticar instalações                         |
| `pnpm install:global-runtimes`                | Instala Codex, Claude e Cursor globalmente                                             | Para disponibilizar a biblioteca em todos os projetos |
| `pnpm verify:global-runtimes`                 | Verifica a instalação global                                                           | Depois da instalação global                           |
| `pnpm qa:skills`                              | Executa QA completo, incluindo smoke install multi-IA, verificação e status em `dist/` | Antes de release                                      |

## Instalação por Ambiente

### Codex

Modo recomendado:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --codex-only
```

Alias curto:

```bash
pnpm install:codex -- C:\caminho\do\projeto
pnpm verify:codex -- C:\caminho\do\projeto
```

Resultado:

```text
%CODEX_HOME%\skills\
  api-design-patterns\
    SKILL.md
  react-saas-architecture\
    SKILL.md
  ...
```

### Claude Code / Claude.ai Projects

Modo recomendado:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --claude-only
```

Isso instala skills imediatamente abaixo de `.claude/skills/`.

Alias curto:

```bash
pnpm install:claude -- C:\caminho\do\projeto
pnpm verify:claude -- C:\caminho\do\projeto
```

### Claude Global

Modo recomendado:

```bash
pnpm install:global-runtimes
```

Isso instala skills em `~/.claude/skills/`.

Somente Claude global:

```bash
pnpm install:claude-global
pnpm verify:claude-global
```

### Cursor IDE

Modo recomendado:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --cursor-only
```

Isso instala adapters `.mdc` em `.cursor/rules/`.

Alias curto:

```bash
pnpm install:cursor -- C:\caminho\do\projeto
pnpm verify:cursor -- C:\caminho\do\projeto
```

### Cursor Global

Modo recomendado:

```bash
pnpm install:global-runtimes
```

Isso instala adapters `.mdc` em `~/.cursor/rules/`.

Somente Cursor global:

```bash
pnpm install:cursor-global
pnpm verify:cursor-global
```

### Claude dentro do Cursor

Se você usa Claude dentro do Cursor, trate assim:

- Claude runtime continua sendo `.claude/skills/`
- Cursor agent nativo continua sendo `.cursor/rules/`

Ou seja, você pode ter os dois runtimes no mesmo projeto sem conflito:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --project-only
```

### Codex + Claude + Cursor

Se você quer um fluxo único para as três IAs:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto
pnpm verify:agent-runtimes -- C:\caminho\do\projeto
```

### Codex + Claude + Cursor Globais

Se você quer um fluxo único global para as três IAs:

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
```

Depois de instalada, a própria biblioteca passa a oferecer a skill [multi-agent-skill-installer](C:/Projetos/Context_Window/saas-skills/ai-integration/multi-agent-skill-installer/SKILL.md:1), que você pode invocar para pedir o fluxo em linguagem natural.

## Como Atualizar uma Skill sem Criar Drift

Se uma skill mudou, o fluxo correto não é editar a cópia instalada.

Faça assim:

1. altere `saas-skills/.../SKILL.md`
2. rode o sync da IA ou do escopo desejado
3. rode `verify`
4. rode `status`

Exemplos:

```bash
pnpm sync:claude -- C:\caminho\do\projeto
pnpm verify:claude -- C:\caminho\do\projeto
pnpm status:agent-runtimes -- C:\caminho\do\projeto --claude-only
```

```bash
pnpm sync:agent-runtimes -- C:\caminho\do\projeto
pnpm verify:agent-runtimes -- C:\caminho\do\projeto
pnpm status:agent-runtimes -- C:\caminho\do\projeto
```

```bash
pnpm sync:global-runtimes
pnpm verify:global-runtimes
pnpm status:global-runtimes
```

Esse modelo resolve o problema de drift entre instâncias:

- Codex atualizada e Claude/Cursor antigas
- Claude do projeto atualizada e Claude global antiga
- rules do Cursor antigas depois de mudança de descrição ou `globs`

### GitHub Copilot / loaders sem descoberta recursiva

Use:

```bash
pnpm export:flat-skills
```

e copie `dist/flat-skills/` conforme o loader.

## Fluxo Seguro para Projeto-Alvo

Se a ideia é instalar e testar sem impactar a aplicação:

1. rode `pnpm install:agent-runtimes -- <target-dir> --dry-run`
2. confirme que só `.claude/`, `.cursor/` e os homes isolados serão tocados
3. rode `pnpm install:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox> --claude-home <sandbox> --cursor-home <sandbox>`
4. rode `pnpm verify:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox> --claude-home <sandbox> --cursor-home <sandbox>`
5. execute smoke tests de análise, sem edição
6. se aprovado, instale nos runtimes reais removendo os homes isolados

O guia pronto para o agente fazer isso está em:

- [TARGET_REPO_AGENT_GUIDE.md](TARGET_REPO_AGENT_GUIDE.md)

## Skill Installer da Codex vs Instalador Deste Repo

O `skill-installer` nativo da Codex resolve a instalação na própria Codex.

Ele não resolve sozinho:

- `~/.claude/skills/`
- `~/.cursor/rules/`
- `.claude/skills/`
- `.cursor/rules/`
- validação dos três runtimes em conjunto

O instalador deste repo resolve:

- runtime real da Codex
- runtime real do Claude local e global
- runtime real do Cursor local e global
- verificação estrutural
- manifests de runtime para detectar drift
- smoke seguro usando `--codex-home`, `--claude-home` e `--cursor-home`

## Como Levar a Biblioteca para Outro Repositório

### Para uso da biblioteca

Copie:

- `saas-skills/`
- `scripts/`
- `package.json`
- `pnpm-lock.yaml`

Se você não quiser levar o `package.json` deste repositório, ainda consegue instalar os runtimes usando `node scripts/install-agent-runtimes.mjs` e `node scripts/verify-agent-runtimes.mjs`, porque esses scripts usam apenas módulos nativos do Node.js.

Para diagnosticar drift sem depender de `pnpm`, use também:

- `node scripts/status-agent-runtimes.mjs`

### Para o agente instalar corretamente no projeto-alvo

Além do pacote acima, copie ou referencie:

- [TARGET_REPO_AGENT_GUIDE.md](TARGET_REPO_AGENT_GUIDE.md)

Esse arquivo existe exatamente para ser lido pelo agente no repositório de destino e pode ser copiado como `AGENTS.md` se você quiser deixá-lo na raiz do projeto.

## Perfis de Cursor

Os adapters de Cursor são orientados por:

- [integrations/cursor-rule-profiles.json](integrations/cursor-rule-profiles.json)

Esse arquivo define:

- nome do `.mdc`
- descrição que ajuda o Cursor a escolher a rule
- `globs` quando a rule deve ser `Auto Attached`

Quando `globs` não existem, a rule funciona como `Agent Requested`.

## QA e Estado Atual

A biblioteca mantém:

- `17` skills auditadas
- `51` casos `should_trigger`
- `51` casos `should_not_trigger`
- `17` conflitos

Documentos relacionados:

- [../CHANGELOG.md](../CHANGELOG.md)
- [QA_REPORT.md](QA_REPORT.md)
- [EVALS_REPORT.md](EVALS_REPORT.md)
- [PRACTICAL_SKILL_TEST_REPORT.md](PRACTICAL_SKILL_TEST_REPORT.md)
- [RELEASE_NOTES.md](RELEASE_NOTES.md)

Uso recomendado:

- consulte `CHANGELOG.md` para histórico público e resumido
- consulte `RELEASE_NOTES.md` para trilha operacional detalhada

## Resumo Prático

Se você quer o fluxo mais útil:

1. `pnpm install`
2. `pnpm qa:skills`
3. `pnpm install:agent-runtimes -- <target-dir>`
4. `pnpm verify:agent-runtimes -- <target-dir>`
5. para global, rode `pnpm install:global-runtimes`
6. para instalação seletiva, use `pnpm install:codex`, `pnpm install:claude` ou `pnpm install:cursor`
7. para updates, use os comandos `sync:*`
8. para validar sem tocar nos runtimes reais, use `--codex-home`, `--claude-home` e `--cursor-home`
9. use [TARGET_REPO_AGENT_GUIDE.md](TARGET_REPO_AGENT_GUIDE.md) para smoke tests sem edição
