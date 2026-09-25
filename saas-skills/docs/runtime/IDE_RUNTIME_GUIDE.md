# Guia de runtime dos clientes (Claude Code, Codex, Cursor)

Como cada cliente descobre skills e instruções, o que o `cw` instala para cada um e o que foi
comprovado, com versão. "Comprovado" significa executado com o binário real, em perfil isolado e sem
chamada de modelo; "documentado" significa só a documentação oficial; "não verificado" fica escrito
como tal.

## Matriz

| | Claude Code | Codex | Cursor |
| --- | --- | --- | --- |
| Skills do projeto | `.claude/skills/<id>/SKILL.md` | `.agents/skills/<id>/SKILL.md` (do diretório atual até a raiz do repositório) | `.agents/skills`, `.cursor/skills`; compatibilidade: `.claude/skills`, `.codex/skills` |
| Skills do usuário | `$CLAUDE_CONFIG_DIR/skills` ou `~/.claude/skills` | `~/.agents/skills`; legado `$CODEX_HOME/skills` e `~/.codex/skills` | `~/.agents/skills`, `~/.cursor/skills`; compatibilidade: `~/.claude/skills`, `~/.codex/skills` |
| Instruções do projeto | `CLAUDE.md` (o `cw` grava `@AGENTS.md`) | `AGENTS.md` | `AGENTS.md` e `CLAUDE.md` |
| Instruções do usuário | `$CLAUDE_CONFIG_DIR/CLAUDE.md` | `$CODEX_HOME/AGENTS.md` | Cursor Settings > Rules (colar à mão) |
| Só invocação explícita | `disable-model-invocation: true` | `agents/openai.yaml` → `policy.allow_implicit_invocation: false` | segue o frontmatter |
| Onde o `cw` grava | `.claude/skills` | `.agents/skills` | usa a cópia do Claude quando ele também foi escolhido; senão `.agents/skills` |

## O que foi comprovado (2026-09-24, Windows 11, Node.js 25.2.1)

| Cliente e versão | Prova | Resultado |
| --- | --- | --- |
| Codex CLI 0.147.0-alpha.1.2 (extensão ChatGPT 26.5730.61309) | `codex debug prompt-input` com `CODEX_HOME` isolado | as 20 skills automáticas do perfil `dev` aparecem na raiz `.agents/skills` do projeto; a skill explícita não aparece; os blocos do `AGENTS.md` do projeto e o `$CODEX_HOME/AGENTS.md` chegam ao prompt; o texto do time no `AGENTS.md` é preservado |
| Codex CLI 0.147.0-alpha.1.2 | skill de teste em `$CODEX_HOME/skills` | o local legado continua sendo lido; cópias 1.x ali seguem visíveis até a migração |
| Claude Code 2.1.74 | `claude -p` sem credenciais, `CLAUDE_CONFIG_DIR` isolado (custo 0, sem chamada de API) | 21 skills do projeto descobertas; o mesmo no escopo de usuário; `disable-model-invocation` retira exatamente uma skill da lista enviada ao modelo; o hook `UserPromptSubmit` injeta contexto para prompt correspondente e fica calado para prompt neutro |
| Cursor 3.22.7 | observação da própria sessão do IDE | lê `~/.claude/skills`, `~/.codex/skills` e `~/.agents/skills`; quando o mesmo nome existe em mais de um lugar, mostra uma só cópia. As cópias vistas eram anteriores à 2.0: isso mostra os locais lidos, não a distribuição 2.0 |

Os testes que repetem essas provas estão em `test/clients.test.mjs` e rodam quando o binário existe.
O Codex é procurado em `CW_CODEX_BIN`, no `PATH` e na extensão ChatGPT do editor
(`~/.cursor/extensions/openai.chatgpt-*/bin/<plataforma>/codex`, também em `~/.vscode`); o Claude
Code em `CW_CLAUDE_BIN` e no `PATH`.

Em 2026-09-25 as mesmas provas de Codex e Claude foram repetidas em um produto gerado a partir do
pacote final (`pnpm acceptance`, etapas A13a e A13b): o Codex listou as 20 skills automáticas na
raiz `.agents/skills` do produto e o Claude Code carregou 21 skills do projeto, com custo 0.
Descoberta não é aplicação: nenhuma dessas provas mostra o modelo usando a skill.

## Não verificado

- Descoberta de skills de **projeto** pelo Cursor: o CLI `cursor-agent` 2026.09.08 exige a API
  antes de listar qualquer coisa, e não houve autorização para chamadas autenticadas. O roteiro
  para uma sessão nova do IDE, com uma skill-sonda de nome único cuja origem é identificável, está
  em `acceptance/CURSOR-VERIFICATION.md`.
- Descoberta de skills do **usuário** pelo Codex em perfil isolado: o Codex usa a pasta do perfil
  do sistema operacional mesmo com `HOME`/`USERPROFILE` trocados, então o teste não pode ser feito
  sem tocar no perfil real. O caminho `~/.agents/skills` aparece como raiz no prompt (lido, não
  escrito).
- Invocação explícita (`$skill` no Codex, `/skill` no Claude) de uma skill só explícita: exige
  chamada de modelo.
- User Rules do Cursor: o texto é gerado por `contract --format cursor-user-rules`; colar e
  conferir é manual.
- Linux e macOS: a CI em `.github/workflows/qa.yml` cobre Ubuntu e Windows (biblioteca) e Ubuntu
  (aceitação sem os clientes de IA), mas não foi executada neste ciclo (sem push).
- Aplicação de uma skill pelo modelo em qualquer um dos três clientes: exige avaliação com chamada
  de modelo, que depende de autorização e orçamento.

## Duplicatas entre escopos (ACH-011)

Os três clientes leem o projeto e o usuário ao mesmo tempo. O Codex mostra as duas cópias quando o
nome se repete; o Claude aplica precedência (usuário sobre projeto); o Cursor mostra uma. Uma cópia
antiga em qualquer um desses lugares pode, portanto, vencer a nova.

Tratamento:

1. Instale a biblioteca em um só escopo por cliente.
2. O `cw` grava uma cópia por destino (Claude e Cursor dividem `.claude/skills`), com manifest e
   hash por arquivo; `verify` confere cada uma.
3. `doctor` percorre todas as pastas que cada cliente lê — incluindo os locais legados do Codex —,
   lista cópias com o mesmo nome e marca as divergentes; é somente leitura.
4. Instalações 1.x (`.saas-skills-manifest.json`) bloqueiam a instalação até `--migrate-legacy` ou
   `--keep-legacy`.

## Contexto carregado

Medido com o tokenizador `o200k_base` sobre uma instalação real do perfil `dev`:

| Parte | Quando entra | Tokens |
| --- | --- | --- |
| Contrato + política de uso no `AGENTS.md` | sempre | 730 |
| Lista de skills (nome + descrição, 20 automáticas) | sempre, montada pelo cliente | 1.179 |
| Corpo de uma skill (`SKILL.md`) | quando a tarefa ativa a skill | 2.115 a 3.674 |
| Referências | só quando a skill pede | sob demanda |

Uma tarefa típica (contrato + lista + uma skill) fica entre 4.024 e 5.583 tokens. O Claude Code
reserva para a lista inteira cerca de 1% da janela de contexto (≈ 2.000 tokens numa janela de 200 mil,
dividida com outras skills); a biblioteca ocupa ≈ 1.200. Os testes limitam o texto sempre ativo a
4.096 bytes e a lista a 7.200 bytes.

## Referências oficiais

- Cursor: <https://cursor.com/docs/skills.md>, <https://cursor.com/docs/rules.md>
- Claude Code: <https://code.claude.com/docs/en/skills.md>, <https://code.claude.com/docs/en/hooks>
- Codex: <https://developers.openai.com/codex/skills>, <https://github.com/openai/codex/issues/14337>
- Especificação Agent Skills: <https://agentskills.io/specification>
