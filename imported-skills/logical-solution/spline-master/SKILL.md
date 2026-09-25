---
name: spline-master
description:
  Orchestrates professional Spline 3D work over the official MCP namespace
  user-Spline. Inspects the live scene, selects only the needed specialist
  skills, loads Spline authoring guides, executes via 3d_run_code, then
  critiques. Use for any Spline 3D scene, modeling, materials, lighting
  (iluminação 3D Spline), camera, animation, interaction, hero 3D, visual QA, or
  Spline MCP task. Do not use for Hana 2D (2d_* tools) or for Rive.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "https://docs.spline.design/generate/spline-mcp-server;
    https://agentskills.io/specification; live user-Spline schemas 2026-09-20"
compatibility:
  Requires Spline desktop app MCP (namespace user-Spline). 3D tools are prefixed
  3d_.
---

# Spline Master

Orquestrador. Não contém o conhecimento 3D completo. Escolhe especialistas,
executa pelo MCP oficial, valida.

Fonte canônica: `.agents/skills/spline/<skill>/SKILL.md`.

## MCP

- Namespace: `user-Spline`. Não instalar outro servidor Spline. Não usar forks.
- Prefixo real das tools 3D: `3d_*`. Guias oficiais escrevem nomes sem prefixo
  (`run_code` = `3d_run_code`).
- Antes de qualquer tool: descobrir o schema atual (`GetDynamicTools` /
  descritor da tool). Nunca inventar nome ou parâmetro.
- Hana 2D (`2d_*`) é outro produto. Esta família trata Spline 3D.

## Workflow

```text
INTENT → INSPECT → PLAN → BUILD → RENDER/SCREENSHOT/INSPECT → CRITIQUE → REFINE → VALIDATE
```

1. **INTENT** — o que mudar, o que preservar, se a cena já existe.
2. **INSPECT** — `3d_get_scene_mcp` (primeiro read). Seleção `SELECTED` = o
   usuário apontando. `3d_get_objects` se houver
   `states`/`events`/`anims`/`cloner`. `3d_analyze_scene` se performance entrar
   na conta.
3. **PLAN** — especialistas (tabela abaixo). Só leia os `SKILL.md` escolhidos.
4. **BUILD** — antes do primeiro `3d_run_code` nesta sessão: `3d_load_skill` com
   `authoring-guide`, depois `authoring-guide-2`, depois `authoring-guide-3`
   (uma vez cada). Depois o topic skill MCP do domínio. Edits em `3d_run_code`
   curtos, um subsistema por call.
5. **LOOK** — `3d_take_screenshot` ou `screenshot: true` no último `3d_run_code`
   do lote. Fatos (contagem, posição, tamanho) vêm de `3d_get_scene`, não do
   pixel.
6. **CRITIQUE** — leia `spline-visual-qa` depois de mudança visual relevante.
7. **REFINE** — incremental. Não reconstruir a cena sem justificativa.
8. **VALIDATE** — digest fresco + captura live (`view: "live"` + `hero` com os
   nomes do assunto) no fim de um build. Corrigir avisos de EXPOSURE / FRAMING /
   HERO.

## Roteamento (carregar só o necessário)

| Pedido                                      | Ler                                                             |
| ------------------------------------------- | --------------------------------------------------------------- |
| Qualquer trabalho Spline 3D                 | `spline-master`                                                 |
| Cena já existe / auditar / "o que tem aqui" | `spline-scene-analysis`                                         |
| Criar/editar malha, boolean, grupo, escala  | `spline-modeling`                                               |
| Aparência, vidro, metal, tecido, roughness  | `spline-materials`                                              |
| Só luzes, sombras, exposição, rim           | `spline-lighting` + `spline-visual-qa`                          |
| Enquadramento, câmera, composição           | `spline-camera-composition`                                     |
| Mover, idle, entrada, loop                  | `spline-animation`                                              |
| Hover, click, drag, events                  | `spline-interaction`                                            |
| FPS, lag, mobile, polígonos                 | `spline-web-performance`                                        |
| Embutir no React/Next deste repo            | `spline-web-integration`                                        |
| Hero / landing / visual premium deste site  | `spline-hero-design`                                            |
| Screenshot ou referência → 3D               | este arquivo + `references/image-to-3d.md` + `spline-visual-qa` |
| Depois de mudança visual                    | `spline-visual-qa`                                              |

Exemplos:

- "Crie uma esfera premium para uma hero tecnológica" → master + modeling +
  materials + lighting + camera-composition + visual-qa (+ hero-design se o
  pedido for da landing).
- "Corrija apenas a iluminação desta cena" → master + lighting + visual-qa. Não
  carregar modeling, interaction, animation, web-integration.

## Segurança MCP

1. Descobrir tools reais; nunca inventar.
2. Inspecionar antes de editar.
3. Incremental; preservar o que não foi pedido.
4. Nomes semânticos (`Key Light`, `Hero Sphere`) — nunca `Sphere 14`.
5. `3d_create_file` só se o usuário pediu arquivo novo (`force: true` só nesse
   caso). A primeira tool 3D já cria arquivo se nenhum estiver aberto.
6. Geração IA (`3d_generate_3d_model`, `3d_generate_image`) **somente** se o
   usuário pediu explicitamente (gasta créditos). Preferir primitiva procedural
   quando resolve.
7. Se uma capacidade não estiver no schema, dizer isso. Não improvisar API.
8. Não exporta `.splinecode` pelo MCP. Exportação: UI do Spline, **Export →
   Code**, com a cena aberta.

## Cena existente

Nunca reconstruir do zero sem justificativa. Âncora livre de `3d_get_scene_mcp`
é para build **ao lado** do conteúdo atual, não para empilhar no origin.

## Token economy

O `SKILL.md` de cada especialista é o procedimento. Detalhe está em
`references/` daquela skill — ler só o arquivo citado. Topic skills do MCP
(`3d_load_skill`) são a fonte da DSL; não copiar a DSL para o chat.

## Referências

- Inventário de tools 3D detectadas:
  [references/mcp-3d-tools.md](references/mcp-3d-tools.md)
- Matriz de roteamento e anti-triggers:
  [references/routing.md](references/routing.md)
- Screenshot / referência → 3D:
  [references/image-to-3d.md](references/image-to-3d.md)
- Docs do sistema: `docs/ai/spline-agent-system.md`
