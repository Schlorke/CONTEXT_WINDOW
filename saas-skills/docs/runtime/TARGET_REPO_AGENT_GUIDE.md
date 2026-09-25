# Roteiro para instalar a biblioteca em um projeto

Roteiro para um agente (ou pessoa) instalar, atualizar ou remover a biblioteca em um repositório de
destino sem tocar no código da aplicação. Todos os comandos rodam a partir do checkout da
biblioteca (ou de um pacote criado com `build --out`).

## 1. Confirmar o escopo

- Destino: um projeto (`--target <dir>`) ou o usuário (`--user`).
- Clientes: `--clients claude,codex,cursor` (padrão: os três).
- Perfil: `dev` (produto; liga o contrato de arquitetura) ou `creative`.
- Repositório sem frontend de produto: `--without-contract`.

## 2. Ensaiar em perfil isolado

```bash
node scripts/cw.mjs plan --target <copia-descartavel> --profile dev --home <sandbox>/home
node scripts/cw.mjs install --target <copia-descartavel> --profile dev --home <sandbox>/home
node scripts/cw.mjs verify --target <copia-descartavel> --home <sandbox>/home
```

## 3. Planejar e instalar no destino real

```bash
node scripts/cw.mjs plan --target <projeto> --profile dev
node scripts/cw.mjs install --target <projeto> --profile dev
```

O plano lista cada arquivo. O `install` só escreve em:

- `.claude/skills/<id>/` e `.agents/skills/<id>/` (com `.cw-manifest.json` por destino)
- blocos marcados `<!-- BEGIN context-window:... -->` no `AGENTS.md` e no `CLAUDE.md` (o resto do
  arquivo é preservado; há backup)
- `.context-window/install.json` (registro da instalação) e `.context-window/backups/` (cópias dos
  arquivos de texto antes de cada mudança)
- `.claude/.cw/` e `.agents/.cw/` (lock, journal e backups de skills; ficam fora das pastas que os
  clientes varrem)
- com `--with-claude-hook`: `.claude/hooks/skill-router.mjs`, `.claude/skill-routing.json` e a
  entrada do hook em `.claude/settings.json` (entradas do usuário são preservadas)

## 4. Resolver conflitos

Código 2 significa que nada foi escrito. Leia o motivo:

- pasta de mesmo nome que o `cw` não instalou → manter, ou `--adopt <id>` (com backup)
- skill instalada editada à mão → levar a mudança para a fonte da biblioteca, ou `--force-local`
- instalação 1.x → `--migrate-legacy` ou `--keep-legacy`
- link simbólico, junção ou diferença de maiúsculas → corrigir o sistema de arquivos

## 5. Verificar

```bash
node scripts/cw.mjs verify --target <projeto>
node scripts/cw.mjs doctor --target <projeto>
```

`doctor` mostra, por cliente, cópias com o mesmo nome em outras pastas lidas pelo cliente (inclusive
no perfil do usuário) e restos de instalações antigas.

## 6. Smoke test

Só prompts analíticos, sem editar arquivos: análise de API, organização FSD do frontend, proposta de
README/AGENTS/ADR, estratégia de testes. Não rode build, migration ou servidor para validar a
biblioteca.

## 7. Atualizar e remover

```bash
node scripts/cw.mjs install --target <projeto>
node scripts/cw.mjs status --target <projeto>
node scripts/cw.mjs uninstall --target <projeto> --dry-run
node scripts/cw.mjs uninstall --target <projeto>
```

Código 3 indica outra execução em andamento ou uma execução interrompida: aguarde e rode
`node scripts/cw.mjs recover --target <projeto>`.

## Adoção da arquitetura

Instalar skills não migra o projeto. Se a tarefa autorizar a adoção do contrato, siga a skill
`legacy-code-refactoring` (inventário com `legacy-inventory.mjs`, testes de caracterização,
movimentos incrementais, `pnpm arch` a cada passo, retirada da estrutura antiga).
