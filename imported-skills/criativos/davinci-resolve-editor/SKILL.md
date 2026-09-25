---
name: davinci-resolve-editor
description: Organiza Edit, Cut, Media Pool, bins e timelines no DaVinci Resolve. Use ao montar ou arrumar um projeto no Resolve.
disable-model-invocation: true
---

# Editor Resolve

## Objetivo

Montar em timeline nova, com midia nomeada e fonte intacta.

## Quando nao ativar

O trabalho e so Fusion, so Fairlight ou so Deliver sem mexer no corte.

## Procedimento

1. Projeto e timeline novos para o job. Nao edite em cima da timeline do cliente sem copia.
2. Bins: `01_camera`, `02_tela`, `03_audio`, `04_grafismo`, `05_refs`, `90_selects`.
3. Nome de timeline: `cliente_peca_v01_data`. Versao nova, nao overwrite.
4. Cut page para triagem rapida. Edit page para corte fino, trilhas e cortes J/L.
5. Trilhas: V1 picture, V2-V3 grafismo, A1 dialogo, A2-A3 sala/SFX, A4 musica.
6. Marcadores de beat antes de aparar. Cor do marcador e rotulo, nao enfeite.

## Condicional

Footage longo: selects em timeline separada, depois append na timeline de corte. Tela de software: skill `screen-recording-editor`.

## MCP

Leituras via `davinci-mcp-operator`. Escrita automatica so em `_mcp_smoke_test` ate existir ferramenta de projeto autorizado.

## Erro comum

Editar na timeline errada ou importar para o bin raiz. Confira o projeto atual antes de importar.

## Definicao de pronto

Timeline versionada, bins separados e nenhum arquivo original substituido.
