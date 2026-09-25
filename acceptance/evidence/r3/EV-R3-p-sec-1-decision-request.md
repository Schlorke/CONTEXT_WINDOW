# Pedido de decisão — P-SEC-1 (revogação remota Codex)

**Status:** preparado; **não** autorizado; **nada executado**.  
Esta nota **não** autoriza `codex logout`, exclusão de `%USERPROFILE%\.codex\auth.json`,
alteração de conta, nem chamada com qualquer segredo.

Definição canônica: [PENDENCIES-POST-R3.md](../../PENDENCIES-POST-R3.md) P-SEC-1.  
Evidências (forma apenas): [EV-R3-cred-investigation.json](EV-R3-cred-investigation.json),
[EV-R3-dist-codex-home-residues.md](EV-R3-dist-codex-home-residues.md).

---

## 1. O que precisa ser invalidado remotamente

**Alvo de segurança:** a sessão OAuth ChatGPT do Codex cujo material de autenticação existiu
como **cópia** em `dist/.../codex-home/auth.json` (removida localmente; path ausente agora).

**Evidência (sem segredos):**

| Fato                                                                                              | Fonte                                                             |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Forma: `auth_mode` ChatGPT; tokens OAuth presentes (`id` / `access` / `refresh`); **sem** API key | EV-R3-cred-investigation `jsonShape`, `authMode`, `apiKeyPresent` |
| Cópia ≠ bytes do canônico em `%USERPROFILE%\.codex\auth.json`                                     | `canonical.sameBytesAsCopy: false`                                |
| **Mesmo** `account_id` que o canônico                                                             | `sameAccountId: true`                                             |
| **Refresh token diferente** do canônico atual                                                     | `sameRefreshToken: false`                                         |
| Apagar a cópia / ausência do arquivo **não** prova invalidação no servidor                        | PENDENCIES + TRACEABILITY-R3 D-R3-04                              |

Conclusão: há risco residual de um **refresh token de sessão ChatGPT/Codex**, associado à mesma
conta, ainda válido no IdP, **distinto** da sessão canônica atual desta máquina. É **esse**
material (e sessões equivalentes derivadas dele) que P-SEC-1 busca invalidar remotamente — não a
mera ausência do arquivo em `dist/`.

## 2. Mecanismo (sem revelar valores)

- Modo: **Sign in with ChatGPT** (OAuth), não chave de API.
- Cache local típico: `auth.json` sob `CODEX_HOME` / `%USERPROFILE%\.codex` (e, conforme a doc,
  compartilhado com a extensão IDE ChatGPT/Codex).
- Campos relevantes na forma investigada: tokens OAuth + `account_id` + `last_refresh`.
- CLI e extensão IDE **compartilham** o mesmo cache de login (doc oficial de Authentication).

## 3. Existe revogação remota aplicável a _essa_ credencial/sessão?

| Caminho                                                           | Aplica à sessão **copiada** (refresh ≠ canônico)?                                                                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Só apagar `dist/.../auth.json`                                    | **Não** (já feito; não é revogação remota)                                                                                                           |
| `codex logout` no perfil **canônico atual**                       | Revoga/limpa a sessão **atualmente armazenada** nesse home. Como o refresh da cópia era **outro**, **não há garantia** de invalidar o token da cópia |
| Restaurar a cópia e fazer logout nela                             | **Recriaria** o segredo em disco — **fora** deste pedido e da política “não reutilizar o segredo”                                                    |
| Conta ChatGPT/OpenAI: encerrar sessões / segurança da conta       | **Sim**, no nível da **conta** (alcance amplo) — ver §5–6                                                                                            |
| API pública documentada “revogar só o refresh da cópia sem o ter” | **Não encontrada** na documentação oficial consultada                                                                                                |

**Resposta explícita:** não há, na documentação oficial do Codex, um comando confiável para
“revogar somente a sessão da cópia já apagada” **sem** possuir o refresh token dessa cópia.
A menor ação oficial que produz a propriedade de segurança (“aquele material deixou de ser
utilizável”) é **invalidação no nível da conta ChatGPT/OpenAI** (sessões / segurança), eventualmente
combinada com logout+login locais do Codex **depois**, para obter uma sessão nova limpa.

Há evolução no código do Codex (`logout` com `POST …/oauth/revoke` do refresh) — ver PR
[openai/codex#17825](https://github.com/openai/codex/pull/17825). Isso só ajuda se o logout
correr **com** o refresh a invalidar presente no store. Não resolve sozinho um token de cópia
já destruída e diferente do canônico. A versão local usada na rodada (≈ 0.147 na extensão)
**não foi revalidada** aqui quanto a incluir esse fluxo.

## 4. Documentação oficial consultada

| Documento                                                             | URL                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Authentication – Codex                                                | <https://developers.openai.com/codex/auth>                                           |
| CLI reference (`login` / `logout`)                                    | <https://developers.openai.com/codex/cli/reference>                                  |
| Log out of all devices (Help Center)                                  | <https://help.openai.com/en/articles/9243857-how-do-i-log-out-of-all-of-my-devices>  |
| Managing active sessions in ChatGPT (Help Center, relacionado)        | <https://help.openai.com/en/articles/10103929-managing-active-sessions-in-chatgpt>   |
| revoke-on-logout no código Codex (PR; não substitui a doc do produto) | <https://github.com/openai/codex/pull/17825>                                         |

Pontos da doc de Authentication: Sign in with ChatGPT; tokens em cache em plaintext
`~/.codex/auth.json` (ou credential store); CLI e extensão compartilham login; logout em um
exige novo sign-in no outro; refresh automático em uso.

## 5. Sequência exata (se autorizada depois) — **não executar agora**

**Opção A — conta (recomendada / menor ação oficial que cobre a cópia):**

Procedimento oficial (Help Center):

1. ChatGPT → ícone de perfil → **Settings** → **Security** → **Log out all**.
2. A sessão atual na web encerra na hora; outras sessões ChatGPT podem levar até ~30 min.
3. (Opcional) Platform API: Settings → Profile → Security → **Log out all** — só se também
   quiser limpar sessões do dashboard de API (não é o mesmo objeto que o refresh Codex OAuth,
   mas reduz superfície de conta).
4. Depois (opcional): no home canônico, `codex logout` + `codex login` para cache local
   coerente — **só com autorização separada**.

**Opção B — só CLI no canônico:**

```text
codex login status
codex logout
codex login
codex login status
```

Em builds recentes, `codex logout` (ChatGPT managed) pode chamar
`POST` em <https://auth.openai.com/oauth/revoke> com o **refresh atualmente armazenado** e só
então apagar o cache local (PR #17825). Isso invalida a sessão **presente no store**, não um
refresh já apagado e distinto. **Insuficiente sozinha** para a cópia (`sameRefreshToken: false`).

**Opção C — suporte OpenAI:** se A não for aceitável / disponível, ticket pedindo invalidação
de sessões OAuth Codex/ChatGPT da conta (**sem** enviar tokens).

## 6. Impacto esperado

| Superfície                                                   | Opção A (conta)                                              | Opção B (logout canônico só)                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Codex CLI (este PC, home canônico)                           | Pode exigir novo login                                       | Exige novo login                                                                                        |
| Outras sessões Codex (outros PCs / refreshes da mesma conta) | Podem cair                                                   | Em geral **não** afeta outros refreshes                                                                 |
| Extensão ChatGPT/Codex no Cursor (mesmo cache)               | Novo login                                                   | Novo login (cache compartilhado)                                                                        |
| ChatGPT web / apps                                           | Pode desconectar sessões conforme a UI                       | Em geral **não**                                                                                        |
| Cursor (produto IDE, Agent sem ser Codex auth)               | Em geral **não** (conta Cursor ≠ OAuth Codex)                | Não                                                                                                     |
| Claude Code                                                  | **Não**                                                      | Não                                                                                                     |
| API keys OpenAI (se existirem à parte)                       | Só se a UI/conta as rotacionar; cópia era OAuth, não API key | Não (logout Codex limpa cache Codex; API key “owned” pode precisar revogação à parte na plataforma API) |
| Outros dispositivos                                          | Sim, se “sign out everywhere” / sessões                      | Não                                                                                                     |

## 7. Verificar depois **sem** reutilizar o segredo da cópia

Permitido:

- Confirmar que `dist/.../auth.json` continua ausente (`Test-Path` / `pnpm secrets`).
- Após ações autorizadas: `codex login status` no home canônico (mostra modo logado/não; **não**
  imprime tokens).
- Declarar na UI da conta que sessões indesejadas foram encerradas (captura sem dados sensíveis).
- Continuidade: uso normal do Codex após novo login **sem** erros de auth — prova a sessão
  **nova**, não a antiga.

**Proibido / não inventar:** usar o refresh/access da cópia (ou restauração do arquivo) para
chamar API e “ver se ainda funciona”.

## 8. Logout local × revogação remota × rotação

| Operação             | Significado neste mecanismo                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Logout local**     | Remove credenciais do cache (`auth.json` / store); doc oficial. Pode ou não chamar revoke no servidor conforme versão do binário |
| **Revogação remota** | IdP invalida o refresh/access no servidor (`/oauth/revoke` ou encerramento de sessão na conta)                                   |
| **Rotação**          | Novo login → novos tokens; a sessão anterior só deixa de ser utilizável se foi revogada ou expirou                               |

Apagar a cópia em `dist` = só higiene local. **Não** é logout nem revogação nem rotação.

## 9. O que exige interação manual sua

- Qualquer passo na **UI da conta ChatGPT/OpenAI** (sessões / segurança).
- Confirmar na UI o alcance (“só este app” vs “todas as sessões”).
- Se usar CLI depois: confirmar prompts do browser OAuth do `codex login` (conta certa).
- Contatar suporte, se necessário.

## 10. Evidência que pode encerrar P-SEC-1

Conjunto mínimo proposto (sem segredos):

1. Declaração sua de que executou invalidação no nível da **conta** (data + tipo de ação UI), **ou**
   confirmação de suporte OpenAI; **e**
2. `dist/.../auth.json` ausente + `pnpm secrets` sem finding publicável dessa credencial; **e**
3. Opcional: `codex login status` pós-relogin canônico (logado de novo), comprovando operação
   limpa **depois** da limpeza de conta.

**Não basta:** “arquivo sumiu”.

---

## Pedido ao proprietário (decisão)

Escolha **uma** (ou combine A+B):

| Opção     | Autoriza                                               | Alcance                      | Adequação a P-SEC-1              |
| --------- | ------------------------------------------------------ | ---------------------------- | -------------------------------- |
| **A**     | Encerrar sessões / segurança na conta ChatGPT (manual) | Conta / várias sessões       | **Adequada** ao refresh da cópia |
| **B**     | `codex logout` + `codex login` só no canônico          | Sessão atual deste PC        | **Parcial**; não garante a cópia |
| **A+B**   | Conta + relogin local                                  | Conta + cache local coerente | **Recomendada**                  |
| **C**     | Só suporte OpenAI                                      | Conta                        | Se A não for possível na UI      |
| **Adiar** | Nada                                                   | —                            | P-SEC-1 permanece aberto         |

Responda com a letra escolhida. **Nenhuma ação será executada até autorização explícita.**
