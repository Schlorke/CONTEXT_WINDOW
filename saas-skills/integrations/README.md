# integrations

`cursor-rule-profiles.json` é o arquivo de perfis da versão 1.x (globs de regras Cursor, `paths` do
Claude e gatilhos do hook). Na 2.0 esses dados vivem em `catalog/registry.json` (campos `profiles`,
`invocation` e `triggers`) e nenhum script lê mais este arquivo.

Ele foi mantido porque continha uma alteração local não commitada do dono do repositório no momento
da migração (descrição de `multiplatform-platform-architecture`). Depois de revisar essa alteração,
o arquivo pode ser removido.
