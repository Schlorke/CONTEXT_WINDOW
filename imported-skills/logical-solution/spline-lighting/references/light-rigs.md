# Rigs

Receita de intenção. Intensidade, angle e shadow props: `dsl-reference`.

## Produto / hero web

- 1 key directional (lado alto, ~45°), sombra ligada se o contato com o chão
  importa.
- 1 fill fraca do lado oposto, em geral **sem** shadow.
- 1 rim atrás/lado, baixa intensidade, para o contorno.
- Background escuro; o 3D não compete com headline branca.

## Cinemático

- Key mais dura, fill quase zero, rim visível.
- Contraste alto, mas o assunto ainda lê. Exposure da captura live avisa.

## Sutil / ambient

- Key macia, fill próximo, rim opcional.
- Fog leve com `useBackgroundColor` quando o contrato pedir atmosfera.

## Três pontos clássicos

Key + fill + rim. Se a cena já tem `Light Main` e `Key Light`,
**renomear/ajustar** em vez de criar a terceira e a quarta.

Incerteza: nomes de métodos DSL (`light()`, `shadow()`, `fog()`, `sky()`) devem
ser confirmados no `dsl-reference` da sessão — não copiar assinaturas daqui.
