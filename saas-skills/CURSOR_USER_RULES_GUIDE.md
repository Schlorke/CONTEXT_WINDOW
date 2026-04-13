# CURSOR USER RULES GUIDE

Guia específico para o ponto mais confuso do runtime do Cursor: a diferença entre `Project Rules`, `User Rules` e o export de compatibilidade desta biblioteca.

## Regra Curta

Para o Cursor, trate assim:

- runtime oficial por projeto: `.cursor/rules/*.mdc`
- superfície global oficialmente documentada: `Cursor Settings > Rules`
- export de compatibilidade deste repositório: `~/.cursor/rules/*.mdc`

Ou seja: o global do Cursor não é equivalente a Codex e Claude.

## O Que Este Repositório Faz

Quando você roda:

```bash
pnpm install:cursor-global
```

o projeto faz duas coisas:

1. materializa as rules geradas em `~/.cursor/rules/*.mdc`
2. grava um arquivo auxiliar `~/.cursor/rules/CURSOR_USER_RULES.md`

Esse arquivo auxiliar existe para ser o texto pronto de bootstrap do Cursor global.

## O Que Ainda É Manual

O repositório **não edita as configurações internas do Cursor**.

Então, para ter o caminho global mais alinhado com a documentação oficial do Cursor, faça também:

```bash
pnpm export:cursor-user-rules
```

Depois:

1. abra `dist/cursor-user-rules/CURSOR_USER_RULES.md`
2. copie o conteúdo
3. cole em `Cursor Settings > Rules`

## Fluxo Recomendado

### Projeto atual

Quando você quer comportamento confiável neste repositório:

```bash
pnpm install:cursor -- .
pnpm verify:cursor -- .
```

### Global com compatibilidade + bootstrap oficial

Quando você quer preparar o Cursor para todos os projetos:

```bash
pnpm install:cursor-global
pnpm verify:cursor-global
pnpm export:cursor-user-rules
```

Depois cole o bootstrap exportado em `Cursor Settings > Rules`.

### Update correto

Quando a biblioteca mudar:

```bash
pnpm sync:cursor-global
pnpm verify:cursor-global
pnpm export:cursor-user-rules
```

Se o bootstrap gerado mudar, recoloque o texto atualizado em `Cursor Settings > Rules`.

## O Que `verify` e `status` Conseguem Provar

Eles conseguem provar:

- que os arquivos gerados existem em `~/.cursor/rules/`
- que o manifest está atualizado
- que o bootstrap `CURSOR_USER_RULES.md` foi gerado

Eles **não conseguem provar**:

- que você colou o bootstrap nas configurações do Cursor
- que a UI do Cursor exibiu essas regras globais
- que o Cursor tratou a configuração global exatamente como trataria uma `User Rule` criada manualmente na interface

## Por Que Não Jogar Tudo em User Rules

Não é uma boa ideia colar o corpo completo das `17` skills nas `User Rules` globais do Cursor.

Isso piora:

- custo de contexto
- ruído em tarefas simples
- ativação excessiva
- manutenção

Por isso o export global do Cursor é um **bootstrap curto**, enquanto o runtime detalhado continua em `.cursor/rules/*.mdc`.

## Resumo

Se houver dúvida:

- quer garantia por projeto: use `.cursor/rules/`
- quer preparar o global do Cursor: use `install:cursor-global` **e** `export:cursor-user-rules`
- quer prova estrutural: use `verify:cursor-global`
- quer comportamento oficial na UI: cole o bootstrap em `Cursor Settings > Rules`
