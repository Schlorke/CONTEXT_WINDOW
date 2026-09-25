# Relatório — rodada 3 (correção após a reprovação independente)

Data: 2026-09-25. Os relatórios anteriores ([REPORT.md](REPORT.md), [RUBRIC.md](RUBRIC.md),
[TRACEABILITY.md](TRACEABILITY.md), [contract.json](contract.json)) ficam como histórico. O
complemento de rastreabilidade está em [TRACEABILITY-R3.md](TRACEABILITY-R3.md) e o estado
legível por máquina em [contract-r3.json](contract-r3.json).

**Decisão: a entrega integral pode ser aprovada? NÃO.** Os defeitos locais reproduzidos pelo
auditor foram corrigidos e provados. Continuam abertos:

- o Cursor no escopo de projeto;
- a execução nativa;
- a revogação da credencial;
- a recuperação do incidente do workspace ancestral;
- os perfis reais;
- as avaliações com modelo;
- a revisão humana dos importados;
- a publicação.

Esses itens dependem de ambiente ou de autorização.

## Respostas às nove perguntas

1. **A instalação limpa foi corrigida na origem?** Sim. O template fixa `pnpm@12.5.1`, decide o
   build do esbuild em `allowBuilds` (negado, com justificativa), usa `nodeLinker: hoisted` no
   `pnpm-workspace.yaml` e traz o lockfile. Um produto gerado de um pacote novo em `C:\Temp`
   instala com `--frozen-lockfile` sem reescrever nenhum manifesto (A6). O `strictDepBuilds`
   continua ligado, e nem `dangerouslyAllowAllBuilds` nem aviso no lugar do erro foram usados.
2. **A contraprova de token falha corretamente?** Sim. `#C0FFEE` em `Button.web.tsx`,
   `Button.native.tsx` e `apps/clients/web/src/app/page.tsx` dá saída 1 com `color-literal` em
   cada arquivo (A9a). O gate também reprova valores diferentes, ocorrência única, variantes web
   e nativa, redefinição local, constante local, cor nomeada, classe arbitrária, CSS e exceção sem
   motivo (18 testes).
3. **Os tokens corretos passam e propagam?** Sim. Os usos corretos passam no gate. Uma troca de
   `brand600` por uma cor sentinela aparece em três níveis, provados separadamente:
   - estilo resolvido pelos `Button` web e nativo;
   - `background-color` no HTML pré-renderizado do Next;
   - bundles Hermes do Expo para Android e iOS (A8).

   Um componente nativo que ignora o token faz a prova falhar (A9c). A execução nativa não está
   coberta.
4. **A migração foi refeita?** Sim. A partir do template do pacote final: instalação congelada,
   `pnpm verify` completo, o mesmo arquivo de casos (hash igual), os mesmos títulos de teste, o
   mesmo número de asserções e os 7 casos do legado passando nos dois lados (A10–A12). Android e
   iOS chegaram até o export (bundle JavaScript), sem build nativo nem execução.
5. **Que etapa foi comprovada em cada cliente?** Ver a matriz abaixo. Claude Code e Codex
   chegaram até o carregamento, no produto gerado do pacote final e sem chamada de modelo. O
   Cursor está NÃO VERIFICADO, com o kit pronto. A aplicação pelo modelo não foi verificada em
   nenhum cliente.
6. **O que falta nos importados?** Os 83 itens têm evidência por item. A situação é:
   - 74 estão "não verificado": falta evidência de licença, as lacunas do gate (77 sem
     `Operational Contract`, 6 com YAML inválido, 2 com referência quebrada, 83 sem casos de
     acionamento), as ferramentas externas (DaVinci, Blender, Spline, Rive, Remotion, ffmpeg) e a
     leitura humana;
   - 9 estão "bloqueado": 7 Remotion com licença desconhecida, e `prisma-client-api` e
     `react-best-practices`, que declaram MIT sem aviso de copyright nem origem;
   - nenhum foi promovido.

   A alegação "owner-authored (internal)" era uma presunção da rodada 1 e foi retirada do
   registry.
7. **O incidente de autenticação foi contido e a recorrência bloqueada?**
   - A cópia local foi removida (rodada 2, com autorização).
   - A recorrência está bloqueada por testes: varredura estrita, `build`, `scaffold` e gate do
     catálogo.
   - A revogação remota **não** está confirmada e depende do dono.
   - Ainda há resíduos não sensíveis do perfil copiado em `dist/.../codex-home`: identificador
     de instalação, caches e cópias de plugins. A remoção deles depende de autorização.
8. **Quais ações dependem de autorização?** Os nove pedidos agrupados abaixo.
9. **A entrega integral pode ser aprovada?** **NÃO.**

## Política de execução do guard (após a caracterização)

Decisão no código, com testes em `pnpm guard — execution policy [CX-15]`:

- Scripts + sem confinamento + sem `authorizeUnconfined` → **bloqueio antes do spawn**, sem efeitos.
- Aviso `not write-confined` **não** basta para prosseguir.
- `--authorize-unconfined <json>` (aceitação) ou `authorizeUnconfined` (API) permite a operação
  delimitada como `authorized-unconfined`; **não** aprova o requisito de confinamento.
- Sem autorização, a aceitação usa installs com `--ignore-scripts` e marca A7–A9, A10b, A11b, A12
  (execução) como PENDING. Pedido: [evidence/r3/EV-R3-auth-request-unconfined-scripts.md](evidence/r3/EV-R3-auth-request-unconfined-scripts.md).
- Executor confinado: indisponível; suíte correspondente em skip (sem fallback ao host).
- `changedOutside=[]` ≠ “nenhuma escrita externa” (CX-14).

| Item | Valor |
| --- | --- |
| Base do auditor | HEAD `66194b0`, 84 entradas na árvore de trabalho, 21 ativos, 83 importados |
| HEAD atual | `66194b0aafd9c1d6a6d77415e41545177bb773ea` (sem commit nesta rodada) |
| Árvore de trabalho | hashes de cada arquivo publicável em [evidence/r3/MANIFEST-R3.json](evidence/r3/MANIFEST-R3.json), gerado por último |
| Pacote avaliado | `.cw-build.json` com SHA-256 `c7ee1fe5574b6fa1e907ce5513231b4070e458b9829623cda9008c647070e6e0` (150 arquivos, 21 skills) |
| Lockfile do produto gerado | SHA-256 `c9b6d4f06f3b147faee288d787941a662d613f2656d7b6db5bb55e79abb59c1a` |
| Ambiente | Windows 11 (10.0.26200), Node.js 25.2.1, pnpm 12.5.1 fixado, sandbox `C:\Temp\cw-r3` |

## Separação do trabalho

**A — defeitos locais, corrigidos nesta rodada** (cadeias completas em TRACEABILITY-R3):

| ID | Defeito | Prova |
| --- | --- | --- |
| D-R3-01 | Instalação limpa do produto falhava com pnpm 12 | A4, A6; reprodução 12.5.1 × 10.27.0 |
| D-R3-02 | Implementação passava e auditoria falhava (pnpm herdado pelo Corepack) | pré-checagem preventiva + provas ancestral/escrita/instalação permitida |
| D-R3-03 | `#C0FFEE` passava no gate | gate de tokens, 18 testes, A9a |
| D-R3-04 | Credencial em `dist/` e mecanismos que a permitiram | testes de build, scaffold, catálogo e clientes; A3 |
| D-R3-05 | Rastreabilidade dos critérios reinterpretados | tabela CR-006/025/026/027/037 |
| D-R3-06 | Evidência do Cursor baseada em cópias antigas | guia reclassificado + kit |
| D-R3-07 | `verify` aprovava instalação que falhou nos adaptadores | 5 testes (2 falhavam antes) + mutante |
| D-R3-08 | Corrida no lock apagava lock vivo | 3 testes (2 falhavam antes) + mutantes + cópia limpa |
| D-R3-09 | Licença de importados registrada sem evidência | registry corrigido + 3 testes |
| D-R3-10 | CI fixava pnpm 10 | workflow corrigido (não executado) |

**B — bloqueado por ambiente:**

- Execução nativa: SDK Android presente em `%LOCALAPPDATA%\Android\Sdk`, porém `ANDROID_HOME`/
  `adb` no PATH não configurados; iOS exige macOS ou build remoto (NR-07, G07). Ver
  [PENDENCIES-POST-R3.md](PENDENCIES-POST-R3.md).
- Descoberta do Cursor no escopo de projeto: exige uma sessão nova do IDE (CR-025/026/027,
  NR-11, G03).

**C — pendente de autorização:** lista única em [PENDENCIES-POST-R3.md](PENDENCIES-POST-R3.md)
(não duplicar pedidos aqui).

**D — preparação de versão e publicação:** commit, tag `v2.0.0` e push para rodar a CI (CR-066,
CR-075).

## Gates e requisitos novos

| ID | Nome | Estado R3 | Evidência principal |
| --- | --- | --- | --- |
| G01 | Auditoria | REPROVADO | defeitos corrigidos com teste; abertos ACH-005 (revogação), ACH-013, ACH-026 |
| G02 | Catálogo | APROVADO | 104 itens; revisão por item dos 83 não ativos; alegações de licença corrigidas |
| G03 | Três clientes | APROVADO (escopo) | Claude + Codex + Cursor 3.22.8 descoberta/carregamento no projeto (A13c); aplicação por modelo NV |
| G04 | Fonte única | APROVADO | render, hashes, manifests, lock |
| G05 | Distribuição | APROVADO | 39 testes do motor, com CX-10 e CX-11; A5 |
| G06 | Arquitetura | APROVADO | template instala limpo (CX-01); gates FSD e de tokens no `verify` |
| G07 | Espelhamento | REPROVADO | três níveis de token + export; execução nativa NÃO VERIFICADA |
| G08 | Legados | APROVADO | migração refeita do pacote (A10–A12) |
| G09 | Conteúdo | APROVADO (escopo) | Operational Contract 21/21 + gate; **não** inclui CR-049 (modelo) |
| G10 | Contexto | APROVADO (escopo) | Orçamento + roteador medidos localmente; **não** inclui CR-041 (cliente real) |
| G11 | Proteção | APROVADO | contraprovas de token e FSD no produto; mutantes mortos |
| G12 | Reprodução | APROVADO | cópia limpa fora do perfil (CX-09); produto do pacote (CX-01); CI NÃO VERIFICADA |
| NR-05 | Propagação de token | APROVADO | três níveis e controle negativo |
| NR-07 | Execução nativa | NÃO VERIFICADO | ambiente / auth |
| NR-11 | Matriz dos três clientes | APROVADO | A13a/A13b + A13c (descoberta Cursor) |
| NR-15 | Matriz de testes com Criativos | REPROVADO | nenhum item criativo ativo |
| NR-16 | Validador de tokens | APROVADO | CX-03 |
| NR-17 | Instalação limpa reproduzível | APROVADO | CX-01, CX-02 |
| NR-18 | Aceitação sobre pacote e produto | APROVADO | CX-13 |
| NR-19 | Sem dados privados em cópia, snapshot, pacote e testes | APROVADO | CX-05 |
| NR-20 | Revisão item a item dos importados | REPROVADO | evidência mecânica 83/83; leitura humana não feita |

Os demais requisitos (NR-01 a NR-04, NR-06, NR-08 a NR-10, NR-12 a NR-14) seguem APROVADOS, com a
evidência de [contract.json](contract.json) reforçada pela aceitação desta rodada.

## Nota atualizada (separada do histórico)

A nota da rodada 1 (8,69; limite 9,28) fica como registro. A contagem R3 usa a mesma rubrica, e
nenhum critério crítico compensa outro:

- Nota comprovada **8,73** (após A13c; era 8,56), limite superior **9,41**, cobertura 75/81
  (ponderada 93,2%).
- A13c (Cursor 3.22.8, kit): descoberta + marcador 2.0 → CR-025/CR-026 e NR-11/G03 (escopo
  descoberta) APROVADOS. **Não** fecha CR-027, CR-041, CR-049.
- Críticos não aprovados: nenhum.
- REPROVADOS: CR-047, CR-055, CR-069, CR-073 e CR-075.
- NÃO VERIFICADOS: CR-021, CR-027, CR-038, CR-041, CR-049 e CR-066.

## Matriz dos três clientes

| Etapa | Claude Code | Codex | Cursor |
| --- | --- | --- | --- |
| Superfície | CLI | CLI da extensão ChatGPT do editor | IDE |
| Versão | 2.1.74 | codex-cli 0.147.0-alpha.1.2 | **3.22.8** (A13c) |
| Executável | `C:\Users\harry\.local\bin\claude.exe` | `...\.cursor\extensions\openai.chatgpt-26.5730.61309-win32-x64\bin\windows-x86_64\codex.exe` | não aplicável (IDE) |
| Perfil | `CLAUDE_CONFIG_DIR` isolado, sem credencial | `CODEX_HOME` isolado, sem `auth.json` | nenhum usado como prova |
| Diretório-fonte | `<produto>\.claude\skills` | `<produto>\.agents\skills` | `<kit>\produto\.agents\skills` |
| Identidade | 21 skills do pacote `c7ee1fe5…` (hash por arquivo no manifest) | 20 automáticas do mesmo pacote; a explícita fica fora | sonda `cw-probe-1d78593e` + linha-marcador 2.0 |
| Descoberta | `Loaded 21 unique skills … project: 21` | 20 skills na raiz `.agents/skills` do produto | **APROVADO** (A13c: sonda + marcador 2.0 no kit) |
| Carregamento | lista enviada ao modelo, com custo 0 e sem chamada de API | prompt renderizado localmente com a lista e os blocos do `AGENTS.md` | **APROVADO** (conteúdo do projeto citado; Cursor 3.22.8) |
| Aplicação | NÃO VERIFICADO (exige modelo) | NÃO VERIFICADO (exige modelo) | NÃO VERIFICADO (fora do A13c) |
| Resultado | descoberta e carregamento comprovados | descoberta e carregamento comprovados | [EV-R3-cursor-session.md](evidence/r3/EV-R3-cursor-session.md) |

O Codex foi encontrado na extensão ChatGPT do editor, fora do `PATH`. Essa localização agora é
procurada pelos testes e pela aceitação (`CW_CODEX_BIN`, `PATH`, extensões de `~/.cursor` e
`~/.vscode`). As skills 1.x do perfil do usuário não foram usadas como prova da 2.0. Nenhuma skill
foi copiada para diretórios de cliente além dos destinos escolhidos.

## Por que a implementação passou e a auditoria falhou

As sandboxes da rodada 1 ficavam em `C:\Users\harry\AuditoriasExternas\...`, abaixo do
`package.json` do `gb-locacoes` (`packageManager: pnpm@10.27.0`). O Corepack escolhe o
`packageManager` do ancestral mais próximo, então a instalação rodou com pnpm 10.27.0, que não
exige decisão de build. A auditoria em `C:\Temp` usou o pnpm padrão (12.5.1), que exige.

**Correção de registro:** o relatório da rodada 1 atribuiu essas execuções ao pnpm 12.5.1. Na
verdade elas usaram o 10.27.0 herdado.

A pré-checagem nova bloqueia pasta dentro do perfil, workspace herdado e `packageManager` herdado
**antes do spawn**. O redirecionamento de TEMP/XDG/store é proteção preventiva de destinos padrão,
não sandbox de segurança: um postinstall sintético escreveu fora do diretório declarado enquanto o
watch pós-fato permaneceu vazio ([EV-R3-guard-proof.json](evidence/r3/EV-R3-guard-proof.json),
[EV-R3-guard-characterization.md](evidence/r3/EV-R3-guard-characterization.md)).

A sonda do Node com `--permission` (falha de rede em `registry.npmjs.org`) é **resultado daquela
configuração**, não incompatibilidade geral nem prova do mecanismo substituto. Canário intacto após
falha de rede **não** encerra os critérios de workspace ancestral nem de bloqueio de escrita.

## Outras correções de registro

- [RUBRIC.md](RUBRIC.md) (CR-055) diz "licença declarada pelo dono como interna em 76". Essa
  licença foi presumida na rodada 1, não declarada pelo dono. O registry foi corrigido nesta
  rodada.
- [EV-017-contratos-externos.md](evidence/EV-017-contratos-externos.md) foi reformatado por
  terceiro às 01:32:41 (tabelas e autolinks), sem mudança de conteúdo técnico. Foi preservado
  como está.
- O guia de runtime deixou de apresentar a observação de cópias 1.x como prova da distribuição 2.0.

## Incidente do workspace ancestral (recuperação pendente)

Estado lido agora, sem alterar nada:

- `C:\Users\harry\node_modules\.modules.yaml` indica `packageManager: pnpm@10.27.0`,
  `nodeLinker: isolated` e `storeDir` no store temporário
  `C:\Users\harry\AuditoriasExternas\context-window-20260924\sandbox\template-e2e\.pnpm-store\v10`,
  que existe e **não foi apagado**.
- O store padrão `%LOCALAPPDATA%\pnpm\store\v10` também existe.

Procedimento proposto (não executado; pedido 3):

1. Fechar os processos que usam o projeto `gb-locacoes` (editor, servidor, testes).
2. Em `C:\Users\harry`, renomear `node_modules` para `node_modules.cw-incident-20260925`. Não
   apagar ainda, porque ele permite reverter enquanto o store temporário existir.
3. Em `C:\Users\harry`, sem variáveis de sandbox, rodar `pnpm install --frozen-lockfile` com o
   pnpm do próprio projeto (10.27.0 via Corepack) e o store padrão.
4. Validar:
   - `storeDir` do novo `.modules.yaml` = `%LOCALAPPDATA%\pnpm\store\v10`;
   - `git status` do projeto sem mudanças inesperadas;
   - as verificações usuais do projeto.
5. Só depois apagar `node_modules.cw-incident-20260925` e o store temporário.

## Pedidos de autorização (agrupados)

**Lista canônica pós-revalidação:** [PENDENCIES-POST-R3.md](PENDENCIES-POST-R3.md).
A tabela abaixo é o histórico da rodada; não duplicar decisões novas aqui.

| # | Ação | Destino | Efeito | Risco | Consumo | Reversão |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Revogar e rotacionar a sessão do Codex copiada (ação do dono): `codex logout` e `codex login` no perfil real; se restar dúvida, suporte da OpenAI | `%USERPROFILE%\.codex` | invalida o refresh token da sessão atual e cria outra. A cópia tinha refresh token diferente do canônico, então o logout pode não revogar a sessão copiada | reautenticar o Codex nesta máquina | nenhum | `codex login` |
| 2 | Remover o resto de `dist/global-runtime-validation-20260413/codex-home/` (1.551 arquivos: `installation_id`, `cap_sid`, caches, cópias de plugins e skills; nenhuma credencial) | pasta ignorada pelo git no repositório | tira resíduos de um perfil do Codex da árvore local | baixo; nada disso é distribuído | nenhum | nenhuma, porque não se cria cópia de dado privado; alternativa: manter |
| 3 | Recuperar o `gb-locacoes` (procedimento acima) e depois apagar o store temporário | `C:\Users\harry\node_modules` e o store temporário | reinstala com o pnpm e o store do próprio projeto | executa os scripts do projeto (husky, `prisma generate`, builds permitidos) e baixa pacotes do registry | rede e disco | renomear de volta enquanto o store temporário existir |
| 4 | Atualizar os perfis reais: `cw install --user --profile dev --migrate-legacy --adopt-all` e colar o texto de `cw contract --format cursor-user-rules --with-usage-policy` nas User Rules do Cursor | `~/.claude/skills`, `~/.agents/skills`, `~/.codex/skills`, `~/.cursor/rules`, `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` | plano visto em modo leitura, saída 0 e sem conflitos: 21 substituições em `~/.claude/skills`, 21 adoções com backup em `~/.agents/skills`, remoção com backup do 1.x em `~/.codex/skills` e `~/.cursor/rules`, e 2 blocos | muda o comportamento dos agentes em todos os projetos | nenhum | backups em `~/.context-window/backups` + `cw uninstall --user` |
| 5 | Sessão nova do Cursor no kit de verificação | Cursor (janela nova) | fecha ou refuta CR-025/026/027, NR-11 e G03 | o Cursor grava o estado da janela no próprio perfil | cota do Cursor (2 prompts) | fechar a janela; apagar `C:\Temp\cw-r3\cursor-kit` |
| 6 | Avaliações comportamentais ([EVAL-PLAN-R3.md](EVAL-PLAN-R3.md)), começando pelo piloto | perfis isolados dos três clientes | mede CR-041, CR-049 e CR-069 | login do dono nos perfis isolados | piloto de 12 execuções (0,2–0,3 M tokens); total previsto de 1.284 execuções (20–36 M tokens de entrada) | parar a qualquer momento; nada é gravado nos projetos |
| 7 | Apagar `saas-skills/integrations/cursor-rule-profiles.json` (tem edição local do dono) | repositório | fecha CR-073 | perder a edição local, se ela tiver valor | nenhum | o arquivo está versionado: `git checkout` recupera a versão do HEAD, mas não a edição local |
| 8 | Commit, tag `v2.0.0` e push | repositório remoto | fecha CR-075 e executa a CI (CR-066) | publicação | CI | revert, sem reescrever histórico |
| 9 | Configurar `ANDROID_HOME` + run no produto descartável **ou** EAS remoto (SDK já em `%LOCALAPPDATA%\Android\Sdk`; `adb`/env não no PATH) | máquina ou EAS | fecha NR-07/G07 (Android); iOS exige macOS/EAS | scripts/build nativo ou conta remota | disco/cota | unset env / cancelar EAS |
| 10 | ~~Harness acoplado~~ → **substituído** | — | Pedido 10 delimitado já executado (D1–D6; D7 negado). Novas execuções scriptadas exigem **nova** autorização; não reutilizar o JSON do Pedido 10 automaticamente | — | — | — |

Pedido detalhado do item 10: [evidence/r3/EV-R3-auth-request-unconfined-scripts.md](evidence/r3/EV-R3-auth-request-unconfined-scripts.md).
Requisito ambiental do executor confinado: `CONFINED_EXECUTOR.requirement` em `scripts/lib/pnpm-guard.mjs`.

## Comandos executados nesta rodada

```text
node scripts/cw.mjs catalog --write-lock
pnpm qa                                    (CW_SANDBOX_ROOT=C:\Temp\cw-r3\guard-tests)
node --test test/*.test.mjs                (subconjuntos durante as correções)
node scripts/acceptance.mjs --sandbox C:\Temp\cw-r3\acceptance
node scripts/review-imported.mjs --out acceptance/evidence/r3/EV-imported-review.json
node --permission --allow-fs-read=* --allow-fs-write=C:\Temp\cw-r3\preview --allow-child-process scripts/cw.mjs plan --user --profile dev [--migrate-legacy --adopt-all] --json
node --permission (idem) scripts/cw.mjs doctor --user --json
node C:\Temp\cw-r3\harness\clean-copy-qa.mjs C:\Temp\cw-r3\clean-copy-2
node C:\Temp\cw-r3\harness\mutate.mjs <repo> <arquivo> <de> <para> <teste> [padrão]
```

A reprodução pnpm 12.5.1 × 10.27.0 usou o harness `r3-repro.mjs` da pasta de trabalho externa,
com escrita só em `C:\Temp\cw-r3`. As instalações de produto, legado, migração, cópia limpa e
testes do guard passaram pela pré-checagem + redirecionamento de env em `C:\Temp\cw-r3`, dentro
dos limites documentados em `GUARD_LIMITS` (sem confinamento de escrita de subprocessos).

**Exceção:** a adição da devDependency `typescript` ao próprio repositório (instalação no checkout)
usou o store padrão do usuário, `%LOCALAPPDATA%\pnpm\store\v11`. Foi uma escrita fora do
repositório, sem mudança de configuração global.

O mtime de `C:\Users\harry\node_modules\.modules.yaml` (2026-09-25T03:47:50Z) foi observado como
canário incidental; **não** conta como prova de confinamento nem de isolamento do guard.

## Onde está a evidência

| Arquivo | Conteúdo |
| --- | --- |
| [evidence/r3/EV-R3-acceptance-report.json](evidence/r3/EV-R3-acceptance-report.json) e `.log` | aceitação final, 18 de 18 etapas obrigatórias |
| [evidence/r3/EV-R3-clean-copy-qa.json](evidence/r3/EV-R3-clean-copy-qa.json) | cópia limpa: instalação congelada + `pnpm qa` 145/145 |
| [evidence/r3/EV-R3-repro-ignored-builds.json](evidence/r3/EV-R3-repro-ignored-builds.json) | reprodução do defeito de instalação |
| [evidence/r3/EV-R3-mutations.json](evidence/r3/EV-R3-mutations.json) | mutantes e vereditos |
| [evidence/r3/EV-imported-review.json](evidence/r3/EV-imported-review.json) | revisão por item dos 83 importados |
| [evidence/r3/EV-R3-real-profile-preview.json](evidence/r3/EV-R3-real-profile-preview.json) | prévia dos perfis reais (caminhos e contagens) |
| [evidence/r3/EV-R3-cred-investigation.json](evidence/r3/EV-R3-cred-investigation.json) | investigação da credencial (forma e booleanos, sem valores) |
| [evidence/r3/EV-R3-cursor-kit.json](evidence/r3/EV-R3-cursor-kit.json) | identidade do kit do Cursor |
| [evidence/r3/EV-R3-guard-proof.json](evidence/r3/EV-R3-guard-proof.json) | ancestral bloqueado; escape de escrita; instalação permitida |
| [evidence/r3/EV-R3-guard-characterization.md](evidence/r3/EV-R3-guard-characterization.md) | mecanismo concreto, limites e política de execução |
| [evidence/r3/EV-R3-pedido-10-authorization.md](evidence/r3/EV-R3-pedido-10-authorization.md) | registro da autorização delimitada D1–D6 (D7 negado) |
| [evidence/r3/EV-R3-acceptance-pedido-10.json](evidence/r3/EV-R3-acceptance-pedido-10.json) | resultados reais A7–A9, A10b, A11b, A12 após separação |
| [PENDENCIES-POST-R3.md](PENDENCIES-POST-R3.md) | lista única de pendências e decisões do dono |
| [evidence/r3/EV-R3-dist-codex-home-residues.md](evidence/r3/EV-R3-dist-codex-home-residues.md) | classificação dos resíduos dist (auth.json ausente) |
| [evidence/r3/EV-R3-cursor-session.md](evidence/r3/EV-R3-cursor-session.md) | modelo de evidência A13c |
| [evidence/r3/EV-R3-imported-progress.md](evidence/r3/EV-R3-imported-progress.md) | progresso NR-20 (mecânico + amostra okgas) |

A política CX-15 e os testes em `test/pnpm-guard.test.mjs` / `test/acceptance-auth.test.mjs`
fazem parte do estado entregue. Confinamento continua não aprovado. Nota R3 **8,56** (histórica
R1 **8,69**). Entrega integral: **NÃO**.
