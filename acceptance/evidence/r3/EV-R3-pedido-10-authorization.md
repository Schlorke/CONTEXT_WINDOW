# Registro — Pedido 10 (autorização delimitada)

**Origem:** mensagem do proprietário neste chat: «PEDIDO 10 — AUTORIZAÇÃO DELIMITADA E CONDICIONADA».

**Arquivo de grants:** [EV-R3-pedido-10-authorization.json](EV-R3-pedido-10-authorization.json)

| Campo | Valor registrado |
| --- | --- |
| Autorizado | D1–D6 (após separação do acoplamento) |
| Negado | D7 (lifecycle de install) |
| Confinamento | `not approved` |
| Destino autorizado | `<sandbox>\acceptance` (fixtures `run-*`) |
| Harness acoplado | não autorizado; corrigido antes da execução |

Separação comprovada em `test/acceptance-auth.test.mjs` antes das execuções não confinadas.

## Resultados da execução (não confundir autorização com aprovação funcional)

Run: `<sandbox>\acceptance\run-2026-09-25T06-31-31-053Z`  
Relatório: [EV-R3-acceptance-pedido-10.json](EV-R3-acceptance-pedido-10.json)

| Item | Decisão | Resultado | Modo | Confinamento |
| --- | --- | --- | --- | --- |
| A6 / A10 / A11 | D7 negado | PASS (`ignoreScripts: true`) | `scripts-disabled` | n/a |
| A9a | D1 | PASS (exit 1 na falha esperada; restore exit 0) | `authorized-unconfined` | not approved |
| A9b | D2 | PASS (exit 1 + FSD-LAYER; restaurado) | `authorized-unconfined` | not approved |
| A8 / A9c | D3 | PASS | `authorized-unconfined` | not approved |
| A7 / A11b | D4 | PASS | `authorized-unconfined` | not approved |
| A10b | D5 | PASS (7 testes) | `authorized-unconfined` | not approved |
| A12 | D6 | PASS (comparação; sem spawn extra) | — | — |

`confinementRequirement` permanece `not approved`. Suíte de executor confinado não executada.
