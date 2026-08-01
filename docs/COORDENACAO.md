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
| A | **assumida — 31/07 (tarde): PONTE EVENTO ↔ CLUBE + a fila de pedidos do Matheus.** ⚠️ **Esta janela era a C e virou A a pedido dele** ("se identifique como janela A… passa a botar a voz da janela A") — voz `pm_alex`, aba `🟢 JANELA A`. ✅ **PONTE COMMITADA (`9f6ea94`) — `pages/Clube.tsx` está LIVRE para a janela B**, junto com `lib/forumConteudo.ts`, `lib/convitesDeEvento.ts`, `lib/notifications.ts`, `components/forum/ConteudoDaComunidade.tsx`, `pages/Grupo.tsx` e `pages/Notifications.tsx`. ⚠️ **B, leia antes de mexer no clube:** o que entrou lá foi o bloco `EncontrosDoClube` (os eventos de comunidade que apontam para o clube) — e a §4.79 registra por que o encontro do clube **continua sem hora marcada** (§4.39). Não transforme a rodada em evento com data. ✅ **Também commitados e livres:** as enquetes/eventos com destaque + páginas `/forum/:id/enquetes` e `/forum/:id/eventos` (`b33b016` — `lib/forum.ts`, `components/forum/ConteudoDaComunidade.tsx`, as duas páginas novas, `App.tsx`) e a foto do leitor que agora amplia (`48d3813` — `components/AvatarAmpliavel.tsx`, `pages/UserProfile.tsx`). **Nada meu está pela metade.** ✅ **Também commitados:** seguir autor/narrador/editora/Studio (`87e0e5d` — `lib/acompanhando.ts` **novo**, `components/BotaoDeAcompanhar.tsx` **novo**, `pages/Acompanhando.tsx` **novo** em `/acompanhando`, `PersonProfile`, `PublisherProfile`, `Studio`, `Profile`, `Notifications`, `PortasDoPerfil`, `App.tsx`) e a limpeza da tela "Reprodução e download" (`593bb47` — `pages/Settings.tsx` virou **"Neste aparelho"**, `You.tsx`, e ⚠️ **entrei em `pages/AudioPlayer.tsx`**, que era faixa sua, só para o player **salvar a velocidade** que a pessoa escolhe; sua sala ao vivo já estava commitada e nada dela foi tocado). ✅ **Também commitado (`6dbc1ab`) — e este mexe numa peça de todo mundo, B, leia:** `components/ui/toast.tsx`. O X de fechar o aviso vinha do shadcn com `opacity-0 group-hover:opacity-100`, ou seja, **invisível no celular mas ainda clicável**; agora é visível sempre e o alvo passou de 24px para 36px (o cartão ganhou `pr-12`). Muda a aparência de **todos** os avisos do app, não só os do player — se algum toast seu ficar apertado à direita, é isso. Motivo e varredura na §4.86. Antes disso, hoje, já commitado: auditoria (§4.72), descurtir + quem reagiu (§4.73), a aba do fórum inteira (§4.74–§4.78). Aba `🟢 JANELA A` | veja a coluna ao lado | não — serviço launchd sempre no ar | 31/07 (tarde) |
| A (tarefa anterior) | 30/07 (noite): **A ORDEM CENTRAL DA COMUNIDADE (§4.58) FECHOU.** Itens 3, 4, 5 e parte do 6, em cinco commits: compartilhar (com citação), cartões de clube/fórum no feed, a lente Seguindo, os posts no perfil, o curtir no fórum e no mural do clube, e o convite para clube. Toquei em: `lib/posts.ts`, `lib/feedDaComunidade.ts`, `lib/convites.ts`, `lib/curtidas.ts`, `lib/clubes.ts`, `lib/notifications.ts`, `components/comunidade/*`, `components/clube/MuralDoClube.tsx`, `components/layout/TopNav.tsx`, `pages/Community.tsx`, `pages/Profile.tsx`, `pages/UserProfile.tsx`, `pages/Notifications.tsx`, `pages/Topico.tsx`. **Tudo commitado e no GitHub** — nada meu está pela metade. ⚠️ Assumi os arquivos que a linha B declarou de manhã porque o trabalho dela estava commitado (`d70c903`) e a árvore limpa. Aba `🟢 JANELA A` | veja a coluna ao lado | não — serviço launchd sempre no ar | 30/07 (noite) |
| A (tarefa anterior) | 29/07 12:00: **propostas de reorganização do Clube de Leitura** (pedido do Matheus). Só desenho, **zero arquivo do app tocado** — a folha navegável fica em `client/public/_propostas-clube.html` (temporária, fora do git). Se eu for construir depois, declaro aqui os arquivos antes. **Não estou na faixa de seguidores/privacidade** (`Seguidores.tsx`, `You.tsx`, `settings.ts`) — é de outra janela, que commitou `fe5cedc` às 11:57. Aba `🟢 JANELA A` | `client/public/_propostas-clube.html` | não — serviço launchd sempre no ar | 29/07 12:00 |
| B | **assumida — 31/07: OUVIR JUNTO AO VIVO — a sala de cinema para audiolivro** (ideia nova do Matheus para o Clube: transmitir o próprio player, com chat, a dois / aberta / marcada; quem abriu manda). ✅ Vi que você liberou o `Clube.tsx` (`9f6ea94`) — obrigado. ✅ **CONSTRUÍDA POR INTEIRO E COMMITADA** (ROTEIRO §4.81 — as 4 decisões dele + as 6 que apareceram construindo). Toquei em: `lib/salaAoVivo.ts` (**novo**), `pages/SalaAoVivo.tsx` (**novo**, rota `/sala/:id`), `components/sala/*` (**novos**: AbrirSala, FaixaDaSalaNoPlayer, ContinuarDaTurma, RastroDaSessao, SessoesDoClube, SalasAoVivoNoFeed), `App.tsx`, `pages/AudioPlayer.tsx`, `pages/Clube.tsx`, `pages/Community.tsx`, `components/ConversaDoTrecho.tsx`. ⚠️ **Janela A, dois avisos:** (1) mexi na função `EncontrosDoClube` do `Clube.tsx` — ela agora lista **evento de comunidade + sessão de escuta na mesma agenda**, ordenados por data, porque havia duas listas de coisa-com-hora na mesma tela (a §4.79 tinha previsto esse defeito); nada da sua ponte foi removido; (2) entrei em `Community.tsx` e `ConversaDoTrecho.tsx` só para **acrescentar** um componente meu, sem tocar no resto. Tudo passa no `npm run check` e foi testado no navegador de ponta a ponta. 🔨 **SEGUNDA LEVA EM CURSO (31/07, noite):** ele auditou e achou 8 coisas ditas e não construídas; estou construindo todas. ⚠️ **Declaro agora, janela A:** `lib/clubes.ts` (privacidade, pedidos de entrada, banir, clube ao vivo), `pages/GerenciarClube.tsx`, `pages/NovoClube.tsx`, `pages/Clube.tsx`, `lib/salaAoVivo.ts`, `components/sala/*`, `lib/notifications.ts` (aviso de sala) e `pages/Notifications.tsx`. Se precisar de algum deles, me avise. ✅ **AS 8 LACUNAS + AS ABAS ESTÃO PRONTAS E COMMITADAS** (ROTEIRO §4.82). O clube foi reorganizado em **4 abas** (Agora · Conversa · Encontros · Estante) — decisão dele, e resolve o defeito de escala que a §4.57 media desde 29/07: a rolagem caiu de ~3,5 telas para 1,9. ⚠️ **Janela A, isto mexe na estrutura de `pages/Clube.tsx`:** as seções continuam as mesmas (nada foi removido), só passaram a viver dentro de uma aba cada. Se você for acrescentar alguma coisa ao clube, escolha a aba pelo critério da tabela na §4.82. ⚠️⚠️ **JANELA A, ENTREI NA SUA FAIXA DE FÓRUM — leia:** o Matheus reclamou na tela da comunidade que *"não tem uma página onde abríssemos todos os tópicos"*. Você tinha feito a de **enquetes** e a de **eventos** (§4.78), e a de **tópicos** faltava. Fiz: `components/forum/TopicosDoForum.tsx` (**novo, meu** — a tabela saiu de dentro do `Grupo.tsx` para cá, com `modo="resumo" | "todos"`), `pages/TopicosDaComunidade.tsx` (**novo**, rota `/forum/:id/topicos`) e **duas linhas** no `pages/Grupo.tsx` (o bloco 5 virou `<Topicos grupoId={id} />`). **Nada foi removido** — a tabela é a mesma, com os mesmos poderes de moderador. Entrei porque a sua árvore estava limpa e o seu trabalho commitado; se atrapalhar, me avise. Também entrei em `lib/clubes.ts` (privacidade/banir/aoVivo), `GerenciarClube.tsx`, `NovoClube.tsx`, `lib/notifications.ts` (5º destino: `salaId`) e `pages/Notifications.tsx`. Folha navegável em `client/public/_sala-ao-vivo-B.html` (fora do git) com 4 propostas; a apuração e as 4 decisões em aberto estão no **ROTEIRO §4.81**. ⚠️ **Se ele escolher e eu for construir**, os arquivos prováveis são `pages/AudioPlayer.tsx`, `lib/sala.ts`, `lib/playback.ts`, um `lib/salaAoVivo.ts` novo, `components/clube/*` e `pages/Clube.tsx` — declaro aqui antes de encostar. ✅ **A PÁGINA DE TÓPICOS, REFEITA POR INTEIRO — commitada (`5529b02` + `1033d0e`), ROTEIRO §4.91.** Ele reprovou a versão da manhã (*"só expande, e não faz sentido"*) e pediu capa nos tópicos. Toquei em: `lib/grupos.ts` (capa por livro ou imagem, última fala, participantes, **+17 tópicos semeados** — de 19 para 36), `components/forum/Pecas.tsx` (peças novas `CapaDoTopico` e `CartazDoTopico`; **não encostei na `CapaDaComunidade` nem no resto**), `components/forum/TopicosDoForum.tsx`, `components/forum/NovoTopico.tsx` (**novo**), `components/forum/EscolherCapa.tsx` (**novo**), `pages/TopicosDaComunidade.tsx`, `pages/Topico.tsx` (só o cartaz no topo do fio + "trocar capa"; o fio numerado do Orkut ficou **intacto**), `pages/Grupo.tsx` (uma linha de comentário). ⚠️ **Janela A, dois avisos:** (1) **`lib/grupos.ts` e `components/forum/*` estão livres de novo** — nada meu está pela metade; (2) **renumerei seções do ROTEIRO que estavam em duplicata**: §4.82/§4.83/§4.84 tinham dois donos (você e eu, no mesmo dia). **As suas ficaram onde estavam**; as minhas viraram **§4.89** (abas do clube) e **§4.90** (a primeira página de tópicos), e ajustei só as referências em `AbasDoClube.tsx`, `Clube.tsx`, `SessoesDoClube.tsx` e `Grupo.tsx`. ✅ **AS 6 PENDÊNCIAS DA COMUNIDADE ESTÃO PRONTAS E COMMITADAS** (§4.92 — `e8474fe`, `043caa8`, `57fab2f`). Ele escolheu as variantes numa folha desenhada (`client/public/_pendencias-comunidade-B.html`, fora do git) e mandou construir todas. Entrou: o **menu “…”** da Comunidade (`components/comunidade/MenuDaComunidade.tsx`, **novo**); o **topo com uma fileira só** — ⚠️ **apaguei `AbaGrupos` de `pages/Community.tsx`, 129 linhas de código morto** que nunca eram desenhadas desde que os fóruns viraram destino (§4.74); **`/forum/minhas`** (`pages/MinhasComunidades.tsx`, **novo**, + `Comunidades.tsx` com resumo de 6 e link, + `App.tsx`); **responder com um livro + melhor resposta** (`lib/melhorResposta.ts` e `components/comunidade/EscolherLivro.tsx`, **novos**, + `lib/comentariosDePost.ts`, `ComentariosDoPost.tsx`, `CartaoDePost.tsx`); **curtida agrupada no sino** (`lib/avisosDeCurtida.ts`, **novo**, + `Notifications.tsx`, `TopNav.tsx`, `lib/notifications.ts`, `lib/settings.ts`, `pages/Privacidade.tsx`); e o **play do trecho pequeno tocando ali** (`components/CitacaoDeAudio.tsx`). ⚠️ **Janela A, três avisos:** (1) **`lib/forum.ts` ganhou `minhasComunidades()`** — fonte única de "quantas comunidades eu tenho"; o menu e a página discordavam (4 x 5). (2) **`lib/settings.ts` ganhou dois campos** (`avisarCurtidas`, `avisarComentarios`) e `lib/notifications.ts` ganhou `avisosQueQueroVer()`, que respeita o segundo — quem ler avisos deve usar essa, não `readNotifications()`. (3) **`components/comunidade/CartaoDePost.tsx` troca o selo** de PERGUNTA para RESOLVIDA quando há melhor resposta. **Tudo commitado, nada meu está pela metade.** ✅ **A MENÇÃO PASSOU A DESENHAR O QUE MARCA — commitado (§4.93, 01/08).** Ele achou o defeito na caixa de comentário: *"não precisa ter o botão de responder com o livro, se você já pode simplesmente colocar o @ … mas deveria ter o ícone do livro quando você marca"*. Era a decisão de 30/07 (o `@` é o caminho único) aplicada **só no post**. Entrou `components/comunidade/ObjetoMencionado.tsx` (**novo** — o cartão pequeno de livro/pessoa/clube + a função `resumoDoObjeto`, que saiu de dentro do `PostCitado`); mexi em `ComentariosDoPost.tsx`, `PostCitado.tsx`, `lib/comentariosDePost.ts` (novo `objetoDoComentario`; `comentar()` **perdeu o parâmetro `bookId`**) e `lib/melhorResposta.ts`. ⚠️⚠️ **APAGUEI `components/comunidade/EscolherLivro.tsx`** — o botão "responder com um livro" e a busca dele não existem mais. **Janela C, isto encosta na sua auditoria de nomes:** se alguma das suas decisões D1–D22 cita o rótulo *"responder com um livro"*, ele morreu hoje. `tsc --noEmit` limpo; testado no navegador nos três tipos de menção. ✅ **SEGUIDORES NO PERFIL DOS OUTROS — commitado (§4.94, 01/08).** Ele perguntou por que não via o número de seguidores da Juliana; era a §4.56 ("nenhum número social inventado") sobrando valendo só na página dos outros. Entrou `lib/rede.ts` (**novo** — uma relação `segue(a,b)` semeada; as duas listas saem dela) e `pages/RedeDaPessoa.tsx` (**novo** — `/user/:slug/seguidores` e `/user/:slug/seguindo`), + `pages/UserProfile.tsx` (a linha de números) e `App.tsx` (duas rotas, **antes** de `/user/:slug`). ⚠️ **A e C:** `lib/rede.ts` **lê** `following.ts` e `seguidores.ts` e não escreve em nenhum dos dois. ✅ **O LÁPIS DO PERFIL — commitado (§4.95, 01/08).** Ele escolheu numa folha desenhada (`client/public/_editar-perfil-B.html`, fora do git) uma **mescla de A com C**: a folha do C com todos os interruptores do A. Entrou `components/perfil/FolhaDeEditarPerfil.tsx` (**novo**), + `pages/Profile.tsx` (o lápis abre a folha; as portas obedecem), `pages/Privacidade.tsx` (**encolheu** — os 4 interruptores da vitrine saíram de lá e viraram uma placa), `components/PortasDoPerfil.tsx` (`escondida`) e `lib/settings.ts`. ⚠️⚠️ **A e C, três avisos:** (1) **`lib/settings.ts` ganhou `mostrarQuemAcompanho` e `saveSettings` agora dispara `SETTINGS_EVENT`** — quem mostra ajuste deve escutar esse evento em vez de só ler na montagem; (2) **os interruptores "o que aparece na sua página" NÃO estão mais em `/privacidade`** — quem procurar por eles procure na folha do lápis; (3) `mostrarMeusComentarios` e `mostrarMeusClubes` **não eram lidos por código nenhum** até hoje (botões mortos desde a §4.55) — agora valem, e escondem as portas do perfil. Aba `🔵 JANELA B` | `client/public/_sala-ao-vivo-B.html`, `docs/ROTEIRO.md` (§4.81) | não — serviço launchd sempre no ar | 01/08 |
| B (tarefa anterior) | 30/07: **CONSTRUINDO O COMPOSITOR** (item 2 da ordem da §4.58: escrever + anexar + pergunta + menção com `@`). Em uso agora: `lib/posts.ts`, `components/comunidade/*` (Compositor, TextoDoPost, CartaoDePost, AcoesDoPost), `pages/Community.tsx`. Antes (29/07 noite, já commitado): o cartão do post, `lib/curtidas.ts`, `lib/mural.ts`, `lib/community.ts`. Já commitados por mim hoje: `Seguidores.tsx`, `Privacidade.tsx`, `You.tsx`, `Profile.tsx`, `Notifications.tsx`, `TopNav.tsx`, `lib/seguidores.ts`, `lib/settings.ts`, `App.tsx`. **Não toco em nada de clube** (`lib/clubes.ts`, `pages/Clube*.tsx`, `components/clube/*`) — é da janela A; só **leio** de lá (`meusClubes`, `clubePorId`). Aba `🔵 JANELA B` | veja a coluna ao lado | não — serviço launchd sempre no ar | 30/07 |
| B (sessão anterior) | 🔚 **encerrada em 28/07 (noite); tudo commitado e no GitHub — TODOS os meus arquivos estão LIVRES.** **Para quem pegar daqui:** (1) o dia da B está na **§4.41 do ROTEIRO** (página pública + painel `/you` + `/achievements`, separação avaliação×conversa, Mural, Grupos com criar, Comunidade em 3 abas Mural·Grupos·Pessoas, privacidade da vitrine, conversa com endereço `/book/:id/conversa`); (2) **pendências anotadas na 4.41**: tópico de Grupo mencionando livro, Grupos/posts na página pública de membro, moderação de tópico; (3) ✅ **FEITO em 28/07 pela A** (era: `ConversaDoTrecho.tsx:168` → apontar para `/book/${bookId}/conversa`). Ficou parado até o Matheus notar sozinho que o link caía na sinopse — ver ROTEIRO §4.51. **Recado enterrado em célula de tabela não vira trabalho:** quem pedir algo à outra janela, peça também que ela registre no ROTEIRO ou avise pela voz; (4) folhas `_proposta-*.html`, `_sintese-*.html` e `_4-propostas-*.html` em `client/public/` são temporárias, fora do git — podem apagar; (5) a A já entrou em `comments.ts`/`CommentThread.tsx` (citação de áudio, 4.43) DEPOIS de eu liberar — estão com ela. Aba `🔵 JANELA B` | — livre — | não — serviço launchd sempre no ar | 28/07 |
| C | ✅ **OS NOMES NOVOS ESTÃO APLICADOS E COMMITADOS (01/08) — TODOS os meus arquivos estão LIVRES.** Registro completo na **§4.94 do ROTEIRO**, inclusive a régua nova que ele ditou em duas correções ao vivo: **padrão de mercado ganha de consistência interna** ("Remover" e não "Tirar"; "Reproduzir" e não "Ouvir" no play). ⚠️ **A e B, rótulos que vocês citam podem ter mudado:** "Acompanhando"→"Seguindo", "pauta"→"votação", "marco"→"etapa", "Admitir"→"Aceitar", "editar comunidade"→"gerenciar comunidade", "cobrir/marcar spoiler"→"marcar como spoiler", "Soneca"→"Dormir", "marcação"→"nota", "/settings" chama-se "Neste aparelho" em todo lugar. Nada estrutural: funções, rotas e testids intactos. (Tarefa anterior desta linha: a folha clicável + a rota `POST /api/folha/respostas`, que ficam para as próximas folhas.) ("aplique o que você acha mais correto… para quem vê pela primeira vez"). É uma varredura de **rótulos visíveis** (textos, aria-labels, toasts) em ~35 arquivos de `client/src` — **nada estrutural**: nenhum componente renomeado, nenhuma rota mudada, código interno intacto. ⚠️ **Declaro (A e B, me avisem se precisarem):** `pages/{AudioPlayer,BookDetails,Library,Downloads,Home,Bookmarks,You,Help,Settings,Trechos,Search,NovoClube,RecommendationsEdit,ProfileEdit,Acompanhando,Profile,Seguidores,GerenciarClube,GerenciarForum,Grupo,Topico,TopicosDaComunidade,MinhasComunidades,Perguntas,Community,Notifications,SalaAoVivo,Clubes,Clube}.tsx`, `components/{BarraDeAcoesDoPlayer,BookActionsMenu,BuscaSobreposta,MarcacoesDoLivro,EditarTrecho,AnexarTrecho,BotaoDeAcompanhar,CommentThread}.tsx`, `components/layout/TopNav.tsx`, `components/clube/{MuralDoClube,EditorDeMarcos,PautaNoClube}.tsx`, `components/comunidade/{CartaoDePost,CartaoDeSugestoes}.tsx`, `components/sala/PessoasNaSala.tsx`. Registro final na **§4.94 do ROTEIRO**. A base anterior desta linha (a folha + a rota de respostas) segue valendo. Ele recusou a 1ª versão (só leitura) e pediu **clicar + enviar**; a folha agora tem Sim/Não por decisão, rodapé com contagem e botão Enviar. ⚠️ **A e B: criei a primeira rota real da API** — `POST /api/folha/respostas` em `server/routes.ts` (commitada): qualquer folha de proposta pode enviar as escolhas dele, que viram `_respostas-de-folhas/<folha>.json` na raiz (fora do git e do watch do Vite). Reiniciei o serviço launchd para carregá-la; testada de ponta a ponta no Chrome. Varri todas as páginas e componentes (≈60 arquivos) e a folha `client/public/_nomes-dos-botoes-C.html` (temporária, fora do git) traz **22 decisões numeradas** (D1–D22): unificar apagar/tirar/remover, Aceitar em vez de Aprovar/Admitir, Seguindo em vez de Acompanhando, Buscar em tudo, Ouvir em vez de Reproduzir, um nome só para `/settings`, nota em vez de marcação, Downloads→Baixados, Veloc.→"1,0×", Soneca→Dormir, e o dialeto minúsculo do fórum (recomendo manter). **Zero arquivo do app tocado.** Quando ele decidir, a aplicação vai encostar em arquivos da faixa B (`Community.tsx`, `comunidade/*`) — combino aqui antes. Voz `pf_dora`. Aba `🟣 JANELA C` | `client/public/_nomes-dos-botoes-C.html`, `docs/COORDENACAO.md` | não — serviço launchd sempre no ar | 01/08 |
| C (tarefa anterior) | ✅ **FAXINA — SEGUNDA PASSADA CONCLUÍDA e commitada — 31/07 (noite, mais tarde); TODOS os meus arquivos estão LIVRES.** Ele perguntou *"não tem mais nada pra ser limpo?"* — tinha: os 8 exports adiados caíram (as libs de clube/fórum saíram de obra), 41 sobras de imports/variáveis em 16 arquivos (achadas com `tsc --noUnusedLocals`, que o check normal não roda — lição na §4.88), e **10 dependências desinstaladas** do `package.json` (fuse.js, date-fns, postcss, autoprefixer, ws…; o time do backend futuro **ficou**, é stack documentada). ⚠️ **A e B: rodem `npm install` na próxima sessão** — o `package-lock.json` mudou. Verificação: check limpo, tsc apertado zero avisos, porta 3000 respondendo. Detalhe completo na **§4.88, "Segunda passada"**. Primeira passada: `2253941`. Balanço e critério no **ROTEIRO §4.88**: 13 folhas mortas apagadas de `client/public/` (cópia no scratchpad da sessão C; ficaram as 3 vivas — pontes §4.87 e a da sala da B), 17 exports mortos cortados em 12 libs, e `MuralDaComunidade.tsx` virou `components/ItemDoFeed.tsx` (só a peça viva; imports de `UserProfile` e `Comentarios` ajustados). **Testes: não existem no projeto — nada a deletar.** ⚠️ Deixei de fora de propósito exports mortos em `clubes.ts`/`salaAoVivo.ts` (faixa da B) e `forum.ts`/`forumConteudo.ts`/`grupos.ts` (fórum em obra durante a faxina) — a lista de quem for limpar depois está na §4.88, junto com 3 mortas que parecem lacunas de produto. `npm run check`: meus arquivos limpos; o único erro era o `modo` do `TopicosDoForum`, trabalho em andamento de outra janela. Voz `pf_dora`. Aba `🟣 JANELA C` | — livre — | não — serviço launchd sempre no ar | 31/07 (noite) |
| C (sessão anterior) | 🔚 **encerrada em 31/07 — virou a Janela A** (pedido do Matheus, para não esbarrar na B). Tudo o que está abaixo foi commitado; a linha A no topo é a continuação desta. Era: **AUDITORIA DA COMUNIDADE** (pedido do Matheus: *"tem muita coisa que era pra ser tirada e não foi, e muita que era pra ser colocada e não foi"*). Conferi §4.53–§4.58 contra o código e registrei o resultado no **ROTEIRO §4.72**. Por ora só toquei em `docs/ROTEIRO.md` e neste arquivo — **zero arquivo do app**. Depois construí o **descurtir + quem reagiu** (ROTEIRO §4.73), tocando em: `lib/curtidas.ts`, `components/comunidade/{Reacoes,QuemReagiu,AcoesDoPost,ComentariosDoPost}.tsx` (o `BotaoDeCurtir.tsx` **foi apagado** — virou `Reacoes.tsx`), `components/clube/MuralDoClube.tsx`, `pages/Topico.tsx` e `components/CommentThread.tsx`. ⚠️ Este último era faixa da A; entrei porque a árvore estava limpa e o trabalho dela commitado (`942da86`) — mexi **só** na função `Acoes` (o número virou botão). Tudo commitado. Ainda por construir da auditoria: menu "…" da Comunidade, responder pergunta com livro + melhor resposta, notificação de curtida agrupada. Aba `🟣 JANELA C` | veja a coluna ao lado | não — serviço launchd sempre no ar | 31/07 |
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
