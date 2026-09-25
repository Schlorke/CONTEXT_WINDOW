# Export GLB

Default do operador `export_scene.gltf` para uma cópia:

- `export_format='GLB'`
- `export_animations=True` quando existir Action ou NLA do pedido
- `export_apply=False` se a pilha tiver Array, Subdivision ou Boolean
- Draco desligado, salvo pedido

Não aplicar estes sem pedido: decimate, join, bake de normal, compressão KTX2,
Meshopt.

Checagem mínima do arquivo: os 4 primeiros bytes são `glTF`, o tamanho é
plausível para a malha, e o clip não sumiu. Polycount e textura grande entram no
relatório; redução é uma segunda decisão.

Destino web (Three.js, React Three Fiber, WebGL, WebGPU) consome esse GLB.
Spline não usa este export. Não colocar o binário em `apps/web/public/media` sem
o fluxo de mídia versionada do repositório (ADR 011).
