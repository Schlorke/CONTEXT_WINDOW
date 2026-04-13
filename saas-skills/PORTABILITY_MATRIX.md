# PORTABILITY MATRIX — Biblioteca saas-skills

**Data:** 12 de abril de 2026  
**Objetivo:** registrar como a biblioteca deve ser instalada em cada ambiente e o que foi validado localmente

---

## Modos de Distribuição

A biblioteca passa a ter dois modos oficiais de distribuição:

1. **Árvore canônica** em `saas-skills/`
   Uso para ferramentas que aceitam descoberta recursiva ou referência explícita de `SKILL.md`.
2. **Bundle achatado** em `dist/flat-skills/`
   Uso para loaders que esperam uma pasta imediata por skill.

O bundle achatado é gerado por:

```bash
pnpm export:flat-skills
```

---

## Matriz

| Ambiente | Modo recomendado | Descoberta esperada | Validação local | Observação |
| --- | --- | --- | --- | --- |
| Claude Code / Claude.ai Projects | Árvore canônica `saas-skills/` | Recursiva ou por referência explícita | ✅ layout validado | Smoke test em agente externo ainda não registrado neste relatório |
| Cursor IDE | Árvore canônica `saas-skills/` | Referência direta ou convenção local da ferramenta | ✅ layout validado | Compatibilidade documental preparada; replay real pendente |
| GitHub Copilot / loaders sem descoberta recursiva | `dist/flat-skills/` | Subpastas imediatas por skill | ✅ export validado | O bundle contém `16` subpastas de skill prontas para cópia |
| Continue.dev / uso manual | Árvore canônica ou bundle achatado | Referência explícita no contexto | ✅ layout validado | Sem dependência de descoberta automática |

---

## Garantias Verificadas

- `dist/flat-skills/` é regenerável a partir da árvore canônica.
- O export cria `16` diretórios imediatos de skill.
- Cada diretório exportado contém `SKILL.md`.
- O export também gera `manifest.json` para inspeção rápida.

---

## Limites Desta Matriz

Este documento registra **portabilidade de empacotamento**, não benchmark de qualidade por agente. Em outras palavras: a biblioteca está pronta para ser carregada; a sensibilidade de trigger e a qualidade da resposta ainda devem ser verificadas por replay em cada ferramenta.
