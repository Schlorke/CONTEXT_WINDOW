# Pedido de autorização — P-EVAL-1 (piloto mínimo 2.0)

**Status:** preparado; **não** autorizado; **nenhuma chamada a modelo**.  
P-INC-1 / P-PROF-1 / User Rules 2.0: **encerrados**. Não reabrir I+P, P-SEC-1, A13c, guard,
confinamento, native, AppData nem matriz 21/136/83.

Fonte: [PENDENCIES-POST-R3.md](../../PENDENCIES-POST-R3.md) P-EVAL-1 ·
[EVAL-PLAN-R3.md](../../EVAL-PLAN-R3.md) (casos P-FSD / P-TOK / P-LEG / P-NEG + dimensão
descoberta).

---

## Objetivo do piloto

Provar operacionalmente, nos **três clientes**, que a biblioteca 2.0 instalada:

| ID | Comportamento |
| --- | --- |
| **A** | Frontend novo → topologia web+mobile+packages+FSD |
| **B** | Design → tokens/UI em packages compartilhados (não duplicar por cliente) |
| **C** | Legado → migração incremental para a arquitetura obrigatória **quando** a tarefa autoriza |
| **D** | Tarefa irrelevante → não aplica skills arquiteturais |
| **E** | Skill pertinente → descoberta (leitura de `SKILL.md`) **e** influência concreta no resultado |

Não cobre: 21 skills uma a uma; 83 imported; CR-041/049 em escala completa; CI/release.

---

## Ambiente (único kit descartável)

| Item | Valor |
| --- | --- |
| Kit | `<sandbox>\eval-pilot\` (criar sob auth; **não** reusar só o kit A13c se estiver sujo de chat) |
| Produto | `...\eval-pilot\produto` gerado do pacote/fonte atual + `cw install --target … --profile dev --clients claude,codex,cursor` |
| Fixture legado (só caso C) | cópia mínima de `test/fixtures/legacy-shop-migration` **ou** subpasta `legado/` já no kit, **sem** `pnpm install` pesado se não for necessário à pergunta analítica |
| Perfis isolados | opcional: `--home …\eval-pilot\home` para Claude/Codex **se** o dono preferir não misturar com o perfil real já migrado; padrão deste pedido: **usar o perfil real 2.0** (já P-PROF-1) + skills de **projeto** no kit |
| Política de smoke | **só análise**; **proibido** editar código do app, build, migrate, servidor |

Pré-voo (sem modelo): `verify --target produto` exit 0.

---

## Matriz de execução

**Total: 15 chamadas** = 5 casos × 3 clientes × **1** repetição.

| Caso | Cursor | Claude Code | Codex |
| --- | --- | --- | --- |
| A | 1 | 1 | 1 |
| B | 1 | 1 | 1 |
| C | 1 | 1 | 1 |
| D | 1 | 1 | 1 |
| E | 1 | 1 | 1 |

### Cliente / modelo / como executar

| Cliente | Superfície | Modelo | Como rodar (após auth) |
| --- | --- | --- | --- |
| **Cursor** | Agent, pasta = `produto`, chat **novo** sem histórico | O modelo **já selecionado** na UI no momento (registrar Help/About + modelo da sessão) | Colar o prompt literal; não anexar skills manualmente |
| **Claude Code** | CLI no `produto` | Modelo padrão do `claude` na máquina (registrar `claude --version` + modelo da sessão se a UI/CLI mostrar) | `claude -p "<prompt>"` (ou equivalente não interativo documentado na evidência); preferir saída com eventos/tool use se disponível |
| **Codex** | CLI no `produto` | Modelo padrão do `codex` (registrar versão) | `codex exec` / modo não interativo equivalente com log/json se disponível |

Se o plan de execução real exigir login em home isolado, **parar** e pedir auth de login — este pedido **não** inclui copiar `auth.json`.

---

## Prompts literais (PT-BR)

**Regra anti-vazamento:** os prompts **não** nomeiam `packages/frontend`, FSD, `apps/clients/*`,
`design-tokens`, nem skill IDs. A arquitetura esperada deve vir do runtime (User Rules / contrato /
skills descobertas), não do enunciado.

### A — frontend novo

```text
Sem editar arquivos e sem instalar dependências: estamos começando um produto SaaS com interface
web e aplicativo móvel, compartilhados pela mesma equipe. Proponha onde deve viver a UI do
produto, o design system e os dois clientes, e quais regras de importação entre essas partes
você seguiria. Justifique em poucas frases.
```

### B — design / tokens

```text
Sem editar arquivos: um botão do produto precisa da cor primária da marca na web e no mobile.
Onde você colocaria essa cor e o componente reutilizável para os dois clientes não divergirem?
O que você evitaria fazer em cada cliente?
```

### C — legado (modernização **autorizada** no enunciado)

```text
Sem editar arquivos: a tarefa autoriza modernizar uma tela antiga deste repositório para o
padrão atual do produto web+mobile. Descreva a ordem de trabalho (o que validar antes de mover
código, como evitar big-bang, e qual estrutura-alvo você usaria). Não implemente.
```

### D — irrelevante (negativo)

```text
Sem editar arquivos: diga só qual comando git mostra o hash do commit HEAD. Resposta curta.
```

### E — descoberta + influência (skill pertinente)

```text
Sem editar arquivos: para um produto novo com web e mobile compartilhados, diga qual skill
deste ambiente você usaria como guia principal e cite uma exigência concreta dela (uma linha
ou regra operacional) indicando de qual arquivo do projeto ou do ambiente você leu isso.
```

---

## Critérios objetivos PASS / FAIL

Pontuação por célula (caso × cliente). Piloto **PASS** só se **todas** as 15 células PASS
(ou dono aceitar FAIL documentado com decisão explícita — fora do default).

### Dimensões (como distinguir)

| Dimensão | O que conta | O que **não** conta |
| --- | --- | --- |
| **Descoberta** | Na transcrição/log: leitura de `SKILL.md` (tool Skill / Read / path sob `.agents/skills`, `.claude/skills` ou equivalente do cliente) | Só a seção `Skills Used` no texto final |
| **Seleção** | Skill primária observada ∈ família esperada; em **D**, **zero** skills arquiteturais de domínio (multiplatform / react-saas / design-system / legacy / clean-arch / prisma / etc.) | Mencionar o nome da skill sem evidência de carga |
| **Aplicação** | ≥ **2 de 3** itens `minimum_output` do caso (abaixo) presentes na resposta | Ecoar o prompt; inventar segunda árvore mobile espelhando web |

### `minimum_output` por caso

| Caso | Família esperada (seleção) | Itens (precisa ≥2) |
| --- | --- | --- |
| **A** | `multiplatform-platform-architecture` e/ou `react-saas-architecture` | (1) cita hosts web **e** mobile separados; (2) UI de produto em pacote compartilhado (não só dentro de um app); (3) design system / tokens como pacote(s) separados dos hosts |
| **B** | `design-system-implementation` e/ou `saas-ui-specifications` / multiplatform | (1) cor/token em fonte compartilhada; (2) componente em UI compartilhada; (3) evita copiar token/componente só em web ou só em mobile |
| **C** | `legacy-code-refactoring` (+ multiplatform ok como secundária) | (1) caracterização / testes ou inventário antes de mover; (2) migração incremental (não big-bang); (3) alvo alinhado à topologia obrigatória web+mobile+packages |
| **D** | nenhuma especializada | (1) resposta é o comando git correto (`git rev-parse HEAD` ou equivalente aceito); (2) **sem** propor FSD/packages/clients; (3) **sem** evidência de carga de skill arquitetural |
| **E** | `multiplatform-platform-architecture` (primária preferencial) | (1) **descoberta** evidenciada (path/`SKILL.md`); (2) citação **concreta** rastreável ao arquivo lido; (3) a citação influencia a recomendação (não é adorno) |

### FAIL automático da célula

- Edição de arquivos do `produto` / `git status` sujo por causa da run.
- Prompt alterado pelo operador (parafraseado).
- Arquitetura “zertificada” apenas porque o prompt a listou (não aplicável se os literais acima forem usados).
- Em **E**: responde a regra de cabeça **sem** leitura evidenciada do arquivo.

### Aprovação do piloto (agregado)

| Resultado | Condição |
| --- | --- |
| **PASS** | 15/15 células PASS |
| **PASS com ressalva** | ≥ 13/15 e **nenhum** FAIL em **D** (falso positivo de seleção) nem em **E**-descoberta nos 3 clientes — só com aceite explícito do dono |
| **FAIL** | Caso contrário |

---

## Artefatos examinados

| Artefato | Uso |
| --- | --- |
| Transcrição bruta por célula | `acceptance/evidence/r3/evals/EV-R3-eval-{cursor\|claude\|codex}-{A\|B\|C\|D\|E}.md` (+ hash) |
| Log nativo se houver | stream-json / `codex exec --json` / export Cursor — anexo ou path |
| `git status` do `produto` após cada run | deve permanecer limpo |
| Planilha/JSON de score | `acceptance/evidence/r3/evals/EV-R3-eval-pilot-score.json` + opcional `pnpm evals:score` se o formato bater |
| Metadados | cliente, versão CLI/IDE, modelo, data, SHA do contrato User Rules se Cursor (`4f4b6c9710f9`) |

---

## Orçamento / tokens / custo

Estimativa alinhada a [EVAL-PLAN-R3.md](../../EVAL-PLAN-R3.md) (prompts analíticos curtos):

| Métrica | Estimativa |
| --- | ---: |
| Chamadas | **15** |
| Tokens entrada (total) | **0,25 – 0,45 M** |
| Tokens saída (total) | **≤ 0,06 M** |
| Custo $ | **depende do plano** (Cursor / ChatGPT-Codex / Claude): em assinatura = **cota**; sem $ fixo garantido |
| Teto pedido neste auth | **15 chamadas**; **parar** se qualquer cliente exceder **~80k tokens de entrada acumulados** no piloto ou se o dono interromper |

Regra de parada: 1 FAIL em **D** (carregou arquitetura à toa) → registrar e **seguir** as células restantes só se o dono não pedir aborto; default = completar as 15 para mapa completo.

---

## O que este pedido **não** autoriza

- Matriz 136 / 10 tarefas × N repetições / 21 skills.
- Editar User Rules, reinstall de perfil, logout, secrets.
- Commit / tag / push / CI (P-REL-1).
- Native / imported promotion / guard.

---

## Sequência após autorização (agente)

1. Criar kit `<sandbox>\eval-pilot`, install no `produto`, `verify`.
2. Rodar A→E em Cursor, depois Claude Code, depois Codex (ou intercalado por caso — mesma contagem).
3. Preencher score + evidências; **não** colar corpo de skills nos chats.
4. Entregar só: tabela PASS/FAIL 5×3, falhas reais, paths das transcrições.
5. **Não** iniciar QA final / P-REL-1 até o dono autorizar o próximo estágio.

---

## Pedido ao proprietário

| Opção | Significado |
| --- | --- |
| **E15** | Autoriza o piloto **15** chamadas no escopo acima (kit + prompts literais + teto) |
| **E12** | Variante enxuta: só A–D × 3 clientes (**12**); dimensão **E** medida **dentro** de A (descoberta obrigatória em A) |
| **Adiar** | Nada |

Confirmações pedidas com **E15** ou **E12**:

1. Cota/modelo dos três clientes pode ser consumida agora.  
2. Pasta `<sandbox>\eval-pilot` pode ser criada/escrita.  
3. Aceita perfil real 2.0 + skills de projeto no kit (ou diga “home isolado” e autorize login separado).

**Nenhuma chamada até a letra + confirmações.**
