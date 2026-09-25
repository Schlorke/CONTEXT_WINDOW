# P-EVAL-1 — consolidado (E15 Cursor + RT-10)

**Gate:** critérios e prompts originais preservados. Cursor A–E do E15 **inalterados**.  
RT-10: Claude interrompido após A (401); Codex A–E no binário OpenAI **0.155.0-alpha.16.4**.

## Decisão final

## **P-EVAL-1 = PASS** (atualizado após Claude A–E final)

Ver matriz final: [EV-R3-eval-pilot-final.md](EV-R3-eval-pilot-final.md).  
Histórico abaixo: estado **antes** da rodada Claude pós-smoke (mantido como evidência).

---

## Matriz consolidada 5×3

| Caso  | Cursor (E15)          | Claude (RT-10)                   | Codex 0.155 (RT-10)       |
| ----- | --------------------- | -------------------------------- | ------------------------- |
| **A** | PASS\* comportamental | **FAIL infra** (OAuth 401)       | **PASS** comportamental   |
| **B** | PASS\* comportamental | **não executado** (parada pós-A) | **PASS\*** comportamental |
| **C** | PASS\* comportamental | **não executado**                | **PASS** comportamental   |
| **D** | PASS comportamental   | **não executado**                | **PASS** comportamental   |
| **E** | PASS comportamental   | **não executado**                | **PASS** comportamental   |

\*Descoberta nativa NÃO OBSERVÁVEL ou ausente; seleção+aplicação PASS.

### Tipo de falha

| Célula                                  | Tipo                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Claude A                                | **Infraestrutura/autenticação** (não comportamental; não atribuída a skills) |
| Claude B–E                              | **Não executadas** (política de interrupção)                                 |
| Codex A–E (piloto E15 / extensão 0.147) | Infra antiga — **substituída** no consolidado pelas células RT-10 0.155      |
| Nenhuma célula Cursor/Codex RT-10       | Falha comportamental registrada                                              |

---

## RT-10 — evidências resumidas

### Claude

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Executável | `C:\Users\harry\.local\bin\claude.exe` 2.1.74                  |
| A          | 401 OAuth expired — primeira prova pós-LOGIN-C **ainda falha** |
| B–E        | Interrompidos                                                  |

### Codex (certificação deste reteste)

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| Executável     | `%LOCALAPPDATA%\OpenAI\Codex\bin\13995fba801849b0\codex.exe` |
| Versão         | `codex-cli 0.155.0-alpha.16.4`                               |
| Modelo         | `gpt-6-astra` via `~\.codex\config.toml` (sem `-m`)          |
| Extensão 0.147 | **não** usada                                                |

| Caso | Descoberta                                               | Seleção | Aplicação | Célula | Tokens in/out |
| ---- | -------------------------------------------------------- | ------- | --------- | ------ | ------------- |
| A    | PASS (`Get-Content` multiplatform + react-saas SKILL.md) | PASS    | PASS 3/3  | PASS   | 60435 / 444   |
| B    | NÃO OBSERVÁVEL (sem Read de SKILL)                       | PASS    | PASS 3/3  | PASS\* | 27039 / 247   |
| C    | PASS (legacy + multiplatform SKILL.md)                   | PASS    | PASS 3/3  | PASS   | 105562 / 1102 |
| D    | N/A                                                      | PASS    | PASS      | PASS   | 27008 / 11    |
| E    | PASS (path + citação Admission rules)                    | PASS    | PASS 3/3  | PASS   | 57999 / 264   |

Arquivos: `acceptance/evidence/r3/evals/rt10/EV-R3-rt10-codex-{A-E}.md`, `EV-R3-rt10-claude-A.md`.

### Cursor (E15 — preservado)

PASS A–E conforme `EV-R3-eval-cursor-*.md` / relatório piloto.

---

## Chamadas RT-10

| Cliente         | Usadas |       Autorizadas |
| --------------- | -----: | ----------------: |
| Claude          |  1 (A) | 5 (resto cortado) |
| Codex           |      5 |                 5 |
| **Total RT-10** |  **6** |           máx. 10 |

---

## Próximo passo (não iniciado)

P-EVAL-1 continua **FAIL** até Claude autenticar de forma que `-p` deixe de retornar 401 e as células A–E sejam reexecutadas (nova autorização).  
QA / P-REL-1 / commit / tag / push: **não** iniciados.
