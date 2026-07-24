# attached_assets

Pasta do atalho de import **`@assets`** (definido em `vite.config.ts`).

Estava faltando: o atalho apontava para cá, mas a pasta não existia — qualquer
`import ... from "@assets/..."` futuro quebraria o build. Criada vazia para o
atalho ficar válido.

Use para imagens/arquivos avulsos que não são capas de livro (essas vão em
`client/src/assets/images/covers/`) nem fotos de pessoas
(`client/src/assets/images/people/`).
