# Pendências pós-revalidação R3 (lista única)

Data: 2026-09-25. Preserva as conclusões da revalidação independente: defeitos locais
(instalação, tokens, FSD, migração) resolvidos no escopo documentado; separação de
autorizações; D7 desabilitado nas instalações do Pedido 10; confinamento **não** aprovado;
notas históricas intactas (R1 `RUBRIC.md` 8,69; R3 `contract-r3` 8,56).

**Release 2.0:** **ENCERRADA** — estável em `v2.0.3` (`0f3dcb618bd4bc097f57ac4cb4bc7756357c6952`);
P-EVAL-1 15/15; CI 5/5. Pendências abertas abaixo = **2.1+** (não executar sem auth futura).

**Nota histórica de preparação:** trechos abaixo podem citar HEAD `66194b0…` / working tree
pré-publicação; não substituem o estado final acima.

## QA vs Pedido 10

| Execução | O que inclui | Relação com o estado |
| --- | --- | --- |
| Pedido 10 aceite (`--skip-qa`) | A2–A13b (sem A1); D1–D6 scriptados | [EV-R3-acceptance-pedido-10.json](evidence/r3/EV-R3-acceptance-pedido-10.json) — **não** inclui A1/`pnpm qa` |
| QA da biblioteca | `pnpm qa` (catálogo, testes, lint, secrets, prettier) | Deve ser reexecutado no estado final após mudanças desta etapa; cópia limpa anterior: [EV-R3-clean-copy-qa.json](evidence/r3/EV-R3-clean-copy-qa.json) (145/145 naquele momento) |

## Esclarecimentos do placar (sem alterar requisitos)

### A — Por que G09 e G10 estão APROVADOS se eficácia/seleção com modelo estão NV?

| Gate | Condição contratual | O que a aprovação cobre | O que permanece NV (CR separado) |
| --- | --- | --- | --- |
| **G09 Conteúdo** | “Habilidades operacionais com critérios e provas, não apenas instruções genéricas.” | Operational Contract 21/21, gate do catálogo, comandos/skills testáveis estruturalmente ([contract.json](contract.json) G09) | **CR-049** eficácia comportamental com modelo |
| **G10 Contexto** | “Seleção e consumo medidos, sem regressão de correção para economizar tokens.” | Orçamento medido (sempre ativo / lista / tarefa), roteador sem FP em neutros | **CR-041** precisão/recall de seleção em cliente real com modelo |

Escopo legítimo: G09/G10 = propriedades estruturais e de medição local. Não substituem CR-041/CR-049.
**Não** se rebaixa G09/G10 sem prova de que a condição do gate foi violada; a pendência de modelo fica nos CR.

### B — Executor confinado: obrigatório ou opcional?

| Pergunta | Resposta |
| --- | --- |
| O contrato exige confinamento de escrita de subprocessos pnpm para aprovar a biblioteca? | **Não.** [NR-17](TRACEABILITY-R3.md) aprova instalação limpa **sem** incluir confinamento (CX-14). |
| Quando o executor confinado é necessário? | Só para **alegar** confinamento de escrita ou para correr a suíte que exige essa propriedade (`CONFINED_EXECUTOR`). |
| Por que aparecia como impedimento da entrega? | Confusão entre (a) limite honesto do guard e (b) requisitos de aprovação do produto. |
| Posição corrigida | **Opcional** para a entrega da biblioteca. Continua **bloqueador** apenas da **alegação** de sandbox de escrita e de testes que dependem dela. Ausência **não** impede, por si, a aprovação integral dos CR/G do produto — esses bloqueios são G01/G03/G07, CR-047/055/069/073/075, etc. |

### NR-20 (texto exato)

> **Revisão item a item do catálogo importado, sem promoção em lote nem licença inventada.**

Estado: **REPROVADO**. CX-12 cobre revisão **mecânica** 83/83 (origem, evidência de licença, deps, recursos, tools, riscos, lacunas de gate, critérios). **Não** cobre leitura humana das instruções nem promoção. “revisado”/“ativo” nunca são derivados automaticamente ([EV-imported-review.json](evidence/r3/EV-imported-review.json) `rules`).

---

## Tabela única de pendências

| ID | Pendência | Critério | Ação técnica (agente) | Participação do proprietário | Prova de conclusão |
| --- | --- | --- | --- | --- | --- |
| P-SEC-1 | Revogação remota da sessão Codex copiada | ACH-005 / CR-063 (revogação) | Documentar procedimento; **não** copiar/expor credencial | `codex logout` / `login` no perfil real; se dúvida, suporte OpenAI | Declaração do dono + ausência de dúvida operacional (não “arquivo sumiu”) |
| P-SEC-2 | Resíduos `dist/.../codex-home` | higiene / ACH | Classificar (feito: [EV-R3-dist-codex-home-residues.md](evidence/r3/EV-R3-dist-codex-home-residues.md)); remoção só com escopo | Autorizar remoção do diretório ou subpastas listadas | Dir ausente ou manifesto do que restou + `pnpm secrets` |
| P-INC-1 | Recuperar `<user-home>\node_modules` / store | incidente | Procedimento exato abaixo; **não** apagar store temp antes da verificação | Autorizar e executar (ou autorizar agente a executar) os passos | Novo `.modules.yaml` com store padrão + checks do projeto |
| P-CUR-1 | A13c Cursor escopo projeto | CR-025/026, NR-11, G03 (descoberta) | **Concluído** — [EV-R3-cursor-session.md](evidence/r3/EV-R3-cursor-session.md) | — | Dois prompts PASS; origem no kit |
| P-PROF-1 | Atualizar perfis reais 1.x → 2.0 | CR-047, CR-021 | Prévia conflitos ([EV-R3-real-profile-preview.json](evidence/r3/EV-R3-real-profile-preview.json)); plan/doctor | Autorizar `install --user …` + colar User Rules | doctor sem DIVERGENT; User Rules 2.0 |
| P-EVAL-1 | Avaliações comportamentais | CR-041, CR-049, CR-069 | Plano + casos ([EVAL-PLAN-R3.md](EVAL-PLAN-R3.md)); **sem** colar corpo de skills | Autorizar piloto (12) e tetos; login em perfis isolados | Transcrições + `evals:score` |
| P-IMP-1 | NR-20 leitura / promoção | NR-20, CR-055, NR-15 | Revisão mecânica contínua; fichas de caso; **sem** promoção em lote | Confirmar licenças/autoria; decisão de promoção | Itens `revisado`/`ativo` com justificativa |
| P-NAT-1 | Execução nativa | NR-07, G07 | Mapear SDK local; não instalar global nem EAS sem auth | Autorizar config `ANDROID_HOME` + run ou EAS | Log do app/versão/fluxo |
| P-REL-1 | Commit / tag / push / CI | CR-075, CR-066 | — | — | **PASS** — estável em `v2.0.3` (`0f3dcb6…`); CI 5/5 |
| P-ORF-1 | `cursor-rule-profiles.json` | CR-073 | Mostrar diff vs HEAD | Autorizar apagar | Arquivo removido do tree |
| P-CONF-1 | Executor confinado | alegação CX-14/15 | **Opcional**; suíte em skip | Só se quiser aprovar confinamento | Escape sintético falha fora do sandbox |

---

## Procedimento de recuperação do incidente (para autorização)

Estado atual lido (sem alterar):

- `<user-home>\node_modules\.modules.yaml`: `packageManager: pnpm@10.27.0`, `nodeLinker: isolated`,
  `storeDir: <user-home>\<external-sandbox>\sandbox\template-e2e\.pnpm-store\v10`
- Esse store temporário **ainda existe**
- Store padrão `%LOCALAPPDATA%\pnpm\store\v10` **existe**

```text
# Após autorização explícita — NÃO executar agora
# 1. Fechar editor/servidor/testes que usem <host-workspace-project> / <user-home>\node_modules
# 2. Renomear (não apagar):
Rename-Item <user-home>\node_modules node_modules.cw-incident-20260925
# 3. No diretório do projeto <host-workspace-project> (não inventar path se outro):
#    pnpm install --frozen-lockfile   # Corepack → 10.27.0, store padrão
# 4. Verificar:
#    - storeDir do novo .modules.yaml = %LOCALAPPDATA%\pnpm\store\v10
#    - git status do projeto sem mudanças inesperadas
#    - checks usuais do projeto
# 5. Só então apagar node_modules.cw-incident-20260925 e o store temporário
```

Destino: `<user-home>\node_modules` + store temporário.  
Efeito: reinstala deps do workspace ancestral.  
Risco: scripts do projeto (husky, prisma, builds).  
Consumo: rede + disco.  
Reversão: renomear de volta enquanto o store temp existir.

## Resíduos dist (classificação)

Ver [EV-R3-dist-codex-home-residues.md](evidence/r3/EV-R3-dist-codex-home-residues.md).  
`auth.json`: **ausente**. Nome “auth” em paths restantes = documentação de plugins (não credencial).  
Remoção do diretório inteiro: **bloqueada por autorização** (P-SEC-2).

## Native (atualização ambiental)

Nesta máquina agora: `%LOCALAPPDATA%\Android\Sdk` com `platform-tools`, `emulator`, `platforms` (android-36/37), JDK 17.  
`ANDROID_HOME` / `adb` no PATH: **não** configurados. iOS: sem macOS.  
Provas A8 (Hermes export) **não** = `nativeRuntime`.  
Alternativas para auth: (1) setar `ANDROID_HOME` + `pnpm --filter mobile android` no produto descartável sob `<sandbox>`; (2) EAS remoto (custo/conta do dono).

## Decisões ainda necessárias do proprietário (única lista)

1. ~~P-SEC-1~~ — **risco residual aceito** (sem Log out all); não reabrir  
2. P-SEC-2 apagar ou manter resíduos dist *(pós-2.0)*  
3. ~~P-INC-1~~ — **PASS**  
4. ~~P-CUR-1 / A13c~~ — **PASS** (EV-R3-cursor-session.md)  
5. ~~P-PROF-1~~ — **PASS** (perfis 2.0 + User Rules)  
6. ~~P-EVAL-1~~ — **PASS** 15/15 (EV-R3-eval-pilot-final.md)  
7. P-IMP-1 confirmações de licença / promoções pontuais *(pós-2.0)*  
8. P-NAT-1 ANDROID_HOME local e/ou EAS *(pós-2.0; não bloqueia distribuidor)*  
9. ~~P-REL-1~~ — **PASS** — release 2.0 **ENCERRADA** em `v2.0.3` (CI 5/5)
10. P-ORF-1 apagar `cursor-rule-profiles.json` *(2.1+)*
11. P-CONF-1 (opcional) executor confinado *(2.1+)*

## Estado estável após encerramento 2.0

Release 2.0 encerrada. Pendências restantes são **2.1+**. Não reabrir auditoria geral, evals, hotfixes 2.0.x nem o guard fora de autorização explícita futura.
