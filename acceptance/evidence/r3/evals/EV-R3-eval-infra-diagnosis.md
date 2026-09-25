# P-EVAL-1 — diagnóstico de infraestrutura (pós-FAIL)

**Gate P-EVAL-1:** permanece **FAIL**. Resultados do piloto **preservados**.  
Sem reexecução A–E; sem alteração de skills/User Rules/critérios; Cursor A–E **não** repetidos.

Classificação (não vira PASS):

| Superfície | Natureza |
| --- | --- |
| Cursor A–E | Execuções **comportamentais válidas** |
| Claude A–E | **Infra/auth** antes do comportamento (OAuth 401) |
| Codex A–E | **Infra/config de modelo/CLI** antes do comportamento |

Falhas de infra **não** atribuídas às skills.

---

## Claude

| Campo | Valor |
| --- | --- |
| Executável | `C:\Users\harry\.local\bin\claude.exe` |
| Versão | `2.1.74` (Claude Code) |
| Método de auth | `claude.ai` (OAuth firstParty), reportado por `claude auth status` |
| Estado status (agora) | `loggedIn: true`, subscription `max` |
| Estado no piloto | API **401** `OAuth access token has expired` em A–E (`stream-json`) |
| Credencial local | `~\.claude\.credentials.json` existe; **mtime 2026-08-04** (não lido o conteúdo) |
| Lock OAuth | `~\.claude\.oauth_refresh.lock` (mtime 2026-09-24) — indício de refresh |
| Env | `ANTHROPIC_API_KEY` / `CLAUDE_CODE_OAUTH_TOKEN` / `CLAUDE_CONFIG_DIR` **unset** no shell do diagnóstico |
| P-PROF-1 | Alterou `~\.claude\skills`, `CLAUDE.md`, backups `.cw` (mtime ~07:34). **Não** tocou `.credentials.json` |

### Causa do 401

Token OAuth de acesso **expirado ou refresh falho** no momento das chamadas `-p`, apesar de `auth status` poder ainda reportar sessão “logada”. Inconsistência típica: status ≠ validade do access token para a API. **Não** é falha de skill/User Rules.

### Ação necessária (uma, manual)

```text
claude auth login
```

Completar o fluxo no browser na conta Claude usada no Max. Depois: `claude auth status` (deve continuar ok).

**Não** executado aqui: logout, login, nem chamada de modelo para “provar” o token.

Se quiser UMA chamada mínima de sanidade **antes** do reteste A–E (opcional, autorização separada):  
`claude -p "responda só: ok" --permission-mode plan` no kit — **não** conta como célula A–E; pedir auth explícita se desejar.

### Exige interação sua?

**Sim** — `claude auth login` (browser).

---

## Codex

### Executáveis conhecidos (sem nova varredura)

| Path | Versão | Origem | No piloto |
| --- | --- | --- | --- |
| `…\openai.chatgpt-26.5730.61309-win32-x64\bin\windows-x86_64\codex.exe` | **0.147.0-alpha.1.2** | Extensão Cursor ChatGPT | **Usado** (todas as células Codex) |
| `%LOCALAPPDATA%\OpenAI\Codex\bin\13995fba801849b0\codex.exe` | **0.155.0-alpha.16.4** | App/instalação OpenAI Codex | **Não** usado |
| `%LOCALAPPDATA%\OpenAI.ChatGPT_backup\Codex\bin\codex.exe` | 0.130.0-alpha.5 | Backup antigo | Não |
| `%LOCALAPPDATA%\OpenAI.ChatGPT_backup\Codex\bin\aec6b7c6fcdfb66a\codex.exe` | 0.142.3 | Backup antigo | Não |

PATH: `codex` **ausente**. Auth compartilhada: `~\.codex\auth.json` presente; `codex login status` (app 0.155) → **Logged in using ChatGPT** (sem imprimir segredos).

### Origem de `gpt-6-astra`

**Configuração do cliente**, não harness A–E:

```text
%USERPROFILE%\.codex\config.toml
model = "gpt-6-astra"
model_reasoning_effort = "medium"
```

mtime config ~ 2026-09-25T07:18Z. Env `CODEX_MODEL` / `OPENAI_MODEL` **unset**.  
O binário 0.147 leu esse default e a API rejeitou: modelo exige Codex mais novo.

### Origem do probe `gpt-5`

**Argumento do harness do agente** na rodada P-EVAL-1 (`codex exec … -m gpt-5`), tentativa de contorno de infra **após** o FAIL de A — **não** veio de `config.toml` nem do default do executável. Contou no orçamento; célula D permanece FAIL de infra.

### Qual foi usado vs qual deve ser usado

| Pergunta | Resposta |
| --- | --- |
| Usado no piloto | Extensão Cursor ChatGPT **0.147** |
| Superfície a certificar na 2.0 (recomendação) | App/CLI OpenAI Codex **0.155.0-alpha.16.4** em `%LOCALAPPDATA%\OpenAI\Codex\bin\13995fba801849b0\codex.exe` — instalação ativa mais recente, `doctor` ok, **mesmo** `~\.codex` / ChatGPT login, alinhada ao `model = "gpt-6-astra"` do perfil |
| Extensão 0.147 | Superfície **distinta** (runtime embutido no Cursor); útil historicamente em aceite R3, mas **desatualizada** frente ao modelo do perfil — **não** deve ser o alvo do reteste se o uso real é o app OpenAI Codex |
| Backups | Fora de certificação |

P-EVAL-1 pretende comprovar o **Codex que você usa de fato com o perfil ChatGPT + `~\.codex`**. Isso aponta para o app **0.155**, não para o 0.147 da extensão. Não certificar múltiplos Codex neste gate.

### Modelo/config correta

Manter o que o perfil real já declara: **`gpt-6-astra`** em `config.toml` (não inventar outro nome). O reteste deve usar o binário **0.155** **sem** `-m` de override, para que a config real seja a sob teste.

### Ação necessária

1. Confirmar que o uso diário é o app OpenAI Codex (0.155) — se sim, autorizar reteste **só** com esse path.  
2. **Não** alterar `config.toml` neste diagnóstico.  
3. Opcional (sua mão): colocar 0.155 no PATH ou sempre invocar o path absoluto no reteste.  
4. Se quiser manter a extensão como superfície Cursor-embutida: escopo **separado** (não misturar no mesmo P-EVAL-1).

---

## Reteste proposto (não autorizado / não executado)

| Células | Qtd | Notas |
| --- | ---: | --- |
| Claude A–E | 5 | Após `claude auth login`; mesmos prompts; kit `eval-pilot\produto`; **não** repetir Cursor |
| Codex A–E | 5 | Binário **0.155** path absoluto; **sem** `-m`; model da config; **não** repetir Cursor nem células Cursor |
| **Total máx.** | **10** | |

Preservar evidências atuais; score novo em arquivos **adicionais** (não sobrescrever matriz FAIL do E15).

Não inicia QA / release / commit.

---

## Pedido ao proprietário

| Opção | Significado |
| --- | --- |
| **LOGIN-C** | Você fará `claude auth login`; avise quando pronto |
| **RT-10** | Autoriza reteste 10 células (Claude×5 + Codex 0.155×5) após LOGIN-C (e confirmação do binário 0.155) |
| **SANITY-1** | Autoriza **uma** chamada mínima Claude de sanidade pós-login (antes do RT-10) |
| **Adiar** | Só diagnóstico |

**Nenhum reteste até autorização.**
