# Coordenação entre as janelas do Claude Code

> O Matheus trabalha com **mais de uma janela do Claude Code na mesma pasta**.
> Este é o combinado para elas não se atropelarem. É lido no começo de **toda
> sessão** — por isso ele carrega só o **estado atual**; o histórico de quem fez
> o quê mora em `docs/COORDENACAO-ARQUIVO.md`.

## O quadro (a fonte da verdade sobre AGORA)

Na primeira tarefa da sessão, antes de editar qualquer arquivo: leia o quadro,
assuma uma faixa livre e **escreva a sua linha** (sozinho? assuma a A). Ao
terminar, **limpe a sua linha** de volta para "— livre —".

**A célula é o estado atual, em poucas frases:** a tarefa, os arquivos
declarados e os avisos **ativos** às outras janelas. Relato de trabalho
concluído não fica aqui — vai para o `ROTEIRO.md` (se houver decisão) ou morre
com o commit (o git já conta). Foi o acúmulo de relatos que fez este arquivo
chegar a 36 mil caracteres lidos a cada sessão.

| Janela | Tarefa e avisos ativos | Arquivos declarados | Servidor? | Atualizado |
|---|---|---|---|---|
| A · voz `pm_alex` · aba 🟢 | 🔨 **EM CURSO: encolher a conversa do livro** (decisão dele na folha `_recomendacao-conversa.html`, ROTEIRO §4.87). ⚠️ B: posso precisar de uma linha em `pages/Notifications.tsx` (só o destino do link); **não toco** em `lib/notifications.ts`, `lib/salaAoVivo.ts`, `components/sala/*` nem no clube. A conversa **não** está sendo apagada — sai da ficha e vive no player; `lib/comments.ts` fica intacto (a nota dos livros sai dele). | `pages/BookDetails.tsx`, `components/SalaDoLivro.tsx`, `pages/Conversa.tsx`, `components/{ConversasDeAgora,MuralDaComunidade}.tsx`, `components/comunidade/LinhaDeAtividade.tsx`, `pages/Comentarios.tsx` | não — serviço launchd sempre no ar | 04/08 |
| B · voz `pm_santa` · aba 🔵 | — livre — (última tarefa: as 4 correções do Matheus na tela de clubes, fim da §4.99). ⚠️ Avisos ativos: (1) **`PortasDoPerfil` não tem mais ícone e a letra cresceu** — decisão dele, vale no perfil também; a interface perdeu o campo `icone`; (2) cartões de clube moram em `components/clube/CartoesDaTelaDeClubes.tsx` (novo: `LinhaDeAgenda`); (3) em vitrine use `estreiasParaDescobrir()`, não `clubesComecando()`; (4) C: `pages/Clube.tsx` segue livre. | — | não | 04/08 (noite) |
| C · voz `pf_dora` · aba 🟣 | 🔨 **EM CURSO: a reforma do topo da Comunidade (§4.100), ditada por ele** — cabeçalho fora, ao vivo como **stories**, menu "…" virou **quadradinho + painel de tela inteira** (estilo Facebook). ⚠️ **Avisos:** (1) **apaguei `comunidade/MenuDaComunidade.tsx`** (virou `PainelDaComunidade.tsx`) e o `OuvindoAgora.tsx` de hoje (§4.98 item 4 caiu — mal-entendido, ver §4.100); (2) **B:** `components/sala/SalasAoVivoNoFeed.tsx` ficou **órfão** (os stories o substituem) — é sua faixa, não apaguei; (3) sigo **aguardando a folha `_linha-do-ciclo-C.html`**. Na fila ainda: fotos de comunidade, capas a olho, `og:image`. | `pages/Community.tsx`, `components/comunidade/{SalasComoStories,PainelDaComunidade}.tsx` (novos), `docs/ROTEIRO.md` (§4.100), `client/public/_linha-do-ciclo-C.html` | não | 04/08 (noite) |

## As regras (o porquê completo está no arquivo)

1. **Cada janela numa faixa** — divida por área ou por tela, e declare no quadro
   os arquivos que vai tocar.
2. **Abra o app com a sua letra** — `http://localhost:3000/?janela=A` (B, C). A
   aba se identifica sozinha (guia, pastilha, marca d'água; A verde · B azul ·
   C roxo). Folha solta em `client/public/` nasce com a letra de quem a
   desenhou no `<title>`.
3. **Nunca edite arquivo que outra janela declarou.** Precisa dele? Escreva no
   quadro e espere liberar, ou avise o Matheus. Exceções óbvias: este quadro e o
   `ROTEIRO.md` são de todas (edição pontual, nunca reescrita durante a tarefa
   de outra).
4. **Só uma janela sobe o servidor** — as outras testam no mesmo
   `localhost:3000` (o Vite recarrega sozinho). `npm run check` antes de
   commitar.
5. **Commit: adicione só os seus arquivos, um a um** — nunca `git add -A`,
   `git add .` nem `git commit -a` (o hook empurra para o GitHub na hora, e você
   subiria o trabalho pela metade da outra). **Leia o `git diff` de cada arquivo
   antes do `add`**: quando duas janelas mexem na mesma tela, o arquivo tem as
   duas mãos dentro, e commitar meio-a-meio quebra o app no GitHub. Trecho
   alheio no diff? Deixe o arquivo de fora e avise no quadro. `git pull
   --rebase` antes de commitar; commits pequenos e frequentes.
6. **Arquivos gerados, um de cada vez** — `npm run catalogo` e `npm run build`
   reescrevem `catalog-enriched.ts`, capas e `dist/`; avise no quadro antes.
7. **Recado importante não mora em célula de tabela** — pedido a outra janela
   vai também para o ROTEIRO ou pela voz (recado enterrado aqui já ficou dias
   sem virar trabalho).

**Resumo:** leia o quadro, declare a sua faixa, não toque no que é declarado,
um servidor só, `git add` cirúrgico — e ao terminar, limpe a sua linha.

> Se o quadro deixar de bastar, a opção avançada (worktrees, uma cópia isolada
> por janela) está descrita no fim do `COORDENACAO-ARQUIVO.md`.
