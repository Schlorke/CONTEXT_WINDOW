# P-EVAL-1 — diagnóstico Claude 401 (auth-status × -p)

Gate: Cursor/Codex encerrados. Sem A–E. Sem login automático. Sem dump de segredos.

## Causa comprovada

**Categoria principal:** credencial OAuth **expirada / não renovada** no armazenamento usado por `claude -p`.

Provas:

1. Resposta da API no RT-10 A: `authentication_error` / `OAuth access token has expired` (`raw-rt10/claude-A.jsonl`).
2. `init.apiKeySource = "none"` → o `-p` tentou OAuth, não API key.
3. `~\.claude\.credentials.json` **mtime 2026-08-04** (ainda) — não foi regravado após o LOGIN-C reportado; `auth status` pode reportar sessão “logada” sem access token válido para a API.
4. Mesmo home: `CLAUDE_CONFIG_DIR` **AUSENTE** → `auth status` e `-p` usam `C:\Users\harry\.claude` (não há home isolado do harness).

**Fator comprovado de interferência no ambiente (não é home isolado):**

| Variável | Process | User | Machine |
| --- | --- | --- | --- |
| `ANTHROPIC_CUSTOM_HEADERS` | PRESENTE | PRESENTE | AUSENTE |
| Prefixo do header (sem valor) | `x-ai-gateway-api-key` | (mesmo) | — |
| `ANTHROPIC_API_KEY` | AUSENTE | AUSENTE | AUSENTE |
| `ANTHROPIC_BASE_URL` | AUSENTE | AUSENTE | AUSENTE |
| `CLAUDE_CODE_OAUTH_TOKEN` | AUSENTE | AUSENTE | AUSENTE |

Ou seja: o processo herda header de **AI gateway** no nível **User**. Isso afeta PowerShell normal e o harness. Não prova sozinho o texto “OAuth expired”, mas **altera** o caminho HTTP das chamadas Anthropic e deve ser removido do harness de eval (e considerado na sessão real).

**Não comprovado como causa:** `CLAUDE_CONFIG_DIR` redirecionado; `ANTHROPIC_BASE_URL`/proxy de auditoria; versão errada do binário (é 2.1.74); harness com home distinto.

## Diferença normal × harness

| Item | PowerShell / perfil User | Harness RT-10 / shell Cursor |
| --- | --- | --- |
| executable | `C:\Users\harry\.local\bin\claude.exe` | **igual** |
| versão | 2.1.74 | **igual** |
| cwd | (sua pasta) | `C:\Temp\cw-r3\eval-pilot\produto` |
| USERPROFILE | `C:\Users\harry` | **igual** |
| HOME | tipicamente AUSENTE no Windows | AUSENTE |
| CLAUDE_CONFIG_DIR | AUSENTE → `~\.claude` | AUSENTE → **mesmo** `~\.claude` |
| ANTHROPIC_BASE_URL | AUSENTE | AUSENTE |
| ANTHROPIC_API_KEY | AUSENTE | AUSENTE |
| ANTHROPIC_CUSTOM_HEADERS | PRESENTE (User) | PRESENTE (**herdado**) |
| CURSOR_AGENT / VSCODE_PID | AUSENTE (PS normal) | PRESENTE (shell do agente) |
| argv | interativo / o que você digita | `-p … --output-format stream-json --verbose --permission-mode plan --allowedTools Read,Glob,Grep --no-session-persistence` |

Conclusão: o harness **não** isolou config Claude; **herdou** o User env (incl. gateway header) e só mudou cwd + flags `-p`.

## Correção mínima

### A) Autenticação real (sua ação — obrigatória para renovar OAuth)

1. Confirmar que o login grava credencial nova:
   - rodar `claude auth login` de novo **num PowerShell fora do agente**, se necessário;
   - verificar que `~\.claude\.credentials.json` muda de mtime (sem abrir o arquivo).
2. Opcional mas recomendado: remover ou esvaziar a variável de **usuário** `ANTHROPIC_CUSTOM_HEADERS` se o Claude Code real não deve passar pelo AI gateway (Settings → Environment Variables, ou `setx` / UI do Windows). **Não** feito pelo agente.

### B) Harness de avaliação (quando autorizado a corrigir)

Ao invocar Claude no reteste/smoke, limpar só no processo filho:

```powershell
$env:ANTHROPIC_CUSTOM_HEADERS = $null
# garantir ausência de overrides
Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue
& C:\Users\harry\.local\bin\claude.exe -p "..." ...
```

Isso faz o teste usar o Claude real + OAuth em `~\.claude`, sem o header de gateway injetado no ambiente User/Cursor. **Não** altera skills nem User Rules.

## Ação sua agora

1. Renovar OAuth até `~\.claude\.credentials.json` ter mtime **recente**.  
2. Decidir se `ANTHROPIC_CUSTOM_HEADERS` (User) deve permanecer no uso diário; se não, remover no Windows.  
3. Se a chave do gateway vazou em log de sessão, **rotacionar** essa chave no provedor do gateway.

## Smoke test proposto (não executar até autorização)

Infra only — **não** é célula A–E:

```powershell
Remove-Item Env:ANTHROPIC_CUSTOM_HEADERS -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue
Set-Location C:\Temp\cw-r3\eval-pilot\produto
& C:\Users\harry\.local\bin\claude.exe -p "responda apenas com a palavra ok" --permission-mode plan --allowedTools "" --no-session-persistence
```

Esperado: stdout com `ok` (ou equivalente curto), **sem** 401.  
Só depois disso: pedir auth para Claude A–E.
