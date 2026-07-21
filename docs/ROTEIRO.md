# AllBook — Estado Atual e Roteiro

_Documento vivo. Atualizado em 21/07/2026 (tarde). Serve de "mapa" pra continuar o projeto entre sessões._

Repositório: `github.com/matheuspei/allbook` · branch `main` · roda em `localhost:3000`
Pasta local (Mac): `~/Downloads/allbook-project` · atalhos no terminal: `allbook` (abre) e `allbook-r` (retoma conversa)

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
- [ ] Busca (tela própria)
- [x] **Categoria / Gênero** — PRONTA (21/07). Rota `/category/:slug`. É o destino do
  link de gênero na tela do livro e dos cartões coloridos da Descobrir, que antes
  filtravam na própria tela (o `TODO` do `Discover.tsx` saiu com isso).
- [x] **Autor / Narrador** — PRONTA (21/07). Rota `/person/:slug`, uma tela só para os
  dois papéis (quem escreve pode narrar). Avatar gerado a partir do nome, com foto real
  entrando sozinha se o arquivo for posto em `client/src/assets/images/people/`.
  Para isso o catálogo ganhou o campo `narrator` e cresceu de 38 para 59 títulos —
  perfil de autor com um livro só não mostrava nada.
- [ ] Planos / Assinatura
- [ ] Boas-vindas (onboarding)
- [x] **Ligar Estatísticas ao menu** — feito: já estava no TopNav e agora também no
  Perfil. O cabeçalho que colidia com o TopNav ao rolar foi corrigido.

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

---

## 5. Backlog de faxina técnica (não urgente)
- **`@assets` aponta para pasta inexistente** (`attached_assets/` em `vite.config.ts`). Criar a pasta vazia ou remover o atalho, antes que algum import futuro quebre.
- **Metatags do Replit no `client/index.html`** (`og:image`/`twitter:image` apontam pro Replit). Trocar por uma imagem do AllBook antes de divulgar links.
- **Conferir as capas com o olho** (21/07): 57 dos 59 livros ganharam capa real da
  Open Library, mas a busca é por aproximação e pode trazer a arte de outro volume
  da mesma série — aconteceu com "O Problema dos 3 Corpos", já corrigido. Passar
  pelas 8 telas de categoria e, achando alguma trocada, fixar pelo `isbnDaCapa`.
- **`Statistics.tsx` ainda usa os cartões coloridos antigos** — mesmo tratamento
  sóbrio que o Perfil recebeu.
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
