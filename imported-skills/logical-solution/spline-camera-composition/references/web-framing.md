# Framing em website

Neste repositório o hero é DOM + canvas Spline (`packages/site-dom` →
`SplineScene`). Zoom da câmera no runtime (`setZoom`) é dolly, não crop 2D — o
palco 2D cuida de pan/crop.

Regras:

- Reservar o lado/área do título. O 3D vive no espaço que o layout já deixou.
- Contraste: mesh claro em navy, ou o inverso — nunca cinza médio em cinza médio
  atrás de tipo branco.
- Mobile: o assunto precisa ler num recorte mais alto e estreito. Não depender
  de um único widescreen.
- Interatividade de órbita no hero deste site existe; a intro desliga. Não
  assumir drag em toda cena.
- Reduced motion e pause fora da tela são da skill `spline-web-integration` /
  `spline-web-performance`, não da câmera.

Confirmado no código: `spline-scene.tsx` documenta que valores de `zoom` ≠ 1
dolly a câmera.
