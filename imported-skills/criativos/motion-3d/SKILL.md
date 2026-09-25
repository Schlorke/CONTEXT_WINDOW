---
name: motion-3d
description: Integra Rive, Spline ou React Three Fiber quando a peça pede essa cena. Use só se o pedido citar Rive, Spline, .riv, .splinecode ou mockup 3D. Não use para legenda, roteiro ou zoom de tela.
---

# Rive, Spline e 3D

Autoria local, versão 0.1.0. Não é skill oficial.

## Não usar

Pedido sem arquivo ou cena 3D. Não carregue esta skill para ajuste de legenda.

## Estado nesta máquina

- `@remotion/rive` e `@remotion/three` não estão instalados. Não há `.riv` no projeto.
- Spline Desktop está instalado e o MCP `user-Spline` aparece na sessão, mas nenhuma cena foi validada dentro do Remotion.
- Não edite a cena original. Trabalhe numa cópia.
- MCP do editor não garante seek por frame. Sem teste curto estável, use exportação ou captura.

## Saída

Trecho renderizado ou pendência explícita. Aprovação: o arquivo de origem permanece intacto.
