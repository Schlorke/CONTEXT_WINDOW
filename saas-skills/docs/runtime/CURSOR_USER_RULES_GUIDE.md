# Cursor User Rules

O Cursor guarda as User Rules nas configurações do aplicativo, não em arquivo. Para que o contrato
de arquitetura (e, se desejado, a política `Skills Used`) valha em todos os projetos abertos no
Cursor, gere o texto e cole-o em **Cursor Settings > Rules**.

```bash
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
```

A primeira linha traz a versão da biblioteca e um hash curto do texto
(`Context Window contract v2.0.0 sha256=…`). Depois de atualizar a biblioteca, gere de novo e
compare com o que está colado; se o hash mudou, substitua o texto.

## Precedência

As regras do projeto (`AGENTS.md`, `.cursor/rules`) vêm antes das User Rules. Em um repositório
com a biblioteca instalada (`install --target`), o bloco `context-window:contract` do `AGENTS.md`
já traz o mesmo contrato; as User Rules cobrem repositórios que ainda não têm instalação.

## O que não usar

- `~/.cursor/rules/*.mdc` como substituto das User Rules: esses arquivos ficam na máquina, não
  sincronizam e não aparecem como User Rules.
- Regras `.mdc` geradas com o corpo inteiro de cada skill: as skills já são descobertas pelo
  Cursor em `.agents/skills` e `.claude/skills` e carregadas sob demanda.

## Limites

Colar e conferir o texto é manual; o `cw` não lê as configurações do Cursor. Instalações 1.x que
geraram `~/.cursor/rules` ou `.cursor/rules` são apontadas por `doctor` e removidas com
`--migrate-legacy`.
