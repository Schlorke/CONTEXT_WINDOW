---
name: davinci-mcp-operator
description: Opera o MCP criativos-resolve no DaVinci Resolve Free 21.1 via ponte Lua interna. Use ao listar projeto, timeline, Media Pool ou ao rodar o smoke test _mcp_smoke_test.
disable-model-invocation: true
---

# Operador do MCP

## Objetivo

Falar com o Resolve Free 21.1.0 sem `scriptapp` externo, que nesta maquina retorna nulo.

## Quando ativar

Qualquer leitura ou teste dentro do Resolve.

## Quando nao ativar

Inspecao de arquivo solto. Use `tools/media/inspect_media.py` e o FFmpeg.

## Fato medido

`ResolvePython` e `fuscript.exe` fora do aplicativo recebem `resolve = nil`. A ponte so vale se o usuario rodar `Workspace > Scripts > Utility > criativos_mcp_bridge` com um projeto aberto. Se o menu nao listar o script, reinicie o Resolve uma vez. Nao mate o processo do usuario.

## Transporte

Stdio no Codex. Arquivos em `tools/resolve-mcp/ipc`. Nenhuma porta de rede.

## Ferramentas

Somente estas:

- `resolve_bridge_status`
- `resolve_version`
- `resolve_current_project`
- `resolve_list_projects`
- `resolve_current_timeline`
- `resolve_list_media_pool`
- `resolve_capabilities`
- `resolve_create_smoke_project`
- `resolve_create_smoke_timeline`
- `resolve_import_smoke_media`
- `resolve_add_smoke_marker`
- `resolve_delete_smoke_project`

Escrita so no projeto `_mcp_smoke_test` e em midia dentro de `tools/resolve-mcp/smoke-media`.

## Procedimento

1. `resolve_bridge_status`. Se `running` for falso, classifique BLOCKED e diga o clique de menu. Nao improvise outra ponte.
2. Leituras antes de qualquer escrita.
3. Smoke: criar projeto, timeline, importar barra descartavel, marcador, listar, depois `resolve_delete_smoke_project`.
4. Nao apague outro projeto. Nao ha ferramenta para isso.

## Fallback

Sem ponte: FFmpeg/ffprobe para metadados, loudness, silencio e cena. Edicao dentro do Resolve fica manual.

## Definicao de pronto

Cada chamada tem classificacao VERIFIED, PARTIALLY VERIFIED, UNVERIFIED ou BLOCKED.
