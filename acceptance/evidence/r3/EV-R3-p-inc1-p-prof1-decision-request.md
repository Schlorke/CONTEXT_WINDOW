# Pedido de decisão consolidado — P-INC-1 + P-PROF-1

**Status:** preparado; **não** autorizado; **nada executado**.  
Fora deste pedido: P-SEC-1 (risco residual **aceito** pelo proprietário — sem Log out all),
A13c (encerrado), P-EVAL-1, P-REL-1, P-SEC-2, P-NAT-1, P-IMP-1, P-CONF-1, P-ORF-1.

Fonte canônica: [PENDENCIES-POST-R3.md](../../PENDENCIES-POST-R3.md).  
Prévia de perfis: [EV-R3-real-profile-preview.json](EV-R3-real-profile-preview.json).

---

## Escopo desta autorização

| ID           | Frente                                     | Objetivo                                                                      |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| **P-INC-1**  | Recuperação incidente `gb-locacoes` / home | `C:\Users\harry\node_modules` de volta ao store padrão; store temp só depois  |
| **P-PROF-1** | Perfis reais → biblioteca 2.0              | Claude + Codex + Cursor (skills/regras gerenciadas); preservar não gerenciado |

Ordem obrigatória se ambos forem autorizados: **1 → 2** (recuperar home antes de mexer em
`~/.claude` / `~/.agents` / `~/.codex` / User Rules, para não misturar falhas de pnpm com install).

---

## Frente 1 — P-INC-1

### Estado atual (lido, sem alterar)

| Item             | Valor                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Raiz do projeto  | `C:\Users\harry` (`package.json` name: `gb-locacoes`)                                            |
| `node_modules`   | `C:\Users\harry\node_modules`                                                                    |
| `packageManager` | `pnpm@10.27.0`                                                                                   |
| `storeDir` atual | `C:\Users\harry\AuditoriasExternas\context-window-20260924\sandbox\template-e2e\.pnpm-store\v10` |
| Store temporário | **ainda existe**                                                                                 |
| Store padrão     | `%LOCALAPPDATA%\pnpm\store\v10` (**existe**)                                                     |
| Lockfile         | `C:\Users\harry\pnpm-lock.yaml` presente                                                         |

### Pré-condições (você)

1. Fechar editor/servidor/testes que usem `gb-locacoes` ou `C:\Users\harry\node_modules`.
2. Não apagar o store temporário **antes** da verificação do passo 4.

### Comandos (somente após auth)

```powershell
# 1) Snapshot (não destrutivo)
Rename-Item C:\Users\harry\node_modules node_modules.cw-incident-20260925

# 2) Reinstalar na raiz do projeto (é C:\Users\harry)
Set-Location C:\Users\harry
corepack enable
corepack prepare pnpm@10.27.0 --activate
pnpm install --frozen-lockfile

# 3) Verificar
Select-String -Path C:\Users\harry\node_modules\.modules.yaml -Pattern "storeDir|packageManager"
# Esperado: storeDir = ...\AppData\Local\pnpm\store\v10 ; packageManager = pnpm@10.27.0
git -C C:\Users\harry status --short
# checks usuais do projeto (os que você costuma rodar; não inventar suíte nova aqui)

# 4) Só depois de 3 OK — limpeza
Remove-Item -Recurse -Force C:\Users\harry\node_modules.cw-incident-20260925
Remove-Item -Recurse -Force C:\Users\harry\AuditoriasExternas\context-window-20260924\sandbox\template-e2e\.pnpm-store
```

Se `--frozen-lockfile` falhar por drift legítimo do lock do projeto, **parar** e reportar; não
forçar `pnpm install` sem lock sem nova autorização.

### Arquivos / destinos afetados

| Path                                                | Efeito                                              |
| --------------------------------------------------- | --------------------------------------------------- |
| `C:\Users\harry\node_modules`                       | renomeado → recriado                                |
| `C:\Users\harry\node_modules\.modules.yaml`         | novo `storeDir` padrão                              |
| `.husky/_` (via `prepare`)                          | pode ser reescrito pelos scripts do projeto         |
| `postinstall` / `prisma generate`                   | podem rodar (já falharam antes sem escrever código) |
| Store temp sob `AuditoriasExternas\...\.pnpm-store` | apagado **só** no passo 4                           |
| Código-fonte / lock / `package.json`                | **não** devem mudar; se mudarem, abortar e reportar |

### Backup / rollback (P-INC-1)

| Momento                                      | Ação                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| Antes do install                             | `node_modules` → `node_modules.cw-incident-20260925`                    |
| Se install falhar e store temp ainda existir | `Rename-Item node_modules.cw-incident-20260925 node_modules`            |
| Após passo 4                                 | rollback do `node_modules` antigo **impossível**; só reinstalar de novo |

### Riscos (P-INC-1)

- Rede + disco; scripts husky / prisma / `onlyBuiltDependencies`.
- `C:\Users\harry` é workspace ancestral de muita coisa — fechar consumidores antes.

### Prova de conclusão (P-INC-1)

- Novo `.modules.yaml` com store padrão.
- `git status` sem mudanças inesperadas de app.
- Declaração de checks usuais OK (ou lista do que falhou).

---

## Frente 2 — P-PROF-1

### Estado da prévia (leitura; exit 2 = conflitos sem `--migrate-legacy`/`--adopt-all`)

Com `install --user --profile dev --migrate-legacy --adopt-all` (prévia OK, 0 conflitos):

| Destino                           | Operação prevista                                                           |
| --------------------------------- | --------------------------------------------------------------------------- |
| `%USERPROFILE%\.claude\skills`    | replace ×21 + remoção de manifesto legacy                                   |
| `%USERPROFILE%\.agents\skills`    | adopt/replace ×21 (homônimos não gerenciados → gerenciados, **com backup**) |
| `%USERPROFILE%\.codex\skills`     | legacy-remove ×21 + manifesto                                               |
| `%USERPROFILE%\.cursor\rules`     | legacy-remove ×22 + manifesto (install 1.x / rules geradas)                 |
| `%USERPROFILE%\.claude\CLAUDE.md` | escrever bloco gerenciado                                                   |
| `%USERPROFILE%\.codex\AGENTS.md`  | escrever bloco gerenciado                                                   |

Doctor atual: cópias DIVERGENT / foreign em Claude, Codex e Cursor — meta pós-install: **sem
DIVERGENT** nas skills **gerenciadas** da biblioteca 2.0; foreign / não gerenciados **permanecem**.

User Rules do Cursor: texto ainda 1.x na máquina (CR-021) — colagem **manual** do export 2.0.

### Pré-condições

1. P-INC-1 concluído (ou autorizado e já verificado), se ambos forem neste lote.
2. Fechar sessões Claude Code / Codex / Cursor que possam segurar arquivos sob `~/.claude`,
   `~/.agents`, `~/.codex`, `~/.cursor\rules` durante a escrita.
3. Aceitar que o comportamento dos agentes muda **globalmente** em todos os projetos.

### Comandos (somente após auth) — a partir de `C:\Projetos\Context_Window`

```powershell
# A) Confirmar plano (só leitura; exit 0 esperado com as flags)
node scripts/cw.mjs plan --user --profile dev --migrate-legacy --adopt-all

# B) Instalar nos três clientes (perfil real — SEM --home)
node scripts/cw.mjs install --user --profile dev --migrate-legacy --adopt-all

# C) Verificar
node scripts/cw.mjs verify --user
node scripts/cw.mjs doctor --user
# Esperado: skills gerenciadas atuais; sem DIVERGENT nas homônimas da biblioteca

# D) Export User Rules 2.0 (stdout → você cola no Cursor)
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
```

### Ação manual sua (obrigatória para fechar CR-021 neste lote)

1. Cursor → Settings → Rules → **User Rules**.
2. Substituir o bootstrap 1.x pelo texto gerado no passo D (versão/hash do export).
3. Confirmar que o texto colado corresponde ao export (sem editar à mão o bloco gerenciado).

### O que **não** é tocado de propósito

- Skills **foreign** / nomes fora do catálogo ativo (ex.: criativos Rive no Cursor, se foreign).
- Conteúdo fora dos blocos gerenciados em `CLAUDE.md` / `AGENTS.md` (o instalador injeta/atualiza
  o bloco Context Window; não é wipe do arquivo inteiro — se o plano mostrar só `write` de bloco,
  o restante deve permanecer; divergência inesperada = abortar e reportar).
- Projetos (`install --target` em repos de produto) — **fora** deste pedido.
- Perfis isolados / `--home` de sandbox — **não** usados aqui (é o perfil real).
- `imported-unreviewed` — **não** promovidos.
- `auth.json` / logout Codex — **fora** (P-SEC-1 encerrado por aceite de risco).

### Backup / rollback (P-PROF-1)

| Mecanismo                   | Path / comando                                                               |
| --------------------------- | ---------------------------------------------------------------------------- |
| Backups automáticos do `cw` | `%USERPROFILE%\.context-window\backups\` (criado na install)                 |
| Remoção gerenciada          | `node scripts/cw.mjs uninstall --user` (remove o que o manifesto gerencia)   |
| Restore fino                | restaurar pastas/arquivos a partir dos backups listados no stdout da install |
| User Rules                  | você guarda o texto 1.x atual **antes** de colar o 2.0 (cópia manual)        |

### Riscos (P-PROF-1)

- Mudança global de Claude Code, Codex e Cursor.
- `--adopt-all` assume as 21 skills homônimas hoje “unmanaged” em `.agents/skills` (com backup).
- `--migrate-legacy` remove installs 1.x em `.codex/skills` e `.cursor/rules` (com backup).
- Sem colar User Rules, P-PROF-1 fica **incompleto** mesmo com install OK.

### Prova de conclusão (P-PROF-1)

- `verify --user` exit 0; skills 2.0 atuais.
- `doctor --user` sem DIVERGENT nas gerenciadas da biblioteca.
- Declaração sua: User Rules 2.0 coladas (versão/hash do export).
- Lista de backups impressa pela install (evidência).

---

## O que **esta** autorização cobre vs não cobre

| Cobre                            | Não cobre                              |
| -------------------------------- | -------------------------------------- |
| P-INC-1 passos 1–4               | Apagar `dist/.../codex-home` (P-SEC-2) |
| P-PROF-1 install + verify/doctor | Piloto de evals (P-EVAL-1)             |
| Gerar texto User Rules           | Commit / tag / push / CI (P-REL-1)     |
|                                  | Native Android/iOS (P-NAT-1)           |
|                                  | Promoção imported (P-IMP-1)            |
|                                  | Log out all / revogação Codex          |
|                                  | Reabrir guard / confinamento / A13c    |

---

## Pedido ao proprietário

Responda com **uma** letra:

| Opção        | Autoriza                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| **I**        | Só P-INC-1 (passos 1–4; agente executa após seu “fechou os processos”)      |
| **P**        | Só P-PROF-1 (plan → install → verify/doctor → export; você cola User Rules) |
| **I+P**      | Ambos na ordem 1→2 (**recomendado** para o fechamento 2.0)                  |
| **I-manual** | Você executa P-INC-1; agente só valida evidência depois                     |
| **Adiar**    | Nada agora                                                                  |

Confirmações explícitas pedidas em **I** ou **I+P**:

1. Processos que usam `C:\Users\harry\node_modules` / `gb-locacoes` estão fechados.
2. Autoriza `pnpm install --frozen-lockfile` na raiz `C:\Users\harry` (scripts do projeto).
3. Autoriza apagar o store temp **somente após** verificação OK.

Confirmações explícitas pedidas em **P** ou **I+P**:

1. Autoriza `install --user --profile dev --migrate-legacy --adopt-all` **no perfil real** (sem `--home`).
2. Você colará o User Rules 2.0 manualmente após o export.

**Nenhuma ação será executada até a letra + confirmações.**
