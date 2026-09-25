# acceptance

Aceite da versão 2.0.0 frente ao parecer de auditoria de 2026-09-24 e à reprovação independente
que se seguiu.

## Rodada 3 (atual, 2026-09-25)

- [REPORT-R3.md](REPORT-R3.md) — decisão, respostas às nove perguntas, gates, pedidos de autorização
- [TRACEABILITY-R3.md](TRACEABILITY-R3.md) — defeito → causa → mudança → teste que falhava → teste que passa → contraprova
- [contract-r3.json](contract-r3.json) — estado da rodada 3 legível por máquina (nota separada do histórico)
- [CURSOR-VERIFICATION.md](CURSOR-VERIFICATION.md) — roteiro da prova do Cursor no escopo de projeto
- [EVAL-PLAN-R3.md](EVAL-PLAN-R3.md) — avaliação comportamental preparada, não executada
- [evidence/r3/](evidence/r3/) — aceitação final, cópia limpa, reprodução, mutantes, revisão dos
  importados, prévia dos perfis reais, manifest da árvore

Comando de aceitação: `pnpm acceptance --sandbox <pasta fora do perfil do usuário>`.

## Rodadas 1 e 2 (histórico)

- [REPORT.md](REPORT.md) — relatório final, decisão e comandos testados
- [RUBRIC.md](RUBRIC.md) — os 81 critérios do parecer reavaliados com a mesma rubrica
- [TRACEABILITY.md](TRACEABILITY.md) — achado → causa → mudança → teste → evidência → estado
- [contract.json](contract.json) — gates G01–G12, critérios, requisitos novos (legível por máquina)
- [evidence/](evidence/) — registros das execuções (e2e do produto, legado, cópia limpa, contexto,
  métricas de código, contratos externos, incidente)
- [STATE.md](STATE.md) — ponto de retomada da execução
