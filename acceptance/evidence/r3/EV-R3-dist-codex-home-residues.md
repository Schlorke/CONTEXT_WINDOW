# Classificação — resíduos `dist/global-runtime-validation-20260413/codex-home`

Inspecionado em 2026-09-25 **sem** abrir ou copiar conteúdos sensíveis.

## Credencial

| Caminho | Estado |
| --- | --- |
| `…/codex-home/auth.json` | **Ausente** (presença naquele path encerrada) |
| Qualquer outro `auth.json` sob `dist/` | Nenhum encontrado |

A ausência da cópia **não** prova revogação remota da sessão (P-SEC-1 / ACH-005).

## Conteúdo restante (1.551 arquivos)

| Entrada | Tipo | Sensibilidade estimada | Ação proposta |
| --- | --- | --- | --- |
| `installation_id` | identificador local (36 B) | baixo (não é refresh token) | Remover com o diretório, se autorizado |
| `cap_sid` | identificador (311 B) | baixo/médio (metadado de sessão) | Idem |
| `models_cache.json` | cache de modelos (~230 KB) | baixo | Idem |
| `cache/`, `.tmp/`, `tmp/` | caches | baixo | Idem |
| `memories/` | memória local do perfil copiado | médio (pode ter texto de conversa) | Remover só com auth; não publicar |
| `skills/` | cópias de skills/plugins | baixo (código), não é a fonte 2.0 | Remover; não usar como prova 2.0 |
| Docs `*auth*`, `*token*` sob `.tmp/plugins/…` | markdown/exemplos de plugins | **não** credencial (nomes enganosos) | Remover com o tree |

## Escopo de remoção (quando autorizado)

```powershell
# Somente após autorização explícita — apaga o diretório do perfil copiado, não o resto de dist/
Remove-Item -Recurse -Force dist\global-runtime-validation-20260413\codex-home
```

Não apagar `dist/global-runtime-validation-20260413` inteiro sem inventário do que mais existe lá.
Depois: `pnpm secrets` e confirmar 0 publicáveis / 0 locais.
