---
name: blender-master
description:
  Orchestrates Blender work over the already connected MCP namespace
  user-blender. Inspects the live scene, loads only the specialist skills the
  prompt needs, then edits via bpy with checkpoint and validation. Use for
  Blender, bpy, .blend, armatures, F-Curves, Cycles, Eevee, or GLB export from
  Blender. Do not use for Spline, Rive, CSS, or a bare greeting.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources:
    "live user-blender schemas 2026-09-22; Blender 5.2.1 LTS addon protocol 5;
    https://docs.blender.org/api/current/; https://agentskills.io/specification"
compatibility:
  Requires the connected Blender MCP (namespace user-blender) and Blender
  desktop with the addon server running. Does not install a second MCP.
---

# Blender Master

Orquestrador. Não contém o conhecimento 3D completo. Escolhe especialistas,
executa pelo MCP já conectado, valida.

Fonte canônica: `.agents/skills/blender/<skill>/SKILL.md`.

## MCP

- Namespace: `user-blender`. Não instalar outro servidor Blender.
- Servidor já pinado no Cursor: `blender-mcp==1.9.1` (pacote atual no PyPI
  chama-se `mcp-for-blender`; a troca de nome não exige mudar o pin).
- Antes de qualquer tool: descobrir o schema atual. Nunca inventar parâmetro.
- O addon oficial do Blender Lab (Blender 5.1+) é outro protocolo. Não está
  ligado nesta sessão. Não misturar os nomes de tool.

## Workflow

```text
INTENT → INSPECT → PLAN → CHECKPOINT → MODIFY → VALIDATE → RECOVER
```

1. **INTENT** — o que mudar e o que preservar.
2. **INSPECT** — `get_scene_info`. Nomes reais. Se o pedido for leitura, pare
   aqui. Leia `blender-scene-inspection` só nesse caso, ou quando o pedido for
   um personagem rigged.
3. **PLAN** — rode o roteador ou siga a tabela. Leia só esses `SKILL.md`.
4. **CHECKPOINT** — se for editar um arquivo já aberto, `save_as` para uma
   cópia. Nunca `save` por cima do `.blend` de origem. Se `is_dirty`, não
   descarte a sessão.
5. **MODIFY** — `execute_blender_code` em blocos curtos. Um subsistema por
   chamada. Descubra objetos; não chute `Cube`, `Armature`, `Bone`.
6. **VALIDATE** — releia a cena. Sucesso não é "o script rodou".
7. **RECOVER** — uma tentativa corrigida. Na segunda falha igual, pare e
   reporte. Leia `blender-debug`.

Depois de mudança visual, leia `blender-visual-qa` (além dos especialistas do
roteador). Teto de 3 ciclos de captura.

## Roteamento

Metadados, sem o corpo das skills:
[references/registry.json](references/registry.json).

```bash
node .agents/skills/blender/blender-master/scripts/route.mjs --self-test
node .agents/skills/blender/blender-master/scripts/route.mjs "melhore o material"
```

| Pedido                               | Ler                                                                 |
| ------------------------------------ | ------------------------------------------------------------------- |
| Saudação, Spline, Rive, CSS          | nada desta família                                                  |
| Só olhar a cena / rig sem editar     | `blender-scene-inspection` (+ `blender-rigging` se houver armature) |
| Malha, modifier, UV, nós, física     | `blender-modeling`                                                  |
| Osso, peso, constraint, deformação   | `blender-rigging`                                                   |
| Keyframe, asas, caminhada, timing    | `blender-animation`                                                 |
| Material, PBR, shader                | `blender-materials`                                                 |
| Só luz                               | `blender-lighting`                                                  |
| Câmera, lente, plano                 | `blender-camera`                                                    |
| Cycles, Eevee, comp                  | `blender-rendering`                                                 |
| GLB, landing, three                  | `blender-web3d`                                                     |
| Resultado visual                     | `blender-visual-qa`                                                 |
| Falha, timing artificial, deformação | `blender-debug` + o domínio                                         |

"Sem alterar materiais" não carrega `blender-materials`. Exportar GLB
"preservando animações" não carrega o curso de animação.

## Segurança

Inventário e o que fica desligado por padrão:
[references/mcp-tools.md](references/mcp-tools.md) e
[references/security.md](references/security.md).

- Download (Poly Haven, Sketchfab, Poly Pizza) e geração (Hyper3D, Hunyuan) só
  com pedido explícito.
- `execute_blender_code` é Python arbitrário dentro do Blender. Código mínimo,
  sem `subprocess`, rede ou escrita fora da cópia de trabalho.
- Não desligar telemetria sozinho. Se o usuário pedir para parar o envio de
  dados, aí sim `disable_telemetry`.

## Token economy

O `SKILL.md` é o procedimento. Detalhe está em `references/` daquela skill. Uma
saudação não lê esta família. Uma tarefa de material não lê rigging, física nem
animação.

## Referências

- [references/routing.md](references/routing.md)
- [references/security.md](references/security.md)
- [references/mcp-tools.md](references/mcp-tools.md)
