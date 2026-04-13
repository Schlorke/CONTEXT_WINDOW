# PORTABILITY MATRIX

Matriz de portabilidade da biblioteca `saas-skills`.

**Data de referência:** 12 de abril de 2026  
**Objetivo:** registrar como a biblioteca deve ser instalada e distribuída em cada ambiente

## Visão Geral

`saas-skills` suporta dois modos oficiais de distribuição:

1. **Árvore canônica** em `saas-skills/`
2. **Bundle achatado** em `dist/flat-skills/`

A escolha depende da forma como a ferramenta descobre as skills.

## Modos de Distribuição

### Árvore canônica

Use quando a ferramenta:

- aceita descoberta recursiva
- permite referência explícita ao `SKILL.md`
- não exige uma pasta imediata por skill

Ponto forte:

- mantém a organização por coleção
- preserva a estrutura original da biblioteca

### Bundle achatado

Use quando a ferramenta:

- exige uma pasta imediata por skill
- não faz descoberta recursiva
- depende de uma raiz simplificada para ingestão

Geração:

```bash
pnpm export:flat-skills
```

## Matriz por Ambiente

| Ambiente | Modo recomendado | Descoberta esperada | Status local | Observação |
| --- | --- | --- | --- | --- |
| Claude Code / Claude.ai Projects | Árvore canônica `saas-skills/` | Recursiva ou por referência explícita | ✅ | Layout validado; replay real ainda depende de preenchimento do baseline |
| Cursor IDE | Árvore canônica `saas-skills/` | Referência direta ou convenção local do ambiente | ✅ | Compatibilidade documental preparada; replay real pendente |
| GitHub Copilot / loaders sem descoberta recursiva | `dist/flat-skills/` | Subpastas imediatas por skill | ✅ | Export achatado validado com `16` skills |
| Continue.dev / uso manual | Árvore canônica ou bundle achatado | Referência explícita no contexto | ✅ | Sem dependência de descoberta automática |

## Garantias Verificadas

No estado atual, a biblioteca garante:

- o bundle achatado é regenerável a partir da árvore canônica
- o export cria `16` diretórios imediatos de skill
- cada diretório exportado contém `SKILL.md`
- o export também gera `manifest.json`

## O Que Significa “Portável” Neste Projeto

Neste contexto, “portável” significa:

- a biblioteca pode ser copiada para outro repositório sem arquivos legados
- as skills continuam resolvendo suas referências internas
- a mesma base pode ser consumida em mais de um tipo de ferramenta

Não significa, por si só:

- que todos os ambientes vão escolher a skill correta sem replay
- que todos os agentes terão o mesmo comportamento qualitativo

Esses pontos dependem da camada de evals.

## Limites Desta Matriz

Este documento registra portabilidade de empacotamento e instalação.

Ele não é:

- benchmark de qualidade por agente
- relatório de ativação real
- certificação comportamental entre ferramentas

Para isso, consulte:

- [EVALS_REPORT.md](EVALS_REPORT.md)
- [evals/README.md](evals/README.md)
- [evals/results/README.md](evals/results/README.md)

## Recomendação Prática

Se houver dúvida, siga esta regra:

- use `saas-skills/` quando o ambiente aceitar a árvore canônica
- use `dist/flat-skills/` quando o ambiente exigir descoberta rasa

Isso cobre o caminho de instalação mais seguro para a maioria dos cenários.
