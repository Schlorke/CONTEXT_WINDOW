# Roteamento e anti-triggers

## Princípio

Máxima especialização, mínimo contexto. O master escolhe. Especialistas não
puxam uns aos outros, exceto:

- todo especialista visual termina apontando `spline-visual-qa`;
- todo especialista começa: se o master ainda não foi lido, ler `spline-master`
  (orquestração + segurança MCP).

## Positivo / negativo

| Skill                       | Dispara                                                | Não dispara                                                   |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `spline-master`             | Spline 3D, MCP Spline, cena 3D no editor               | Hana 2D, Rive, CSS/DOM sem 3D                                 |
| `spline-scene-analysis`     | auditar, inspecionar, mapear hierarquia                | "só muda a cor desta esfera" (análise mínima no master basta) |
| `spline-modeling`           | esfera, malha, boolean, grupo, lathe                   | só luz, só material em objeto existente                       |
| `spline-materials`          | vidro, metal, tecido, roughness, layer                 | só transformar posição/escala                                 |
| `spline-lighting`           | luz, sombra, rim, exposição, key/fill                  | modelar geometria nova                                        |
| `spline-camera-composition` | câmera, framing, composição, FOV                       | material ou boolean                                           |
| `spline-animation`          | animar, idle, orbit, spin, entrance                    | hover/click sem motion (isso é interaction)                   |
| `spline-interaction`        | hover, click, drag, scroll event, states existentes    | idle loop sem input                                           |
| `spline-web-performance`    | FPS, lag, polígonos, mobile GPU, analyze_scene         | direção de arte pura                                          |
| `spline-web-integration`    | React, Next, `.splinecode`, `SplineScene`, runtime     | trabalho só no editor Spline                                  |
| `spline-visual-qa`          | depois de mudança visual, screenshot, "está estranho"  | pergunta só de arquitetura de pastas                          |
| `spline-hero-design`        | hero 3D, landing, look Logical Solution / SaaS premium | cena de jogo, ilha flutuante genérica                         |

## Conflitos (quem manda)

- Motion novo vs states do editor: **animation** (code-driven) é o default
  oficial. `state-transitions` só se o usuário nomear states/timeline ou for
  kinematic physics.
- Interação nova vs events existentes: nova → animation + html-content;
  existente → interaction + `3d_get_objects`.
- IA vs procedural: modeling/procedural vence se a forma é primitiva clara. IA
  só com pedido explícito.
- Performance vs look: `spline-web-performance` veta complexidade; hero-design
  não autoriza custo extra sem pergunta "existe equivalente mais barato?".

## Progressive disclosure

1. Frontmatter (nome + description) — sempre visível ao agente.
2. `SKILL.md` — só da skill escolhida.
3. `references/` — só o arquivo citado no passo atual.
4. `3d_load_skill` — contrato Spline e topic skill do domínio, não todos os
   topic skills.
