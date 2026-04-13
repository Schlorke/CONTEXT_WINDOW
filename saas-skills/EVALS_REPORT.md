# EVALS REPORT — Biblioteca saas-skills

**Data:** 12 de abril de 2026  
**Escopo:** cobertura estrutural da suíte de avaliação em `saas-skills/evals/skill-trigger-matrix.json`

---

## Resumo Executivo

A biblioteca agora possui uma matriz explícita de ativação para as `16` skills. O objetivo é reduzir ambiguidade de trigger e transformar o comportamento esperado em algo auditável.

- `16/16` skills possuem cobertura na matriz.
- `48` casos `should_trigger` registram quando a skill deve ser a primária.
- `48` casos `should_not_trigger` registram quando outra skill deve vencer ou a skill deve ficar inativa.
- `16` casos de conflito registram prioridades entre skills adjacentes.
- `48` checkpoints de `minimum_output` definem a saída mínima aceitável após ativação.

Total: `112` prompts de avaliação + `48` critérios mínimos de resposta.

---

## O Que Esta Suíte Valida

1. Cobertura completa por skill.
2. Fronteiras entre skills parecidas.
3. Priorização em casos de conflito.
4. Saída mínima esperada depois que a skill dispara.

O script `pnpm audit:skills` valida mecanicamente que:

- toda skill do filesystem aparece na matriz
- toda entrada da matriz aponta para uma skill real
- cada skill cumpre os mínimos de cobertura
- os anti-triggers não apontam de volta para a própria skill

---

## O Que Ainda Não É Automático

Esta suíte não prova, sozinha, que um agente específico obedecerá perfeitamente à skill em produção. Ela prepara o material para replay controlado em diferentes ambientes.

Ainda dependem de replay manual ou semi-automatizado:

- precisão real de ativação por agente
- qualidade final da resposta em cada ferramenta
- sensibilidade a prompts ambíguos fora da matriz atual

---

## Tooling de Replay

O fluxo de replay agora está operacionalizado com dois comandos:

```bash
pnpm evals:init -- <environment>
pnpm evals:score -- saas-skills/evals/results/<environment>.json
```

O primeiro gera um template preenchível por ambiente. O segundo compara o replay com a matriz canônica e gera um relatório Markdown consolidado.

Ambientes já provisionados nesta biblioteca:

- `claude-code`
- `cursor`
- `github-copilot`

Os arquivos ficam em `saas-skills/evals/results/` e já possuem baseline inicial versionado.

---

## Critério de Aprovação em Replay

Uma skill só deve ser considerada aprovada em um ambiente quando:

1. o prompt `should_trigger` seleciona a skill correta como primária
2. o prompt `should_not_trigger` não seleciona a skill errada
3. o prompt de `conflicts` respeita a prioridade registrada
4. a resposta cobre todos os itens de `minimum_output`

---

## Próximo Passo Recomendado

Executar os primeiros replays reais por ambiente usando os templates em `saas-skills/evals/results/` e consolidar os relatórios gerados pelo scorer.
