# Coordenação entre duas janelas do Claude Code

> **Por que este arquivo existe.** O Matheus costuma trabalhar com **duas janelas
> do Claude Code abertas ao mesmo tempo, na mesma pasta do projeto**. Como as duas
> mexem nos mesmos arquivos e no mesmo git, elas podem se atropelar: uma edita o
> que a outra está escrevendo, as duas sobem o servidor na mesma porta, ou uma faz
> commit levando junto o trabalho pela metade da outra. Este documento é o
> **combinado** que as duas seguem para isso não acontecer. Ele é lido no começo de
> cada sessão (o `CLAUDE.md` aponta para cá).

---

## O quadro de trabalho (leia e atualize sempre)

**A janela se registra sozinha — o Matheus não cola frase nenhuma.** Na primeira
tarefa de cada sessão, antes de mexer em qualquer arquivo, **leia a tabela abaixo**,
veja qual faixa está livre e **escreva a sua linha** assumindo essa faixa. Se as
duas estiverem livres, pegue a que combina com a tarefa pedida; se você é a única
janela aberta, assuma a Janela A. Ao terminar ou trocar de tarefa, **limpe a sua
linha** (volte para "— livre —"). O quadro é a fonte da verdade sobre quem está com
o quê **agora**.

| Janela | Faixa (área que vai tocar) | Arquivos/pasta em uso | Está rodando o servidor? | Atualizado |
|--------|-----------------------------|-----------------------|--------------------------|------------|
| A | **assumida — 31/07 (tarde): PONTE EVENTO ↔ CLUBE + a fila de pedidos do Matheus.** ⚠️ **Esta janela era a C e virou A a pedido dele** ("se identifique como janela A… passa a botar a voz da janela A") — voz `pm_alex`, aba `🟢 JANELA A`. ✅ **PONTE COMMITADA (`9f6ea94`) — `pages/Clube.tsx` está LIVRE para a janela B**, junto com `lib/forumConteudo.ts`, `lib/convitesDeEvento.ts`, `lib/notifications.ts`, `components/forum/ConteudoDaComunidade.tsx`, `pages/Grupo.tsx` e `pages/Notifications.tsx`. ⚠️ **B, leia antes de mexer no clube:** o que entrou lá foi o bloco `EncontrosDoClube` (os eventos de comunidade que apontam para o clube) — e a §4.79 registra por que o encontro do clube **continua sem hora marcada** (§4.39). Não transforme a rodada em evento com data. ✅ **Também commitados e livres:** as enquetes/eventos com destaque + páginas `/forum/:id/enquetes` e `/forum/:id/eventos` (`b33b016` — `lib/forum.ts`, `components/forum/ConteudoDaComunidade.tsx`, as duas páginas novas, `App.tsx`) e a foto do leitor que agora amplia (`48d3813` — `components/AvatarAmpliavel.tsx`, `pages/UserProfile.tsx`). **Nada meu está pela metade.** Antes disso, hoje, já commitado: auditoria (§4.72), descurtir + quem reagiu (§4.73), a aba do fórum inteira (§4.74–§4.78). Aba `🟢 JANELA A` | veja a coluna ao lado | não — serviço launchd sempre no ar | 31/07 (tarde) |
| A (tarefa anterior) | 30/07 (noite): **A ORDEM CENTRAL DA COMUNIDADE (§4.58) FECHOU.** Itens 3, 4, 5 e parte do 6, em cinco commits: compartilhar (com citação), cartões de clube/fórum no feed, a lente Seguindo, os posts no perfil, o curtir no fórum e no mural do clube, e o convite para clube. Toquei em: `lib/posts.ts`, `lib/feedDaComunidade.ts`, `lib/convites.ts`, `lib/curtidas.ts`, `lib/clubes.ts`, `lib/notifications.ts`, `components/comunidade/*`, `components/clube/MuralDoClube.tsx`, `components/layout/TopNav.tsx`, `pages/Community.tsx`, `pages/Profile.tsx`, `pages/UserProfile.tsx`, `pages/Notifications.tsx`, `pages/Topico.tsx`. **Tudo commitado e no GitHub** — nada meu está pela metade. ⚠️ Assumi os arquivos que a linha B declarou de manhã porque o trabalho dela estava commitado (`d70c903`) e a árvore limpa. Aba `🟢 JANELA A` | veja a coluna ao lado | não — serviço launchd sempre no ar | 30/07 (noite) |
| A (tarefa anterior) | 29/07 12:00: **propostas de reorganização do Clube de Leitura** (pedido do Matheus). Só desenho, **zero arquivo do app tocado** — a folha navegável fica em `client/public/_propostas-clube.html` (temporária, fora do git). Se eu for construir depois, declaro aqui os arquivos antes. **Não estou na faixa de seguidores/privacidade** (`Seguidores.tsx`, `You.tsx`, `settings.ts`) — é de outra janela, que commitou `fe5cedc` às 11:57. Aba `🟢 JANELA A` | `client/public/_propostas-clube.html` | não — serviço launchd sempre no ar | 29/07 12:00 |
| B | **assumida — 31/07: O CLUBE DE LEITURA** (pedido do Matheus: "a gente vai tocar a parte do clube de leituras", com uma ideia nova dele). ⚠️ **Atenção, janela A:** você está com `pages/Clube.tsx` modificado e **não commitado** (a ponte evento ↔ clube). **Não encosto nele enquanto estiver assim** — quando commitar, avise pela voz ou limpe da sua linha, porque a minha tarefa é justamente o Clube. Enquanto isso: **desenho só, zero arquivo do app tocado**, em folha solta `client/public/_*.html` com o título `🔵 JANELA B`. Ao construir, declaro aqui os arquivos antes (provável: `lib/clubes.ts`, `components/clube/*`, `pages/Clube.tsx`, `pages/Clubes.tsx`). Aba `🔵 JANELA B` | folha em `client/public/` (a definir) | não — serviço launchd sempre no ar | 31/07 |
| B (tarefa anterior) | 30/07: **CONSTRUINDO O COMPOSITOR** (item 2 da ordem da §4.58: escrever + anexar + pergunta + menção com `@`). Em uso agora: `lib/posts.ts`, `components/comunidade/*` (Compositor, TextoDoPost, CartaoDePost, AcoesDoPost), `pages/Community.tsx`. Antes (29/07 noite, já commitado): o cartão do post, `lib/curtidas.ts`, `lib/mural.ts`, `lib/community.ts`. Já commitados por mim hoje: `Seguidores.tsx`, `Privacidade.tsx`, `You.tsx`, `Profile.tsx`, `Notifications.tsx`, `TopNav.tsx`, `lib/seguidores.ts`, `lib/settings.ts`, `App.tsx`. **Não toco em nada de clube** (`lib/clubes.ts`, `pages/Clube*.tsx`, `components/clube/*`) — é da janela A; só **leio** de lá (`meusClubes`, `clubePorId`). Aba `🔵 JANELA B` | veja a coluna ao lado | não — serviço launchd sempre no ar | 30/07 |
| B (sessão anterior) | 🔚 **encerrada em 28/07 (noite); tudo commitado e no GitHub — TODOS os meus arquivos estão LIVRES.** **Para quem pegar daqui:** (1) o dia da B está na **§4.41 do ROTEIRO** (página pública + painel `/you` + `/achievements`, separação avaliação×conversa, Mural, Grupos com criar, Comunidade em 3 abas Mural·Grupos·Pessoas, privacidade da vitrine, conversa com endereço `/book/:id/conversa`); (2) **pendências anotadas na 4.41**: tópico de Grupo mencionando livro, Grupos/posts na página pública de membro, moderação de tópico; (3) ✅ **FEITO em 28/07 pela A** (era: `ConversaDoTrecho.tsx:168` → apontar para `/book/${bookId}/conversa`). Ficou parado até o Matheus notar sozinho que o link caía na sinopse — ver ROTEIRO §4.51. **Recado enterrado em célula de tabela não vira trabalho:** quem pedir algo à outra janela, peça também que ela registre no ROTEIRO ou avise pela voz; (4) folhas `_proposta-*.html`, `_sintese-*.html` e `_4-propostas-*.html` em `client/public/` são temporárias, fora do git — podem apagar; (5) a A já entrou em `comments.ts`/`CommentThread.tsx` (citação de áudio, 4.43) DEPOIS de eu liberar — estão com ela. Aba `🔵 JANELA B` | — livre — | não — serviço launchd sempre no ar | 28/07 |
| C | 🔚 **encerrada em 31/07 — virou a Janela A** (pedido do Matheus, para não esbarrar na B). Tudo o que está abaixo foi commitado; a linha A no topo é a continuação desta. Era: **AUDITORIA DA COMUNIDADE** (pedido do Matheus: *"tem muita coisa que era pra ser tirada e não foi, e muita que era pra ser colocada e não foi"*). Conferi §4.53–§4.58 contra o código e registrei o resultado no **ROTEIRO §4.72**. Por ora só toquei em `docs/ROTEIRO.md` e neste arquivo — **zero arquivo do app**. Depois construí o **descurtir + quem reagiu** (ROTEIRO §4.73), tocando em: `lib/curtidas.ts`, `components/comunidade/{Reacoes,QuemReagiu,AcoesDoPost,ComentariosDoPost}.tsx` (o `BotaoDeCurtir.tsx` **foi apagado** — virou `Reacoes.tsx`), `components/clube/MuralDoClube.tsx`, `pages/Topico.tsx` e `components/CommentThread.tsx`. ⚠️ Este último era faixa da A; entrei porque a árvore estava limpa e o trabalho dela commitado (`942da86`) — mexi **só** na função `Acoes` (o número virou botão). Tudo commitado. Ainda por construir da auditoria: menu "…" da Comunidade, responder pergunta com livro + melhor resposta, notificação de curtida agrupada. Aba `🟣 JANELA C` | veja a coluna ao lado | não — serviço launchd sempre no ar | 31/07 |
| C (tarefa anterior) | 28/07: **duelo de protótipos, combinado com o Matheus**: eu (C) e a B construímos, cada uma, a nossa Comunidade **fora do app** (páginas soltas em `client/public/`, fora do git); ele orienta as duas em paralelo, escolhe a melhor e só a vencedora vai para o código de verdade. O meu protótipo navegável: `client/public/_comunidade-C.html` (o Correio + "próxima dupla"; clicável, dados fictícios, **zero arquivo do app tocado**). O leque de 6 propostas que o originou: `_propostas-comunidade-C.html`. `Community.tsx` e libs seguem da B. Aba `🟣 JANELA C` | `client/public/_comunidade-C.html`, `client/public/_propostas-comunidade-C.html` | não — serviço launchd sempre no ar | 28/07 |

> Use "Janela A" e "Janela B" só como apelido. Se abrir uma terceira, acrescente a
> linha "C". A hora ("Atualizado") ajuda a saber se uma linha ficou esquecida —
> linha velha de horas atrás pode ser limpa.

---

## As regras

### 1. Cada janela numa faixa diferente
O jeito mais seguro de não colidir é **não trabalhar no mesmo lugar**. Divida por
área. Divisão sugerida (ajuste conforme a tarefa, mas registre no quadro):

- **Faixa da tela / frontend** → `client/` (as telas, componentes, estilos).
- **Faixa de dados / servidor** → `server/`, `shared/`, `script/`.

Se as duas precisam mexer em telas ao mesmo tempo, divida por **tela**: uma janela
na tela Descobrir, outra no Perfil — e cada uma declara no quadro os arquivos dela.

### 1.1 Abra o app com a sua letra: `?janela=A`

Todas as abas do Chrome se chamavam "localhost" e mostravam a mesma tela — não
dava para saber qual janela do Claude tinha aberto qual aba. Desde 27/07 o
próprio app resolve isso: **abra `http://localhost:3000/?janela=A`** (ou `B`, ou
`C`) e aquela aba passa a se identificar em três lugares:

- o **nome da guia** vira `🟢 JANELA A — AllBook`;
- uma **pastilha colorida** aparece na barra de desenvolvimento, no alto;
- uma **marca d'água** grande fica no fundo, ao lado da moldura do telefone.

Cores: **A verde · B azul · C roxo**. A letra fica guardada no `sessionStorage`,
que é por aba — sobrevive a recarregar e a navegar pelo app, e **não** contamina
as outras abas. Só passe o `?janela=` uma vez, na primeira abertura.

Nada disso aparece no app publicado nem no celular (é `import.meta.env.DEV`), e
nenhuma das marcas encosta na tela do app — todas vivem na área de
desenvolvimento em volta. Código em `client/src/components/DevJanela.tsx`.

**A mesma letra vale para as folhas soltas em `client/public/`** (as maquetes
`_comparacao-*.html`, que não passam pelo app e portanto não têm o `DevJanela`).
Pedido do Matheus em 28/07, depois de abrir uma aba que dizia "JANELA A" numa
conversa com a B: **toda folha nova nasce com a letra de quem a escreveu no
`<title>`** — `🔵 JANELA B — Comunidade: …`. Quem só *abre* a folha de outra
janela não muda o título: ele diz quem **desenhou** aquilo, e isso é a
informação útil. Ao abrir o app em si, use sempre `?janela=<sua letra>`.

### 2. Nunca edite um arquivo que a outra janela declarou
Se o arquivo que você precisa está na faixa da outra janela, **não edite por cima**.
Opções, nesta ordem: (a) faça a sua parte em outro arquivo; (b) escreva no quadro
que você precisa daquele arquivo e espere a outra liberar; (c) se for urgente,
avise o Matheus para ele coordenar. O que **não** pode é as duas salvarem o mesmo
arquivo sem saber uma da outra — foi assim que o conflito aconteceu.

### 3. Só uma janela roda o servidor (porta 3000) — mas as duas verificam nele
`npm run dev` e `npm run dev:client` ocupam a porta 3000. **Só uma janela sobe o
servidor** — marque "sim" na coluna do quadro. Se as duas subirem, a segunda dá
erro de porta ocupada ou rouba a porta da primeira.

**Isso não impede a outra janela de testar.** O servidor do Vite recarrega o app
sozinho a cada arquivo salvo (hot-reload), então **as duas janelas verificam no
mesmo app rodando** — basta abrir `http://localhost:3000` no navegador (ferramentas
Claude-in-Chrome) e conferir a própria mudança ali. Quem não subiu o servidor
**não liga um segundo**; apenas olha o app que já está no ar. O Matheus costuma
deixar o app aberto no Chrome dele na porta 3000 — dá para testar direto nele.

Além do teste visual, use `npm run check` (verifica tipos, não precisa de porta)
antes de commitar.

### 4. Commit e push com cuidado — o hook empurra sozinho
O hook `post-commit` faz **push automático para o GitHub a cada commit**. Com duas
janelas isso exige disciplina, senão vira bagunça:

- **Nunca use `git add -A`, `git add .` ou `git commit -a`.** Eles varrem *tudo* que
  mudou na pasta — inclusive o trabalho pela metade da outra janela — e sobem junto.
  **Adicione só os arquivos da sua faixa, um a um:** `git add client/src/pages/Perfil.tsx`.
- **Escolher o arquivo certo não basta: leia o `git diff` dele antes de adicionar.**
  Armadilha real, em 26/07: o `AudioPlayer.tsx` estava na faixa B, mas **dentro do
  mesmo arquivo** havia trechos da janela A (um componente novo que ela ainda não
  tinha adicionado ao git). Commitar aquele arquivo teria subido a chamada do
  componente **sem o componente** — app quebrado no GitHub, e a culpa apareceria na
  janela errada. Git separa por arquivo, não por trecho; quando duas janelas mexem na
  mesma tela, o arquivo é território comum. **O que fazer:** rodar
  `git diff <arquivo>` e conferir se cada bloco é seu. Se houver trecho alheio, deixe
  o arquivo de fora, commite o resto, e **escreva no quadro** que aquele arquivo tem
  as duas mãos dentro — a outra janela commita o conjunto inteiro e o seu trecho vai
  junto (foi o que aconteceu; conferido depois no histórico).
- **Antes de commitar, traga o que a outra já subiu:** `git pull --rebase`. Isso
  evita o push ser recusado por a outra janela ter publicado antes de você.
- **Commits pequenos e frequentes.** Quanto menor a janela de tempo entre editar e
  commitar, menor a chance de as duas baterem.
- **Avise no quadro** (ou pela voz) quando for commitar, para a outra não commitar no
  mesmo instante.

### 5. Arquivos gerados e scripts pesados — um de cada vez
`npm run catalogo` e `npm run build` reescrevem arquivos gerados
(`client/src/lib/catalog-enriched.ts`, capas, `dist/`). **Só uma janela roda esses
por vez** — avise no quadro antes. Duas rodando ao mesmo tempo corrompem a saída.

### 6. Ao terminar, limpe a sua linha
Acabou a tarefa ou vai trocar de assunto? Volte a sua linha do quadro para
"— livre —". Linha esquecida faz a outra janela achar que uma área está travada
quando não está.

---

## Resumo em uma frase
**Leia o quadro, escolha uma faixa só sua, não edite o que a outra declarou, só uma
sobe o servidor, e no commit adicione apenas os seus arquivos (nunca `git add -A`).**

---

## Se isto ainda não bastar (opção avançada: worktrees)
Se mesmo assim as janelas se atrapalharem muito, o passo seguinte é dar a **cada
janela a sua própria cópia isolada** do projeto com `git worktree` — aí elas nem
enxergam os arquivos uma da outra, e só se encontram na hora de juntar no GitHub. É
mais robusto, porém mais complexo (pastas separadas, juntar branches depois). Peça
ao Claude para montar isso **só se o quadro acima não resolver** — para o uso do dia
a dia, o combinado deste arquivo costuma bastar.
