# Execution state (resumable checkpoint)

## Release 2.0 — ENCERRADA

| Campo | Valor |
| --- | --- |
| Versão estável atual | **v2.0.3** |
| Commit | `0f3dcb618bd4bc097f57ac4cb4bc7756357c6952` |
| Tag | `v2.0.3` |
| P-EVAL-1 | **15/15 PASS** |
| CI | **5/5 PASS** |
| P-REL-1 | **PASS** (publicação 2.0 + hotfixes 2.0.1–2.0.3) |

Registro canônico: [EV-R3-release-readiness.md](evidence/r3/EV-R3-release-readiness.md).

HEAD base histórico de origem 1.x: `66194b0`. Não reabrir escopo 2.0.

## Encerrado na linha 2.0 (fatos)

| ID | Resultado |
| --- | --- |
| P-INC-1 | **PASS** |
| P-PROF-1 | **PASS** |
| A13c / P-CUR-1 | **PASS** |
| P-EVAL-1 | **PASS** — 15/15 (Cursor + Claude 2.1.74 + Codex 0.155) |
| P-REL-1 | **PASS** — tags `v2.0.0`…`v2.0.3`; CI library+acceptance verde em `v2.0.3` |

## Riscos residuais aceitos (não bloqueiam; não reabrir na 2.0)

- **P-SEC-1:** risco residual de sessão Codex copiada — aceite do proprietário.
- Native runtime Android/iOS: não verificado.
- 83 `imported-unreviewed`: fora do conjunto certificado.
- Executor confinado: **opcional** (não alegado).

## Árvore de trabalho — 2.1.0

| Campo | Valor |
| --- | --- |
| Versão em `package.json` | **2.1.0** (é o número que o instalador grava) |
| Última tag publicada | `v2.0.3` |
| Skills ativas | 24 (21 no perfil `dev`, 3 no perfil `creative`) |
| `imported-skills/` | local, no `.gitignore`, não instalável |

A seção "Release 2.0" acima continua válida para a tag `v2.0.3`. Ela não descreve a 2.1.0.

## Pós-2.0 / 2.1+ (não executar agora)

Ver [PENDENCIES-POST-R3.md](PENDENCIES-POST-R3.md): P-SEC-2, P-IMP-1, P-NAT-1, P-ORF-1, P-CONF-1 (opcional).
