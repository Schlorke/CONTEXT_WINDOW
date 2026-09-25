---
name: teste-iphone-perf
description: >-
  Lembra o dono deste projeto de testar no iPhone real, com o medidor ?perf no
  site publicado, depois de qualquer mudança pesada (animação, cenas 3D Spline,
  Rive, vídeos, menus do header, scroll, estilos globais, dependências ou
  carregamento). Use ao fechar uma tarefa que alterou esses arquivos, antes ou
  logo depois do push, quando o pre-push imprimir "LEMBRETE: TESTE NO IPHONE", e
  para ler os prints do medidor que o dono mandar. Gatilhos: desempenho,
  performance, travando, travada, lento no celular, fluidez, teste no iphone,
  animação pesada.
---

# Teste no iPhone depois de mudança pesada

O dono não tem Mac nem BrowserStack. O teste que vale para desempenho é o iPhone
dele contra o site publicado. O WebKit do Playwright no Windows serve para
layout, toque e comportamento, mas desenha sem GPU e não reproduz a economia de
bateria do iOS nem a primeira visita pela rede.

## Quando lembrar

Sempre que a tarefa alterou um arquivo de `CAMINHOS_PESADOS`
(`tooling/git/mudanca-pesada.mjs`). Para saber sem adivinhar:

```bash
node tooling/git/mudanca-pesada.mjs --arvore
```

```bash
node tooling/git/mudanca-pesada.mjs --desde HEAD~3
```

Sem saída, não há o que lembrar. Com saída, o lembrete MUST entrar na mensagem
final ao dono. O `pre-push` imprime o mesmo lembrete, mas o dono não vê a saída
dos comandos que um agente roda: repasse com as suas palavras.

## O que dizer ao dono

Em português simples, sem jargão:

1. Depois do push, esperar a Vercel terminar de publicar, uns 2 minutos.
2. Abrir no Safari do iPhone: <https://logicalsolution.com.br/?perf>
3. Modo normal: esperar a abertura, rolar até o rodapé e voltar ao topo.
4. Repetir com a economia de bateria ligada.
5. Repetir numa aba privada, que mostra a primeira visita sem nada guardado.
6. Tirar UM print só no fim de cada passada e mandar na conversa.

Se a mudança foi em menus, pedir também para abrir e fechar os dois menus do
header antes do print.

Nada se configura na Vercel: o medidor é código do site e liga pelo `?perf`.
Nunca pedir o teste no servidor de desenvolvimento, a porta 3000: ele é lento e
engana a medição.

## Como ler os prints

Seção "Leituras que enganam" em `docs/03-verificacao.md`. O essencial:

- cada print do iPhone entra no medidor como travada nos segundos da captura;
- em economia de bateria o iPhone limita a 30 fps: olhar a coluna "pior", não
  "perdidos";
- primeira visita pesa mais que as seguintes;
- bloco "?" é o centro da tela fora das seções do `<main>`, como o rodapé ou um
  menu aberto.

Compare com o último teste registrado em `KNOWN_ISSUES.md` antes de concluir que
algo piorou. Registre o resultado novo lá quando mudar alguma conclusão.
