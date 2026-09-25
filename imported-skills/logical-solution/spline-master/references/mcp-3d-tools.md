# Tools 3D detectadas em `user-Spline`

Inventário ao vivo em 2026-09-20. Revalidar com o descritor da tool antes de
chamar. Nomes abaixo são os **callable** (com prefixo `3d_`).

Fonte: namespace `user-Spline` +
<https://docs.spline.design/generate/spline-mcp-server>

O servidor oficial vem **dentro do app desktop Spline** (macOS/Windows), bind em
`127.0.0.1`. Não há pacote npm oficial para instalar. Forks comunitários (ex.:
`aydinfer/spline-mcp-server`) estão arquivados e **não** devem ser usados.

## Leitura (não mutam a cena)

| Tool                  | Uso                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3d_load_skill`       | Guias. Obrigatório antes do 1º `3d_run_code`: `authoring-guide`, `authoring-guide-2`, `authoring-guide-3`. Topic skills sob demanda. Argumento: `{ name }`. |
| `3d_get_scene_mcp`    | Primeiro read: digest + âncora livre `[x,y,z]`. `expand` para desdobrar filhos.                                                                             |
| `3d_get_scene`        | Re-read depois de editar. Fonte da verdade de counts/transforms.                                                                                            |
| `3d_get_objects`      | Detalhe por id: geometria, states, events, actions, tweens. Obrigatório antes de editar interatividade existente. `{ ids: string[] }`.                      |
| `3d_analyze_scene`    | Relatório do painel Performance (métricas + offenders). Barato e read-only.                                                                                 |
| `3d_get_html_content` | Ler o HTML overlay antes de editar.                                                                                                                         |
| `3d_get_generation`   | Poll de job IA. `{ job_id }`. Não restartar o job.                                                                                                          |
| `3d_set_view`         | Mira a câmera **privada de screenshot** sem capturar. Não move a câmera do usuário.                                                                         |

## Escrita / captura

| Tool                   | Uso                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `3d_run_code`          | Ato principal. `{ title, code, screenshot? }`. `title`: 2–6 palavras, gerúndio, específico desta call.                       |
| `3d_take_screenshot`   | Captura da câmera de screenshot, ou `view: "live"` no check final (`hero` obrigatório nesse check).                          |
| `3d_create_file`       | Quase nunca. A primeira tool 3D já cria arquivo se nenhum estiver aberto. `force: true` só se o usuário pediu arquivo extra. |
| `3d_set_html_content`  | Documento HTML overlay (HUD / motion code). Preferir `3d_edit_html_content` para patch.                                      |
| `3d_edit_html_content` | Find-and-replace no HTML existente.                                                                                          |
| `3d_generate_3d_model` | IA 3D. Só se o usuário pediu. Gasta créditos. Retorna `job_id` imediato.                                                     |
| `3d_generate_image`    | IA 2D. Só se o usuário pediu. `for_3d: true` quando o destino é `3d_generate_3d_model`.                                      |

`mcp_auth` existe no namespace; autenticar só se a tool falhar por auth.

## Topic skills oficiais (`3d_load_skill`)

Confirmados em `authoring-guide-2` (catálogo "Available skills"). Não inventar
outros nomes.

Obrigatórios em profundidade, **antes** de escrever o código:

- `boolean-operations` — qualquer CSG
- `shape-blends` — metaball / SDF blend
- `animation` — qualquer motion (default code-driven)
- `html-content` — antes de escrever HTML overlay
- `dsl-reference` — primeiro build substancial da sessão, ou erro inesperado de
  DSL
- `materials-and-look` — materiais não triviais, decals, vidro/transmission
- `texture-drawing` — antes de qualquer `generateTexture`
- `scene-optimization` — antes de otimizar; depois para verificar

Sob demanda (prompt casa com o nome): `building-scenes`, `organic-scenes`,
`procedural-generation`, `architecture`, `planets`, `lathe`, `state-transitions`
(só se o usuário nomear states/timeline, ou kinematic physics), `interactivity`
(editar events existentes ou features só de events), `games`, `game-example`,
`game-audio`, `game-controls` (opt-in), `physics`, `particles`, `hair`.

Incerteza: a lista acima veio do catálogo da parte 2 em 2026-09-20. Se
`3d_load_skill` recusar um nome, não inventar substituto — informar.

## Convenções críticas (do contrato oficial, não inventadas)

- Rotações em **graus**.
- Compostos: montar eixo-alinhado, `group()`, rotacionar o grupo.
- Piso `Plane`/`Rectangle`: `rotation({ x: -90 })` e `position({ y: 0 })`.
- `run_code` em calls **curtos**, um subsistema por vez.
- Digest indentado = hierarquia. Flags: `SELECTED`, `hidden`, `cloner:`,
  `states:N`, `events:N`, `anims:N`.
- Play mode: `play()` / `stop()` via DSL. Capturas em Play ignoram aiming de
  `set_view`.
