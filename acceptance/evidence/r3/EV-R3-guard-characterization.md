# Guard da rodada 3 — caracterização e provas

Evidência máquina: [EV-R3-guard-proof.json](EV-R3-guard-proof.json).

## Mecanismo concreto (não é sandbox de segurança)

O código em `scripts/lib/pnpm-guard.mjs` faz três coisas:

1. **Pré-checagem preventiva** — valida caminhos e configuração e **recusa spawn** se houver
   blockers (workspace ancestral, `packageManager` herdado, sandbox sobreposta ao perfil, builds
   não decididos, store/cache apontando para fora, pnpmfile).
2. **Redirecionamento de ambiente** — `TEMP`/`TMP`, `XDG_*`, `pnpm_config_store/cache/state/userconfig`
   e o home do Expo apontam para pastas sob o diretório declarado. Isso enviesa destinos padrão;
   **não nega** escritas em outros caminhos.
3. **Watch pós-execução** — compara mtime de uma lista fixa (configs ancestrais, npmrc do usuário,
   extras). Detecta algumas alterações depois do fato; **não as impede**.

Subprocessos: `spawnSync("pnpm", …)` com `shell` no Windows. Sem `--permission` do Node, sem ACL
de escrita e sem AppContainer. Rede não é restringida pelo guard (necessária para instalação real).

`GUARD_LIMITS.writeConfinement = false`.

## Sonda do Node (`--permission`)

Sob Node.js 25.2.1 com `--permission`, uma tentativa de `pnpm install` falhou com
`ERR_ACCESS_DENIED` em `getaddrinfo(registry.npmjs.org)` e o canário de
`C:\Users\harry\node_modules` ficou intacto.

Isso é **resultado daquela configuração**, não prova de incompatibilidade geral do pnpm com todo
modelo de permissão, e **não** prova de segurança do mecanismo substituto (o guard). Canário
intacto após falha de rede **não** encerra os critérios de workspace ancestral nem de bloqueio de
escrita.

## Política de execução (após a caracterização)

Decisão no código (`decideExecution` / `validateUnconfinedAuthorization`):

1. Scripts desabilitados (`ignoreScripts=true` em install) → permitido; modo `scripts-disabled`.
   Não é bloqueio universal: pnpmfile continua recusado no preflight; Corepack pode baixar o
   binário pinado.
2. Scripts habilitados sem confinamento comprovado e sem `authorizeUnconfined` completo →
   **bloqueio antes do spawn**, sem efeitos. Aviso sozinho não basta.
3. `authorizeUnconfined` completo → modo `authorized-unconfined`: a operação delimitada pode
   rodar; `confinementRequirement` permanece `not approved`.
4. Executor confinado: `CONFINED_EXECUTOR.available === false`. A suíte que exige confinamento
   fica em `skip` com o requisito ambiental; sem fallback para o host.

Telemetria: `telemetry.changedOutside` + `telemetry.meaning`. Array vazio ≠ “nenhuma escrita
externa” (contraprova CX-14 preservada).

Pedido objetivo de autorização: [EV-R3-auth-request-unconfined-scripts.md](EV-R3-auth-request-unconfined-scripts.md).
Aceite sob a política padrão (sem auth): [EV-R3-acceptance-policy-default.json](EV-R3-acceptance-policy-default.json).

| Prova | Resultado |
| --- | --- |
| Workspace ancestral | `blocked=true`, `spawned=false`, árvore idêntica antes/depois |
| Escape de escrita (postinstall do projeto escreve fora da sandbox) | escrita **sucedida**; `changedOutside=[]`; confinamento **ausente** |
| Instalação legítima (`--ignore-scripts`, registro, store na sandbox) | saída 0; prova **separada** do bloqueio de escrita |
| Política CX-15 (scripts sem auth) | `blocked=true`, `spawned=false`, sem efeitos; aviso sozinho não basta |

Política: sem confinamento de escrita, scripts habilitados **não** seguem só com aviso. Exigem
`authorizeUnconfined` completo (modo `authorized-unconfined`, confinamento continua não aprovado)
ou um executor confinado autorizado. Sem isso, bloqueio antes do spawn.
