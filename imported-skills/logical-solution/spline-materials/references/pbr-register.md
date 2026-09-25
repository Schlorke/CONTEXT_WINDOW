# Registro de aparência (critério, não API)

Props exactas de layer vivem em `materials-and-look` / `dsl-reference`. Esta
tabela é intenção visual.

| Intenção          | Lê como                                                      | Evitar                  |
| ----------------- | ------------------------------------------------------------ | ----------------------- |
| Metal             | Highlights duros, energia no spec, possible anisotropy sutil | Rainbow, glow neon      |
| Vidro             | Refração/transmission, edge fresnel, o fundo atravessa       | Metal branco semi-opaco |
| Plástico          | Color saturado, roughness médio, spec largo                  | Matcap de chrome        |
| Tecido            | Roughness alto, spec mínimo, variação de valor               | Metal/pérola            |
| Seda              | Roughness baixo-médio anisotrópico, highlight estreito       | Espelho uniforme        |
| Borracha          | Roughness alto, spec macio, pouco fresnel                    | Gloss de carro          |
| Cerâmica          | Spec pequeno e limpo, roughness baixo-médio                  | Metal                   |
| Matte             | Quase sem spec                                               | Matcap, metalness       |
| Glossy dielétrico | Spec claro mas color permanece                               | Tratar como metal       |

Superfícies grandes no registro "real-world" (parede, rua, madeira): textura
sutil mapeada, não um único albedo plástico. O contrato oficial chama isso de
"cardboard model" quando falha.

`generateTexture` tem contrato próprio (`texture-drawing`). Não escrever canvas
2D de memória.
