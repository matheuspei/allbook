# AllBook — Estado Atual e Roteiro

_Documento vivo. Atualizado em 21/07/2026 (tarde). Serve de "mapa" pra continuar o projeto entre sessões._

Repositório: `github.com/matheuspei/allbook` · branch `main` · roda em `localhost:3000`
Pasta local (Mac): `~/Projects/allbook-project` (saiu de `~/Downloads` em 24/07: a pasta Downloads não é sincronizada pelo iCloud e é alvo de limpeza) · atalhos no terminal: `allbook` (abre) e `allbook-r` (retoma conversa)

---

## 0. Decisões já tomadas com o Matheus
- **Estratégia: terminar TODO o frontend (as "vitrines") primeiro**, depois o motor (backend, áudio).
- **Fonte da verdade = a cópia local do Matheus;** GitHub é o espelho. Commit + push a cada etapa.
- **Documentação agora também versionada no repositório:** `CLAUDE.md` (guia técnico, fundido com o antigo em inglês) e `docs/ROTEIRO.md` (cópia deste roteiro) já estão no GitHub. Este documento no Cowork segue sendo o "cérebro" editável e acessível no celular.
- **Sincronização conferida (21/07):** local e GitHub idênticos.

---

## 1. O que o AllBook é HOJE
Uma **maquete de alta fidelidade** (5 telas), mas com livros fixos no código, sem áudio real, backend vazio e banco não usado.
- Telas existentes: Início, Biblioteca, Detalhes do Livro, Player, Estatísticas.
- Player (`/player/:id`) é **tela cheia** e esconde os menus; MiniPlayer flutua acima do menu nas outras rotas.
- Biblioteca do usuário é salva no **localStorage**; busca é **client-side (Fuse.js)** sobre o catálogo fixo.
- Git: 5 commits antigos (05/03) + agora os commits de documentação (21/07).

### Stack
React 19, Vite, Tailwind v4, shadcn/ui, Framer Motion, Wouter, Fuse.js, TanStack Query. Backend: Express 5, Passport, Drizzle + PostgreSQL (preparado, sem uso). Pastas `client/`, `server/`, `shared/` — não reorganizar.

---

## 2. Onde a gente quer chegar
App que armazena muitos audiolivros, inspirado em Audible/Storytel + Netflix/HBO.

---

## 3. FOCO ATUAL — Terminar o frontend

Checklist das telas que faltam:
- [x] **Descobrir / Explorar** — PRONTA (21/07). Rota `/discover`, com busca, grade de 8 gêneros, Top 10 e Lançamentos.
- [x] **Perfil** — PRONTA (21/07). Rota `/profile`. Cabeçalho com foto/nome/bio,
  faixa de 4 números que abrem painel animado, conquistas discretas, fileira de
  recomendações e lista de conta. Edição em `/profile/edit` (foto redimensionada
  para 256px antes de ir ao localStorage, nome, bio de 160 caracteres).
- [x] **Downloads** — PRONTA (21/07). Rota `/downloads`. Lê `allbook_downloads`,
  que o botão "Baixar" do `BookDetails` já gravava sem ninguém ler.
- [x] **Notificações** — PRONTA (21/07). Rota `/notifications`, avisos de exemplo
  apontando para livros do catálogo, com lidas e não lidas.
- [x] **Comunidade** — REFEITA em 21/07 (noite). Deixou de ser um diretório de
  nomes e passou a ser "o que andou acontecendo entre quem você segue". Rotas
  `/community` e `/user/:slug`, mais `/profile/recommendations`. Ver "Decisões da
  Comunidade" abaixo — a primeira versão foi rejeitada pelo Matheus.
- [x] **Login / Cadastro** — PRONTA (21/07). Rota `/login`, tela cheia (sem menus,
  como o player). Uma tela só, alternando entre "Entrar" e "Criar conta".
  Sessão em `client/src/lib/auth.ts`. Ver as decisões abaixo.
- [x] **Configurações** — PRONTA (21/07). Rota `/settings`, chegando pelo Perfil.
  Só o que o app obedece de verdade: velocidade inicial do player, o que está
  guardado neste navegador (com faxina) e a conta. Ver as decisões abaixo.
- [x] **Busca (tela própria)** — PRONTA (24/07). Rota `/search`, tela cheia (sem
  menus, como o player). A lupa do TopNav, a barra da Descobrir e a lupa da
  Biblioteca levam a ela. Fonte única em `components/SearchResults.tsx`. Ver a
  decisão "Busca ganhou endereço próprio" abaixo.
- [x] **Categoria / Gênero** — PRONTA (21/07). Rota `/category/:slug`. É o destino do
  link de gênero na tela do livro e dos cartões coloridos da Descobrir, que antes
  filtravam na própria tela (o `TODO` do `Discover.tsx` saiu com isso).
- [x] **Autor / Narrador** — PRONTA (21/07). Rota `/person/:slug`, uma tela só para os
  dois papéis (quem escreve pode narrar). Avatar gerado a partir do nome, com foto real
  entrando sozinha se o arquivo for posto em `client/src/assets/images/people/`.
  Para isso o catálogo ganhou o campo `narrator` e cresceu de 38 para 59 títulos —
  perfil de autor com um livro só não mostrava nada.
- [x] **Planos / Assinatura → virou "Meu acesso"** (`/plans`, 24/07). Por decisão
  do Matheus, a tela **não fala de preço nem de plano pago** e **não insinua
  cobrança futura** — ele não quer expor a estratégia nem criar ansiedade. Ela só
  celebra, no presente, o que a pessoa já tem (catálogo, player, listas, downloads,
  comunidade, sem anúncios). O item do Perfil "Plano e assinatura" virou "Meu
  acesso" (ícone de cartão saiu, puxava pra pagamento). Modelo de negócio segue em
  aberto (ver "Modelo de negócio e a função central" acima). O selo "Premium" do
  topo do Perfil **foi removido** (24/07, a pedido do Matheus) pelo mesmo motivo —
  sinalizava plano pago; a constante `PLAN` saiu junto.
- [ ] Boas-vindas (onboarding)
- [x] **Ligar Estatísticas ao menu** — feito: já estava no TopNav e agora também no
  Perfil. O cabeçalho que colidia com o TopNav ao rolar foi corrigido.

### Modelo de negócio e a função central (24/07) — visão do Matheus, ainda em aberto

Registro da visão que o Matheus contou nesta data. **Não é decisão fechada** — ele
mesmo disse que ainda não sabe "como oferecer isso ao público". Fica aqui para não
se perder e para a tela de Planos **não inventar números** que ele não decidiu.

**A função que "muda tudo" (livro sob demanda com IA):** o usuário escolhe
**qualquer** livro. Se ainda não existe em áudio — ou não está na plataforma —, o
AllBook busca o texto e **gera a narração/dublagem inteira com inteligência
artificial**. Na prática, o catálogo passa a ser "qualquer livro que a pessoa
quiser", não só os que já foram gravados. É a ideia central do app na fase inicial.

**Modelo pensado (começo):**
- **Gratuito** pelo menos até os primeiros **200 a 500 usuários** — fase de tração,
  sem cobrar.
- Depois, um **plano comum** que já inclui a função — por exemplo, escolher **1
  livro por mês** para ser narrado sob demanda.

**Em aberto (falta antes de uma tela de Planos definitiva):** preço do plano, nome,
se há teste grátis, e principalmente *como* a narração por IA é oferecida e
limitada. Enquanto isso não fecha, a tela de Planos deve refletir a fase real
(**app gratuito agora**) e, no máximo, antecipar a função como "o que vem" — sem
preço inventado.

### Estilo: evitar a "cara de IA"
A primeira versão do Perfil foi rejeitada por parecer gerada automaticamente. Os
três culpados: **ícone com gradiente colorido diferente por linha**, **cada opção
dentro do próprio cartão**, e **gamificação em destaque**. O que funciona:
lista corrida com divisórias finas, ícone monocromático, cor da marca reservada.
Começar sóbrio ao criar tela nova. (A tela de Estatísticas ainda tem os cartões
coloridos antigos — candidata ao mesmo tratamento.)

Ordem: **Descobrir → Perfil → Login/Cadastro → Configurações → Busca → Categoria → Autor → Planos → Onboarding.**

### Conteúdo definido da tela Descobrir (rota `/discover`)
Tela de EXPLORAR o catálogo (diferente da Início). De cima pra baixo:
1. Barra de busca no topo (reaproveitar Fuse.js da Home).
2. "Navegar por gênero" — grade de cartões coloridos (2 colunas): Ficção Científica, Romance, Terror, Mistério, Negócios, Biografia, Autoajuda, Produtividade.
3. "Top 10 da semana" — fileira horizontal numerada (estilo Netflix).
4. "Lançamentos" — fileira horizontal de capas.
Dados: usar os fixos existentes + capas de gênero. Sem backend. Coleções por tema/humor ficaram de fora por ora.

### Decisões da tela de Login (21/07)

- **O app NÃO é trancado atrás do login.** Dá para explorar tudo sem conta, e a
  tela tem um botão "Explorar sem conta". Um muro na porta de entrada é o que
  mais afasta gente num app de catálogo, e hoje não há nada de verdade para
  proteger (sem servidor, sem áudio, sem cobrança). **Rejeitado por ora:**
  redirecionar quem não tem sessão para `/login`. Quando houver assinatura, o
  muro deve ficar no **player**, não na entrada.
- **A senha nunca é guardada** — nem no `localStorage`. Não há o que conferir,
  então ela não serviria para nada, e senha em texto puro no navegador é o tipo
  de atalho que ninguém lembra de desfazer depois. Só nome, e-mail e data entram
  em `allbook_auth`.
- **Sair não apaga biblioteca, downloads nem recomendações.** Neste protótipo
  essas listas são *do navegador*, não *da conta*; apagá-las faria a pessoa
  perder o que montou por ter clicado em "Sair". Só o perfil volta ao padrão.
- **Uma tela só para entrar e cadastrar**, alternando por um link, em vez de duas
  rotas. São os mesmos dois campos; separar dobraria o código sem ganho.
- **Login social (Google/Apple) ficou de fora**, e não é só falta de backend:
  botão de rede social que não faz nada é justamente o enfeite que dá a "cara de
  IA" que já foi rejeitada no Perfil.
- ~~Pendente: ligar o "Sair da conta" do `Profile.tsx` ao `signOut()`~~ — feito
  em 21/07, na sessão do perfil. Sai com confirmação, e quem não tem sessão vê
  "Entrar ou criar conta" no lugar do "Sair".

### Decisões da Comunidade (21/07, noite) — a primeira versão foi rejeitada

**O que foi rejeitado e por quê.** A Comunidade era uma **lista de nomes**: você
tinha de escolher uma pessoa *antes* de ter qualquer motivo para se importar com
ela. Diretório de estranhos não funciona; o defeito era a ordem das coisas, não a
falta de recursos.

**Premissas que o Claude errou nessa conversa, para ninguém repetir:**
- Os leitores fictícios de `community.ts` **são esqueleto de propósito** — vão
  virar gente de verdade quando houver backend. Argumentar "partida a frio" ou
  "conteúdo falso" contra eles não vale: eles existem justamente para dar o que
  ver enquanto se constrói.
- **Nada de comunidade no Início.** O foco do app é sempre o audiolivro; o social
  é secundário e fica escondido, alcançado pelo Perfil. **Rejeitada** a proposta
  de uma faixa "recomendado por quem você segue" na tela inicial.
- **Não é um feed tipo Instagram/Facebook.** É uma tela de atividade contida, com
  dois tipos de acontecimento e nada de rolagem infinita.

**O desenho aceito:**
- **Seguir** nasce de um encontro, não de um índice: você lê um comentário na
  tela do livro → clica no nome → vê o perfil → segue. O caminho já existia; o
  botão é o que faltava.
- `/community` mostra **quem você segue** e o que essas pessoas andaram fazendo:
  *recomendou um livro* e *comentou num livro*. Só esses dois.
- **Sem seguir ninguém**, a tela mostra **sugestões com motivo** ("recomenda 3
  livros que estão na sua lista") em vez do diretório alfabético.
- **Fundação obrigatória:** o comentário deixou de morar dentro do
  `BookDetails.tsx` (era `{ user: "Beto", text }`, sem dono nem data) e virou
  lista própria em `client/src/lib/comments.ts`, com autor, livro, nota e data.
  Sem isso não existe "o que fulano comentou". É também o formato que o backend
  vai pedir.
- ~~Adiado: responder a comentário (debate)~~ — **feito em 21/07**, logo em
  seguida, a pedido do Matheus. Ver "Respostas" abaixo.

### Curtir e descurtir comentário (21/07, noite) — FEITO

Pedido do Matheus, feito em seguida. Como funciona e por quê:

- **Os dois contam para a ordem, somados.** Decisão do Matheus, corrigindo a
  primeira proposta do Claude: *"curtir e descurtir são tudo engajamento — o
  comentário com mais engajamento vem primeiro"*. Está em `engagementOf`, em
  `comments.ts`. **Rejeitada** a ideia anterior de empurrar o que você
  descurtiu para o fim da *sua* lista.
- **Os dois mostram número.** Decisão do Matheus, também contra a proposta do
  Claude de esconder o contador negativo: *"polêmica engaja — gerar sentimento,
  bom ou ruim, é o que faz a pessoa se interessar"*. Esconder a discordância
  esconde metade da conversa. **Rejeitado:** contador de descurtida invisível,
  pesando só na ordem.
- **Tocar de novo desfaz**; curtir e descurtir são exclusivos entre si.
- **A ordem não é recalculada enquanto você reage** — ver o comentário pular de
  lugar debaixo do dedo desorienta. A ordem nova vale na próxima visita.
- **Risco conhecido e aceito** (o Claude discordou duas vezes, o Matheus
  decidiu, e está decidido): engajamento total na ordem **mais** contador
  negativo visível é a receita conhecida de seção de comentários que azeda — o
  topo tende a ser ocupado por briga, e quem escreve aprende a evitar opinião
  que divide. Aqui quem leva a descurtida é um leitor comum, não uma empresa.
  Se um dia houver gente de verdade e o topo virar discussão em vez de resenha,
  os dois lugares de mexer são `engagementOf` (a ordem) e o botão de descurtir
  em `BookDetails` (o número). **Não reabrir sem fato novo.**
- Reações ficam em `client/src/lib/reactions.ts` (`allbook_reactions`), e só
  aparecem na tela do livro — na Comunidade o comentário é um trecho, e o
  clique leva ao livro.

### Respostas a comentário (21/07, noite) — FEITO

Pedido do Matheus. Fica na tela do livro, embaixo do comentário — não na
Comunidade. Decisões tomadas ao construir:

- **Um nível só de resposta.** Responder a uma resposta continua na mesma
  conversa, em vez de abrir mais uma casinha para dentro. Num celular o
  terceiro nível já não cabe na tela. **Rejeitado:** aninhamento livre
  (estilo Reddit).
- **Resposta não tem nota de estrelas** — por isso `rating` virou opcional em
  `Comment`. Quem responde está falando com uma pessoa, não avaliando o livro;
  estrela ali sujaria a média do título.
- **Respostas em ordem cronológica**, ao contrário do primeiro nível, que é
  ordenado por engajamento. Numa conversa, quem responde fala com o que veio
  antes — ordenar réplica por curtida faria a resposta aparecer antes da
  pergunta que ela responde.
- **Você responde de verdade**, com o nome do seu perfil, e pode apagar o que
  escreveu. Suas respostas ficam em `client/src/lib/replies.ts`
  (`allbook_replies`), **separadas** de `comments.ts`: lá é esqueleto fictício,
  que é código; aqui é o que você escreveu, que é dado. Juntas, sua resposta
  sumiria na próxima vez que alguém editasse a lista fixa.
- **Só dá para apagar a própria resposta.** Não existe apagar o comentário dos
  outros, e não deve existir.
- **O perfil do leitor não mostra as respostas dele**, só os comentários de
  primeiro nível: resposta fora da conversa em que nasceu não se entende.
- O comentário e sua conversa saíram do `BookDetails` para
  `client/src/components/CommentThread.tsx` — aquela tela já passava de 600
  linhas.

**Correções e acréscimos (22/07), a partir do uso do Matheus:**

- **Bug: não dava para responder um comentário que já tinha respostas.** O
  "Responder" tinha sido fundido com o contador de respostas — no comentário
  com conversa, o rótulo virava "3 respostas" e o botão de responder sumia. Os
  dois viraram coisas separadas: o contador só informa, o "Responder" é sempre
  um botão à parte, e existe em cada resposta também.
- **Responder a uma resposta** (pedido: "responder o comentário do Ricardo").
  Continua um nível só — o `parentId` é sempre o comentário de cima —, mas a
  resposta guarda `replyToName` e mostra "@Fulano". Abrir o "Responder" de uma
  resposta traz a marca "Respondendo a Fulano", que dá para cancelar.
- **Notificação de resposta (simulada, de propósito).** Pedido: "seria
  interessante que ele fosse notificado". No app real, quem é avisado é a
  *outra* pessoa; aqui não há a outra pessoa, há o esqueleto. Então mostramos o
  outro lado do mesmo ciclo: quando você responde alguém, esse leitor responde
  de volta ali na conversa (uma de seis falas fixas em `replies.ts`, não IA em
  tempo real) e isso vira um aviso "Fulano respondeu você" em `/notifications`.
  **Quando houver servidor, some a simulação e entra a notificação real.**
  Store nova: `client/src/lib/notifications.ts` (`allbook_notifications`); as
  respostas recebidas ficam junto das suas em `replies.ts` (campo `fromSlug`).

### Comentar o autor e o narrador (21/07, noite) — FEITO

Pedido do Matheus: comentar não só o livro, mas a pessoa. Está em
`/person/:slug`, na seção "O que dizem", com os mesmos curtir/descurtir dos
comentários de livro (reaproveita `reactions.ts`, não duplica).

- **Não há estrela no comentário de pessoa**, e isso é decisão, não esquecimento.
  Duas razões: **(1)** nota de livro é opinião sobre uma obra, mas nota de
  *pessoa* é placar público sobre um profissional, que ele carrega para sempre
  e não pode responder — e um app de audiolivro vive de narrador querer narrar
  nele; **(2)** a nota que de fato ajuda a escolher é a **da narração daquele
  livro**, não a do narrador em geral: o mesmo narrador pode ser perfeito num
  romance e errado num técnico. Essa nota pertence ao par livro+narrador, e é a
  "decisão em aberto da estrelinha" mais acima.
- **O comentário diz sobre qual chapéu está falando** (`about: author |
  narrator`), e a etiqueta "sobre a obra"/"sobre a narração" só aparece em quem
  faz os dois. "Escreve bem" não é elogio à narração.
- ~~PENDENTE — unificar com `comments.ts`~~ — **FEITO em 22/07.** Os comentários
  de pessoa nasceram em `lib/person-comments.ts` só porque `comments.ts` estava
  ocupado noutra janela; agora vivem na mesma lista. Como ficou: o `Comment`
  ganhou `personSlug?` e `about?` ao lado de `bookId?` — um comentário tem **ou**
  `bookId` (livro) **ou** `personSlug` (pessoa), nunca os dois. `commentsForBook`
  e `commentsForPerson` filtram cada um o seu; `person-comments.ts` foi apagado.
  **Aprendido:** tornar `bookId` opcional obrigou um `bookId === undefined` de
  guarda em `commentsByAuthor` (o perfil do leitor só lista comentário de livro),
  em `activity.ts` e no `CommentThread` — os três já pulavam alvo sem livro, mas
  agora o tipo os força a admitir isso. Verificado: livro, perfil de pessoa,
  perfil de leitor e atividade seguem certos, sem comentário de pessoa vazando
  como se fosse de livro.

### Trabalhar com duas janelas do Claude Code ao mesmo tempo (21/07)

Aconteceu de verdade e custou tempo — vale a regra:

- **Duas janelas no mesmo arquivo é a fonte do problema.** Numa sessão, uma
  janela apagou faixas de linha com `sed` num arquivo que a outra estava
  reescrevendo; o trabalho sobreviveu por sorte, não por método.
- **Regra adotada:** editar com ferramenta de edição pontual (casando o texto
  exato), **nunca** `sed` por número de linha em arquivo compartilhado — o
  número de linha envelhece no segundo em que a outra janela salva.
- **Antes de commitar, conferir `git status`** e commitar só os próprios
  arquivos. Ainda assim, quem commitar por último leva o trabalho do outro
  junto — foi o que houve aqui, sem prejuízo, mas o histórico fica com autoria
  trocada.

### Decisões da tela de Configurações (21/07)

- **Regra da tela: só entra o que o app obedece.** Chave que liga e desliga sem
  mudar nada é o mesmo defeito que fez a primeira versão do Perfil ser
  rejeitada — e ainda ensina a pessoa a desconfiar dos botões. **Ficaram de
  fora, com motivo:** chave de notificações (não chega aviso de fora, a tela
  `/notifications` é lista fixa), "baixar só no Wi-Fi" (não há download real),
  tema claro (o app é escuro por decisão de identidade) e idioma (só existe
  português). Quando houver áudio e servidor, a lista cresce junto.
- **O que sobrou é real:** a velocidade inicial do player (salva em
  `client/src/lib/settings.ts`, lida pelo `AudioPlayer` ao abrir), a contagem do
  que está guardado neste navegador com o botão de apagar, e a conta.
- **Mudar a velocidade dentro do player não altera a preferência** — vale só
  para aquela audição. A configuração é o ponto de partida, não um espelho do
  player; senão um ajuste momentâneo para pegar um trecho difícil viraria a
  regra de todos os livros seguintes.
- **Sem sessão, a tela não mostra e-mail nenhum.** O e-mail do perfil é só um
  valor padrão, e exibi-lo ao lado de "explorando sem conta" fazia a tela se
  contradizer.

### Decisões da barrinha do player e do "onde parei" (21/07)

O incômodo do Matheus: o app **sempre abria com "Organize-se" tocando**, numa
barra que não dava para fechar e atrapalhava a navegação. Investigando, o
problema era maior: a barra era decoração com o título escrito na mão, e o
`AudioPlayer` **ignorava o id da rota** — clicar em qualquer livro abria sempre
o mesmo. A fileira "Continuar ouvindo" da Início também usava ids inventados
(201, 202, 203) que não existem no catálogo.

- **Separar "o progresso" de "a barra aparecer" é a decisão central.** O
  progresso (`allbook_playback`) fica no `localStorage` e é **permanente** — é a
  memória de onde parou. A barra aparecer (`allbook_miniplayer`) fica no
  `sessionStorage` e vale **só para a visita**: o navegador limpa sozinho quando
  a aba fecha. Resultado: abrir o app começa sempre com a tela limpa, e o "onde
  parei" reaparece em "Continuar ouvindo", na Início. **Rejeitado:** guardar as
  duas coisas juntas — era o que fazia a barra ressuscitar a cada abertura.
- **Fechar tem X e arrastar, não um ou outro.** Arrastar era a sugestão do
  Matheus e é o gesto natural no celular, mas **gesto não se vê**: quem não
  souber que existe continua preso com a barra. O X é o que ensina que ela pode
  sair. Fechar **nunca apaga o progresso** — só tira da frente.
- **Salvar pela distância, não por múltiplo de 5.** A primeira versão salvava
  quando o segundo era múltiplo de 5. Testando, apareceu o buraco: quem adianta
  30 segundos e pausa cai num número que nunca mais bate na conta, e a posição
  não era gravada nunca. Agora a régua é a distância desde o último salvamento,
  mais um salvamento ao sair do player.
- **Id inexistente na URL cai no último livro ouvido** em vez de dar erro. É
  caso de URL digitada à mão; uma tela de "não encontrado" no player seria mais
  código do que o problema merece hoje.
- **Aprendido testando, para não refazer:** aba em segundo plano **congela o
  `setInterval`** do Chrome — o cronômetro do player para. Não é bug do app, mas
  atrapalha qualquer teste automatizado do progresso.

### "Onde parei" é uma lista, não um livro só (21/07)

Pergunta do Matheus: *se eu fechar o app no meio de um livro, como eu acho ele
de novo? Meu medo é o usuário nem lembrar o nome do que estava ouvindo.* O medo
tinha fundamento — a primeira versão guardava **um livro só**, o último.
Começar um segundo fazia o primeiro sumir sem deixar rastro.

**Como as plataformas grandes resolvem, apurado para não refazer a pesquisa:**

- **Netflix, HBO Max, Paramount+** põem uma fileira "Continuar assistindo" bem
  no alto da tela inicial, cada cartão com barrinha de progresso e um **X para
  tirar dali**. Não existe barra de player fixa; a fileira é o único caminho de
  volta, e basta.
- **Audible e Spotify fazem o contrário:** a barrinha do player **volta ao
  abrir o app**. É o padrão de áudio, porque quem ouve costuma retomar o mesmo
  título por dias.
- **Escolhemos o modelo da Netflix**, mesmo o AllBook sendo de áudio: foi
  justamente a barra ressuscitando sozinha que incomodou. A barra é da visita;
  a fileira é a memória. Se um dia isso parecer pouco, o meio-termo conhecido é
  a barra voltar só se o livro foi ouvido nas últimas horas.

**O que ficou:**

- `allbook_playback` virou uma **lista** de até 20 livros começados, ordenada do
  mais recente ao mais antigo. Lê também o formato antigo (objeto só), para não
  apagar o progresso de quem já usava.
- **Cheia, sai o mais antigo** (perguntado pelo Matheus em 21/07). Como a lista
  vive ordenada do mais recente ao mais antigo, cortar no vigésimo descarta o
  livro tocado há mais tempo — nunca o recém-ouvido. Reabrir um livro que já
  está lá o traz ao topo em vez de duplicar. **Verificado no navegador:** com 20
  guardados, abrir o 21º manteve 20, pôs o novo no topo, descartou só o mais
  antigo e deixou os outros 19 intactos.
- **Três caminhos de volta**, de propósito redundantes: a barrinha (na visita),
  "Continuar ouvindo" na **Início** e "Continuar ouvindo" na **Biblioteca**.
  A da Biblioteca era inventada — dois títulos escritos na mão, um deles o
  eterno "Organize-se" — e agora lê a mesma fonte.
- **X para remover**, como na Netflix. Diferente de fechar a barra: o X diz
  "não quero mais ver isto" e apaga o progresso daquele livro.
- **Ou tudo real, ou tudo exemplo.** Os livros de enfeite da Início só aparecem
  para quem nunca ouviu nada. Misturar produzia uma cena confusa, achada
  testando: remover um livro com o X o fazia reaparecer ali mesmo, como exemplo.

### Menu inferior, TopNav e a Busca (22/07)

Revisão da navegação com o Matheus. O que ficou:

- **`/discover` tem UM nome só: "Categorias".** Antes era "Categorias" no TopNav e
  "Descobrir" no BottomNav — a mesma tela com dois nomes confundia. Padronizado em
  "Categorias" nos dois lugares (feito no BottomNav). **Motivo:** alinhar com o nome
  que já existia no topo.
- **A busca da Home estava MORTA.** `Home.tsx` já tinha a busca pronta
  (`showSearch` + `SearchResults`), mas `setShowSearch(true)` não era chamado em
  lugar nenhum — não havia botão para abri-la. O Matheus quer a busca acessível
  **na própria tela Início, no topo**. (Ver decisão de desenho abaixo quando fechada.)
- **O TopNav duplica o BottomNav.** Em celular o topo repetia os mesmos destinos do
  menu de baixo (Início, Biblioteca, Categorias) + Estatísticas, numa fileira que
  rola — o "informação demais" e o "botão Início que não faz sentido" que o Matheus
  apontou. Ideia em avaliação: enxugar o topo (logo + busca + sino + perfil) e deixar
  a navegação só no BottomNav, que é o padrão mobile. Estatísticas continua acessível
  pelo Perfil, então não se perde.

### Busca ganhou endereço próprio (24/07) — FEITO

Antes a busca **funcionava, mas não tinha tela.** Era um overlay que morava
dentro da Início e era aberto por uma ponte de evento (`lib/search.ts` +
`SEARCH_OPEN_EVENT`): a lupa do TopNav, fora da Início, navegava para a Início e
disparava o evento para o overlay abrir. A Descobrir tinha uma busca **separada**,
com o mesmo `SearchResults` copiado. O item "Busca (tela própria)" do checklist
seguia aberto porque busca de verdade **é uma tela**, não um overlay preso a outra.

**O que foi decidido (com o Matheus, na hora):** criar a rota `/search`, tela
cheia como o player/login, e **aposentar o overlay + a ponte de evento**. A lupa
do TopNav, a barra da Descobrir e a lupa da Biblioteca agora só navegam para
`/search`. Ganhos: **URL própria** (dá para voltar pelo botão do navegador), uma
**implementação única** e o fim de um contorno que os próprios comentários do
código admitiam ser gambiarra.

- **Rejeitado: manter o overlay e só unir o código.** Era a opção conservadora
  (não mexer no que funciona), mas deixava o checklist em aberto e o contorno de
  pé. Como o overlay era reconhecidamente um remendo, trocá-lo por uma rota limpa
  é melhoria, não reescrita gratuita. Isto **reverte a decisão de 22/07** que
  montou a ponte de evento — decisão tomada quando a busca da Home estava "morta"
  e o objetivo era só fazê-la abrir de qualquer tela.
- **`SearchResults` virou um componente só** em `client/src/components/SearchResults.tsx`.
  Some a duplicação Home/Descobrir que a auditoria (4.7) mandava unir "junto com a
  tela própria de Busca" — as duas coisas, feitas juntas.
- **A barra da Descobrir não busca mais ali:** virou um campo falso (botão com
  cara de input) que leva a `/search`. Mantém a "barra de busca no topo" que o
  conteúdo da Descobrir pede, sem uma segunda busca viva.
- A lógica não mudou: casamento direto (sem acento) e, só se não achar, Fuse.js
  para tolerar erro de digitação — o mesmo de antes, agora num lugar só.

### Busca virou aba "Buscar" no menu de baixo — modelo Apple TV (24/07, fim do dia)

Evolução da decisão acima, a partir de uma referência do Matheus (a tela "Buscar"
da Apple TV). As mudanças de rumo, com o porquê:

- **Rejeitada a "busca embutida na Início".** Chegou a ser escolhida e começada
  (campo no topo da Home, resultados inline), mas a referência da Apple TV mostrou
  que o estado vazio bonito — **grade de capas recomendadas antes de digitar** — é
  cara de **tela dedicada**, e não combina com a Início, que já tem conteúdo
  próprio. O experimento inline foi revertido (não chegou a commitar).
- **Busca virou uma ABA no menu de baixo** (`BottomNav`: "Buscar" no lugar de
  "Categorias"), abrindo `/search`. É o padrão de Netflix/Spotify/Apple TV: busca
  é destino fixo embaixo, não uma barra que persegue toda tela. Por isso a **lupa
  do topo (`TopNav`) saiu**.
- **`/search` deixou de ser tela cheia** (`isBare`) e virou aba de verdade: mantém
  TopNav + BottomNav + MiniPlayer; sem cabeçalho fixo nem seta de voltar. Estado
  vazio = grade **"Em alta"** (mais bem avaliados; dá para personalizar por perfil
  quando houver backend). Ao digitar, os resultados do `SearchResults` compartilhado.
- **Pendência de produto (não resolvida):** "Categorias" (`/discover`) **perdeu a
  entrada no menu de baixo**. A tela ainda existe (rota `/category/:slug` viva), mas
  o browse por gênero ficou sem porta fixa. Caminho natural: **dobrar a grade de
  gêneros dentro da Busca** (como Spotify/Apple TV — "Browse all" abaixo do campo).
  Decisão do Matheus pendente; não mexer sem ele.

### Conquistas viram muitas medalhas, coloridas (22/07)

Eram 4 conquistas discretas, embutidas em `Profile.tsx`, de propósito sóbrias
("sem medalha colorida", dizia o comentário). O Matheus pediu o oposto: **muitos
troféus, como medalhas de verdade, para engajar** — inclusive puxando para a
comunidade.

- **O que mudou:** fonte única em `client/src/lib/achievements.ts` com 16
  conquistas em 4 grupos (audição, constância, exploração, comunidade). Na tela,
  viraram uma grade; as desbloqueadas usam a cor da marca (laranja), as demais
  ficam tracejadas como metas. Tocar numa medalha mostra a descrição/meta (o
  gancho de engajamento).
- **Decisão de rumo:** abandonamos a sobriedade "sem medalha colorida" das
  conquistas de propósito — só nelas; o resto do perfil segue sóbrio.
- **`unlocked` é mock.** Sem backend, o que está conquistado é fixo (um conjunto
  plausível para o perfil de exemplo). Quando a API existir, cada `unlocked`
  passa a ser calculado de verdade — as de comunidade dependem de comentários,
  curtidas, seguir e recomendar já existirem no servidor.
- **Rejeitado por ora:** agrupar visualmente por categoria com subtítulos (mais
  bonito, mas mexe mais no layout) e uma tela dedicada de conquistas. Ficou a
  grade única com o toque mostrando a dica.

### Perfil repaginado: motivo na recomendação, troféus estampados, cabeçalho premium (23/07)

O Matheus achou o perfil próprio "cru" — reparou-se que ele era até mais simples
que o de outros leitores (`UserProfile`, que já tinha avatar colorido e "membro
desde"). Pediu três coisas, feitas nos **dois** perfis e alinhadas antes:

- **Recomendação com motivo.** Cada livro recomendado carrega um "por que
  recomendo" (opcional). `recommendations.ts` passou de `number[]` para
  `{ id, note }`, com migração do formato antigo. Editável em `RecommendationsEdit`
  (campo por livro); exibido em `Profile` e `UserProfile` como lista com a frase em
  itálico. Os leitores fictícios (`community.ts`) ganharam motivos.
- **Troféus estampados.** Fileira das conquistas desbloqueadas no topo do perfil,
  na cor da marca. Membros da comunidade têm agora `achievementIds` (mock).
- **Cabeçalho premium + cartões.** Brilho da marca no topo, avatar com anel em
  degradê, selo do plano ao lado do nome, e os 4 números viraram cartões com ícone.
- **Decisão:** aplicar nos dois perfis, não só no próprio. `unlocked`/`achievementIds`
  seguem mock até haver backend.

---

## 4. DEPOIS do frontend — o motor (resumo)
1. Modelo de dados real (shared/schema.ts). 2. Backend/API (Drizzle + PostgreSQL; banco grátis: Neon/Supabase). 3. Áudio real em object storage (Cloudflare R2 / Supabase Storage / S3) + streaming. 4. Ligar telas à API + login (Passport). 5. Virar app: PWA → Capacitor.

---

## 4.5 Decisão em aberto: de onde vem a estrelinha

Discutido em 21/07, **sem decisão tomada**. O que já foi apurado, para não
refazer a análise:

- São **duas notas, não uma**. A da **obra** (a história) e a da **narração**
  (a performance desta edição). O `bookData` do `BookDetails` já tem os campos
  `performance` e `story` — a estrutura existe, só não subiu para o catálogo.
- A nota da obra faz sentido vir **importada**: "Duna" é 4.9 há 60 anos e os
  usuários do AllBook não precisam descobrir isso.
- A nota da narração é a que **só o AllBook pode ter**: nenhuma base externa
  sabe se o narrador foi bem. É o diferencial de um app de audiolivro.
- **Partida a frio decide o curto prazo:** nota de usuário só significa algo com
  volume. Começar 100% com avaliação de ouvinte deixaria o app sem estrela por
  meses. Por isso as notas seguem curadas à mão por enquanto.
- **Quem pode avaliar:** só quem ouviu de verdade (ex.: passou de 20% do livro).
  Um tocador de áudio consegue medir isso; uma livraria não. É a melhor defesa
  contra nota falsa.
- **Importar nota não é opção hoje:** o Goodreads encerrou a API pública em 2020
  e raspar o site fere os termos de uso. Open Library e Google Books servem para
  capa e ficha, **não** para nota — a cobertura de avaliação das duas é fraca.

> **Fechada em 25/07 — ver a seção 4.15**, que decide quem pode dar nota, a
> partir de quando e como isso aparece na tela.

**Decidido em 24/07 — quem leva estrela e quem não leva.** Estrela é de **obra**
(o livro) e de **profissional** (autor/narrador, na "Nota média" do
`PersonProfile`). **Leitor não leva estrela.** A que existia ficava colada no
nome de quem comentou — no cartão do livro, no perfil do leitor e no mural da
Comunidade — e lia-se como *pontuação do usuário*, sendo que por baixo era a
nota que a pessoa deu ao livro. Some com o mal-entendido e com a promessa falsa:
no app **não há como avaliar nada** ainda. O campo `Comment.rating` continua no
dado, só não aparece — quando existir avaliação de verdade, ele já está lá.

---

## 4.6 Notificações: por que a tela foi repaginada (24/07)

A tela era uma lista chapada — todo aviso com o mesmo ícone cinza, o mesmo peso,
nenhuma cor — e destoava do resto do app. O que foi decidido:

- **Cor por tipo de aviso**, reusando o quadradinho em degradê do menu do Perfil.
  A cor **não é enfeite**: diz de que assunto é o aviso antes de você ler.
- **Capa do livro** quando o aviso fala de um livro. Reconhecer a capa é mais
  rápido que ler o título — é o que a Comunidade já fazia.
- **Uma lista só, agrupada por tempo** (Hoje / Esta semana / Antes).
  **Rejeitado:** o desenho antigo, com as respostas sempre no topo e os exemplos
  embaixo. Aquilo é ordem arbitrária — aviso é coisa cronológica, e separar por
  origem expunha ao usuário uma distinção que só interessa ao código.
- **Não-lido ganhou fundo laranja e anel**, não só o pontinho. Num celular, um
  ponto de seis pixels é fácil demais de não ver.

**Achado que custou tempo, para ninguém repetir:** o `relativeDate` do
`activity.ts` recebe só `AAAA-MM-DD`. Recortar os dez primeiros caracteres de um
ISO (que é **UTC**) pode cair no dia anterior ao local — a tela chegou a mostrar
"ontem" dentro do grupo "Hoje", porque o rótulo e o agrupamento usavam contas
diferentes. Por isso existe o `quandoFoi` local ao `Notifications.tsx`: usa o
instante inteiro, a mesma base do agrupamento, e ainda dá granularidade de hora
("há 2 h"), que é o que um aviso pede. **Não troque um pelo outro.**

---

## 4.7 Auditoria geral do projeto (24/07) — decisões e o que ficou de fora

Três revisões em paralelo (segurança, interface, qualidade) varreram o projeto
inteiro. O que foi **corrigido** está no código e no histórico do git; aqui fica
o que foi **decidido, rejeitado ou adiado** — e o porquê.

**Decisões tomadas:**
- **Servidor de desenvolvimento fechado para a rede** (`127.0.0.1` em vez de
  `0.0.0.0`, e `allowedHosts` restrito a localhost). Motivo: o `0.0.0.0` +
  `allowedHosts: true` (resquício da Replit) expunha o app a qualquer aparelho
  no Wi-Fi e desligava a proteção do Vite contra DNS rebinding. Para testar no
  celular pela rede um dia, trocar temporariamente — tem comentário no
  `vite.config.ts` explicando.
- **Vulnerabilidades de dependências: corrigir sem `--force`.** `npm audit fix`
  + atualização manual de `drizzle-orm`/`drizzle-kit`/`tsx` zerou quase tudo
  (14 → 4). As 4 restantes (moderadas) estão num `esbuild` antigo embutido no
  `drizzle-kit` — ferramenta que só roda na máquina local, nunca no app; o
  `npm audit fix --force` que as "resolveria" faria um **downgrade** do
  drizzle-kit para 2022, então foi rejeitado. Somem quando o drizzle-kit
  atualizar a cadeia interna.
- **Ficha curada do `BookDetails` só guarda o que o catálogo não sabe** (resumo,
  duração, notas de narração/história). Título, autor, capa, nota e gênero vêm
  sempre do catálogo — a ficha antiga cobria a capa real com a genérica.
- **Id inexistente na URL mostra "não encontrado"**, tanto em `/book/:id` quanto
  em `/player/:id` (o player tocava silenciosamente o primeiro livro do
  catálogo). `/player/current` segue caindo no último ouvido.
- **A faxina de Configurações agora apaga também o progresso de escuta** — o
  comentário em `playback.ts` prometia isso e o código não cumpria; alinhado
  para o lado do comentário porque "apagar dados" sem apagar o progresso
  surpreenderia.

**Rejeitado / adiado, com motivo:**
- **Repaginar a paleta do player** (overlays azul-marinho `#0d1626` e
  `text-slate-*`, fora do tema): mudança grande de aparência, melhor o Matheus
  ver e decidir o visual — fica para uma tarefa própria.
- **Selo "AllBook Original" condicional**: hoje aparece em todo livro, o que
  esvazia o selo. Pede um campo `original` no catálogo e uma decisão editorial
  de quais livros o ganham — adiado.
- **Abas da Biblioteca (Todos/Audiolivros/Baixados/Listas) não filtram**: dar
  função de verdade é uma feature, não um conserto — adiado.
- ~~**Unificar a busca duplicada** (Home e Discover têm o mesmo `SearchResults`
  quase idêntico)~~ — **FEITO em 24/07**, junto com a tela própria de Busca. Há um
  `components/SearchResults.tsx` único; ver "Busca ganhou endereço próprio".
- **"Minha lista" da Home é curada, não a biblioteca real**: alimentar do
  localStorage muda o conceito da fileira; decisão de produto para o Matheus.
- **Senha em texto puro no `shared/schema.ts` / `MemStorage`**: sem uso real
  hoje (zero rotas). Regra registrada para quando o backend nascer: renomear
  para `passwordHash`, hashear (bcrypt/argon2), nunca retornar o campo.

**Apurado sem gerar mudança:**
- Nenhum segredo/chave no código; `.env` ignorado corretamente; sem XSS
  explorável no cliente (rotas com parâmetro só fazem busca em catálogo fixo).
- O `window.scrollTo` citado no CLAUDE.md **saiu do Discover.tsx**; hoje está em
  BookDetails, CategoryBooks, Collection e PersonProfile (inofensivo; sem efeito
  na moldura de dev).
- Livro 311 ("Anjos e Demônios") é o único das coleções sem capa real — incluir
  nos `ALVOS` e rodar `npm run catalogo` numa próxima sessão (ver backlog).

---

## 4.8 Servidor de desenvolvimento virou serviço do sistema (24/07)

**Problema:** o servidor de dev vivia caindo. A causa (documentada no CLAUDE.md)
é o processo ficar preso a um terminal ou à sessão do Claude Code — fechar a
tampa, o terminal ou o Claude matava o grupo de processos e o servidor junto. O
`scripts/servidor.sh` (rodar num Terminal) já tirava o servidor da sessão do
Claude, mas ainda exigia uma janela aberta e **não voltava sozinho** se caísse.

**Decisão:** transformar o servidor num **LaunchAgent do launchd**
(`com.allbook.devserver`), o mesmo mecanismo que o voicemode já usa nesta máquina.
O sistema passa a ser dono do processo; ele **sobe ao ligar o Mac** (`RunAtLoad`)
e **se reergue sozinho** se cair (`KeepAlive`). Gerido por
`scripts/servidor-servico.sh` (instalar / status / logs / reiniciar / parar /
iniciar / desinstalar). **Verificado no ato:** matei o processo da porta 3000 de
propósito e o launchd o reergueu sozinho, com pid novo, voltando a HTTP 200.

- **Muda uma regra para o Claude.** Antes era "não suba o servidor, peça ao
  Matheus". Agora rodar `servidor-servico.sh instalar`/`iniciar`/`status` **de
  dentro de uma sessão do Claude é seguro** — o launchd bootstrapa o job no
  domínio GUI do usuário, não no grupo de processos da sessão, então o servidor
  não morre quando o Claude fecha. `npm run dev` solto na sessão segue proibido.
- **Rejeitado: só melhorar o `servidor.sh`** (loop de auto-restart + `nohup`).
  Resolveria a queda por crash, mas continuaria preso a um Terminal aberto e não
  subiria ao ligar o Mac — não é o "não cair nunca mais" que foi pedido.
- **`servidor.sh` fica como alternativa manual**, para quem não quiser o serviço
  sempre no ar. Os dois não rodam juntos (brigam pela porta 3000).

---

## 4.9 Faxina "cara premium" (24/07)

O Matheus pediu uma revisão para o app **parecer feito por uma empresa grande, não
por IA**. Feita pela **Janela C** (A e B pausadas por ele durante o trabalho). O
que foi construído está no código; aqui fica o **porquê** e o que ficou de fora.

**O maior "tell" de IA era o arco-íris de gradientes coloridos — removido:**
- **Ícones da lista do Perfil**: cada item tinha um gradiente de cor diferente
  (violeta, rosa, azul, fúcsia…). Viraram um **quadradinho neutro único**
  (`bg-white/[0.06]`), ícone claro, traço mais fino. É a mesma cura que a seção
  "Estilo: evitar a cara de IA" já mandava — só tinha escapado a lista de conta.
  Troféus e brilho do topo seguem na cor da marca (coesos, não arco-íris).
- **Cards de categoria** (Início e Descobrir): eram blocos de gradiente chapado
  com o nome escrito. Viraram um **mosaico de capas reais** dos livros da lista,
  com o nome sobre um degradê escuro (estilo Spotify/Storytel), num componente
  único `components/CategoryCard.tsx` usado pelas duas telas. A cor vem do acervo,
  não de um degradê inventado. O Matheus concordou: *"gostei da ideia dos ícones,
  mas não dá cara premium — foi ideia minha, mas vamos tirar."*

**Capa de reserva tipográfica:** o PNG genérico de gênero, repetido, denunciava
protótipo. Criado `client/src/lib/coverFallback.ts`, que gera uma capa
**tipográfica** (SVG data URI: título em serifa + autor + selo AllBook sobre fundo
sóbrio do gênero). `books.ts` usa isso no lugar do genérico. Hoje só o id 5
("Organize-se") cai nele — os outros 57 têm capa real —, mas vale para qualquer
futuro sem capa. **Revê a nota do backlog** que mandava o id 5 ficar no genérico.

**Micro-animações + profundidade:** a Descobrir ganhou um **brilho sutil da marca
no topo** (como o Perfil) e uma **entrada em cascata** dos cards de gênero
(framer-motion). Serve de **referência**; replicar nas demais telas é próximo passo.

**Selo "AllBook Original" — MANTIDO, por decisão do Matheus.** A seção 4.7 tinha
adiado torná-lo condicional (aparece em todo livro, o que esvazia o selo). Nesta
sessão o Matheus decidiu **deixar como está**: *"é só protótipo; quando começarmos
a subir os áudios de verdade a gente vê o que fica original."* Não mexer agora.

**Fase 2 (mesma sessão — o Matheus liberou o `App.tsx` e pausou A e B):**
- **Transições entre telas — FEITAS.** Cada rota entra com um fade curto, montado
  no `App.tsx` (envelope do `Switch`, com `location` explícito para casar a rota
  certa durante a troca). **Lição que custou teste, para não repetir:** a 1ª versão
  usava framer-motion (`AnimatePresence`) e a animação **travava telas
  semitransparentes** quando a janela do navegador perdia o foco — o
  `requestAnimationFrame` do framer sofre *throttle* em janela/aba sem foco (o mesmo
  fenômeno do `setInterval` já citado no CLAUDE.md). Trocado por **CSS**
  (`animate-in fade-in`, do tw-animate-css): keyframe CSS não depende de rAF, então
  no pior caso a tela **aparece direto**, nunca presa apagada. **Pela mesma razão,
  a cascata dos cards da Descobrir também migrou de framer para CSS** — ela chegava
  a deixar 7 dos 8 cards invisíveis. **Regra:** animação de ENTRADA (que começa
  invisível) deve ser CSS, não framer, para não travar apagada se o foco sair.
- **Hierarquia tipográfica — parcial.** Os títulos de seção da Início e da Descobrir
  subiram de `text-lg` para `text-xl` (mais presença). O núcleo de vitrine
  (Início/Descobrir) ficou coeso entre si; as demais telas seguem como refinamento.

**Fase 3 (mesma sessão) — sino e mais arco-íris despido:**
- **O sino agora conta os avisos de sistema, não só as respostas.** Era um
  descompasso: a tela dizia "3 avisos novos" e o sino ficava limpo, porque
  `unreadNotificationCount` só olhava as respostas do `localStorage`. A raiz: os
  avisos de sistema (mock em `Notifications.tsx`) não tinham "lida" persistido.
  Agora o estado de lida deles mora em `notifications.ts` (`allbook_system_read`),
  o contador soma respostas + sistema, e ler na tela apaga a marca do sino.
- **Ícones despidos nas Notificações e na Biblioteca.** Os gradientes coloridos por
  item (Notificações: cor por tipo de aviso; Biblioteca: Baixados/Séries/Autores/
  Gêneros) viraram o mesmo quadradinho neutro do Perfil. **Isto reverte a decisão
  da seção 4.6** (cor por tipo de aviso): a justificativa de "reusar o quadradinho
  do Perfil" caducou quando o Perfil foi despido, e o Matheus prioriza a sobriedade
  premium. Os **avatares de pessoa** (resposta) seguem coloridos — ali a cor é
  identidade, não enfeite. A animação dos cards de notificação também migrou de
  framer para CSS (mesmo bug de travar sem foco).
- **Bloco de menu da Biblioteca (Baixados/Séries/Autores/Gêneros) — a remover e
  SUBSTITUIR.** O Matheus concordou que ele não agrega (Séries/Autores são "em
  breve"/mortos; Baixados duplica a aba do topo; Gêneros virou acesso acidental à
  Descobrir depois que a busca tomou a porta do menu). Mas **não quer deixar o
  espaço vazio** ("a aba ficaria morta"). Proposta em avaliação: trocar por uma
  fileira "Sugestões para você" (recomendados a partir dos gêneros da biblioteca —
  real, sem backend). **FEITO** — o Matheus aprovou o formato: os 4 atalhos saíram
  e a fileira "Sugestões para você" entrou (recomendados dos gêneros da biblioteca,
  mais bem avaliados primeiro; biblioteca vazia cai nos melhores do catálogo). O
  código órfão do menu (o `toast` de "em breve", o `downloadCount`) saiu junto.

**Próximos passos desta frente:** propagar `text-xl` e o brilho de fundo às demais
telas · conferir capas erradas com o olho (backlog da seção 5, ainda de pé).

---

## 4.10 Biblioteca reformada (24/07, noite)

O Matheus abriu a tela e disse que ela **não agradava** — "tem muita coisa aqui
para ser corrigida", citando o nome, a foto e os botões "Audiolivros",
"Baixados", "Listas" que "não existem" — e deu **autonomia total** para
redesenhar, com a régua de sempre: identidade própria, cara premium, muita
informação **sem** poluir e **sem** cara de IA.

**Decisão de vocabulário: "Biblioteca" é o lugar, "Minha lista" é o que você
salvou.** A mesma coisa tinha três nomes — o menu de baixo dizia *Biblioteca*, o
título da tela dizia *Minha Lista* e a seção de dentro dizia *Sua Biblioteca*.
Renomear tudo para um só nome quebraria o vocabulário já espalhado (a fileira
"Minha lista" da Início, o botão da ficha do livro, o atalho do Perfil), então
os dois nomes ficaram, com **papéis distintos**: o lugar e o filtro.

**Decisão de escopo: a Biblioteca é a união de tudo que é seu** — o que está na
Minha lista, o que está sendo ouvido (**mesmo sem ter sido salvo**) e o que foi
baixado. Antes ela mostrava só os salvos, e era isso que deixava os filtros sem
sentido: sem essa união, "Baixados" e "Ouvindo" filtrariam um conjunto que já
era só uma coisa.

**As quatro abas antigas foram rejeitadas, e o motivo importa mais que a
remoção.** *Todos / Audiolivros / Baixados / Listas* eram **enfeite**: o código
guardava qual estava selecionada e **nunca usava esse valor** — clicar não mudava
um pixel. Além disso "Audiolivros" não separa nada num app em que **tudo** é
audiolivro, e "Listas" não existe no produto. Os filtros de hoje saem de estado
real (progresso, lista, downloads), mostram a **contagem** junto e **somem quando
zeram** — chip que não leva a lugar nenhum ensina a pessoa a desconfiar da tela.

**Saíram do cabeçalho:** a **seta de voltar** (isto é aba fixa do menu de baixo,
não tela interna — não há "de onde" voltar) e o **avatar**, que aparecia
**duplicado**, logo abaixo do avatar do `TopNav`. No lugar, título grande e uma
linha de resumo **calculada** ("9 títulos · 2 em andamento · 134h de audição").

**O cartão do troféu "3 semanas seguidas" foi removido.** Era número **fixo no
código** dentro de um degradê laranja — as duas coisas que a faxina premium (4.9)
tirou do resto do app. Virou uma linha sóbria de acesso às Estatísticas, com o
quadradinho neutro do Perfil. **Nada nesta tela é escrito à mão:** contagens,
horas (`minutosEstimados`, a mesma conta da ficha) e progresso vêm de
`lib/library.ts` e `lib/playback.ts`.

**Densidade sem poluição:** o acervo virou **lista ou grade** (a preferência fica
guardada), com **ordenação** por recentes, título, autor ou progresso; cada linha
mostra gênero, duração estimada, selo de baixado e a porcentagem ouvida. O
"Continuar ouvindo" virou **um destaque só** — o último livro —, e os demais em
andamento aparecem na lista com barra de progresso, em vez de repetir a
informação em dois lugares.

**Duas armadilhas apuradas testando no navegador, para não repetir:**
- **`snap-mandatory` come o `padding` do carrossel.** O encaixe alinha o primeiro
  card ao início da área de rolagem e ignora o `px-5`: a capa encostava na borda
  da tela. Conserto: `scroll-pl-5` junto com o padding. **A Início e a Descobrir
  usam o mesmo padrão e têm o mesmo defeito** — ficou de fora por serem faixa de
  outra janela.
- **Botão com rótulo dentro de card estreito espreme o texto.** "Retomar" escrito
  ao lado do tempo cortava "4h 15m restantes" no celular; virou botão redondo de
  play, fora da coluna de texto.

**`LIBRARY_EVENT` novo em `lib/library.ts`.** O menu "…" de um livro tem estado
próprio, então tirar algo da lista por ele deixava a Biblioteca mostrando o item
removido até recarregar a página. Agora gravar a lista ou os downloads dispara um
evento, no mesmo espírito do `PLAYBACK_EVENT` — e a tela se refaz sozinha.

**Ficou de fora (de propósito):** `BookDetails` e `BookActionsMenu` ainda escrevem
"Minha Lista" com maiúscula no meio da frase; uniformizar a grafia é trabalho de
outra faixa, não desta tela.

---

## 4.11 Editora ganhou perfil, e comentar deixou de ser só de livro (24/07, noite)

O Matheus pediu **perfil de editora**, com os livros dela, as pessoas ligadas a
ela e liberdade para comentar — e comentário também nos perfis de autor e
narrador. Rota nova: `/publisher/:slug`, com `lib/publishers.ts` por trás.

**Por que a editora merecia perfil:** ela é a **terceira assinatura** de todo
audiolivro (autor, narrador, editora) e era a única sem lugar nenhum no app — o
nome não aparecia nem na ficha do livro. Quem gosta do trabalho de uma casa (a
tradução dos clássicos, a escolha de quem narra) não tinha como ver o resto do
catálogo dela.

**Rejeitado: um campo `publisher` em cada livro do `books.ts`.** Seria o
caminho óbvio e é o pior: a mesma editora se repetiria dezenas de vezes, e
"Companhia das Letras" com uma vírgula fora do lugar viraria uma segunda
editora. A relação é declarada **uma vez por editora**, como lista de ids, e o
mapa livro → editora é derivado — que é também o formato que a tabela do banco
vai querer.

**Rejeitado: inventar ficha institucional (ano de fundação, sede, tamanho).**
São empresas reais; "fundada em 1986 em São Paulo" sem fonte é dado falso, e
daqui a um mês ninguém saberia que foi chute. A ficha mostra só o que o próprio
catálogo do AllBook sabe — títulos, nota média, autores, narradores, gêneros —
como `people.ts` já fazia com autor e narrador.

**A atribuição livro → editora é aproximada, e está escrito no arquivo.** Boa
parte confere com a edição brasileira real (Dan Brown no Arqueiro, Tolkien na
HarperCollins, King na Suma); o resto foi agrupado por afinidade de catálogo
para não sobrar editora com um título só — perfil de uma linha não mostra nada.
**Quando o `npm run catalogo` passar a trazer o campo `publishers` da Open
Library, é de lá que a lista deve sair.**

**Comentário de editora entra na MESMA lista de `comments.ts`**, como terceiro
alvo (`publisherSlug`), ao lado de livro e pessoa. É a mesma decisão que trouxe
o antigo `person-comments.ts` para dentro: são a mesma coisa — alguém escreveu
algo, com data e curtidas —, e separar obrigaria a triplicar ordenação, curtida
e o resolver de autor.

**`myComments.ts` deixou de ser só de livro.** O alvo virou união de livro,
pessoa ou editora. Era o que faltava para o pedido "as pessoas são livres para
comentar lá": os perfis **mostravam** o que os leitores fictícios disseram, mas
não tinham onde escrever. Nada precisou ser migrado — comentário salvo antes tem
`bookId` e continua válido.

**Como o pedido foi interpretado:** o Matheus falou em "a editora, o autor e o
narrador entrarem no perfil e comentarem". O app **não tem conta de editora nem
de autor** — os perfis são fichas de catálogo, não usuários que fazem login.
Então quem comenta é **o leitor** (você, com o nome do seu perfil), em qualquer
um dos três tipos de perfil. Se um dia existir login de profissional, o alvo já
está pronto; o que muda é quem escreve.

**Selo quadrado para editora, bolinha para gente.** O avatar redondo é a
linguagem de pessoa no app inteiro; editora é marca. A forma diferente evita que
"Publicado por" na ficha do livro pareça mais um autor. A cor sai do mesmo hash
de nome do avatar, então cada editora tem sempre a mesma cor.

**Sem estrelas no perfil de editora**, pela razão já registrada em
`Comment.rating`: nota de quem trabalha vira placar público, e a nota que ajuda
a escolher (a da narração) pertence ao par livro+narrador.

**Fechado no dia seguinte (25/07): o perfil de autor/narrador também recebe
comentário.** Ficou pendente algumas horas por coordenação, não por decisão —
`pages/PersonProfile.tsx` estava declarado por outra janela no quadro de
`COORDENACAO.md`. Assim que ela liberou, o bloco `ComentariosDaPessoa` (que só
exibia) deu lugar ao `ProfileComments` compartilhado, e ~130 linhas de lista,
curtida e botão de reação duplicados saíram da tela — eram cópia do que o
componente já fazia. O selo "sobre a obra" / "sobre a narração" continua
aparecendo **só em quem escreve e narra**, agora pela prop `etiqueta`. Os três
perfis do app — livro, pessoa e editora — usam a mesma caixa.

---

## 4.12 Foto que amplia ao toque, estilo Instagram (24/07, noite)

**O pedido:** tocar na foto de alguém — no comentário ou no perfil — e ela
abrir grande, como no Instagram.

**Onde vale e onde não vale.** Ampliar entrou no **comentário** (e na sua
própria resposta), no **seu perfil**, no **perfil de outro leitor** e no de
**autor/narrador**. Ficou **de fora** onde o avatar é porta de entrada e não
retrato: a fileira "Seguindo" e a lista de atividade da **Comunidade**, a lista
de **Notificações** e o cartão de autor/narrador da ficha do livro
(`BookDetails`). Ali o toque leva ao perfil da pessoa, que é o que se espera —
e é também o que o Instagram faz no feed.

**Mudança de comportamento no comentário:** antes, bolinha e nome levavam os
dois ao perfil. Agora **a bolinha amplia e o nome leva ao perfil**. Foi decisão
consciente: quem toca numa foto espera ver a foto, e o nome continua sendo o
caminho para o perfil (com rótulo dizendo isso, para leitor de tela).

**Ampliar bolinha de iniciais parece inútil hoje, e é de propósito.** Nenhum
leitor da comunidade tem foto ainda (e a pasta `assets/images/people/` está
vazia): o que amplia é a letra sobre o degradê. O gesto já fica pronto e, no dia
em que a foto chegar, nenhuma tela muda. Onde já **há** foto de verdade — a sua,
do `ProfileEdit` — o resultado final já aparece.

**Três armadilhas técnicas, todas encontradas testando no navegador** (estão
comentadas em `components/AvatarAmpliavel.tsx`, e valem para qualquer camada
sobreposta que se faça daqui em diante):

1. **Camada desenhada no lugar onde nasce fica atrás do conteúdo.** O miolo das
   telas mora dentro de um `main` com `z-10`, que cria uma caixa de
   empilhamento: o `z-60` da camada só valia lá dentro, e os menus (`z-50`, no
   nível de fora) passavam por cima.
2. **Portal para o `<body>` conserta a pintura e quebra os eventos.** O React
   escuta eventos num ponto só, o `#root`; o que nasce fora dali não chega até
   ele — clique e tecla morrem. **O destino certo do portal é `#root`.**
3. **O Esc não funcionou nem por `useEffect` nem pelo `onKeyDown` do React.** O
   que funciona é registrar o ouvinte da janela dentro do `ref` do elemento, que
   roda na hora em que ele entra na tela. De quebra, a camada toma o foco ao
   abrir e o devolve ao avatar ao fechar — o certo para teclado e leitor de tela.

**Apurado sem virar decisão (para ninguém repetir a investigação):** as abas que
o Claude controla pelo Chrome ficam com `visibilityState: "hidden"`, e o
navegador congela as animações nelas — medi **zero quadros em 300 ms**. Na
prática: camada com Framer Motion abre pela metade e não some da página, e isso
**não é bug do app**. Para conferir animação, o jeito é olhar no navegador do
Matheus, ou verificar por estado e foco (foi o que fiz: o foco volta ao avatar
depois do Esc, e ele só volta se o fechamento tiver rodado).

---

## 4.13 Quem produz a narração: o AllBook Studio e as vozes com nome (25/07)

Conversa com o Matheus a partir de uma dúvida dele: **se a narração vai ser
gerada por IA, o que a ficha do livro deve dizer?** Ele mesmo formulou o
incômodo: "se eu coloco a informação de IA ali, a informação fica pobre".

**O nó:** a ficha misturava dois créditos. A editora publicou o **livro**; ela
não gravou o **áudio**. E na ideia central do app (ver "Modelo de negócio") o
audiolivro muitas vezes **não existe em lugar nenhum** — o argumento do Matheus,
que fechou a decisão: *"aquele audiolivro não vai existir ainda, não vai ter
ninguém que produziu aquilo. Então aquele livro é um livro único."*

**Decisão 1 — a editora fica.** Palavras dele: até a pessoa saber qual é a
editora e qual é o formato daquele livro, o perfil da editora importa. É
informação verdadeira e útil, principalmente pela **tradução**, que em audiolivro
se ouve.

**Decisão 2 — entra o quarto crédito, "Produzido por AllBook Studio"**, com tela
própria em `/studio`. Ele **some** quando a narração for humana de verdade
(`narratorKind === "human"`), porque aí o AllBook não produziu nada.

**Decisão 3 — a voz é elenco, não aviso legal.** É a resposta ao "fica pobre", e
vale registrar o que foi **rejeitado**: carimbar *"narrado por IA"* na ficha de
cada livro. Repetido 59 vezes, deixa de ser informação e vira advertência de
bula — exatamente a "cara de IA" que a seção de estilo já mandava evitar. No
lugar: cada voz tem **nome próprio, timbre descrito e perfil** como qualquer
narrador, e que ela é **sintética** se diz **uma vez** — na tela do estúdio e no
perfil da voz, onde a pessoa foi justamente saber quem narra. É o caminho da
Apple nos audiolivros de narração digital: a ficha diz o nome da voz.

**Decisão 4 — nome de pessoa real só quando a pessoa narrou de verdade.** O
catálogo usava **"Cid Moreira"** e **"Tiago Abravanel"** como narradores — duas
pessoas reais. Enquanto era maquete sem áudio, inofensivo; com áudio gerado
saindo com o nome delas, viraria **voz falsificada de gente de verdade**. Viraram
**Aurélio Prado** e **Bruno Sampaio**, vozes do estúdio. Regra do Matheus, nas
palavras dele: se existir mesmo um livro narrado pelo Cid Moreira, credita-se o
Cid Moreira; se não existir, é voz do estúdio com nome próprio. O tipo
`NarratorKind` em `lib/studio.ts` existe só para isso.

**Onde ficou cada coisa:** `lib/studio.ts` (as 11 vozes, com timbre, e quem
produziu o quê), `pages/Studio.tsx` (`/studio`), quarto cartão em `BookDetails` e
o selo + timbre no `PersonProfile`. Nenhum dado de narração foi para `books.ts`
além do nome do narrador — mesma razão da editora (ver 4.11).

**Próximo passo combinado, ainda não feito:** o **livro sem narração**. Hoje ele
mostra "Reproduzir" e não toca nada. Esse é o melhor lugar do app para a função
central aparecer — um estado do tipo "gerar narração" / "em produção" —, e
transforma um vazio em vitrine.

---

## 4.14 Estatísticas de verdade: nasceu o diário de audição (25/07)

O Matheus pediu para "melhorar a estatística do usuário, com mais informações e
mais bem feita, com coisa mais premium" — e pediu **análise antes da mudança**.
A análise achou o essencial: **de todos os números da tela, um só era real** (a
contagem de títulos, e ainda contava o que estava *salvo*, não o que fora
ouvido). "47h", "3 semanas seguidas", "2 concluídos" e os **quatro** conjuntos
de dados do gráfico (Hoje / Diariamente / Mensalmente / Total) estavam escritos
no código, com meses de out. a fev. e um "desde 24 de nov. de 2025" envelhecido.

**A raiz, e a decisão que veio dela.** O app **não guardava histórico**: o
`playback.ts` sabe apenas *em que ponto de cada livro você parou*, nunca *quanto
tempo você ouviu ontem*. Sem isso nenhuma estatística temporal pode ser real —
por isso a tela tinha sido preenchida à mão. Nasceu então o `lib/listening.ts`,
um **diário de audição**. Perguntado se queria só o visual, o Matheus escolheu
**fundação + tela**: "só a tela deixaria ela bonita e mentirosa".

**O diário se alimenta no player, não na tela.** `savePlayback` compara a posição
nova com a anterior e credita a diferença. Como o player salva a cada 5
segundos, o histórico se constrói sozinho — nenhuma tela precisa lembrar de
registrar nada. **Teto de 120 s por crédito**: avanço maior é a pessoa pulando
capítulo ou arrastando a barra, e sem esse teto um pulo para o fim do livro
creditaria horas que ninguém ouviu (avanço negativo, idem).

**Agregar por dia em vez de guardar sessão a sessão.** Cada dia guarda o total,
a quebra por hora e a quebra por livro. Responde tudo que a tela pergunta
(série, sequência, horário preferido, livro mais ouvido) e mantém o
`localStorage` pequeno — uma linha por sessão cresceria sem teto.

**Histórico de demonstração — decisão do Matheus, com as alternativas
descartadas.** O app nasce sem passado, e uma tela de estatísticas vazia não dá
para avaliar nem para usar. Foram oferecidas três saídas: começar do zero
(honesto, mas sem nada para ver por semanas), um botão escondido nas
Configurações, ou **semear ~10 semanas plausíveis** — a escolhida. A geração é
**determinística** (semente fixa): com `Math.random` os números dançariam a cada
abertura. Os dias semeados ficam marcados com `exemplo: true`, a tela avisa no
rodapé enquanto sobrar algum, e o uso real vai por cima dia a dia.

**Apurado testando, e vale para qualquer semente futura:** a primeira versão
sorteava entre `catalog.slice(0, 8)` — e o catálogo **começa com uma sequência
inteira de ficção científica**, então a tela anunciava "Ficção Científica 100%".
A semente passou a pegar **dois livros de cada gênero**, e a espalhar a audição
por manhã, tarde e noite em vez de duas faixas.

**"Títulos começados" = diário ∪ progresso.** Contar só o progresso salvo
deixava a tela incoerente: dava para ver "45h ouvidas" ao lado de "0 títulos
começados" quando o histórico vinha do diário.

**Barras comparativas, número absoluto.** Em "Quando você ouve" e "O que você
ouve", a barra do topo ocupa a linha inteira e as outras se medem contra ela; o
rótulo continua sendo a fração real (18%, 15%…). Desenhar a fração do total
deixava todas curtas e indistinguíveis. **Seção sem dado some** em vez de exibir
zero decorativo — foi assim que saíram as linhas "Tarde 0min" e "Negócios 0%".

**O que foi removido:** o cartão da sequência com degradê âmbar, troféu grande e
🔥 (era número fixo, e é a gamificação chamativa que a 4.9 tirou do resto do
app); o ícone colorido por seção; o quadradinho em degradê do atalho da
Biblioteca; e o botão "Compartilhar estatísticas", que **copiava a URL do
localhost** — hoje copia um resumo em texto com os números reais.

**Perfil e Estatísticas agora contam a mesma história.** Os dois liam listas
fixas próprias e discordavam; passaram a ler o `lib/stats.ts`, que fica **acima**
de `listening`/`playback`/`library` de propósito — `playback` já credita o
diário, e uma dependência de volta fecharia ciclo. O painel de detalhe
(`StatSpotlight`) também deixou de ter valores próprios e recebe o resumo pronto.

**O mapa de constância nasceu e morreu no mesmo dia — e a lição vale para o app
inteiro.** A primeira versão trazia um mapa de 12×7 quadradinhos, estilo GitHub,
com quatro níveis de intensidade. Era o bloco mais bonito da tela, e o Matheus
travou nele: *"não é uma coisa fácil de entender… isso aqui não pode ser algo
que você demora para entender"*. **Numa tela de números, o desenho tem de se
explicar no primeiro olhar** — vistosidade não paga o preço de exigir legenda.
Saiu inteiro. No lugar entrou "Sua semana": a frase "Você ouviu em 4 dos últimos
7 dias" e sete círculos com a inicial do dia, cheios quando houve audição, com o
tempo embaixo e um anel no dia de hoje. Tocar num círculo mostra a data por
extenso, a duração e o livro.

Duas coisas apuradas junto: (1) o mapa dependia de **passar o mouse** para dizer
qualquer coisa — no celular não existe passar o mouse, então ele era, na prática,
mudo no aparelho; qualquer visualização nova precisa responder ao **toque**;
(2) a fileira dos 7 dias desenhava a **mesma informação** do gráfico logo acima,
que abria em "7 dias" — por isso o gráfico passou a abrir em "12 semanas", e
cada bloco responde a uma pergunta diferente.

**Ficou de fora, com motivo:** as conquistas continuam com `unlocked` fixo em
`achievements.ts` (calcular exige regras por conquista, é tarefa própria); e não
há **retrospectiva por ano** porque o app não registra *quando* um livro foi
concluído — só que está concluído. Para isso, o diário precisaria marcar o
evento de conclusão.

---

## 4.15 Como se avalia no AllBook — decidido (25/07)

Fecha a pergunta que a **4.5** deixou em aberto ("de onde vem a estrelinha").
Discussão puxada pelo Matheus: *"meu problema é as pessoas avaliarem um livro
sem nunca ter ouvido — e como gerar nota para o autor?"*. **Nada disto está
implementado ainda; é o desenho acordado.**

**1. Só o livro recebe nota. Pessoa e editora, nunca.** Autor, narrador e
editora continuam com nota **derivada** — é o que o código já faz hoje
(`people.ts` e `publishers.ts` tiram a média dos livros). Ninguém "ouve um
autor": nota em gente vira placar público, a mesma razão que tirou a estrela do
leitor (4.5) e que deixou a editora sem estrela (4.11).

**2. Duas notas por livro: história e narração.** A narração é avaliada
**dentro do livro** — é a performance daquela edição, não uma nota solta na
pessoa. Daí a herança certa: autor ← média das notas de **história**; narrador ←
média das notas de **narração**; editora ← média dos livros dela. Hoje a nota do
narrador sai da nota geral do livro, o que é injusto: livro fraco com narração
excelente puniria o narrador (e vice-versa). Os campos `story` e `performance`
já existem no `BookDetails`, faltam subir para o catálogo.

**3. Só avalia quem ouviu: 20% do livro.** É a vantagem de ser um tocador — o
app **sabe** quanto você ouviu, uma livraria não. O dado já existe hoje
(`lib/playback.ts` guarda o `percent` de cada livro). Consequência aceita: quem
leu em papel não avalia. É exatamente o que se quer.

**Como isso aparece na tela — a parte que o Matheus perguntou.** O bloco de
avaliar **existe sempre** na ficha do livro, mas **antes dos 20% é informação, e
não botão**: uma linha do tipo *"Você ouviu 8% — a partir de 20% você pode
avaliar"*. Passou dos 20%, a mesma linha vira o convite com as estrelas.

- **Rejeitado: botão de avaliar desabilitado.** É beco sem saída, contra a regra
  firmada na faxina premium (4.9): nada de controle que existe e não funciona.
- **Rejeitado: o bloco só nascer aos 20%.** O recurso fica invisível — ninguém
  descobre que pode avaliar, e o app parece não ter avaliação nenhuma. Pior:
  aparecer do nada, sem aviso, faz parecer defeito.
- A diferença entre os dois é o **motivo escrito na tela**: a pessoa sabe que
  existe, sabe por que ainda não pode, e sabe **quanto falta**.
- **Momento de ouro:** convidar a avaliar **quando o livro termina**. É quando a
  pessoa tem opinião formada, e é grátis — o diário de audição (4.14) já sabe
  quando um livro é concluído.

**4. Comentar é livre; dar nota, não.** Texto é conversa e não distorce nada;
nota é número, entra em média e ordena o catálogo. Por isso o comentário
continua aberto a qualquer um (como está desde 9281380) e só a nota tem portão.

**5. Média da comunidade só a partir de 5 avaliações.** Motivo do Matheus, e é
o certo: *"se duas pessoas gostaram e uma não, uma nota 1 derruba o livro"*.
Abaixo de 5, mostra-se a nota curada de hoje, **sem** chamá-la de nota da
comunidade. Acima, mostra a média real com a contagem à vista ("4,6 · 32
avaliações") — o número de avaliações é o que deixa a pessoa julgar o peso.

**Regras miúdas já acordadas:** uma avaliação por pessoa por livro, **editável**
(mudar de ideia é normal); dá para avaliar só a história, só a narração ou as
duas — exigir as duas afasta quem só tem opinião sobre uma.

**Em aberto, de propósito:** os números 20% e 5 são o ponto de partida, não
dogma — só dá para calibrar com uso real.

---

## 4.16 As medalhas passaram a ser ganhas; meta e previsão (25/07)

Perguntado o que mais valia mexer nas Estatísticas, o Matheus escolheu três das
cinco propostas: **conquistas calculadas**, **previsão de término** e **meta
semanal**. (Ficou de fora, por ora, tocar na barra do gráfico para ver o valor.)

**As conquistas eram a última ficção do app.** As 16 medalhas tinham `unlocked`
marcado à mão em `achievements.ts` — dava para nunca ter aberto um livro e ainda
assim exibir seis troféus no Perfil. Agora **cada medalha carrega a própria
regra** (`check`), que lê um `DadosDeConquista` montado em `lib/stats.ts` a
partir do diário, da lista e da comunidade. Com o histórico de exemplo o placar
caiu de 6 para **5 de 16** — e as 5 são as que os dados sustentam.

**Duas medalhas eram impossíveis de ganhar, e isso só apareceu ao escrever a
regra:**
- **"Eclético"** pedia livros de **10 gêneros** — o catálogo tem **8**. Virou
  "todos os 8 gêneros", que é o teto real do acervo.
- **"Bem Falado"** pedia **receber** 10 curtidas nos seus comentários. Sem
  servidor ninguém curte você: a medalha nunca acenderia. Virou **"Bom
  Público"** — curtir 10 comentários da comunidade, que é o gesto que existe.
- Ajuste menor: **"Maratonista"** falava em "3 horas seguidas, sem parar"; o
  diário guarda o total do dia, não a sessão, então a régua passou a ser
  **3 horas num mesmo dia** — mensurável, e igualmente difícil.

**Meta semanal (`lib/goals.ts`).** Um total ("39h ouvidas") conta de onde você
veio, mas não dá o que perseguir. A meta é escolhida na própria tela (1h a 10h
por semana, padrão 3h) e vira a régua de uma barra medida sobre os **últimos 7
dias** — a mesma janela dos círculos logo abaixo, para as duas não discordarem.
**Por que ela não foi para `settings.ts`:** aquele arquivo é dos ajustes do app,
lido por várias telas; a meta é número de uso pessoal, mexido de dentro das
Estatísticas. Chave própria evita um ajuste esbarrar no outro.

**Previsão de término — a única linha da tela que olha para a frente.** "No seu
ritmo, você termina *A Psicologia Financeira* em 14 dias", com o que falta do
livro e a média diária das últimas 2 semanas. Regras para não mentir: sem livro
em andamento, ou com média abaixo de 1 min/dia, **a seção some** — uma previsão
feita de quase nada seria pior que nenhuma.

---

## 4.17 O pedido sob demanda ganhou porta — e a promessa das 24 horas (25/07)

O Matheus reforçou a ideia central e apontou o buraco: **"essa página ainda não
tem onde o cliente iria solicitar isso"**. A visão estava escrita desde 24/07
(ver "Modelo de negócio"), mas o app seguia sendo vitrine fechada — o que não
estava no catálogo não existia para quem usa. Agora existe `/request`.

**A propaganda, nas palavras dele: "entregar qualquer livro em 24 horas".** É a
promessa central do produto e virou o título da tela ("Qualquer livro, narrado
em 24 horas"). O prazo mora numa constante só (`REQUEST_PROMISE`, em
`lib/requests.ts`) porque aparece em três telas — no dia em que mudar, muda num
lugar. **Registro honesto:** é uma **meta declarada**, não um número medido; ela
depende do pipeline automatizado que ainda não existe.

**Modelo de negócio, atualização da visão:** ele agora fala em **"talvez dois
planos em algum momento"**, contra o "um plano comum" registrado em 24/07.
Continua **em aberto** — e por isso a tela **não diz uma palavra sobre preço ou
cota**. Só o que é verdade hoje: "enquanto o AllBook está em fase aberta, pedir
não custa nada".

**A porta principal é a busca sem resultado, e isso é decisão de projeto.** Ali
está o **momento de maior intenção do app inteiro**: a pessoa digitou exatamente
o que queria ouvir e o catálogo não tinha. Antes aquilo era um beco ("nenhum
resultado" + botão de limpar); agora oferece produzir, **com o título já
preenchido** via `?titulo=`. A segunda porta é a tela do estúdio, onde está quem
produz.

**Escolher a voz — pedido dele.** Os perfis das vozes já existiam (4.13);
faltava deixar a pessoa dizer qual quer. **"O estúdio escolhe" é a primeira
opção e o padrão**: quem pede um livro que nem existe raramente conhece o
elenco, e obrigar a escolher poria um obstáculo na frente do diferencial. Ao
selecionar uma voz, o **timbre** dela aparece — a escolha é informada, não uma
fileira de rostos.

**Rejeitado: o ícone de "estrelinha" (`Sparkles`).** Estava no botão da busca,
no cartão do estúdio e no topo da tela de pedido. O Matheus cortou: *"esse
símbolozinho de inteligência artificial não fica legal, a gente tem que dar um ar
mais profissional"*. Ele está certo e é a mesma régua da seção "Estilo: evitar a
cara de IA" — varinha mágica é o clichê visual do gênero. No lugar, ícones do
próprio ofício: **microfone** e **fone de ouvido**.

**Rejeitado também: começar o convite com "talvez".** O texto era "Talvez este
livro nunca tenha ganhado versão em áudio". Põe dúvida justo onde o app precisa
soar seguro do que entrega. Virou afirmação do que se sabe + oferta: "Este título
ainda não está no catálogo. O estúdio grava o livro inteiro e entrega em até 24
horas."

**O que é esqueleto, dito na própria tela:** o pedido fica no `localStorage`
deste aparelho e **não sai daqui** — não há servidor, fila nem estúdio ligado.
Por isso todo pedido nasce e permanece em `recebido`; fingir progresso seria
mentir. A trilha de quatro etapas aparece como **o caminho que ele vai
percorrer**, não como histórico do que já aconteceu.

**A visão do ecossistema automatizado (dele, para depois):** achar o texto do
livro, cruzar APIs, gerar a narração, puxar capa e ficha da editora
automaticamente. Vale registrar que **isso já tem um começo funcionando**: o
`npm run catalogo` faz exatamente a parte de capa e ficha, pela Open Library. O
gargalo real não é essa parte — é o texto e o áudio.

**Ponto em aberto:** o prazo de 24 h só vira número medido quando o pipeline
automatizado existir. Até lá é a meta que o produto persegue.

---

## 4.18 A busca escondia o diferencial — e casava o que não existe (25/07)

Duas queixas do Matheus, no mesmo dia em que `/request` nasceu, e elas se
alimentavam uma à outra.

**Queixa 1 — "só no menu Pesquisa ele está escondido".** Sendo o principal
diferencial do app, pedir um livro precisava aparecer mais. E estava pior do que
parecia: a chamada só existia **dentro** da busca e **só quando a busca não
achava nada**.

**Queixa 2 — a busca casava qualquer coisa.** Ele testou e trouxe os exemplos:
digitar **"carro"** devolvia *Carrie, a Estranha* e *Leonardo da Vinci*; **"flor"**
devolvia *Sem Esforço*. Fora o resultado errado em si, o efeito colateral era o
que interessa: **a busca quase nunca admitia que não achou**, então a porta da
queixa 1 praticamente nunca abria.

**Medição antes de mexer (no catálogo real, 59 títulos).** O Fuse.js comparava a
consulta com o campo inteiro, com `threshold: 0.4`. Apertar o limiar **não
resolvia**:

| termo | Fuse 0.4 (antes) | Fuse 0.2 | Fuse 0.15 |
|---|---|---|---|
| "carro" | Carrie (0.40) ❌ | ainda casa ❌ | some ✓ |
| "flor" | Sem Esforço (0.44) ❌ | some ✓ | some ✓ |
| "tolkein" (erro real) | acha Tolkien ✓ | **some** ❌ | **some** ❌ |

Ou seja: **acerto e falso positivo caem na mesma faixa de pontuação**. O limiar
que matava "carro → Carrie" matava junto "tolkein → Tolkien". Não existia número
certo — o problema era o método.

**Decisão: o fallback deixou de ser o Fuse.js e passou a ser casamento palavra a
palavra, com distância de edição (Damerau-Levenshtein).** A etapa 1 continua
igual: substring sem acento no título ou no autor, que é o que faz "en" trazer
"O Senhor dos Anéis" e "habitos" trazer "Hábitos Atômicos". A etapa 2 exige que
**toda** palavra da consulta ache uma parecida no livro, com esta escala de
tolerância: até 3 letras, **zero** erro; 4 a 6, **um**; 7 ou mais, **dois**.

O resultado, medido nos mesmos termos: "carro", "flor", "gato" e "o nome do
vento" → **nada** (a oferta aparece); "tolkein", "hobit", "sennhor dos aneis",
"stephan king" → **acham** o livro certo. Tolerar erro continua valendo — o que
não valia era tolerar semelhança solta. **O Fuse.js saiu da busca** (o pacote
segue no `package.json`; tirar é item de faxina, não urgência).

**Onde a chamada ficou visível:** componente `RequestBanner`, em dois lugares —
**na Início, como primeiro conteúdo abaixo do destaque da capa**, e **no topo da
Busca, antes de digitar qualquer coisa**. Na Início ela nasceu depois da grade
de categorias e foi **subida**: eram oito categorias em quatro fileiras antes
dela, o que ainda era esconder. Agora aparece sem rolagem.

---

## 4.19 Troféus com hierarquia: raridade, progresso e memória (25/07)

Perguntado o que ainda destoava do princípio "cara de app caro, feito por uma
empresa grande", a resposta foi: **os troféus**. O Matheus mandou fazer tudo.

**O diagnóstico, que vale como régua para o app inteiro:** as 16 medalhas tinham
**o mesmo peso visual**. "Primeira Escuta", que se ganha em cinco minutos, era o
mesmo círculo laranja de "Milionário de Minutos", que pede 500 horas. **Quando
tudo vale igual, nada vale** — e uma coleção sem hierarquia vira decoração.

**Raridade em três faixas, sem arco-íris.** Cada medalha ganhou um `tier`:
**comum** (prata sólida), **rara** (a cor da marca) e **lendária** (dourado com
um brilho contido, a única que ganha brilho — é ela que precisa parecer rara).
Uma cor sólida por faixa, nunca degradê por ícone: é a mesma regra da faxina
premium (4.9). **Apurado ajustando:** a comum começou como branco translúcido
(`bg-white/[0.14]`) e ficava **quase igual a uma medalha bloqueada** — a
hierarquia morria logo na primeira faixa. Virou prata sólida.

**A medida virou `atual` / `alvo`, e não mais sim/não.** É essa mudança que
permite mostrar **o quanto falta** numa medalha ainda bloqueada: o círculo
apagado agora tem um anel de progresso em volta. Uma grade só de ícones cinzas é
uma lista de "não"; com progresso, vira caminho — e só é honesto porque os dados
existem desde o diário de audição (4.14).

**O toque abre um painel, não um toast.** Tocar num troféu disparava o mesmo
avisinho de rodapé usado para "link copiado", que some antes de a pessoa ler.
Agora abre o `AchievementSpotlight`: medalha grande, faixa de raridade, a regra,
o progresso ("39h 42min de 100h · faltam 60h 18min") e a data em que foi ganha.

**O app passou a ter memória e a comemorar.** `allbook_achievements_won` guarda
**quando** cada medalha acendeu, e o `AvisoDeConquista` (montado no `App`, não
numa tela, porque a medalha pode acender ouvindo, salvando ou curtindo) anuncia
as novas. **A primeira sincronização é silenciosa de propósito:** quem abre com
histórico já formado ganharia cinco avisos de enfiada — isso é ruído, não
comemoração.

**Agrupadas por categoria.** Audição, Constância, Exploração e Comunidade já
existiam no código, mas a tela mostrava as 16 embaralhadas, com cara de lista
aleatória. Cada grupo agora tem título e placar próprio (1/4, 2/4…).

**Removido: a fileira de troféus ao lado do nome, no topo do Perfil.** Eram
círculos idênticos, no mesmo degradê laranja e sem rótulo — pareciam **botões de
ação**, não medalhas, e disputavam atenção com a foto e o nome. O placar
completo, agora com raridade e progresso, vive na seção "Conquistas".

**Anotado e não feito:** o perfil de **outro** leitor (`UserProfile`) ainda
desenha as medalhas no degradê antigo; e o botão "Copiar meu resumo" das
Estatísticas continua fraco — a versão premium seria um **cartão de
retrospectiva** com as capas, para dar print. Os dois ficaram fora desta rodada.

---

## 5. Backlog de faxina técnica (não urgente)
- ~~**Capas faltando:** id 311~~ — **FEITO 24/07**: a capa de "Anjos e Demônios"
  foi fixada pelo ISBN `9780743486224` (a obra existe na Open Library **sem**
  `cover_i`, por isso a busca por título nunca a trazia). Registrado no `ALVOS`
  como `isbnDaCapa`. **Cuidado documentado:** o ISBN `9781400079179`, que parecia
  servir, é o do "Código Da Vinci" — outro livro do mesmo autor. Baixada de forma
  cirúrgica (só essa capa), sem re-rodar o script inteiro, para não sobrescrever
  as 57 capas já conferidas à mão.
  - **id 5 ("Organize-se", Ciara Conlon) fica SEM capa real de propósito:** a
    Open Library não tem a obra — busca por "Chaos to Control" devolve zero, e por
    autora só aparece "Productivity for Dummies" (livro diferente). Agora usa a
    capa **tipográfica** gerada (`lib/coverFallback.ts`) no lugar da imagem
    genérica de gênero (ver 4.9) até surgir uma capa própria; **não pôr a errada.**
- ~~**Paleta do player:** azul-marinho (`#0d1626`, `text-slate-*`)~~ — **FEITO
  24/07**: `#0d1626` virou `#1a1a1a` e os `text-slate-*` viraram `white/NN`,
  dentro do tema.
- **Quando o backend nascer:** filtrar campos sensíveis do log de respostas em
  `server/index.ts`; mensagem genérica para erro 500 em produção; hash de senha
  (ver seção 4.7).
- ~~**`@assets` aponta para pasta inexistente**~~ — **FEITO 24/07**: pasta
  `attached_assets/` criada (com LEIA-ME); o atalho do `vite.config.ts` deixou de
  apontar para o vazio.
- ~~**Metatags do Replit no `client/index.html`**~~ — **FEITO 24/07** (parcial):
  descrições traduzidas para PT-BR e removidas as imagens e o `@replit` do Replit.
  Falta só pôr uma imagem própria do AllBook (`og:image`) antes de divulgar links.
- **Conferir as capas com o olho** (21/07): 57 dos 59 livros ganharam capa real da
  Open Library, mas a busca é por aproximação e pode trazer a arte de outro volume
  da mesma série — aconteceu com "O Problema dos 3 Corpos", já corrigido. Passar
  pelas 8 telas de categoria e, achando alguma trocada, fixar pelo `isbnDaCapa`.
- ~~**`Statistics.tsx` ainda usa os cartões coloridos antigos**~~ — **FEITO
  24/07**: a grade de números ganhou ícone único da cor da marca (`bg-primary/10`),
  sem gradiente por item, igual ao Perfil.
- ~~Backup automático não existe~~ — resolvido em 21/07: o hook `.githooks/post-commit`
  envia todo commit para o GitHub sozinho. Antes disso, todo push era manual.
- ~~`npm run build` quebrado~~ — resolvido em 21/07: faltava o `script/build.ts` que o `package.json` chamava. Agora gera `dist/public` (frontend) e `dist/index.cjs` (servidor), e o `npm start` sobe.

---

## 6. Ferramentas
Usar **um editor só** (Cursor serve bem, é baseado no VS Code). Claude Code no terminal
para tarefas maiores. Enviar pro GitHub com frequência (backup + histórico).

O fluxo de como o trabalho pensado na nuvem chega ao computador está definido:
construção via Claude Code, no Cursor. Detalhes no documento "AllBook — Fluxo de
Trabalho", no Cowork.

---

## Glossário rápido (linguagem simples)
- **Frontend:** as telas que o usuário vê (o "salão do restaurante").
- **Backend / Servidor:** o programa por trás que guarda e processa os dados (a "cozinha").
- **API:** a "janelinha de pedidos" entre as telas e o servidor.
- **Banco de dados:** onde ficam guardadas as informações organizadas (livros, usuários, progresso).
- **Object storage / "depósito":** armazém na internet para arquivos grandes (os áudios).
- **Streaming:** enviar o áudio em pedacinhos conforme se ouve, sem baixar tudo antes.
- **Commit / push:** tirar uma "foto" do projeto e enviá-la pro GitHub (backup + máquina do tempo).
