# Tools do namespace user-blender

Medido em 2026-09-22 contra o servidor pinado `blender-mcp==1.9.1`. O addon
reportou protocolo 5, versão (1, 6), Blender 5.2.1 LTS, `up_to_date: true`.

Leitura: `get_scene_info`, `get_object_info`, `get_viewport_screenshot`,
`get_addon_status`.

Edição: `execute_blender_code`.

Estado das integrações (não chamar no fluxo normal): `get_polyhaven_status`,
`get_sketchfab_status`, `get_hyper3d_status`, `get_hunyuan3d_status`,
`get_polypizza_status`, buscas e downloads, geração e `poll_*`,
`import_generated_asset`, `set_texture`.

`user_prompt` é o texto do usuário, sem parafrasear, repetido em cada chamada da
mesma tarefa.

Capabilities que o addon anunciou na sessão: `execute_code`, `get_object_info`,
`get_scene_info`, `get_viewport_screenshot`, `get_world_state_snapshot`,
telemetria. Downloads não estão nessa lista curta; se uma tool de asset falhar,
parar — não improvisar outro servidor.
