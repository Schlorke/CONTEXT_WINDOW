# RELEASE READINESS REPORT — Context Window v2.0.0

Data: 2026-09-25. Escopo congelado: sem novos evals, sem reabrir P-SEC-1/A13c/guard/native/imported.

---

## 1. QA final: **PASS**

```text
pnpm qa  → exit 0
  catalog --check OK (21 active + 83 imported-unreviewed)
  node:test 155/155 pass
  markdownlint 0 errors
  secrets 0 publishable findings
  prettier --check OK
```

Estado testado = working tree atual (candidato a commit). Sem chamadas de modelo.

## 2. Secret / security check: **PASS**

| Check                              | Resultado                                              |
| ---------------------------------- | ------------------------------------------------------ |
| `pnpm secrets` / `secret-scan.mjs` | 0 publishable, 0 ignored findings                      |
| `dist/`                            | gitignored; `auth.json` no path conhecido **ausente**  |
| Credenciais em publishable         | não detectadas                                         |
| P-SEC-1                            | risco residual **aceito**; sem revogação nesta release |

## 3. Working tree e escopo do commit

**Branch:** `main` @ `66194b0` (1.17.0) → working tree = delta 2.0.0  
**Diff tracked:** 63 files, +2147 / −7985 (aprox.)  
**Untracked top-level (incluir na release):** `acceptance/`, `catalog/`, `imported-skills/`, `scripts/cw.mjs`+`lib/`, `test/`, `.github/`, `.editorconfig`, `.prettierrc.json`, `pnpm-workspace.yaml`, assets/scripts FSD, ADRs, etc.

**Dentro da release (proposto):** todo o delta 2.0 de fonte + acceptance (relatórios/evidências R3 sem segredos) + CI + catalog + imported-unreviewed (status explícito, não distribuído).

**Fora / ignorado:** `dist/`, `node_modules/`, `.env`, `.cursor/`, caches locais; artefatos só em `C:\Temp\cw-r3\` **não** entram no git.

**Atenção:** `.vscode/` untracked — incluir só se for configuração de projeto compartilhada; senão deixar fora do stage. Não descartar outras alterações do proprietário.

**Não relacionado à 2.0:** nada identificado como “pessoal alheio” além de possível `.vscode/`; `cursor-rule-profiles.json` permanece (P-ORF-1 pós-2.0).

## 4. Versão final

| Fonte                               | Valor                                          |
| ----------------------------------- | ---------------------------------------------- |
| `package.json`                      | **2.0.0**                                      |
| `CHANGELOG.md`                      | `[2.0.0] - 2026-09-24` (+ fixes 2026-09-25)    |
| `saas-skills/docs/RELEASE_NOTES.md` | `2.0.0 - 24 de setembro de 2026`               |
| Tag local `v2.0.0`                  | **ainda não criada** nesta máquina (após auth) |

## 5. P-EVAL-1

**15/15** células comportamentais válidas · 0 FAIL comportamental  
Evidência: `acceptance/evidence/r3/evals/EV-R3-eval-pilot-final.md`

## 6. Riscos residuais explicitamente aceitos

- P-SEC-1 (sessão Codex copiada / sem Log out all)
- Observabilidade parcial de descoberta de skills no piloto
- Native runtime não verificado
- 83 imported-unreviewed não certificados
- Confinamento de escrita pnpm não alegado

## 7. Pendências pós-2.0

P-SEC-2, P-IMP-1, P-NAT-1, P-ORF-1, P-CONF-1 (opcional). Lista: `acceptance/PENDENCIES-POST-R3.md`.

## 8. Commit message proposto

```text
release: Context Window 2.0.0

Instalador cw.mjs, catálogo com lock, contrato FSD web+mobile, gates,
acceptance R3 e piloto comportamental 15/15. Remove runtimes 1.x.
```

## 9. Tag proposta

`v2.0.0` (annotated)

```text
Context Window v2.0.0

Distribuição segura multi-agente, contrato de arquitetura obrigatório,
template Next+Expo, QA 155 verdes, P-EVAL-1 15/15.
```

## 10. Comandos exatos (NÃO executar até autorização)

```powershell
Set-Location C:\Projetos\Context_Window

# Revisar stage (ajustar se .vscode deve ficar de fora)
git add -A
# Se .vscode for pessoal:
# git reset HEAD -- .vscode

git status

git commit -m @"
release: Context Window 2.0.0

Instalador cw.mjs, catálogo com lock, contrato FSD web+mobile, gates,
acceptance R3 e piloto comportamental 15/15. Remove runtimes 1.x.
"@

git tag -a v2.0.0 -m @"
Context Window v2.0.0

Distribuição segura multi-agente, contrato de arquitetura obrigatório,
template Next+Expo, QA 155 verdes, P-EVAL-1 15/15.
"@

git push origin main
git push origin v2.0.0
```

(Windows PowerShell: usar aqui-string como acima, ou equivalente `git commit -m "..."`. Em bash, HEREDOC `$(cat <<'EOF' ... EOF)`.)

## 11. CI disparada pelo push/tag

Workflow: `.github/workflows/qa.yml`

| Trigger              | Jobs                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `push` em `main`     | `library` (ubuntu+windows × Node 22/24 → `pnpm qa`); `acceptance` (ubuntu, sandbox `/tmp`, `--skip-qa --without-clients`)                                                                                                                                                                                                          |
| `pull_request`       | idem                                                                                                                                                                                                                                                                                                                               |
| Push da tag `v2.0.0` | **não** há `on: tags` dedicado; só dispara se o push da tag também atualiza `main`, ou via regra padrão do GitHub para o commit apontado — o workflow atual escuta **branches main** e **PR**, não `tags:` explicitamente. O `git push origin main` dispara CI; `git push origin v2.0.0` sozinho **pode não** rodar este workflow. |

## 12. Decisão

## READY TO RELEASE v2.0.0: YES

Aguardando autorização final do proprietário para **commit / tag / push**.  
Nenhum commit/tag/push executado nesta etapa.
