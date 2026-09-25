# Custo de geometria

Usar `3d_analyze_scene` e, para correção, o topic skill MCP `scene-optimization`
(não inventar receitas de `decimate`/`merge`/`bakeBoolean` — elas vivem lá).

Pergunta obrigatória antes de subdividir, boolean, hair, particles ou
customMesh:

> Existe uma maneira visualmente equivalente e computacionalmente mais barata?

Heurísticas (até o `analyze_scene` falar o contrário):

- Uma esfera de produto: `SphereGeometry` + material, não um mesh gerado.
- Repetição: cloner / instance, não 40 cópias manuais.
- Furo de janela: um subtract, não um mesh esculpido.
- Hero web: orçamento curto. Se `polygonCount` já não está `good`, não adicionar
  detalhe "por realismo".

Incerteza: limiares exactos good/average/bad vêm do relatório ao vivo, não deste
arquivo.
