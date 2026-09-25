# Context Window

Biblioteca canônica de skills para desenvolvimento de produtos SaaS, distribuída com segurança para
**Claude Code**, **Codex** e **Cursor**. Este repositório não é um produto: é a fonte de verdade das
skills, do instalador `cw`, dos gates de qualidade, do gate de arquitetura e do template de produto
web + mobile.

## Arquitetura obrigatória nos projetos que recebem a biblioteca

Todo repositório de produto com frontend segue o mesmo contrato desde o primeiro dia:

```text
apps/clients/web        Next.js — host fino: rotas, bootstrap, configuração, integração de plataforma
apps/clients/mobile     Expo/React Native — host fino executável, consome os mesmos pacotes
packages/frontend       frontend do produto em Feature-Sliced Design estrito
                        (app → pages → widgets → features → entities → shared)
packages/ui             design system: contrato + implementação .web.tsx + .native.tsx
packages/design-tokens  tokens e temas canônicos (única origem de cor, espaço e tipografia)
```

- O mobile não importa o web e não ganha uma segunda árvore FSD das mesmas telas.
- Os clientes importam só pontos de entrada (`@escopo/frontend/app`, `@escopo/frontend/pages/*`,
  `@escopo/ui`, `@escopo/design-tokens`).
- O backend escolhe monólito modular ou portas e adaptadores; FSD não se aplica ao backend.
- `pnpm arch` (gate `tools/arch-check.mjs`) bloqueia violações de camada, slice, API pública,
  runtime e fronteira de pacote.

Texto normativo: [CLIENT_FSD_MIRROR.md](saas-skills/docs/governance/CLIENT_FSD_MIRROR.md). O mesmo
contrato vai para o `AGENTS.md` do projeto quando a biblioteca é instalada com o perfil `dev`.

## Começo rápido

Requisitos: Node.js 22.13 ou mais novo e o pnpm fixado em `packageManager` (via Corepack ou a
mesma versão instalada).

```bash
pnpm install --frozen-lockfile
pnpm qa
```

`pnpm qa` roda o gate do catálogo, a suíte de testes, o lint de Markdown do conteúdo canônico, a
varredura de segredos e a verificação de formatação.

### Instalar em um projeto

```bash
node scripts/cw.mjs plan --target <projeto> --profile dev
node scripts/cw.mjs install --target <projeto> --profile dev
node scripts/cw.mjs verify --target <projeto>
```

`plan` mostra cada arquivo que seria criado, atualizado ou removido antes de qualquer escrita.
`install` para com código 2 se houver conflito (pasta de mesmo nome não gerenciada, cópia editada à
mão, instalação 1.x, link simbólico) e não escreve nada.

Onde cada cliente encontra as skills:

| Cliente     | Projeto                                  | Usuário                                               |
| ----------- | ---------------------------------------- | ----------------------------------------------------- |
| Claude Code | `.claude/skills/`                        | `~/.claude/skills/` (ou `$CLAUDE_CONFIG_DIR/skills`)  |
| Codex       | `.agents/skills/`                        | `~/.agents/skills/`                                   |
| Cursor      | lê `.claude/skills/` e `.agents/skills/` | lê as pastas do usuário; User Rules são coladas à mão |

Detalhes, versões testadas e limites: [IDE_RUNTIME_GUIDE.md](saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md).

### Validar antes em perfil isolado

```bash
node scripts/cw.mjs install --target <projeto-descartavel> --profile dev --home <sandbox>/home
node scripts/cw.mjs doctor --target <projeto-descartavel> --home <sandbox>/home
```

`--home` isola `~`, `~/.claude` e `~/.codex`. Nunca aponte esses parâmetros para o perfil real para
fazer um teste passar.

### Instalar para o usuário (todos os projetos)

```bash
node scripts/cw.mjs install --user --profile dev
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
```

O segundo comando imprime o texto para colar em **Cursor Settings > Rules**; esse passo é manual.
Mantenha a biblioteca em um só escopo por cliente: `doctor` aponta cópias duplicadas ou divergentes
entre projeto e usuário.

### Atualizar, reparar, remover

```bash
node scripts/cw.mjs install --target <projeto>
node scripts/cw.mjs status --target <projeto>
node scripts/cw.mjs recover --target <projeto>
node scripts/cw.mjs uninstall --target <projeto> --dry-run
```

Instalações 1.x (`.saas-skills-manifest.json`) são detectadas; use `--migrate-legacy` para
substituí-las ou `--keep-legacy` para mantê-las.

### Distribuir fora do checkout

```bash
node scripts/cw.mjs build --out <pasta-vazia>
node <pasta-vazia>/scripts/cw.mjs install --target <projeto> --profile dev
```

O pacote contém as skills ativas, o lock do catálogo, os textos do contrato e o CLI; material
importado ou em quarentena nunca entra. `build` recusa arquivos privados (`.env*` exceto
`.env.example`, `auth.json`, `.credentials.json`, chaves, `.npmrc`, `.netrc`) e conteúdo com cara de
credencial, sem mostrar os valores.

## Criar um produto novo

```bash
node saas-skills/engineering/multiplatform-platform-architecture/scripts/scaffold.mjs --out <pasta> --scope @empresa --name "Produto"
cd <pasta>
pnpm install --frozen-lockfile
pnpm verify
pnpm check:tokens
```

A pasta de destino não pode ficar dentro de outro workspace pnpm nem abaixo de um `package.json`
que fixe outro `packageManager`. O template traz `pnpm-lock.yaml`, `packageManager` exato e as
configurações do pnpm em `pnpm-workspace.yaml` (`nodeLinker: hoisted`, `strictDepBuilds: true`,
decisão explícita em `allowBuilds`, `verifyDepsBeforeRun: error`).

`pnpm verify` roda o gate de arquitetura, o gate de tokens, o typecheck dos projetos web e nativo,
os testes, o build do Next.js e o bundle do Expo para Android e iOS. `pnpm check:tokens` troca um
token por uma cor sentinela e a exige no estilo resolvido pelos componentes web e nativo, no HTML
do Next.js e nos bundles Hermes do Expo. Nenhum dos dois executa o app nativo.

## Catálogo

`catalog/registry.json` registra cada item com origem, status e perfis:

| Status                | Significado                                                 |
| --------------------- | ----------------------------------------------------------- |
| `active`              | passou no gate e é distribuído                              |
| `imported-unreviewed` | importado de outro projeto; inventariado, nunca distribuído |
| `quarantined`         | bloqueado por risco; nunca distribuído                      |
| `deprecated`          | substituído (`replacedBy`); removido das instalações        |

```bash
node scripts/cw.mjs catalog
node scripts/cw.mjs catalog --write-lock
```

O gate exige frontmatter válido, nome igual ao id, descrição até 1024 caracteres, até 500 linhas,
seção `## Operational Contract`, referências dentro do pacote, nenhum caminho de máquina, nenhum
segredo e casos de avaliação. `catalog/catalog.lock.json` fixa os hashes; `pnpm catalog` falha se
o lock estiver desatualizado.

## Estrutura

```text
catalog/            registry, lock e textos do contrato
scripts/cw.mjs      instalador (plan, install, status, verify, doctor, uninstall, recover, build)
scripts/lib/        motor: plano, aplicação com journal e rollback, manifests, blocos, hook
saas-skills/        skills canônicas, docs, avaliações
imported-skills/    material importado aguardando revisão (não distribuído)
test/               suíte node:test (motor, catálogo, gate de arquitetura, legado, clientes)
acceptance/         contrato de aceite, rastreabilidade e relatório
```

## Qualidade

| Comando                                | O que garante                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm catalog`                         | catálogo válido e lock atual                                                                             |
| `pnpm test`                            | motor, catálogo, gate de arquitetura, migração legada, ferramentas, descoberta no Codex e no Claude Code |
| `pnpm lint:md`                         | Markdown canônico sem erros                                                                              |
| `pnpm lint:md:imported`                | relatório do material importado (não bloqueia)                                                           |
| `pnpm secrets`                         | nenhum segredo no checkout, inclusive em arquivos ignorados pelo git                                     |
| `pnpm acceptance --sandbox <pasta>`    | pacote final e produtos gerados a partir dele (ver abaixo)                                               |
| `pnpm evals:init` / `pnpm evals:score` | modelo e pontuação de replays de disparo das skills                                                      |

Os testes de descoberta rodam quando o binário existe e são pulados caso contrário. O Codex é
procurado em `CW_CODEX_BIN`, no PATH e na extensão do ChatGPT do editor
(`~/.cursor/extensions/openai.chatgpt-*/bin/<plataforma>/codex`); o Claude Code em `CW_CLAUDE_BIN`
e no PATH. Nenhum deles faz chamada de modelo: o Codex renderiza o prompt localmente e o Claude Code
roda sem credenciais, com perfil isolado.

`pnpm acceptance --sandbox <pasta>` avalia o que é distribuído, não só o checkout: gera o pacote,
varre segredos e arquivos privados, cria um produto a partir do pacote, instala a biblioteca nele e
faz a instalação congelada pelo lockfile com `--ignore-scripts` por padrão. Etapas que habilitam
scripts (`verify`, `check:tokens`, contraprovas, migração com testes) só rodam com
`--authorize-unconfined <json>` (comando, scripts, destinos, riscos, authorizedBy); sem isso ficam
PENDING, não PASS. Todo comando do pnpm passa por pré-checagem preventiva e redirecionamento de
TEMP/XDG/store. Isso não confina escritas de subprocessos; ver
`acceptance/evidence/r3/EV-R3-guard-characterization.md` e o pedido
`acceptance/evidence/r3/EV-R3-auth-request-unconfined-scripts.md`.

## Documentos

- [AGENTS.md](AGENTS.md) — instruções para agentes que operam este repositório
- [saas-skills/README.md](saas-skills/README.md) — coleções e manutenção das skills
- [IDE_RUNTIME_GUIDE.md](saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md) — clientes, versões e limites
- [TARGET_REPO_AGENT_GUIDE.md](saas-skills/docs/runtime/TARGET_REPO_AGENT_GUIDE.md) — roteiro de instalação em um projeto
- [CHANGELOG.md](CHANGELOG.md)
