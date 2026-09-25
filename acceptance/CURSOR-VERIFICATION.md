# Verificação do Cursor no escopo de projeto

Estado: **APROVADO** para descoberta/carregamento no escopo de projeto (A13c,
2026-09-25, Cursor 3.22.8). Evidência: [evidence/r3/EV-R3-cursor-session.md](evidence/r3/EV-R3-cursor-session.md).

Não cobre: eficácia comportamental (CR-049), seleção automática em tarefas reais (CR-041),
escopo de usuário / User Rules (CR-027).

## O que a verificação prova e o que não prova

Prova, se as duas respostas baterem:

- que uma sessão nova do Cursor, aberta num projeto gerado a partir do pacote final, descobre as
  skills gravadas em `.agents/skills` do projeto (escopo de projeto, CR-026, NR-11, G03);
- que o conteúdo veio da cópia do projeto: a skill-sonda tem nome e token únicos criados junto com
  o kit, e a linha-marcador de `multiplatform-platform-architecture` foi escrita em 2026-09-25 e só
  existe no pacote 2.0 (nenhuma cópia antiga do perfil do usuário a contém).

Não prova:

- que o modelo aplica as skills corretamente em tarefas reais (avaliação comportamental, ver
  [EVAL-PLAN-R3.md](EVAL-PLAN-R3.md));
- o escopo de usuário do Cursor nem as User Rules.

## Kit preparado

Pasta descartável `<sandbox>\cursor-kit`, gerada a partir do pacote avaliado na aceitação final
(identidade em [evidence/r3/EV-R3-cursor-kit.json](evidence/r3/EV-R3-cursor-kit.json)):

| Item | Valor |
| --- | --- |
| Projeto | `<sandbox>\cursor-kit\produto` (`install --clients cursor`, `verify` passa) |
| Skill-sonda | `.agents/skills/cw-probe-1d78593e` |
| Token esperado | `CW-PROBE-1D78593E` |
| Linha-marcador | linha `Preconditions` do `Operational Contract` de `multiplatform-platform-architecture` |
| SHA-256 do arquivo-marcador | `f9efd05cc70638bb2f7a60f636ba835f60e27aa45f2ac9ee54dc32c1b5d10648` |
| SHA-256 do marcador do pacote | `c7ee1fe5574b6fa1e907ce5513231b4070e458b9829623cda9008c647070e6e0` |

## Procedimento

1. No Cursor, **File > New Window** e **File > Open Folder** em `<sandbox>\cursor-kit\produto`.
2. Abra um chat de Agent novo, sem histórico.
3. Envie: `Quais skills deste projeto começam com cw-probe? Siga o que essa skill pede.`
   Esperado: `cw-probe-1d78593e`, o token `CW-PROBE-1D78593E` e a pasta
   `<sandbox>\cursor-kit\produto\.agents\skills\cw-probe-1d78593e`.
4. Envie: `Sem editar nada, cite literalmente a linha Preconditions do Operational Contract da skill
   multiplatform-platform-architecture e diga de qual arquivo ela veio.`
   Esperado: `| Preconditions | Node >= 22.13 and the pnpm version pinned in the template's
   packageManager ...` e o arquivo
   `<sandbox>\cursor-kit\produto\.agents\skills\multiplatform-platform-architecture\SKILL.md`.
5. Registre em `acceptance/evidence/r3/EV-R3-cursor-session.md`: versão do Cursor (Help > About),
   data, as duas respostas completas e, se a interface listar as skills do projeto, uma captura.

Critério: APROVADO só se as duas respostas baterem. Se a resposta citar um arquivo de
`~/.claude/skills`, `~/.agents/skills`, `~/.codex/skills` ou `~/.cursor`, a origem é o perfil do
usuário e o resultado é REPROVADO para o escopo de projeto.

## Efeitos e reversão

- O Cursor grava o estado da janela no próprio perfil (histórico de pastas e `workspaceStorage`),
  como em qualquer pasta aberta. Nada é gravado pelo Context Window fora de `<sandbox>`.
- Reversão: feche a janela e apague só `<sandbox>\cursor-kit`.

## Recriar o kit (comandos testados em 2026-09-25)

```powershell
node scripts/cw.mjs build --out <sandbox>\cursor-kit\bundle
node <sandbox>\cursor-kit\bundle\saas-skills\engineering\multiplatform-platform-architecture\scripts\scaffold.mjs --out <sandbox>\cursor-kit\produto --scope "@empresa" --name "Produto"
git -C <sandbox>\cursor-kit\produto init -q
node <sandbox>\cursor-kit\bundle\scripts\cw.mjs install --target <sandbox>\cursor-kit\produto --profile dev --clients cursor --home <sandbox>\cursor-kit\home
```

A skill-sonda é uma pasta `cw-probe-<nonce>` em `.agents/skills` com um `SKILL.md` de nome igual e
um token derivado do nonce. Ela não é gerenciada pelo `cw`, e o `verify` continua passando.
