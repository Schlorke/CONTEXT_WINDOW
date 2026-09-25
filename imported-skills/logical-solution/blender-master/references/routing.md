# Roteamento

A tabela executável é `registry.json`. O script `scripts/route.mjs` só lê esse
arquivo. Uma saudação devolve `[]`. Spline e Rive também, salvo se o pedido
citar Blender ou bpy.

Especialistas de direção (animation director, lookdev, lighting director, camera
director) não são skills separadas. A decisão mora na skill do domínio. Física,
partículas, escultura, UV e geometry nodes moram em `blender-modeling`.
Composição mora em `blender-rendering`.

Depois de uma mudança visual, o master pede `blender-visual-qa` mesmo quando o
registry não a listou. Isso é um arquivo, não a família inteira.
