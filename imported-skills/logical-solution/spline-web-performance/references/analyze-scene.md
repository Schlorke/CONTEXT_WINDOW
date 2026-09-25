# analyze_scene

Schema observado em 2026-09-20 (cena aberta no editor). Revalidar o JSON ao
vivo.

Marcas: `good < average < bad`, thresholds `[averageAbove, badAbove]`.

Campos vistos: `objectCount`, `polygonCount`, `clonedPolygonCount`,
`nonClonedPolygonCount`, `materialCount`, `materialAssetCount`,
`materialNonAssetCount`, `textureCount`, `postprocessingCount`, `lightCount`,
`audioAssetCount`, `cloneCount`, `booleanCount`.

Listas: `heavyMeshes`, `highSubdivisionMeshes`, `nestedBooleans`, `lights`
(`id`, `name`, `type`, `castsShadows`), `layerHeavyMaterials`, `unusedAssets`.

Não inclui tamanho de export. `offender` lists cap 20.

Neste dump a cena tinha 2 `DirectionalLight` com shadow; `lightCount.mark` veio
`bad` com thresholds `[3,6]` — tratar o mark como dado do painel, não redefinir
limiar aqui.

Depois do fix: o mesmo relatório tem que melhorar a métrica alvo. Se não
melhorou, o fix não acabou.
