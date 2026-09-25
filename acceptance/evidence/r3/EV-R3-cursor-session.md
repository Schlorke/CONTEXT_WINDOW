# EV-R3-cursor-session — A13c **ENCERRADO**

Critério: [CURSOR-VERIFICATION.md](../../CURSOR-VERIFICATION.md) · Pendência: P-CUR-1.

| Campo | Valor |
| --- | --- |
| Data | 2026-09-25 |
| Cursor versão | **3.22.8** (system setup); commit `031424cf8bc0263293fa58956a6b14f93ce8bae0`; Nightly; Electron 42.10.0; Windows_NT 10.0.26200 |
| Pasta aberta | `<sandbox>\cursor-kit\produto` |
| Janela | New Window + Open Folder no kit (não a sessão do repositório Context_Window) |
| Artefato / kit | nonce `1d78593e`; bundle `run-2026-09-25T05-38-42-176Z` |
| SHA-256 marcador (pré-checagem) | `f9efd05cc70638bb2f7a60f636ba835f60e27aa45f2ac9ee54dc32c1b5d10648` |
| SHA-256 sonda SKILL.md | `db6c7a456ce851bd1a8178980e31a049b3ac068599852dda49e496bfa1c58b12` |

## Prompt 1

Texto enviado:

```text
Quais skills deste projeto começam com cw-probe? Siga o que essa skill pede.
```

Resposta completa:

```text
A única skill deste projeto que começa com `cw-probe` é `cw-probe-1d78593e`.

CW-PROBE-1D78593E

`<sandbox>\cursor-kit\produto\.agents\skills\cw-probe-1d78593e`
```

Checagem:

- [x] Menciona `cw-probe-1d78593e`
- [x] Token `CW-PROBE-1D78593E`
- [x] Pasta sob `<sandbox>\cursor-kit\produto\.agents\skills\…`
- [x] **Não** cita `~/.claude`, `~/.agents`, `~/.codex` ou `~/.cursor` como origem

## Prompt 2

Texto enviado:

```text
Sem editar nada, cite literalmente a linha Preconditions do Operational Contract da skill multiplatform-platform-architecture e diga de qual arquivo ela veio.
```

Resposta completa:

```text
A linha **Preconditions** do Operational Contract é:

`| Preconditions | Node >= 22.13 and the pnpm version pinned in the template's `packageManager` (run through Corepack or an equal pnpm); for an existing repository, an explicit authorization to change it (otherwise only assess). |`

Ela veio de `.agents/skills/multiplatform-platform-architecture/SKILL.md`.
```

Checagem:

- [x] Linha Preconditions idêntica ao marcador 2.0 do kit
- [x] Arquivo sob `.agents/skills/…` do **projeto** (caminho relativo ao kit; não perfil de usuário)
- [x] **Não** origem em `~/.claude` / `~/.agents` / `~/.codex` / `~/.cursor`

## Classificação (somente o testado)

| Propriedade | Resultado |
| --- | --- |
| Descoberta de skill no escopo de projeto | **PASS** (Prompt 1) |
| Invocação explícita (seguiu o pedido da sonda) | **PASS** (Prompt 1: token + pasta) |
| Conteúdo da versão 2.0 (marcador Preconditions) | **PASS** (Prompt 2) |
| Origem = cópia do projeto, não perfil antigo | **PASS** (ambos) |
| Seleção automática sem pedido | **não testado** |
| Eficácia geral / todas as skills / User Rules | **fora do A13c** — não aprovado por estes testes |

## Veredito

| Resultado | |
| --- | --- |
| **A13c** | **APROVADO** (descoberta + carregamento de conteúdo 2.0 no escopo de projeto) |
| Motivo | Dois prompts bateram identidade da sonda e marcador; caminhos sob o kit |
| Limitações | Não prova CR-049, CR-041, CR-027, seleção automática nem User Rules |

**A13c encerrado.** Próxima decisão canônica: ver [PENDENCIES-POST-R3.md](../../PENDENCIES-POST-R3.md) — **P-SEC-1** (revogação Codex); não executar sem autorização.
