# TARGET REPO AGENT GUIDE

Arquivo copiável para um repositório de destino.  
Se quiser, você pode copiar este conteúdo como `AGENTS.md` na raiz do projeto.

Use este documento quando quiser que um agente instale `saas-skills` corretamente no projeto, valide a instalação e faça smoke tests sem tocar no código da aplicação.

Se a intenção for instalar também os runtimes globais do usuário, use os homes isolados primeiro e só depois faça a instalação real.

Se o escopo incluir Cursor global, trate `~/.cursor/rules/` como export de compatibilidade e gere também o bootstrap para `Cursor Settings > Rules`.

Se o objetivo for atualizar uma skill já instalada, trate a biblioteca canônica como fonte de verdade e sincronize os runtimes. Não corrija a cópia instalada diretamente.

Se o objetivo incluir governança ou observabilidade, instale também a política de disclosure de skills para exigir que o agente reporte no final da tarefa quais skills realmente usou.

## Instrução para o Agente

Você deve instalar e validar a biblioteca `saas-skills` neste repositório seguindo estas regras:

1. **Não modifique código de aplicação.**
   Só é permitido criar ou atualizar arquivos em:
   - `.claude/skills/`
   - `.cursor/rules/`
   - o `CODEX_HOME` escolhido para a instalação da Codex
   - o `CLAUDE_HOME` escolhido para a instalação global do Claude
   - o `CURSOR_HOME` escolhido para a instalação global do Cursor
   - documentação de verificação, se isso for explicitamente pedido

2. **Não rode build, migração, seed, dev server ou testes da aplicação.**
   A validação aqui é da instalação das skills, não do produto.

3. **Use três runtimes diferentes.**
   - Codex runtime: `$CODEX_HOME/skills/<skill>/SKILL.md`
   - Claude runtime: `.claude/skills/<skill>/SKILL.md` ou `~/.claude/skills/<skill>/SKILL.md`
   - Cursor projeto: `.cursor/rules/*.mdc`
   - Cursor global compat: `~/.cursor/rules/*.mdc`
   - Cursor global oficial: `Cursor Settings > Rules` com o bootstrap exportado

4. **Não trate `.cursor/skills/` como runtime oficial do Cursor.**
   O runtime oficial do Cursor é `.cursor/rules/`.

5. **Comece sempre com uma simulação.**
   Primeiro execute o fluxo em modo de prévia para mostrar o que será instalado.

6. **Valide a Codex em sandbox antes da instalação real.**
   Use homes isolados para provar que o fluxo funciona sem tocar nas instalações reais do usuário.

7. **Trate o runtime instalado como artefato gerado.**
   Se o usuário pedir update, edite `saas-skills/` e rode sync. Não aplique hotfix diretamente em `.claude/skills/`, `.cursor/rules/` ou `$CODEX_HOME/skills/`.
   Se o escopo incluir Cursor global, regenere também o bootstrap de `Cursor Settings > Rules`.

8. **Se a política de disclosure estiver instalada, cumpra-a em toda resposta final.**
   Ao final da tarefa, inclua a seção `Skills Used`.

## Fluxo Obrigatório

### Escopos suportados

Escolha o escopo certo antes de instalar:

- somente Codex: `node scripts/install-agent-runtimes.mjs . --codex-only`
- somente Claude do projeto: `node scripts/install-agent-runtimes.mjs . --claude-only`
- somente Cursor do projeto: `node scripts/install-agent-runtimes.mjs . --cursor-only`
- projeto completo: `node scripts/install-agent-runtimes.mjs . --project-only`
- projeto + globais: `node scripts/install-agent-runtimes.mjs . --global-all`

### Política opcional de disclosure

Se o usuário quiser rastrear skills usadas, execute também:

```bash
node scripts/install-skill-usage-reporting.mjs .
node scripts/verify-skill-usage-reporting.mjs .
```

### Etapa 1: Prévia sem escrita

Execute:

```bash
node scripts/install-agent-runtimes.mjs . --dry-run --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
```

Confirme que os artefatos planejados estão limitados a:

- `.claude/skills/...`
- `.cursor/rules/...`
- `.agent-runtime-smoke/codex-home/skills/...`
- `.agent-runtime-smoke/claude-home/skills/...`
- `.agent-runtime-smoke/cursor-home/rules/...`

### Etapa 2: Instalação de validação em sandbox

Se a prévia estiver limpa, execute:

```bash
node scripts/install-agent-runtimes.mjs . --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
```

### Etapa 3: Verificação estrutural da sandbox

Execute:

```bash
node scripts/verify-agent-runtimes.mjs . --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
```

Considere falha se:

- alguma skill da Codex estiver ausente
- alguma skill do Claude estiver ausente
- alguma rule do Cursor estiver ausente
- alguma instalação global do Claude estiver ausente
- o export global de compatibilidade do Cursor estiver ausente
- o bootstrap `CURSOR_USER_RULES.md` não tiver sido gerado para o Cursor global
- algum runtime gerenciado não tiver `.saas-skills-manifest.json`
- a instalação depender de editar código do app

### Etapa 4: Smoke tests sem edição

Faça smoke tests apenas com prompts analíticos.  
Não escreva arquivos nem proponha patches nesta etapa.

Prompts sugeridos:

1. Backend

```text
Analyze how you would design the invoices API in this repository with auth, validation, and pagination. Do not edit files.
```

1. Frontend

```text
Explain how you would organize the shared React layers and feature folders for this repository. Do not edit files.
```

1. Documentation

```text
Propose a README, AGENTS.md, and ADR structure for this repository. Do not edit files.
```

1. Testing

```text
Define the testing pyramid and tooling stack you would apply to this repository. Do not edit files.
```

### Etapa 5: Instalação real, se aprovada

Se a sandbox passar, execute a instalação real:

```bash
node scripts/install-agent-runtimes.mjs . --global-all
node scripts/verify-agent-runtimes.mjs . --global-all
node scripts/status-agent-runtimes.mjs . --global-all
node scripts/export-cursor-user-rules.mjs
```

## Critério de Aprovação

Considere a instalação funcional quando:

- Codex runtime existir em `$CODEX_HOME/skills/`
- Claude runtime existir em `.claude/skills/` e `~/.claude/skills/`
- Cursor runtime existir em `.cursor/rules/`
- export de compatibilidade do Cursor existir em `~/.cursor/rules/`, quando o escopo incluir global
- bootstrap `CURSOR_USER_RULES.md` ter sido gerado para o Cursor global
- todos os manifests estiverem na versão atual da biblioteca
- os smoke tests responderem no domínio certo
- as respostas cobrirem o essencial do assunto pedido
- nenhum arquivo de aplicação tiver sido alterado

## Critério de Falha

Considere falha quando:

- o agente instalar apenas `.cursor/skills/` e ignorar `.cursor/rules/`
- o agente copiar a árvore canônica inteira para dentro de `.claude/skills/` sem flatten
- o agente usar o `skill-installer` da Codex como se ele instalasse também Claude e Cursor
- o agente ignorar os runtimes globais quando o objetivo declarado for instalação global
- o agente afirmar que o Cursor global está completo sem gerar o bootstrap de `User Rules`
- o agente editar a cópia instalada em vez da fonte canônica e não sincronizar as outras IAs
- o agente precisar editar o app para "testar"
- o smoke test responder de forma genérica e sem foco no domínio correto

## Saída Esperada do Agente

Ao final, o agente deve responder com:

1. quais caminhos foram instalados na sandbox
1. resultado da verificação estrutural em sandbox
1. resultado do `status` para mostrar se o runtime está `current`
1. resultado resumido dos smoke tests
1. se o escopo incluir Cursor global, o caminho do bootstrap `CURSOR_USER_RULES.md`
1. confirmação explícita de que o código da aplicação não foi alterado
1. se a instalação real global foi ou não executada
1. `Skills Used` com as skills realmente aplicadas na tarefa, se a política tiver sido instalada

## Observação

Se o repositório já tiver `.claude/` ou `.cursor/`, preserve o que existir e limite as mudanças aos arquivos gerados da biblioteca `saas-skills`.
