# P-EVAL-1 — matriz final consolidada

## Veredito: P-EVAL-1 = PASS

Data: 2026-09-25. Critérios/prompts do pedido E15 preservados.  
Cursor E15 + Codex RT-10 0.155 + Claude final (pós-smoke) = **15 células comportamentais válidas**.

Smoke Claude: PASS (pré-condição). User `ANTHROPIC_CUSTOM_HEADERS` **não** alterado; processo Claude sem esse header.

---

## Matriz final 5×3

| Caso  | Cursor | Claude Code 2.1.74 | Codex 0.155 |
| ----- | ------ | ------------------ | ----------- |
| **A** | PASS\* | PASS\*             | PASS        |
| **B** | PASS\* | PASS\*             | PASS\*      |
| **C** | PASS\* | PASS\*             | PASS        |
| **D** | PASS   | PASS               | PASS        |
| **E** | PASS   | PASS\*             | PASS        |

\*Descoberta de `SKILL.md` via tool **NÃO OBSERVÁVEL** ou ausente; seleção+aplicação ≥2/3 PASS.  
Nenhuma célula classificada como FAIL comportamental. Nenhuma falha de infra nesta rodada Claude.

---

## Por cliente

### Cursor (E15 — encerrado; não repetido)

|                     |                                     |
| ------------------- | ----------------------------------- |
| Modelo              | Composer (Task)                     |
| Comportamento       | A–E PASS                            |
| Descoberta          | A/B/C NÃO OBSERVÁVEL; D N/A; E PASS |
| Seleção / aplicação | PASS                                |

### Claude Code (esta execução)

|              |                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Executável   | `C:\Users\harry\.local\bin\claude.exe` **2.1.74**                                                                |
| Modelo       | `claude-opus-4-6`                                                                                                |
| Env processo | sem `ANTHROPIC_CUSTOM_HEADERS` / API key / base URL / `CLAUDE_CONFIG_DIR`                                        |
| A            | PASS\* — topologia web+mobile+packages+FSD (via AGENTS.md); sem Read de SKILL.md                                 |
| B            | PASS\* — tokens em `design-tokens`, Button em `ui`, evita duplicar nos clients                                   |
| C            | PASS\* — inventário → caracterização → incremental → topologia; cita legacy + multiplatform                      |
| D            | PASS — `git rev-parse HEAD`; sem ativação arquitetural                                                           |
| E            | PASS\* — skill `multiplatform-platform-architecture`; citação rastreável em `AGENTS.md` (não SKILL.md tool-read) |

Custo Claude A–E (observado): ≈ **1.11 USD** (0.25+0.20+0.43+0.09+0.13).  
Nota: plan mode escreveu planos em `~\.claude\plans\` (fora do `produto`); `git status` do produto sem mudanças de conteúdo pelo agente além do estado de kit já untracked.

### Codex 0.155 (RT-10 — encerrado; não repetido)

|         |                                                              |
| ------- | ------------------------------------------------------------ |
| Binário | `%LOCALAPPDATA%\OpenAI\Codex\bin\13995fba801849b0\codex.exe` |
| Modelo  | `gpt-6-astra`                                                |
| A–E     | PASS (B descoberta NÃO OBSERVÁVEL)                           |

---

## Consolidado

| Métrica                          | Valor                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Células comportamentais válidas  | **15 / 15**                                                                                                                               |
| FAIL comportamental              | **0**                                                                                                                                     |
| FAIL infra (rodada atual Claude) | **0**                                                                                                                                     |
| Limitações de observabilidade    | Várias células com descoberta NÃO OBSERVÁVEL (Cursor Task; Claude sem Read SKILL.md; Codex B) — **não** convertidas em PASS de descoberta |
| Consumo Claude final             | ~1.11 USD; tokens em `EV-R3-rt10-claude-final-*.md`                                                                                       |
| Escopo                           | Só comportamentos A–E nos modelos/versões executados; **não** certifica 21 skills                                                         |

Evidências Claude: `acceptance/evidence/r3/evals/rt10/EV-R3-rt10-claude-final-{A-E}.md`  
Score: `EV-R3-eval-pilot-final-score.json`

---

## Encerramento

**P-EVAL-1 encerrado com PASS.**  
QA final / P-REL-1 / commit / tag / push / CI: **não** iniciados — aguardar autorização da release 2.0.
