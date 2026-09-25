# RT-10 Codex C

- executable: %LOCALAPPDATA%\OpenAI\Codex\bin\13995fba801849b0\codex.exe
- version: codex-cli 0.155.0-alpha.16.4
- model_config: gpt-6-astra (from ~/.codex/config.toml; no -m)
- usage: {"input_tokens":105562,"cached_input_tokens":77184,"cache_write_input_tokens":0,"output_tokens":1102,"reasoning_output_tokens":18}
- commands_observed:
- "C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content .agents/skills/legacy-code-refactoring/SKILL.md; Get-Content .agents/skills/multiplatform-platform-architecture/SKILL.md; Get-Content .agents/skills/react-saas-architecture/SKILL.md; rg --files -g '"'!node_modules'"' -g '"'!pnpm-lock.yaml'"' -g '"'!package-lock.json'"' | Select-Object -First 70; rg -n 'Legacy|legacy|FSD|moderniza' <user-home>/.codex/memories/MEMORY.md"
- "C:\\Program Files\\PowerShell\\7\\pwsh.exe" -NoProfile -Command 'Get-Content README.md; Get-Content package.json; git status --short; Get-Content .agents/skills/multiplatform-platform-architecture/SKILL.md'


## Final agent_message

A ordem seria **inventariar ÔåÆ caracterizar ÔåÆ preparar a estrutura ÔåÆ migrar em passos pequenos ÔåÆ validar ÔåÆ retirar o legado**. Aplicaria as skills `legacy-code-refactoring`, `multiplatform-platform-architecture` e `react-saas-architecture`.

Neste checkout, o README indica um piloto anal├¡tico e o `package.json` n├úo cont├®m scripts. N├úo encontrei c├│digo da tela; portanto, abaixo est├í o procedimento proposto, n├úo uma valida├º├úo de implementa├º├úo existente. Nenhum arquivo foi alterado.

1. **Validar antes de mover c├│digo.** Conferir instru├º├Áes, decis├Áes arquiteturais, estado do Git, depend├¬ncias e consumidores reais da tela. Inventariar rotas, URLs, SEO, chamadas e payloads de API, analytics, persist├¬ncia, autentica├º├úo, tenant/RBAC e depend├¬ncias exclusivas de navegador ou servidor. Registrar comportamento, apar├¬ncia e integra├º├Áes que devem permanecer iguais; consultar hist├│rico para identificar pontos de maior risco.

2. **Criar uma refer├¬ncia execut├ível do comportamento atual.** Antes da primeira movimenta├º├úo, escrever testes de caracteriza├º├úo para regras, textos e pap├®is acess├¡veis, intera├º├Áes, estados de carregamento/erro/vazio, permiss├Áes e efeitos das chamadas de API. Os mesmos casos devem rodar no legado e na vers├úo migrada, com adaptadores finos. Separar corre├º├Áes funcionais e redesign da migra├º├úo estrutural.

3. **Preparar apenas a estrutura necess├íria**, aproveitando o que j├í existir:

   ```text
   apps/clients/
     web/                 # Next.js: rotas, bootstrap e integra├º├úo web
     mobile/              # Expo: rotas, bootstrap e integra├º├úo nativa
   packages/
     frontend/src/
       app/               # composi├º├úo e providers
       pages/<tela>/      # conte├║do e l├│gica espec├¡ficos da tela
       widgets/<bloco>/   # blocos independentes ou reutilizados
       features/<acao>/   # intera├º├Áes reutiliz├íveis
       entities/<conceito>/ # modelos, API e UI de neg├│cio
       shared/            # infraestrutura sem regras de neg├│cio
     ui/                  # contrato comum + variantes .web/.native
     design-tokens/       # tokens e temas can├┤nicos
   ```

   Os dois clientes devem renderizar a p├ígina compartilhada. N├úo criaria outro FSD dentro dos clientes nem presumiria que DOM/CSS funciona em React Native.

4. **Migrar um conceito por vez.** Extrair tokens e primitivas, depois modelos de neg├│cio, intera├º├Áes, blocos e composi├º├úo da p├ígina, conforme as depend├¬ncias reais. C├│digo exclusivo da tela pode permanecer em `pages/<tela>`; n├úo precisa virar uma feature artificialmente. Atualizar consumidores e imports na mesma etapa, mantendo entradas p├║blicas est├íveis e adaptadores tempor├írios quando necess├írios. Cada etapa deve ser pequena, verific├ível e revers├¡vel; o restante do legado fica fora do escopo.

5. **Validar cada etapa e os limites arquiteturais.** Rodar caracteriza├º├úo e `pnpm arch`. Imports entre slices apenas para camadas inferiores, pelas APIs expl├¡citas de `index.ts`; sem imports entre irm├ús, salvo `@x` permitido entre entities. Sem `export *` ou barrel global. `shared/ui` apenas delega a `packages/ui`. C├│digo universal n├úo importa Next, DOM, React Native, Node, Prisma ou segredos; diferen├ºas de plataforma ficam em variantes e adaptadores. Backend mant├®m sua arquitetura pr├│pria, fora do FSD.

6. **Retirar o legado somente ap├│s comprovar a substitui├º├úo.** Confirmar consumidores reais usando as novas entradas, eliminar aliases antigos e fontes duplicadas e executar a valida├º├úo final: arquitetura, tokens, tipos, testes, build web e bundle mobile. Registrar separadamente build nativo e execu├º├úo em dispositivo. Viola├º├Áes transit├│rias podem ser documentadas como estado intermedi├írio; **qualquer viola├º├úo de `pnpm arch` bloqueia declarar a moderniza├º├úo conclu├¡da**.

N├úo executei gates: este pedido ├® apenas descritivo e o checkout n├úo fornece esses scripts.
