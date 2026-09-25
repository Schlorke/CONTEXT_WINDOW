# P-EVAL-1 — matriz final E15

Data: 2026-09-25. Kit: `C:\Temp\cw-r3\eval-pilot\produto`.  
Chamadas: **15 / 15** (sem retries de score; sem troca de binário Codex no meio).

## Decisão

## **P-EVAL-1 = FAIL**

Meta 15/15 comportamental não atingida: Claude Code (OAuth) e Codex (modelo/CLI) sem respostas avaliáveis.

---

## Binário Codex (atribuição exclusiva deste piloto)

| Campo                                            | Valor                                                                                                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Caminho efetivamente utilizado**               | `C:\Users\harry\.cursor\extensions\openai.chatgpt-26.5730.61309-win32-x64\bin\windows-x86_64\codex.exe`                                                                                               |
| **Versão retornada**                             | `codex-cli 0.147.0-alpha.1.2`                                                                                                                                                                         |
| **Origem**                                       | Extensão Cursor **ChatGPT** `openai.chatgpt-26.5730.61309-win32-x64`                                                                                                                                  |
| **Outros binários encontrados e NÃO utilizados** | `%LOCALAPPDATA%\OpenAI\Codex\bin\13995fba801849b0\codex.exe`; `%LOCALAPPDATA%\OpenAI.ChatGPT_backup\Codex\bin\codex.exe`; `%LOCALAPPDATA%\OpenAI.ChatGPT_backup\Codex\bin\aec6b7c6fcdfb66a\codex.exe` |

Registro: [EV-R3-eval-codex-binary.md](EV-R3-eval-codex-binary.md).  
Todo FAIL/resultado Codex abaixo refere-se **somente** a esse binário/versão.

---

## Matriz final 5×3

| Caso  | Cursor     | Claude Code          | Codex (extensão 0.147)                                       |
| ----- | ---------- | -------------------- | ------------------------------------------------------------ |
| **A** | **PASS\*** | **FAIL** (OAuth 401) | **FAIL** (`gpt-6-astra` exige CLI mais novo)                 |
| **B** | **PASS\*** | **FAIL** (OAuth 401) | **FAIL** (idem `gpt-6-astra`)                                |
| **C** | **PASS\*** | **FAIL** (OAuth 401) | **FAIL** (idem)                                              |
| **D** | **PASS**   | **FAIL** (OAuth 401) | **FAIL** (probe `-m gpt-5` rejeitado; sem resposta D válida) |
| **E** | **PASS**   | **FAIL** (OAuth 401) | **FAIL** (idem `gpt-6-astra`)                                |

\*Cursor A/B/C: seleção+aplicação PASS; descoberta nativa **NÃO OBSERVÁVEL**.

---

## Score por propriedade

### Cursor (Composer / Task; Cursor 3.22.8)

| Caso | Descoberta          | Seleção | Aplicação | Célula |
| ---- | ------------------- | ------- | --------- | ------ |
| A    | NÃO OBSERVÁVEL      | PASS    | PASS 3/3  | PASS\* |
| B    | NÃO OBSERVÁVEL      | PASS    | PASS 3/3  | PASS\* |
| C    | NÃO OBSERVÁVEL      | PASS    | PASS 3/3  | PASS\* |
| D    | N/A (NONE)          | PASS    | PASS      | PASS   |
| E    | PASS (path+citação) | PASS    | PASS 3/3  | PASS   |

### Claude Code 2.1.74 (`claude-opus-4-6` anunciado; 0 tokens úteis)

| Caso | Célula | Erro                             |
| ---- | ------ | -------------------------------- |
| A–E  | FAIL   | `OAuth access token has expired` |

### Codex extensão 0.147.0-alpha.1.2 (`model=gpt-6-astra` no perfil)

| Caso    | Célula | Erro                                                |
| ------- | ------ | --------------------------------------------------- |
| A,B,C,E | FAIL   | 400: `gpt-6-astra` requires newer Codex             |
| D       | FAIL   | probe `-m gpt-5` not supported with ChatGPT account |

---

## Consumo

| Cliente   | Chamadas | Tokens/custo                          |
| --------- | -------: | ------------------------------------- |
| Cursor    |        5 | não observável (Task)                 |
| Claude    |        5 | 0 / $0 (401)                          |
| Codex     |        5 | não mensurável (falha pré-completion) |
| **Total** |   **15** | —                                     |

---

## Falhas concretas

1. Claude: OAuth expirado em todas as 5 células — sem re-login (fora do escopo).
2. Codex (somente binário da extensão acima): incompatibilidade `gpt-6-astra` ↔ CLI 0.147; D ainda falhou no probe `-m gpt-5`.
3. Sem evidência comportamental utilizável em Claude/Codex.

## Evidências

- Cursor: `EV-R3-eval-cursor-{A-E}.md`
- Codex binary: `EV-R3-eval-codex-binary.md`
- Raw: `C:\Temp\cw-r3\eval-pilot\raw\claude-*.jsonl`, `codex-*.jsonl`
- Score: `EV-R3-eval-pilot-score.json`

QA / P-REL-1: **não** iniciados.
