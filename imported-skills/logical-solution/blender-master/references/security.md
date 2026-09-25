# Segurança

O MCP já conectado executa Python dentro do Blender. Não há sandbox. A skill
limita o que o agente pede, e o usuário continua no controle do addon.

## Ligado por padrão

- `get_addon_status`, `get_scene_info`, `get_object_info`
- `get_viewport_screenshot`
- `execute_blender_code` só depois de inspeção e, se for edição, de uma cópia do
  arquivo

## Desligado até pedido explícito

- Poly Haven, Sketchfab, Poly Pizza (rede + arquivo)
- Hyper3D Rodin e Hunyuan3D (crédito e rede)
- `disable_telemetry` (preferência do usuário; não inverter sozinho)
- `record_trajectory_feedback`

O addon instalado em Blender 5.2 contém a checagem de path traversal do
CVE-2026-66004 em `download_polyhaven_asset` (`..`, path absoluto, saída do
temp). Mesmo assim o download não é automático.

## Arquivo aberto

Não gravar por cima do `.blend` de origem. `save_as` numa cópia. Se a sessão
está suja (`is_dirty`), não abrir outro arquivo no processo da GUI e não fazer
`revert`.

Teste de animação e de GLB: `blender --background --factory-startup` com
`scripts/smoke-headless.py`. Esse processo não recebe o caminho do arquivo do
usuário.

## O que permanece

Qualquer `execute_blender_code` pode apagar dados se o código for ruim. Por isso
o bloco é curto, a validação é relida da cena, e o segundo erro igual para.
