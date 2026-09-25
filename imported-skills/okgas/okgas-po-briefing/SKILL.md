---
name: okgas-po-briefing
description: >-
  Briefing diário de produto para o PO, sem abrir o Git. Use when the user
  asks for relatório do dia, briefing de produto, changelog para o PO,
  prints anotados das mudanças, ZoomIt no relatório, ou gerar o HTML/PDF
  em docs/client-deliverables/briefings/.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas briefing de produto (PO)

The rule in force lives in `specs/`. The commercial playbook lives in
`docs/client-deliverables/briefings/README.md`. This skill is the execution
order when the user asks to generate the day's briefing.

## Specs

- `process.changelog` — the day's `## YYYY-MM-DD` section is the ledger
- `platform.workspace-artifacts` — raw captures go under `tmp/`
- `ui.storybook-contract` — the story is the capture target, not a guessed URL
- `ui.design-tokens` — pin colour and glass chrome come from the registry, not
  from a new palette
- `process.docs-topology` — the HTML is a commercial artefact, never a new rule

## Protocol

Execute in this order. Do not skip to HTML.

### 1. Harvest

- Read `CHANGELOG.md` under today's real date.
- List files touched today (`git log` / `git diff` of that day).
- For each heading, find the co-located `*.stories.tsx` in the same slice.
- IF the user attached ZoomIt / prints in this chat THEN treat them as input
  evidence, NEVER as the image that goes to the PO.

### 2. Classify

| Class     | Goes to the PO?             |
| --------- | --------------------------- |
| `produto` | yes, with shot              |
| `visual`  | yes, with shot              |
| `interno` | no — stays in the changelog |

### 3. Shot plan first

Write `docs/client-deliverables/briefings/plans/YYYY-MM-DD.shot-plan.yml` BEFORE any
screenshot. Each `produto` / `visual` item MUST name:

- changelog heading
- `kind`: `feature` · `update` · `style` · `fix`
- surface: Storybook story title + export (preferred) or panel route
- region locator that already exists (`id`, accessible name, role) — NEVER
  invent a `data-briefing-*` on product UI
- pins: number, one-line label in product language, anchor

IF a region cannot be located THEN the item ships without an image and the
«como conferir» stays. NEVER fabricate pixels.

### 4. Capture

Prefer Storybook: no tenant data, no login, story already proves the state.
Open the story, perform the same click the user would (open the dialog, collapse
the rail). Measure the region's box relative to the screenshot viewport. Save
the PNG under `tmp/briefings/YYYY-MM-DD/`, then copy the approved file into
`docs/client-deliverables/briefings/assets/YYYY-MM-DD/`.

Annotate in the HTML, not in the PNG: SVG pins as `%` of the frame so they stay
sharp in PDF. Numbered replay pins (1, 2, 3), cyan/primary from the tokens —
not freehand ZoomIt arrows.

### 5. Assemble

Reuse the dark briefing HTML (Inter, Sora, glass, official marks). The day's
HTML lives in `docs/client-deliverables/briefings/html/` and links the shared
stylesheet with
`<link rel="stylesheet" href="../assets/briefing.css">` — NEVER copy inline CSS
from an old briefing. Brand marks live in `assets/brand/`. Per-document content stays inline in the HTML: the
`top: calc(297mm * N - 18mm)` of each `.print-footer`, the «N / M» sheet
labels and the header date. Each item: title, one paragraph, figure with pins,
legend, «como conferir». Do not send the repository, Storybook public URL, or
ZoomIt scribbles.

KPI cards at the top: `Mudanças na tela`, `Telas para conferir` and
`Decisões pendentes` (product choices the briefing asks from the PO). NEVER
`Acesso ao código` or any repository-facing metric — the PO decision was to
drop it (2026-08-26).

### 6. Approve & archive

The office record is the PDF, not the HTML. ONLY after the user explicitly
approves in the conversation («ok, pode enviar»): generate the final PDF with
Chrome headless (`--no-pdf-header-footer`) and save it as
`docs/client-deliverables/briefings/pdf/briefing-okgas-YYYY-MM-DD.pdf` — that
file is what goes to the PO. NEVER archive without explicit approval. NEVER
regenerate an archived PDF afterwards: it is the immutable historical record;
the HTML + shared CSS are working tools, not the deliverable.

## Verify

Open the HTML in a browser. Confirm every pin lands on the named region. Confirm
the PDF path (Ctrl+P → Salvar como PDF) still hides the toolbar.
Working/verification PDFs (Chrome headless) go under `tmp/briefings/YYYY-MM-DD/`
ONLY — never saved inside the project. Archiving happens only in phase 6.

Index: `specs/INDEX.md`. Playbook:
`docs/client-deliverables/briefings/README.md`.

## Output

Date, items classified, shot-plan path, captures that landed, items that shipped
text-only and why.
