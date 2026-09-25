# Checklist de crítica

Marcar cada item contra o brief, não contra "parece 3D".

- Composition — assunto lê; espaço negativo a favor do layout
- Scale — proporcional ao resto da cena e ao papel de hero
- Alignment — grupos não deslizaram após rotação composta
- Lighting — direção clara; sem estouro; sombra de contato se há chão
- Material — a superfície é o material pedido (vidro ≠ metal branco)
- Contrast — separa assunto do fundo; tipo DOM ainda passa WCAG visual
- Depth — overlap / fog / escala, não só um mesh flutuando
- Hierarchy — um herói, não três competindo
- Clipping — não corta o frame; floor não fura o assunto
- Artifacts — z-fight, decal EMPTY, checkerboard de textura, bounding box errado
- Responsiveness — o shot ainda faz sentido num recorte vertical

Fatos numéricos: `3d_get_scene` / `3d_analyze_scene`. Pixels: screenshot. Os
dois.
