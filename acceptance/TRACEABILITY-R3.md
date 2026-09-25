# Rastreabilidade — rodada 3 (correção após a reprovação independente)

Complementa [TRACEABILITY.md](TRACEABILITY.md), que fica como histórico. Os IDs antigos (ACH, CR,
G, NR) não foram renumerados. Os IDs novos são D-R3-xx para os defeitos desta rodada, CX-xx para as
contraprovas e evidências e NR-16 a NR-20 para os requisitos novos.

## Defeitos: reprodução → causa → mudança → teste que falhava → teste que passa → contraprova

### D-R3-01 — instalação limpa do produto falha (`ERR_PNPM_IGNORED_BUILDS esbuild@0.28.2`)

- Reprodução: um pacote antigo (`C:\Temp\cw-r3\bundle-before`), a mesma árvore e duas versões do
  pnpm. Com 12.5.1 a saída é 1 e o `ERR_PNPM_IGNORED_BUILDS` aparece. Com 10.27.0 a saída é 0. O
  esbuild é o mesmo (0.28.2) nos dois lockfiles gerados
  ([EV-R3-repro-ignored-builds.json](evidence/r3/EV-R3-repro-ignored-builds.json)).
- Causa:
  - o template não fixava `packageManager` nem decidia os builds de dependência (`allowBuilds`);
  - o `node-linker=hoisted` estava num `.npmrc`, que o pnpm 11+ ignora;
  - não havia lockfile, então cada instalação resolvia versões novas.
- Mudança:
  - `packageManager: pnpm@12.5.1` e `engines.node >=22.13`;
  - `pnpm-workspace.yaml` com `nodeLinker: hoisted`, `strictDepBuilds: true`,
    `allowBuilds: { esbuild: false }` justificado, `verifyDepsBeforeRun: error` e
    `minimumReleaseAgeExclude` só com versões exatas, justificativa e data de revisão;
  - `pnpm-lock.yaml` versionado no template;
  - `.npmrc` removido.
- Teste que falhava: o mesmo procedimento da reprodução com o template antigo (saída 1).
- Teste que passa: aceitação A6, instalação `--frozen-lockfile` a partir do pacote final. Saída 0,
  manifestos inalterados, `nodeLinker: hoisted`, store dentro da sandbox e nada alterado fora dela.
- Contraprova: os testes do guard bloqueiam o valor provisório que o pnpm escreve
  (`set this to true or false`), `dangerouslyAllowAllBuilds` e `strictDepBuilds: false`
  (`test/pnpm-guard.test.mjs`, teste 4). Nenhuma dessas saídas foi usada.

### D-R3-02 — o ambiente de implementação passou e o da auditoria falhou

- Reprodução: variando só a versão fixada, como em D-R3-01.
- Causa:
  - as sandboxes da rodada 1 ficavam sob `C:\Users\harry`, abaixo do `package.json` do
    `gb-locacoes`, que fixa `pnpm@10.27.0`;
  - o Corepack usa o `packageManager` do ancestral mais próximo, então a rodada 1 rodou com pnpm
    10.27.0, e não com o 12.5.1 declarado no relatório (correção registrada em REPORT-R3);
  - a auditoria em `C:\Temp` usou o padrão do Corepack (12.5.1).
- Mudança: `scripts/lib/pnpm-guard.mjs` faz uma **pré-checagem preventiva** que emula as buscas do
  pnpm (raiz do workspace) e do Corepack (`packageManager`), redireciona TEMP/XDG/store/cache para
  pastas sob o diretório declarado e, depois da execução, compara mtime de uma lista fixa. Isso **não**
  é sandbox de segurança: subprocessos não têm fronteira de escrita (CX-14 /
  [EV-R3-guard-proof.json](evidence/r3/EV-R3-guard-proof.json)).
  Blockers antes de qualquer processo:
  - pasta dentro do perfil do usuário;
  - workspace ou `packageManager` herdado;
  - versão não exata;
  - store, cache ou estado fora do diretório declarado (quando configurados no yaml);
  - pnpmfile;
  - builds não decididos.
- Teste que falhava: o mutante sem a regra de raiz de workspace (KILLED,
  [EV-R3-mutations.json](evidence/r3/EV-R3-mutations.json)).
- Teste que passa: `test/pnpm-guard.test.mjs`. O caso do workspace ancestral termina com a árvore
  idêntica byte a byte e `spawned=false`.
- Contraprova de escrita: lifecycle script sintético escreve fora do diretório declarado;
  `GUARD_LIMITS.writeConfinement=false` e o watch pós-fato fica vazio (CX-14). Canário do perfil
  real **não** é usado como prova desses critérios.

### D-R3-03 — `#C0FFEE` em `Button.web.tsx`, `Button.native.tsx` e `apps/clients/web` passava no gate

- Reprodução: a contraprova do auditor nos três arquivos.
- Causa: o gate de arquitetura verificava importações, não valores.
- Mudança: `scripts/token-check.mjs` (skill `multiplatform-platform-architecture`, copiado pelo
  scaffold para `tools/`) faz análise por AST do TypeScript e das declarações CSS. `pnpm tokens`
  entra no `pnpm verify`.
- Teste que falhava: as contraprovas de `test/token-gate.test.mjs` (o gate antigo não tinha
  checagem de valores).
- Teste que passa: `test/token-gate.test.mjs` (18 testes). Os usos corretos passam: comentários,
  literais de tipo, constantes neutras, âncoras e edição na fonte dos tokens.
- Contraprova no produto gerado: aceitação A9a. `#C0FFEE` nos três arquivos dá saída 1 com
  `color-literal` em cada um, e o estado restaurado dá saída 0.

### D-R3-04 — credencial do Codex em `dist/.../codex-home/auth.json` e prevenção de recorrência

- Três estados separados:
  - remoção local: feita na rodada 2, com autorização e sem seguir links. `pnpm secrets` mostra 0
    arquivos publicáveis e 0 cópias locais;
  - revogação e rotação: pendente, é ação do dono. Apagar a cópia não revoga a credencial;
  - prevenção de recorrência: feita. `build` recusa nomes privados e conteúdo de credencial,
    `scaffold` recusa arquivos privados no template, o gate do catálogo recusa arquivo privado em
    skill e a varredura reprova cópias locais.
- Testes:
  - `test/catalog-build.test.mjs`: `build never bundles git-ignored credential files…`,
    `build refuses private file names…` e `rejects private file in a skill package`;
  - `test/arch-gate.test.mjs`: `scaffold private files [ACH-005]`;
  - `test/clients.test.mjs`: perfis isolados nunca ganham cache de credencial.
- Contraprova: aceitação A3, 0 arquivos privados e varredura limpa no pacote final.

### D-R3-05 — rastreabilidade dos critérios reinterpretados

Ver a seção abaixo. CR-025, CR-026 e CR-027 deixam de contar como aprovados até existir a prova de
projeto no Cursor.

### D-R3-06 — evidência do Cursor baseada em cópias antigas do perfil do usuário

- Causa: a linha do Cursor no guia usava a observação de skills 1.x do perfil do usuário.
- Mudança: o guia foi reclassificado; foi preparado um kit com skill-sonda de nome único e uma
  linha-marcador que só existe no pacote 2.0 ([CURSOR-VERIFICATION.md](CURSOR-VERIFICATION.md)).
- Estado: NÃO VERIFICADO até a sessão nova do Cursor.

### D-R3-07 — `verify` aprovava uma instalação que falhou na fase dos adaptadores

- Reprodução: uma falha injetada antes do hook do Claude (`CW_TEST_FAULT=throw-before:hook`),
  numa atualização ou num hook pedido pela primeira vez. O `install` sai com 1, mas o `verify`
  saía com 0, porque o registro antigo ainda descrevia a configuração anterior.
- Causa: o registro só era gravado no sucesso, e o `verify` lia a configuração do registro.
- Mudança: uma falha depois de qualquer escrita grava `incomplete` no registro, preservando o
  registro anterior e o hash do hook. `status` e `verify` mostram `INCOMPLETE`, e o `verify` falha
  até uma instalação completa.
- Teste que falhava: 2 dos 5 testes de `client adapter failures [CX-10]` falharam antes da mudança
  (`expected 1, actual 0`).
- Teste que passa: os 5 testes, com falha antes de `AGENTS.md`, antes de `CLAUDE.md`, antes do
  hook, num hook novo e antes do `$CODEX_HOME/AGENTS.md` do usuário. O texto do time é preservado,
  os blocos não ficam pela metade e uma nova instalação converge.
- Contraprova: o mutante que ignora o marcador foi KILLED.

### D-R3-08 — corrida no lock apagava o lock de outro processo vivo

- Reprodução:
  - o teste real de concorrência falhou uma vez na cópia limpa (`round 4: 3,0,3,2`);
  - dois testes determinísticos reproduzem as duas janelas da corrida: o lock foi liberado e
    retomado entre a tentativa e a leitura, e um lock velho foi trocado por um vivo antes da
    remoção.
- Causa: uma leitura com `ENOENT` era tratada como lock velho e o arquivo era apagado. Esse
  arquivo já podia ser o lock de um processo novo. A remoção de lock velho também não conferia se
  o conteúdo ainda era o mesmo.
- Mudança: `ENOENT` leva a uma nova tentativa, nunca a uma remoção. Um lock velho só é removido
  sob o arquivo `lock.break` e só se o conteúdo ainda for o que foi julgado velho.
- Teste que falhava: os 2 testes determinísticos de `lock races [CX-11]` davam
  `Missing expected exception (BusyError)`.
- Teste que passa: os 3 testes de `lock races [CX-11]`. O teste real de concorrência passou 8
  vezes seguidas (160 instalações concorrentes) e a cópia limpa passou 145 de 145.
- Contraprova:
  - o mutante que remove a conferência de conteúdo foi KILLED;
  - o mutante que remove a nova tentativa em `ENOENT` sobrevive por ser equivalente: a
    conferência de conteúdo protege o mesmo caminho.

### D-R3-09 — licença "owner-authored (internal)" registrada sem evidência

- Causa: na rodada 1 a licença de 76 importados foi presumida, não declarada pelo dono.
  `react-best-practices` e `prisma-client-api` declaram MIT no próprio frontmatter, sem aviso de
  copyright nem origem.
- Mudança: o registry passou a registrar só o que há evidência para sustentar. A ferramenta
  `scripts/review-imported.mjs` produz a evidência por item.
- Teste: `test/review-imported.test.mjs`, 3 testes: nenhum item é promovido pela ferramenta,
  licença desconhecida ou de terceiro sem atribuição bloqueia, e não há alegação de autoria sem
  evidência.

### D-R3-10 — CI fixava pnpm 10

- Mudança: `.github/workflows/qa.yml` pega o pnpm do `packageManager` e ganhou o job de aceitação
  (`scripts/acceptance.mjs --without-clients`, sandbox em `/tmp`, fora do HOME).
- Estado: NÃO VERIFICADO, porque a CI não foi executada (sem push).

## Critérios reinterpretados: requisito → mecanismo substituto → teste

| CR | Intenção original | Mecanismo na 2.0 | Teste ou evidência | Veredito R3 |
| --- | --- | --- | --- | --- |
| CR-006 | Gerar os artefatos padrão de distribuição | pacote `cw build --out` + `contract --format cursor-user-rules` | `test/catalog-build.test.mjs` (pacote instala fora do checkout, recusa privados e credenciais); aceitação A2, A3 e A5 | APROVADO |
| CR-025 | Artefato do Cursor no formato documentado | pasta `SKILL.md` em `.agents/skills` e `.claude/skills` (nome = pasta, minúsculas e hífens) | o gate do catálogo prova o formato; o carregamento pelo Cursor no escopo de projeto não foi provado | NÃO VERIFICADO |
| CR-026 | Descoberta nativa no Cursor | skills de projeto em `.agents/skills` | kit de [CURSOR-VERIFICATION.md](CURSOR-VERIFICATION.md), pendente; a observação antiga era do perfil do usuário | NÃO VERIFICADO |
| CR-027 | O Cursor consome a superfície de usuário escrita | `~/.agents/skills` (a 2.0 não escreve `~/.cursor/rules`) | só observação de cópias 1.x; sem prova com a 2.0 | NÃO VERIFICADO |
| CR-037 | Custo sempre ativo baixo | contrato + política no `AGENTS.md`/`CLAUDE.md` (730 tokens); a lista de skills no orçamento do cliente | `always-on text and the skill listing stay within the context budget` (≤ 4.096 bytes sempre ativos, ≤ 7.200 bytes de lista) | APROVADO |

## Contraprovas e evidências novas (CX)

| ID | O que prova | Onde | Relaciona |
| --- | --- | --- | --- |
| CX-01 | Instalação limpa do produto a partir do pacote, com pnpm fixado, builds decididos e lockfile | aceitação A4 e A6 | D-R3-01, NR-17, G12, CR-003 |
| CX-02 | Pré-checagem de workspace ancestral e Corepack (bloqueio antes de efeitos) | `test/pnpm-guard.test.mjs`, [EV-R3-guard-proof.json](evidence/r3/EV-R3-guard-proof.json) ancestral, mutante KILLED | D-R3-02, NR-17 |
| CX-14 | Confinamento de escrita de subprocessos: propriedade **ausente** (caracterização com authorizeUnconfined de teste) | postinstall sintético escreve fora; `changedOutside=[]` não esconde | D-R3-02 (limite) |
| CX-15 | Política: scripts sem confinamento → bloqueio antes do spawn; auth incompleta recusada; scripts-disabled permitido; auth não aprova confinamento | `pnpm guard — execution policy [CX-15]` | política de execução |
| CX-03 | Gate de tokens: 11 contraprovas falham pela regra certa e os usos corretos passam | `test/token-gate.test.mjs`, aceitação A9a | D-R3-03, NR-16, NR-05 |
| CX-04 | Propagação de token em três níveis e controle negativo | aceitação A8 e A9c | NR-05, G07 |
| CX-05 | Prevenção de recorrência de credencial e dados privados | testes de D-R3-04, aceitação A3 | ACH-005, CR-063, NR-19 |
| CX-06 | Migração refeita a partir do pacote com a mesma caracterização | aceitação A10, A10b, A11, A11b e A12 | NR-08, G08 |
| CX-07 | Codex (20 skills do projeto) e Claude Code (21, custo 0) no produto gerado do pacote final | aceitação A13a e A13b | NR-11, G03, CR-032, CR-033 |
| CX-08 | Violação FSD no produto gerado falha o gate | aceitação A9b | NR-02, G11 |
| CX-09 | Cópia limpa: 611 arquivos, instalação congelada com guard e `pnpm qa` com 145 de 145 | [EV-R3-clean-copy-qa.json](evidence/r3/EV-R3-clean-copy-qa.json) | CR-002, G12 |
| CX-10 | Falhas nos adaptadores de cliente não geram `verify` enganoso | `client adapter failures [CX-10]` | D-R3-07, CR-015, CR-016, NR-12 |
| CX-11 | Corridas de lock não apagam lock vivo | `lock races [CX-11]` | D-R3-08, CR-017 |
| CX-12 | Revisão por item dos 83 importados e correção das alegações de licença | [EV-imported-review.json](evidence/r3/EV-imported-review.json), `test/review-imported.test.mjs` | D-R3-09, NR-20, CR-055, NR-15 |
| CX-13 | O comando de aceitação avalia o pacote e o produto, não só o checkout | `scripts/acceptance.mjs`, [EV-R3-acceptance-report.json](evidence/r3/EV-R3-acceptance-report.json) | NR-18 |

## Requisitos novos da rodada 3

| ID | Requisito | Estado | Evidência |
| --- | --- | --- | --- |
| NR-16 | Validador de tokens (TS/TSX, objetos de estilo, CSS, escopo e exceções) executado pelo comando agregado | APROVADO | CX-03 |
| NR-17 | Instalação limpa reproduzível: pnpm fixado, `allowBuilds`, lockfile congelado, sem workspace herdado; pré-checagem antes do spawn | APROVADO | CX-01, CX-02; confinamento de escrita **não** incluso (CX-14); política CX-15 bloqueia scripts sem auth |
| NR-18 | Aceitação sobre o pacote final e o produto gerado | APROVADO | CX-13 |
| NR-19 | Cópia, snapshot, empacotamento e testes sem autenticação, `.env` privado ou cache de sessão | APROVADO | CX-05 |
| NR-20 | Revisão item a item do catálogo importado, sem promoção em lote nem licença inventada | REPROVADO | CX-12 cobre 83 de 83 itens (origem, evidência de licença, dependências, recursos, ferramentas, riscos nas instruções, lacunas do gate, critérios de teste) e corrige as alegações de licença. A leitura das instruções item a item não foi feita, e nenhum item foi promovido. |
