# Input e acessibilidade

- Desktop: hover + click. Touch: não há hover estável — o estado default tem que
  ler sozinho.
- Drag: só se o brief pedir e o host não depender do gesto para rolar
  (`touch-action: pan-y` neste repo).
- Teclado: se a interação for essencial, o DOM do site (não o canvas) deve expor
  o equivalente. Canvas WebGL não é um button.
- Reduced motion: preferência do SO. No overlay HTML, confirmar no skill
  `html-content` se a bridge expõe isso; no React deste repo, seguir os gates já
  existentes em `shared/animation`.
- Não assumir que collision/trigger funcionam sem o topic `physics` /
  `interactivity` carregado — são features de events, não de chute.

Incerteza: a lista exacta de event types (Scroll, Collision, Trigger, DragDrop,
LookAt, Follow) veio do catálogo oficial de 2026-09-20. Confirmar no
`interactivity` da sessão antes de usar um tipo.
