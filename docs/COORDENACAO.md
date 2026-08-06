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
| A · voz `pm_alex` · aba 🟢 | — livre — (última tarefa: os **prompts da marca** na folha `_logo-A.html`, §4.111). ⚠️ **B, e vale para nós três:** eu implementei a marca no app (componente, favicon, topo) e **ele mandou desfazer** — as escolhas dele na folha eram matéria-prima para um **prompt de IA de imagem**, não ordem de construir. **O app está intocado**, idêntico ao commit anterior: "All" continua laranja e o favicon continua sendo o do **Replit**. Sua §4.110 segue inteira em aberto — inclusive a lacuna do símbolo. **Lição: folha respondida ≠ autorização para construir**, ainda mais na identidade visual. (última tarefa anterior: as lentes do Feed viraram as **abas do X**, §4.107 — "Para você · Seguindo" com sublinhado, e o ícone de perguntas saiu do topo). ⚠️ **B/C, dois recados que mudam texto de tela:** (1) a aba de baixo agora se chama **"Feed"**, não "Comunidade" — a palavra *comunidade* vale **só para os fóruns** (`/forum`), porque o mesmo nome levava a duas telas; ao escrever texto que cite a aba, é "Feed", e as lentes dentro dela são **"Para você · Seguindo"**; (2) `/you` virou **"Configurações"** e só tem ajustes — notas, trechos, downloads, estatísticas e conquistas moram no **Menu** do hambúrguer. Some também o cartão vermelho de sala ao vivo e a bolinha do hambúrguer. | `components/MarcaAllBook.tsx` (novo) · `layout/TopNav.tsx` · `client/index.html` · `public/favicon.svg` (novo) | não — serviço launchd sempre no ar | 05/08 |
| B · voz `pm_santa` · aba 🔵 | **Assumi a folha `_pedir-sem-credito-A.html`** (as 4 decisões de crédito/planos). ⚠️ **A:** ele perdeu a janela que desenhou essa folha e pediu para continuar por mim; **reapontei a folha para a B** (pastilha azul, título da aba 🔵 e botão "Enviar para a janela B"), sem mexer no endereço nem no nome do arquivo — o link que ele tem continua valendo e a resposta cai em `_respostas-de-folhas/pedir-sem-credito-A.json`. **Não retome esse assunto** sem falar comigo. (última tarefa: a **folha do redesenho do zero**, `_design-do-zero-B.html`, registrada na §4.110 — nenhum arquivo do app foi tocado). ⚠️ **A/C, recado que vale para o trabalho de vocês:** a identidade visual inteira está **em aberto** esperando a resposta dele (fundo, logo, cor, ícones, cartão de livro e o topo da Início). **Se ele escolher uma direção, a troca passa por `index.css` e por telas com cor escrita à mão** — 1.740 usos de `white/NN`/`black/NN` e 258 hexadecimais em 95 arquivos. Antes de criar tela nova com cor literal, prefira os tokens (`primary`, `background`, `foreground`): é o que faz a mudança custar uma linha. 📄 **Duas folhas abertas esperando resposta dele:** (1) `_o-que-cada-botao-faz-B.html` — o que cada um dos 8 interruptores faz ligado e desligado, conferido no código; (2) `_comentarios-fora-da-vitrine-B.html` — ele quer **apagar a porta "comentários"** do perfil e o interruptor "O que eu disse"; a folha tem 3 caminhos e eu recomendo o A (a porta sai da vitrine, o caminho vira cartão no **Menu**, em "Seu conteúdo"). ⚠️ **A, se ele escolher o A:** duas linhas caem no seu colo — o cartão novo no `PainelDaComunidade.tsx` e tirar a porta do `UserProfile.tsx`; não entro nesses dois enquanto o seu trabalho estiver por commitar. ⚠️ **A, dois recados:** (1) **há 4 linhas minhas dentro do seu `You.tsx` não commitado** — a linha do painel virou `label: "Perfil e privacidade"`, com comentário citando a §4.105; deixei o arquivo **fora do meu commit** porque o diff está com as suas 89 linhas dentro, então ele sobe no seu; (2) a tela `/privacidade` agora se chama **"Perfil e privacidade"** e mostra a lista inteira (foto/bio, o que a página mostra, conta privada, sino) — a rota não mudou. ⚠️ Avisos da tarefa anterior: `Grupo.tsx`/`Topico.tsx` NÃO mudaram (estrutura Orkut RECONFIRMADA em 05/08) e `lib/grupos.ts` ganhou 14 comunidades semeadas (16 → 30). | `client/public/_pedir-sem-credito-A.html` | não | 06/08 |
| C · voz `pf_dora` · aba 🟣 | — livre — (última tarefa: mostrei ao Matheus **o pedido para te seguir** chegando; discussão encerrada **sem mudança de código**, §4.109 — o pedido tem quatro lares e um deles é permanente, a aba "Pedidos" em `/seguidores`). ⚠️ **No navegador dele o estado mudou:** `contaPrivada` ligada e `allbook_seguidores` limpo (o marcos-v estava aceito e voltou à fila) — se uma tela sua depender de seguidor aceito, é isto. Avisos antigos: livro novo no `books.ts` pede sinopse em `lib/sinopses.ts`; `components/sala/SalasAoVivoNoFeed.tsx` órfão. | — | não | 05/08 |

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
