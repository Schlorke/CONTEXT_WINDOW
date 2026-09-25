# Digest e flags

Confirmado pelo retorno de `3d_get_scene_mcp` / `3d_get_scene` em 2026-09-20.

- `p` posição, `r` rotação em graus, `s` escala, `size` bounding box do
  **conteúdo** (exclui a escala do próprio objeto; em grupo é a extensão dos
  descendentes).
- `SELECTED` = o usuário apontou antes do prompt. "Isto"/"deixe metal" = esses
  ids e filhos. Endereçar por id. Pedido que nomeia outra coisa, ou pede ADD,
  não é sobrescrito pela seleção.
- `hidden` = existe mas não desenha. Não deletar para "limpar" sem perguntar.
- `cloner:<type>` e `cloner:linear (disabled)` — ler o objeto com `get_objects`
  antes de mexer.
- `states:N` / `events:N` / `anims:N` — ids de tween/event só existem em
  `3d_get_objects`. Editar sem isso inventa ids.
- Páginas: background hex. Variables: nome, tipo, id.
- Material assets: nome, layer types, usage count, id. Usage 0 = candidato a
  limpeza, não exclusão automática.

`3d_analyze_scene` devolve `mark` good/average/bad e thresholds. Offenders vêm
com id real para o próximo `run_code`. Export byte size **não** entra nesse
relatório (precisa de export na UI).
