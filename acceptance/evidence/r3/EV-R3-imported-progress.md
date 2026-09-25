# Progresso técnico — importados (pós-R3)

Revisão mecânica regenerada: [EV-imported-review.json](EV-imported-review.json) — 74 não
verificado, 9 bloqueado, 0 revisado, 0 ativo. **NR-20 permanece REPROVADO** até leitura humana
completa + licença com evidência + (para ativo) casos de acionamento.

Nenhuma promoção em lote. Especialidades criativas preservadas (não substituídas por genéricos).

## Família `project-okgas` (13) — trabalho local feito agora

| id | Licença no pacote | Tools | Lacunas de gate | Caso de uso preparado (rascunho) | Leitura humana |
| --- | --- | --- | --- | --- | --- |
| okgas-mobile-fsd | nenhuma | expo | Operational Contract; trigger matrix | “Organize uma feature Expo em FSD mobile sem copiar árvore web” | parcial (esta rodada): instruções específicas de camadas; **não** marca `revisado` |
| okgas-po-briefing | nenhuma | — | Operational Contract; ref quebrada `assets/brand/`; matrix | “Produza briefing de PO com critérios de aceite testáveis” | parcial: útil; bloqueio de promoção pela ref quebrada + licença |
| demais 11 okgas-* | nenhuma | prisma/expo em alguns | OC + matrix | ver IDs no EV-imported-review | pendente |

Conclusão técnica: okgas é candidato a revisão humana priorizada (alinhado ao produto SaaS), mas
**não** pode ir a `revisado`/`ativo` sem (1) declaração de autoria/licença do dono, (2) seção
Operational Contract, (3) entrada na skill-trigger-matrix, (4) leitura completa registrada.

## Bloqueados (9) — inalterados

Remotion (7) licença desconhecida; `prisma-client-api` e `react-best-practices` MIT sem copyright/
atribuição suficientes. Permanecem `bloqueado` até evidência — **não** excluídos para subir nota.

## Criativos (video/3d/remotion)

Dependem de DaVinci, Blender, Spline, Rive, Remotion, ffmpeg. Revisão documental ≠ funcionamento
demonstrado na ferramenta. Casos P-CRT no [EVAL-PLAN-R3.md](../EVAL-PLAN-R3.md) só se item ativo.
