# AGENTS

Ponto de entrada para agentes que mantêm, validam ou distribuem a biblioteca Context Window.

## Objetivo do repositório

Este repositório é a fonte de verdade de uma biblioteca de skills SaaS. Ele existe para:

- manter as skills canônicas em `saas-skills/` e o catálogo em `catalog/registry.json`
- distribuir as skills para Claude Code, Codex e Cursor com o instalador `scripts/cw.mjs`
- provar, com testes, que instalação, atualização e remoção são seguras e reversíveis
- manter o gate de arquitetura e o template de produto web + mobile

## Arquitetura obrigatória nos projetos de destino

Todo projeto de produto com frontend começa com esta topologia — ela não fica em branco:

- `packages/frontend` guarda a interface do produto em Feature-Sliced Design estrito
  (`app → pages → widgets → features → entities → shared`).
- `packages/ui` guarda o design system (contrato + `.web.tsx` + `.native.tsx`) e
  `packages/design-tokens` os tokens e temas canônicos.
- `apps/clients/web` (Next.js) e `apps/clients/mobile` (Expo) são hosts finos (`src/app`, e
  `src/host`/`src/shared` só quando há integração de plataforma) que renderizam esses pacotes.
- O mobile não importa o web e não ganha uma segunda árvore FSD das mesmas telas.
- Backend: monólito modular ou portas e adaptadores (`clean-architecture-ddd`); sem FSD.

Texto normativo: [CLIENT_FSD_MIRROR.md](saas-skills/docs/governance/CLIENT_FSD_MIRROR.md).
Template e gate: `saas-skills/engineering/multiplatform-platform-architecture/`.

## Regras operacionais

- Edite sempre a fonte (`saas-skills/`, `catalog/`, `scripts/`). Cópias instaladas
  (`.claude/skills`, `.agents/skills`, `~/.claude`, `~/.agents`) são artefatos gerados.
- Depois de mudar uma skill ou o registry: `node scripts/cw.mjs catalog --write-lock` e `pnpm qa`.
- Material em `imported-skills/` tem status `imported-unreviewed`: não é distribuído. Para ativar
  um item, revise-o, passe no gate do catálogo e mude o status no registry com justificativa.
- Não use `.cursor/skills/` nem `.cursor/rules/*.mdc` gerados como runtime da biblioteca.
- Instalar skills nunca migra o código de um projeto; migração segue `legacy-code-refactoring` e
  exige autorização explícita.
- Nunca aponte `--home`, `--claude-config-dir` ou `--codex-home` para o perfil real em testes.

## Comandos canônicos

```bash
pnpm install
pnpm qa
node scripts/cw.mjs catalog --write-lock
node scripts/cw.mjs plan --target <projeto> --profile dev
node scripts/cw.mjs install --target <projeto> --profile dev
node scripts/cw.mjs verify --target <projeto>
node scripts/cw.mjs doctor --target <projeto>
node scripts/cw.mjs install --user --profile dev
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
```

Validação em perfil isolado antes de tocar em perfis reais:

```bash
node scripts/cw.mjs install --target <projeto-descartavel> --profile dev --home <sandbox>/home
node scripts/cw.mjs verify --target <projeto-descartavel> --home <sandbox>/home
```

Códigos de saída: 0 ok, 1 falha, 2 conflitos (nada escrito), 3 ocupado ou interrompido
(`recover`), 64 uso incorreto.

## Como escolher o fluxo

- "Só neste repositório" → `install --target <dir>`.
- "Em todos os meus projetos" → `install --user` e o texto de `contract --format cursor-user-rules`
  para o Cursor. Mantenha a biblioteca em um único escopo por cliente; `doctor` aponta duplicatas.
- "Só no Claude / Codex / Cursor" → `--clients claude`, `--clients codex` ou `--clients cursor`.
- Repositório sem frontend de produto → `--without-contract`.
- Atualização de skill → edite a fonte, regenere o lock, rode `install` de novo no destino.
- Qualquer dúvida de impacto → `plan` e perfil isolado primeiro.

## Política de disclosure de skills

Quando uma tarefa usar uma ou mais skills, a resposta final deve incluir uma seção `Skills Used`.

- se houve uso de skill: `- <skill-name>: <short reason>`
- se nenhuma skill foi usada: `Skills Used: none`

Relate apenas skills realmente usadas, não omita uma que influenciou a solução e mantenha a
justificativa curta. É um autorrelato para observabilidade, não prova de carregamento.

## Smoke test permitido depois de instalar

Use só prompts analíticos (análise de API, arquitetura React, proposta de README/AGENTS/ADR,
estratégia de testes). Não edite código do app, não rode build, migration ou servidor de
desenvolvimento só para validar a biblioteca.

## Ordem de leitura

1. [README.md](README.md)
2. [saas-skills/README.md](saas-skills/README.md)
3. [saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md](saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md)
4. [saas-skills/docs/runtime/TARGET_REPO_AGENT_GUIDE.md](saas-skills/docs/runtime/TARGET_REPO_AGENT_GUIDE.md)
5. [acceptance/](acceptance/) — contrato de aceite e relatório

## Critério de sucesso de uma instalação

- `verify` sai com 0 e `status` mostra todas as skills como atuais
- o plano mostrado antes da instalação corresponde ao resultado
- `doctor` não aponta duplicatas divergentes para o cliente em uso
- se o escopo incluir Cursor no usuário, o texto de User Rules foi gerado e entregue ao usuário
- nenhum arquivo da aplicação foi alterado
