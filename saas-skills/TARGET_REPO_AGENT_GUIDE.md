# TARGET REPO AGENT GUIDE

Arquivo copiável para um repositório de destino.  
Se quiser, você pode copiar este conteúdo como `AGENTS.md` na raiz do projeto.

Use este documento quando quiser que um agente instale `saas-skills` corretamente no projeto, valide a instalação e faça smoke tests sem tocar no código da aplicação.

Se a intenção for instalar também os runtimes globais do usuário, use os homes isolados primeiro e só depois faça a instalação real.

Se o objetivo for atualizar uma skill já instalada, trate a biblioteca canônica como fonte de verdade e sincronize os runtimes. Não corrija a cópia instalada diretamente.

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
   - Cursor runtime: `.cursor/rules/*.mdc` ou `~/.cursor/rules/*.mdc`

4. **Não trate `.cursor/skills/` como runtime oficial do Cursor.**
   O runtime oficial do Cursor é `.cursor/rules/`.

5. **Comece sempre com uma simulação.**
   Primeiro execute o fluxo em modo de prévia para mostrar o que será instalado.

6. **Valide a Codex em sandbox antes da instalação real.**
   Use homes isolados para provar que o fluxo funciona sem tocar nas instalações reais do usuário.

7. **Trate o runtime instalado como artefato gerado.**
   Se o usuário pedir update, edite `saas-skills/` e rode sync. Não aplique hotfix diretamente em `.claude/skills/`, `.cursor/rules/` ou `$CODEX_HOME/skills/`.

## Fluxo Obrigatório

### Escopos suportados

Escolha o escopo certo antes de instalar:

- somente Codex: `node scripts/install-agent-runtimes.mjs . --codex-only`
- somente Claude do projeto: `node scripts/install-agent-runtimes.mjs . --claude-only`
- somente Cursor do projeto: `node scripts/install-agent-runtimes.mjs . --cursor-only`
- projeto completo: `node scripts/install-agent-runtimes.mjs . --project-only`
- projeto + globais: `node scripts/install-agent-runtimes.mjs . --global-all`

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
- alguma instalação global do Cursor estiver ausente
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
```

## Critério de Aprovação

Considere a instalação funcional quando:

- Codex runtime existir em `$CODEX_HOME/skills/`
- Claude runtime existir em `.claude/skills/` e `~/.claude/skills/`
- Cursor runtime existir em `.cursor/rules/` e `~/.cursor/rules/`
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
- o agente editar a cópia instalada em vez da fonte canônica e não sincronizar as outras IAs
- o agente precisar editar o app para "testar"
- o smoke test responder de forma genérica e sem foco no domínio correto

## Saída Esperada do Agente

Ao final, o agente deve responder com:

1. quais caminhos foram instalados na sandbox
1. resultado da verificação estrutural em sandbox
1. resultado do `status` para mostrar se o runtime está `current`
1. resultado resumido dos smoke tests
1. confirmação explícita de que o código da aplicação não foi alterado
1. se a instalação real global foi ou não executada

## Observação

Se o repositório já tiver `.claude/` ou `.cursor/`, preserve o que existir e limite as mudanças aos arquivos gerados da biblioteca `saas-skills`.
