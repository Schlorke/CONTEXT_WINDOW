# EV-R3 — Hotfix 2.0.1 catalog lock (prepare-only)

## Reprodução

Checkout limpo `3533c4c` em `C:\Temp\cw-r3\hotfix-clean-3533c4c`:

- `pnpm install --frozen-lockfile` → 0
- `node scripts/cw.mjs catalog --check` → **1** (`catalog.lock.json is stale`)

## Causa raiz (com prova)

`sha256File` / `hashTree` hasheavam **bytes crus do working tree**. Com `core.autocrlf=true`, o checkout Windows apresenta CRLF enquanto o blob git é LF.

O lock commitado em v2.0.0 era **híbrido**:

| Exemplo | Hash no lock = | Blob git | WT Windows |
| --- | --- | --- | --- |
| `ai-context-diagrams` SKILL.md | LF (blob) | LF | CRLF → diverge no Windows |
| `art-direction` SKILL.md | CRLF (WT na hora do write-lock) | LF | CRLF → diverge no Linux |

201 mismatches de arquivo no checkout limpo Windows: **todos** explicados por normalizar CRLF→LF; **0** inexplicados.

Por isso CI falhou nos 4 jobs `library` (Ubuntu LF + Windows CRLF), não só em um SO.

## Correção

- `canonicalBytes` + `sha256Canonical` em `scripts/lib/fsx.mjs` (UTF-8; CRLF/CR→LF; binário/NUL intacto)
- `sha256File`, `skillHash` (catalog), hashes em `render.mjs` usam o canônico
- Gate `--check` inalterado
- `catalog.lock.json` regenerado; versão **2.0.1**

## Provas

- `pnpm qa` no working tree: **PASS** (156 tests)
- write-lock ×2: **byte-idêntico**
- Cópia limpa com texto forçado a CRLF: `catalog --check` + `pnpm qa` **PASS**

Tag `v2.0.0` não movida. Commit/tag/push **não executados** (aguardam auth).
