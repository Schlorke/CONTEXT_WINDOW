# ADR 0002 - Motor de distribuição 2.0 e contrato de produto web + mobile

## Status

Aceito - 2026-09-24.

## Contexto

A auditoria independente de 2026-09-24 reprovou a versão 1.17 (nota 3,7): instalação que
sobrescrevia conteúdo alheio, drift invisível com a mesma versão, nome de skill usado como caminho
sem validação, destinos desatualizados (Codex em `$CODEX_HOME/skills`, regras `.mdc` completas
anexadas por globs no Cursor), duplicatas entre escopos não detectadas, falha com caminhos
acentuados, ausência de testes automatizados e de CI. Ao mesmo tempo, o dono definiu como
obrigatória uma topologia de produto com clientes web e mobile finos sobre pacotes compartilhados.

## Decisões

1. **Um motor, plano antes de aplicar.** `scripts/cw.mjs` substitui os scripts 1.x. Toda mudança é
   planejada sem escrita; conflitos param com código 2. A aplicação usa lock, journal, staging,
   rollback e backups fora das pastas que os clientes varrem. Manifest v2 com hash por arquivo.
2. **Destinos pelos contratos atuais dos clientes.** Claude em `.claude/skills` e
   `$CLAUDE_CONFIG_DIR/skills`; Codex em `.agents/skills` e `~/.agents/skills`; Cursor lê essas
   mesmas pastas, então não recebe cópia própria nem regras `.mdc` geradas.
3. **Catálogo como fonte de status.** `catalog/registry.json` guarda origem, status, perfis,
   invocação e gatilhos; material importado fica inventariado e não é distribuído até revisão.
4. **Contrato sempre ativo e curto.** O contrato de arquitetura é um bloco gerenciado de ≈ 730
   tokens no `AGENTS.md` (Claude importa com `@AGENTS.md`); as skills entram sob demanda.
5. **Topologia de produto.** `apps/clients/web` (Next.js) e `apps/clients/mobile` (Expo) finos;
   `packages/frontend` em FSD estrito; `packages/ui` com contrato e variantes `.web`/`.native`;
   `packages/design-tokens`. O nome `packages/<produto>-dom` da 1.x dá lugar a `packages/frontend`
   para não sugerir que a interface mobile é DOM; componentes DOM do Expo ficam como exceção
   documentada.
6. **Backend sem FSD.** Monólito modular por padrão; portas e adaptadores quando o domínio e as
   integrações justificarem.
7. **Provas executáveis.** Gate de arquitetura com violações injetadas, template construído com
   Next.js e exportado com Expo, propagação de token, migração legada com casos de caracterização,
   descoberta real nos CLIs do Codex e do Claude Code sem chamada de modelo.

## Consequências

- Instalações 1.x precisam de `--migrate-legacy` (ou `--keep-legacy`) na primeira instalação 2.0.
- Os aliases `pnpm install:*`, `verify:*`, `sync:*`, `export:*` deixam de existir.
- A descoberta de skills de projeto pelo Cursor e as User Rules continuam sem prova automatizada;
  estão registradas como não verificadas em `IDE_RUNTIME_GUIDE.md`.
