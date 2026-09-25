# Canonicalização 2.1 — proveniência e promoção

Data: 2026-09-25. Imports locais em `imported-skills/` não são versionados neste
repositório; o conhecimento reutilizável ficou nas skills canônicas.

## Objetivo

Separar o que é procedimento portátil (entra em `saas-skills/` + registry
`canonical:active`) do que é específico de projeto, marca, path de máquina ou
corpo upstream sem licença registrada (permanece só local, fora da distribuição).

## Inventário (resumo, sem nomes de origem)

- Acervo local de import: dezenas de pacotes com `SKILL.md` e centenas de
  arquivos auxiliares (Markdown, YAML, assets, scripts).
- Decisões aplicadas na rodada 2.1: consolidar na skill canônica da ferramenta;
  enriquecer skill `dev` existente; marcar projeto-específico; bloquear
  upstream sem licença/atribuição clara; em um caso, dividir 3D vs vídeo.
- Licença no registry de import: maioria “not recorded at import”. Texto
  canônico foi reescrito; corpos de terceiros não foram copiados para a fonte.

## Destinos canônicos (perfil `creative`)

Procedimentos que saíram do acervo local e agora estão nas referências:

- Blender: `saas-skills/creative/blender-scene-production/references/domains.md`
  (inspeção, modificadores, ordem de rig, curvas, Principled, papéis de luz,
  lentes, motor, GLB, QA visual, um retry).
- Spline: `saas-skills/creative/spline-web-scenes/references/domains.md`
  (digest, custo, registro PBR, rigs de luz, enquadramento web, motion, input,
  crítica, embed).
- Vídeo: `saas-skills/creative/audiovisual-production/references/routes.md`
  (gancho, comercial, demo, tela, J/L, motion em quadros, cor, loudness,
  legendas, ingest, intermediate, Fusion, social, web, QC).

## O que não entrou na distribuição (de propósito)

- Pacotes de composição programática de vídeo (família Remotion no acervo
  local): sem LICENSE registrada no import; um guia embute credencial de busca
  de docs. Status permanece fora de `active`. Nada foi copiado.
- Enciclopédia de Client API de ORM e catálogo de regras de performance React
  de terceiros: lidos na origem; não duplicados. Trechos reutilizáveis
  (SQL parametrizado; ordem de prioridade com atribuição) foram para skills
  `dev` já existentes.
- Roteadores amarrados a `specs/`, scripts e paths de um produto: o host Expo
  fino e quatro procedimentos genéricos foram para skills `dev`
  (`react-saas-architecture`, `prisma-database-design`,
  `multiplatform-platform-architecture`, `saas-ai-agent-engineer`). Marca,
  paths e scripts do produto de origem não entraram.
- Ensaio de performance em um aparelho/URL específica: a regra reutilizável
  (medir no aparelho, não no dev server) está em `spline-web-scenes`.
- Manifesto de tokens/marca de um projeto (`brands/<id>`): a regra
  reutilizável (não inventar token; registrar verified/inferred/unknown) está
  na rota de marca de `audiovisual-production`.

## Critérios de decisão (sem matriz nomeada)

| Decisão | Quando | Destino |
| --- | --- | --- |
| CONSOLIDATE | Procedimento de ferramenta reutilizável | Skill `creative` da ferramenta |
| ENRIQUECER | Procedimento genérico de engenharia | Skill `dev` existente |
| SPLIT | Mesmo pacote mistura autoria 3D e peça de vídeo | 3D → skill 3D; vídeo → audiovisual |
| PROJECT-SPECIFIC | Identidade de cliente, paths, briefs ou specs locais | Só acervo local; não distribui |
| BLOCKED | Upstream sem licença/atribuição ou enciclopédia a não duplicar | Só acervo local; não copia |

`status: imported-unreviewed` (ou equivalente no registry de import local) é
elegibilidade de distribuição: o instalador só empacota `canonical:active`.
Não significa “arquivo não lido”.

## Regras técnicas promovidas (relidas na fonte)

| Regra | Classe | Onde ficou |
| --- | --- | --- |
| `max_size` 800 | Orçamento de captura do workflow de origem, não limite de render do Blender. A fonte diz “salvo necessidade”. | `blender-scene-production/references/domains.md` |
| Motion code-driven | Default de animação na fonte; states são opt-in. Confirmar no tópico `animation` da sessão. | `spline-web-scenes/references/domains.md` |
| Export → Code | A UI exporta; o MCP não escreve `.splinecode`. Pares schema/runtime citados são snapshot, não default eterno. | `spline-web-scenes/references/domains.md` |
| Gancho &lt; 1 s e ≤ 3 s | Recomendação de formato (vertical / comercial), não limite de codec. | `audiovisual-production/references/routes.md` |
| −14 LUFS | Alvo usual de mix de diálogo, a confirmar no brief; ponto de partida no export comprimido. | `routes.md` |
| V1 / A1–A4 | Convenção de timeline nova em um NLE; não é requisito do software nem layout universal. | `routes.md` |

## Validação

- `node scripts/cw.mjs catalog --write-lock` (ou `--check` se só docs mudaram).
- Instalação do perfil `creative` em diretório descartável.
- Gatilhos em `saas-skills/evals/skill-trigger-matrix.json` não foram
  reexecutados como avaliação de modelo nesta rodada.

## Manutenção

Imports locais não versionados: conhecimento útil está nas skills canônicas.
Para promover algo novo do acervo local: revisar, passar no gate do catálogo,
registrar status e justificativa no registry — sem publicar inventário de
cliente, path de máquina ou credencial.
