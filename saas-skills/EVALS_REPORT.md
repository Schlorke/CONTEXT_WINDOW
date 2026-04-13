# EVALS REPORT

Relatório da suíte de avaliação da biblioteca `saas-skills`.

**Data de referência:** 12 de abril de 2026  
**Fonte canônica:** `saas-skills/evals/skill-trigger-matrix.json`

## Objetivo

Este documento descreve como a biblioteca mede ativação esperada das skills.

O foco aqui não é validar estrutura do repositório, e sim responder:

- quando uma skill deve disparar
- quando ela não deve disparar
- como resolver conflitos entre skills próximas
- qual é a saída mínima aceitável após ativação

## Cobertura Atual

A matriz atual contém:

- `16/16` skills cobertas
- `48` casos `should_trigger`
- `48` casos `should_not_trigger`
- `16` casos de conflito
- `48` checkpoints de `minimum_output`

Total:

- `112` prompts de avaliação
- `48` critérios mínimos de saída

## O Que a Suíte Valida

Cada skill é coberta em quatro dimensões:

1. **Ativação positiva**  
   O prompt deve selecionar a skill certa como primária.

2. **Ativação negativa**  
   O prompt não deve selecionar a skill errada.

3. **Conflito entre skills**  
   O prompt força uma escolha de prioridade entre domínios próximos.

4. **Saída mínima**  
   A resposta precisa cobrir os itens essenciais da skill ativada.

## O Que o Auditor Garante

O comando `pnpm audit:skills` garante mecanicamente que:

- toda skill do filesystem aparece na matriz
- toda entrada da matriz aponta para uma skill real
- cada skill cumpre os mínimos de cobertura
- anti-triggers não apontam de volta para a mesma skill

Isso evita drift entre a biblioteca e sua suíte de avaliação.

## Tooling de Replay

O replay real por ambiente foi operacionalizado com dois comandos:

```bash
pnpm evals:init -- <environment>
pnpm evals:score -- saas-skills/evals/results/<environment>.json
```

### `pnpm evals:init`

Cria um template preenchível por ambiente em `saas-skills/evals/results/`.

Hoje a biblioteca já provisiona baseline para:

- `claude-code`
- `cursor`
- `github-copilot`

### `pnpm evals:score`

Compara o replay preenchido com a matriz canônica e gera:

- um `*.report.md` por ambiente
- um `SUMMARY.md` quando o diretório inteiro é pontuado

O scorer agora só considera um caso aprovado quando:

- o avaliador marcou `result.status` como `passed`
- a skill primária observada bate com a esperada
- as secundárias obrigatórias foram observadas, quando aplicável
- todos os itens de `expected_minimum_output` foram marcados como cobertos

Casos marcados como `failed` ou `partial` permanecem falhos, mesmo que os campos derivados estejam preenchidos.

Ao pontuar um diretório inteiro, apenas arquivos JSON com schema de replay válido entram na consolidação. JSONs soltos e artefatos não relacionados são ignorados com aviso.

## Critério de Aprovação

Uma skill só deve ser considerada aprovada em um ambiente quando:

1. o caso `should_trigger` escolhe a skill correta como primária
2. o caso `should_not_trigger` não escolhe a skill errada
3. o caso de conflito respeita a prioridade definida
4. todos os itens de `expected_minimum_output` foram cobertos

## O Que Ainda Não É Automático

A suíte atual prepara e consolida replay, mas não substitui execução real por ferramenta.

Ainda dependem de replay humano ou semi-automatizado:

- precisão real de ativação por agente
- qualidade final da resposta em cada ambiente
- sensibilidade a prompts ambíguos fora da matriz atual

## Como Ler os Resultados

Arquivos relevantes:

- [evals/README.md](evals/README.md): visão geral do fluxo
- [evals/results/README.md](evals/results/README.md): como preencher resultados
- `claude-code.report.md`, `cursor.report.md`, `github-copilot.report.md`: relatórios por ambiente
- `SUMMARY.md`: consolidação do diretório de resultados

O baseline atual provisionado é esperado como:

- `0` casos aprovados
- `0` falhos
- `112` pendentes

Esse baseline não é falha; ele só indica que o replay ainda não foi executado.

## Próximo Passo Recomendado

Executar os primeiros replays reais nos ambientes provisionados e substituir o baseline pendente por resultados observados com evidência em `transcript_ref`.
