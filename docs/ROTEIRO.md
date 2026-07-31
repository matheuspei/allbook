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
- [x] ~~**Descobrir / Explorar**~~ — **FUNDIDA NA BUSCAR em 26/07** (ver 4.32). A
  rota `/discover` e o `Discover.tsx` não existem mais; a grade de 8 gêneros e a
  fileira numerada (agora "Em alta") moram na aba **Buscar**.
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
- [ ] **Planos / Assinatura — a tela FOI REMOVIDA em 26/07** (ver 4.31). O histórico
  abaixo fica porque explica por que ela existiu e por que saiu; a rota `/plans`, o
  arquivo `Plans.tsx` e o item do Perfil **não existem mais**. Ela volta quando
  houver plano e crédito de verdade para mostrar.
- [x] ~~**Planos / Assinatura → virou "Meu acesso"**~~ (`/plans`, 24/07). Por decisão
  do Matheus, a tela **não fala de preço nem de plano pago** e **não insinua
  cobrança futura** — ele não quer expor a estratégia nem criar ansiedade. Ela só
  celebra, no presente, o que a pessoa já tem (catálogo, player, listas, downloads,
  comunidade, sem anúncios). O item do Perfil "Plano e assinatura" virou "Meu
  acesso" (ícone de cartão saiu, puxava pra pagamento). Modelo de negócio segue em
  aberto (ver "Modelo de negócio e a função central" acima). O selo "Premium" do
  topo do Perfil **foi removido** (24/07, a pedido do Matheus) pelo mesmo motivo —
  sinalizava plano pago; a constante `PLAN` saiu junto.
  - **26/07 — o motivo caducou, e a tela ficou sem função.** O Matheus reabriu o
    assunto sem lembrar da decisão: *"qual é a ideia do botão Meu acesso? Os botões
    não fazem nada, não estou entendendo por que ele existe"*. Duas coisas, e as
    duas são verdade. (1) **Ele tem razão sobre a aparência:** as seis linhas
    (catálogo, player, minha lista, downloads, comunidade, sem anúncios) usam
    exatamente o desenho dos itens de menu do Perfil — cartão, ícone laranja,
    título e subtítulo, divisórias — mas são `div`, não botão. Parecem menu
    quebrado. É o defeito da 4.23 em outra forma: aqui não há botão morto, há
    **texto fantasiado de botão**. (2) **A razão de ela existir mudou:** ela nasceu
    para ocupar o slot de "Planos" numa fase em que o modelo estava em aberto e ele
    não queria expor estratégia. Com o modelo decidido (planos com crédito de
    pedido, ver "Modelo de negócio", 26/07), essa tela tem **destino óbvio**: é
    onde os créditos do mês vão morar ("você tem 2 créditos, usou 1"), com a troca
    de plano. Aí ela passa a ter função real. **Enquanto os números não fecham**, o
    que está em aberto é se ela sai do Perfil ou só perde a cara de menu —
    decisão do Matheus, recomendação registrada na conversa de 26/07.
- [ ] Boas-vindas (onboarding) — **a última que falta.** A *abertura animada* do
      app é outra coisa e foi adiada para depois do backend (ver 4.35).
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

#### Atualização de 26/07: planos com **crédito de pedido** — a estrutura, com números

O Matheus fechou a forma do modelo (os números ainda são "por exemplo", palavra
dele): **um plano de acesso, e planos mais caros que incluem crédito para pedir
livro.** Cada crédito = um livro pedido. As faixas que ele citou: **R$ 19,99** só
acesso; **R$ 50** com um crédito; um terceiro com **dois**; um quarto com **três**.
Isto deixou de ser "visão em aberto" e passou a ser **a forma decidida do
modelo** — o que falta são os números finais e os detalhes listados no fim desta
subseção.

**Confirmado por ele na mesma conversa — "era exatamente assim que eu pretendia
fazer":** os planos **não se somam**. O plano com crédito **já inclui** o acesso;
ninguém compra crédito sem ter o app. Somar criaria dois pagamentos para a mesma
pessoa e faria o plano de cima parecer punição. A escada, com **desconto por
volume** para o plano maior valer a pena (os valores seguem sendo exemplo):

| Plano | Créditos/mês | Preço sugerido | Preço por crédito |
|---|---|---|---|
| Acesso | — | R$ 19,90 | — |
| Acesso + 1 pedido | 1 | R$ 49,90 | R$ 30 |
| Acesso + 2 pedidos | 2 | R$ 69,90 | R$ 25 |
| Acesso + 3 pedidos | 3 | R$ 89,90 | R$ 23 |

**Um pedido = um crédito, sempre.** Trazer e gravar custam o mesmo à pessoa. A
premissa que sustenta isso, nas palavras do Matheus: **o pedido só existe para
livro que não está no catálogo do AllBook** — "a ideia é só a gente vai trazer um
livro que não existe dentro do nosso catálogo". Não há pedido "de graça", então
não há teto a definir nem regra de abuso a escrever: o crédito é o próprio limite.

**Rejeitado (proposta minha, derrubada no mesmo dia): trazer sem gastar crédito,**
com o argumento de que trazer é barato para o AllBook e o resultado vira acervo
para todos. O Matheus cortou — *"ele não gera um custo grande para a gente, [mas]
ele tem que ser consumido um crédito da pessoa"*. O que a proposta não via: um
pedido gratuito **precisaria** de teto, de regra de abuso e de uma segunda
categoria de pedido na interface, e tudo isso para dar de graça exatamente o
serviço que a pessoa está assinando. **Regra que fica: o crédito é a unidade
única do pedido — nada de duas moedas.**

**Ainda em aberto, e são decisões do Matheus:**
1. **Crédito acumula ou expira no fim do mês?** Recomendação: acumula enquanto a
   assinatura estiver ativa, com **teto** (ex.: 3 guardados). Crédito que vira pó
   gera raiva por algo que não custou nada ao AllBook; acúmulo infinito cria
   passivo de produção que pode chegar todo de uma vez.
2. Nomes dos planos, teste grátis, e se a fase gratuita (200–500 usuários) vem
   antes de tudo isso.

**Nada disso está no código, e não há mais tela onde estar:** a `/plans` foi
removida em 26/07 (ver 4.31). Os números acima só saem do papel quando o Matheus
mandar construir a tela de Planos — que nascerá do zero, já com crédito e plano de
verdade para mostrar.

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
- ~~**Pendência de produto (não resolvida):** "Categorias" (`/discover`) **perdeu a
  entrada no menu de baixo**. (…) Caminho natural: **dobrar a grade de gêneros
  dentro da Busca** (como Spotify/Apple TV — "Browse all" abaixo do campo).~~ —
  **RESOLVIDA em 26/07, exatamente por esse caminho** (ver 4.32): a grade de
  gêneros passou a morar na aba Buscar, e a Descobrir foi fundida nela.

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

## 4.5 ~~Decisão em aberto:~~ de onde vem a estrelinha — **DECIDIDA em 4.15**

> **Não está mais em aberto.** A decisão foi tomada em 25/07 e está na **4.15**
> ("Como se avalia no AllBook"): só o livro recebe nota, em duas réguas —
> história e narração —; autor, narrador e editora ficam com nota **derivada**.
> O texto abaixo é a apuração de 21/07 que levou até lá, e fica pelo raciocínio.

Discutido em 21/07, **sem decisão tomada na época**. O que já foi apurado:

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

**Atualização de 26/07 — a estrela voltou, e este parágrafo previu o gatilho.**
O Matheus pediu o formato da Amazon: *"vamos colocar os comentários das pessoas
com a avaliação dela que ela deu"*. Os dois motivos da remoção mudaram de estado
de forma diferente, e por isso a volta **não** desfaz a decisão antiga:

- *"Não há como avaliar nada ainda"* — **caducou**. A avaliação foi construída
  em 25/07 (4.15). O `Comment.rating` estava guardado esperando exatamente isto.
- *"Colada no nome, lia-se como pontuação do usuário"* — **continua de pé**, e
  virou a regra do desenho: a estrela **não** fica na linha do nome. Ela fica
  encostada no texto do comentário (que vem logo abaixo, coladinho), de modo que
  pertence à frase, não à pessoa. É a diferença entre "este leitor vale 4
  estrelas" e "ele deu 4 estrelas a este livro".

**Onde aparece:** só em comentário de **livro** (`CommentThread`). Em perfil de
pessoa e de editora, não — nota de gente segue proibida. Em resposta, também
não: quem responde fala com alguém, não avalia o livro.

**No seu próprio comentário, as duas notas separadas** (`CommentComposer`):
"História ★★★★ · Narração ★★★★★", e não uma média — as duas são independentes em
`ratings.ts`, e a média esconderia o caso mais interessante, o do **livro bom
com narração morna**. A nota lida é a **atual**, não uma cópia do momento em que
o comentário foi escrito: avaliação e comentário são a mesma opinião, então
mudar as estrelas muda o comentário na hora (o componente escuta o
`RATINGS_EVENT`). Quem comenta sem ter avaliado não ganha estrela nenhuma —
comentar não obriga a dar nota.

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
sem nunca ter ouvido — e como gerar nota para o autor?"*.

> **Construído no mesmo dia** (`lib/ratings.ts`, `components/AvaliarLivro.tsx`,
> bloco na ficha do livro, herança em `people.ts`). As decisões que só
> apareceram na hora de implementar estão no fim desta seção.

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

### O que só apareceu na hora de construir (25/07)

**`story` e `performance` são opcionais no catálogo.** Só os 4 livros que já
tinham ficha curada as têm; quem não tem cai no `rating` geral, pelos ajudantes
`notaHistoria`/`notaNarracao` de `books.ts`. **Rejeitado: preencher os 59 livros
com duas notas cada.** Seriam números inventados — o mesmo motivo que barrou a
ficha institucional de editora (4.11) — e daqui a um mês ninguém saberia que foi
chute. Repetir uma nota verdadeira é melhor do que estampar duas falsas.

**No perfil de pessoa, a caixa mostra a nota do chapéu principal** (o que ela
mais faz no catálogo): "Nota da escrita" para quem escreve, "Nota da narração"
para quem narra. *(O rótulo era **"Nota da obra"** e mudou em 26/07, a pedido do
Matheus: no singular, "a obra" soa como **uma** obra específica, mas o número é a
média de tudo que a pessoa escreveu — Dan Brown tem três títulos e uma nota só.
"Nota da escrita" nomeia o **trabalho**, faz par exato com "Nota da narração" ao
lado e não escorrega no gênero de quem escreve, dado que o catálogo não guarda.)* O segundo chapéu, quando existe, vira uma linha discreta embaixo —
**rejeitada a quarta caixa** na grade, que é de três colunas e apertaria no
celular.

**A linha "de onde vem a nota" é obrigatória, não enfeite.** Sem ela, as duas
notas do topo passariam por média dos ouvintes. Ela diz "Notas do catálogo
AllBook" com a contagem atual, e vira "Nota dos ouvintes: X · N avaliações"
quando passa de 5.

**Apurado, sem virar problema:** hoje **ninguém no catálogo é autor e narrador ao
mesmo tempo** (48 pessoas, zero com os dois papéis), então a linha do segundo
chapéu existe no código mas não tem caso real para mostrar — não deu para
conferir na tela. Vale lembrar quando alguém narrar o próprio livro, que é comum
em não-ficção.

**Medido no teste:** com 2 comentários com estrela por livro, nenhum título
chega perto das 5 avaliações — ou seja, **na prática o app segue mostrando a
nota curada**, que é exatamente o comportamento desenhado para a partida a frio.

**Como chegar aos 20% para ver o bloco liberado (enquanto o áudio é simulado).**
O player anda 1 segundo por segundo: esperar ouvindo levaria ~2h30 num livro de
12h. O caminho é **pular capítulo** no player — a barra arrasta só dentro do
capítulo atual, de propósito. Em "O massacre da família Hope" (11 capítulos),
três toques em "Próximo capítulo" levam a 25,8% e liberam a avaliação. Isso é
limitação do áudio de mentira, não do portão: com áudio real, ouvir 20% é ouvir
20%.

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

**Correção de 25/07 (noite): translúcido encostado no billboard não funciona.**
A faixa usava `bg-primary/10` — laranja com 10% de opacidade — e ficava **colada
no destaque**, chegando a invadir 14px da imagem. Como a capa do billboard troca
sozinha, a vizinhança muda de cor o tempo todo: com uma capa terrosa (Duna) o
laranja sumia; com uma esverdeada (Anne Frank) brigava. O Matheus: *"as cores
vão se misturando de acordo com as capas que vão passando"*. **Regra que fica:
cor translúcida só sobre fundo estável.** A faixa passou a ter corpo **opaco**
(`#1e1e1e`, o cinza dos cartões do app), com o laranja da marca só no ícone e na
seta, e ganhou respiro do billboard (`pt-5`) para pertencer ao corpo da página,
não ao destaque. **Rejeitado descer a faixa para depois das categorias** — seria
desfazer o que esta mesma seção acabou de decidir; o defeito era de pele e de
respiro, não de posição.

### Correção de 26/07: o lugar era o problema, sim — o pedido foi para o menu

A correção da véspera não bastou. Com a faixa opaca e afastada, o Matheus voltou
com duas coisas: o botão *"está no lugar muito errado"*, e o degradê do destaque
*"como estava antigamente, no único degradê, ficava mais bonito"*. **A conclusão
que a noite anterior errou:** aquele ponto da tela é ruim **por natureza**. O
billboard termina se dissolvendo no fundo; qualquer retângulo encostado ali corta
o degradê no meio, seja ele translúcido ou opaco. Não havia cor que resolvesse.

**Onde a porta foi parar: o menu de baixo, como quinto item — "Pedir", no
centro.** Pastilha laranja sólida com um microfone, entre Biblioteca e Buscar. A
troca de natureza é o ponto: as quatro abas são **lugares onde você fica**, e
pedir um livro é **uma coisa que você faz** — por isso não ganha o realce de "aba
atual" e fica sempre aceso, o gesto do botão de criar do Instagram e do TikTok.
Ganhos: aparece em **toda tela do app**, não só na Início; fica no ponto que o
polegar alcança melhor no celular; e nunca mais encosta numa imagem.

**Descoberto ao conferir, e é a causa raiz da queixa da cor:** o fundo de cada
slide do billboard é a capa **ampliada em 10% e borrada**, e a `section` não
tinha `overflow-hidden`. Esses 10% mais o halo do borrão **vazavam para fora do
destaque** e pintavam a primeira faixa do conteúdo de baixo — com uma linha de
corte seca onde o borrão acabava, e mudando de cor a cada capa. A faixa de pedido
apanhou por um defeito que não era dela. Com o recorte, o degradê desce inteiro
até o `#141414` e a emenda some.

**O `RequestBanner` continua vivo, só na Busca.** Ali ele chega no momento certo
— a pessoa está justamente procurando um título. A variante `destaque` (bloco
grande) ficou sem uso; está de pé para a próxima tela que precisar dela.

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

## 4.20 Cartão de retrospectiva, e as medalhas iguais em todo lugar (25/07)

Duas pontas que a rodada anterior deixou anotadas — o Matheus mandou fechar as
duas.

**O "Copiar meu resumo" virou um cartão de verdade.** O botão jogava uma lista
de tópicos na área de transferência ("• 39h 42min ouvidas…"). Funcionava, e era
a coisa menos premium da tela: **ninguém posta tópicos**. Agora "Criar meu
cartão" abre uma imagem 1080×1350 com o brilho da marca, o número grande, a
linha de títulos e dias, as **três capas** do que mais tomou seu tempo e o
gênero favorito — do jeito que Spotify e Strava entregam no fim do ano. O texto
não sumiu: virou um botão secundário dentro do próprio cartão.

**Decisão técnica: desenhar num `<canvas>`, não fotografar uma `<div>`.** Para o
`navigator.share` levar a peça ao WhatsApp ou ao Instagram, ela precisa existir
como **arquivo**. Estilizar uma `div` e capturá-la exigiria uma biblioteca nova
(html2canvas e afins) — peso a mais por um resultado pior. Desenhando direto, o
que se vê na tela **é** o arquivo: não existe divergência entre prévia e saída.
As capas vêm da mesma origem (o Vite serve tudo), então o canvas não fica
"contaminado" e o `toBlob` funciona. No computador, sem compartilhamento de
arquivo, o cartão baixa como PNG.

**Três coisas apuradas desenhando, todas invisíveis no código:**
- O brilho da marca tomava metade do cartão e deixava o topo amarronzado —
  raio e opacidade caíram bastante.
- A assinatura "feito no AllBook" a 30% de opacidade **sumia** no fundo escuro.
- O desenho leva perto de um segundo (fontes da marca + três capas), e nesse
  intervalo ficava um retângulo invisível com cara de tela quebrada. Entrou um
  "Montando seu cartão…" por cima.

**As medalhas ficaram iguais em todo lugar.** O perfil de **outro** leitor ainda
desenhava os troféus no degradê laranja antigo, de antes da raridade (4.19).
Agora usa o mesmo `TIERS` do seu perfil — prata, cor da marca, dourado. **O
motivo importa mais que o ajuste:** se a mesma medalha muda de aparência
conforme a tela, ela deixa de significar alguma coisa.

---

## 4.21 O cartão ganhou uma segunda versão, e a escolha ficou com quem usa (25/07)

O Matheus aprovou o cartão ("ficou bonito, ficou interessante") e, no mesmo
fôlego, pediu para ver "com mais informação" — deixando claro que, se não
ficasse melhor, era para **voltar ao que estava**.

**A decisão foi não escolher por ele.** Em vez de trocar um layout pelo outro no
escuro, o painel ganhou um alternador de duas opções — **Simples** e
**Completo** —, com o Simples continuando padrão. Comparar leva um toque, e
"voltar ao normal" deixou de ser um pedido de trabalho: é outro toque.

**O que a versão Completo acrescenta:** o período que o histórico cobre ("maio a
julho de 2026"), uma faixa com quatro números (títulos, concluídos, sequência,
dias ouvindo), o **gráfico das últimas 12 semanas** e um rodapé com gênero
favorito, narrador mais ouvido e horário preferido. Para caber, o número grande
encolhe de 132 para 112 e as capas ficam menores.

**Dois defeitos que só apareceram desenhando:**
- Na primeira montagem, o título de cada capa **bateu em cima do rodapé** — o
  espaço entre o gráfico e o fim do cartão não fora contado. As alturas foram
  refeitas com folga explícita.
- Reaproveitar a largura das capas da versão simples deixava-as **mais largas
  que altas**, cortando a arte. No Completo elas têm largura própria e o
  conjunto vai para o centro.

---

## 4.22 A segunda peça virou Story — e o herói deixou de ser a hora (25/07)

O Matheus gostou do alternador, mas mandou reformular três coisas: os **nomes**
("Simples" e "Completo" não dizem nada"), o **conteúdo** da segunda peça e o
**destino** dela — "pensando numa coisa que o usuário vai colocar nas redes
sociais… nos stories".

**Os nomes agora dizem para onde a peça vai:** **Resumo** (4:5, o retrato geral,
serve em qualquer lugar) e **Story** (9:16, o tamanho exato do story do
Instagram). Antes o par descrevia a *quantidade de coisas na imagem*, o que não
ajuda ninguém a escolher.

**A decisão de conteúdo, que é a mais importante: em rede social o herói é
livro, não hora.** "39h 42min ouvidas" impressiona pouco quem vê de fora; "12
livros nos últimos 30 dias" é o que as pessoas contam. A Story abre com o número
de **livros do período**, e se houver algum **terminado** naquele mês é ele que
vira o destaque ("3 livros terminados"), com as capas dos terminados e a frase
"✓ Terminei X" — que é a frase que a pessoa quer que leiam.

**Precisou nascer um dado novo: a data de conclusão.** O app sabia que um livro
*está* concluído (basta olhar a posição salva), mas não *quando* — e sem isso
não existe "terminei 3 livros em julho". O `savePlayback` passou a carimbar
`allbook_finished` quando o progresso cruza a linha. **Livros terminados antes
desta mudança não têm data** e por isso não contam no período; é o preço de não
ter registrado desde o começo, e some sozinho com o uso.

**O recorte é de 30 dias corridos, não do mês do calendário.** No dia 2 do mês,
"julho" mostraria quase nada — e a peça que não tem o que mostrar não é postada.

**Sobre publicar direto no Instagram — o limite é real e vale registrar.** Não
existe, na web, como jogar uma imagem no story sem passar pela folha nativa: o
esquema `instagram-stories://` só aceita conteúdo vindo de um **app nativo**
(SDK do Facebook), e a API do Instagram não publica story de terceiro pela web.
O caminho que **funciona** é o que está lá: `navigator.share` com o arquivo abre
a folha do sistema no celular, e o Instagram aparece como destino. No
computador, cai para download. A tela diz isso em uma linha, para ninguém
procurar um botão que não pode existir.

**Layout do story pensado para a moldura do Instagram:** a assinatura para a
~180px do fim, porque a faixa de baixo fica coberta pela caixa de resposta do
app — o que ficar ali não é lido.

---

## 4.23 Nenhum botão morto: o que dá para fazer agora e o que espera o banco (25/07)

Pedido do Matheus, e vale registrar o enquadramento porque ele **corrigiu o
meu**. Eu tinha proposto criar um estado de "livro sem narração" na ficha, e ele
apontou o erro: os livros são fictícios, **nada toca porque nada existe ainda** —
é maquete de frontend. Não é caso de inventar estado novo. Nas palavras dele:
*"os botões têm que estar todos validados e funcionando"*.

Ele acrescentou a régua que organiza o trabalho: **separar o que já dá para
resolver no frontend do que só existe quando houver banco de dados.** A varredura
achou quatro controles sem destino, e os quatro se dividem exatamente assim.

### Resolvido agora — não dependia de banco nenhum

**1. "Ver tudo" dos Lançamentos (Descobrir) — botão morto de verdade.** Sem ação
nenhuma, apesar de a tela `/collection/:slug` existir e de a Início já usar esse
mesmo padrão. **E havia um defeito por baixo que explica o primeiro:** a fileira
montava a lista à mão, num array no topo do arquivo, em vez de ler a coleção
`lancamentos` de `collections.ts` — e as duas listas **não tinham um único livro
em comum**. Ligar o botão sem consertar a fonte teria levado a pessoa a dez
títulos que ela não acabara de ver. Agora a fileira lê da coleção, e o botão leva
ao mesmo conteúdo.

**2. "Convidar amigos" (Perfil) — virou ação real.** Convite não precisa de
servidor: quem compartilha é o aparelho. Usa a folha nativa (`navigator.share`) e,
onde ela não existe, copia o convite para a área de transferência. Quando houver
servidor, o que muda é só o link — um endereço com código de indicação.

**3. "Ajuda e suporte" (Perfil) — virou tela (`/help`).** Perguntas frequentes
são conteúdo, não infraestrutura. **As respostas leem do código**: os 20% para
liberar a avaliação e o mínimo de notas para a média vêm de `ratings.ts`, o prazo
do pedido vem de `requests.ts` — se a regra mudar, a ajuda muda junto. Ajuda que
envelhece é pior que nenhuma. **Sem formulário de contato**, que seria o mesmo
beco em outro lugar; um e-mail de suporte é uma linha quando ele existir.

### Só com o banco — e um deles não é "falta implementar"

**4. "Esqueci minha senha" (Login) — removido, e o motivo importa.** Não é item
de lista de espera: **não há senha para recuperar**. O `auth.ts` decidiu
deliberadamente **não guardar senha nenhuma** no navegador (guardar em texto puro
é hábito ruim que ninguém desfaz depois), e por isso qualquer senha válida entra.
Um link de recuperação nesse modelo não estaria "por construir" — estaria
mentindo sobre como o login funciona. Ele volta junto com o servidor de contas,
que é quem passará a ter senha de verdade para redefinir.

### O que a varredura NÃO achou (para ninguém refazer)

Cinco controles pareciam sem ação e não são: quatro estão dentro de um `Link`, de
um `DropdownMenuTrigger` ou do `BookActionsMenu` (o handler está no wrapper), e um
é um botão **invisível de propósito** no player (`opacity-0 pointer-events-none`),
que só equilibra o cabeçalho. Nenhum `TODO` ou `onClick` vazio no app.

### O que fica esperando o banco, além da senha

Registro para quando o backend chegar — hoje **tudo isto vive no `localStorage`
deste aparelho** e some se a pessoa trocar de celular: biblioteca, downloads,
progresso de audição, avaliações, comentários, respostas, pedidos de livro e
perfil. Nenhum deles é botão morto (todos funcionam), mas nenhum atravessa
aparelhos. A tela `/help` diz isso à pessoa em vez de deixar a descoberta para o
dia da troca de celular.

---

## 4.24 As duas réguas do que "conta" como livro lido (25/07)

O Matheus perguntou como o app decide que um livro está concluído e levantou a
dúvida certa: "se a pessoa escuta só 10% ou 20%, ela não pode vir para cá".

**A régua de concluído era 98%, e baixou para 95%.** Audiolivro termina em
créditos, agradecimentos e trecho do próximo título; quase ninguém ouve até o
último segundo, e exigir 98% deixava livro terminado de fato marcado como "em
andamento" para sempre. **A constante mora em `lib/playback.ts` e agora é uma
só** — a Biblioteca tinha uma cópia própria, e baixar o limite num lugar deixaria
as duas telas discordando sobre o mesmo livro.

**Nasceu uma segunda régua, que faltava: o piso para *contar* como livro.** A
Story dizia "12 livros ouvidos" contando **qualquer** livro com qualquer
audição no período — abrir doze livros por dois minutos cada daria doze. Número
bonito e falso, exatamente o que o Matheus temia. Agora só entra quem passou de
**10%** (`MINIMO_PARA_CONTAR_PERCENT`); abaixo disso a pessoa espiou, não leu.
Com os dados de exemplo o número caiu de 12 para 11 na hora.

**Como o progresso é medido — duas evidências, vale a maior.** A posição salva
no player (quem retomou perto do fim ouviu pouco no mês, mas o livro está
adiantado) **e** o total acumulado no diário sobre a duração estimada (quem
ouviu 5h de um livro de 6h está quase no fim, mesmo sem posição salva). A
segunda foi indispensável: o histórico de demonstração alimenta o diário e
**não** o player, então só a primeira zeraria a Story inteira.

**Até seis capas na Story.** Até três, uma fileira grande com o título de cada
livro; de quatro a seis, duas fileiras menores e **sem título** — com seis nomes
embaixo a peça vira lista, e o que convence num story é a parede de capas. Cada
fileira é centralizada, para a última não ficar torta quando vem incompleta
(5 capas = 3 + 2).

**Sobre "tempo de audição" ser ou não uma boa métrica** — a dúvida do Matheus
tem resposta diferente para cada peça, e é assim que ficou: **hora não é o herói
em lugar nenhum que seja público**. Na Story o número grande é livro; a hora
sobrou como linha de apoio, onde ela funciona (dá tamanho ao esforço). No
Resumo, que é uso pessoal, a hora continua no topo porque ali ela é o dado mais
honesto do acervo.

---

## 4.25 A Story só mostra número que é do AllBook — e página não é (26/07)

O Matheus quis trocar o conteúdo da Story: tirar peças fracas e pôr informação
que valha o espaço. As três linhas com bolinha ("12h 30min de audição", "20 dias
com audição", "Romance em alta") saíram. Elas gastavam 200px de altura para
dizer pouco, e o que diziam era **esforço**: hora e dia de uso só significam algo
para quem já usa o app. No lugar entrou uma **faixa de três números em colunas**,
com filete acima, e um **fecho com nomes** embaixo das capas.

**Como os números são escolhidos: fila de candidatos, não lista fixa.** Entra o
primeiro que tem substância — livros ouvidos (quando o herói são os terminados),
gêneros, vozes, dias seguidos, autores, ritmo ("3 dias por livro"), fila. Assim a
peça nunca mostra "0 dias seguidos" nem coluna vazia, e quem ouve pouco vê
números diferentes de quem ouve muito. Duas regras que só apareceram testando:
**candidato que repete o número gigante é descartado** (com 11 livros de 11
autores, a peça mostrava "11" duas vezes e parecia erro de cálculo) e **o ritmo
só entra a partir de três livros** — com dois a conta dá "15 dias por livro", e
ninguém posta o próprio ritmo quando ele parece lento.

**"Páginas" entrou e saiu no mesmo dia — este é o registro mais importante da
seção.** A ideia era boa: página é a moeda que qualquer leitor compara, e resolve
a objeção contra hora. Caiu em duas etapas, as duas por argumento do Matheus:

1. A primeira versão convertia hora em página por uma média (33 páginas/hora).
   Ele apontou que isso é chute — e é: punha uma estimativa no número mais
   concreto da peça.
2. A segunda usava a **página real da ficha** de cada livro, multiplicada pelo
   progresso. Ele derrubou de novo, com o argumento decisivo: a ficha vem da
   **Open Library**, dado externo que só existe para os livros importados. Quando
   o AllBook subir os próprios livros — que é o rumo do projeto — a maioria não
   terá página nenhuma, e a métrica viraria zero ou invenção.

**A regra que ficou: em peça pública, só número que o próprio app produz.** Livro,
gênero, autor, voz, ritmo, fila, terminados. Nada de catálogo emprestado. A
função `paginasEquivalentes` foi apagada para ninguém reusá-la por engano; a
constante `PAGINAS_POR_HORA` continua em `books.ts`, mas **só no sentido
páginas → duração**, e com o aviso de que a duração real do áudio vai substituí-la.

**"Vozes" nasceu daí** e é o número mais AllBook da faixa: quantos narradores
diferentes te acompanharam no mês. Num app de leitura ele não existe.

**O lema mudou.** Era "audiolivros em português", que descreve a **categoria** —
qualquer concorrente poderia assinar a mesma frase. Virou **"todos os livros, em
voz alta"**: explica o nome (All = todos) e promete o que o AllBook quer ser, um
lugar onde qualquer livro existe em voz, não um catálogo fechado.

**Bug antigo achado no caminho (peça Resumo, não Story):** com uma ou duas capas,
a largura era dividida entre elas e a capa esticava para 608px de altura,
escrevendo o título **por cima** do rodapé e da assinatura. Só não aparecia
porque o histórico de demonstração sempre tem três. Agora a capa tem teto: nunca
maior do que seria com três.

---

## 4.26 Na Story, nome vale mais que contagem (26/07)

A faixa de contagens da 4.25 ("8 GÊNEROS · 9 VOZES · 3 DIAS POR LIVRO") durou um
dia. O Matheus olhou e mandou reformular: mais bonita, mais bem apresentada, e
as contagens fora. O diagnóstico que orientou a troca: **contagem é telemetria**
— "8 gêneros" não conta história nenhuma, e ninguém comenta um story por causa
de uma quantidade. O que rende conversa é **nome**. É o mesmo motivo de o
Wrapped do Spotify dizer *qual* foi a sua banda do ano, não *quantas* bandas
você ouviu.

**O que a peça mostra agora:** até quatro destaques em duas colunas, cada um com
rótulo pequeno na cor da marca e o nome grande embaixo — GÊNERO DO MÊS, AUTOR DO
MÊS, VOZ DO MÊS e uma quarta vaga em fila: RITMO ("3 dias por livro", só a
partir de três livros), senão SEQUÊNCIA, senão NA FILA. Autor e narrador
**subiram** do fecho para cá; o fecho ficou só com o "✓ Terminei …", e só quando
a grade de capas não mostra os títulos.

**O acabamento que acompanhou** (o pedido era "bonita", não só "outros dados"):
sombra sob cada capa (capa escura sobre fundo escuro virava mancha); um filete
que começa laranja e termina cinza sobre os destaques — o único adorno da peça,
de propósito; um calor quase invisível subindo do canto de baixo do fundo; e o
**layout empilhado**: cada bloco começa onde o anterior terminou, porque com
posições fixas quem tinha uma fileira de destaques via um buraco de 130px no
meio da peça. De quebra, `desenharCapas` deixou de duplicar o desenho de
`pintarCapa` — era o mesmo código duas vezes, e a sombra teria que ser colada
nos dois lugares.

**O Resumo entrou na mesma família (26/07, na sequência).** A pedido do
Matheus, a peça 4:5 ganhou a mesma gramática: a linha corrida do rodapé
("Romance · Narrador: Helena Vasques · mais à noite" — três informações num fio
de 28px que ninguém lia) virou dois destaques nomeados, GÊNERO FAVORITO e VOZ
MAIS OUVIDA, com o recorte "desde sempre" (na Story o recorte é o mês). O
horário subiu para a linha de apoio do número grande, agora com a preposição
certa por faixa — o rodapé dizia "mais à manhã", crase errada que ninguém tinha
notado. E as duas peças **assinam igual**: "AllBook · todos os livros, em voz
alta" — quem vê uma depois da outra reconhece a família.

---

## 4.27 O botão que apontava para baixo e não abria nada (26/07)

**O que o Matheus viu:** na Início, o botão "Categorias" tinha uma seta apontando
para baixo — *"teoricamente ele iria expandir uma lista, porque é isso que deixa
a entender"* — mas o clique **navegava** para a tela Descobrir. E a Descobrir
começa com um campo de busca, então a sensação era de cair na tela Buscar:
*"ele fica sem sentido. Ele está ali porque ele não tem uma função."*

Ele mesmo delimitou as saídas: **ou expande, ou abre outra coisa, ou não existe.**

### A escolha: fazer a seta cumprir o que promete

Expandir a lista ali mesmo, na própria Início. Os oito gêneros do catálogo em
duas colunas; tocar num deles leva a `/category/:slug`, tela que já existia.

**Por que não simplesmente apagar o botão** (a saída mais barata): a lista de
gêneros é conteúdo real e **não existia em lugar nenhum da Início**. Apagar o
botão resolveria a mentira da seta e tiraria junto o único atalho para navegar
por gênero da tela principal — trocaria um defeito por uma ausência.

**Por que não trocar a seta por uma que aponta para o lado** (manter a
navegação): o destino é justamente o que o Matheus achou sem sentido. Consertar
o ícone deixaria o botão honesto e ainda assim inútil.

### O que o botão passou a mostrar, e por quê

- **Gênero ≠ coleção.** A lista que abre são os **gêneros** (Terror, Romance…),
  que levam a `/category/:slug`; os cards coloridos logo abaixo são **coleções
  curadas** (Lançamentos, Favoritos…), que levam a `/collection/:slug`. São
  listas diferentes — os dois blocos convivem sem repetir.
- **Ícone no lugar de cor, e sem contagem** — mudança feita **no mesmo dia**, em
  resposta à primeira versão (ver abaixo).

### A cor durou uma versão: ícone diz o mesmo sem o arco-íris

A lista nasceu com uma **barrinha no gradiente de cada gênero** e o **número de
livros** ao lado. O Matheus derrubou as duas coisas no mesmo pedido:

> *"quando você coloca uma coisa colorida, talvez cai um pouco no padrão, e a
> gente já tava brigando sobre isso… tava pensando em colocar ícones: uma
> miniatura que remetesse a romance, uma que remetesse a ficção."*

**Sobre a cor:** oito cores diferentes numa lista só é exatamente a "cara de
template" que já tinha derrubado os cards de gradiente chapado (ver "Estilo:
evitar a cara de IA"). O ícone monocromático carrega a mesma informação — *que
assunto é este* — sem o arco-íris. Regra que ficou: **uma cor só, a da marca**;
os ícones ficam em cinza claro e acendem em laranja no toque.

**Sobre a contagem:** ela tinha sido posta como antídoto contra botão morto —
mostrar que existe conteúdo do outro lado antes de tocar (a disciplina de 4.23).
O Matheus julgou que *"não acrescenta muita coisa"*, e ele está certo no caso:
quem escolhe um gênero quer o **assunto**, não o estoque. A garantia de que o
botão leva a algo continua existindo — só não precisa ser dita em número.

Ficaram **de fora** de propósito a lupa (já é o ícone de busca no menu) e a
pessoa sozinha (já é o do perfil) — ícone repetido em dois sentidos confunde.

### E o ícone pronto durou uma versão também: os oito passaram a ser desenhados

Vendo os ícones da `lucide-react` na tela, o Matheus pediu mais: *"a gente podia
colocar uns ícones mais bonitos, mas bem elaborados, mais sofisticados"* — e
apontou o de Produtividade (uma lista de tarefas) como o mais genérico.

**Como a decisão foi tomada:** em vez de eu escolher sozinho, montei uma folha
com **três propostas lado a lado** para os oito gêneros, no mesmo cinza e no
mesmo fundo do app — (A) o que estava no ar, (B) outro ícone da mesma
biblioteca, (C) desenho próprio. Ele escolheu **C**. Vale registrar o método: a
comparação visual resolveu em um minuto o que uma descrição em texto não
resolveria, porque "sofisticado" só quer dizer alguma coisa quando se vê.

**A regra que define o conjunto** (`components/GenreIcon.tsx`): contorno fino
**mais um único elemento preenchido** em cada ícone — a cratera do planeta, os
olhos da caveira, o furo da chave, a barra mais alta do gráfico, a areia da
ampulheta. Biblioteca pronta é só contorno; é o contraste entre linha e sólido
que dá o peso de ícone caro, e ele não vem de prateleira. O invólucro (viewBox,
traço, pontas arredondadas) é o mesmo para todos — é isso que faz os oito
parecerem uma família em vez de oito desenhos avulsos.

**Dois detalhes que só apareceram testando no tamanho real:**
- Eles ficaram em **18px, e não nos 16px** de um ícone comum: abaixo disso o
  elemento sólido some dentro do traço e o desenho vira mancha.
- O broto da Autoajuda nasceu com a base larga e **parecia uma taça** em tamanho
  pequeno. Base encurtada e folhas maiores resolveram.

### Preparação para o catálogo crescer

Aviso do Matheus no mesmo dia: *"esse número de categorias vai expandir bastante…
imagina aí, vinte mil audiolivros"*. A lista ganhou **teto de altura e rolagem
própria**: hoje, com 8 gêneros, ela nem chega perto do limite; com dezenas de
categorias ela rola dentro do próprio bloco em vez de empurrar a Início inteira
para baixo. **Ainda não resolvido** para essa escala: com muitas dezenas de
categorias, uma lista rolável fica ruim de varrer — aí vai pedir agrupamento
(gêneros principais e subgêneros) ou um campo de filtro dentro da lista. Fica
anotado para quando o acervo justificar.

### ~~Fica em aberto: a tela Descobrir perdeu a aba dela~~ — RESOLVIDO em 4.32

**Decidido em 26/07: fundida na Buscar.** O registro abaixo fica como estava,
porque descreve o problema; a decisão e o motivo estão em **4.32**.

Levantado aqui porque a queixa encostou nisso, mas **não decidido nem mexido**.
Quando "Buscar" e "Pedir" entraram no menu de baixo, **Descobrir saiu** — hoje
ela só é alcançada por links soltos (estados vazios da Biblioteca e dos
Downloads, ficha do livro, player). Ela também abre com um campo de busca falso
que leva para `/search`, o que a faz parecer a tela Buscar — foi exatamente a
confusão que o Matheus relatou. As saídas plausíveis: fundir Descobrir com
Buscar (a Apple TV faz assim), devolver uma aba a ela, ou aposentá-la
distribuindo suas fileiras entre Início e Buscar. **Decisão do Matheus.**

---

## 4.28 Quem narra, se já existe narração? (26/07)

O Matheus achou um furo no pedido de livro, e ele é de lógica, não de tela:

> "Se o livro existe narrado, a pessoa escolher o narrador, ela não vai ter esse
> poder de escolher o narrador, porque o livro já está narrado. (…) Também a
> pessoa que tá solicitando **não sabe** se existe ou não esse livro dublado."

Ou seja: o formulário pedia "quem narra" **antes** de alguém saber se alguém já
narrou. Quando o livro já tem áudio, o AllBook traz a narração que existe — e a
voz escolhida não vale nada. Era **promessa quebrada**, e feita a quem não tinha
como responder a pergunta.

**A regra que ficou: nunca perguntar o que só o app pode descobrir — e escrever o
"se" quando a resposta depende dele.** O rótulo do campo virou **"Quem narra, se
o estúdio gravar"**. Uma palavra resolve: a escolha continua ali para quem quer
opinar, e agora diz exatamente quando vale. **Rejeitado esconder o campo** até
saber se o livro tem narração — sem servidor isso é só sonegar informação, e o
campo escondido faria a pessoa achar que não pode escolher nunca.

**O que o app confere na hora, de verdade:** o próprio catálogo. Digitando o
título, se ele já está no AllBook aparece um aviso com capa, narrador e o atalho
"Ouvir agora" (`alreadyInCatalog`, em `lib/requests.ts`). É a única das três
respostas possíveis que o frontend pode dar sem servidor — as outras duas ("já
existe narração publicada lá fora" e "ninguém narrou ainda") dependem de uma base
de audiolivros que ainda não existe, e por isso a **etapa 2 do caminho do pedido
virou uma pergunta**: "Já existe narração?".

O aviso **não bloqueia** o botão de pedir: o casamento por título é palpite (há
títulos parecidos), e travar o pedido por palpite é pior do que informar.

### Rejeitado no mesmo dia: deixar a pessoa pedir "produção do estúdio" no pedido

Antes de chegar ao rótulo com "se", a tela ganhou **um par de opções**: *"se já
existir narração, pode ser ela"* ou *"quero uma do AllBook Studio"*. Como
interface funcionava — era a pergunta que qualquer pessoa consegue responder sem
conhecer o livro. **Como negócio era ruim**, e o argumento do Matheus derrubou:

> "Se o livro já existe, pra gente seria mais fácil, mais barato, mais tranquilo
> produzir o livro, sendo que a pessoa vai pagar a mesma coisa. Quando você
> coloca isso, você dá a possibilidade à pessoa pular para uma produção do
> estúdio. Isso pode acabar encarecendo, mas deixando o processo mais trabalhoso
> pra gente."

**A regra que fica: não oferecer o caminho caro a quem se contentaria com o
barato.** Diante de dois botões, muita gente marca o que **parece** melhor, não o
que precisa — e cada uma dessas marcações troca uma narração pronta por uma
gravação inteira, pelo mesmo preço. O par de opções foi removido, junto com o
campo `preference` que guardava a escolha.

### Fica em aberto: onde nasce a saída de quem não gosta da narração existente

A pergunta original do Matheus segue de pé — *"se ela não gostar dessa narração e
preferir a narração com o Inhá, como fica?"*. A saída **não pode** morar no
pedido, pelo motivo acima. A proposta registrada, para quando ele decidir: ela
nasce **na ficha do livro**, para quem já tem aquele livro e já ouviu — pedido
raro, feito por quem tem motivo real, e não a opção padrão de todo mundo. É
também o lugar natural para o preço aparecer, se a regravação for paga (preço e
plano continuam em aberto neste roteiro). **Nada disso foi construído** — está
aqui como decisão pendente, não como plano aprovado.

**Atualização de 26/07 — o mecanismo apareceu:** os planos com **crédito de
pedido** (ver "Modelo de negócio", atualização de 26/07) resolvem isto sem nenhum
botão novo. Todo pedido **gasta 1 crédito**, trazer ou gravar. Ninguém pula para o
caminho caro por capricho, porque qualquer pedido custa um crédito seu — e quem
realmente não suporta a narração existente tem a saída pela qual pagou. E o
resultado desse pedido **não vira um segundo livro no catálogo**: vira uma segunda
narração do mesmo livro, com um seletor de narrador (ver 4.28).

---

## 4.29 O player prometia marcações que nunca existiram (26/07)

O Matheus foi usar: abriu o player, tocou nos três pontinhos, escolheu
"Marcações e notas" — e **não apareceu nada**. Ao investigar, o buraco era maior
do que o relato:

- o item do menu abria um aviso escrito *"suas marcações e notas deste título
  aparecerão aqui"* — uma promessa para um lugar que **não existia**;
- e o botão **"+ Marcação"**, na barra de baixo, também só mostrava um aviso
  ("Guardamos o ponto em 1h 12min") e **não guardava nada**. Quem marcasse um
  trecho perdia tudo ao sair da tela.

Ou seja: a função inteira era um cenário. **Agora existe de verdade** —
`lib/bookmarks.ts` (no molde de `library.ts`: ler nunca quebra, escrever avisa a
tela por evento) e o painel `MarcacoesDoLivro.tsx`, com as três coisas que uma
marcação pede: **ir para o ponto**, **escrever a nota** e **apagar**. O menu
mostra quantas marcações o livro tem, e o ícone da barra fica preenchido quando
há alguma — sem isso, nada na tela dizia que havia algo guardado.

**Duas decisões pequenas que evitam defeito:** salvar duas vezes no mesmo lugar
não cria duas linhas (marcações a menos de 5 segundos de distância são a mesma —
sem isso, dois toques no botão enchiam a lista de repetições), e a nota é
**opcional**: marcar tem de ser um toque só, escrever é para quando a pessoa
quiser.

**O vazio tem instrução, não é mudo.** Quem chega ao painel pelo menu precisa
saber *como* criar a primeira marcação — o botão está na outra ponta da tela.

### O azul que não era da casa

Na mesma passada, o Matheus apontou que o player "distorce a cor do aplicativo".
Estava certo, e era herança do rascunho antigo:

- o **menu dos três pontinhos** tinha fundo `#1c2a3d`, azul-marinho — a única
  superfície azul do app inteiro;
- o **modo carro** abria num degradê **verde → azul-marinho** (`#1a4d35` →
  `#0a101f`), duas cores que não existem na identidade;
- os quadros de **Bluetooth** usavam o azul do logotipo do padrão, inclusive um
  losango que imitava o ícone do Android;
- o diálogo de duração personalizada era `#3d3d3d` com canto pequeno, com cara
  de caixa nativa do Android.

Tudo passou para a escala da casa: `#1a1a1a`/`#1c1c1c` com borda branca a 10%, e
o laranja da marca onde havia azul. **O ícone já diz que é Bluetooth — a cor pode
ser a nossa**; e num diálogo que é nosso, o ícone é o nosso.

### O degradê que comia a barra de ações (a causa raiz, achada em 26/07)

O Matheus voltou dizendo que o botão de marcação estava "escondido" e "não
funcional". Ele estava certo, e o defeito era maior e mais antigo do que o
relato: **a barra de ações inteira era pintada por baixo de um degradê**.

O player desenha um degradê sobre a capa de fundo — `absolute inset-0`,
terminando em `#141414` **opaco** — e esse elemento cobre a tela toda. Pela ordem
de pintura do CSS, um elemento **posicionado** vai por cima de todo conteúdo não
posicionado, **mesmo do que vem depois no HTML**. A `<footer>` era conteúdo
comum: ícones e rótulos ficavam debaixo do degradê.

**A pista estava à vista e passou despercebida:** das quatro ações, só "+
Marcação" aparecia — e era justamente a única que tinha ganhado um `relative`
solto na mudança anterior, por acaso. Velocidade, Modo Carro e Temporizador
estavam invisíveis havia muito mais tempo.

O conserto é uma camada própria para a barra (`relative z-10`), não um `relative`
espalhado em cada pedacinho. **Lição para o projeto:** neste player, qualquer
coisa nova fora do `<main>` precisa de camada própria, senão o degradê a engole
— e o sintoma é silencioso, porque o elemento continua no DOM, clicável e com
tamanho certo. `getBoundingClientRect` e `elementFromPoint` **não** acusam o
problema (o degradê tem `pointer-events: none`); só uma captura de tela mostra.

**Na mesma passada, a barra foi refeita** (`BarraDeAcoesDoPlayer.tsx`): alvos de
toque de verdade em vez de ícones de 20px soltos, rótulo de 10px a 60% de branco
no lugar de 9px a 40%, e — o principal — **"Minhas" ganhou lugar fixo na barra**,
com o número de marcações num selo. Antes a lista só abria pelo menu de "…" ou
por um **toque longo** que ninguém adivinha. O botão só aparece quando existe a
primeira marcação: o acesso nasce junto com o conteúdo.

### As marcações saíram do player (26/07, na sequência)

Com a barra consertada, o Matheus fez a pergunta que faltava: *"essas marcações
estão indo para onde? Como é que o usuário pode enxergar?"*. A resposta medida no
código era ruim: **só quatro arquivos liam as marcações, todos do fluxo do
tocador**. Quem marcasse trechos em cinco livros precisava abrir cinco players
para lembrar do que guardou, e a **ficha do livro** — onde se decide retomar —
não dizia nada. Guardar sem poder rever de fora é quase guardar no lixo.

**Três lugares novos**, todos sobre a mesma consulta (`bookmarksByBook`):

1. **`/bookmarks` — "Minhas marcações"**: tudo agrupado por livro, do mexido mais
   recente para o mais antigo, com a nota embaixo de cada trecho. Dá para ouvir,
   editar a nota e apagar sem sair da tela.
2. **Ficha do livro**: um cartão logo abaixo do progresso ("2 marcações suas · 1
   com nota escrita") que abre **o mesmo painel do player** — reuso, não uma
   segunda lista escrita de novo.
3. **Perfil**: entrada ao lado de "Minha lista", com o total. É a mesma natureza
   das duas — coisa **sua** guardada no app.

**O player passou a aceitar `?t=SEGUNDOS`** ao lado de `?chapter=N`, e `t` ganha
quando os dois vêm juntos, por ser o mais específico. Sem isso, tocar numa
marcação levaria ao **começo do capítulo** — perdendo justamente o que ela
guarda, que é o instante.

### Nenhum aviso aparecia dentro do player (26/07)

O Matheus voltou: *"o botão marcar, do lado de soneca, não está funcionando"*.
Medido no navegador com clique de mouse real: **o botão gravava certo** — o
contador subia a cada toque. O que não funcionava era o **retorno**.

`ToastViewport` vinha do shadcn com `z-[100]`, e o player é
`fixed inset-0 z-[100]` — **o mesmo nível**. Empate de `z-index` é resolvido pela
ordem no DOM, e o player, montado depois, cobria o aviso inteiro. Efeito: dentro
do tocador **nenhum** toast jamais apareceu — nem "Marcação salva", nem "Marcado
como concluído", nem "Link copiado". A pessoa toca e a tela não responde nada; a
conclusão óbvia é que o botão está quebrado.

Duas correções, e a segunda existe porque a primeira não basta:

1. **`z-[300]` no viewport dos toasts** — acima do player e das gavetas dele
   (que vão de 110 a 200). Conserta o app inteiro, não só este botão.
2. **A confirmação no próprio botão**: o rótulo vira "Guardado" com um ✓ por 1,5s.
   Em celular o dedo está na barra de baixo e o aviso nasce longe dele — e um
   retorno que depende de outra camada é frágil, como este caso provou. Tocar
   **duas vezes no mesmo ponto** também confirma ("Já tinha"): antes ficava mudo,
   que era outra forma de parecer quebrado.

**Lição repetida, agora com nome:** este é o segundo defeito seguido no player
causado por **empilhamento** — o primeiro foi o degradê cobrindo a barra de
ações. O player é `fixed inset-0 z-[100]` e engole o que não estiver acima dele.
Ao pôr qualquer coisa nova em cena aqui, pergunte primeiro: *em que camada isso
vai parar?*

### "Marcar" não era marcar, era anotar (26/07)

O Matheus olhou o botão pronto e viu o que faltava: *"a ideia de marcar não era,
na verdade, marcar, mas anotar. Você primeiro salva a marcação e depois vai lá e
edita"*. Ele tem razão — sem a nota, o app guarda **um relógio, não um
pensamento**, e escrever exigia ir à lista e caçar a marcação.

**Não virou uma coisa só, e essa é a decisão que importa registrar.** A saída
óbvia seria o toque abrir a caixa de escrita e salvar só ao confirmar. Foi
rejeitada: quem ouve **caminhando, dirigindo ou lavando louça** toca e segue a
vida — se a nota fosse condição para guardar, fechar a caixa perderia o trecho, o
oposto do que o botão promete. O que ficou:

- o toque **grava o ponto na hora** e a caixa abre por cima dele **já salvo**;
- fechar sem escrever mantém a marcação (por isso o botão diz **"Agora não"**, e
  não "Cancelar" — não há nada a cancelar);
- ponto repetido **traz a nota que já existia**, para completar em vez de
  escrever por cima;
- o áudio **pausa enquanto a caixa está aberta e retoma ao fechar**, se estava
  tocando: escrever com o livro correndo faz perder o trecho seguinte;
- **o Modo Carro fica de fora** — lá continua um toque só, sem caixa nenhuma.
  Ninguém escreve dirigindo, e é justamente ali que a tela é grande e simples de
  propósito.

### "Marcações" virou "notas", e os atalhos subiram no Perfil (26/07)

Minutos depois, o Matheus procurou as anotações no Perfil e **não achou** — mesmo
com o item já lá, funcionando. Duas causas somadas, e as duas valem registro:

**1. Vocabulário.** Ele procurava por *anotações*; a interface dizia
*marcações*. Não era só preferência: desde que "Marcar" passou a abrir a caixa de
escrita, o que se guarda ali é **o que a pessoa escreveu**, com o ponto do áudio
anexado — "nota" é a palavra correta, e "marcação" descrevia a versão anterior da
função. Renomeado em todos os lugares visíveis: Perfil, tela `/bookmarks`, botão
da barra do tocador ("Notas"), menu de "…" e o cartão da ficha do livro. **O nome
interno segue `bookmarks`** (chave, módulo, tipos) — trocar isso quebraria o
storage de quem já usa, sem ganho nenhum para quem lê a tela.

**2. O item estava enterrado.** A lista de atalhos vinha **depois** da foto, dos
quatro números, das três recomendações e de dezesseis medalhas em quatro
categorias. O grupo de conteúdo (Minha lista, Minhas notas, Estatísticas,
Downloads, Comunidade) subiu para logo abaixo dos números; o grupo de conta
(Notificações, Configurações, Convidar, Ajuda) ficou no fim. **Navegação antes de
vitrine** — o Perfil tinha virado uma vitrine com a navegação no rodapé. Para
isso o item virou o componente `GrupoDeAtalhos`, e os dois grupos passaram a
poder morar em lugares diferentes da página.

**3. "Minha lista" saiu da lista** (ideia dele, na sequência): ia para
`/library`, exatamente onde o ícone de **Biblioteca** da barra de baixo já leva.
Era atalho duplicado — e ocupava a primeira linha, a mais nobre. Com ele fora,
"Minhas notas" virou o primeiro item e herdou o **ícone de marcador de página**,
que é o mesmo símbolo que o tocador usa para marcar trecho: o desenho passou a
ser o mesmo nos dois lugares. O contador `libraryCount` foi apagado junto — sem o
item, era leitura do storage a cada abertura do Perfil para um número que ninguém
via.

**Lição que se repete nesta sessão:** três defeitos seguidos ("o botão não
funciona", "não acho as anotações") não eram funcionais — eram de **visibilidade**.
O código fazia o que devia; a tela não contava. Vale checar isso antes de sair
depurando lógica.

---

## 4.30 Um livro, várias narrações — e um seletor de voz (26/07)

O Matheus levou o pedido até o caso difícil: chega um pedido de um livro que **já
está no app**. O AllBook procura outra narração existente; se não achar, o estúdio
grava. Resultado: a plataforma passa a ter **duas narrações da mesma obra**. Sobem
dois livros?

> "Nesse caso, não subir os dois livros, a gente meio que colocar um botãozinho
> dentro do player, onde a pessoa possa trocar quem é a pessoa que está narrando.
> (…) Não sei se esse botãozinho ficaria só no player, mas também poderia ficar na
> parte de fora."

**Decisão: um livro, várias narrações.** Dois cartões do mesmo título seria o pior
dos mundos — a busca devolveria a mesma obra duas vezes, a biblioteca também, e
**nota e comentário se dividiriam entre dois lugares** quando são da mesma obra. A
obra é uma; quem varia é a voz. Isso resolve de quebra o que a 4.28 deixou em
aberto: o pedido de quem não gostou da narração não cria um livro concorrente, cria
uma alternativa dentro do mesmo.

**Onde fica o botão: nos dois lugares, e eles servem a momentos diferentes.** Na
ficha, antes de começar — é ali que se escolhe com calma, lendo o timbre de cada
voz. No player, durante — é lá que a pessoa descobre que não gosta daquela voz, e
obrigá-la a voltar para a ficha para trocar seria pedir que ela desista.

**O que está construído:** `lib/narrations.ts` (as narrações e a escolha, no
`localStorage`), o componente `SeletorDeNarracao` e a ligação nos **dois**
lugares. Na **ficha**, "Narrado por" passou a mostrar a narração escolhida e o
seletor é a linha fina logo abaixo. No **player**, uma linha discreta sob o autor
("Narrado por Fulano · trocar") abre uma gaveta com as vozes — a mesma casca da
lista de capítulos, para o player não ter dois jeitos de mostrar uma escolha, e a
mesma lista de opções da ficha (`ListaDeNarracoes`), para não existirem duas
versões do cartão de voz. **Só aparece quando há mais de uma voz**: livro com uma
narração não mostra nada, nem botão apagado nem "1 narração" (regra da 4.23).

**Detalhes que o desenho carrega de propósito:**
- Cada opção mostra o **timbre da voz**, a mesma frase do perfil dela. Escolher
  entre dois nomes desconhecidos não é escolher, é apostar.
- O selo distingue **"Narração original"** de **"Produzida a pedido"** — sem isso,
  ninguém entende por que existem duas.
- Três livros têm narração extra (Duna, Hábitos Atômicos, O Iluminado), **dado de
  exemplo como o resto do catálogo**. São poucos de propósito: o seletor tem de
  ser exceção, não enfeite de toda ficha.

**Falta:** o áudio de fato mudar de faixa — que só existe quando houver áudio de
verdade. Hoje a troca muda quem o app credita; no dia em que houver arquivo, ela
muda o que toca, **sem mudar a interface**.

---

## 4.31 "Meu acesso": a reforma que não convenceu, e a tela saiu (26/07)

> **DESFECHO, para ler antes do resto:** a reforma descrita aqui foi construída,
> mostrada, e **rejeitada** — *"não gostei de nada disso, pode deletar"*. A tela
> foi **removida**: a rota `/plans`, o arquivo `Plans.tsx` e o item do Perfil não
> existem mais. O que fica registrado é **o que foi tentado**, para ninguém gastar
> o mesmo esforço de novo achando que é ideia nova.
>
> **A lição, e ela é maior que esta tela:** o defeito original não era o conteúdo
> ruim — era a **tela não ter pergunta para responder**. "O que é meu no AllBook"
> não é uma dúvida que alguém tem: quem quer a lista abre a Biblioteca, quem quer
> os baixados abre Downloads, quem quer o retrato abre Estatísticas. Encher de
> número real uma tela sem pergunta só faz um resumo bonito de coisas que já têm
> tela própria. **Tela precisa de pergunta, não de conteúdo.** A `/plans` volta a
> existir quando a pergunta existir — *"quantos créditos eu tenho e o que faço com
> eles"* —, e aí ela nasce do zero.

O relato do que foi tentado:

O Matheus olhou o item "Meu acesso" do Perfil e não entendeu por que ele existia:
*"os botões não fazem nada, não estou entendendo por que ele existe"*. Depois deu
a chance com prazo: *"me surpreenda, senão ele simplesmente vai sair"*.

**Os dois defeitos, e ele acertou os dois.** (1) As seis linhas usavam o desenho
dos itens de menu do Perfil — cartão, ícone laranja, título e subtítulo — mas eram
`div`. **Texto fantasiado de botão**, que é a 4.23 em outra forma: não havia botão
morto, havia coisa com cara de botão. (2) O conteúdo dizia o óbvio: "Catálogo
completo — todos os audiolivros, sem bloqueio". **Ninguém precisa que o app informe
que existe um catálogo** — isso se vê usando o app.

**A virada, em uma frase: em vez de listar o que existe, mostrar o que é seu.**
Cada linha traz **o número da pessoa** — 59 títulos e quantos você começou, livros
guardados, baixados, marcações e velocidade em uso, quem você segue, pedidos
feitos — e **leva ao lugar**, agora como botão de verdade. Quem já usa vê o próprio
retrato; quem não usou recebe **convite com caminho**, e o ícone fica apagado para
a diferença ser visível de longe. O cabeçalho troca "você tem o AllBook inteiro
nas mãos" (verdadeiro e vazio) por "já está usando **5 recursos de 6**", com um
filete de progresso — texto e filete, sem medalha nem porcentagem gigante, pela
regra de evitar a cara de IA.

**Duas decisões de conteúdo que valem registro:**
- **"Pedir um livro" entrou na lista.** Estava fora, e é o diferencial do app: a
  tela que fala do que é seu não podia omitir justamente o que nenhum concorrente
  tem.
- **"Sem anúncios" saiu da lista e virou rodapé.** É o único benefício sem número
  possível, e item sem número quebraria o padrão que a tela acabou de criar.

**Fronteira desenhada de propósito com a tela Estatísticas:** Estatísticas é sobre
**audição** (horas, livros terminados, gêneros, troféus); "Meu acesso" é sobre
**recursos** — o que do app você está aproveitando. **Nenhuma hora e nenhum livro
lido aparece aqui**, para as duas telas não repetirem conversa.

**O destino de longo prazo não mudou:** quando os números do plano fecharem, é
aqui que os créditos do mês moram ("você tem 2 créditos, usou 1"), ao lado do uso
dos recursos. A tela agora tem função **antes** disso, o que era o problema.

---

## 4.32 A Descobrir foi fundida na Buscar (26/07)

**A regra que nasceu antes da decisão, e que vale para o projeto inteiro:**

> *"As nossas decisões têm que ser tomadas independentemente de existir servidor
> ou não. Hoje ainda não existe servidor, mas é o próximo passo do projeto. (…)
> O servidor não limita as nossas decisões."* — Matheus, 26/07

Isso derrubou um argumento meu no meio desta mesma conversa (ver "o Top 10" mais
abaixo) e **muda o critério de todas as decisões daqui para a frente**: desenhar
a versão final, e deixar para depois só a **fonte** dos dados. Não encolher a
interface por causa de uma limitação que some no passo seguinte.

### O diagnóstico: ela era invisível, não feia

O Matheus não conseguia dizer o que era a tela Descobrir — *"eu já não sei o que
é que ela significa"*. Levantando o caso, o motivo apareceu inteiro, e não era
questão de gosto:

- **Não tinha aba** no menu de baixo (Início, Biblioteca, Pedir, Buscar, Perfil).
- **Não tinha nome em lugar nenhum da interface.** "Descobrir" só existia como
  nome de arquivo e de rota. Os 5 links que levavam até ela usavam **4 nomes
  diferentes**: "Explorar o catálogo" (Biblioteca vazia, Downloads, ficha do
  livro), "Ver todos os gêneros" (categoria) e "Títulos recomendados" (menu do
  player).
- **O primeiro clique dentro dela te expulsava:** o campo de busca do topo era
  falso — um botão com cara de campo — e navegava para `/search`.
- **Três dos quatro blocos já existiam em outro lugar:** busca (aba Buscar),
  gêneros (botão "Categorias" da Início, 4.27), Lançamentos (card da Início).

**Como a conclusão apareceu, e por que isso vale registro:** três explicações em
texto não resolveram. O que resolveu foi **dirigir o app com o cursor**,
narrando cada passo — Início → player → três pontinhos → "Títulos recomendados"
→ Descobrir → clique no campo → some. Ver o menu de baixo **sem nenhum ícone
aceso** foi a prova que nenhum parágrafo deu. Para telas, demonstrar ganha de
descrever.

### A decisão, e de quem foi o argumento

**Fundir na Buscar** — proposta do Matheus, com o melhor argumento que apareceu:
*"essa tela de descobrir é mais bonita do que a tela de buscar, pelo fato dela
ter essas cartãozinhas de ficção científica, romance, terror"*. Fundir resolve
os dois lados de uma vez: a tela órfã não vira lixo, e a Buscar — que era só um
campo e uma grade de capas — ganha o que lhe faltava.

**Rejeitadas:** (a) *aposentar de vez*, minha recomendação inicial, porque
jogaria fora a grade de gêneros, que é justamente a parte boa; (b) *devolver uma
aba a ela*, porque o menu iria a seis itens e ela continuaria repetindo a Início.

### O que veio, o que ficou de fora

A aba Buscar, com o campo vazio, mostra nesta ordem: **porta do pedido** (já
existia) → **"Navegar por gênero"** (os cartões com capas) → **"Em alta"**.

- **"Lançamentos" não veio.** Já é um dos cards coloridos da Início; repetir
  seria a mesma lista em dois lugares.
- **A grade de gêneros passa a existir em dois lugares, e está certo assim.** Na
  Início é uma lista compacta de pastilhas com ícone (4.27), para quem está
  passeando; na Buscar são cartões com capas, para quem abriu a busca sem saber
  o que procurar. Mesmo destino, momentos e desenhos diferentes.

### O Top 10 virou "Em alta" — e a numeração ficou

O "Top 10 da semana" era **falso**: um array de dez ids escrito à mão no
`Discover.tsx`, sem critério nenhum, e "da semana" não significava nada. O nome
foi trocado por **"Em alta"**, que é o bloco que a Buscar já tinha e tem régua
de verdade.

**O desenho que ficou foi o da Descobrir** — a fileira que rola para o lado, com
as capas numeradas — e aqui está a aplicação da regra do topo desta seção. Eu
tinha recomendado a grade sem número, argumentando que numerar promete um
ranking de audiência que o app não sabe calcular sem servidor. **O argumento
caiu**: o servidor é o próximo passo, então o desenho é o da versão final e o
que muda depois é só de onde sai a lista (hoje: melhor avaliados; depois: mais
ouvidos de verdade).

### Consequências mecânicas

`Discover.tsx` apagado, rota `/discover` removida do `App.tsx`, e os 5 links
apontando para `/search`. O item do menu do player mudou junto: era "Títulos
recomendados" com ícone de estante, virou **"Explorar o catálogo" com a lupa** —
o nome e o ícone do lugar onde ele leva. `npm run check` limpo.

### Apurado e descartado no mesmo dia: seta de voltar nas abas

Levantando os links da Biblioteca na sequência (são 3: a aba do menu, o botão
"Ir para a Biblioteca" do estado vazio de `/bookmarks`, e a palavra "Biblioteca"
na resposta da Ajuda), o Matheus notou um beco: **um link dentro de um texto
leva a uma aba, e aba não tem seta de voltar** — as 5 abas são pontos de
partida, não telas empilhadas, e isso está certo. Quem entra na Biblioteca pela
Ajuda não tem botão nenhum para voltar à Ajuda.

**Testado no app, não deduzido:** Ajuda → clique no link → Biblioteca →
`history.back()` → **volta para a Ajuda**. O `history.length` subiu de 22 para
23 no clique. O AllBook usa o histórico real do navegador (wouter empurra cada
tela), então o **botão voltar do Android e o gesto de borda do Safari no iPhone
já resolvem** — são o mesmo comando.

O único caso que quebra é o app **instalado na tela de início do iPhone** (modo
standalone): o iOS não oferece nem botão nem gesto ali. No Android instalado o
botão continua existindo.

**Decisão do Matheus: não fazer nada.** *"A gente já tá inventando demais (…)
não há necessidade disso."* E é o julgamento certo: o cenário que quebra não
existe hoje e pode nunca existir, o navegador cobre o uso real, e uma seta
condicional dentro das abas seria código para manter para sempre por causa de um
caso hipotético. **Fica aqui só para ninguém refazer esta investigação achando
que é ideia nova.** Se um dia o AllBook virar app de iPhone instalado, é aqui
que está o problema e as duas saídas que existiam: (a) seta na aba quando
alcançada por link; (b) a Ajuda deixar de teletransportar e passar a ensinar o
caminho ("na aba Biblioteca, no menu de baixo").

---

## 4.33 O Bluetooth do modo carro: copiamos a caixinha e jogamos fora a razão (26/07)

> **DESFECHO (26/07, mesmo dia): tudo removido, modo carro fica.** Decisão do
> Matheus — *"vamos remover tudo, essas permissões, essas coisas, tudo. A gente
> até mantém o modo carro (…) inclusive (…) conectado ao carro, a gente também
> remove"*. Saíram os **três diálogos** (nota de segurança, "conectar por
> Bluetooth?", imitação da permissão do Android), o **selo "Conectado ao Carro"**
> do topo da tela e — achado durante a limpeza — o item **"Conectar dispositivo
> Bluetooth"** do menu dos três pontinhos, que abria a mesma caixa falsa. O botão
> Carro agora entra **direto** na tela grande, em 1 toque. **O aviso de segurança
> não sumiu:** continua no rodapé da própria tela ("Mantenha os olhos na
> estrada") — escolha feita na hora de executar, para o recado não se perder
> junto com a cerimônia. `npm run check` limpo e conferido no navegador.
>
> Ele registrou também a dúvida de fundo, que fica anotada: *"nem sei se faz
> tanto sentido assim (…) estava até um pouco inclinado a remover ele"*. A tela
> segue no app; se voltar a incomodar, o histórico está aqui.

**Pesquisa apurada, que levou à decisão.** Ele olhou o modo carro e
perguntou o que ninguém tinha perguntado: *"por que existe conectar por
Bluetooth? Teoricamente o telefone não está conectado já pelo Bluetooth (…) por
que que isso é importante?"*.

**O que o Audible faz, conferido na documentação oficial deles**
([Listen in the car](https://help.audible.com/s/article/listen-in-the-car?language=en_US)):
o app **não conecta nada**. Quem pareia e transmite o som é o sistema do
celular. A frase é *"Car Mode will launch in your player whenever your phone
connects to your car via Bluetooth"* — o app só quer **ser avisado** de que o
telefone se conectou ao carro, para **abrir o modo carro sozinho**. A permissão
"dispositivos por perto" existe porque o Android 12+ a exige para um app saber
quais dispositivos estão conectados. **Lá o Bluetooth serve para a pessoa não
precisar tocar no telefone** — e por isso mora nas **configurações**, como
opção, não no caminho de entrada.

**Detalhe que o Matheus perguntou e vale fixar — o app NÃO se abre sozinho.**
Nenhum celular deixa um aplicativo pular na tela por causa de uma conexão
Bluetooth. A ajuda da Audible é precisa: *"Audible will automatically launch the
Car Mode player screen **when you open the app**"*. Ou seja: o telefone conecta,
o app fica sabendo, e **quando você abrir o app** ele já vem na tela do modo
carro em vez do player comum. Não é janela nova nem notificação — é a mesma tela
do player trocando de cara. (O que às vezes **parece** o app abrindo sozinho é o
carro/CarPlay mandando "retomar a última mídia", decisão do carro e não do
aplicativo.) Lá isso é um interruptor em **Perfil → engrenagem → Player →
"Automatic Car Mode"**: liga uma vez e esquece.

**O que o AllBook faz hoje:** o oposto. O Bluetooth virou **pedágio** — nota de
segurança, pergunta de conexão e uma imitação do diálogo de permissão do
Android, **três telas e quatro toques antes** de a tela grande abrir, e tudo se
repete a cada uso (`showCarModeEntry` e companhia são `useState`, sem memória).
A função que no original **poupa** toques, na cópia **cobra** toques. Pior: o
AllBook roda no navegador, que **não tem como saber** que o telefone se conectou
ao som do carro — é promessa que não há como cumprir hoje.

**"Modo carro de qual livro? E se a pessoa não tiver nada começado?"** — outra
pergunta do Matheus, no mesmo dia. Do **último livro em andamento**: o player do
Audible nunca está vazio, sempre tem o título mais recente carregado. O AllBook
já guarda isso — `lib/playback.ts`, chave `allbook_playback`, uma lista dos
livros começados do mais recente ao mais antigo (a mesma do "Continuar
ouvindo"); o candidato é o primeiro item. **Para quem não começou nada, a ajuda
da Audible não diz** — e a recomendação registrada é: **sem livro em andamento
não existe modo carro**, o app abre normal. O modo carro é **capa de um player
que já existe, não fonte de conteúdo**. Rejeitada a alternativa de o app
escolher um título e começar a tocar sozinho ao entrar no carro: é o app
decidindo o que a pessoa vai ouvir, e errando diante de alguém que está dirigindo
e não pode consertar. Hoje a questão é teórica — o modo carro do AllBook é uma
tela **dentro** de `/player/:id`, então já nasce com um livro na mão.

**Dois defeitos que vêm junto:**
- **Beco sem saída** (a regra da 4.23 de novo): *Cancelar* no Bluetooth ou *Não
  permitir* na permissão **fecham tudo e o modo carro não abre**. Quem vai ouvir
  de fone, ou já tem o carro pareado há meses, não chega na tela grande.
- **Permissão falsa ensina a apertar "Permitir" sem ler** — o diálogo é um
  desenho nosso imitando o do sistema.

**Proposta registrada (não construída):** o botão Carro entra **direto** na tela
grande; a nota de segurança aparece **na estreia e nunca mais**; o Bluetooth sai
do caminho e a ideia certa fica guardada para quando o AllBook for app de
celular, aí como **opção nas Configurações**: *"abrir o modo carro sozinho
quando eu conectar no carro"*.

**Corrigido no mesmo dia, para ninguém "consertar" o que não está quebrado:** a
falta do **avançar 30s** no modo carro **não é defeito** — o Audible também só
tem voltar 30s (os quatro botões dele: Alexa, play/pause, voltar 30s, marcador).
Em audiolivro o gesto comum é "perdi o fio, volta". O que **falta de verdade** é
trocar de capítulo.

---

## 4.34 Proteger o áudio: o que dá e o que não dá (26/07)

Levantado pelo Matheus, e é pergunta de negócio, não de tela: *"teria condição de
um concorrente subir todos os livros que a gente deu o trabalho de produzir e
roubar esses livros? (…) talvez fosse melhor remover essa função de download"*.
**Nada foi construído** — o registro é para a decisão não ser refeita do zero
quando o áudio existir.

### A verdade que precisa vir primeiro: blindagem total não existe

Todo áudio que toca no aparelho de alguém pode, no limite, ser gravado da saída
de som. Netflix, Spotify e a própria Audible são copiadas todo dia, gastando
milhões em proteção. **Quem promete 100% está vendendo alguma coisa.** O
objetivo real é outro, e são três — e só um deles é sobre o negócio:

1. **Atrito**: subir o trabalho a ponto de o curioso desistir.
2. **Impedir a cópia em escala** ← *este é o que importa*. Um ouvinte gravando um
   livro para si não machuca o AllBook; mil títulos saindo pela mesma conta em
   duas horas, sim.
3. **Rastrear** quem vazou.

Confundir (1) com (2) é o erro caro: gasta-se em DRM sofisticado e deixa-se a
raspagem passar, que é justamente o que o concorrente faria.

### As camadas, da mais barata para a mais cara

1. **Nunca entregar o arquivo inteiro.** Áudio fatiado em segmentos de ~6s
   (HLS/DASH, o formato da Netflix), com **endereços assinados que expiram** em
   poucos minutos e amarrados à conta. Só isto já mata a extensão de Chrome que o
   Matheus citou: ela sabe pegar um arquivo, não sabe remontar centenas de
   pedaços com links que morrem.
2. **Limite de taxa por conta, no servidor.** Quem pede 500 títulos numa tarde
   não é ouvinte, é raspagem — e o servidor corta. **É a defesa contra o
   concorrente, e é a mais barata de todas.**
3. **Marca d'água inaudível por usuário.** Não impede nada; diz de qual conta o
   arquivo vazou — e o fato de existir já desestimula.
4. **DRM de verdade (Widevine, FairPlay).** A chave nunca chega ao JavaScript.
   Custa licença e integração; só se justifica com escala e dinheiro. Entre (1) e
   (4) existe o meio-termo do HLS com AES-128, que barra script genérico mas
   deixa a chave ao alcance de quem inspeciona.

### Sobre a tela Downloads: **não remover** — recomendação

O offline não é o furo. Storytel, Audible e Spotify todos têm, e ninguém tira —
tirar seria perder competitividade por um risco que dá para mitigar. **O que
muda é onde o arquivo fica:**

- **No navegador**, o offline exige guardar o áudio em cache/IndexedDB, ou seja,
  **no disco da pessoa** — é o ponto mais exposto.
- **No app instalado**, o arquivo fica criptografado numa área privada que só o
  app abre. É o padrão da indústria e é bem mais forte.

**Proposta:** manter o botão; quando o áudio existir, **liberar download offline
só no app, não no navegador**.

### O MP3 do estúdio não muda nada — desde que o mestre seja guardado

Informação do Matheus, no mesmo dia: **o áudio nasce em MP3.** Isso não conflita
com nada acima, e vale afinar o alerta do "decidir antes de gravar":

O MP3 é o **arquivo-mestre** — fica guardado e **nunca é entregue a ninguém**. Na
ingestão, o servidor roda `ffmpeg` e corta o mesmo áudio nos segmentos que o app
toca. O estúdio continua entregando MP3 como sempre; o fatiamento é automático.

**A regra que realmente importa, e é uma só: guardar sempre o mestre.** Com os
MP3 originais em mãos, o corte pode ser refeito quando se quiser, com outro
formato ou outra proteção. O caro é (a) perder o original, ou (b) construir o app
para tocar o MP3 direto — aí o formato de entrega vira o formato de produção, e
mudar significa reprocessar tudo.

### A vinheta: eu subestimei, e o argumento do Matheus corrigiu

Ideia do Matheus: uma **vinheta** (áudio de identificação do AllBook) no começo
do primeiro capítulo e no fim do último.

**Minha primeira reação foi tratá-la como só branding, e estava errada.** O
argumento dele, que fica registrado porque é o ponto: *"uma vez que você vai
subir 10 mil livros, você vai ter que cortar 10 mil áudios (…) e se você não
corta, você tem uma marca ali"*. Contra o cenário que mais preocupa — **o
concorrente que sobe o acervo inteiro** — ela funciona por dois caminhos:

1. **Custo em escala.** Cortar 1 arquivo é trivial; cortar 10 mil exige montar
   automação. Isso já filtra quem baixa e revende sem estrutura.
2. **Prova de origem, e constrangimento.** Quem *não* cortar passa a distribuir
   um catálogo inteiro **carimbado com o nome do concorrente**. Isso é prova de
   procedência e é publicamente ruim para quem faz.

**A distinção que continua valendo** é mais estreita do que eu disse: a vinheta
identifica **de qual empresa** o áudio saiu; ela não identifica **qual conta**
vazou. Para o caso do concorrente, saber a empresa é exatamente o que interessa —
a marca d'água por usuário só ganha importância quando o problema for vazamento
individual.

**Reforço barato, se um dia interessar:** vinhetas curtas também **no meio** do
livro (a cada N capítulos, em posições variáveis). Cortar começo e fim é um
recorte fixo; cortar dezenas de pontos que mudam de livro para livro é outro
nível de trabalho.

A tabela abaixo fica para separar os dois papéis — não para dizer que um vale
mais que o outro:

| | Vinheta | Marca d'água forense |
|---|---|---|
| É audível? | Sim, é o ponto | Não, é inaudível |
| Onde fica | Começo e fim | Espalhada no áudio inteiro |
| É igual para todos? | Sim | **Não — uma por usuário** |
| Some com | Cortar 10s num editor grátis | Só destruindo o áudio |
| Serve para | Identidade + **prova de origem e custo de remoção em escala** | **Dizer de qual conta vazou** |

As duas convivem, e a vinheta vem primeiro por ser muito mais barata. **Detalhe
de custo:** a vinheta, sendo igual para todos, mantém o arquivo único e cacheável
na CDN; marca d'água por usuário torna cada entrega diferente — é por isso que
ela costuma ficar para depois, quando houver acervo e escala que a justifiquem.

### O que dá tempo: hoje não existe arquivo nenhum

O "baixado" do AllBook é só uma marca — uma lista de ids em `allbook_downloads`
no `localStorage` (`lib/library.ts`). **Nenhum byte de áudio é gravado**, porque
não há áudio. Não existe nada para roubar ainda, e a decisão pode esperar o áudio
chegar sem custo nenhum.

---

## 4.35 Abertura do app e vinheta sonora — adiado para depois do backend (26/07)

**Decisão do Matheus: fica para depois do backend.** Não é código, é identidade
de marca — envolve gerar imagem, gerar som e possivelmente redesenhar o
logotipo. É um projeto à parte, com ferramentas que não são estas. O que segue é
o apurado, para ninguém recomeçar do zero lá na frente.

### O pedido

Uma animação curta na abertura, no espírito do "ta-dum" da Netflix e das
vinhetas de HBO/Disney: *"a gente colocar uma animação simples pode ser o
diferencial"*.

### Três propostas construídas e **rejeitadas** — *"nenhuma me agradou"*

Ficaram no commit `3669f8d` (`components/Aberturas.tsx` +
`pages/AberturaTeste.tsx`, apagados na sequência para não virar entulho —
resgatáveis pelo git):

- **A — a onda vira palavra:** barras de equalizador tocam e colapsam, o
  logotipo nasce delas.
- **B — a varredura de luz:** o logotipo está lá apagado e acende por onde uma
  faixa de luz passa.
- **C — o marcador de página:** um marcador desce, pousa, e a palavra se abre a
  partir dele.

**A direção que ele quer, e as três não deram:** *"um livro abrindo com som"*,
*"um fone com livro"*, **clean/minimalista** — e possivelmente **mudar o
letreiro**, o logotipo em si.

### O aprendizado que mais vale: esta ferramenta não é a certa para descobrir

Observação do Matheus, e ela procede: *"no Grock você digita e ele te dá centenas
de opções (…) acho que você demora muito para me dar três"*. **O Claude Code não
gera imagem nem áudio** — cada animação daquelas foi escrita à mão em código. Daí
três em minutos, contra dezenas em segundos num gerador.

**A divisão de trabalho que fica combinada:**

| Etapa | Onde |
| --- | --- |
| Descobrir o desenho (símbolo, letreiro) | Grok, **Ideogram** (melhor com letra), Midjourney |
| Ver a ideia mexendo | Sora, Veo, Runway, Kling |
| A vinheta sonora | **ElevenLabs** (efeito sonoro por descrição), Suno, ou contratar |
| Virar app: vetorizar, animar, sincronizar com o som | **aqui** |

### O som é o principal — e é uma gravação para dois lugares

Ponto do Matheus, e o mais forte da conversa: *"o som identifica (…) o barulho da
Netflix, todo mundo sabe que aquele barulho ali é da Netflix"*. **A marca sonora
gruda mais que a visual**, e cabe em menos de 2 segundos.

E há economia: **a mesma vinheta serve a abertura do app e o começo/fim de cada
livro** (ver 4.34). Uma gravação, dois lugares — reforçada toda vez que a pessoa
abre o app *e* toda vez que começa um título.

---

## 4.36 "Histórico de escuta" mostrava o presente (26/07)

O Matheus abriu os três pontinhos do tocador e perguntou a mesma coisa que já
matou uma tela inteira neste projeto: *"qual é a ideia desse botão aqui?"*.

**O que ele fazia:** um aviso escrito *"Histórico de escuta: você está no
capítulo 1 de O Clube das 5 da Manhã"*.

**Os dois defeitos, e o segundo é o grave:**

1. **Promete passado, entrega presente.** "Histórico" é o que eu ouvi, quando,
   quanto. Capítulo atual é agora.
2. **A informação já estava na tela** — o botão "Capítulo 1" fica dois
   centímetros acima do dedo. Gastava um toque para contar o que a pessoa está
   vendo.

É o defeito da 4.23/4.31 numa forma mais difícil de pegar: como ele **fazia**
alguma coisa (um aviso aparecia), parecia funcional.

### O conserto: o dado já existia, ninguém tinha olhado por ele

**Não foi construído dado novo.** O diário de audição (4.14) sempre guardou
`livros: Record<bookId, segundos>` **dentro de cada dia** — usado só para o "O
que você ouve" das Estatísticas, que soma tudo. Bastou olhar pela outra fatia:
`historicoDoLivro(diario, bookId)` devolve o total e os dias daquele título.

O item abre um painel com o número que responde a pergunta (*4h21 em 5 dias de
escuta*), o ponto atual como contexto, e a lista dos dias com barra comparativa.

### O nome durou uma versão: "histórico" é palavra guarda-chuva

Primeiro virou **"Histórico deste livro"**, e o Matheus derrubou na hora: *"o
histórico desse livro pode ser muita coisa, você não acha?"*. E pode mesmo — o
histórico da **obra** (quando foi escrita, as edições), o histórico dos
**comentários**, o histórico de **preço**. A palavra é um guarda-chuva: cabe
qualquer coisa embaixo, e por isso não diz nada.

Passou por **"Meu tempo neste livro"** e parou em **"Meu ritmo neste livro"**,
que faz as três coisas que "histórico" não fazia — diz **o que é**, **de quem é**
e **onde acaba** — e ainda cobre o que o painel ganhou logo depois: além do
passado, a previsão de término. De quebra, casa com o vizinho de cima no mesmo
menu, "Minhas notas".

**A regra, que vale além deste item:** rótulo de menu não pode ser categoria — a
pessoa toca para ver *uma* coisa, e o nome tem de ser essa coisa.

### A previsão de término entrou aqui — e é melhor que a das Estatísticas

Lembrança do Matheus: *"no menu de estatística tinha a informação de quanto tempo
você iria levar para terminar tal livro (…) não sei se esse dado é fidedigno"*.

**Onde está:** existe e está de pé, em `Statistics.tsx` — *"No seu ritmo, você
termina X em N dias"*.

**Se é fidedigno: tem um viés, e é otimista.** Ela divide o que falta pela sua
média diária de **todos os livros somados** (últimos 14 dias ÷ 14). Quem ouve
três títulos em paralelo recebe uma conta que finge que 100% do tempo vai para
um só — e a previsão sai curta demais.

**A versão do painel corrige isso:** usa o ritmo **daquele** livro —
`secPorDiaCorrido`, o total ouvido dele dividido pelos dias corridos desde a
primeira sessão. **Os dias parados entram na conta de propósito:** quem ouve 1h a
cada três dias não termina no ritmo de 1h por dia; a frequência faz parte do
ritmo. Sem base (um único dia de escuta) não há previsão — amostra não é ritmo.

**O que só apareceu testando:** a primeira versão disse *"cerca de 219 dias"*.
Conta certa, comunicação errada — ninguém processa 219 dias, e o número ainda soa
a cobrança. A unidade passou a acompanhar o tamanho: dias até 45, depois meses,
depois anos. Virou *"cerca de 7 meses para terminar"*: a mesma verdade, legível.

### Os dois furos do "desde a primeira sessão" — e a regra do hiato

O Matheus derrubou a primeira versão do ritmo com dois casos concretos:

1. *"A pessoa abriu o livro, ouviu 30 segundos pra ver como era a voz"* — e
   aquela curiosidade virava o **marco zero**, pesando na média para sempre.
2. *"Passou três meses, voltou"* — e os meses parados entravam no ritmo, como se
   ela estivesse ouvindo devagar. Não estava: estava **fora do livro**.

**Os dois morrem com a mesma regra: hiato acima de 21 dias corta o trecho.** O
ritmo é só do **trecho atual de leitura** — a sequência de dias sem buraco grande
até hoje. Dentro do trecho, os dias parados continuam contando (a frequência é
parte do ritmo); antes dele, nada conta. E se a última escuta foi há mais de 21
dias, **não há previsão**: a pessoa não está lendo aquilo agora, e "no seu ritmo"
seria invenção. Quando houve corte, a tela diz de onde partiu — *"no seu ritmo
desde que você retomou, em 12 de julho"*.

Efeito medido nos dados de teste: o mesmo livro saiu de **7 meses para 3 meses**.

### Decidido não construir o algoritmo sofisticado

O Matheus levantou a possibilidade — *"a gente tem que colocar realmente um
algoritmo bem sofisticado para prever esse tipo de coisa"* — e ele mesmo
desconfiou na frase seguinte: *"é bem complicado (…) ela vai voltar de onde?"*.
**Decisão: não construir.** Os motivos, para não se reabrir a discussão:

- **Prever comportamento humano com meia dúzia de dias de dado é ruim por
  natureza.** Nem Spotify nem Audible tentam adivinhar quando você termina.
- **Regra que ninguém consegue verificar é pior que regra grosseira.** Peso,
  decaimento, tolerância — nem eu, nem ele, nem o usuário conseguiria dizer se o
  número saiu certo. Vira cara de ciência com chute por dentro.
- **A previsão não é profecia, é leitura do agora.** *"Ela vai voltar de onde?"*
  — não precisa ser previsto: quando a pessoa voltar, o app recalcula com o que
  ela fez. Daí a frase ser "no seu ritmo, **cerca de**".

**O que foi feito no lugar, e resolve o caso real com uma linha:** dia com menos
de **5 minutos** de escuta não abre nem sustenta trecho (`MINIMO_DE_SESSAO_SEC`).
A espiada de quem abriu só para ouvir a voz do narrador não planta marco zero. O
tempo dela continua somando no total ouvido — o piso decide **onde o trecho
começa**, não o que conta.

### Uma conta só, porque o app estava se contradizendo

> *"Se o seu cálculo é o mais correto, ele também deveria ser replicado no menu
> de estatísticas. Não faz sentido ter dois tipos de cálculo."* — Matheus

Ele está certo, e o problema era pior que estilo: **a mesma pergunta tinha duas
respostas conforme a tela**. A conta virou `previsaoDeTermino()` em
`lib/listening.ts`, e Estatísticas e tocador chamam a mesma função.

**Até a redação do prazo foi junto** (`prazoLegivel`): pegos no teste, os dois
diziam o mesmo número de formas diferentes — *"75 dias"* numa tela, *"3 meses"* na
outra. Mesmo número, duas leituras. É a regra da fonte única do `CLAUDE.md`
valendo também para a **frase**, não só para o dado.

**Por que não bastava apagar o item.** A pergunta *"quanto eu já ouvi deste
livro?"* é real e **não tinha resposta em lugar nenhum do app** — Estatísticas
soma tudo, "Ouvindo" e "Onde parei" dizem onde você está. Pela regra da 4.31, o
que faltava não era conteúdo: era o item ter uma pergunta, e ele tem.

**Honestidade herdada da 4.14:** se todos os dias listados vierem do histórico de
demonstração que o app semeia na primeira abertura, o painel **diz isso**. Número
inventado apresentado como seu é pior que tela vazia.

---

## 4.37 A aba "Buscar" virou "Catálogo", e a lupa subiu para a Início (26/07)

Ideia do Matheus: *"o botão Buscar eu acho pobre (…) a gente poderia mudar ele
pelo botão Catálogo. Mas a lupa é importante"*.

**Três razões para o nome, e a terceira é a que fecha o caso:**
1. **Aba nomeia lugar, não ação.** Início, Biblioteca e Perfil são lugares;
   "Buscar" era o único verbo do menu. (A mesma gramática que já justificava o
   "Pedir" ser botão e não aba — ver `BottomNav`.)
2. **A tela deixou de ser só busca** na fusão com a Descobrir, horas antes
   (4.32): hoje é campo **mais** porta do pedido, cartões de gênero e "Em alta".
   "Buscar" nomeava um quarto dela.
3. **O app já a chamava de catálogo**: o item do menu do player que leva até lá
   é "Explorar o catálogo" (renomeado na própria 4.32). A aba é que tinha ficado
   com o nome velho. O ícone acompanhou — lupa saiu, entrou a grade.

**A consequência obrigatória: o autofoco saiu.** A tela abria com o teclado na
cara (`autoFocus` no `Search.tsx`), o que servia a uma aba "Buscar" e atrapalha
uma aba "Catálogo" — quem entra no catálogo veio **ver**, e o teclado cobre
justamente os cartões de gênero.

**Apurado no caminho, e vale registro porque derruba uma suposição:** aquele
autofoco **nunca funcionou igual nos dois sistemas**. O iOS bloqueia abertura de
teclado sem gesto do usuário, então no iPhone o cursor piscava e o teclado
**não** subia; no Android subia. A dúvida foi do Matheus — *"não sei se o teclado
realmente já vai abrir assim, é só uma suposição"* —, e a resposta reforça a
decisão: nada no app deve **depender** de o teclado subir sozinho.

**A lupa foi para o topo da Início** (`TopNav`), e abre a busca **sobreposta**,
em tela cheia, voltando ao ponto exato ao cancelar.

- **Rejeitado: a lupa levar para a aba Catálogo.** Era o mais barato, mas troca
  de aba — e o pedido era justamente poder buscar "de onde a pessoa já está".
- **Rejeitado: a busca acontecer dentro da Início.** Resultado de busca é lista
  longa; ali empurraria a vitrine, o "continuar ouvindo" e o resto para fora da
  tela. Sobreposta, ela tem a tela toda **sem** criar uma segunda busca: os
  resultados saem do mesmo `SearchResults` da aba (fonte única, 4.18).
- **A lupa não aparece na própria aba Catálogo**, onde o campo já é a primeira
  coisa da tela — dois caminhos idênticos lado a lado é a redundância que o app
  vem cortando.

**Armadilha de CSS que só apareceu testando:** o painel nasceu **dentro** do
`<header>` do TopNav, que tem `z-50` e portanto cria um contexto de
empilhamento próprio — o `z-[60]` do painel valia só ali dentro, e o menu de
baixo continuava por cima, visível e clicável durante a busca. Corrigido tirando
o painel para fora do `<header>`.

---

## 4.38 "Detalhes do título" saiu do menu do player (27/07)

O menu dos três pontinhos, dentro do player, abria a ficha do livro por um item
chamado "Detalhes do título". **Saiu.**

**A razão é uma só: já havia outro caminho para o mesmo lugar.** Tocar no título
do livro no corpo do player — o botão com a setinha, criado justamente porque o
menu era escondido demais — abre a mesma ficha, com um gesto que a pessoa tenta
antes de procurar menu nenhum. Dois botões para um destino é a gordura que o app
vem cortando desde a 4.23.

**O critério que o Matheus deixou para ele voltar** (vale para qualquer item de
menu daqui para a frente): *"pra manter isso aí, a gente teria que acrescentar
alguma informação extra que não teria em outro lugar. (…) Como está hoje, não
dá."* Ou seja, um item de menu se sustenta por **conteúdo próprio**, não por
atalho para tela que já é alcançável.

**Achado do mesmo dia, consertado junto** — este é bug, não decisão, mas está
aqui porque muda o que se espera do player: o player e a barrinha de baixo
(`MiniPlayer`) tinham **cada um o seu** "está tocando". Sair do player no meio de
um capítulo fazia a barrinha aparecer com o ícone de **tocar**, como se a
audição tivesse parado, e o botão dela era enfeite — trocava de desenho sem mexer
no progresso. Agora o estado mora no `playback.ts` (`sessionStorage`, como a
visibilidade da barra: é estado *da visita*), os dois leem e escrevem ali, e com
a barra na tela o tempo continua correndo. Enquanto não existe áudio de verdade,
quem faz o tempo passar fora do player é um relógio de 5 em 5 segundos — a
precisão que a barrinha mostra.

**Armadilha de teste, para ninguém perder tempo de novo:** com **duas abas** do
app abertas, as duas escrevem no mesmo `localStorage`, e a segunda parece
"roubar" o progresso da primeira — o player abrindo no zero, o tempo andando
mesmo pausado. Não é bug do app: é o navegador. Confirmado ouvindo o evento
`storage`, que só dispara quando **outra** aba escreve. Ao testar progresso,
deixe uma aba só.

---

## 4.39 Decisão em aberto: clube de leitura e "sala do livro" (27/07)

**Nada disto foi construído.** É proposta, registrada aqui porque a ideia já se
perdeu uma vez: a Janela A sugeriu ao Matheus "clube de leitura e sala do livro"
em conversa, e a sugestão **não ficou escrita em documento nenhum** — em 27/07 a
Janela B varreu `docs/` e o `CLAUDE.md` e a única aparição da palavra "clube" era
o título do livro *O Clube das 5 da Manhã*. Sugestão falada e não registrada é
sugestão perdida.

### O pedido do Matheus (27/07)
Fazer o clube **dentro do AllBook**, como um "a mais", e não como projeto
separado. A intenção declarada: *"que as pessoas não cheguem ali só para ouvir um
audiolivro; que fiquem desfrutando de outras coisas"* — comunidade de verdade,
gente interagindo com gente. **Rejeitada** (pelo Matheus, no mesmo dia) a
proposta do Claude de construir o clube como aplicativo à parte.

### Por que o AllBook tem uma vantagem que um app de clube não tem
Todo clube de leitura sofre dos mesmos dois males: **o ritmo se perde** (um
terminou, outro está na página 12) e **o spoiler afasta quem está atrasado**.

A defesa contra spoiler é ancorar cada comentário numa posição do livro e
esconder o que está adiante de onde a pessoa chegou. Num app de clube comum isso
depende de a pessoa **declarar à mão** onde está — e ninguém declara. **No
AllBook o player já sabe**: ele é quem toca o áudio. A trava de spoiler sai de
graça, e é isso que torna o clube melhor aqui dentro do que fora.

### O desenho proposto: são DUAS coisas, não uma
1. **Sala do livro — aberta, sem compromisso.** Existe sozinha para todo livro do
   catálogo. É a conversa da ficha do livro, com cada comentário preso a um
   capítulo e escondido de quem ainda não chegou lá. Ninguém "entra", ninguém
   marca data, ninguém pode decepcionar ninguém.
2. **Clube — fechado, com compromisso.** Grupo com ciclo: um livro, data de
   início e fim, marcos no meio ("até o capítulo 8 no dia 10"), régua mostrando
   onde cada um está, encontro marcado e votação do próximo livro.

**A ordem importa: sala primeiro, clube depois.** Clube tem custo social alto —
ninguém aceita prazo com estranhos antes de ter provado a conversa. Sala é a
porta de entrada; o clube é o compromisso. Começar pelo clube é o erro clássico,
e dá sala de reunião vazia.

### O que aproveita do que já existe
- `comments.ts` (autor, livro, data, nota), respostas de um nível, curtir e
  descurtir — a conversa **já está construída**; falta só o campo de posição.
- `playback.ts` — sabe onde a pessoa está no áudio. É a trava de spoiler.
- As notas do livro (`/bookmarks`) — marcar um ponto do áudio já existe; o
  comentário ancorado é uma nota que a pessoa decide tornar pública.
- `following.ts` e `/community` — o laço social e a tela onde os clubes moram.
- `notifications.ts` — o aviso de marco ("faltam 3 dias para o capítulo 16").

### O que fica de fora, de propósito
- **Clube no menu de baixo ou na Início** — contraria a decisão de 21/07
  ("nada de comunidade no Início; o foco é sempre o audiolivro"). Entrada pelo
  Perfil e pela ficha do livro.
- **Gamificação do clube** (ranking de quem ouviu mais, sequência de dias): faz
  a pessoa **mentir o progresso** para não ficar mal na foto — e progresso
  mentido quebra exatamente a trava de spoiler. Nocivo, não só supérfluo.
- **Chat em tempo real, "está digitando", presença.** Clube é assíncrono; cada
  um ouve no seu horário.
- **Resumo do livro por IA** — mata a razão de existir do clube. O uso honesto é
  outro: sugerir **perguntas de discussão** para quem tem que puxar a conversa.
- **Vários livros ao mesmo tempo no mesmo clube.** Um ciclo por vez.

### Ordem de construção proposta
0. **Fundação** (invisível): comentário ganha capítulo; o player expõe a posição.
1. **Sala do livro** na ficha, com a trava de spoiler. ← o pulo do gato
2. **Clube**: criar, entrar por convite, ciclo com marcos, régua de progresso.
3. **Conversa do clube** por marco + aviso de marco nas notificações.
4. **Votação do próximo livro** + estante do clube (o que já foi lido).

**Ressalva honesta:** 0 e 1 dá para fazer de verdade hoje, com os leitores
fictícios de `community.ts` (que são esqueleto de propósito). De 2 em diante, o
clube só é real com backend — por ora seria **vitrine**, como o resto do app.

### Atualização da mesma tarde (27/07): o que o Matheus decidiu na conversa

A Janela A revisou o desenho acima com ele. O que mudou:

**1. Sala e clube não são dois sistemas — são um só, em dois graus.**
A diferença que ficou clara na conversa: **a sala é do livro, o clube é das
pessoas.** A sala existe porque o livro existe (as 59 já nascem prontas), não tem
dono, ninguém entra nem sai, e acumula conversa para sempre. O clube é um grupo
com dono, prazo e fim.

Como o Matheus quer o **moderador desde o início** ("até para o moderador criar o
clube"), a decisão foi **unificar**: uma conversa só, morando no livro, com
âncora no áudio e trava de spoiler — e o **clube como uma "turma" por cima dela**,
um recorte com dono, membros, prazo e marcos, visível só para a turma. Escreve-se
**um** mecanismo de mensagens; o clube vira camada fina de regras.

**2. O moderador entra na fundação, não na fase 4.** Poderes: criar o clube
(livro, prazo, marcos); convidar, aceitar e remover membro; fixar a pergunta da
rodada; apagar/esconder mensagem e silenciar quem estraga; **marcar como spoiler
o que alguém postou sem marcar** (o poder mais usado na prática); encerrar o
ciclo. Na **sala aberta**, que não tem dono, a moderação é passiva: qualquer um
denuncia, o autor apaga o próprio, e a denúncia cai numa fila que o AllBook
resolve. Sem isso, a primeira conversa desandada não tem quem apague.

**3. O encontro: rodada assíncrona, em texto.** Hora marcada é inimiga de quem
ouve audiolivro (a pessoa ouve dirigindo, na academia, às 23h) — copiar o
encontro presencial é o caminho errado. O que fica: o moderador abre 2–3
perguntas, a turma responde numa **janela** de dois ou três dias, e as respostas
ficam juntas como um capítulo do clube. Quem se atrasa lê tudo depois.

**4. DESCARTADO: áudio gravado por leitores** (a proposta de "encontro ouvido" —
cada um grava 1–2 min e o player toca as respostas em sequência, como episódio do
clube; e as reações em voz ancoradas no trecho).

- **O motivo NÃO é custo — e isto está escrito para ninguém repetir o argumento
  errado.** Voz comprimida ocupa ~0,25 MB/min: um encontro de 8 pessoas dá ~4 MB,
  cem encontros dão ~400 MB. Um único audiolivro de 12h pesa ~350 MB. Todos os
  encontros de um mês cabem no espaço de **um** livro do acervo, e armazenamento
  custa centavos por giga/mês. Se o servidor vai existir para os audiolivros — e
  vai —, o áudio de leitor é uma gota.
- **O motivo é privacidade e moderação**, e é sério: (a) **voz identifica a
  pessoa** — o apelido protege, a voz não; (b) tende a ser tratada como dado
  pessoal, com consentimento, finalidade, prazo de guarda e direito de apagar, e
  cuidado redobrado com menores; (c) **grava o fundo junto** (a casa, o filho, a
  conversa de outra pessoa); (d) **áudio não se modera em escala** — ninguém ouve
  400 áudios, e um abuso fica no ar até alguém tropeçar nele. Texto se varre, se
  busca, se filtra.
- **O que precisaria estar resolvido para voltar** (o Matheus deixou explícito que
  pode mudar de ideia): consentimento claro, **expiração** do áudio no fim do
  ciclo, aprovação do moderador antes de publicar, botão de apagar do próprio
  autor e nada de download.

**5. O comentário ancorado no trecho FICA — é a peça principal.** Palavras dele:
*"comentar é a coisa principal; se você exclui o comentário, exclui o motivo do
porquê, tudo deixa de fazer sentido."* O que caiu foi a **voz**, não a âncora: o
comentário preso ao minuto exato, **em texto**, continua sendo o diferencial que
só um app de audiolivro tem.

### Construído em 27/07 (fundação + sala), e as decisões que apareceram fazendo

A sala do livro **existe** desde 27/07 (commits `dcc9695`, `a3f58d2` e o
seguinte). O que está no app: comentário com âncora em segundos, trava de
spoiler pela posição real do player, carimbo "cap. 7 · 12:40" que leva ao ponto,
botão **Conversa** no player com contador do trecho, marcas na barra e denúncia.
Três decisões que só apareceram construindo, e que valem registro:

- **A marca do que está adiante aparece — apagada e sem clique.** Na barra do
  player, ponto laranja = conversa liberada; ponto fraco = há alguém falando
  adiante. Mostrar que **existe** não é spoiler (a ficha já conta "+4 presas"), e
  esconder faria a barra mentir. Quem pular para lá está escolhendo estragar a
  própria escuta — a trava é contra o acidente, não contra a vontade.
- **A Comunidade passou a ser "onde a conversa está", por LIVRO.** Antes era um
  feed de gente: sem seguir ninguém, uma lista de estranhos. Livro é endereço
  melhor que pessoa — você entra pelo assunto. Seguir continua abaixo, como
  extra. A prévia respeita a trava e nunca mostra comentário marcado como
  spoiler: numa vitrine ninguém escolheu abrir nada.
- **Denúncia é local e o app diz isso.** Denunciar esconde o comentário **para
  você**, na hora, com desfazer — e o aviso diz a verdade: "enquanto não há
  servidor, isto vale só neste aparelho". A alternativa (prometer que "um
  moderador vai analisar") seria o tipo de teatro que o ROTEIRO 4.23 mandou
  varrer. Os poderes de moderador de verdade (marcar spoiler alheio, silenciar)
  ficam para quando houver contas — a assinatura de `lib/moderacao.ts` já está
  pronta para virar POST.

### O CLUBE foi construído (27/07, noite) — e o que se decidiu fazendo

Commits `a3ae2c6` (clube inteiro) e `aa23648` (prazos). No app: `/clubes`,
`/clube/:id`, `/clubes/novo`; entrada pela Comunidade, pelo Perfil e por uma
faixa na ficha do livro do ciclo. Decisões que valem registro:

- **A régua compara você com a RODA, não com cada pessoa.** É a mediana dos
  membros, e não a média nem o líder: média é puxada por quem devorou o livro em
  dois dias, e mostrar nome por nome transforma o clube em corrida — a mesma
  pressão que a decisão antigamificação evita, porque leva a **mentir o
  progresso**, e progresso mentido quebra a trava de spoiler.
- **A unidade do mural é o CAPÍTULO; a da sala é o SEGUNDO.** Não é inconsistência
  — é o que cada um combina. A sala é individual ("o que eu já ouvi"); o clube
  tem um acordo coletivo ("até o capítulo 6 esta semana"), e é ele que decide o
  que aparece. Mensagem à frente chega **coberta com o número à mostra**: a
  pessoa sabe que existe conversa lá e não é surpreendida.
- **O encontro não tem hora marcada** — é uma **rodada**: pergunta aberta por 3
  dias, cada um responde quando dá. Marcar "quinta às 20h" excluiria justamente
  quem ouve dirigindo, na academia, às 23h.
- **Votação: três opções, número aberto, nome fechado.** Você vê quantos votos
  cada livro tem, não quem votou em quê — mesma razão da régua. Ao encerrar, o
  vencedor vira o ciclo e o livro anterior vai para a **estante do clube**, que é
  o que dá continuidade em vez de o grupo morrer no fim do primeiro livro.
- **Criar um clube mostra os marcos ANTES de criar.** "4 semanas" não diz nada;
  "até o capítulo 4 em 03/08, até o 7 em 10/08…" mostra se o ritmo é exagerado
  para o tamanho do livro.
- **Os avisos de prazo são calculados, não guardados** (`lib/avisosDeClube.ts`),
  e **não acendem o sino**: prazo é estado, não acontecimento; guardar produziria
  "faltam 3 dias" mostrado uma semana depois, e um aviso sem estado de "lida"
  deixaria o sino aceso o ciclo inteiro. Só avisa **quem está atrasado** — cobrar
  quem está em dia é o caminho curto para a pessoa desligar as notificações.
- **O progresso dos outros membros é simulado, estável e declarado.** Semente por
  membro+clube, ancorada no tempo decorrido do ciclo, para a régua não pular a
  cada desenho. A tela diz, com todas as letras, que os membros são fictícios.

**Limitação conhecida, e ela é honesta:** os poderes de moderador (cobrir
spoiler alheio, esconder) existem e funcionam, mas num clube recém-criado **não
há mensagem de outra pessoa para moderar** — só haverá quando existirem contas.
Não se encenou um grupo cheio para dar o que ver.

### Como as pessoas ACHAM um clube e como se convidam (28/07)

Pedido do Matheus, no dia seguinte à construção: *"como é que as pessoas têm
acesso aos clubes? Deveria ter uma parte onde pudessem convidar umas às outras,
e ver: está tendo um clube de tal livro, vai começar tal dia."* O que entrou:

- **Clube com data de estreia.** O ciclo pode começar hoje, em 3 dias ou em 1
  semana; até lá o clube fica **em formação**. O motivo é de uso, não de
  calendário: **entrar num clube que já está no capítulo 6 é constrangedor** —
  ou a pessoa maratona para alcançar, ou fica lendo mensagem coberta. Um clube
  que estreia sexta começa com todo mundo no mesmo ponto, e é isso que faz
  alguém topar. Marcar estreia também é o que dá **tempo de juntar gente**.
- **Vitrine "Começando em breve"**, na tela de clubes **e na aba Catálogo** — é
  ali que a pessoa está escolhendo o que ouvir, e "uma turma começa Duna sexta"
  ajuda a escolher. **Na Início continua não entrando**: a decisão de 21/07
  (nada de comunidade na Início) segue de pé.
- **Convidar = compartilhar o endereço do clube**, pela folha nativa do celular
  ou copiando o link. **Funciona de verdade hoje:** quem abre o link cai na
  página do clube, vê livro, ritmo e combinado, e tem o botão de entrar. Um
  "convidar por e-mail" sem contas seria botão que finge (4.23). Convite
  pendente e lista de convidados só existirão com servidor.
- A faixa na ficha do livro passou a dizer **"vai ouvir este livro · começa em 4
  dias · 3 inscritos, todos do começo"** quando o clube ainda não estreou.
- **Defeito consertado no caminho:** o botão de convidar chamava
  `clipboard.writeText` dentro de um `try` mudo — quando o navegador recusa a
  cópia, o botão não fazia nada. Agora tem plano B (`textarea` +
  `execCommand`) e, se nem isso funcionar, o link aparece no aviso para copiar
  à mão. Botão sem retorno é o defeito que a 4.23 mandou varrer.

**A tela de clubes foi redesenhada no mesmo dia** — o Matheus disse que estava
"seca", e estava: uma fileira de cartõezinhos com capa de 56px, numa tela cujo
trabalho é **convencer alguém a assumir um compromisso**. O que entrou não é
enfeite, e a distinção importa porque este app corta cor decorativa:
**um destaque no topo** (a estreia mais próxima, com a arte do livro desfocada
ao fundo — o mesmo recurso do player e da ficha), **capas grandes** em vez de
miniaturas, **a régua do seu ritmo** dentro do cartão do seu clube, e o "criar
clube" deixando de ser uma linha tracejada cinza (desenho de área vazia) para
virar um cartão com o mesmo peso dos outros. A hierarquia responde à pergunta de
quem chega: o que vai começar, onde eu já estou, o que mais existe, como faço o
meu.

**Uma frase se perdeu, e fica registrado que se perdeu:** o Matheus começou
*"a pessoa que está criando um clube, ela deveria…"*, a mensagem cortou, e no
dia seguinte ele não lembrava mais o que ia dizer. Se a ideia voltar, entra
aqui — não vale inventar o que ele quis dizer.

### Quatro ajustes do parecer da Janela A (a fazer antes de codar)

1. **Âncora em segundos, não em capítulo.** Os capítulos aqui têm 50–85 minutos —
   dentro de um cabe spoiler graúdo. O player sabe o segundo; ancorar nele custa o
   mesmo e protege de verdade. O capítulo vira só rótulo ("cap. 7 · 12:40").
2. **Quem ainda não começou o livro não pode ver uma sala morta.** Posição zero =
   nada visível, justamente para quem está decidindo se vai ouvir. Precisa de uma
   faixa **sem spoiler** e, para o resto, um velado com contagem ("+18 mensagens
   adiante"): mostra que há vida sem entregar nada.
3. **Manter o "marcar spoiler" à mão.** A âncora não protege do comentário que
   fala do futuro estando atrás ("não se apeguem à Lenora"). Contra isso só
   existem marcação manual e denúncia.
4. **A régua do clube mostra o grupo, não cada membro pelo nome.** Progresso
   nominal e público é a mesma pressão social que a seção anterior condena na
   gamificação — e leva a mentir o progresso, que quebra a trava de spoiler.
   Mostrar "a roda está no cap. 6" e a sua posição.

**Faltavam ainda:** o **estado vazio** da sala (a maioria dos 59 livros vai estar
vazia — "seja o primeiro" + as perguntas de discussão sugeridas) e a ressalva de
que **a trava de spoiler só é confiável depois das contas**: hoje `playback.ts`
guarda a posição no **navegador**, então quem ouve no celular e abre no
computador aparece no capítulo 1 e a sala se fecha sozinha. Antes das contas, a
sala é demonstração honesta, não mecanismo.

---

## 4.40 Apurado em 28/07: o clube não usa o próprio diferencial

**Nada decidido ainda** — isto é apuração, registrada para ninguém refazê-la. O
Matheus, no dia seguinte à construção, disse três coisas ao mesmo tempo: teme que
o clube fique **invisível**, duvida que ele tenha **diferencial de verdade**
(*"eu quero que isso seja uma ferramenta que as pessoas realmente possam
utilizar"*), e **não gosta do layout** de hoje. Varredura no código mostrou que as
três queixas têm a mesma raiz, e ela não é de desenho.

**1. O clube está ausente do único lugar onde a pessoa passa o tempo.** Ele
aparece em `Community`, `Search`, `Notifications`, `Profile` e `BookDetails`. No
`AudioPlayer` e no `MiniPlayer`: **zero menções**. A pessoa passa dez horas dentro
do player ouvindo o livro do ciclo e ali o clube não existe. Ele mora em todas as
telas onde ela **não** está ouvindo — daí a sensação de invisível.

**2. O clube joga fora a única coisa que só o AllBook tem.** A sala do livro
(comentário preso ao **segundo** exato) vive no player e funciona. O clube nunca
toca nela: em `clubes.ts:508` ele pega o `positionSec` e converte na hora para
capítulo, **descartando a precisão**. O mural é um chat cronológico; a rodada é um
tópico de fórum. Nenhum dos dois precisa de um player para existir — **um grupo de
WhatsApp faz igual, e as pessoas já têm o grupo de WhatsApp**. A §4.39 tinha
decidido o contrário ("sala e clube são um mecanismo só, o clube é uma turma por
cima"); na hora de construir viraram dois sistemas que não se falam. **O
diferencial existe e está construído — só que fora do clube.**

**Três reformulações desenhadas** (maquete em `client/public/_comparacao-clube.html`,
temporária, fora do git):

1. **O clube ouve com você** — o clube deixa de ser lugar e vira companhia dentro
   do player: selo da turma no topo, marcas da turma na barra, e a conversa do
   trecho com aba "da turma / de todos". A tela `/clube/:id` encolhe para painel de
   estado. *Custo:* o clube perde peso como destino.
2. **A conversa segue o livro** — o mural cronológico morre; a conversa se organiza
   por **capítulo**, e o que está adiante vira **uma linha com um número** em vez de
   uma parede de caixas cinza. *Custo:* perde o "agora" do burburinho do dia.
3. **Cabe numa tela** — enxuga as cinco seções empilhadas para uma só; rodada e
   votação viram **tarja que aparece na semana em que é a hora**. *Custo:* deixa o
   clube bonito e **continua invisível**.

**Parecer da Janela A:** 1 + 2, nessa ordem — a 1 é a única que responde "isso tem
diferencial?" com um sim que ninguém copia sem ser dono do player, e a 2 conserta a
tela e a parede cinza de forma estrutural. A **3 sozinha não se recomenda**, mas o
enxugar dela vale para qualquer uma das outras.

**Defeitos achados no mesmo passeio** (independentes da reformulação):

- **`Clube.tsx:241` apaga o clube sem confirmação e sem desfazer**, e o aviso mente:
  diz *"Você saiu do…"* quando o clube e o mural inteiro foram destruídos.
- **A regra de spoiler que a tela promete não é a que ela executa.** O cartão diz
  *"Combinado da roda: até o capítulo 7… Mensagem que fala além disso chega
  coberta"*, mas `MuralDoClube.tsx:196` cobre pelo **seu** capítulo. Estando no 3,
  mensagens de cap. 5 e 6 — dentro do combinado — chegam cobertas. Ou o texto muda,
  ou o comportamento; hoje o app diz uma coisa e faz outra.
- O rodapé *"os outros membros são leitores fictícios"* aparece em clube que só tem
  você.
- **Fora do clube:** medido, **52 de 54 sinopses estão em inglês** e **7 têm
  marcação crua** — a de *A Paciente Silenciosa* abre com `## [The Silent Patient
  PDF](https://…)`. Vêm da Open Library via `npm run catalogo`. Num app cuja
  identidade é PT-BR, é a mancha mais visível da ficha.

### O que o Matheus decidiu em 28/07, e o que foi construído

Vistas as três propostas, ele decidiu: **fazer as três**, e acrescentou um pedido
que não estava em nenhuma delas — *"a gente tem que dar mais autonomia para quem
está criando o clube… esse cara tem que ter muita autonomia"*: excluir pessoas,
pôr assunto em votação, e definir quantas pessoas cabem.

**As três só convivem se cada uma virar uma camada, e não uma tela concorrente.**
A 2 e a 3 brigam de frente: a 2 faz a tela do clube ser uma lista de capítulos
(que rola por definição) e a 3 pede uma tela sem rolagem. A saída foi dar altura
diferente a cada uma: **1 = onde a conversa acontece** (o player), **3 = o estado
do clube agora** (a tela do clube), **2 = o arquivo** (a conversa capítulo a
capítulo, um nível abaixo). A moderação desce junto com a 2, pelo mesmo motivo:
não é uso diário.

**Fase 1 — o clube dentro do player** (commit `26ccd7c`). Faixa da turma no
player, marcas da turma na barra, e a conversa do trecho com abas "da turma / de
todos". Duas correções da maquete apareceram olhando o código:

- **A faixa mostra ritmo, não contagem de falas.** A barra de ações já tem o botão
  "Conversa" com contador; repetir o número seria redundância. O que só a faixa
  pode dizer é a coisa útil de se saber ouvindo: *estou no ritmo da turma?* E quem
  passou do combinado vê a faixa mudar de tom — é quem pode estragar a escuta dos
  outros.
- **A marca da turma é a mesma laranja com um anel, não uma cor nova.** A maquete
  tinha verde só para o clube; caiu porque a barra já tem dois tipos de marca e um
  terceiro **tom** em pontinhos de 8px não se distingue — vira cor decorativa. A
  barra de ações também já tinha **seis** itens (o código abrevia "Velocidade"
  para "Veloc." por isso): as abas foram para dentro da folha em vez de virarem um
  sétimo botão.

**Fase 2 — poderes do moderador e a tela enxuta.** Nova tela
`/clube/:id/gerenciar` com vagas, membros (remover e devolver), pauta, rodada,
mensagens escondidas e apagar. Decisões que apareceram fazendo:

- **Pauta e votação do próximo livro ficam separadas.** A votação do livro **muda
  o estado do clube** (o vencedor vira o ciclo, o anterior vai para a estante); a
  pauta é o grupo decidindo algo que o moderador executa. Fundir faria a mais
  inofensiva herdar o poder de trocar o livro de todo mundo.
- **Remover é reversível para quem removeu.** Errar o toque numa lista de nomes é
  fácil demais; quem sai aparece logo abaixo com "devolver".
- **Diminuir o limite nunca expulsa ninguém.** Perder um membro de lado, mexendo
  num número, seria a pior forma de perdê-lo.
- **Semeado um clube que é seu** (`exemplo-do-dono`, "Suspense de Domingo"), com
  quatro leitores fictícios e a descrição dizendo que é exemplo. Sem ele a tela de
  remover membro nasceria com uma linha (você) e seria botão morto — o que a 4.23
  manda varrer. Apagar leva um toque.
- **O voto dos outros na pauta é simulado, estável e declarado**, igual ao
  progresso dos membros: uma pauta que mostra "1 voto" para sempre não deixa ver o
  mecanismo.

**Os defeitos da 4.40 consertados nesta rodada:** apagar o clube saiu do botão
discreto (agora em Gerenciar, com confirmação que diz o que se perde, e sem o
aviso que mentia "você saiu do…"); o texto do combinado parou de prometer o que
não cumpre — **o combinado é até onde escrever, o que você já ouviu é até onde
ler**, e a tela agora diz as duas; o rodapé de "membros fictícios" só aparece
quando há outros membros; a seção da rodada some quando não há rodada nem
histórico (era a caixa vazia que vinha antes da conversa); e "Encontro · sem hora
marcada" virou **"A rodada"**, porque como cabeçalho lia como defeito.

**Ainda não feito:** a fase 3 (a conversa capítulo a capítulo) e as sinopses em
inglês.

---

## 4.41 A comunidade é pré-requisito do clube — e o Perfil é duas coisas ao mesmo tempo (28/07)

Conversa com o Matheus na janela B, no mesmo dia em que a A avaliava o clube.
**Nada construído ainda; o que segue é decisão de rumo e o que foi rejeitado.**

**As três propostas de Perfil da folha `_comparacao-perfil.html` foram
rejeitadas** — e não pelo visual: *"até o design e o layout estão bonitos, não é
essa a questão"*. O defeito é conceitual, e ele apontou na proposta B: **a mesma
tela é vitrine e menu ao mesmo tempo**. "Comunidade", "Estatísticas", "Minhas
notas" são portas do **seu** uso; não têm sentido nenhum numa página feita para
**outra pessoa** ver. Estavam ali só porque hoje o Perfil é a única porta que
leva à Comunidade — herança, não desenho.

**A regra que fica: separar por dono, não por tela.**
1. **Sua página** (pública) — só o que faz sentido alguém ver: o que você ouve,
   o que recomenda e por quê, o que você disse, seus selos, seus clubes.
2. **Painel** (privado) — notas, downloads, estatísticas, ajustes, sair. Atrás
   da engrenagem; não é vitrine.
3. **Comunidade** — lugar próprio, não item dentro do Perfil.

**A Comunidade tem que ser refeita inteira** (*"está horrível, muito ruim e não
tem função nenhuma"*), e o motivo dela mudou de peso. Nas palavras do Matheus:
**sem comunidade não existe clube** — *"se você não tiver uma interação, uma
comunidade com outras pessoas, […] não vai ter como ser possível você criar o
clube de livros"*. Você precisa **encontrar** gente antes de ter a quem
convidar. A Comunidade deixa de ser apêndice social e vira **infraestrutura do
clube**: descobrir pessoas por afinidade, ver o que elas ouvem e recomendam,
interagir, e convidar.

**Contradição a resolver, e é decisão do Matheus.** A decisão de 21/07 (seção
"Decisões da Comunidade") diz: *"o social é secundário e fica escondido,
alcançado pelo Perfil"*, e rejeita comunidade no Início. **É essa decisão que
hoje impede o clube de existir.** Ou o social ganha porta própria (o candidato
óbvio é o `BottomNav`, hoje Início · Biblioteca · Pedir · Buscar · Perfil), ou o
clube continua sem gente para encher. A recomendação registrada aqui: dar porta
própria à Comunidade; manter o Início limpo de social, que era o coração
daquela decisão.

**O que "Recomendo" passa a ser.** Hoje é uma seção do Perfil que **ninguém vê**
— o rótulo diz "Visível para a comunidade" e ela vive no `localStorage`. Na
arquitetura acima, a recomendação com motivo é o **conteúdo que alimenta a
Comunidade**: é ela que dá o que ver quando você abre a página de alguém.

### Construído em 28/07, no mesmo dia (janela B)

O Matheus aprovou a proposta (folha `_proposta-comunidade.html`, fora do git) e
mandou construir. Quatro fases, quatro commits — `67fd579`, `5046a29`,
`ba2ad43` e a troca do menu. O que se decidiu **fazendo**:

- **A contradição de 21/07 foi resolvida a favor da porta própria:** Comunidade
  entrou no menu de baixo no lugar do Perfil, que virou o **avatar no topo**
  (com a foto de verdade). O Início continua limpo de social — essa metade da
  decisão antiga segue valendo.
- **Nenhum número social inventado.** A página não mostra seguidores (não há
  servidor); mostra horas, títulos e recomendações, que são verdade desde o
  primeiro dia. O "compartilhar" não gera link do perfil — **compartilha as
  suas indicações em texto**, porque um link que só funciona na sua máquina é
  um link que mente.
- **"Ouvindo agora" nasceu fictício e anotado:** os 5 leitores com o campo
  ganharam livros coerentes com a bio e que eles **ainda não recomendam**
  (estar no meio ≠ já ter indicado). Quando houver servidor, vem do progresso
  real, **com interruptor de privacidade no painel** — regra já decidida.
- **O motivo medido substituiu o "talvez combine":** as sugestões dizem "está
  ouvindo o mesmo livro, 3 capítulos à sua frente" e "recomenda 2 que você já
  ouviu" — pesos: mesmo livro agora > sua lista > o que você já ouviu > gênero.
- **Selos: as 2 medalhas mais raras**, calculadas (lendária > rara > comum); a
  grade completa foi para `/achievements`, e o placar "X de 16" mora no painel.
- **Mantido intacto o trabalho da janela A:** `ConversasDeAgora` e
  `ClubesNaComunidade` seguem na tela, reposicionados (conversa antes de gente,
  como a 4.39 pedia).

**Ficou de fora, com motivo:** curtir recomendação (exigiria estender
`reactions.ts` e inventar contadores que ninguém produziu); "ver tudo" nos
comentários da própria página (não existe tela de "meus comentários" — os 3
mais recentes bastam até ela existir); e o e-mail sumiu da página pública de
propósito (é cadastro, não conteúdo — mora no painel).

### Avaliação × conversa: separadas em 28/07 (era "em aberto", o Matheus mandou fazer)

O Matheus apontou: *"parece que é a mesma coisa — comentários e a conversa…
você não sabe o que é conversa, o que é comentário"*. **Apurado no código, a
sensação tem causa concreta e histórica:**

- A ficha empilha **três blocos de opinião**: a nota média (Narração/História
  + origem), a sua avaliação (`AvaliarLivro`, estrelas com portão de 20%), e a
  "Conversa" (`SalaDoLivro`) — e dentro da conversa os comentários **semeados**
  exibem estrelas (`Comment.rating`), com cara de resenha no meio do papo.
- **A origem:** as estrelas nos comentários são de 26/07, de quando a seção era
  uma lista de comentários (avaliações). Em 27/07 a lista **virou** a sala do
  livro (4.39) sem separar os gêneros — a mistura é o resíduo dessa virada.
- **O detalhe que facilita o conserto:** os fluxos NOVOS já são separados. A
  sua nota vive em `ratings.ts` (sem texto) e a sua fala em `myComments.ts`
  (sem nota) — só o dado semeado antigo (`Comment.rating`) e a exibição juntam
  os dois.

**A regra construída (commit `bc5da29`):** **nota = avaliação; âncora =
conversa; a âncora ganha da nota; os formulários não se cruzam.** A ficha
ganhou a seção "Avaliações" (nota média + a sua nota + resenhas com estrela,
"N acharam útil", respostas em leitura) e a "Conversa" ficou só com o papo. A
separação foi feita **na fonte** (`comments.ts`), sem tocar nos arquivos da
janela A: `commentsForBook` passou a devolver só conversa — e a sala, as
marcas na barra e o painel do trecho, que consomem dela, se corrigiram
sozinhos. Decisões dentro da decisão:

- **Os 3 híbridos semeados (nota + âncora) são conversa** — quem escreve preso
  a um ponto está falando do trecho; a estrela deles não aparece no papo, mas
  a nota **continua na média** (`notasDoLivro`, que soma tudo).
- **A média da comunidade não perdeu nada:** `ratings.ts` trocou de fonte
  justamente para continuar contando as resenhas que saíram da conversa.
- **As 8 respostas penduradas em resenhas continuam legíveis** ("N respostas"
  na avaliação, só leitura) — arrumar a casa não podia apagar fala existente.
- **Avaliação não tem caixa de escrever nem responder**: a sua nota é o
  `AvaliarLivro`; conversar é na sala. Escrever o *texto* da própria resenha
  ficou de fora por ora — exigiria `rating` em `MyComment`, e é outra obra.
- A estrela **mudou de casa, não morreu** — o histórico está anotado no
  próprio `CommentThread`, porque a estrela no fio tinha sido pedido do
  Matheus em 26/07, e a decisão nova substitui aquela com contexto.

### O Mural: a decisão de 21/07 foi revisitada de propósito (28/07)

O Matheus pediu *"um mural, como se fosse um feed de notícias das pessoas que
você segue… uma atualização constante"* e que a pessoa *"possa falar sobre
coisas que está ouvindo"*. Isso **contraria o registro de 21/07** ("não é um
feed tipo Instagram/Facebook") — a contradição foi mostrada a ele, e ele
manteve o pedido. **Motivo da virada:** aquela decisão foi tomada quando a
Comunidade era um diretório; o defeito real de agora era outro — *seguir não
alimentava nada* e não havia voz própria fora da ficha de livro.

**O que sobrevive da decisão antiga:** nada de social no Início; e **nada de
post solto** — a régua nova que segura tudo é *"todo post nasce amarrado a um
livro"*. A caixa de publicar anexa o livro em reprodução (troca entre os 5
recentes); quem nunca ouviu nada vê um convite, não uma caixa de texto. É o
que separa o Mural de um Twitter e mantém a moderação do tamanho do app.

**O desenho construído** (`lib/mural.ts` + `MuralDaComunidade`, commit
`d886de7`): feed cronológico com **tipos fechados, todos nascidos da audição**
— está ouvindo, terminou, avaliou, comentou, recomendou, e o novo **"disse"**
(texto até 280, livro anexado, apagável). A trava de spoiler **viaja com o
comentário**: no feed ele aparece fechado com o motivo e o atalho "Abrir a
conversa". Meus acontecimentos entram com datas reais (conclusões, avaliações,
posts); **recomendações minhas passaram a nascer com data** por isso — as
antigas, sem carimbo, ficam fora do feed (data chutada seria mentira).

**Nome:** a aba continua **Comunidade** (lugar-guarda-chuva); o feed dentro
chama **Mural** — mesma palavra do clube, virando vocabulário da casa: mural =
onde a turma escreve.

**Sem seguir ninguém, o mural mostra a comunidade inteira** — feed vazio no
primeiro dia era exatamente o defeito da tela antiga; seguindo, ele vira só
dos seus.

**Absorvido no mesmo dia em que nasceu:** o bloco "Recomendado pela sua roda"
(criado de manhã na reforma da Comunidade) saiu — recomendação virou um tipo
do feed, e o mesmo conteúdo em dois blocos era redundância.

**Fora desta rodada, anotado:** ~~posts "disse" ainda não aparecem na página
pública~~ — **feito na sequência, no mesmo dia** (o Matheus apontou que o
perfil dos membros tinha ficado sem as novidades): "O que eu disse" da sua
página junta comentários **e** posts do mural; o perfil de um leitor ganhou o
bloco **"Ouvindo agora"** (o dado existia e a tela não mostrava), o fundo do
topo passou a ser a capa do que a pessoa está ouvindo, e a lista crua
"Comentários de fulano" virou **"Atividade de fulano" na língua do mural**
(`ItemDoFeed` exportado + `muralDe(slug, tipos)`) — o que trouxe de graça a
separação (estrela na avaliação) e **fechou um vazamento**: a lista antiga
mostrava texto de comentário de trecho à frente da sua posição, sem trava.
Recomendações continuam como vitrine própria na página (o feed da pessoa não
as repete). Segue de fora: o tipo "entrou no clube", porque o esqueleto não
tem data de entrada em clube.

### Privacidade da vitrine: dois interruptores (28/07, pedido do Matheus)

*"Mostrar o que está ouvindo tem que ser algo que o usuário tenha que
escolher"* — e, na sequência, *"assim também os clubes"*. Construído (commit
`faad832`): grupo **Privacidade** no painel `/you`, com dois interruptores em
`lib/settings.ts` (que só aceita chave que o app obedece de verdade):

- **"Mostrar o que estou ouvindo"** — desliga o bloco "Ouvindo agora" **e o
  fundo do topo** da página pública: a capa desfocada entrega o que está
  tocando tanto quanto o bloco, esconder um sem o outro seria vazamento.
- **"Mostrar meus clubes"** — esconde a lista de clubes **da vitrine**; dentro
  do clube a turma continua te vendo, que é outro contrato.

**Decisões dentro da decisão:** os dois nascem **ligados** enquanto não há
contas (hoje ninguém além de você abre a sua página; nascer desligado mataria
o recurso invisível) — quando houver cadastro, a escolha deve virar pergunta
do primeiro uso. O MiniPlayer não obedece ao interruptor: ele é seu, não da
vitrine. E um detalhe de código que o teste pegou: dois toques no mesmo
instante se sobrescreviam (estado velho no fechamento) — o gravar passou a
partir do storage, não do estado da tela.

### O post do mural abriu o leque: qualquer livro, ou um clube (28/07)

Dois reparos do Matheus na caixa de publicar, no mesmo dia em que ela nasceu:
o convite *"diga algo sobre o que você está ouvindo"* fechava usos legítimos
(*"a pessoa pode estar pedindo uma recomendação"*), e o anexo preso aos
recentes era pobre (*"ela poderia mencionar um livro ou um clube"*). Feito
(commit `2887a7d`):

- O convite virou **"Fale com a comunidade — uma opinião, um pedido de
  indicação…"**.
- A âncora é escolha: os recentes como atalho, **busca no catálogo inteiro**
  (título/autor, sem acento) e **os seus clubes** como chips. Post de clube
  aparece como "disse, no clube X", com a capa do livro da vez e a porta
  levando ao clube.
- **A trava não mudou:** post sem âncora nenhuma continua não existindo — é o
  que separa o Mural de uma rede social genérica.
- A caixa deixou de sumir para quem nunca ouviu nada: agora sempre há o que
  anexar (o catálogo). Publicar segue desabilitado até ter âncora e texto.
- Testado de ponta a ponta os dois caminhos (busca + clube) e apagado depois.

**Ideia anotada, não construída:** âncora em **gênero** ("me indiquem
Mistério") cobriria o pedido de indicação sem livro específico — fica para
quando o uso pedir. *(Atualização, mesma noite: o pedido de indicação por tema
ganhou casa melhor — as Rodas, abaixo.)*

### A cara nova da Comunidade: 4 propostas → a junção → 3 abas (28/07, noite)

O Matheus pediu a reformulação visual da aba. O caminho, com as decisões:

1. **Uma proposta única foi vetada pelo processo**: ele mandou desenhar
   **"pelo menos 4 propostas completamente diferentes"** para avaliar. Foram
   desenhadas (folha `_4-propostas-comunidade.html`, fora do git): **A
   Revista** (editorial), **O Ao Vivo** (transmissão), **Os Salões** (lugar
   com portas) e **As Pessoas** (gente em primeiro plano).
2. **A avaliação dele foi a junção**: *"juntar todas essas funções… agrupar
   numa coisa só"* — com dois cortes ditos: "assunto de hoje" e "frase do
   dia" fora; "os mais falados da semana" dentro. A junção está na folha
   `_sintese-comunidade.html`, com a etiqueta de origem de cada peça.
3. **No meio, o Orkut**: ele lembrou das comunidades com tópicos e pediu.
   Viraram as **Rodas de conversa** (`lib/rodasDeConversa.ts`, telas
   `/roda/:id` e `/roda/:id/topico/:topicoId`, commit `dd6b371`): **Roda
   (assunto) → tópicos → respostas**, com o nome da casa porque "comunidade
   dentro da Comunidade" confundiria. Completa a escada de conversa: sala =
   um livro; Roda = um assunto; clube = uma turma com prazo. Entrar é livre;
   criar tópico entra junto (o gesto já diz a intenção). 5 rodas semeadas com
   9 tópicos e fios; o seu (participações, tópicos, respostas) no
   `localStorage`.
4. **E o excesso foi arrumado a pedido dele** (*"muita coisa solta"*): a tela
   virou **três abas internas** — **Agora** (fita de capas "ouvindo agora" no
   estilo stories + Mural com filtros por tipo e cor por verbo), **Conversas**
   (as "conversas da semana" — fusão do top numerado com as portas, porque
   apontavam para as MESMAS salas — + Rodas + clubes) e **Gente** (pódio da
   semana calculado de `hoursListened`, "combina com você" em carrossel com
   as capas em comum, seguidos numa linha). Commit `8e27bdd`.

**Cortes com motivo:** a fileira "Seguindo" encolheu para uma linha de
avatares (era o bloco mais redundante); o banner "Em alta" único foi absorvido
pelo top numerado; a linha-do-tempo-com-hora da proposta B morreu (o mural em
cartões conta a mesma história); "leitor da semana" single virou pódio de 3.
**Nada aparece duas vezes na tela.**

**Fica para depois, anotado:** tópico de Grupo mencionando um livro (a âncora
do mural, prometida na folha — pede juntar o seletor de livro ao criar
tópico); Grupos no perfil público; e moderação de tópico quando houver gente.

### Três reparos do Matheus, na mesma noite (commit `2ea6aec`)

1. **"Eu não posso criar uma roda?"** — podia não; agora pode. **Criar grupo**
   entrou na aba (nome + emoji + descrição), o grupo seu abre no topo da
   lista, aceita tópicos como qualquer outro, e tem "apagar este grupo" (leva
   os seus tópicos junto). Quem cria já entra participando.
2. **Os nomes caíram:** "Rodas de conversa" → **Grupos** (a palavra que todo
   mundo entende hoje); as abas viraram **Mural · Grupos · Pessoas**. Os
   arquivos acompanharam (`lib/grupos.ts`, `pages/Grupo.tsx`, rotas
   `/grupo/:id`) — "roda" agora só existe no app como a *rodada* do clube, da
   janela A, que é outra coisa.
3. **O pódio nasceu e morreu no mesmo dia** ("não está legal, tem que ser
   totalmente reformulado"). No lugar, a aba Pessoas ganhou **"Todo mundo"**:
   a lista completa dos leitores com bio, o que cada um está ouvindo agora e
   o Seguir na linha — gente como gente, não como ranking. "Combina com você"
   (cartões com motivo) continua abrindo a aba.

**Ligado a isso, pendente na janela A:** `ConversaDoTrecho.tsx:168` ("Ver a
conversa do livro inteiro") ainda aponta para a ficha; o destino certo é a
página `/book/:id/conversa`. Pedido registrado no quadro da COORDENACAO.

### Segunda avaliação da Comunidade, e um quadro novo de 6 propostas (28/07, noite)

O Matheus pediu para **avaliar a aba já reformulada** e desenhar um quadro
**"completamente diferente"** do anterior. Folha: `client/public/_quadro-comunidade-v3.html`
(fora do git). **Nada construído; nada decidido ainda.**

**Os oito defeitos apurados na tela rodando** (vale registrar porque três deles
são de *mecanismo*, não de aparência — quem for reformar de novo tropeça neles):

1. **Seguir uma pessoa colapsa o mural nela.** `feedDoMural` filtra por
   seguidos; com 8 leitores no esqueleto, 1 "seguir" fez o feed virar doze
   cartões seguidos da Carla Lima. O recurso principal da tela é o que a
   esvazia.
2. **O mesmo fato aparece duas vezes** — "recomendou Duna" e "avaliou Duna
   5,0" em cartões colados. Nada agrupa por pessoa + livro + dia.
3. **A aba Grupos tem três listas visualmente idênticas** (conversas da semana,
   grupos, clubes). A escada livro → assunto → turma existe no ROTEIRO e **não
   existe na tela**.
4. Nenhum cartão aceita responder ou reagir: **a tela é de ler, não de fazer**.
5. **Os contadores anunciam o vazio** ("3 pessoas · 1 tópico") — onze deles,
   todos abaixo de seis.
6. **A aba Pessoas acaba em um minuto**: são 8 de 8 leitores com "Seguir", e
   seguir ainda piora o item 1.
7. **Nada vence e ninguém te chama** — não há razão para voltar amanhã.
8. **Não existe "convidar" em lugar nenhum**, embora a razão declarada da aba
   (acima, nesta seção) seja achar gente para o clube.

**As seis propostas do quadro novo**, cada uma com uma tese diferente sobre o
que a Comunidade *é*: **1 A Margem** (o social ancorado no ponto do áudio, sem
feed), **2 O Balcão** (pergunta e indicação; a resposta é sempre um livro),
**3 A Agenda** (encontro com data e contagem regressiva), **4 A Parede de
Trechos** (a moeda social é o áudio, 30–60 s ouvidos ali mesmo), **5 A
Dissolução** (a aba deixa de existir; sobra uma caixa de entrada) e **6 A
Estante Coletiva** (capas com assinatura humana). Recomendação registrada:
**Balcão como espinha, Margem como segundo andar** — o Balcão é o único que
funciona com pouquíssima gente (uma resposta resolve uma pergunta) e liga o
social à alma do app (pergunta sem resposta no acervo = pedido de narração).

**O desafio dos protótipos (28/07, noite).** O Matheus mandou **B e C construírem,
cada uma, um protótipo da Comunidade fora do app**, para comparar e escolher — e
pediu que a junção partisse dos **grupos com tópicos, no estilo Orkut**, que já
existem no app. O protótipo da B é `client/public/_prototipo-comunidade-B.html`
(navegável de verdade): espinha **tema → grupo → sala → tópico → fio**, com três
tipos de post (conversa, **pergunta** com melhor resposta, **trecho** de áudio),
abas Tópicos/Trechos/Estante/Turma dentro do grupo, caixa de entrada no topo e um
botão de **raio-x** que etiqueta na tela de qual proposta veio cada bloco.

**Como funciona marcar um trecho — o desenho, com os porquês** (a pergunta do
Matheus; está construído no protótipo e vale para quando virar código):

- **Marca-se para trás.** O botão no player pega os **últimos 40 s que já
  passaram** — ninguém sabe que um trecho é bom *antes* de ele acontecer. Só
  depois você ajusta as pontas (−5 s/+5 s de cada lado), com prévia antes de
  publicar. Acima de 1 minuto o app avisa: trecho longo ninguém escuta até o fim.
- **A frase do "por quê" é obrigatória** — é o que separa recorte de
  recomendação. Sem ela o publicar recusa.
- **O app não copia áudio: guarda um ponteiro** (livro + segundo de início +
  duração + a frase). Tocar o trecho é tocar **o próprio arquivo do livro**,
  começando ali. Não nasce arquivo novo, não pesa, e o trecho não sai do app.
- **Cuidado que isso cria:** se o arquivo do livro for trocado por outra
  masterização, os segundos deslocam e todo trecho aponta para o lugar errado —
  o ponteiro precisa guardar **qual versão do arquivo**, e a troca precisa
  remapear ou marcar os trechos como de uma edição antiga.
- **Spoiler:** o trecho sai carimbado com o capítulo. Quem **tem o livro e está
  atrás** vê o cartão fechado, com o motivo e "ouvir mesmo assim"; quem **não
  tem o livro** ouve normalmente — para essa pessoa é vitrine, não spoiler.
- **Destino é escolha:** a parede de um grupo seu, um fio (como resposta), ou
  "só para mim".
- **Ainda falso no protótipo:** não há áudio de verdade — a onda é desenhada e o
  play é animação, porque o app não tem arquivos ainda. A onda real sai do
  arquivo, calculada uma vez e guardada como uma lista de alturas.

**Duas desenhadas e descartadas por mim, com motivo:** **O Time** (metas
coletivas — vira número enfeitando número, e mede quantidade de escuta quando
o app quer escuta certa) e **A Sessão** (audição sincronizada ao vivo — não
funciona nem em maquete sem gente simultânea; a parte boa dela, *estar junto no
mesmo ponto*, sobrevive dentro da Margem).

---

## 4.42 O moderador manda de verdade, e a tela de clubes aguenta quantidade (28/07)

Terceira rodada com o Matheus no mesmo dia, olhando o clube já reformulado.
**Construído**, nos commits `62c7f87` e no seguinte.

### "Os botõezinhos eram uma camisa de força que eu mesmo pus"

O diagnóstico dele foi preciso e a lista, específica: o moderador *"não tem muita
autonomia para dizer quando é que o clube começa"* (só hoje / 3 dias / 1 semana);
*"se ele quiser colocar 14 pessoas, ele também não consegue"*; *"nas semanas
também, ele não consegue dizer qual é o dia que ele quer que acabe"*; e, o mais
importante, *"na questão dos capítulos… ele poderia também editar quando é que
cada um começa e acaba; ele também não tem essa autonomia hoje"*. A conclusão
dele é a tese do recurso inteiro: **"o moderador é a chave principal disso aqui.
Ele tem que ter muita autonomia de como ele quer gerir o clube dele."**

**A ressalva técnica que ele levantou tem resposta, e é "não custa nada".** Ele
perguntou *"se não for complicar na questão de servidores… de algoritmos"*. Não
complica: uma data continua sendo uma data, um número continua sendo um número, e
uma lista de marcos é mais simples de guardar do que a fórmula que a gerava. **A
limitação era de interface, não de arquitetura** — presets escolhidos por
comodidade minha na primeira versão, que viraram regra de produto sem ninguém
decidir isso.

**O que ficou:** estreia e encontro são **campos de data**; vagas é um **campo de
número**; e o ritmo virou um **editor de marcos** (capítulo + data por linha, com
acrescentar, tirar e "refazer sugestão"). Os botõezinhos continuam — quase todo
clube é 4 semanas e 6 pessoas —, mas agora **preenchem os campos** em vez de
serem as únicas opções.

Decisões que apareceram fazendo:

- **A sugestão de marcos se refaz ao trocar livro ou datas, e não ao editar um
  marco.** Recalcular sobre a edição desfaria o trabalho do moderador no desenho
  seguinte; trocar de livro é mudar a premissa, e aí refazer é o certo.
- **O último marco sugerido é sempre o livro inteiro.** Um ciclo que para no
  capítulo 12 de 13 deixa o final fora do combinado — e é o final que a turma
  quer discutir junta.
- **O capítulo de um marco não pode ser menor que o do anterior.** "Até o 6 dia 10,
  até o 4 dia 17" não é ritmo, é erro de digitação.
- **A estreia deixa de ser editável depois que o clube começa.** Mudar o passado
  não significa nada: quem ouviu, ouviu. Em formação, ela abre — é aí que adiar
  para juntar gente faz sentido.
- **Editar o ciclo em Gerenciar existe porque o combinado muda no meio.** Antes o
  moderador só podia refazer o clube do zero, perdendo o mural.

### A tela de clubes tinha duas gavetas e nenhuma escala

Preocupação dele, antes de o problema existir: *"imagina que a gente vai ter uma
tela que tenha centenas de clubes de livros… da forma como está estruturada hoje
não está muito legal"*. Estava certo — "seus clubes" + "clubes em andamento" é
uma lista corrida, e lista corrida não se lê com trezentos itens.

**O que entrou, e por quê:**

- **Carrossel de estreias** (pedido direto dele). Substituiu o destaque grande
  fixo: com muitos clubes estreando, o destaque **escolhia um por você e escondia
  os outros**. No carrossel o primeiro cartão é o maior — a estreia mais próxima,
  a que some antes —, e todos ficam ao alcance do polegar.
- **Busca por nome, descrição, livro e autor.** O livro entra de propósito: a
  pergunta real de quem procura clube é *"tem alguém lendo Duna?"*, não o nome que
  a turma deu a si mesma. Buscar só pelo nome devolveria vazio na pergunta mais
  comum que existe.
- **Tópicos** (sugestão dele: *"talvez colocar por tópicos"*). Pastilhas de gênero
  **montadas a partir dos clubes que existem**, com a contagem — nunca da lista de
  gêneros do catálogo, senão haveria filtro "Romance · 0", que é o botão morto da
  4.23.
- **Buscando, a vitrine sai da frente** e a busca varre **tudo**, inclusive
  estreias e os seus clubes: quem digita "Duna" quer o clube de Duna, não quer
  saber em que gaveta ele estava.

### Encher de clube para ver se o desenho aguenta

Pedido dele logo depois: *"cria alguns clubes bem aleatórios, colocando pessoas,
colocando estreia, enchendo isso"*. **Com cinco clubes tudo parece organizado; o
desenho só se prova com vinte.** Foram semeados **21 clubes** em 9 gêneros, 8
deles ainda por estrear — variados *de propósito*, não ao acaso: clube lotado e
clube de duas pessoas, estreia amanhã e estreia daqui a dez dias, ciclo no começo
e ciclo quase no fim, gênero com seis clubes e gênero com um só.

Três coisas que **só apareceram com a tela cheia**, e que foram corrigidas:

- **"Seus clubes" comia a tela inteira.** Com cinco clubes seus, o carrossel e a
  busca ficavam abaixo da dobra. Agora mostra **três, ordenados pelo encontro mais
  próximo** (é o clube que precisa de você agora, não o que você entrou primeiro),
  e o resto atrás de um toque.
- **A tarja de data cobria o rodapé da capa** — e capa de livro tem texto ali
  (título, autor, frase de crítica), então dava letra sobre letra. Virou uma
  **etiqueta pequena no canto de cima**, que tapa o mínimo.
- **Faltava gente.** `community.ts` tem oito leitores, e é território da janela B.
  Os **figurantes** (nome + cor, nada mais) moram em `clubes.ts`: um clube de dez
  pessoas precisa de dez avatares, não de dez biografias — meia dúzia de perfis
  pela metade em `community.ts` estragaria a tela Comunidade.

### Registrado porque ele levantou e descartou sozinho

O Matheus cogitou *"colocar em votação um livro… quando tiver perto do fim"* e
concluiu na mesma frase que **já existe** (a votação do próximo livro fecha o
ciclo). Fica escrito para ninguém propor de novo. Ele também gostou do que já
estava pronto e pediu para explorar mais: a **pauta com frases pré-prontas** —
*"principalmente você já deixar as frases pré-prontas, isso também é muito
legal"*.

---

## 4.43 Rota de colisão: o Clube e o Grupo estão virando a mesma coisa (28/07)

**Nada construído. Isto é um alerta e uma decisão em aberto**, escrito pela
janela A no minuto em que o problema apareceu, porque ele custa caro se for
descoberto depois de construído.

### O que o Matheus pediu

Terceira conversa do dia, sobre reformular a Comunidade:

1. **Citar 40 segundos de áudio.** Marcar um trecho no player e compartilhá-lo no
   feed, e *"só poder reproduzir isso"* — a citação toca o trecho e para.
2. **Feed com o seu perfil ao lado** e **sugestões de quem seguir**, no formato de
   rede social ("no Facebook e no Instagram aparecem pessoas sugeridas, porque
   você não vai seguir todas as pessoas").
3. **Grupos**, com uma diferença que ele fez questão de isolar: *"o dono do grupo
   pode privar, e essa é a grande diferença. Ele pode privar esse grupo e pode
   inclusive excluir pessoas."* Mais **tópicos** dentro do grupo.
4. **Temas de livro no grupo:** *"você tem temas dos livros, e o que é que esse
   grupo fala? Você pode selecionar temas de um livro."*

### A colisão, em uma tabela

A janela B **já construiu** os Grupos (`lib/grupos.ts`, commits `2ea6aec` e
`ea576db`): nome, emoji, descrição, membros, **tópicos → respostas**, e entrar é
livre. A janela A **já construiu** o Clube com dono, remover membro, limite de
vagas e pauta. Com o pedido acima, os dois convergem:

| | Sala do livro (A) | Clube (A) | Grupo (B) | Grupo **pedido** |
|---|---|---|---|---|
| Sobre o quê | um livro | um livro **com prazo** | um assunto | um assunto **+ temas** |
| Tem dono | não | **sim** | não | **sim** |
| Entrar | — | livre / link | livre | **dono controla** |
| Privado | não | não | não | **sim** |
| Expulsar | não | **sim** | não | **sim** |
| Conversa | ancorada no **segundo** | mural por **capítulo** | **tópicos** | tópicos |

Medido no código hoje: `grupos.ts` tem **zero** ocorrências de dono, privado,
remover ou excluir. `clubes.ts` tem as quatro funções prontas (`souDono`,
`removerMembro`, `definirLimite`, `clubeCheio`).

**O grupo pedido é, funcionalmente, um clube sem livro e sem prazo.**

### Por que isto é sério, e não preciosismo

A §4.39 já decidiu exatamente contra isto — *"escreve-se **um** mecanismo de
mensagens; o clube vira camada fina de regras"* — e a §4.40 registrou o preço de
ter ignorado a decisão: sala e clube viraram dois sistemas que não se falam, o
mural virou um chat que qualquer app tem, e o clube passou a jogar fora o próprio
diferencial. **Construir agora um terceiro sistema de conversa, com a terceira
moderação e o terceiro armazenamento, é repetir o mesmo erro pela terceira vez** —
e desta vez com duas janelas construindo em paralelo.

### A recomendação da janela A

**Um mecanismo, três formatos.** Um "espaço" com quatro chaves independentes:
tem dono ou não · é aberto ou privado · gira em torno de um livro, de um assunto,
ou de nada · a conversa é ancorada no áudio ou em tópicos. Com elas:
**sala** = sem dono, aberta, um livro. **Clube** = com dono, um livro, com prazo.
**Grupo** = com dono, um assunto, sem prazo.

Na prática e sem refazer nada: **o Grupo herda a moderação do Clube** em vez de
ganhar a sua própria — as quatro funções de `clubes.ts` não dependem de livro nem
de ciclo, e sobem para um lugar comum.

**Os temas do grupo devem usar o vocabulário que já existe.** O `genero` do clube
já alimenta as pastilhas de tópico de `/clubes` (`topicosDeClube`). Um segundo
vocabulário de temas faria "Suspense" existir duas vezes, com contagens
diferentes, e a busca de um não acharia o outro.

**A decisão é do Matheus**, e é uma só: *Clube e Grupo são a mesma coisa com
ajustes, ou são dois produtos?* Enquanto não for respondida, as duas janelas
constroem em direção ao mesmo ponto.

### A citação de 40 segundos: a rejeição da §4.39 NÃO se aplica

Registrado para ninguém barrar a ideia com o argumento errado. A §4.39 descartou
**áudio gravado por leitor** por privacidade e moderação: a voz identifica a
pessoa, grava o fundo junto, e ninguém modera 400 áudios. **Nada disso vale
aqui:** a citação não é a voz de quem posta, é um trecho do próprio audiolivro —
não há voz de terceiro, não há fundo de casa, não há áudio novo para moderar.

**E ela é barata**, porque a peça já existe: o comentário da sala já carrega uma
**âncora em segundos**. Uma citação é essa âncora **com fim** (início + 40s). A
marca na barra do player, a trava de spoiler e o carimbo "cap. 7 · 12:40" passam a
valer para ela sem uma linha nova de regra. É, de novo, a coisa que só um app de
audiolivro pode fazer — e desta vez sem depender do feed para existir: uma
citação cabe na sala do livro no dia em que for escrita.

### Construída no mesmo dia — e o que foi decidido fazendo

O Matheus escolheu começar por aqui enquanto a decisão clube×grupo espera.
`lib/citacoes.ts`, `components/CitacaoDeAudio.tsx`, e o gancho no compositor, na
sala, na conversa do trecho e no player.

- **A citação é um valor solto, não um campo do comentário.** Ela é
  `{bookId, inicioSec, duracaoSec}` e vale igual na sala e no **feed da
  Comunidade**, que é da janela B — *"a gente coloca essa parte do áudio de 40
  segundos dentro desse feed também"*. O cartão `CitacaoDeAudio` está pronto para
  ser importado; escrever duas versões dele seria o erro que a §4.40 cobrou caro.
- **No comentário, guarda-se só a duração.** O começo já é a âncora
  (`positionSec`) que existia. Guardar o par inteiro faria o mesmo início existir
  em dois lugares, podendo divergir.
- **`?ate=` no player é o que separa "ouvir o trecho" de "abrir o livro aqui".**
  Sem ele, tocar uma citação levaria a pessoa livro adentro — e a condição do
  Matheus era *"só poder reproduzir isso"*. Testado: em `?t=1234&ate=1240` o
  player pára exatamente em 20:40.
- **A cerca cai quando a pessoa arrasta a barra.** A citação é porta de entrada,
  não cadeado: quem gostou do trecho e quer seguir o livro tem de poder, e ser
  pausado a cada volta seria o app teimando com quem já decidiu.
- **O trecho fica atrás do véu de spoiler junto com o texto.** 40 segundos do
  capítulo 9 entregam tanto quanto a frase que os acompanha.
- **A onda no cartão é desenhada, não medida** — e isso é declarado no código.
  Não há forma de onda para ler enquanto não houver áudio; ela diz "isto é som",
  que é o trabalho dela, sem fingir representar este trecho.
- **Sem som, e tudo bem.** O player não toca áudio (é `setInterval`, não
  `<audio>`) porque o servidor ainda não existe — confirmado pelo Matheus. A
  citação tem a mesma fidelidade do resto do player: leva ao ponto e percorre os
  40 segundos.

### O cortador de trecho, logo depois

A primeira versão fixava o início no ponto em que a folha abriu e só deixava
escolher o comprimento (10/20/30/40s). O Matheus apontou o buraco: *"seria
interessante que ele pudesse cortar exatamente o local onde ele quer citar, como
se fosse aqueles aplicativos de corte de áudio mesmo… e que ele pudesse
reproduzir onde é que ele está falando"*. Escolher entre quatro comprimentos
serve para "guardei por aqui"; não serve para "é **esta** frase".

`components/CortadorDeTrecho.tsx`: faixa com as duas pontas arrastáveis, seleção
destacada, ajuste fino de ±1s e ±5s em cada ponta, e prévia com cursor.

- **A limitação está dita, no código e aqui:** sem áudio, cortar é mirar pelo
  **relógio**, não pelo ouvido — num cortador de verdade a pessoa ouve e acha o
  ponto. A ferramenta está correta e é a que vai ser necessária quando o som
  existir. O Matheus confirmou o motivo: *"ele não toca áudio porque isso é uma
  maquete, ainda não tem servidor"*.
- **Arraste E botõezinhos, e não um ou outro.** Arrastar acha a região depressa;
  o dedo num celular cobre 4 a 6 segundos nesta escala, então sem o ajuste fino
  "exatamente" seria promessa vazia. Os apps de corte têm os dois pela mesma razão.
- **Defeito achado testando, e consertado:** com a seleção já nos 40s (o teto),
  "Início −5s" não fazia **nada** — recuar estouraria o máximo, e a trava
  silenciosa parecia botão quebrado. Agora a seleção **desliza**: o início recua e
  o fim vem junto, mantendo o comprimento. Vale igual no arraste.
- **A janela da faixa é congelada na montagem.** Se ela seguisse a seleção,
  arrastar uma ponta moveria o fundo junto e o gesto viraria areia movediça.
- **A âncora do comentário passou a ser o início do trecho** — é de lá que a
  citação fala.

**Pendente da ideia dele, e é da janela B:** o feed em si, o cartão do livro
mencionado num post, e as sugestões de quem seguir.

---

## 4.44 Fórum, não grupo — e quem cria modera o conteúdo, não a casa (28/07)

**Resolve a colisão aberta na §4.43.** O Matheus trocou a palavra e a troca
resolveu o problema: *"na verdade, a ideia não é criar um grupo. Realmente, a
ideia do grupo talvez seja ruim, mas a ideia do fórum é boa"*. E perguntou
direto: *"você acha que, se eu criar isso, vai concorrer com o clube do livro?"*

### Não concorrem — e a razão é tamanho e fim

| | Clube | Fórum |
|---|---|---|
| Junta gente por | um livro **com prazo** | um assunto |
| Tamanho útil | 4 a 12 | quanto mais, melhor |
| Acaba? | **sim**, o ciclo tem fim | **não**, e não deve |
| Você deve algo? | sim, aceitou um ritmo | nada |
| Chegar depois | constrange (a trava de spoiler) | é normal, lê tudo |

Um fórum de 300 pessoas funciona **melhor** que um de 8; um clube de 300 não
funciona. São curvas opostas — por isso se alimentam em vez de brigar. **O que
concorria era o "grupo"** da §4.43: dono + privado + expulsar é um clube sem
livro. O fórum não tem nada disso.

**A linha é testável, e é a que não se deve cruzar:** se o fórum ganhar **prazo e
livro do ciclo**, virou clube. Se o clube ganhar **tópicos permanentes e perder o
fim**, virou fórum.

### Quem cria modera o conteúdo — mas não pode demolir a casa

O pedido era *"quem criou o fórum tem que poder excluir em algum momento isso"*.
A janela A concordou com metade e o Matheus aceitou a divisão:

- **Moderar conteúdo, sem ressalva:** esconder resposta, esconder tópico, fixar
  tópico, **cobrir como spoiler**. Tudo reversível — moderação errada acontece, e
  sem volta ela custa uma pessoa.
- **Apagar o fórum, só enquanto ele for só seu** (nenhum tópico de outra pessoa
  dentro). Depois disso, apagar destruiria o trabalho dos outros. **É o oposto do
  clube**, onde apagar é legítimo (§4.40) — porque o clube tem 8 pessoas e
  **acaba de qualquer jeito** quando o ciclo fecha.

Construído em `lib/grupos.ts` (moderação em `localStorage`, ids escondidos em vez
de exclusão real), `pages/Grupo.tsx` e `pages/Topico.tsx`.

- **Cobrir vem antes de esconder na ordem dos botões:** é o que mais se usa —
  quase ninguém posta spoiler de má-fé, posta distraído, e esconder a mensagem
  inteira por isso é desproporcional.
- **Escondido some para todo mundo**, inclusive para o dono; ele devolve pela
  caixa "Escondidos por você" no topo. Deixar na lista com um véu confundiria
  quem lê.
- **`suspense-misterio` passou a ser seu**, pelo mesmo motivo do clube "Suspense
  de Domingo": fórum recém-criado nasce vazio, e a moderação nasceria botão morto.
- **Dois defeitos de layout achados testando:** os botões de moderação em fluxo
  normal caíam **entre** os cartões, parecendo do tópico de baixo (viraram
  absolutos no canto); e a folga do título (`pr-6`) não cabia dois ícones, então
  o texto passava por baixo do alfinete.

### A troca de nome, feita

**Na tela é "Fórum"; no código continua `grupo`.** A troca cobriu o rótulo da aba
da Comunidade, o título das telas, os botões ("Criar fórum", "Apagar este
fórum"), os avisos e **a rota** (`/grupo/:id` → `/forum/:id`).

**Os identificadores ficaram como estavam, e isso é decisão, não preguiça:**
renomeá-los mexeria nas chaves do `localStorage` de quem já usa o app — jogando
fora fóruns, participações e tópicos guardados — sem mudar nada para quem vê. O
cabeçalho de `lib/grupos.ts` explica a diferença, para ninguém tropeçar nela
depois.

**Cuidado que a troca exigiu:** "grupo" aparece em vários outros lugares do
código com **outro sentido** — o grupo de membros do clube ("a régua do grupo"),
o agrupamento de conquistas, os grupos de perguntas da Ajuda. Uma substituição
cega teria renomeado tudo isso. A troca foi feita string por string, só nos três
arquivos do fórum.

**Bônus:** consertou o "Esso grupo não existe" (erro de digitação) para "Este
fórum não existe".

---

## 4.45 O trecho vira uma peça que circula (28/07)

**Construído.** O Matheus pediu que desse para citar um trecho **também no fórum
e no clube**, e deixou a forma comigo: *"como é que a gente vai fazer para a
pessoa conseguir pegar esse trecho e mencionar nesse campo? Aí é com você"*.

### A decisão: cortar se faz ouvindo, anexar se faz escrevendo

São **dois momentos diferentes e distantes**, e a ferramenta tem de respeitar
isso. Ninguém corta um trecho de dentro de uma caixa de texto — ali estaria
chutando o minuto sem ouvir, e o corte "exato" que a §4.43 construiu perderia o
sentido. O momento em que se **quer** citar é ouvindo ("essa frase!"); o momento
em que se **escreve** é depois, em outra tela.

Então o trecho passa a ser uma **coisa guardada**:

1. No player, o cortador ganhou **"Guardar para usar em outra conversa"**.
2. Em qualquer campo de escrever — mural do clube, resposta do fórum — um botão
   **📎 Trecho** abre os seus guardados e anexa com um toque.

**A aba "Guardados" da maquete da janela B sai de graça desta lista** — era a
mesma ideia, chegando pelos dois lados.

### O que isso implica, e por que vale

- **Um mecanismo, quatro destinos.** A mesma `Citacao` vale na sala do livro, no
  mural do clube, no fórum e (quando existir) no feed. O cartão `CitacaoDeAudio`
  é o mesmo em todos — o que você vê escolhendo é o que os outros veem publicado.
  É a lição que a §4.40 cobrou caro: escrever **um** mecanismo, não quatro
  parecidos.
- **Mensagem só com trecho vale.** Às vezes o trecho já é a resposta; exigir texto
  junto seria burocracia.
- **Guardar o mesmo corte duas vezes não duplica.** Quem toca "guardar" de novo
  quer garantir que está lá, não quer uma cópia.
- **O estado vazio ensina onde se corta**, com o caminho até lá — um "você não
  tem trechos" seco seria a tela morta que a 4.23 mandou varrer.

**Testado ponta a ponta:** cortei 40s em *A Paciente Silenciosa* no player,
guardei, abri um tópico do fórum, anexei pelo clipe e publiquei — o cartão do
trecho aparece na resposta, com capa, carimbo e o botão que toca só ele.

### Guardar num toque: o caminho era longo demais

O Matheus viu logo depois: *"a pessoa vai ter que citar o trecho e só depois abre
a parte onde ela pode guardar… a gente poderia colocar um caminho mais fácil"*.
Ele estava certo — eram **três toques** (Conversa → Citar o trecho → Guardar), e
guardar tinha virado **sub-ação de comentar** quando na verdade é irmã de marcar
uma nota.

**O conserto tem dois princípios:**

- **Padrão primeiro, ajuste depois.** Um toque guarda **40 segundos a partir de
  onde você está**, e o aviso oferece ajustar. Abrir o cortador para só então
  guardar era pedágio; quem quer o corte exato ainda o tem, agora como
  refinamento e não como caminho obrigatório.
- **O botão fica na linha dos tempos**, sob a barra de progresso, porque o
  assunto dele é **posição** — é onde o olho já está quando se pensa "esse pedaço
  aqui". **Não deu para pôr na barra de ações:** ela já tem seis alvos e o código
  abrevia "Velocidade" para "Veloc." por causa disso (§4.40); um sétimo truncaria
  os outros.

**Efeito colateral, e ele é bom:** o botão tomou o lugar de "36m 35s restantes",
que dizia **exatamente o mesmo** que o "-36:32" logo ao lado, em outro formato. A
troca eliminou uma redundância que a régua do próprio app condena — e se o rótulo
por extenso fizer falta, voltar é uma linha.

---

## 4.47 Os trechos ganharam casa — e "40s" era o nome errado (28/07)

Duas correções pedidas pelo Matheus depois de usar, e as duas procedem.

### "Não tô vendo pra onde é que eles estão indo"

**Defeito, não gosto.** Dava para guardar um trecho e não havia **nenhuma tela**
onde vê-los: o único caminho era o botão de clipe dentro de um campo de escrever.
Guardar sem ter onde encontrar é beco sem saída — exatamente o que a 4.23 manda
varrer, e eu deixei passar ao construir a §4.45.

**Os trechos foram morar em `/bookmarks` ("Minhas notas"), numa aba própria**, e
não numa tela nova: são a mesma família — coisas que você marcou **ouvindo**. A
diferença entre as duas abas é o destino, e ela vale como definição: **a nota
guarda um ponto para você; o trecho guarda um pedaço para mostrar aos outros.**

- As abas **só aparecem quando há trechos**: quem nunca cortou um não precisa
  escolher entre duas coisas sendo que uma está vazia.
- O aviso ao guardar passou a **dizer onde foi parar** e a trazer um botão
  **"Ver"** que leva lá. Antes ele só confirmava, o que era metade da informação.

**Colisão de vocabulário, resolvida no caminho:** a tela de notas chamava cada
marcação de "trecho" ("3 trechos guardados em 2 títulos"), e a caixa de nota
perguntava "o que você quer lembrar deste trecho?". Com o trecho de áudio
existindo, a mesma palavra passou a significar duas coisas **na mesma tela**.
Marcação virou "marcação"; o ponto virou "ponto"; **trecho ficou reservado** para
o pedaço de áudio.

### "Guardar 40s" nomeia o teto, não a coisa

Palavras dele: *"quarenta segundos, na verdade, é o máximo… essa nomenclatura
poderia ser mudada"*. Certo — o rótulo anunciava um **limite** como se fosse o
objeto. Virou **"Guardar trecho"**. O aviso continua dizendo a duração real, que
é onde essa informação serve: depois de guardar, não antes.

---

## 4.48 Trecho não é nota: cada um com seu endereço (28/07)

**A decisão anterior durou um dia, e o Matheus derrubou com razão.** Na §4.47 eu
tinha posto os trechos como **aba** de "Minhas notas", com o argumento de que
nascem do mesmo gesto: ouvindo, você marca. Ele desconfiou — *"acho que talvez
os meus trechos deviam estar separados das minhas notas"* — e o argumento dele
vence. Agora são **`/trechos`**, tela própria.

**Por que separar (o raciocínio, para ninguém refazer):**

1. **O dono é outro.** A nota é privada: guarda um ponto para *você* voltar. O
   trecho é a única coisa que o app guarda **para os outros** — existe para ser
   anexado numa conversa. Juntar por origem ("os dois nascem ouvindo") é agrupar
   pelo critério errado; o que manda é o destino.
2. **A forma é outra, e isso apareceu no código.** As notas se organizam **por
   livro** (é ao livro que você volta); o trecho circula solto e chega no meio de
   assunto alheio, por isso o cartão carrega a própria capa. As duas abas **não
   conseguiam compartilhar layout** — quando duas abas da mesma tela não têm a
   mesma forma, em geral não têm a mesma natureza.
3. **A palavra colidiu.** Para caberem juntas, eu tive de trocar "trecho" por
   "marcação" *dentro* das notas (a própria §4.47 registra isso como conserto).
   **Renomear para caber é sintoma:** era remendo num encaixe errado.

**O que mudou na prática:** a aba saiu de `/bookmarks`; nasceu `pages/Trechos.tsx`;
o painel **Você** ganhou a linha "Meus trechos" (com tesoura, contador, e **só
quando existe algum**); o aviso ao guardar aponta para `/trechos`. A instrução de
**onde se corta** virou um componente único (`ComoCortarUmTrecho`), porque vivia
duplicada na folha de anexar e ia envelhecer torto num dos dois lugares.

**A ordem aqui é a mais recente primeiro, e não por livro:** isto é uma
prancheta, não um arquivo — o que você acabou de cortar é o que vai anexar. É a
mesma ordem da folha de anexar, de propósito: o que você vê aqui é o que vai ver
na hora de escolher.

### O ícone de aspas saiu do cartão de citação

No mesmo dia, olhando a lista: *"o ícone de conversa está muito solto e não dá
para entender o que ele é exatamente"*. Era o `Quote` (aspas) antes de
"TRECHO · 40S". Dois defeitos somados: a **10px** ele vira dois riscos laranja
sem forma legível, e aspas dizem **citação de texto** quando a coisa é áudio.
Removido — o rótulo já nomeia, a onda ao lado já diz "isto é som", e um terceiro
sinal para o mesmo recado é o ruído que a 4.23 manda varrer. **Não** foi
substituído por um ícone de áudio, pelo mesmo motivo.

---

## 4.49 O trecho ganha nota, e o corte ganha volta (28/07)

Dois pedidos do Matheus depois de usar a tela nova. **O segundo é dívida
minha:** o comentário do código, desde a §4.46, dizia que *"o toque guarda 40
segundos na hora **e o aviso oferece ajustar**"* — e a segunda metade nunca foi
implementada. O aviso só tinha "Ver". Ele cobrou pelo que faltava: *"ela poderia
ter, como tem aqui em conversas, a opção de selecionar a parte que ela quer
gravar; ali não dá essa opção"*.

### A nota do trecho é privada — e isso é decisão, não detalhe

Pedido: *"era para a pessoa poder escrever uma coisa no trecho que ela salvou,
ainda que seja uma coisa pequena"*. Cabem 140 caracteres, e ela responde **"por
que guardei isto"** — o que se perde entre cortar (ouvindo) e usar (dias depois).

**Ela não vai junto quando o trecho é publicado.** As duas leituras possíveis
eram: (a) lembrete só seu; (b) legenda que acompanha o trecho na conversa. Ficou
(a), por dois motivos: no mural, no fórum e na sala **você já escreve um texto**
— a legenda seria um segundo campo dizendo a mesma coisa, e ninguém saberia qual
dos dois as pessoas leem; e uma nota escrita para si mesma ("ver se combina com
o que a Bia falou") vira constrangimento se publicar sozinha.

Garantido **por construção**, não por disciplina: `comoCitacao()` devolve só a
`Citacao`, sem a nota, e é a `Citacao` que viaja. Nenhuma tela consegue publicar
a nota por descuido. Na interface isso é dito na hora — *"Só você vê. Não vai
junto quando você anexa numa conversa"* — em vez de virar surpresa depois.

**Ficou de fora, e é candidata boa:** oferecer a nota como **texto sugerido** ao
anexar (o campo vazio se oferece para começar com ela). Mexeria em três telas de
escrita ao mesmo tempo; melhor depois de ver a nota em uso.

### Guardar em um toque **e** poder corrigir

Não desfiz a §4.46 — foi ele mesmo quem reclamou dos três toques. O que faltava
era a volta. Agora existe a folha **"Ajustar o trecho"** (`EditarTrecho`), com o
cortador de duas pontas e o campo de nota **juntos**: são as duas coisas que se
quer fazer depois de guardar, e no mesmo instante.

Ela abre por **dois caminhos**, e o segundo nasceu de um defeito achado testando:

1. o botão **"Ajustar"** no aviso, logo depois de guardar;
2. **o próprio botão da linha do tempo, que vira "Ajustar o corte" por 8
   segundos.**

O caminho 2 existe porque o 1 é frágil: **o aviso some sozinho em cinco
segundos**. No teste, o clique chegou depois e não abriu nada — e "escolher a
parte", que é justamente o pedido, não pode depender de reagir a tempo. O
segundo toque agora cai **no mesmo lugar do primeiro**, que é onde o dedo já
está. É o mesmo raciocínio que já tinha posto a confirmação de "Marcar" dentro
do próprio botão (`BarraDeAcoesDoPlayer`), em vez de confiar no aviso.

`ajustarTrecho()` corrige **no lugar**, sem criar um segundo cartão; se o corte
novo bater exatamente num trecho que já existe, o duplicado sai.

---

## 4.50 Modo carro sai da barra e vai para o "…" (28/07)

Pedido do Matheus: *"vamos tirar ele daqui da parte de baixo, para não ficar com
muitas informações aqui, e a gente joga ele nos três pontinhos"*. Feito, e a
barra estava mesmo apertada — seis alvos, com "Velocidade" já abreviado para
"Veloc." por falta de espaço desde que a Conversa entrou (§4.39).

**O critério que ficou registrado: frequência, não importância.** O modo carro é
o item mais "importante" da barra em termos de segurança, e mesmo assim é o certo
a sair — porque se liga **uma vez, antes de dirigir**, e não durante. Marcar,
Conversa e Notas são tocadas com o livro andando, e por isso ficam à mão. Ação
rara mora no menu; ação corrente mora na barra.

Fica em **primeiro** no menu, acima de "Marcar como concluído": é o único item
dali que muda o modo de uso na hora — os outros levam a outra tela ou marcam um
estado.

**Medido depois de tirar:** sobraram 5 alvos de 67px (com "Notas") e nenhum
rótulo trunca. **"Veloc." continua abreviado**, e não é esquecimento: "VELOCIDADE"
em maiúsculas ocupa quase os 67px inteiros, e num aparelho estreito (320px) o
alvo cai para ~60 e volta a cortar.

---

## 4.51 "Ver a conversa" levava à sinopse (28/07)

O Matheus, no player: *"quando você coloca 'ver a conversa do livro inteiro',
ela te leva para a página principal do livro — a gente já tinha falado que a
conversa tinha que ter uma janela própria"*. Tinha mesmo: a §4.41 criou
`/book/:id/conversa` justamente porque **porta não pode mentir**, e o link do
player continuava apontando para `/book/:id`, a ficha. Quem tocava em "ver a
conversa" caía na sinopse e tinha de rolar até achar a sala.

**Não era um esquecimento anônimo:** a janela B deixou o pedido por escrito no
quadro de `COORDENACAO.md` (*"segue de pé o pedido à A: `ConversaDoTrecho.tsx:168`
→ apontar para `/book/:id/conversa`"*) e ele ficou parado até o Matheus notar
sozinho. **Lição para o quadro:** recado de uma janela para a outra só vale se
alguém o transformar em tarefa; enterrado numa célula de tabela, ele envelhece.

**O mesmo defeito estava em mais um lugar, e foi junto:** o aviso "responderam
você" (`Notifications`) também abria a ficha. Agora **avisos de resposta abrem a
conversa**; os avisos do sistema (o livro pedido ficou pronto, o lançamento do
autor) continuam abrindo a ficha, porque falam do **título**, não da conversa.

**Conferido e mantido como está:** no mural da Comunidade, o nome do livro dentro
da frase ("Fulano avaliou *X*") continua levando à ficha — ali o link é o
**título**, e mandá-lo para a conversa é que seria mentira.

---

## 4.52 Um pixel, um dono: as marcas saem de cima da barra (28/07)

Problema trazido pelo Matheus, e ele é de ergonomia, não de gosto: *"quando você
clica nessa bolinha… é muito fácil, em vez de clicar no trecho, ela acabar
clicando e voltar o player, e ela não sabe onde ela está. É muito pequeno e o
dedo da pessoa é muito grande."*

**A medição, antes da solução.** No navegador: a marca tinha **5×5 px em y=267**;
a alça do slider, **17×17 px em y=266** (na moldura da prévia; num celular real,
20px). Ou seja, a marca estava **dentro** da área de arraste — apesar de o
comentário do componente afirmar, desde a §4.39, que ficava "acima da trilha,
para não roubar o arraste". Um dedo cobre ~34px: **sete vezes o alvo**.

E errar ali não é errar para o vazio: **o toque vira arraste e o áudio pula**.
O custo do erro é perder o lugar onde se estava — o que ele descreveu.

### A regra que ficou: nada que se toca mora em cima de um controle de arrastar

**As marcas ganharam trilho próprio, abaixo da barra.** Alvo de **44×28 px**
(era 5×5), com o pontinho como desenho e a caixa inteira como área de toque —
ali embaixo nada mais disputa o espaço, então área generosa não atrapalha
ninguém. Entre o trilho e a barra ficam 8px livres: medido, o `space-y-2` do
player dava **zero** de folga, porque a alça de 20px transborda 8px para baixo
da trilha e encostava na borda de cima do novo alvo.

**Marcas coladas viram um alvo só, com o número** (`💬 2`). Duas bolinhas a
menos de 44px o dedo não separa mesmo — fingir que separa é o defeito de novo,
só que menor. Liberadas e adiante são agrupadas **em separado**: um alvo misto
teria de decidir se abre ou não, e o número mentiria sobre quanta conversa se
pode ler agora.

### A rede de segurança: "Voltar para 12:31"

A separação reduz o erro, mas a barra continua sendo o alvo mais fácil de
acertar sem querer. Então o **custo** do erro também foi atacado: um salto de
mais de 15 segundos faz aparecer, por 8 segundos, um botão branco largo com o
ponto de onde você saiu. Abaixo de 15s é ajuste fino de quem quis mover, e um
aviso ali só atrapalharia.

Ele fica **acima** da barra, e não abaixo: embaixo está o trilho da conversa, e
cobrir alvos de toque por 8 segundos seria trocar um estorvo por outro — ainda
mais para quem acabou de pular e talvez queira justamente tocar numa marca.

**Verificado por medição** (a captura de tela da extensão parou de funcionar no
meio): alvos de 38×24 na moldura (≙ 44×28 no aparelho), 7px de folga para a
alça, duas falas coladas agrupadas em "2", e o toque no grupo levando o áudio a
`cap. 1 · 20:00` com a conversa daquele ponto aberta.

---

## 4.53 A Comunidade ganha um objeto: o post com coisa dentro (29/07)

**Nada construído — isto é decisão de rumo, e o rumo mudou duas vezes na mesma
conversa.** Registrado por isso: a segunda virada foi do Matheus, contra a minha
tese, e ele estava certo.

### O diagnóstico que continua valendo

Onze maquetes de Comunidade em `client/public/`, nenhuma aceita. O Matheus
descreveu o padrão sem nomear: *"o que me agrada é uma coisa solta, outra coisa
solta… mas o todo, o conjunto, não me agrada"*.

**A causa: a Comunidade era a única tela do app sem objeto próprio.** Toda outra
tela é *sobre* alguma coisa — um livro, um clube, um trecho, uma pessoa. A
Comunidade era "o resto que é social": definida **por exclusão**. E conteúdo
definido por exclusão não tem todo possível — qualquer coisa cabe, nada exige
estar lá. Onze desenhos diferentes falharam no mesmo ponto porque o layout nunca
foi o problema.

### A saída que eu propus (e que ficou obsoleta no mesmo dia)

Encolher a aba até sobrar só **lugares**: clubes e fóruns. Duas variantes na
folha `_comunidade-A-vs-B.html` — **A**, a aba vira "Rodas"; **B**, a aba morre e
sobra "Clubes" no menu, com o fórum indo para o Catálogo. **Nenhuma das duas foi
escolhida**, e a folha perdeu a razão de existir quando apareceu a saída melhor.
Fica registrada porque o raciocínio dela (o que morre, o que custa) segue válido
se um dia a ideia abaixo não vingar.

### A saída do Matheus: dar um objeto, em vez de tirar

**O post não é "post de rede social" — é uma fala com um objeto do AllBook
dentro:** a capa grande e clicável de um livro, um trecho de 40s que toca, um
clube com prazo e vagas para entrar.

É por isso que ele funciona onde os onze feeds falharam: **aqueles eram sobre
pessoas** ("fulano avaliou", "fulano está ouvindo") — texto sem corpo. Este é
**o livro circulando pela voz das pessoas**, a mesma forma das peças que
sobreviveram (conversa presa ao minuto, trecho que circula, clube com prazo).

**E resolve a queixa do "muito cru", que era o sintoma mais repetido:** o que dá
corpo visual ao post não é foto de gente, **é a capa**. Cru era o texto solto.

### Feed × Seguindo: são duas coisas, e a diferença é a natureza do conteúdo

Eu tinha errado aqui, tratando as duas como a mesma lista com filtro diferente. O
Matheus corrigiu:

- **Feed** = o que as pessoas **escreveram** (posts).
- **Seguindo** = o que as pessoas **fizeram** — está ouvindo, comentou,
  recomendou, avaliou, entrou num clube. *"Se a Carla está ouvindo Admirável
  Mundo Novo, ela não vai pro feed."*

A separação resolve, por outro caminho, o problema que eu tinha levantado:
**atividade automática nunca tem corpo** (é sempre uma linha de texto), e por
isso não pode disputar espaço com um post que traz capa. A solução dele é melhor
que a minha (agrupar a atividade numa faixa fina dentro do feed): ela ganha o
lugar onde é o **conteúdo principal**, e não penduricalho. O formato de hoje
continua, com mais ênfase na capa.

**Decidido pelo Matheus na mesma conversa** — a regra é assimétrica, e é ela que
dá sentido a seguir alguém:

> **O post aparece nos dois. A atividade, só no Seguindo.**
> *"Atividade é uma coisa que você vai ter que realmente seguir aquela pessoa
> para ver."*

Ou seja: **o que você escreve é público** (vai para a comunidade inteira e
também para quem te segue); **o que você faz é para quem escolheu te
acompanhar**. Seguir deixa de ser um filtro de volume e passa a **destravar
conteúdo que não existe em outro lugar** — é o que faz o botão "seguir" valer
alguma coisa. E é também a resposta de privacidade: ninguém vê o que você está
ouvindo por acaso, passando pelo feed.

Consequência de desenho: no Seguindo convivem dois formatos — **atividade em
linha, com capinha**, e **post com o cartão inteiro**.

### Imagem enviada pelo usuário: decisão tomada, com o mecanismo nomeado

Eu levantei o custo (servidor, armazenamento, moderação de imagem). **O Matheus
decidiu que o app pago já é o filtro**, e o argumento é bom o bastante para ficar
escrito: *"a pessoa pagou para estar ali, e ela não quer arriscar perder a conta
dela"*.

**O mecanismo tem nome: custo de reentrada.** O que segura não é o preço, é o
fato de que ser expulso queima dinheiro e voltar exige pagar de novo. É o que faz
comunidade paga ser limpa e rede aberta não ser — e é mais forte que qualquer
filtro automático que escreveríamos.

Três precisões que ficam como condições, não como objeções:

1. **Pagamento pune, não previne** — quem viu, viu. Continuam necessários
   **denúncia e "esconder" rápidos**, que já existem no clube e no fórum. Com o
   pagamento, esses bastam; sem ele, não bastariam.
2. **A punição precisa ser real** para o cálculo funcionar: se ninguém nunca
   perde a conta, o filtro é teórico. Regra de conta, para quando houver servidor
   (ver `docs/BANCO-DE-DADOS.md`).
3. **O post é a única parte do app sem dono.** Clube tem moderador, fórum tem
   criador — o feed é de todos, ou seja, de ninguém. **Quem julga a denúncia
   ali?** Decisão em aberto, sem urgência.

### Desenho: três correções minhas, aceitas ou pendentes

- **O hub de quadradinhos custa um toque e não informa nada.** Tela só de ícones
  é menu. Como o próprio Matheus disse que o post é *o principal*, a
  recomendação é a Comunidade **abrir direto no feed**, com clubes e fóruns como
  atalhos no topo.
- **Uma fileira de pílulas carrega um critério só.** Apareceu na maquete: `Tudo ·
  Meus · Clubes · Fóruns` misturava escopo com tipo — "meus fóruns" era
  impossível de pedir. Escopo ("de quem é") vira **ordem**; estado ("estreando")
  vira **seção**; a pílula fica só com o tipo.
- **O risco que sobra:** clube funciona com 8 pessoas, fórum com 30, **feed
  precisa de centenas**. Se o app abrir com pouca gente, o feed é a única tela
  que parece abandonada — e é a primeira que se quer mostrar. Mitigação
  registrada: enquanto houver pouca gente, o que enche a tela é o que o **app
  produz** (trechos guardados, clubes estreando, conversa quente de um livro). O
  feed começa cheio de livro e vai ficando cheio de gente.

**Próximo passo combinado:** desenhar **só o cartão do post**, nas três formas
(com livro, com trecho, com clube), antes de qualquer tela — se o cartão não sai
do cru, a tela em volta não salva.

---

## 4.54 Conta privada: a tranca é sobre o que o app registra, não sobre o que você diz (29/07)

**Nada construído — alinhamento antes de codar, a pedido do Matheus.** Segue a
§4.53, e é a consequência natural dela.

O pedido: *"eu sou uma pessoa que talvez não queira que as pessoas vejam o que eu
estou fazendo… se ele é privado, eu tenho que dizer se aceito ou não quem está me
seguindo, como é hoje no Instagram"*.

### A decisão, e o princípio por trás

|  | Perfil público | Perfil privado |
| --- | --- | --- |
| **Post** (o que escrevi) | vai ao feed geral | **vai ao feed geral, igual** |
| **Atividade** (o que fiz) | só seguidores | só seguidores **aprovados** |
| **Virar seguidor** | automático | **você aprova** |

Palavras do Matheus: *"se eu escrevo para geral, eu já escolhi falar para a
comunidade… o que ele não vai mostrar são as minhas atividades dentro do
aplicativo"*.

**O princípio: escrever já é o ato de tornar público.** A tranca não protege o
que você **diz** — protege o que o app **registra sozinho**: que você está no
capítulo 3, que entrou num clube, que avaliou um livro. É a mesma linha que
separa Feed de Seguindo na §4.53, agora aplicada à privacidade.

**Rejeitado, com motivo:** o modelo Instagram puro (privado esconde tudo,
inclusive os posts). Duas razões — o feed geral perderia gente justamente quando
mais precisa de conteúdo; e a pessoa privada ficaria sem entender por que ninguém
a lê, tendo escolhido publicar.

### O que isso simplifica

**"Privado" deixa de ser um modo do app e vira uma pergunta:** *quem vira seu
seguidor — qualquer um, ou só quem você aprovar?* Como a atividade **já** é
restrita a seguidores nos dois casos (§4.53), não existem duas versões de tela
nem dois cálculos de visibilidade. É um interruptor e uma fila de pedidos.

### Onde mora: no painel que já existe

**Não se cria aba de configuração.** O painel **"Você"** já tem a seção
**Privacidade**, com "Mostrar o que estou ouvindo" e "Mostrar meus clubes";
**"Conta privada"** entra ali como terceiro item, e a fila de pedidos aparece
logo abaixo quando está ligada. Dar tela própria a isso seria repetir o erro que
a §4.53 acabou de condenar na Comunidade: coisa nova ganhando lugar próprio em
vez de entrar onde pertence.

### O pacote completo tem três peças, e duas só doem depois

1. **Aprovar ou recusar** quem pede para seguir, com aviso no sino.
2. **Remover um seguidor** já aceito — sem isso, um "sim" dado às pressas é para
   sempre.
3. **Fechar a porta depois:** ao virar privado, quem já seguia continua seguindo?
   (O Instagram mantém.) Se for para cortar, precisa de "remover todos".

**Pré-requisito duro:** isto é **servidor**. Pedido pendente, aprovação e
notificação não funcionam só no navegador — é a **primeira peça da Comunidade que
exige o backend** para valer de verdade. Dá para maquetar antes; não dá para
lançar antes. Ver `docs/BANCO-DE-DADOS.md`.

### Duas escolhas menores

- **O perfil nasce público** — decidido pelo Matheus na mesma conversa: *"o
  perfil dela já nasce público, e ela tem a opção de privar aquilo caso queira"*.
  No começo o app precisa de circulação, e quem quer se fechar acha o
  interruptor.
- **Quem é privado aparece nas sugestões de gente?** Recomendação registrada:
  **sim, com o cadeado** — senão a pessoa privada fica invisível e nunca recebe
  pedido nenhum. Ainda não decidido, e só terá efeito com o servidor.

### Construído em 29/07 (maquete), no mesmo dia

O Matheus mandou construir já e **deixar o rastro para o backend**: *"você cria
isso já… e registra dizendo: futuramente você vai ter que fazer isso do backend,
para que quando for começar no backend eles vejam no roteiro que aquilo precisa
ser feito"*.

- **`lib/seguidores.ts`** — a outra metade de `following.ts`: quem segue **você**.
  Seguidores e pedidos vêm do esqueleto (`community.ts`), porque sem servidor
  ninguém pode pedir de verdade; **o que é fingido é a origem, não o efeito** —
  aceitar, recusar e remover ficam gravados e valem dentro da maquete.
- **`/seguidores`** ("Quem te segue") — lista com **remover** ao lado de cada
  nome, e a aba **Pedidos** que só existe com a conta privada ligada (fila vazia
  numa conta pública prometeria um controle que não existe).
- **`Você › Privacidade`** ganhou **Conta privada**, ao lado dos dois
  interruptores que já havia — sem tela de configuração nova —, e a linha **Quem
  te segue** com o número de pedidos pendentes.
- **O contrato do servidor foi escrito em `docs/BANCO-DE-DADOS.md`, seção 3.1**
  — inclusive as promessas que a interface faz e que o backend **tem** de honrar:
  recusar e remover são silenciosos; ligar a tranca não expulsa quem já seguia;
  a visibilidade da atividade é filtrada **no servidor**, nunca na tela.

**Defeito encontrado testando, e consertado:** respondido o último pedido, as
abas somem (não há mais escolha) mas o conteúdo continuava filtrado por
"pedidos" — a tela dizia *"Ninguém ainda"* com quatro seguidores logo abaixo.
Agora a aba volta sozinha para a lista quando a fila esvazia.

---

## 4.55 Privacidade vira tela, seguidores vão para o perfil, e o pedido chega no sino (29/07)

Quatro correções do Matheus depois de usar o que a §4.54 construiu. **Todas
procedem, e a segunda é uma inconsistência que eu mesmo criei.**

### 1. "Como é que eu vejo e aceito o pedido?"

Não havia caminho: a fila só existia dentro de `/seguidores`, e nada avisava.
Agora o pedido é **um aviso no sino**, e o cartão traz **os dois botões**
(aceitar e recusar) — um aviso que só diz "fulano quer te seguir" e obriga a
caçar outra tela é meia notificação. Aceitar dali some com o aviso e baixa o
contador do sino na hora (medido: 6 → 5).

**Detalhe de implementação que evita problema:** o pedido é somado ao contador
**no TopNav**, e não dentro de `unreadNotificationCount()`. Assim
`seguidores.ts` e `notifications.ts` continuam sem saber uma da outra — quem
junta é a tela, e não há import circular.

### 2. A privacidade estava expandida no painel; virou uma linha

Palavras dele: *"essa aba de privacidade está muito grande… nas outras,
notificações e configurações, ela não está expandida"*. Ele está certo, e o
defeito é meu: **todas as outras entradas do painel são uma linha com seta** que
abre outra tela — só a privacidade estava aberta ali no meio, empurrando o resto
para baixo. Agora é `/privacidade`, e no painel sobra a linha (com o número de
pedidos como etiqueta, porque é a única pendência do painel que espera resposta).

### 3. Seguidores são assunto de perfil, não de configuração

*"Você deveria ver, clicando no seu perfil, quem são as pessoas que te seguem —
não faz sentido nenhum [estar na privacidade]."* Correto. O contador entrou **na
linha de números do perfil** (horas · títulos · recomendações · **seguidores**),
e é o único deles que leva a algum lugar. Pedido pendente aparece como `+1` em
laranja ao lado.

### 4. Mais controle sobre a vitrine — e um que ele mesmo descartou

Novo interruptor **"O que eu disse"** (comentários e posts reunidos na sua
página). Tira da **vitrine**; dentro do livro e do clube as falas continuam onde
foram ditas — o mesmo contrato de "mostrar meus clubes".

**"O que eu recomendo" NÃO ganhou interruptor, por decisão dele:** *"a parte do
recomenda a gente pode excluir, porque já que ela está recomendando, ela quer que
as pessoas vejam"*. Recomendar é um ato deliberadamente público; um botão para
escondê-lo desfaria o gesto. **Registrado para ninguém propor de novo.**

A tela `/privacidade` fica com dois títulos, e a divisão é o princípio da §4.54
em forma de layout: **"Quem pode te seguir"** (a conta privada — governa *quem*
vê) e **"O que aparece na sua página"** (ouvindo · o que eu disse · meus clubes —
governam *o quê*).

---

## 4.56 O perfil precisa girar em torno dos posts (29/07) — decidido, não construído

**Guardado aqui a pedido do Matheus, para entrar junto com a reformulação da
Comunidade da §4.53.** Ele foi explícito: *"essa parte você não coloca agora,
porque vai entrar naquela questão da reformulação da comunidade — você só deixa
registrado no roteiro"*.

**O diagnóstico dele:** *"os posts que a pessoa escreveu têm que estar aqui no
perfil, e não estão hoje. Isso é um erro gravíssimo."* Hoje a página mostra as
falas dentro de um bloco "O que eu disse" que mistura comentário de livro com
post do mural, limitado a três — não existe "os posts dela".

**O que fica decidido para quando o post existir:**

1. **A prioridade do perfil é o post.** Quem abre a página de alguém quer ler o
   que a pessoa escreveu — é o conteúdo, e vem primeiro.
2. **Recomendações, comentários e clubes saem da rolagem e viram ícones no
   topo**, cada um abrindo a sua página: *"talvez a gente poderia colocar um
   ícone na parte superior onde a pessoa pudesse ver o que essa pessoa
   recomenda… você abre ali e leva para uma página"*. Isso resolve o mesmo
   defeito da §4.55 (bloco expandido onde bastava uma porta), agora na vitrine.
3. **Publicar direto do perfil.** *"Ela não precisaria necessariamente clicar no
   ícone de comunidade e colocar os posts; ela pode simplesmente ir no perfil
   dela e publicar aqui."* O post nasce no perfil e **vai para o feed geral** —
   coerente com a regra assimétrica da §4.53 (o que se escreve é público).

**Por que não foi construído hoje:** o post ainda não existe no formato novo (a
fala com objeto dentro — capa grande, trecho, clube). Reorganizar o perfil em
torno de uma peça que ainda vai mudar de forma é construir para refazer.

---

## 4.57 O Clube reorganizado: quatro modos desenhados, decisão em aberto (29/07)

**O pedido do Matheus:** *"a página do Clube de Leitura… ela vai ter muitos livros
e muitos clubes, e a forma como está não tá bem organizada"*. Pediu **pelo menos
três propostas clicáveis** para escolher — e **sem tocar no código** antes da
escolha.

**Onde ver:** `client/public/_propostas-clube.html` (fora do git, temporária) —
cinco versões navegáveis: *como está hoje* + as quatro propostas, cada uma com a
**lista de clubes** e a **tela de dentro do clube**, mais um modo "as 5 lado a
lado".

### O que foi medido no app antes de desenhar

Isto é apuração, não opinião — vale mesmo que nenhuma das propostas vingue:

1. **A tela de um clube tem ~4,5 telas de rolagem**, com cinco assuntos empilhados
   de peso igual: ciclo, rodada, mural, votação, estante.
2. **A conversa fica no meio da pilha — e é ela que cresce sem fim.** Hoje o mural
   do Clube do Mistério tem 4 mensagens, e é *só por isso* que a votação e a
   estante ainda são alcançáveis. Com 200 mensagens elas ficam a dezenas de
   rolagens. **É o defeito de escala mais grave, e piora sozinho com o uso.**
3. **3 das 4 falas do mural apareceram como placa de spoiler**, não como texto: a
   conversa vira pilha de aviso cinza. Quanto mais gente adiantada, pior.
4. **"Seus clubes · 7" mostra 3**, e todos os cartões têm o mesmo peso — nada diz
   **qual precisa de você**, que é a pergunta de quem está em sete.
5. **A memória do clube não tem endereço:** a estante leva à ficha do livro, então
   **a conversa daquele ciclo se perde** quando o livro muda.

### As quatro filosofias (e o preço de cada uma)

- **A · O fio da conversa** — o clube é uma conversa; o resto é estado numa barra
  fina no topo. Lista vira caixa de entrada com não lidas. *Preço:* perde a cara
  de livro (vira mensageiro), votação e estante a dois toques — e, achado ao ver a
  maquete de pé, **a prévia da última fala vaza spoiler na própria lista**.
- **B · O clube tem cômodos** — abas *Conversa · Rodada · Ritmo · Estante*, com
  bolinha no que espera por você. *Preço:* o que está atrás de aba deixa de ser
  visto; mais toques no dia a dia.
- **C · A linha do ciclo** — o livro dá a estrutura: a conversa mora **em cada
  trecho combinado**, e o que está à frente vem fechado. **Troca a placa de
  spoiler por estrutura.** *Preço:* com pouca gente cada trecho fica vazio; exige
  ritmo parecido; é a mais cara (mexe no modelo de dados da conversa); conversa
  solta não tem onde morar.
- **D · O painel** — abre com **uma** coisa a fazer; o resto em gavetas; lista
  agrupada por urgência. *Preço:* fica administrativo — clube é lazer, e abrir
  numa lista de pendências parece cobrança.

### A recomendação registrada (não é decisão)

**Nenhuma das quatro inteira.** A **B** resolve o defeito mais grave e é a mais
barata (o conteúdo já existe, só muda de lugar). A ideia mais valiosa é a da **C**:
hoje o app *tapa* o texto; ali ele *organiza* por trecho — e isso **só o AllBook
consegue fazer, porque o player sabe onde cada um parou**. A junção proposta:
esqueleto de abas da B + linha do ciclo da C dentro da aba *Conversa* + lista por
urgência da D + a barra de estado fina da A.

**Decisão: em aberto, com o Matheus.** Nada foi construído.

---

## 4.57 O menu da Comunidade: um lugar, um dono (29/07)

Conversa sobre como a Comunidade se organiza no topo. **Decisão tomada; a tela
só será construída com a reformulação da §4.53.**

### O que foi rejeitado, e por quem

**A fileira de quadradinhos no topo** (feed · fóruns · clubes) — rejeitada pelo
Matheus: *"em vez de a gente ter esses quadradinhos separando… acho que daria
mais riqueza"*. Ele tem razão: fileira de ícones parece menu de aplicativo de
banco, é genérica, e não acrescenta nada ao conteúdo.

**Levar clube e fórum para dentro dos três pontinhos** — rejeitado por mim, e ele
concordou. Dois argumentos:

1. **Gaveta é para quem tem muita coisa.** No Instagram e no Facebook o "…" e o
   hambúrguer guardam ajustes e ações secundárias; os destinos principais ficam
   sempre à vista. O Facebook tem Grupos na gaveta, mas o Facebook tem dezenas de
   destinos. A Comunidade do AllBook tem três.
2. **Contradiz o medo que originou tudo.** Em 28/07 (§4.40) o Matheus disse:
   *"tenho medo dele ficar um pouco invisível, o clube de leitura"*. Enterrar
   clube e fórum num menu é o jeito mais eficiente de torná-los invisíveis.

### A regra que ficou

> **O "…" da Comunidade só leva ao que é da comunidade. O que é seu mora no
> avatar.**

Nasceu de uma lista que o Matheus propôs para o menu — feed, fóruns, clubes,
**meu perfil, meus trechos, privacidade, meus recomendados**. Os quatro últimos
**já existem**, todos no painel `/you` (ou no perfil). Pô-los também na
Comunidade daria duas respostas para "onde eu acho meus trechos", que é o mesmo
defeito que ele próprio derrubou horas antes, quando a pílula "Meus" repetia a
seção logo abaixo (§4.53).

Mais de fundo: é a **separação por dono** da §4.41 — a Comunidade é o lugar dos
outros, o painel é o seu lugar. Misturar desfaz o que organizou o app.

Ele fechou assim: *"eu acho que você tem razão; talvez não caiba misturar o que é
de comunidade com o que é do perfil da pessoa"*.

**Alternativa registrada e não escolhida:** levar os itens pessoais para o menu
da Comunidade **e tirá-los do painel** — seria coerente (cada coisa num lugar
só), mas desfaz a separação por dono. O que não pode existir é o meio-termo: os
mesmos itens nos dois lugares.

### Como fica, então

- A Comunidade **abre no feed**, sem fileira de ícones no topo.
- **Feed · Seguindo** são as únicas coisas fixas ali — e não são destinos: são
  duas lentes do mesmo conteúdo (§4.53).
- O **"…"** guarda o que é da comunidade e é secundário: criar um clube, criar um
  fórum, todos os clubes, todos os fóruns, quem te segue / quem você segue.
- **Clube e fórum aparecem também no feed, como cartões** ("Clube do Mistério
  estreia segunda — 5 vagas", com a capa). Estar no menu não impede de estar no
  feed: **o menu é para quem procura, o cartão é para quem só está passando**. E
  esses cartões são a mitigação já registrada na §4.53 para o feed não nascer
  vazio.

### Construído no mesmo dia: "Meus clubes" no painel

Lacuna que o Matheus achou no meio da conversa: *"será que não seria interessante
colocar, quando você clica na foto, o ícone clube do livro?"*. Faltava mesmo — o
clube só se achava pela Comunidade, e é conteúdo seu tanto quanto uma nota ou um
download. Entrou em **Você › Seu conteúdo**, com a contagem, e some quando você
não está em clube nenhum.

---

## 4.58 O plano da Comunidade — tudo o que foi decidido em 29/07, num lugar só

> **Para ler com calma antes de construir.** O dia rendeu seis seções (§4.53 a
> §4.58) e as decisões ficaram espalhadas. Isto aqui é o consolidado: o que está
> fechado, o que foi rejeitado, **o que ainda falta bater o martelo**, e em que
> ordem construir. Pedido do Matheus: *"primeiro a gente vai refletir sobre as
> coisas e depois a gente começa a construir"*.
>
> **Nada da Comunidade foi construído.** O que foi ao código em 29/07 é só o que
> já estava fechado e é independente dela: conta privada, `/seguidores`,
> `/privacidade`, "Meus clubes" no painel.

### O princípio, em uma frase

**Um post é uma fala com um objeto do AllBook dentro** — a capa grande de um
livro, um trecho de 40s que toca, um clube com prazo e vagas. Não é "post de
rede social": é o livro circulando pela voz das pessoas. É isso que resolve o
"muito cru" e o que faz esta tentativa ser diferente das onze anteriores (§4.53).

### Decidido

| # | Decisão | Quem |
| --- | --- | --- |
| 1 | A Comunidade **tem objeto próprio**: o post. Não vira só "lugares" | Matheus (§4.53) |
| 2 | **Feed** = o que as pessoas escreveram · **Seguindo** = o que elas fizeram | Matheus (§4.53) |
| 3 | **O post aparece nos dois; a atividade, só no Seguindo** | Matheus (§4.53) |
| 4 | **Conta privada** protege a atividade, nunca o post | Matheus (§4.54) |
| 5 | **App pago é o filtro** de conteúdo impróprio (custo de reentrada) | Matheus (§4.53) |
| 6 | Sem fileira de quadradinhos no topo | Matheus (§4.57) |
| 7 | Sem clube/fórum enterrados na gaveta — eles aparecem **como cartões no feed** | eu, aceito (§4.57) |
| 8 | O "…" só leva ao que é **da comunidade**; o que é seu mora no avatar | os dois (§4.57) |
| 9 | O **cartão de trecho ganha capa grande** no feed | Matheus (29/07, capturas) |
| 10 | O perfil passa a girar em torno dos **posts**, com ícones no topo | Matheus (§4.56) |

### Rejeitado (para ninguém propor de novo)

- **Feed sobre pessoas** ("fulano avaliou", "fulano está ouvindo" como itens de
  lista) — é o que falhou onze vezes: texto sem corpo.
- **Encolher a Comunidade até sobrar só lugares** (minha folha `A × B`) — ficou
  obsoleta quando apareceu a saída de dar objeto a ela.
- **Fileira de ícones no topo** — "parece menu de banco", não dá riqueza.
- **Itens pessoais dentro do menu da Comunidade** (perfil, trechos, privacidade,
  recomendados) — já existem no painel; duplicar dá duas respostas para a mesma
  pergunta.
- **Interruptor para "o que eu recomendo"** — recomendar já é ato público.
- **Upload de imagem pelo usuário** — a capa entrega o efeito visual sem custo
  de servidor nem moderação de imagem (revisível: o pagamento muda o cálculo).

### Avaliado hoje, a partir das cinco capturas

1. **"Marcos perguntou no seu clube"** — minha recomendação: **sino, não feed**.
   A regra proposta: *o que te diz respeito e pede ação vai para a notificação; o
   que é vida dos outros vai para o Seguindo.* **Falta bater o martelo.**
2. **Pergunta com resposta em forma de livro** ("Terminei Duna, sigo na série?",
   respondida com capa + "melhor resposta") — **a melhor das cinco.** Encaixa no
   princípio: a resposta carrega um objeto. Minha recomendação: **um tipo de
   post**, não uma aba separada. **Falta bater o martelo.**
3. **"3 pessoas falaram deste trecho"** — já existe (sala do livro, §4.39). E o
   pedido de *"dar play e abrir exatamente naquele minuto"* **também já está
   construído**: `CitacaoDeAudio` leva a `/player/:id?t=…&ate=…` e o player para
   no fim do trecho. Nada a fazer.
4. **Convite para clube pela página da pessoa** — aprovado pelos dois. Falta
   definir o **como** (abaixo).
5. **Cartão de áudio com a capa grande** — aprovado. É item 9 da tabela.

### ✅ FECHADO em 29/07 (à noite) — as oito respostas

Os oito pontos abaixo foram decididos na conversa. **A lista original fica logo
adiante, com as recomendações, para se entender de onde cada decisão veio.**

1. **Atividade de clube → sino.** O que acontece **no seu clube** (perguntaram,
   abriu votação, o prazo vence) é notificação, porque cobra ação sua. O que é
   **vida dos outros** ("Carla criou um clube") vai para o Seguindo.
2. **Pergunta é um tipo de post**, com selo e "responder com um livro" — não uma
   aba. O que a aba tinha de bom (juntar as sem resposta) vira **filtro** no feed.
3. **Curtir sim; comentar sim, raso** (um nível). E **compartilhar** —
   republicar no seu perfil — aprovado pelo Matheus.
4. **Post só de texto é permitido, nunca o padrão.** O compositor abre com os
   anexos à mão. Texto puro ganha tratamento tipográfico para ter presença.
5. **"Áudio no post" = o trecho do livro** (a citação de 40s, que já existe).
   **Gravar a própria voz continua rejeitado** (§4.39), e o Matheus confirmou:
   *"a gente já deixou rejeitado, agora está descartado"*.
6. **O item do "botão sem nome" foi riscado** — nenhum dos dois lembrava a que
   se referia.
7. **O que morre da Comunidade de hoje:** mural, lista de todo mundo e a fileira
   "Seguindo" morrem. **"Ouvindo agora" não morre — muda de lugar**, vai para o
   Seguindo (é atividade, e é a única vitrine que só um app de audiolivro tem).
   **"Combina com você" também sobrevive**, mas não como bloco fixo: vira
   **cartão ocasional dentro do Seguindo**, com o motivo medido, para não virar
   parede de gente (receio do Matheus, que é o mesmo meu).
8. **"Trechos quentes da semana": entra.** **"Quem está no seu trecho agora":
   entra também** — eu era contra e **perdi o argumento**. Registro por quê:
   - **Meu argumento do "não tem servidor" estava errado**, e ele apontou: o app
     inteiro é maquete esperando backend; rejeitar por isso rejeitaria tudo.
   - **O mecanismo que ele propôs resolve a privacidade:** opcional **e
     recíproco** — quem não mostra, não vê —, e só entre quem se segue.
   - **Condição que eu defendi e ficou:** **granularidade grossa** — mostrar
     *"está no capítulo 12"*, nunca *"ouvindo agora, neste segundo"*. Entrega
     quase todo o valor ("tem gente perto de mim neste livro") e tira o que é
     de fato sensível: presença ao vivo revela **rotina**.
   - **Anotado sobre a reciprocidade:** ela pressiona a ligar (quem não liga
     fica cego). É bom mecanismo, mas não é neutro — por isso **nasce desligada**.

### As cinco últimas dúvidas, respondidas (29/07, à noite)

1. **Um objeto por post.** Nada de trecho + clube no mesmo post: dois anexos
   brigam pelo mesmo espaço e o cartão perde a forma.
2. **Ordem cronológica pura**, o mais recente primeiro. Sem "melhores", sem
   algoritmo: com pouca gente, algoritmo é teatro — finge escolher entre dez
   coisas. **E o Matheus acrescentou o que faltava: ser notificado das
   interações** (curtiram, comentaram, responderam ao seu comentário).
   - **Curtidas chegam agrupadas** — *"Ana e mais 3 curtiram seu post"*, nunca
     um aviso por curtida: sino em enxurrada é sino que se ignora.
   - **Descurtida NÃO gera notificação** — recomendei e o Matheus concordou. É a
     única da lista que não gera ação nenhuma: não dá para responder, corrigir
     nem conversar com ela. Só machuca. **Decidido.**
3. **Editar o próprio post: pode** — o Matheus discordou de mim e venceu com a
   prática das grandes plataformas. **Condição que ficou: selo "editado"**, que
   resolve a objeção original (sem ele, o autor vira o sentido do texto e faz os
   comentários anteriores parecerem loucos). **Apagar** também.
4. **Os três pontinhos no post**: editar · apagar · compartilhar · denunciar
   (o último só nos posts dos outros).
5. **Botão "seguir" no cartão do post: entra** — eu era contra por poluição, ele
   discordou. **Refinamento aceito:** aparece **só se você ainda não segue**, e
   some depois — não vira "Seguindo ✓" ocupando espaço para sempre.
6. **A caixa de escrever fica no topo do feed** (e a mesma no perfil, §4.56) —
   **assumido por mim, sem objeção dele**, não confirmado em palavras. Registrado
   assim de propósito: quando ele revisar, sabe que este é meu e não dele.
   Sem botão flutuante, que tapa conteúdo. *(Termo "compositor" era jargão meu;
   ele pediu para explicar, e está explicado aqui.)*

### O curtir existe pela metade — e precisa existir no app inteiro

Desconfiança do Matheus, **medida e confirmada** em 29/07: `lib/reactions.ts`
(curtir **e** descurtir) está ligado só na **conversa do livro** —
`CommentThread`, `SalaDoLivro`, `BookDetails`, `Conversa`, `ProfileComments`.

**Falta em:** mural do clube (`MuralDoClube`), fórum (`Grupo`/`Topico`) e mural
da Comunidade. **A construir**, junto com o feed: se o post tem curtir e a
resposta do fórum não tem, a mesma ação existe em metade dos lugares — e a
pessoa não sabe onde pode reagir sem tentar.

### Decisões de clube tomadas na mesma conversa

- **O fim do ciclo já estava resolvido, e o Matheus redescobriu:** a **votação do
  próximo livro** (`VotacaoDoClube`) + a **estante** fazem o clube continuar. O
  que ele descreveu — *"muda o nome, escolhe o próximo livro"* — é isso.
- **Falta poder renomear o clube.** Hoje o nome é fixo desde a criação, e um
  clube que troca de assunto precisa trocar de nome. **A construir.**
- **A votação passa a aceitar de 2 a 5 opções**, com **3 sugerido**. O argumento
  que motivou o 3 continua válido e fica registrado: *com 5 opções e 8 pessoas, o
  vencedor sai com 3 votos* — cinco pessoas ficam com um livro que não
  escolheram. Empate: desempata o dono.
- **Lista de espera** quando o clube enche, com teto de **250** (número do
  Matheus). **A "turma 2" que eu propus foi retirada** — ele perguntou por que
  existiria, se o moderador já pode aumentar o limite ou criar outro clube, e eu
  **não consegui fundamentar**. Fica o alerta, sem bloqueio: acima de ~30 pessoas
  a conversa por capítulo vira ruído, e o clube começa a virar fórum (§4.43).
- **Quem perde a votação ganha uma saída** (peça nova, nascida da pergunta dele
  "como essa pessoa vai para o outro clube?"): ao fechar a votação, quem votou no
  livro derrotado vê *"3 pessoas também queriam X — criar um clube desse livro?"*,
  com o formulário já preenchido. Resolve três coisas: dá destino a quem perdeu,
  compensa o custo de ter 5 opções, e faz o clube **se multiplicar sozinho**. É a
  "turma 2" nascendo do lugar certo — não porque encheu, mas porque um grupo
  queria outro livro.
- **Rejeitado: redirecionar gente de um clube para outro.** Quem não gosta do
  próximo livro **sai** (o botão existe). Mover pessoa sem que ela peça é decidir
  por ela.

### Em aberto — o que precisa da sua palavra antes de construir

1. **Atividade de clube: sino ou Seguindo?** (recomendo: sino para o que pede
   ação sua; Seguindo só para a vida de quem você segue).
2. **"Pergunta" é um tipo de post ou uma aba própria?** (recomendo: tipo de post).
3. **Convite para clube — as regras.** Quem pode convidar: só o dono, ou
   qualquer membro? O que acontece se o clube estiver cheio? O convite expira
   quando o ciclo começa? (recomendo: qualquer membro convida, o dono é quem
   remove; convite morre quando o clube enche ou o ciclo começa).
4. **O post tem curtir e comentar?** As maquetes mostram ❤ e 💬. Se tiver,
   comentário de post é uma conversa nova — e já existem duas (a do livro e a do
   clube). (recomendo: curtir sim, comentar sim, mas **raso**: um nível, como
   nas respostas do fórum).
5. **O post pode ser só texto, sem objeto?** (recomendo: pode, mas o compositor
   abre com os três anexos à mão — texto puro é a exceção, não o padrão).
6. **O nome do botão que você mencionou e ainda não batemos.**
7. **O que morre da Comunidade de hoje**: mural, "ouvindo agora", "combina com
   você", lista de todo mundo, "seguindo". (recomendo: todos morrem; o que
   sobrevive vira cartão no feed).
8. **"Trechos quentes da semana" e "quem está no seu trecho agora"** (da 3ª
   captura) entram? Não foram comentados.

### Menção dentro do texto (29/07) — decidido, a construir com o compositor

Ideia do Matheus: *"que tal ela mencionar um livro, narrador ou coisa, como
acontece hoje no Facebook?"*. **Aprovada, com escopo restrito.**

**O argumento a favor, que ele não chegou a dizer:** o post carrega **um** objeto
(§4.58), mas às vezes a fala precisa de dois — *"terminei Duna e me lembrou
Fundação"*. Sem menção, o segundo livro é texto morto.

- **Mencionar livro, autor e narrador: sim.**
- **Mencionar pessoas (@fulano): não por ora.** Traz notificação, traz
  quem-pode-mencionar-quem e traz moderação — menção é a porta de entrada de
  importunação em toda rede. Depois, se fizer falta.
- **A menção é texto com link, não um segundo cartão.** Preserva o "um objeto por
  post": o cartão continua sendo um só, e a menção é uma palavra clicável.
- **Nada de detecção automática de títulos no texto.** O catálogo tem *It: A
  Coisa* — "it" apareceria em qualquer frase; "Duna" em qualquer frase sobre
  deserto. O certo é o padrão do Facebook: **digitar `@` abre a lista** de
  livros, autores e narradores, e escolher insere o nome já como link.

### Ordem de construção (com as oito já decididas)

1. ✅ **FEITO 29/07 — O cartão do post**, nas três formas (com livro · com trecho ·
   com clube) — sozinho, sem tela. Se ele não sair do cru, nada em volta salva.
   **A capa grande no cartão de trecho entra aqui**, é a mesma peça. O que se
   descobriu construindo está na **§4.59**.
2. ✅ **FEITO 30/07 — O compositor**: escrever + anexar (livro, trecho, clube), com
   o tipo **pergunta** e o post de texto puro com tratamento tipográfico. Entraram
   junto a **menção com `@`**, o **editar** com selo, e o **filtro "Perguntas"** —
   este último porque sem ele o botão de pergunta era decoração. Detalhe na **§4.60**.
3. ✅ **FEITO 30/07 — O feed** com as duas lentes (Feed · Seguindo), os cartões de
   clube/fórum intercalados, curtir/comentar raso e compartilhar. As duas lentes e o
   **comentar raso** (com curtir no comentário e a página `/post/:id`) estão na
   **§4.62**; **compartilhar** e os **cartões de convite**, na **§4.64**.
   *(O curtir que faltava no fórum e no mural do clube entrou em 30/07 — §4.67.)*
4. ✅ **FEITO 30/07 — O Seguindo**: atividade em linha + "ouvindo agora" (só de
   quem você segue) + "combina com você" como cartão ocasional. Junto morreu a
   aba Pessoas, e a Comunidade ficou com duas abas. Detalhe na **§4.65**.
5. ✅ **FEITO 30/07 — Convite para clube** pela página da pessoa, com aceitar no
   sino. Detalhe na **§4.68**.
6. ✅ **FEITO 30/07 — O perfil girando em torno dos posts** (§4.56): os posts em
   cartão na sua página e na dos outros, publicar direto do perfil, e as três
   portas no topo (recomendações · comentários · clubes) com as três páginas que
   elas abrem. Detalhe na **§4.66**.

**Fora do caminho crítico, e independentes** (dá para fazer a qualquer momento):
~~renomear o clube~~ · ~~votação de 2 a 5 opções~~ · ~~lista de espera com teto de
250~~ · ~~"quem perdeu a votação funda um clube"~~ · ~~trechos quentes~~ · ~~presença
por capítulo (com opt-in recíproco)~~. **Todos feitos em 30/07 — §4.69 (clube),
§4.70 (presença) e §4.71 (trechos).**

---

## 4.59 O cartão do post, construído — e o que se decidiu construindo (29/07)

**A primeira peça da Comunidade nova foi ao código.** As decisões abaixo nasceram
**fazendo e olhando**, e é por isso que estão aqui e não na §4.58: aquela é o
plano; esta é o que a mão descobriu.

### A regra que vale para todo cartão do app: capa não se corta

Meu primeiro cartão punha a capa numa faixa horizontal com `object-cover`. Capa
de livro é **retrato** (2:3) — o recorte comia a arte, e no cartão do Duna o
título do livro sumia. O Matheus achou perguntando *"o que você acha desse
formato?"*, e a cobrança seguinte foi mais dura e certeira: eu tinha consertado
**só o cartão de livro** e deixado o de clube e o de trecho com o mesmo defeito.

> **Se cortar a arte é ruim num, é ruim nos três.** Num app onde a capa é a peça
> de design mais cuidada do produto, usá-la como textura de fundo é desperdício.

**O formato que ficou, igual nos três:** capa **inteira** em retrato à esquerda; o
fundo é **ela mesma desfocada** (o truque que o topo do player já usava — não é
invenção, é a identidade da casa); as informações à direita. O que muda entre eles
é só o que cada um precisa: barra de play no trecho, selo + rodapé no clube, botão
no livro. **Três cartões, uma gramática.**

### "Quem aparece no app tem página"

O Matheus notou que *"moderado por Elias"* não era clicável. A causa era funda: os
**16 figurantes** dos clubes eram declarados dentro de `clubes.ts` com só slug,
nome e cor — **não existiam como pessoas em lugar nenhum**. Foram promovidos a
`community.ts`, com bio, e a lista duplicada saiu (nome em dois lugares diverge
cedo ou tarde).

> **Nome que a interface mostra e não deixa abrir é beco sem saída.** Vale para
> qualquer tela nova: se aparece um nome, ele tem página.

Entraram com **bio e nada mais inventado** — sem horas fabricadas em massa, sem
recomendações falsas.

### Cada parte do cartão leva ao seu lugar

Pedido dele, aplicado nos três: título → a ficha; **autor e narrador** →
`/person/:slug` (a tela já servia os dois desde sempre); o livro da vez do clube →
a ficha dele; o moderador → a página dele; **"4 pessoas"** → a folha com a turma,
cada nome clicável; **"6 etapas"** → o clube; e o **carimbo do momento** no trecho
→ o player naquele ponto.

Duas coisas que isso ensinou:

- **Número que descreve algo existente e não leva até ele é informação que morre
  na tela.**
- **A folha da turma abre sem sair do feed**, porque ver quem está numa turma é
  curiosidade de passagem — trocar de tela por isso faria perder o lugar na
  rolagem.

### O trecho toca dentro do cartão

*"Não faz sentido nenhum ele te levar para o áudio do livro; ele tem que ser
reproduzido aqui dentro."* Certo — um trecho de 40s que exige trocar de tela não é
trecho, é link. O play deixou de navegar; a capa continua sendo a porta do livro.

⚠️ **Limitação registrada no código:** o AllBook **não tem áudio** — nem o player
do livro toca som, ele avança um relógio. O componente faz o **comportamento**
certo (toca, a onda acende, o tempo corre, para no fim); quando o áudio existir,
entra um `<audio>` no lugar do relógio e a tela não muda.

### Curtir: só curtir, sem descurtir

**Decisão nova, tomada construindo.** `reactions.ts` tem os dois lados, mas é da
**conversa do livro**, onde a discordância visível é parte do jogo (§4.39). No
feed é diferente: **post é fala de alguém**, e um contador de "não gostei" embaixo
dela azeda o feed. Então `lib/curtidas.ts` só sabe curtir.

- **O contador dos outros é simulado e estável** (semente pelo id), como o
  progresso dos membros do clube: instável, o número mudaria a cada desenho e a
  interface mentiria de forma visível.
- **Os seus posts começam em zero.** Fingir que estranhos curtiram o que você
  acabou de escrever é a mentira mais fácil de perceber — e a que desmoraliza
  todo o resto.

### O que foi deixado de fora, e não é esquecimento

- **Comentar e compartilhar** não entraram na barra ainda: **botão sem mecanismo é
  beco sem saída**, e num feed é pior — a pessoa toca, nada acontece, e para de
  tocar em tudo. Entram com o modelo próprio de posts.
- **O selo "Perguntou" foi removido.** Dúvida dele: *"fico me questionando se ele
  faz sentido"*. Faz — mas só quando existirem as respostas embaixo e o filtro
  "sem resposta". Sozinho é rótulo. `post.pergunta` continua no modelo, esperando.
- **"Seguindo" em vez de o botão sumir:** eu queria que ele desaparecesse depois
  de cumprir a função; ele discordou (*"é o padrão das redes sociais"*) e ganhou
  um argumento que eu não tinha: assim dá para **deixar de seguir** dali mesmo.
  Usei estado apagado para atender à minha preocupação com poluição.
- **Post não aponta para fórum.** Os objetos são três: livro, trecho, clube. Eu
  recomendei deixar o fórum de fora e ele não objetou — três formas já dão
  trabalho de desenhar bem, e "post que aponta para um tópico" é raro na prática.
- **Os posts antigos do mural foram herdados**, não apagados. Quando perguntei,
  ele disse *"tanto faz; pode deixar os que já tem lá"* — e herdar é o que mantém
  o Perfil funcionando sem alteração.

### Detalhe de data, que veio de um mal-entendido útil

Eu havia escrito que não acrescentaria "selo de novo" (o tempo já está no cartão),
e ele leu como se eu fosse tirar a data — e defendeu que **data é importante**.
Está: "há 2 h", "ontem". A conversa rendeu uma melhoria de verdade: **passados 7
dias, vira data absoluta** ("12 jul"), porque "há 3 semanas" obriga a fazer conta.

---

## 4.60 O compositor, construído — e o que se decidiu construindo (30/07)

Item 2 da ordem da §4.58. Como na §4.59, o que está aqui **nasceu fazendo e
olhando** — o plano está lá, o que a mão descobriu está aqui.

> ⚠️ **Duas decisões desta seção foram revistas horas depois, pelo Matheus — leia
> a §4.61 junto.** O **filtro "Perguntas" no feed** virou **página `/perguntas`**, e
> o **botão de anexar clube** (com a regra de só aparecer se você tem clube) foi
> **removido** junto com o de livro. O que está abaixo continua valendo como o
> raciocínio de onde se partiu.

### O selo "Pergunta" voltou, porque ganhou mecanismo

Em 29/07 eu tirei o selo do cartão, e o motivo era bom: **rótulo sem mecanismo é
decoração** (§4.23). A dúvida tinha sido dele — *"fico me questionando se ele faz
sentido"*.

Construindo o compositor, o botão "Pergunta" caiu no mesmo problema: marcar um post
como pergunta não mudava nada em tela nenhuma. Duas saídas ruins e uma boa:

- **Ruim:** deixar o botão e o post sair igual aos outros. Botão que não faz nada.
- **Ruim:** não oferecer o botão. Estreitava a decisão dele sem avisar.
- **Feita:** trazer o selo **junto com o filtro "Perguntas"** no topo do feed.

O filtro é exatamente o que a aba de perguntas tinha de bom — juntar as perguntas
— **sem** dividir a comunidade em duas plateias, que foi o motivo de a aba ter sido
rejeitada. Agora o selo marca um conjunto que a pessoa consegue isolar. **As
respostas embaixo continuam pendentes** (item 3): quando existirem, o filtro pode
virar "sem resposta", que é o que ele promete de melhor.

**O filtro some quando não há pergunta nenhuma** — filtro que não filtra é o mesmo
botão morto por outro caminho.

### Chave de armazenamento nova, e por que não deu para reusar a do mural

Os posts seus passam a viver em `allbook_posts`. O `MeuPost` do mural
(`allbook_mural_posts`) **não servia**, por três razões de fato:

1. **Não aceita trecho** — só `bookId` ou `clubeId`, e o trecho é o objeto que só
   o AllBook tem.
2. **Exige âncora** — a validação descarta post sem livro nem clube, e a §4.58
   decidiu que texto puro é permitido.
3. **Não tem `pergunta`, `mencoes` nem `editadoEm`.**

Os antigos continuam sendo lidos e mostrados (decisão dele: *"tanto faz; pode
deixar os que já tem lá"*), e por isso **apagar tenta nos dois formatos** — quem
toca "Apagar" não sabe nem tem por que saber em qual chave o post está.

**Pendência que isto cria:** o Perfil lê `readMeusPosts` (só o formato antigo), e
por isso **post novo ainda não aparece no Perfil**. Não foi consertado de propósito:
é o item 6 da ordem (o perfil girando em torno dos posts), que reformula a seção
inteira — remendar agora seria trabalho jogado fora.

### A menção: como ficou guardada, e a alternativa rejeitada

O texto fica **limpo** (`"me lembrou @Hábitos Atômicos"`) e a lista de menções vem
ao lado, com o alvo de cada uma.

**Rejeitado: marcação dentro do texto** (`[[livro:102|Hábitos Atômicos]]`). Motivo
prático: o texto é digitado num `textarea`, e ali a marcação apareceria **crua para
quem escreve**. Com a lista ao lado, o app casa `@` + nome ao mostrar — e se a
pessoa editar e quebrar o nome, a menção **volta a ser texto**, nunca vira link
apontando para coisa que o texto não diz mais.

**Um campo, dois lugares** (`CampoComMencao`): o compositor e o **editar** usam o
mesmo. Escrever duas versões dele era o erro que a §4.40 cobrou caro.

### Editar edita o texto, nunca o anexo

Decisão nova, tomada construindo. Trocar a capa depois de o post circular é uma
troca de sentido que **nem o selo "editado" consegue avisar**: quem já viu o cartão
viu outro livro. Para trocar o objeto, apaga e escreve de novo.

### O botão de clube só existe se você estiver em algum clube

Terceira via entre duas saídas ruins: folha vazia dizendo "você não tem clubes" é
beco sem saída (§4.23), e botão desabilitado é pior — parece defeito. Quem não tem
clube descobre os clubes na aba Fóruns, que é onde eles moram.

### Dois defeitos que só apareceram na tela

- **Meu, e novo:** escolhida a menção, o campo passava a conter `@Hábitos Atômicos `
  — e esse termo **casa com o próprio livro**, então a lista reabria mostrando o
  item que a pessoa acabou de escolher, e ficava pendurada até ela digitar a
  palavra seguinte. Conserto: se o termo **é** um rótulo já registrado, a lista não
  abre.
- **Antigo, e pior:** o preview do trecho anexado é o `CitacaoDeAudio` compacto, que
  é **um link para o player** — tocar nele no meio de escrever **levava a pessoa
  embora e o texto ia junto**. Valia para os três lugares que anexam trecho
  (compositor, mural do clube, resposta do fórum). Consertado na raiz, no
  `AnexarTrecho`: o cartão fica inerte, o X continua clicável.
  - **Limitação que isto expõe, e que já existia:** com o cartão inerte, **o play
    desenhado nele não toca** — e na folha "Seus trechos" nunca tocou, porque ela já
    usava o mesmo bloqueio. O conserto certo é o cartão **compacto** tocar ali
    dentro, como o `grande` já faz. Não foi feito agora para não mexer no cartão
    que quatro telas usam. **A construir.**

### A caixa nasce fechada — e as duas alternativas rejeitadas

Uma linha com o avatar, que abre no lugar. **Botão flutuante** tapa conteúdo (a
§4.58 já dizia isso) e **caixa sempre aberta** empurraria o primeiro post para
baixo da dobra: quem entra na Comunidade quer ler antes de escrever.

---

## 4.61 O `@` virou o caminho único de citar — e o selo ganhou endereço (30/07)

Três críticas do Matheus no mesmo turno, horas depois de a §4.60 ficar pronta.
**Todas procedentes, e todas apontando para a mesma coisa: redundância.** Revisam
decisões da §4.58 e da §4.60, e é por isso que estão em seção própria.

### A queixa que revelou dois buracos: *"não colocou a capa do clube"*

Ele escreveu uma pergunta marcando com `@` e reclamou que não veio a capa. Fui
apurar e havia **dois** problemas, não um:

1. **A menção era, por decisão, só texto com link** (§4.58: *"a menção é texto com
   link, não um segundo cartão"*). Isso era defensável enquanto existisse o botão
   de anexar — a menção era o caminho "leve" e o botão o "pesado".
2. **O `@` não conhecia clube de leitura**, só livros e pessoas. O que ele marcou
   foi o **livro** "O clube das 5 da manhã", achando que era um clube. O buraco era
   meu e passou despercebido porque livro e clube dividem o nome no catálogo dele.

### Os botões "Livro" e "Clube" saíram — e o argumento dele era melhor que o meu

> *"Se você já pode marcar com @, eu fico me perguntando qual é o sentido de ter
> isso aqui, sendo que você já pode marcar o @ no meio da coisa."*

Ele está certo, e a régua é a da §4.23 aplicada a mecanismos em vez de botões:
**dois caminhos para a mesma coisa é pior que um**, porque a pessoa precisa
escolher entre eles sem ter critério. E entre os dois, o `@` é o melhor: cita
**dentro da frase**, em vez de pendurar um anexo ao lado dela.

**A consequência obrigatória:** a menção teve de assumir o trabalho do anexo — **a
primeira menção de livro ou clube vira o cartão do post**. Sem isso, remover os
botões teria **tirado uma função** em vez de simplificar.

- **Continua sendo um objeto por post** (§4.58). Um texto pode citar três livros: o
  primeiro ganha capa, os outros seguem como palavra clicável.
- **A ordem que vale é a da frase, não a de escolha.** Quem escreve sobre dois
  livros e só depois volta para marcar o primeiro tem o cartão do primeiro — é o
  que ela está lendo na tela.
- **Pessoa mencionada não vira cartão.** O objeto do post é sempre uma obra ou uma
  turma; cartão de gente traria de volta o feed "sobre pessoas" que fez as onze
  maquetes anteriores falharem (§4.53).

**O "Trecho" ficou, e a razão é dele:** *"o trecho talvez até possa fazer sentido,
porque você precisa do botão de trecho para anexar o áudio"*. Exato — **não há como
digitar um trecho de áudio dentro de uma frase.** Livro e clube têm nome; trecho se
escolhe de uma lista.

**O que se perdeu, e eu registro em vez de esconder:** não dá mais para pôr a capa
**sem nomear o livro no texto**. "Isso me quebrou" + capa virou "@Duna me quebrou".
Julguei o preço baixo — quem escreve sobre um livro costuma dizer qual — mas é uma
perda real, e se ela incomodar o conserto é um botão "só a capa" (não um botão de
anexo de volta).

**Dois riscos que a remoção criou, e o que fiz com cada um:**

- **Descoberta.** Sem botão, o `@` fica invisível: o placeholder desaparece na
  primeira letra. Resposta: **a dica ficou fixa embaixo do campo**, ao lado do botão
  de trecho.
- **A busca por narrador ia junto.** A folha do botão "Livro" buscava por título,
  autor **e narrador**, e neste app o narrador é motivo de escolha de livro (§4.15).
  Resposta: **a lista do `@` passou a achar livro pelo nome do autor e do
  narrador** também, mostrando o livro.

### O selo "Pergunta" virou link, e o filtro do feed virou página

> *"Esse ícone precisa ser clicável dentro do mural, que hoje não é, e levaria para
> uma página onde só mostraria perguntas."*

É a régua da §4.59 outra vez — **rótulo que nomeia uma categoria e não leva até ela
morre na tela** —, e ele viu o que eu não tinha visto: o **filtro local não servia
de destino**. Ele mudava a lista embaixo da pessoa, sem endereço e sem título, e o
selo dentro do cartão não tinha para onde apontar.

Agora existe **`/perguntas`**, e o selo e a linha do topo do feed levam ao mesmo
lugar: **um mecanismo, não dois**. O par "Tudo · Perguntas" saiu.

**Isto não é a "aba de perguntas" que a §4.58 rejeitou.** O que foi rejeitado era
dividir a Comunidade em **duas plateias** — dois lugares onde se escreve e se lê por
padrão. A página não é padrão de nada: é um **recorte sob demanda**, alcançado por um
selo. Pergunta continua sendo um tipo de post e continua no feed junto com o resto.

**O que a página ganha quando existirem respostas** (item 3 da §4.58): a divisão
entre "sem resposta" e "já respondidas". Hoje ela junta; amanhã ela cobra.

### O post que ele já tinha escrito ganhou a capa

A derivação do cartão acontece **ao publicar**, e o post dele era anterior. Em vez de
deixá-lo sem capa, a **leitura** também deriva — mas **só quando não há nada
gravado**. Assim:

- post com objeto próprio fica como está, o que garante que **editar o texto não
  troca a capa** de um post que já circulou (§4.60);
- post de quem **tirou o cartão com o X** continua sem cartão, porque ali a ausência
  foi escolha — e é para distinguir as duas ausências que existe o campo `semCartao`.

**Rejeitado: reescrever o `localStorage` na leitura.** Daria o mesmo resultado com
efeito colateral escondido; derivar na hora de mostrar não mexe no que está gravado.

---

## 4.62 Comentar, as duas lentes e a página de um post (30/07)

Item 3 da ordem da §4.58, na maior parte. Comecei por **comentar** e não pelas
lentes porque era o que destravava mais coisa: **sem resposta, pergunta não é
pergunta** — a `/perguntas` sabia juntar e não sabia cobrar.

### Comentar: raso, um nível, com `@Fulano`

Como decidido (§4.58): a resposta a um comentário **não abre fio**, entra na mesma
lista com o nome de quem responde na frente. O motivo é concreto: já existem
**duas** conversas profundas no app (a do livro e a do clube), e uma terceira com
fios aninhados seria um lugar onde a conversa se esconde dentro dela mesma.

**A conversa abre fechada no feed.** Um feed em que cada post traz cinco
comentários abertos deixa de ser feed — a pessoa rola dez telas para ver quatro
posts. O que fica visível é **quantos** são.

**Curtir passou a valer no comentário também**, com a mesma `lib/curtidas.ts` do
post. Era metade da inconsistência que a §4.58 registrou (curtir existindo em
alguns lugares e não em outros). Comentário ganha número menor que post por
semente: resposta com 12 corações sob um post com 3 seria hierarquia invertida, e a
tela contaria uma mentira.

**Rejeitado: reusar `replies.ts`** (as respostas da conversa do livro), apesar de
fazer quase o mesmo. Duas razões concretas: lá o `bookId` é obrigatório na
semântica e **post pode não ter livro**; e o `parentId` de lá é um comentário do
catálogo fixo. Generalizar exigiria mexer em `CommentThread.tsx`, que é território
da outra janela. **Duas libs pequenas com a mesma gramática é mais seguro que uma
grande com campos que mentem.**

### A página de um post (`/post/:id`) — nasceu de uma necessidade, não de um desejo

Quando alguém comenta, o sino precisa levar **ao post**. Não havia para onde: o
feed é cronológico, e um post de dois dias atrás está a dez telas de rolagem. É o
mesmo defeito que a §4.51 cobrou por outro caminho (a resposta que caía na sinopse
em vez da conversa). Ali a conversa **vem aberta**: quem chegou, chegou por ela.

Serve também de endereço para o **compartilhar**, quando ele existir.

### As duas lentes ficam embaixo do compositor, não nas abas do alto

As pílulas de cima dizem **que parte** da Comunidade (Feed · Fóruns · Pessoas); as
novas dizem **de quem** (Todos · Seguindo). São critérios diferentes, e a régua da
casa é que **uma fileira de pílulas carrega um critério só**.

A regra do que aparece em cada uma é a do Matheus (§4.58): **post é o mesmo nas
duas**, muda de quem. A **atividade** ("Carla está ouvindo X") é que será exclusiva
do Seguindo — item 4, ainda por fazer.

### Três defeitos pegos na tela, e nenhum apareceu no `tsc`

1. **"Responder" não dava foco ao campo.** Punha `@Fulano` no comentário e deixava
   o foco no botão: quem começava a digitar **escrevia no vazio e perdia a frase**.
   `autoFocus` não resolve, porque só vale na montagem. Conserto: `focarQuando`, um
   contador que o pai incrementa — e **zero não pede foco**, para abrir a conversa
   só para ler não subir o teclado do celular.
2. **O aviso descrevia errado.** Todo comentário em post dizia *"comentou no seu
   post"* — inclusive quando o post era de outra pessoa e o que houve foi alguém
   **respondendo o seu comentário** lá. Aviso que descreve errado é pior que aviso
   nenhum: a pessoa abre esperando uma coisa e encontra outra.
3. *(§4.61)* a lista de menções reabrindo com o item já escolhido.

### O esqueleto responde de volta — e por que isso não é enfeite

Sem servidor, um comentário seu cairia no vazio, e a pessoa nunca veria como a
conversa se comporta. Quem responde é **o autor do post**, 2,5 s depois, e o sino
acende — que era o pedido dele na §4.58 (*"eu tenho que ser notificado"*).

**Só em post de outra pessoa:** o esqueleto reagindo ao próprio dono do post seria
o app conversando consigo mesmo. Quando houver servidor, a simulação sai inteira.

### O que ainda falta do item 3

**Compartilhar** (republicar no seu perfil) e os **cartões de clube/fórum
intercalados** no feed. Nada disso está pendurado na interface — não há botão sem
função.

---

## 4.63 O que a primeira hora de uso revelou (30/07)

Quatro coisas que o Matheus achou **usando**, e que nenhuma leitura de código teria
mostrado. Vale como método: **a lista de defeitos mais útil vem de quem usa, não de
quem escreve.**

### "Esse curtir não está funcionando" — e ele funcionava

Fui medir antes de mexer, e o curtir **grava, o coração acende, o número sobe**. O
que não funcionava era o **dedo acertar**: o botão de curtir do comentário tinha
**19×14 px** — cerca de 22×16 no aparelho — contra os **44** que Apple e Google
recomendam.

> **É o mesmo defeito das bolinhas da conversa no player**, que ele já tinha achado
> com as mesmas palavras: *"é muito pequeno e o dedo da pessoa é muito grande"*.
> Duas vezes o mesmo erro meu, em lugares diferentes. **Alvo de toque entra na
> revisão de tudo que eu desenhar daqui em diante.**

Conserto: `py-3 -my-3` — o padding cria a área de toque, a margem negativa devolve
o espaço ao layout. **O desenho não muda; o alvo triplica** (medido: 16 → 40 px no
aparelho). Aumentar a fonte estava fora de questão: comentário não pode competir
visualmente com o post.

### A ordem dos comentários estava errada, e a ordem sozinha não resolvia

Eu tinha ordenado do mais antigo para o mais novo, "como conversa". Ele achou o
defeito usando: *"eu acabei de comentar e o meu comentário foi lá pra baixo, muito
ruim"*.

**O problema não era gosto, era confirmação:** quem escreve não vê o que escreveu, e
sem confirmação a pessoa escreve de novo. E **inverter a ordem sozinho não
bastava** — com o campo embaixo, o comentário novo apareceria *acima* do campo,
ainda fora do olhar. As duas coisas juntas resolvem: **campo em cima, lista do mais
novo para o mais velho**, que é o que YouTube e Facebook fazem.

O encadeamento não se perde porque a lista é **rasa**: quem responde carrega o
`@Fulano`, e é ele que diz com quem se fala — não a posição.

### A menção agora fica grifada enquanto você escreve

Pedido dele: *"seria legal que ele ficasse grifado quando você marcasse, como
acontece hoje nas redes sociais"*. Tinha razão — você marcava e o nome ficava igual
ao resto do texto, então não dava para saber se pegou.

**Rejeitado: campo rico (`contenteditable`).** Daria texto formatado de verdade, mas
traz junto colagem com estilo, seleção quebrada, cursor perdido e comportamento
diferente em cada navegador. Muito risco para um grifo.

**Feito: espelho atrás do campo.** Um `div` com o mesmo texto e a mesma tipografia,
com os nomes pintados, exatamente atrás de um `textarea` de letras transparentes —
`-webkit-text-fill-color: transparent` apaga as letras **sem** apagar o cursor. As
duas camadas precisam de tipografia idêntica, senão o grifo desalinha; por isso ela
está numa constante só, usada pelas duas.

### O cartão de pessoa: a ideia foi dele, a ressalva foi minha, e as duas entraram

Ele propôs *"um cartãozinho que levaria para aquele perfil, assim como já existe nos
livros"*, e pediu minha opinião. Ela era contrária, com fundamento:

- a §4.53 registra que **onze** maquetes de Comunidade falharam porque o feed era
  **sobre pessoas** — texto sem corpo;
- neste app **quase nenhum autor ou narrador tem foto**: o avatar é uma inicial
  colorida. Um cartão de rosto ao lado de um cartão de capa perde sempre.

**O acordo, e é melhor que as duas posições isoladas: o cartão existe, e o corpo
dele são as capas dos livros da pessoa.** A fileira de capas é o que dá presença — e
é também a informação que decide se você quer o perfil: *"quem é essa narradora?"*
se responde vendo **o que ela narrou**.

Detalhes que caíram junto: as narrações vêm primeiro (no AllBook a voz é motivo de
escolha, §4.15); **sem livro nenhum não há cartão**, porque sobraria um retângulo
com um nome — o cru de que ele reclamava.

**Consequência para a regra da §4.61:** a primeira menção **de qualquer tipo** vira
o cartão, e a derivação passou a valer para os posts do esqueleto também. Sem isso a
regra valeria só para quem usa o app, e a tela mostraria dois comportamentos para a
mesma coisa.

*(E sim: mencionar autor e narrador **já funcionava** desde a §4.61, gerando link
para `/person/:slug`. A dúvida dele era legítima — nada na tela dizia isso.)*

---

## 4.64 O item 3 fechado: compartilhar e os cartões de convite (30/07, noite)

Faltavam duas peças do item 3 da ordem da §4.58 — **compartilhar** e os **cartões
de clube e fórum intercalados**. As duas foram construídas na mesma passada, e o
que se decidiu construindo está aqui.

### A crítica que refez o compartilhar no mesmo dia — e vale como método

A primeira versão fazia só uma coisa: republicar. O Matheus derrubou, e o recado
tinha duas metades, as duas certas:

> *"Quando ela compartilha um texto, ela tem a opção de escrever em cima do que
> está compartilhando, para dar sua opinião. (…) A ideia aqui é criar uma rede
> social, e ela está se tornando isso. Essas coisas têm que estar baseadas em
> você, não em mim. Não precisa de mim estar sempre dizendo o óbvio — você tem
> que ter autonomia para tomar essas decisões óbvias."*

**Sobre o produto:** compartilhar sem poder comentar é meia funcionalidade —
citar é o que transforma republicar em conversa. **Sobre o método:** convenção
consagrada de rede social é para eu assumir sozinho; se ele precisa ditar o
óbvio, o trabalho está sendo empurrado para o lado errado da mesa. Fica
registrado como régua para o resto da Comunidade: **quando a peça tem
equivalente óbvio nas redes que todo mundo usa, o padrão é ele — só o que foge
disso precisa de conversa.**

### Compartilhar virou "um post seu com o post do outro dentro"

**Rejeitado (era a minha primeira versão): guardar os compartilhamentos numa
lista de ids à parte** (`lib/compartilhados.ts`, apagado no mesmo dia). Ela
republicava e mais nada: escrever em cima, editar depois, apagar, curtir e
comentar o compartilhamento — cada um desses exigiria código próprio.

**O que ficou:** compartilhar publica um post seu cujo objeto é o post do outro
(`ObjetoDoPost` ganhou `{ tipo: "post" }`). Todas aquelas ações passaram a
existir **sem código novo**, porque são as ações que qualquer post já tem, e ele
aparece no seu perfil pelo mesmo caminho dos outros.

**O id continua sendo o que se guarda, e a razão sobrevive à mudança:** copiar o
texto congelaria o post. O autor pode editar (§4.58), e o selo "editado" existe
para avisar que o sentido mudou — uma cópia mostraria a versão antiga sem selo.
Com o id, o compartilhamento acompanha o original; se o autor apaga, some junto.
Republicar não dá posse do que o outro escreveu.

### Duas formas, e é a presença do texto que decide

- **Sem texto — recompartilhamento simples:** o cartão original aparece
  **inteiro**, com uma linha *"Fulano compartilhou · há 3 h"* em cima. Aninhar
  aqui foi rejeitado: dobra as bordas e espreme a capa sem ganhar nada, e num
  feed que se sustenta em capas é perder o que faz o cartão funcionar (§4.59).
- **Com texto — citação:** a sua fala na frente, o post do outro numa **moldura
  menor** embaixo. Aqui a moldura é certa pelo motivo oposto: existem **duas
  falas**, e a tela precisa dizer de quem é cada uma.

Não há escolha de "tipo" a fazer — a forma sai do que a pessoa fez. É como
Twitter e Facebook resolvem, e é o que evita mais uma pergunta antes de um gesto
que deveria ser leve.

### Saiu do "…" e virou botão da barra

A §4.58 tinha listado compartilhar dentro dos três pontinhos, e foi lá que ele
nasceu. **Saiu no mesmo dia:** numa rede social, compartilhar é ação de primeira
classe, e escondê-la num menu é tratá-la como "denunciar". Agora são três botões
— curtir, comentar, compartilhar —, o de compartilhar fica **aceso** quando é
seu, e o número ao lado é **contagem real** (não simulada como a das curtidas):
onde existe número verdadeiro, inventar é mentira gratuita.

### Dois defeitos meus, achados na tela

1. **Botão morto na citação.** Eu tinha proibido compartilhar um
   compartilhamento ("a corrente cresceria sem fim"), mas o botão continuava
   aceso no cartão de citação: a pessoa escrevia, tocava, e nada acontecia. A
   correção foi **permitir** — a corrente não cresce porque a moldura mostra **um
   nível só**: citando uma citação, ela pega o objeto lá de dentro.
2. **Promessa falsa no aviso.** O aviso dizia *"está no seu perfil e no feed"*, e
   o perfil só lia o mural antigo — o compartilhamento não aparecia lá. O perfil
   passou a ler também os posts da Comunidade nova, com a legenda *"Compartilhou
   de Fulano"*. É remendo até o item 6 (o perfil girando em torno dos posts,
   §4.56), que é quando essa seção deixa de ser três linhas e vira cartão.

### O defeito que só a tela mostrou: o mesmo post duas vezes

Compartilhado o post do Ricardo, o feed passou a mostrá-lo **duas vezes** — a
versão com "Felipe compartilhou" e, três cartões abaixo, a original. As grandes
redes convivem com isso porque entre as duas cópias passam centenas de posts;
**aqui passam dois**, e a tela parece quebrada.

**Regra que ficou: um post aparece uma vez, e quem ganha é o compartilhamento.**
Como a lista é cronológica e o compartilhamento é sempre posterior, guardar a
primeira ocorrência resolve sozinho. Nada se perde — o cartão continua com o
autor, o texto e a data dele. E a limpeza é **por lente**: na "Seguindo" de quem
não segue o Felipe, o compartilhamento nem entrou, e o original fica no lugar.

### Os cartões de convite: onde entram, e por que ali

Clube e fórum entram em **posições fixas contadas do topo** (o clube depois do 3º
item, o fórum depois do 8º), e não por data — eles não têm data que valha. Assim
a cronologia dos posts continua previsível, que era a decisão da §4.58.

- **Nunca no topo.** A Comunidade é das pessoas; abrir com o app oferecendo coisa
  inverte isso. Depois de três posts, quem chegou já leu gente antes de receber
  convite.
- **Nada é intercalado com menos de 4 itens.** Convite no meio de dois posts é
  tempero; no meio de um, é a tela inteira.
- **Só na lente "Todos".** A "Seguindo" responde a uma pergunta precisa — *o que
  fez quem eu sigo* —, e clube que ninguém que você segue mencionou não é resposta
  para ela.
- **Etiqueta obrigatória em cima** (*"começa em 3 dias — dá para entrar do
  começo"*, *"conversa no fórum"*). Sem ela o cartão lê como anúncio, e a pessoa
  passa a desconfiar do resto da lista. A etiqueta é o que separa convite de
  propaganda.

**Qual clube:** prefere o que **ainda vai estrear**, e aqui está a diferença para
a vitrine da tela de Clubes (que de propósito exclui esses, porque lá eles têm
prateleira própria). No feed não há prateleira, e clube que não começou é o de
maior valor para quem chega: dá para entrar no capítulo 1 em vez de alcançar a
turma no meio do livro. **Clube lotado não entra** — convite para porta fechada é
o beco sem saída da §4.23.

**Qual tópico de fórum:** por **atividade recente**, não por tamanho. Um fio com
40 respostas de três meses atrás está morto; um com 4 de ontem está acontecendo.
Fio seu não entra: você não precisa ser convidado para a conversa que você mesmo
começou.

---

## 4.65 O Seguindo, e a morte da aba Pessoas (30/07, noite)

Item 4 da ordem da §4.58, construído logo depois do item 3. A decisão que o
guiou é a **7 do quadro da §4.58**, e ela mexeu em três blocos de uma vez.

### O que cada lente responde — a regra que decide tudo o resto

- **Feed (Todos):** *o que se está dizendo na comunidade.*
- **Seguindo:** *o que andaram fazendo as pessoas que eu escolhi.*

Daí sai o resto sem discussão caso a caso: **post aparece nas duas**;
**atividade, só na Seguindo** (era a regra do Matheus na §4.53: *"o que não
aparece nos dois são atividades"*); **cartão de clube e de fórum, só no Feed**,
porque clube que ninguém que você segue mencionou não responde à pergunta da
Seguindo.

### A atividade voltou, mas num degrau abaixo

A §4.53 registra que **onze** maquetes morreram porque o feed era feito de
"fulano avaliou", "fulano está ouvindo" — texto sem corpo. Trazer isso de volta
com o mesmo peso visual do post desfaria a virada que salvou a Comunidade.

**A saída foi a hierarquia:** a atividade existe como **linha baixa** (avatar
pequeno, a frase, a capinha à direita), nunca como cartão. E ela entra **na mesma
cronologia dos posts**, não numa faixa separada — o dia de quem você segue é um
só, e partir a tela em duas listas obrigaria a pessoa a ler as duas para saber o
que aconteceu. Teto de 12 linhas: quarenta "recomendou" seguidos são a parede de
gente de novo.

### A aba Pessoas morreu, e cada bloco dela teve um destino

- **"Combina com você"** virou **cartão ocasional dentro da Seguindo**, com o
  motivo medido em cada pessoa. Como bloco fixo no alto de uma aba, era parede de
  perfis; como cartão, é sugestão em resposta a um contexto. **Entra mesmo em
  lista curta** (ao contrário dos cartões de convite): quanto menos gente você
  segue, mais ele serve — e ele é a saída do estado vazio.
- **"Ouvindo agora"** mudou de lugar, para a Seguindo, e passou a mostrar **só
  quem você segue**. É atividade, e atividade mora ali. **O que se perde, e fica
  anotado:** era a primeira coisa que se via na Comunidade e é a única vitrine
  que só um app de audiolivro tem — atrás de uma lente, quem nunca tocar em
  "Seguindo" não a verá. Se fizer falta, a saída é uma versão compacta no alto do
  Feed, **não** desfazer a regra.
- **"Todo mundo"** e a **fileira "Seguindo"** morreram, e com elas a aba: a
  Comunidade tem **duas** abas agora (Feed · Fóruns). Gente se descobre pelo que
  escreve — cada post traz o botão de seguir — e pelas sugestões.
  **Ressalva registrada:** com isso o app ficou **sem nenhuma lista de todos os
  leitores**, e a Busca hoje não procura pessoas. Se isso incomodar, o lugar
  dessa lista é a **Busca**, não uma aba da Comunidade.

---

## 4.66 O perfil girando em torno dos posts (30/07, noite) — item 6

A §4.56 registrou o diagnóstico do Matheus com todas as letras: *"os posts que a
pessoa escreveu têm que estar aqui no perfil, e não estão hoje. Isso é um erro
gravíssimo."* Ele estava guardado esperando o post existir no formato novo. Agora
existe.

### O que entrou

1. **Os posts vêm primeiro**, em cartão inteiro (o mesmo do feed), na sua página
   e na dos outros. Recomendação, clube e comentário **descrevem** a pessoa; o
   post **é** a pessoa falando — e quem abre um perfil quer ler isso.
2. **Dá para publicar do perfil** (o compositor no topo da seção), sem passar
   pela Comunidade. O post nasce ali e vai para o feed geral do mesmo jeito: o
   que se escreve é público (§4.53), e dois lugares de escrever com resultados
   diferentes seriam armadilha.
3. **Sem post nenhum, a seção não some na sua página** — some só na prévia de
   visitante. Sumir esconderia justamente o lugar de começar.
4. **O "Seguir" sai dos cartões dentro da página da pessoa** (`semSeguir`): o
   botão já está no alto, e repeti-lo em cinco cartões é oferecer cinco vezes a
   mesma coisa — a poluição que eu temia quando ele entrou no cartão (§4.58). No
   feed ele continua, porque lá cada cartão é de alguém diferente.

### As três portas, e as três páginas que elas precisavam (mesma noite)

O item 2 da §4.56 tinha ficado de fora por falta de destino — *"as páginas não
existem, e ícone sem destino é botão morto"*. O Matheus respondeu o óbvio:
**então crie as páginas**. Criadas, e os ícones entraram junto:

- **`/recomendacoes`** e **`/user/:slug/recomendacoes`** — a lista inteira, com a
  nota de cada livro. O "Editar" só aparece na sua e leva à tela que já existia
  (`/profile/recommendations`): aquela é onde se **monta** a lista, esta é onde se
  **lê** — e é a que um visitante vê.
- **`/comentarios`** e **`/user/:slug/comentarios`** — e aqui **comentário e post
  se separaram**. Antes o perfil tinha um "O que eu disse" que misturava os dois,
  cortado em três linhas. Agora o post tem o corpo do perfil e o comentário tem
  esta página; separar é o que deixa cada um ter a forma certa (cartão com capa ×
  linha com destino).
- **`/user/:slug/clubes`** — **só para os outros**, de propósito: os seus clubes
  já têm casa em `/clubes`, onde além de vê-los dá para criar e descobrir. Uma
  segunda página com metade daquilo seriam duas respostas para a mesma pergunta,
  o defeito que a §4.57 varreu do menu da Comunidade.

**As mesmas três portas na sua página e na dos outros**, num componente único
(`PortasDoPerfil`) — duas cópias divergem com o tempo, e foi assim que o perfil
dos membros ficou sem as novidades em 28/07.

**Duas decisões pequenas que vieram junto:**

- **O número faz parte da porta.** "12 recomendações" é o que faz alguém abrir;
  porta sem número não diz se há algo do outro lado. Porta com zero fica apagada
  mas **continua ali** — na sua página, ela é onde se começa.
- **"Recomendações" saiu da linha de números** nas duas páginas: a porta logo
  abaixo mostra o mesmo dado, e o mesmo número duas vezes na mesma tela é a
  redundância que a régua da casa proíbe. Ficaram os que só existem ali (horas,
  títulos) e seguidores, o único daquela linha que leva a algum lugar.

---

## 4.67 O curtir deixou de existir pela metade (30/07, noite)

A §4.58 registrou uma desconfiança do Matheus, medida e confirmada: **curtir
existia só na conversa do livro e no feed** — faltava no fórum e no mural do
clube. Ação que existe em metade dos lugares obriga a pessoa a **tentar** para
descobrir onde vale, e é assim que ela para de tentar em tudo.

**Agora existe um componente só** (`BotaoDeCurtir`), usado nos dois lugares que
faltavam. Ter um componente é o que impede a metade de voltar: quem criar a
próxima lista de falas usa ele, em vez de decidir de novo.

Três decisões que vieram com ele:

- **Alvo de toque grande** (`py-3 -my-3`), a lição da §4.63 aplicada antes de o
  defeito acontecer: o padding faz os 44px que Apple e Google pedem, e a margem
  negativa devolve o espaço ao layout.
- **Quem é o autor é a tela que diz**, não o formato do id (`deOutraPessoa`). No
  fórum e no mural os ids não seguem padrão que revele o dono, e adivinhar faria
  o app fingir curtidas no que **você** escreveu.
- **No mural do clube, o curtir fica debaixo do véu de spoiler**: curtir uma fala
  que você ainda não pode ler seria curtir no escuro.

### "Não ter servidor não impede" — a régua repetida pelo Matheus

Ele voltou ao ponto que já tinha vencido na §4.58 (item 8):

> *"A questão de não haver ainda um servidor não impede que você faça isso,
> porque o servidor vai existir já na segunda etapa do app."*

**Vale como régua permanente:** a ausência de back-end **não** é argumento para
não construir, nem para construir menos. O app inteiro é maquete esperando
servidor; se isso bloqueasse, bloquearia tudo. O que a falta de servidor muda é
só **de onde vem o número** — e isso é uma troca de fonte, não uma mudança de
tela. Quando aparecer a vontade de escrever "isto fica para quando houver
servidor", o certo é construir e deixar a fonte de dados isolada.

---

## 4.68 Convite para clube, com aceitar no sino (30/07, noite) — item 5

Última peça da ordem central da §4.58. Nasceu de uma das cinco capturas de
29/07 ("convidar alguém pela página dela"), aprovada pelos dois na hora; as
regras já estavam fechadas e foram construídas como estavam.

### As três regras, e o que cada uma evita

- **Qualquer membro convida** — não só o dono. Um clube cresce por quem já está
  dentro; exigir o moderador a cada convite faz dele porteiro, e o clube para de
  crescer quando ele dorme. **Remover continua sendo do dono:** convidar é abrir
  a porta, remover é moderação.
- **Clube lotado não pode ser convidado.** A vaga prometida não existe.
- **Ciclo começado também não.** Entrar no meio do livro é chegar numa conversa
  que já tem spoiler. Quem quiser entrar atrasado entra pela página do clube,
  sabendo disso — o que não pode é o app **convidar** para isso.

**O "não" aparece escrito, o clube não some da lista.** Esconder o clube que a
pessoa tinha em mente faz ela achar que o app perdeu alguma coisa; mostrar cinza
com *"o ciclo já começou"* ao lado responde antes da pergunta.

### Os dois lados existem — e um deles é simulado, de propósito

- **Você convida:** o convidado responde sozinho ~3 s depois, entra na turma e o
  sino acende. Mesmo recurso do comentário que recebe resposta (§4.62), e pelo
  mesmo motivo: sem ele, convidar cai no vazio e ninguém vê o ciclo se fechar.
- **Você recebe:** um convite semeado espera no sino, para o lado de aceitar não
  nascer morto.
- **Aceita quase sempre, mas não sempre** (1 em 4 recusa, por sorteio **estável**
  pelo id). Um app onde todo convite é aceito ensina errado — convidar passaria a
  parecer gratuito. E recusar não expõe motivo: recusar convite não deve cobrar
  explicação de ninguém.

### Detalhes que a tela cobrou

- **O convite é o segundo cartão que pede resposta** em vez de levar a algum
  lugar — o primeiro foi o pedido para te seguir (§4.55). Ficou com **a mesma
  forma**: perguntas iguais com desenhos diferentes fazem a pessoa reaprender o
  que já sabia. O que muda é o peso do sim, e por isso o cartão mostra o clube e
  quando ele estreia antes de você decidir.
- **Aceitar entra no clube dentro da lib**, não na tela: dois passos para uma
  decisão só é como se cria a tela que esquece o segundo e deixa a pessoa fora do
  clube achando que entrou.
- **Título errado, pego na tela:** o aviso de convite aceito dizia *"Marcos V.
  respondeu você"*, porque reusava o texto das respostas de comentário. É o mesmo
  defeito de descrição da §4.62 — aviso que descreve errado é pior que aviso
  nenhum.
- **`adicionarMembro` guarda quem entrou por convite à parte** (`convidados`), do
  mesmo jeito que os removidos: o esqueleto fica intacto e só a sua ação é
  gravada. Com servidor, vira um POST e a tela não muda.

---

## 4.69 O ciclo do clube fecha sozinho (30/07, noite)

Três peças da lista "fora do caminho crítico" da §4.58, e juntas elas resolvem
uma coisa só: **o clube continuar depois do primeiro livro**. O Matheus tinha
descrito o ciclo numa frase — *"muda o nome, escolhe o próximo livro"* — e
faltavam as duas metades.

### Renomear o clube

O nome era fixo desde a criação, e ele mente rápido: o clube nasce "Duna nas
quintas" e três livros depois não descreve mais nada. Agora o moderador troca
nome e descrição na tela de gerenciar, e vale para clube semeado **e** para clube
seu — guardado por fora (`renomeados`), como todo o resto, para o esqueleto ficar
intacto. **Nome vazio não passa:** clube sem nome não é citável com `@` nem
achável na busca.

### A votação passou a existir de verdade — e aceita de 2 a 5 livros

Até aqui só existia a votação **semeada**: num clube real, acabava o livro e não
havia como escolher o próximo — ou seja, a peça que existe para o clube não morrer
no fim do ciclo não funcionava fora do exemplo. Agora o moderador abre a votação
escolhendo os livros.

**De 2 a 5, com 3 sugerido**, e o argumento que fixou o 3 vale repetir porque é
contraintuitivo: *com 5 opções e 8 pessoas, o vencedor sai com 3 votos* — cinco
pessoas ficam com um livro que não escolheram. Mais opção parece mais democracia e
é o contrário. **O 5 só passou a caber porque quem perde ganhou saída** (abaixo).

**Empate: desempata o dono**, com os empatados nomeados na tela antes do botão.
Sortear seria mais "justo" no papel e pior na prática — ninguém entende de onde
saiu o resultado, e o clube tem moderador exatamente para o que a regra não fecha.

### Quem perdeu a votação funda o próprio clube

Nasceu de uma pergunta do Matheus: *"como essa pessoa vai para o outro clube?"*.
Ao encerrar, quem votou no derrotado vê *"3 pessoas também queriam X — criar um
clube desse livro?"*, e o formulário abre **já preenchido** (`/clubes/novo?livro=`),
com nome sugerido.

**Rejeitado, e continua rejeitado: mover gente de um clube para outro.** Mover
alguém sem que peça é decidir por ela. O que ficou faz o clube **se multiplicar**
— não porque encheu, mas porque um grupo queria outro livro.

### A lista de espera: clube cheio deixou de ser porta fechada

Antes, clube lotado terminava numa frase — *"este clube está cheio"* — e nada
mais: quem se interessou não tinha o que fazer, e o moderador **nem ficava
sabendo** que havia gente querendo entrar. Agora há fila, com a sua posição
visível, e ela **anda sozinha**: quando alguém sai ou é removido, o primeiro
entra (`chamarOProximoDaFila`, chamada de dentro de `sairDoClube` e
`removerMembro` — a tela não precisa lembrar).

- **Teto de 250** (número do Matheus). Não é limite técnico: é o ponto em que uma
  fila deixa de ser promessa e vira mentira.
- **A fila fictícia é estável e proporcional** (semente pelo id do clube): fila
  sempre vazia esconderia o que a peça significa — entrar atrás de 6 pessoas é
  diferente de entrar atrás de 1.
- **Do lado do moderador**, a seção só aparece quando há alguém esperando, e
  "Admitir" só funciona com vaga aberta. Sem vaga, a tela **diz o que fazer**
  (aumentar o limite) em vez de apagar o botão — que foi a resposta do próprio
  Matheus quando propus a "turma 2" automática, e a razão de ela continuar
  rejeitada.

**A lista da §4.58 acabou:** os seis itens "fora do caminho crítico" estão
construídos (os trechos quentes ficaram na §4.71).

---

## 4.70 Presença por capítulo (30/07, noite)

O item 8 da §4.58 — a peça que **eu era contra e perdi o argumento**, e que por
isso vale registrar com cuidado.

### O que ficou construído

Na ficha do livro, "quem está neste livro": as pessoas com quem você tem
**seguimento mútuo** que estão ouvindo aquele título, cada uma com **o capítulo**
e uma barra de progresso. Some sozinha quando não há ninguém.

### As quatro travas, e o que cada uma protege

1. **Opcional**, e **nasce desligada** — o único interruptor do app assim.
2. **Recíproca:** com o interruptor desligado a função devolve lista vazia. A
   regra mora na lib (`presenca.ts`), não na tela: regra de privacidade
   espalhada por telas é regra que a próxima tela esquece.
3. **Só entre quem se segue nos dois sentidos.** Mostrar onde você está para
   alguém que você não escolheu ver seria dar sem receber.
4. **Grossa: capítulo, nunca segundo.** Foi a condição que eu defendi e que
   ficou. Entrega quase todo o valor — *tem gente perto de mim neste livro* — e
   tira o que é de fato sensível: presença ao vivo revela **rotina** (a que horas
   você acorda, se dormiu fora, quando sumiu por três dias).

### O convite honesto, que é o que faz a peça existir

Com o interruptor desligado, a ficha mostra *"1 pessoa que você segue e que te
segue de volta está ouvindo este livro"* e o botão de ligar. **Sem isso o
interruptor pediria um sim no escuro** — ninguém liga um recurso de privacidade
sem saber o que ganha. A contagem não vaza nome nem capítulo.

**Anotado, e continua valendo:** a reciprocidade **pressiona** — quem não liga
fica cego. É bom mecanismo e não é neutro, e é exatamente por isso que o padrão
é desligado.

---

## 4.71 Trechos quentes (30/07, noite)

Último item da §4.58. É a vitrine que só um app de audiolivro pode ter: não "os
livros mais falados" — isso qualquer catálogo mostra —, e sim **os 40 segundos
que fizeram alguém parar o carro**.

- **O calor vem dos dois lugares onde um trecho existe:** anexado a um post
  (curtidas do post) e citado num comentário da conversa do livro (curtidas do
  comentário, que já existem em `comments.ts`).
- **Duas vozes valem mais que curtidas soltas.** Um pedaço que duas pessoas
  cortaram por conta própria é mais quente que um post popular — e trechos que
  caem no mesmo bloco de 30 segundos são o mesmo pedaço, com os calores somados.
  Sem isso, dois cartões quase idênticos lado a lado leriam como defeito.
- **O cartão toca no lugar**, e a frase de quem cortou vem junto: player solto no
  meio do feed é botão sem promessa.
- **Um trecho só não vira cartão.** Com um item, o carrossel é um player com
  etiqueta pomposa, e "circulando" passa a ser mentira.

**O nome perdeu o "da semana", de propósito.** A §4.58 pediu "trechos quentes da
semana", mas com pouca gente sete dias devolvem lista vazia quase sempre — e
rótulo que promete uma janela que os dados não têm é mentira pequena que corrói a
tela. A janela é de 15 dias e o título diz "estão circulando". Quando houver
movimento de verdade, a janela aperta e o nome pode voltar.

---

## 4.72 Auditoria: o que foi decidido e não chegou à tela (31/07)

**Pedido do Matheus, e a queixa que o originou** — *"perdemos muito tempo
construindo a aba Comunidade e ela não ficou boa. Tem muita coisa que estava no
roteiro ou que eu conversei que não foi para a aba. Tem muita coisa que era pra
ser tirada e não foi tirada, e muita coisa que era pra ser colocada e não foi
colocada."*

Fui conferir **decisão por decisão** das §4.53 a §4.58 contra o código. O
resultado abaixo é o que a leitura mostrou, sem defesa: o que está de pé, o que
foi decidido e nunca construído, e — a parte mais importante — **por que a tela
parece vazia mesmo com o código lá dentro**.

### 1. Decidido em detalhe e nunca construído: o menu "…" da Comunidade

A **§4.57 inteira** foi uma conversa longa que terminou com uma regra escrita:

> *"O '…' da Comunidade só leva ao que é da comunidade. O que é seu mora no
> avatar."* — e o conteúdo dele: **criar um clube, criar um fórum, todos os
> clubes, todos os fóruns, quem te segue / quem você segue.**

**Não existe menu nenhum na Comunidade.** Nem o botão. A decisão que mais tempo
tomou naquela conversa é a única que não virou uma linha de código.

### 2. A organização do topo saiu diferente da combinada

A mesma §4.57 fechou: *"A Comunidade abre no feed, sem fileira de ícones no topo.
**Feed · Seguindo são as únicas coisas fixas ali**"*, com clube e fórum indo para
o menu **e** para o feed como cartões.

O que existe hoje são **duas** fileiras de pílulas empilhadas: em cima
`Feed · Fóruns`, embaixo `Todos · Seguindo`. Ou seja, a aba de fóruns que a
decisão mandava para o menu virou **um separador fixo no topo** — exatamente a
"fileira que parece menu de banco" que ele rejeitou —, e ainda ganhou uma segunda
fileira embaixo. **Dois critérios em duas fileiras é a régua da casa cumprida
pela metade:** cada fileira tem um critério só, mas a de cima não deveria existir.

### 3. A pergunta ficou pela metade: falta "responder com um livro"

A §4.58 fechou o item 2 assim: *"Pergunta é um tipo de post, **com selo e
'responder com um livro'**"*. E a avaliação das cinco capturas classificou essa
peça como **"a melhor das cinco"**, com o motivo: *"a resposta carrega um
objeto"*.

Construído: o selo, a página `/perguntas`, o filtro "sem resposta". **Não
construído: a resposta com o livro dentro, e a "melhor resposta".** O comentário
hoje é texto puro — mencionar um livro com `@` ali vira link, nunca capa —, e não
há como o autor da pergunta marcar qual resposta resolveu.

É a diferença entre uma pergunta de fórum e o que o AllBook queria ter: a
resposta que **é** um livro, com capa, que você toca e vai ouvir.

### 4. O sino não sabe que curtiram você

A §4.58 registrou, na resposta à dúvida 2: *"ser notificado das interações
(curtiram, comentaram, responderam ao seu comentário)"*, com a regra fina já
decidida — **curtidas chegam agrupadas** (*"Ana e mais 3 curtiram seu post"*,
nunca um aviso por curtida) e **descurtida não notifica**.

Só o **comentário** notifica. Curtir não gera aviso nenhum, agrupado ou não.

### 5. O play do trecho compacto continua morto

Registrado na §4.60 como **"A construir"** e não feito: no cartão de citação
compacto o play é desenhado e não toca (vale no compositor, na folha "Seus
trechos", no mural do clube e na resposta do fórum).

### O achado que explica a sensação: quase tudo tem uma condição para aparecer

Isto é o mais útil da auditoria, e é uma crítica ao **meu** critério, não ao dele.
Cada peça foi construída com uma trava sensata — e somadas elas fazem a
Comunidade mostrar muito menos do que tem:

| Peça | Só aparece se… |
| --- | --- |
| "Ouvindo agora" | você estiver na lente **Seguindo** e seguir alguém ouvindo algo |
| "Combina com você" | lente **Seguindo** |
| Trechos quentes | houver **2+** trechos **e** o feed tiver 5+ itens |
| Cartão de fórum | o feed tiver **8+** itens |
| Cartão de clube | o feed tiver 4+ itens e houver clube aberto |
| Porta de perguntas | houver pelo menos uma pergunta |
| Presença por capítulo | interruptor **ligado** (nasce desligado) e seguimento **mútuo** |

Cada "some quando não há dado" foi defendido, um por um, com a §4.23 (nada de
botão morto, nada de sala vazia). **O erro não está em nenhum deles isoladamente
— está na soma.** Numa maquete com nove posts e pouca gente, metade das travas
não bate, e o resultado é uma tela que parece não ter recebido o que se discutiu
por horas. Quem abre a Comunidade vê posts e mais nada; tudo o mais está atrás de
uma lente, de uma contagem mínima ou de um interruptor desligado.

**Consequência para o que vier:** trava de aparecimento precisa de **estado
vazio com conteúdo**, não de sumiço. Sumir é honesto e invisível ao mesmo tempo —
e invisível, para quem decidiu a peça, é indistinguível de não construído.

### O que está de pé (para o quadro ser justo)

Post com objeto · compositor com `@` · quatro formas de cartão · duas lentes ·
curtir/comentar raso/compartilhar · editar com selo · apagar · denunciar · seguir
no cartão · página `/post/:id` · `/perguntas` · atividade em linha · cartões de
clube e fórum · trechos quentes · convite de clube com aceitar no sino · perfil
girando em torno dos posts com as três portas · presença por capítulo.

---

## 4.73 O descurtir volta, e quem reagiu ganha rosto (31/07)

Primeiro item consertado da auditoria da §4.72, e ele começa com **um erro meu que
o Matheus pegou de memória**: *"a gente discutiu a questão de curtir e descurtir,
que também não está. E ver as pessoas que curtiram e as que não curtiram também
tinha que ser feito."*

### O erro: eu reabri uma decisão dele sem fato novo

Em **21/07** ficou decidido, e o roteiro registrou com todas as letras:

> *"Curtir e descurtir são tudo engajamento."* · *"Polêmica engaja — gerar
> sentimento, bom ou ruim, é o que faz a pessoa se interessar."* · **"Risco
> conhecido e aceito (o Claude discordou duas vezes, o Matheus decidiu, e está
> decidido)… Não reabrir sem fato novo."**

Em **29/07** (§4.59) eu escrevi `lib/curtidas.ts` sabendo **só curtir**, e chamei
isso de *"decisão nova, tomada construindo"*, com o argumento de que *"um contador
de não gostei embaixo de uma fala azeda o feed"* — **que é exatamente o argumento
derrubado duas vezes em 21/07**. Não havia fato novo. E a §4.58 ainda mandava o
contrário: levar `reactions.ts`, que tem **os dois lados**, para o fórum, o mural
do clube e a Comunidade. A §4.67 levou metade e comemorou o fim da metade.

**A lição, que vale mais que o conserto:** "decisão tomada construindo" é um
carimbo perigoso. Ele é legítimo para o que ninguém decidiu; vira atropelo quando
o assunto **já tem decisão dele registrada**. Antes de escrever essa frase, o
certo é procurar o assunto no roteiro.

### As duas correções dele, no mesmo minuto

Construído o par, ele olhou a tela e cobrou duas coisas — as duas certas, e as
duas sobre **coerência**:

1. *"Não faz sentido ter um coração para curtir e um polegar para descurtir —
   dois critérios para a mesma coisa."* Eram duas metáforas empilhadas no mesmo
   par.
2. *"O botão azul não harmoniza com nada no aplicativo."* Eu tinha inventado um
   azul para o negativo, numa paleta que é laranja/âmbar sobre quase-preto.

**A resposta já estava dentro do app:** a conversa do livro faz isso desde 21/07 —
`ThumbsUp`/`ThumbsDown`, **âmbar** no positivo, **branco** no negativo. Copiar
aquilo não é falta de ideia: é a régua da §4.67 (a mesma ação, com a mesma cara,
em todo lugar). O negativo se distingue por **peso**, não por matiz.

### A linha de recepção — a resposta ao pedido de audácia

No meio disso ele disse: *"sinto pouca audácia; você poderia ser mais audacioso e
mais criativo."* Dois contadores ao lado de dois ícones é o mínimo que qualquer
app faz. O que entrou no lugar:

- **Os rostos de quem reagiu**, empilhados em 20px, com a frase escrita — *"Você e
  mais 3 gostaram · 1 discordou"* —, e a linha inteira é o alvo que abre a lista.
  **Não é o feed "sobre pessoas" que falhou onze vezes** (§4.53): as pessoas não
  são o conteúdo, são a **recepção** dele. E responde o que número nenhum
  responde: *quem?*
- **A barra de divisão só aparece quando houve os dois lados.** Post que só
  agradou não precisa de gráfico; post que **dividiu** ganha uma linha de duas
  cores — e aí ela significa alguma coisa. Elemento que só existe quando carrega
  informação.
- **Os números saíram de dentro dos botões do post.** A barra de ações ficou com
  quatro ícones limpos, e o alvo de cada um cresceu.

### O que a lista aberta obrigou a consertar por baixo

**Número solto podia mentir; número com lista, não.** Enquanto só havia contador,
ele saía de uma semente e ninguém conferia. Com a lista, 15 curtidas numa
comunidade de 13 pessoas é uma mentira que a própria tela denuncia no primeiro
toque. Então:

- **`quemReagiu` virou a fonte, e o número é o tamanho dela** — nunca divergem.
- **As duas listas saem de uma permutação só**, embaralhada pela semente do id:
  assim ninguém aparece **nos dois lados** da mesma fala.
- **A descurtida é uma fração da curtida** (até ~35%), nunca um sorteio
  independente. Visto na tela: com os dois sorteados à parte, o primeiro post do
  feed saiu *"3 curtiram · 3 descurtiram"* — número possível e leitura errada.
- **O autor não reage a si mesmo** (`autorSlug`), detalhe que só ficava visível
  quando a lista abria.

### Onde ficou

Post, comentário de post, resposta de fórum e mural do clube — o mesmo componente
(`Reacoes`), com a folha `QuemReagiu`. **E a conversa do livro entrou junto**: lá
os dois botões existiam desde 21/07 e o número não levava a lugar nenhum.

Duas coisas que só a conversa do livro exigiu, porque lá os contadores são
**curados** (escritos à mão em `comments.ts`):

- **A lista aceita o total de fora** (`totais`), em vez de sortear o seu — senão a
  folha abriria com sete nomes debaixo de um "12".
- **"E mais N leitores" no fim.** Um comentário com **27** curtidas existe numa
  comunidade fictícia de 26 pessoas. Havia três saídas e duas eram ruins: baixar o
  contador (apagaria dado escrito à mão) ou mostrar 26 nomes debaixo de um "27" e
  torcer para ninguém contar. A terceira é o que qualquer rede faz quando não
  carrega todo mundo — **dizer quantos faltam**.

---

## 4.74 A aba Fóruns vira o Orkut — decisão e escopo (31/07)

**Decisão do Matheus, dita duas vezes e sem margem:**

> *"A gente vai fazer tudo tal e como era no Orkut: replicar tudo, com todas as
> coisas iguais. Não vamos fazer nada de diferente."* · *"Inclusive as imagens,
> tudo tal. Esquece o aplicativo, esquece tudo. Copiar tudo, layout, tudo — não
> só regras de governança. Depois nós editamos."*

A segunda frase corrige a minha primeira leitura, que era **estreita**: eu tinha
entendido "governança do Orkut com a cara do AllBook" e comecei por aí. Não é
isso: é a **aba inteira com a cara do Orkut**.

### O que isso reverte, e fica registrado

1. **§4.44 — "quem cria modera o conteúdo, não a casa".** Aquela decisão dizia
   que o dono **não** pode apagar um fórum com gente dentro, porque ali está o
   trabalho de outras pessoas. No Orkut o dono **excluía a comunidade inteira**, e
   é o que passa a valer. O argumento antigo continua bom e está aqui para o caso
   de ele querer voltar.
2. **A identidade visual da casa não vale nesta aba.** O AllBook é escuro,
   laranja, Outfit/Inter. As comunidades são **brancas, azuis, Verdana 11px**, com
   caixas de cabeçalho azul-claro e links sublinhados. As peças estão num arquivo
   só (`components/forum/Orkut.tsx`) justamente para a mistura não vazar.
3. **O cabeçalho e o menu do app somem em `/forum/*`.** Duas identidades na mesma
   tela seriam pior que qualquer uma das duas. A saída é a barra azul do topo, que
   tem "voltar ao app" — o Orkut também tinha a navegação dele.
4. **A imagem da comunidade é enviada de verdade.** Eu tinha proposto emoji ou
   capa de livro, alegando a rejeição de upload da §4.58; ele corrigiu, e estava
   certo — **aquela rejeição era sobre outra coisa** (upload num feed público
   custa servidor, banda e moderação de imagem). Aqui a foto é escolhida pelo dono,
   **encolhida no próprio navegador** (canvas, 140×140, JPEG ~8 KB) e guardada como
   `data:` URL. Zero servidor.

### O que já está construído (31/07)

- **`lib/forum.ts`** — a governança inteira, guardada por fora do esqueleto:
  dono, moderadores, banidos, fila de pedidos, convidados, tipo de entrada
  (aberta · moderada · fechada), visibilidade (pública · privada), trava de
  criação por tipo de conteúdo, transferência de propriedade e exclusão.
- **A página da comunidade** (`/forum/:id`), no layout de lá: imagem quadrada à
  esquerda, ficha com `categoria / criada em / dono / moderadores / tipo / idioma
  / membros`, os links de ação com «», a grade de membros e a tabela de tópicos.
- **Editar comunidade** (`/forum/:id/gerenciar`) com os dez poderes da lista dele.

**A fila de pedidos é semeada** (estável, pelo id): fila sempre vazia faria
"aprovar" e "recusar" nascerem botões mortos — o mesmo argumento da lista de
espera do clube (§4.69).

### A aba inteira, construída no mesmo dia

Tudo o que faltava entrou logo depois:

- **`/forum`** — a lista, na grade de imagens quadradas do Orkut, com busca,
  filtro por categoria, "minhas comunidades" primeiro e criar.
- **`/forum/:id/topico/:id`** — o fórum de lá: mensagens **numeradas**, foto
  quadrada do autor à esquerda, data à direita, **paginação de 10 em 10** e a
  moderação em linha de links (marcar spoiler · remover).
- **`/forum/:id/membros`** — a lista completa, na ordem dono → moderadores → resto.
- **Enquetes** — 2 a 10 opções, um voto por pessoa que **muda de ideia**, barra de
  porcentagem e encerrar. Em `lib/forumConteudo.ts`.
- **Eventos** — data, hora, local, descrição e as três respostas de lá (**vou ·
  talvez · não vou**), com o bloco de data quadrado.

**A aba "Fóruns" da Comunidade deixou de ser aba e virou destino:** tocar nela
leva a `/forum`. Meia comunidade dentro da moldura escura seria a mistura que a
decisão dele manda evitar.

Três coisas que a construção resolveu e vale registrar:

- **Moderação de conteúdo passou a valer para moderador**, não só para quem criou
  o fórum. A checagem em `grupos.ts` é um **espelho** curto da regra de
  `forum.ts` — as duas libs não podem se importar em ciclo, e a alternativa
  (extrair o esqueleto para um terceiro módulo) não se paga por dez linhas.
- **Os polegares de curtir sumiam no fundo branco** (`text-white/40` sobre
  branco): o `Reacoes` ganhou variante `claro`. Defeito que só a tela mostra.
- **Enquete sua nasce com zero voto**, e só a semeada tem votos fictícios —
  mesma regra das curtidas (§4.73): fingir que doze pessoas votaram no que você
  acabou de perguntar é a mentira mais fácil de perceber.

### A pele voltou a ser a do AllBook, no fim do mesmo dia

Horas depois de a aba ficar pronta em branco e azul, o Matheus mudou o rumo de
novo — e desta vez pelo caminho que faltava:

> *"Sem mexer nessa questão das funções, vamos deixar essa página com a cara do
> AllBook, seguindo os mesmos layouts. Vamos deixar mais ou menos no mesmo
> formato."*

**A distinção que isso cria é a coisa mais útil desta seção inteira:**

- **A pele saiu:** nada de branco, azul, Verdana 11px, caixa com cabeçalho
  azul-claro, avatar quadrado. Voltou o #141414, o laranja, Outfit/Inter, os
  cantos de 12–16px, o avatar redondo com gradiente e o cabeçalho da casa.
- **A estrutura ficou inteira:** a ficha com os mesmos campos e na mesma ordem, a
  grade de comunidades, a lista de tópicos, a mensagem **numerada** com autor à
  esquerda, a **paginação de 10 em 10**, a enquete com barra e porcentagem, o
  evento com **vou · talvez · não vou**. **E a governança não foi tocada** — era a
  condição dele.

Ou seja: **o que o Orkut ensinou sobre como organizar uma comunidade ficou; o que
ele tinha de 2004 na aparência, não.** Vale como método para a próxima vez que a
referência for um produto antigo.

Três decisões pequenas na conversão:

- **A trava "quem pode criar" virou interruptor**, não menu: são dois estados, e
  um menu de dois itens pede um toque a mais para dizer a mesma coisa.
- **O número da mensagem ficou** (`#7`, apagado no canto). Era o que permitia
  *"concordo com a 7"* num fio de quarenta, e nenhuma rede moderna tem substituto.
- **O cabeçalho e o menu do app voltaram** a `/forum/*`: sem a pele de fora, não
  havia mais motivo para esconder a navegação da casa.

### O que ainda não existe

**Convidar amigos** (o Orkut tinha, e depende de uma lista de quem convidar), a
**denúncia com destino** (hoje o link só confirma) e a **paginação da lista de
comunidades**. Nada disso está pendurado na interface como botão morto.

---

## 4.75 Os leitores ganharam rosto, e as comunidades ganharam capa (31/07)

> ⚠️ **Esta seção descreve a primeira versão, que o Matheus reprovou inteira.**
> O que valeu está logo abaixo, na **§4.76** — leia as duas juntas: a primeira
> registra três raciocínios meus que pareciam bons e estavam errados.

Pedido do Matheus: *"crie caras para os perfis… imagens mesmo, como se fosse uma
pessoa real. Pode ser uma pessoa real também, não sei. E também imagens das capas
das comunidades que condizem com o que ela está dizendo."*

### Os rostos: gerados, não fotografados — e por quê

24 rostos, um por leitor de `community.ts`, baixados uma vez por **`npm run
caras`** (DiceBear, estilo `notionists`, PNG transparente).

**Ele abriu a porta para foto de gente real e eu não usei, de propósito.** Pôr o
rosto de alguém como perfil de um leitor fictício é usar a imagem de uma pessoa
que não escolheu estar ali — e tudo o que a "Ana Paula" escreve no app passa a
sair da cara dela. Rosto **fotorrealista gerado** (thispersondoesnotexist e
similares) resolveria isso e era a minha primeira escolha; **todas as fontes que
testei estão fora do ar ou bloqueadas**. Ilustração gerada é o que dá cara sem
tomar a de ninguém.

- **Estilo escolhido com folha de comparação** (cinco estilos, os mesmos seis
  leitores). `notionists` ganhou por duas razões: traço adulto, que não infantiliza
  um app de audiolivro; e **licença CC0** — `lorelei` e `micah` são CC BY e
  exigiriam crédito visível na tela.
- **Fundo transparente, e isto é a decisão de desenho:** o rosto entra **por cima
  do gradiente** que cada leitor já tem. O gradiente identifica a pessoa de
  relance desde sempre; trocá-lo pelo rosto seria perder informação para ganhar
  outra. Quem não tem arquivo continua na inicial — nenhuma tela precisou saber
  da diferença.

### As capas: o mosaico das capas dos livros, não foto de banco

**A primeira tentativa foi baixar foto temática (LoremFlickr) e ela morreu na
conferência**, por dois motivos independentes:

1. **Busca por etiqueta erra feio.** "noir, detective" devolveu um boneco do
   Bender de chapéu; "old, books, library" devolveu a fachada de um prédio.
2. **A licença não serve.** As fotos vieram com marca d'água `cc-nc-nd` — **não
   comercial, sem derivados** — e o nome do autor queimado no canto. Num app que
   vai ser vendido, é impróprio.

**O que ficou é melhor e é do próprio produto:** a capa de uma comunidade é o
**mosaico de quatro capas** dos livros de que ela fala, montado na tela. A capa de
livro é a peça de design mais cuidada do AllBook (§4.59), não custa download nem
licença de terceiros, e acompanha o catálogo sozinha.

- **Os livros são escolhidos à mão**, porque gênero não basta: "Quem ouve no
  trânsito" não é um gênero, e "Clássicos" pega livros de gêneros diferentes (1984,
  Orgulho e Preconceito, A Revolução dos Bichos, Razão e Sensibilidade).
- **Comunidade criada por você não recebe mosaico** — fica o emoji que você
  escolheu até enviar uma imagem. Inventar capa para ela seria o app decidir do
  que ela fala.

**Defeito meu, pego na tela:** o script achou 8 dos 24 leitores na primeira
execução e não reclamou, porque o regex exigia `slug:` no começo da linha e
metade dos membros está escrita numa linha só. Falha silenciosa é a pior — o
resultado *parecia* certo.

---

## 4.76 A crítica que derrubou a §4.75 inteira (31/07)

O Matheus olhou o que a §4.75 produziu e reprovou os três pontos:

> *"Esse tá um avatar fictício, não é o que eu queria. Eu queria realmente o
> rosto de pessoas que parecessem pessoas."*
> *"Clico no perfil da Ana Paula e não aparece nenhuma imagem. Clico nos membros
> dos fóruns e não aparece nada disso."*
> *"Você ainda usou as capas de livros das comunidades. Não era para ser isso. A
> pessoa tem que poder carregar foto do que ela quiser."*

**Os três estavam certos, e cada um por um motivo diferente. Vale separar.**

### 1. Ilustração no lugar de foto — eu troquei o pedido por uma objeção minha

Ele pediu rosto de pessoa; eu entreguei ilustração, alegando que usar o rosto de
alguém real num perfil fictício toma a imagem de quem não escolheu estar ali. A
objeção é legítima e está registrada — **mas ele já a tinha respondido antes**
(*"pode ser uma pessoa real também"*), e eu construí como se não tivesse.

**A regra que fica:** levantar a objeção uma vez é obrigação; **decidir por ela
depois de ele responder é trocar o pedido dele pelo meu.** Agora são fotos de
rosto de um banco de protótipo, com o gênero casado ao nome de cada leitor.

### 2. "Aparece aqui e não ali" — o erro era o método, não o lugar

Eu tinha posto a foto **em quatro telas, à mão**. O app desenha a mesma bolinha
com inicial em **vinte e cinco lugares** — perfil da pessoa, sino, conversa do
livro, quem curtiu, clube, mural, seguidores, sugestões… Trocar um a um é como a
metade volta, e é exatamente o defeito que a §4.67 já tinha cobrado com o curtir.

**O conserto foi mudar de ferramenta:** `avatarDeLeitor(slug)` devolve um `style`
que pinta a foto **no fundo do próprio elemento** e apaga a letra. Cada avatar
precisa de **uma linha** e mantém tamanho, forma e borda que já tinha — 25
lugares consertados de uma vez, sem reescrever marcação nenhuma.

### 3. Capa de comunidade não é prateleira

Meu mosaico de capas de livro era elegante e estava **errado sobre o que a peça
significa**: a capa de uma comunidade diz *do que se fala ali*, não *o que se lê*.
Agora são cinco fotos escolhidas uma a uma, olhando — rua molhada à noite,
rastros de trânsito, estante antiga, a Nebulosa de Órion, trilha com névoa. Todas
**CC0 ou domínio público**, uso comercial liberado, sem marca d'água.

**E o dono troca por qualquer foto**, na tela de gerenciar: a imagem enviada
sempre ganha da que veio pronta. Isso já existia e continua — era a parte do
pedido que eu tinha atendido.

---

## 4.77 "Eu pedi para mudar o layout, você mudou tudo" (31/07)

> *"Eu pedi para você fazer a aba da comunidade idêntica à do Orkut. Agora eu
> peguei apenas para você mudar o layout, e você simplesmente mudou tudo. Já não
> é mais a parte de como era no Orkut."*

**Ele está certo, e eu tinha escrito o contrário no commit** (*"com a estrutura
intacta"*). Fui conferir contra a versão anterior, em vez de confiar na memória,
e achei **cinco mudanças de estrutura** que eu não tinha percebido fazer:

| O que era | O que eu fiz | Restaurado |
| --- | --- | --- |
| Ficha com 7 campos | `categoria` e `membros` viraram subtítulo | os 7 campos, na ordem |
| Links de ação em lista (`» participar`, `» denunciar`, `» editar`) | botão "Participar" + linha pequena + ícone de engrenagem | a lista, um por linha |
| Grade de membros | fita que rola de lado | a grade |
| Tabela de tópicos com coluna **msgs** | lista com seta | a tabela |
| Mensagem em linha numerada | **bolha de chat** com avatar ao lado | a linha numerada |
| Caixa "buscar comunidades" com `criar comunidade »` | campos soltos no topo + botão "Criar" | a caixa |
| "minhas comunidades" / "outras comunidades" | "Suas comunidades" / "Descobrir" | os nomes de lá |
| Membros em grade de 3 colunas | lista vertical | a grade |

### A lição, que vale além desta tela

**"Trocar a pele" tem uma fronteira, e ela não é óbvia enquanto se escreve.** Cor,
fonte, canto e sombra são pele. **Já é estrutura:** que campos existem e em que
ordem; se uma ação é link ou botão; se uma coleção é grade, fita ou tabela; se
uma coluna de dado aparece; e como um item da lista se organiza por dentro.

Eu atravessei essa fronteira **oito vezes** achando que estava escolhendo cores —
e cada uma parecia uma melhoria isolada, o que é justamente o que torna o erro
difícil de ver de dentro.

**A regra que fica:** conversão de aparência se faz **comparando com a versão
anterior, elemento por elemento**, não reescrevendo a tela do zero com a paleta
nova. Reescrever do zero é o que faz a estrutura se perder sem ninguém decidir
perdê-la.

O cabeçalho de `Grupo.tsx` e o de `Topico.tsx` agora **listam a estrutura** que
tem de ficar de pé, para a próxima conversão ter contra o que conferir.

---

## 4.78 A busca de comunidades não era grade de quadradinhos (31/07)

> *"Quando você clica em Comunidade tem só uns quadradinhos, e eu acho que não
> era assim no Orkut… não era bem assim que era para você pesquisar na aba de
> comunidade. É isso que tem que ser totalmente reformulado."*

**Ele está certo, e a confusão foi minha: no Orkut eram duas coisas diferentes,
e eu usei uma delas para as duas.**

| Onde | Forma | Por quê |
| --- | --- | --- |
| **Minhas comunidades** | grade de miniaturas | você já conhece; a imagem basta para reconhecer |
| **Buscar comunidades** | **lista em linhas** | você **não** conhece: precisa da descrição e do tamanho para escolher |

Num quadradinho de 68px não cabe descrição nenhuma — e escolher entre dez nomes
sem ler o que cada comunidade é, com quantas pessoas, é chute. Era exatamente o
que a minha tela pedia.

### Como ficou

- **Caixa de busca** com o campo, o **"buscar em"** (nome · descrição · ambos) e
  o filtro de categoria — a roleta que o Orkut tinha ao lado do campo.
- **Minhas comunidades** continua em grade, que ali é a forma certa.
- **O resultado vira lista**: miniatura de 56px, **nome em link**, a descrição em
  até duas linhas, e `N membros · N tópicos · categoria`.
- **Contagem de resultados** no cabeçalho e **paginação de 10 em 10**, as duas de
  lá.

**A regra por trás, que vale para qualquer lista do app:** *grade é para o que se
reconhece; lista é para o que se lê antes de escolher.* Foi o terceiro erro
seguido meu na mesma aba (§4.76, §4.77 e este) e os três têm a mesma raiz —
**decidir a forma pelo que fica bonito, e não pelo que a pessoa precisa saber
naquele momento.**

---

## 4.79 O evento aponta para o clube — e o clube continua sem hora (31/07)

> *"Aqui existe a possibilidade de criar um evento, como era no Orkut? Mas, por
> exemplo, se eu criar um evento convidando uma pessoa para ir para o clube de
> leituras, eu consigo linkar isso a um clube? Como é que funcionaria isso?"*

**O que existia:** evento de comunidade completo (título, data, hora, local,
descrição, *vou · talvez · não vou*) em `forumConteudo.ts`. **O que não
existia:** qualquer ligação com clube — o evento só guardava `grupoId` — e
**convidar uma pessoa** (o `convites.ts` convida para **clube**, que é outra
coisa).

### A pedra no caminho, e ela é a decisão dele de duas semanas atrás

A §4.39 decidiu que **o encontro do clube não tem hora marcada**: quem ouve
audiolivro ouve dirigindo, na academia, às 23h, e "quinta às 20h" exclui
exatamente o comportamento que o app cultiva. O encontro é uma **rodada** de dois
ou três dias.

E o clube **já tem** um `ciclo.encontro`, usado em `avisosDeClube.ts`, na tela
`Clubes` e no `NovoClube`.

**Rejeitado, então: dar ao clube um "evento" próprio com data e hora.** Nasceriam
**dois encontros** no mesmo clube com o mesmo nome, e os avisos passariam a falar
de duas coisas diferentes. Quem chegar depois e propuser isso de novo: é aqui que
já foi respondido.

### O que foi feito — ligação de mão única

| Peça | Onde | O que faz |
| --- | --- | --- |
| **Anexo** | `Evento.clubeId` | ao criar o evento, um seletor "este evento é sobre um clube?" com **meus clubes** e **outros clubes** |
| **Cartão** | dentro do evento | capa do livro do ciclo, nome, `N pessoas · começa em…`, e a saída certa: *entrar no clube* / *você está dentro* / *ver o clube* quando está cheio (a fila mora lá) |
| **Convite** | `convitesDeEvento.ts` | chamar alguém para o evento; ela responde em ~3s (60% vai, 20% talvez, 20% não), a contagem sobe e o sino acende |
| **Vitrine** | página do clube | "Encontros marcados", só os que ainda não passaram, com a comunidade onde foram marcados |

**A frase no rodapé da vitrine não é enfeite:** *"Encontro marcado tem hora e é
combinado numa comunidade. A rodada do clube continua sem hora — você responde
quando der."* Sem ela, as duas coisas viram uma só na cabeça de quem lê, que é
justamente o que a §4.39 evitou.

**Regras do convite:** quem participa convida (não só o moderador); em comunidade
**privada** só dá para chamar quem já é da turma — chamar alguém para um evento
que ela não pode nem abrir é o beco sem saída da §4.23; e o convite **não** dá
entrada no clube nem no fórum: entrar continua sendo decisão de quem entra.

**Quarto destino de notificação:** `forumId`, para o aviso de resposta abrir
`/forum/:id` — os outros três eram livro, post e clube.

### Um bug de estado achado no teste

`Grupo.tsx` tinha `key={versao}` no corpo da página: a cada `GRUPOS_EVENT` a
árvore inteira **remontava**, e remontar **apaga o estado dos filhos**. Na tela
isso aparecia como a lista de convidar fechando sozinha depois de cada convite —
mas o mesmo apagaria um tópico meio digitado ou uma enquete pela metade. O
`versao` no estado já basta para redesenhar; o `key` foi removido, com aviso no
código para não voltar.

---

## 4.80 Quinze enquetes não se empilham: destaque + página com todas (31/07)

> *"Se você for criando muita enquete, a página fica muito longa. Como é que
> isso era no Orkut? Digamos que você tenha 15 enquetes — você vai agrupar isso
> uma em cima da outra? Seria legal colocar a enquete mais falada, ou então o
> moderador escolher; aparece na página principal e você cria uma página
> linkando todas. Da forma como está não faz sentido nenhum."*

Ele está certo, e a resposta do Orkut é a que ele mesmo descreveu: **resumo na
comunidade, lista completa numa página à parte**.

### Como ficou

- **Enquetes, na comunidade:** uma **em destaque**, inteira e votável; abaixo,
  até três em **linha compacta** (pergunta + nº de votos); e
  `ver todas as enquetes (N) »`.
- **Quem é o destaque:** a **fixada pelo moderador**; sem ninguém fixar, a **mais
  votada entre as abertas** — "a mais falada". Se todas estiverem encerradas, a
  mais recente, para o lugar nunca ficar vazio.
- **Fixar virou poder de moderador** (`enqueteFixada` na config): o link *fixar
  no topo* / *soltar destaque*, e um selo "fixada pelo moderador" na enquete.
- **Eventos seguem a mesma régua:** os **dois próximos** por inteiro (evento é
  para responder, e responder exige ver data e botões), o resto em linha, e
  `ver todos os eventos (N) »`.
- **Duas páginas novas**, paginadas de 10 em 10: `/forum/:id/enquetes` (abertas
  primeiro; encerrada é histórico e não disputa a atenção de quem veio votar) e
  `/forum/:id/eventos`.

**A régua, irmã da §4.78:** *peça inteira só onde se age; o resto é lista.* Numa
tela de celular, três enquetes com barras já ocupam a página toda — quinze
transformam a comunidade num rolo em que ninguém acha o tópico.

### Um bug de tela achado no meio

Fixar não mudava nada até recarregar: o componente lia a config no render, mas
**não escutava** o `GRUPOS_EVENT`. É o mesmo tipo de defeito da §4.79 (estado que
mora fora do React), com o sinal trocado — lá a tela remontava demais, aqui não
redesenhava nunca. Corrigido com o ouvinte no `Enquetes`.

---

## 4.81 Ouvir junto ao vivo: a sala de cinema para audiolivro (31/07) — decisão em aberto

> *"A gente colocar um modelo de live nesse Clube de Leituras… eu iria transmitir
> o meu player para outras pessoas que quisessem ouvir aquilo junto comigo. A
> gente teria um chat naquele player ao vivo… Funcionaria mais ou menos como uma
> sala de cinema."* E, logo depois: *"a pessoa que criou a sala tem autonomia de
> pausar, de fazer qualquer coisa, inclusive de encerrar a qualquer hora."*
>
> Ele mesmo avisou: *"isso altera qualquer outra coisa que a gente tenha elaborado
> antes, então a gente pode começar a pensar aqui do zero."*

**Onde ver:** `client/public/_sala-ao-vivo-B.html` (fora do git, temporária) —
quatro propostas navegáveis, com as telas de pé, mais "as três portas" e a tabela
de comparação.

**Nada foi construído.** Isto é apuração + desenho.

### O que a ideia tem de forte, e não é óbvio

1. **Spoiler deixa de existir por construção.** Metade do trabalho do clube hoje é
   tapar texto (§4.57: 3 de 4 falas do mural viraram placa cinza). Numa sala
   sincronizada ninguém está à frente de ninguém.
2. **Metade já está construída.** `lib/sala.ts` já prende cada comentário a um
   **segundo do áudio**, e `AudioPlayer.tsx` já usa `comentariosNoTrecho` para
   mostrar as falas dos 5 minutos em volta de onde a pessoa está. A sala ao vivo é
   a **camada síncrona** sobre uma peça que existe — bem mais barata do que parece.
3. **É a versão extrema do diferencial já registrado na §4.57:** o player sabe onde
   cada um está. Um app de catálogo não é dono do momento da escuta.
4. **O "encontro marcado" já tem casa:** o evento de comunidade ligado ao clube,
   construído no mesmo dia (§4.79). Falta só o botão *entrar na sala*.

### Os três defeitos apurados (o primeiro é o que decide o desenho)

1. **O canal é um só, e o chat rouba ele.** Live de games funciona porque o jogo
   ocupa os **olhos** e a conversa ocupa o **ouvido**. No audiolivro tudo é
   palavra: ler e escrever enquanto o narrador fala faz perder o livro. **Um chat
   corrido ao lado do player compete com a única coisa que se foi ali fazer.** É
   daqui que saem as propostas B, C e D.
2. **Hora marcada já foi rejeitada uma vez, com bom motivo** (§4.39, reafirmado na
   §4.79). A sala pode existir sem desfazer aquilo — desde que seja **extra**, e
   não o novo centro do clube.
3. **Sala vazia é pior que sala nenhuma**, e num app em construção é o cenário
   provável.

### As quatro filosofias (e o preço de cada uma)

- **A · A Transmissão** — a live ao pé da letra: o player do dono é o de todos,
  chat corrido, quem entra cai no ponto atual. *Preço:* bate de frente com o
  defeito 1; quem chega atrasado perdeu; nada sobra depois.
- **B · A Sessão com intervalos** — durante a narração **ninguém escreve**, só
  reage (sem texto) e pode *pedir a palavra*; a conversa mora nas **pausas que o
  anfitrião abre**, com o trecho fixado. *Preço:* mais peças; depende de o
  anfitrião pausar; tímido não pede a palavra.
- **C · A Sessão que fica** — o ao vivo é igual, mas nada evapora: tudo fica
  ancorado no segundo do áudio, dentro da sala do livro que já existe. Quem não
  pôde vir ouve depois e as falas surgem no minuto certo. *Preço:* dilui a
  urgência do "só agora"; exige decidir o que é público; fala de chat vira lixo se
  não houver filtro.
- **D · O fone dividido** — o caso de dois como coisa própria: convite a uma
  pessoa, **zero chat**, botão de *segurar para falar* que abaixa o livro. *Preço:*
  não serve a clube; é a mais cara (voz ao vivo); e é a única que **não dá para
  simular honestamente** numa maquete.

### A recomendação registrada (não é decisão)

**Nenhuma das quatro inteira.** Esqueleto **A** (dono soberano, entrada no ponto
atual — a ideia dele, sem torcer) + **mecanismo de conversa do B** (durante a
narração só reação; conversa nas pausas) + **C como camada**, não como opção:
é ela que resolve sala vazia e "não posso às 21h", e é a mais barata porque a peça
central já existe. O **D vira um ajuste de privacidade** ("sala privada, só nós
dois"), com a **voz anotada como desejo**.

### Uma decisão de arquitetura proposta, e o motivo

**A sala é do player, não do clube.** Dos três casos que ele descreveu, só o
terceiro é naturalmente de clube: ouvir com a namorada não é clube, e abrir para
quem quiser é mais uma live da comunidade. Enfiar a sala dentro do clube deixa o
caso de dois sem lugar. Proposta: a sala nasce no **player** (*Ouvir junto*) e é
**convocada** de três portas — livro (qualquer um), clube (a rodada vira sessão),
evento de comunidade (hora marcada, §4.79).

### ✔ Decisão 1, tomada no mesmo dia: a transmissão é corrida (proposta A)

> *"A transmissão tem que ser corrida. O anfitrião pode pausar, pode fazer o que
> ele quiser, mas a transmissão tem que ser corrida. Assim a pessoa pode comentar
> em cima da transmissão."*

**Eu era contra e perdi — e o registro importa.** Apresentei o defeito do canal
único (acima, item 1) e ele escolheu assim mesmo, sabendo do preço. **O esqueleto
é o A.** A proposta B **sai** como estrutura.

**Por que a decisão dele se sustenta**, e não é só teimosia: o valor da sala é
reagir **na hora exata em que a frase toca**. Conversa represada até a pausa já é
outra coisa — vira comentário, que o app **já tem**. Se a sala existe para o
momento, cortar o momento esvazia a sala.

**O que a minha objeção vira (e não muda nada do que ele decidiu):**

- **Recolher o chat** — vira uma faixa fina com "14 falas novas". Quem quer só
  ouvir aquele capítulo recolhe, sem sair da sala. **Padrão: aberto.**
- **Reações ao lado do campo de escrever**, não no lugar dele: um toque em 😱
  participa sem tirar o ouvido da frase.
- **O que sobra do B, como enfeite barato e opcional:** quando o anfitrião pausa,
  o chat ganha o **trecho fixado** — ali todo mundo fala da mesma frase.

**Efeito colateral registrado:** com a transmissão corrida, a proposta **C** (o
rastro) fica **mais** útil, não menos — quem chegou atrasado ou faltou é quem mais
precisa do chat daquele minuto depois.

### ✔ Decisão 3, tomada no mesmo dia: sim, a sala pode virar encontro do clube

> *"A sala também pode virar um encontro do livro. Como você pode não fazer os
> encontros ao vivo, a pessoa pode fazer os encontros ao vivo e ela marca, e assim
> vai indo."*

**Perdi este também, e o argumento dele é melhor que o meu.** Eu tinha registrado
"não" apoiado na §4.39 (a rodada sem hora é o que faz o clube caber na vida de
quem ouve dirigindo). A resposta dele desarma a objeção em uma frase: **marcar é
opcional**. Quem ouve dirigindo não marca e usa a rodada; quem quer sessão ao vivo
marca. A §4.39 protegia contra *obrigar* hora marcada — nunca contra *permitir*.

**E não precisa de conceito novo:** a sala marcada **é o evento que já existe**.
A §4.79 (mesma tarde) ligou evento de comunidade ↔ clube, e a página do clube já
tem a seção *Encontros marcados*. Falta só o **botão "entrar na sala"**, que acende
na hora. Zero peça nova no modelo de dados.

**O resíduo real, e ele é de nome, não de estrutura.** A §4.79 rejeitou dar ao
clube "um evento próprio com data e hora" porque nasceriam **dois encontros com o
mesmo nome** e os avisos falariam de duas coisas. Esse risco continua de pé — a
solução não é vetar, é **nomear diferente**:

| O que é | Como se chama | Tem hora? |
| --- | --- | --- |
| A rodada do ciclo (§4.39) | **rodada** / *"responda até domingo"* | não |
| A escuta ao vivo marcada | **sessão de escuta** | sim |

**Regra registrada:** a palavra *encontro*, sozinha, **não** é usada em tela de
clube — ela é ambígua desde a §4.79. Cada coisa com o seu nome.

### ✔ Decisões 2 e 4, e o que foi descartado — tudo fechado em 31/07

**As quatro perguntas estão respondidas.** O que segue é o desenho fechado.

#### B descartada — e o argumento dele derruba o meu de vez

> *"Se eu não quero falar, se eu acho que isso vai me atrapalhar, eu simplesmente
> não falo. Ou, se eu não quiser participar da conversa, eu vou lá e abro um livro
> para me ouvir. Quem abriu aqui o chat é para participar."*

**Ele está certo, e isto encerra o assunto do "canal único".** Eu tratava o chat
como imposição; ele não é. **A sala é um lugar de escolha:** quem entra escolheu
conversar, quem não quer conversar tem o app inteiro para ouvir sozinho. Desenhar
turnos obrigatórios para proteger alguém que **não precisava ter entrado** é
proteger de nada e estragar para quem entrou.

**Fica de pé só o barato:** *recolher o chat* e as reações ao lado do campo — são
saídas, não estrutura.

#### D descartada, sem meio-termo

> *"O D tá completamente descartado. É muita complexidade, é muito problema."*

Voz ao vivo **sai**, e não fica nem como desejo anotado. Quem propuser de novo:
foi descartado por custo e complexidade, com o AllBook ainda sem servidor.

#### C adotada — e "continuar de onde parou" é a joia

> *"Eu gosto bastante da ideia C, principalmente do fato de você continuar de onde
> parou, mesmo se a pessoa não puder ter ouvido. A melhor função até agora que você
> citou: a função de continuar."*

**A conversa da sessão fica guardada.** Ele chegou a defender apagar (medo de
spoiler e de conversa solta) e **mudou de posição no meio do raciocínio** —
registrado porque o caminho importa: *"a gente pode até esquecer o que eu falei
antes de apagar o chat, porque isso passa a ser interessante"*.

**Os dois medos que o fizeram querer apagar já têm resposta, e é por isso que dá
para guardar:**

1. **Spoiler:** a trava da `lib/sala.ts` já existe — quem ouve depois **só vê as
   falas até o ponto onde chegou**. Não é regra nova; é a peça que o app já usa.
2. **Conversa solta virando lixo:** o argumento é dele e é bom — *"são coisas
   diferentes: uma coisa é o chat ao vivo, outra é a aba de discussão do que foi
   falado no capítulo"*. **O chat da sessão não se mistura com os tópicos do
   clube.** Acrescentado por mim, para o argumento se sustentar na tela: o rastro
   fica **marcado como "da sessão"**, numa camada própria que dá para desligar —
   senão ele cai na mesma lista dos comentários do livro e a separação some.

#### Moderação: o poder já existe, não se inventa nada

> *"O anfitrião tem opção de privar o clube e escolher quem pode entrar. Então,
> teoricamente, ele já tem poder de banir ou de escolher quem entra."*

Privacidade do que se diz na sala **não é problema novo**: resolve-se com o poder
de moderação que o clube já tem (clube privado, aprovar quem entra, banir).

### Requisito novo: quem assiste precisa se situar

> *"Por mais que a pessoa que entrou na sala não possa pausar, é importante ela se
> situar onde ela está no livro — qual capítulo está aparecendo, tá no capítulo 3 e
> faltam tantos minutos para o capítulo acabar e virar."*

**Quem entra vê o player inteiro; o que ela não tem é o controle.**

| Vê | Não pode |
| --- | --- |
| capítulo atual e o nome dele | tocar / pausar |
| **quanto falta para o capítulo virar** | arrastar a barra |
| posição e tempo total | pular capítulo |

Isto corrige um erro do meu próprio desenho: eu tinha tirado a barra de progresso
de quem assiste ("só o dono arrasta") e, junto com o controle, tirei a
**informação**. Perder o controle é a regra; perder o mapa é defeito.

### O clube ao vivo — a ideia que fecha tudo

> *"O clube do livro pode ser como já é, mas também pode ser ao vivo. A ideia é
> poder fazer um clube do livro com hora marcada e as pessoas interagirem ao vivo."*

O clube não ganha só um botão: ganha um **jeito de ser**. Os dois convivem, e a
escolha é de quem cria:

- **clube como já é** — rodada sem hora, responde quando der (§4.39);
- **clube ao vivo** — sessões de escuta marcadas, todo mundo no mesmo segundo.

**Nomes distintos continuam valendo:** *rodada* (sem hora) × *sessão de escuta*
(com hora).

---

## 4.82 "Essa aba está crua, sem vida nenhuma" (31/07)

> *"Sobre categorias, a gente poderia adicionar mais. Eu acho poucas as que
> existem, e poderia ter coisas aleatórias. Outra coisa: eu não gosto dessa aba
> de comunidade… acho crua essa primeira janela, onde você busca comunidades,
> busca por. Acho que tá sem vida, sem vida nenhuma."*

**Ele tem razão, e a causa era metade tela, metade conteúdo** — a segunda metade
é a que quase passou batida.

### O que estava por baixo

- **Só cinco comunidades existiam**, e você já participava de três. Uma aba de
  descoberta com duas coisas para descobrir não tem como parecer viva, por
  melhor que seja o layout.
- **Nenhuma comunidade tinha categoria.** A categoria só morava na config
  editável (`ConfigDoForum`), e as semeadas nunca passaram por lá — então o
  filtro por categoria **não achava nada, em nenhuma escolha**. Bug silencioso
  do tipo que o `BANCO-DE-DADOS.md` cataloga: não dá erro, só devolve vazio.
- **A tela era só busca + grade + lista.** Nada dizia que existe gente do outro
  lado.

### O que foi feito

**1. Conteúdo (o que dá vida de verdade)**
- **+10 comunidades**, todas com tópico e conversa dentro (comunidade vazia é o
  beco da §4.23). Metade é assunto (True Crime, literatura brasileira, fantasia,
  adaptações, narradores, finanças); metade é o que ele chamou de *aleatório* e
  só existe num app de audiolivro: **durmo antes do fim do capítulo**, **eu ouço
  em 2x**, **abandonei no meio**, **corrida com narrador**.
- **Categorias de 13 → 36.** Entraram assuntos que faltavam e — a parte que
  importa — **situações de escuta**: ouvir no trânsito, na academia, dormindo.
  *Categoria de audiolivro não é só o gênero do texto; é também onde você está
  quando ouve.*
- **`Grupo.categoria`**: valor de fábrica no `grupos.ts`, com `categoriaDe()`
  fazendo o casamento (a config do dono continua ganhando). É o conserto do
  filtro morto.

**2. A tela, agora com dois estados**
- **Sem busca — vitrine:** *Acontecendo agora* (últimas conversas de todas as
  comunidades, com "hoje/ontem/há N dias"), *Em alta esta semana* (por conversas
  nos últimos 7 dias, com o motivo escrito), *Minhas comunidades*, *Para você*
  (com o porquê: "2 pessoas que você segue estão aqui"), *Categorias* com
  contagem clicável, a lista para descobrir e os números do fórum no rodapé.
- **Com busca ou categoria — resultado:** só a lista, a contagem e a paginação,
  com a pastilha do filtro trazendo o **X** que o desfaz.
- **Saiu o "buscar em" (nome · descrição · ambos)**: fidelidade ao Orkut sem
  serventia aqui — ninguém sabe de antemão se a palavra que lembra está no nome
  ou na descrição. Busca nos dois, sempre.
- **Capa sem foto virou degradê com o emoji grande** (cor estável, tirada do id).
  O cinza chapado fazia as comunidades novas parecerem buracos ao lado das cinco
  que têm foto.

### Correção na hora seguinte: a roleta volta, e as 36 aparecem

> *"Eu gostava dos ícones que estavam de categoria, de buscar por categoria.
> Aqui diz 36 no total, mas não aparecem as 36, e você não consegue pesquisar —
> tem que digitar uma por uma. Não gostei da forma como está."*

Dois erros meus na mesma tacada, e ele pegou os dois:

1. **Tirei a roleta de categoria** achando que as pastilhas bastavam. Não
   bastam: pastilha serve para **ver o que existe**, roleta serve para **achar o
   que você já tem em mente**. São gestos diferentes, e a tela precisa dos dois.
   Voltou, em ordem alfabética, com o número de comunidades ao lado.
2. **As pastilhas mostravam só as categorias com comunidade** — doze —, embaixo
   de um "36 no total". A tela prometia 36 e entregava 12. Agora aparecem
   **todas**: as vazias ficam apagadas, mas **continuam clicáveis**, e quem toca
   recebe o convite para criar a primeira comunidade daquele assunto.

E os **ícones por categoria** entraram (`ICONE_DA_CATEGORIA`), que era o que ele
gostava no Orkut. Com 36 pastilhas, o emoji é o que deixa a lista ser varrida
com o olho em vez de lida palavra por palavra.

**A régua que fica:** *tela vazia raramente é problema de layout — é falta do que
mostrar.* Antes de redesenhar uma aba morta, contar quantas coisas ela tem para
oferecer. E, ao trocar um controle por outro mais bonito, perguntar **qual gesto
o antigo servia** — se ninguém mais serve aquele gesto, ele não foi substituído,
foi removido.

**Pendente, se ele quiser:** as 10 comunidades novas usam degradê + emoji; as 5
antigas têm foto real (`assets/images/comunidades/`). Baixar 10 fotos deixa a
grade uniforme — mas exige a mesma conferência a olho da §4.76.

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
