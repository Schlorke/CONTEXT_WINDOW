# RELEASE STATUS — Context Window 2.0

Data de encerramento: 2026-09-25.

## Estado final

| Campo | Valor |
| --- | --- |
| Release 2.0 | **ENCERRADA** |
| Versão estável atual | **v2.0.3** |
| Commit | `0f3dcb618bd4bc097f57ac4cb4bc7756357c6952` |
| Tag | `v2.0.3` |
| P-EVAL-1 | **15/15 PASS** |
| CI (`qa.yml`) | **5/5 PASS** (acceptance + library Ubuntu/Windows × Node 22/24) |

Linha de tags 2.0 (intactas):

| Tag | Commit |
| --- | --- |
| `v2.0.0` | `3533c4c1687d017a00c532f6c8424ba5ee1a479c` |
| `v2.0.1` | `4cf2e3e70f9802668f801a91c03ebf3137f06613` |
| `v2.0.2` | `b10bea5110ec21323ce9225dce88ad01f52bfd89` |
| `v2.0.3` | `0f3dcb618bd4bc097f57ac4cb4bc7756357c6952` |

## Hotfixes fechados na linha 2.0

- **2.0.1** — catalog lock cross-EOL
- **2.0.2** — path portability + EOL policy (LF)
- **2.0.3** — concurrent install busy vs false conflict (ACH-010/CR-017)

## Riscos residuais aceitos (não reabrir na 2.0)

- P-SEC-1 (sessão Codex copiada)
- Observabilidade parcial de descoberta no piloto
- Native runtime não verificado
- 83 `imported-unreviewed` não certificados
- Confinamento de escrita pnpm não alegado

## Pendências preservadas para 2.1+

Ver [PENDENCIES-POST-R3.md](../../PENDENCIES-POST-R3.md): P-SEC-2, P-IMP-1, P-NAT-1, P-ORF-1, P-CONF-1 (opcional).

## Histórico deste arquivo

Este documento substitui o veredito operacional de *ready to release* do candidato `v2.0.0`. O relatório de preparação original permanece abaixo como arquivo histórico da candidatura; o **status canônico vigente** é a seção acima.

---

# RELEASE READINESS REPORT — Context Window v2.0.0 (histórico)

Data: 2026-09-25. Escopo congelado: sem novos evals, sem reabrir P-SEC-1/A13c/guard/native/imported.

> **Superseded:** release 2.0 **ENCERRADA** em `v2.0.3` (`0f3dcb6…`). Seções abaixo são o snapshot de prontidão pré-`v2.0.0`, não o estado atual.

---

## 1. QA final: **PASS** (pré-v2.0.0)

```text
pnpm qa  → exit 0
  catalog --check OK (21 active + 83 imported-unreviewed)
  node:test 155/155 pass
  markdownlint 0 errors
  secrets 0 publishable findings
  prettier --check OK
```

## 2. Secret / security check: **PASS**

| Check                              | Resultado                                              |
| ---------------------------------- | ------------------------------------------------------ |
| `pnpm secrets` / `secret-scan.mjs` | 0 publishable, 0 ignored findings                      |
| `dist/`                            | gitignored; `auth.json` no path conhecido **ausente**  |
| Credenciais em publishable         | não detectadas                                         |
| P-SEC-1                            | risco residual **aceito**; sem revogação nesta release |

## 3–11. (Plano de publicação v2.0.0)

Ver histórico git deste arquivo na revisão pré-tag `v2.0.0` para o inventário completo de stage/comandos. Não reexecutar.

## 12. Decisão (histórico)

## READY TO RELEASE v2.0.0: YES — **executado**; linha 2.0 encerrada em **v2.0.3**
