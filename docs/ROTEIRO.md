# AllBook — Roteiro (as decisões que ainda valem)

> **O que é este arquivo.** O registro das decisões de rumo do AllBook que
> **continuam em vigor**: o que foi escolhido e por quê, o que foi **rejeitado**
> e por quê (é o que mais se perde), o que está **em aberto** esperando o
> Matheus, e o que foi **apurado** com custo para ninguém refazer a pesquisa.
>
> **O que NÃO está aqui:** o relato do que foi construído. Isso já está no
> código e no histórico do git. O documento inteiro de antes de 04/08/2026 —
> um ano de história, com a numeração original das seções — ficou em
> **`docs/ROTEIRO-ARQUIVO.md`**. Referência a uma §4.x que você não achar aqui
> está lá.
>
> **Ao decidir algo novo, escreva no fim deste arquivo, na hora, com o motivo.**
> Não espere o fim da sessão: a janela fecha, o contexto estoura, e o porquê se
> perde.
>
> _Podado em 04/08/2026, de 8182 linhas para o tamanho atual. O critério está
> na última seção, "A poda dos `.md`"._

---

## A fila de decisões esperando o Matheus

As seções abaixo contêm decisão **não tomada**. Todas estão neste arquivo, na
íntegra. *(A leva de 04/08 à noite fechou 7 itens desta fila de uma vez — ver
§4.98.)*

- **4.7 Auditoria geral do projeto (24/07) — decisões e o que ficou de fora** — É o inventário do que foi rejeitado e adiado com motivo — servidor preso a 127.0.0.1, `audit fix --force` recusado por causar downgrade do drizzle-kit, senha em texto puro a resolver quando o backend nascer.
- **4.15 Como se avalia no AllBook — decidido (25/07)** — É a regra de avaliação inteira do app (só livro recebe nota, duas réguas, portão dos 20%, média só a partir de 5) e diz em letras que os dois números seguem em calibração.
- **4.17 O pedido sob demanda ganhou porta — e a promessa das 24 horas (25/07)** — Firma a promessa central das 24h como meta declarada e não medida, decide que a busca sem resultado é a porta principal, e rejeita o ícone de estrelinha e o texto com 'talvez'.
- **Só com o banco — e um deles não é "falta implementar"** — Explica por que 'Esqueci minha senha' foi removido de propósito (o `auth.ts` não guarda senha nenhuma) e que ele volta junto com o servidor de contas — impede alguém de repor o link achando que é falha.
- **Preparação para o catálogo crescer** — Pendência explícita: com dezenas de categorias a lista rolável não basta e vai pedir agrupamento ou filtro — decisão não tomada.
- **4.34 Proteger o áudio: o que dá e o que não dá (26/07)** — Nada foi construído: é decisão de negócio pendente para o dia em que houver áudio, registrada para não recomeçar do zero.
- **As camadas, da mais barata para a mais cara** — Apuração técnica não implementada (segmentos HLS com URL assinada, limite de taxa por conta, marca d'água, DRM) que orienta a arquitetura futura do áudio.
- **A vinheta: eu subestimei, e o argumento do Matheus corrigiu** — Argumento de negócio ainda não executado (custo de remoção em escala e prova de origem) e a distinção entre vinheta e marca d'água por usuário, que evita confundir as duas na hora de gastar.
- **4.35 Abertura do app e vinheta sonora — adiado para depois do backend (26/07)** — Decisão de adiamento explícita, com o motivo (é identidade de marca, não código) — impede que o assunto volte antes da hora.
- **Três propostas construídas e rejeitadas — "nenhuma me agradou"** — Rejeição que ainda vale, com a direção que ele quer no lugar (livro abrindo com som, fone com livro, clean, possivelmente novo letreiro) — evita reapresentar as mesmas três ideias.
- **Imagem enviada pelo usuário: decisão tomada, com o mecanismo nomeado** — Decisão sobre moderação com o mecanismo nomeado (custo de reentrada), três condições que viram regra de conta no backend, e a pergunta explicitamente em aberto: quem julga a denúncia no feed, que não tem dono.
- **Correção na hora seguinte: a roleta volta, e as 36 aparecem** — Régua viva (tela vazia é falta de conteúdo, não de layout; ao trocar um controle, perguntar que gesto o antigo servia) e uma pendência declarada das 10 fotos de comunidade.
- **4.87 "A conversa do livro não virou inútil?" — apurado, e a resposta é não (31/07) — decisão em aberto** — Abre a única decisão grande explicitamente pendente da fatia; `/book/:id/conversa` e a `SalaDoLivro` continuam no código.
- **A premissa não se confirma no código** — Apuração custosa (zero `bookId` em grupos e tópicos) que sustenta a decisão pendente e ninguém deve refazer.
- **O que só ela tem — e o que cairia junto** — Lista o que a remoção derrubaria junto (marcas do player, metade dos trechos quentes) — é a conta que a decisão pendente exige.
- **O que é verdadeiro no incômodo** — Diagnóstico ainda válido: seis portas de conversa e nenhuma explica seu papel.
- **Recomendação e decisão** — Decisão declarada em aberto, com o caminho recomendado; o parágrafo da folha `_ponte-conversas.html` descreve protótipo já superado pela recomendação de 04/08.
- **A correção dele — e o receio verdadeiro (31/07, mais tarde)** — Corrige a leitura da frase dele: o risco não é hoje, é o dia em que alguém abrir tópico sobre um livro — é o critério da decisão pendente.
- **As quatro foram rejeitadas — e o defeito comum vale mais que elas (01/08)** — Rejeição em vigor com o defeito comum nomeado (arrumação de caixas em vez de usar o que só o AllBook tem) e a segunda leva ainda não decidida.
- **A recomendação, e a armadilha do "deletar" (04/08)** — É a recomendação mais recente, ainda sem resposta dele, e carrega a armadilha que quebra em silêncio: `ratings.ts` lê `notasDoLivro` de `comments.ts`, então apagar a conversa apaga a nota dos livros sem nenhum erro.
- **4.128 Onde o áudio vai morar: as contas, e a premissa que não se sustenta (08/08)** — Ele quer provedor "impossível de derrubar" (não existe: a Cloudflare já cortou clientes por decisão própria) e **um** disco de 22 TB (um disco não é cópia). Traz as contas de GB e de custo mensal, e a saída que não bloqueia nada: escrever contra o protocolo S3 e começar com pasta local.

---

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

~~Ordem: Descobrir → Perfil → …~~ **[VENCIDA]** Dessa fila, tudo foi construído
ou extinto (Descobrir fundida na Buscar §4.32; Planos removida §4.31) — **falta
só o onboarding**.

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
- **Nada de comunidade no Início.** O foco do app é sempre o audiolivro.
  **Rejeitada** a proposta de uma faixa "recomendado por quem você segue" na
  tela inicial. ⚠️ **[DELIMITADA pela §4.41 (28/07)]** — a metade "social
  escondido, alcançado pelo Perfil" caiu: a Comunidade ganhou porta própria no
  `BottomNav`. O que sobrevive daqui é só **nada de social no Início**.
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

## 4. DEPOIS do frontend — o motor (resumo)
1. Modelo de dados real (shared/schema/). 2. Backend/API (Drizzle + PostgreSQL; banco grátis: Neon/Supabase). 3. Áudio real em object storage (Cloudflare R2 / Supabase Storage / S3) + streaming. 4. Ligar telas à API + login (Passport). 5. Virar app: PWA → Capacitor.

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
- **Senha em texto puro no `shared/schema/` / `MemStorage`**: sem uso real
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

~~**Próximo passo combinado:** o livro sem narração… um estado do tipo "gerar
narração" / "em produção" na ficha.~~ **[REVOGADO na §4.23, no mesmo dia]** — o
Matheus apontou o erro: não é caso de inventar estado novo na ficha; a porta da
função central é o pedido (§4.17).

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
já existem no `BookDetails` ~~, faltam subir para o catálogo~~ **[FEITO
depois: os campos são opcionais no catálogo — ver "O que só apareceu na hora
de construir"]**.

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
~~Continua **em aberto**~~ **[SUPERADO em 26/07]** — a forma do modelo foi
decidida na "Atualização de 26/07" (planos com crédito de pedido, que não se
somam); abertos ficaram só os números finais. A tela seguir **sem uma palavra
sobre preço ou cota** continua certo enquanto os números não fecham. Só o que é
verdade hoje: "enquanto o AllBook está em fase aberta, pedir
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
não valia era tolerar semelhança solta. **O Fuse.js saiu da busca** (e a faxina
de 31/07, §4.88, o desinstalou do `package.json` — não traga de volta).

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
não ao destaque. ~~**Rejeitado descer a faixa para depois das categorias** — o
defeito era de pele e de respiro, não de posição.~~ **[REVOGADO em 26/07]** — a
correção do dia seguinte admite: *o lugar era o problema, sim*. A faixa saiu da
Início e o pedido virou o botão laranja do meio do menu (ver a regra herdada
"Correção de 26/07" no fim deste arquivo).

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

### Só com o banco — e um deles não é "falta implementar"

**4. "Esqueci minha senha" (Login) — removido, e o motivo importa.** Não é item
de lista de espera: **não há senha para recuperar**. O `auth.ts` decidiu
deliberadamente **não guardar senha nenhuma** no navegador (guardar em texto puro
é hábito ruim que ninguém desfaz depois), e por isso qualquer senha válida entra.
Um link de recuperação nesse modelo não estaria "por construir" — estaria
mentindo sobre como o login funciona. Ele volta junto com o servidor de contas,
que é quem passará a ter senha de verdade para redefinir.

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

## 4.32 A Descobrir foi fundida na Buscar (26/07)

**A regra que nasceu antes da decisão, e que vale para o projeto inteiro:**

> *"As nossas decisões têm que ser tomadas independentemente de existir servidor
> ou não. Hoje ainda não existe servidor, mas é o próximo passo do projeto. (…)
> O servidor não limita as nossas decisões."* — Matheus, 26/07

Isso derrubou um argumento meu no meio desta mesma conversa (ver "o Top 10" mais
abaixo) e **muda o critério de todas as decisões daqui para a frente**: desenhar
a versão final, e deixar para depois só a **fonte** dos dados. Não encolher a
interface por causa de uma limitação que some no passo seguinte.

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

❌ **Vinheta no meio do livro: DESCARTADO pelo Matheus (12/08/2026).** Eu havia
sugerido aqui vinhetas curtas espalhadas a cada N capítulos, como reforço contra
quem cortasse começo e fim. **Ele foi direto: não é assim que vinheta funciona.**
A vinheta é a **primeira** coisa que se ouve e a **última** — e é só isso. Fica
registrado para não ser reinventado: interromper o livro no meio para carimbar a
marca estraga a escuta, que é o produto. O ganho contra o copiador não paga o
custo para quem está ouvindo de verdade.

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

### Onde o áudio vai morar, e cifrado — decidido em 12/08/2026

Esta seção é de 26/07, quando não havia servidor na conversa. Ao planejar o
acervo de verdade (o documento vive em `~/Projects/baixalivro/docs/PLANO-ACERVO.md`),
três decisões novas se encaixam aqui:

- **Cloudflare R2**, decidido pelo Matheus. O critério que decidiu não foi o preço
  de guardar e sim o de **entregar**: streaming de áudio gera muita saída de
  dados, e a R2 não cobra saída. Guardar barato e pagar caro por quem ouve seria o
  pior dos mundos. `server/armazenamento.ts` já é uma interface com uma
  implementação; entra uma classe e muda o `.env`.
- **O mestre nunca sobe.** Só a entrega HLS vai para a nuvem — metade do tamanho.
  Perdeu-se a entrega? Regenera do mestre, que fica em casa, em dois discos.
- **Os segmentos sobem cifrados em AES-128** (`ffmpeg -hls_key_info_file`, no
  mesmo comando que já fatia). A camada 4 desta seção descarta o AES-128 por
  "deixar a chave ao alcance de quem inspeciona", e isso continua verdade **contra
  o usuário logado** — ele sempre poderá pegar a chave dele. Mas contra **vazamento
  do balde** funciona por completo: a chave mora no banco e só sai com sessão
  válida, então balde inteiro vazado é ruído. As duas leituras convivem; é fraco
  para um problema e forte para outro.
  ⚠️ **Perder a chave transforma o acervo na nuvem em lixo.** Ela entra no mesmo
  backup do banco.

## 4.35 Abertura do app e vinheta sonora — adiado para depois do backend (26/07)

**Decisão do Matheus: fica para depois do backend.** Não é código, é identidade
de marca — envolve gerar imagem, gerar som e possivelmente redesenhar o
logotipo. É um projeto à parte, com ferramentas que não são estas. O que segue é
o apurado, para ninguém recomeçar do zero lá na frente.

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
| Descobrir o desenho (símbolo, letreiro) | ⚠️ **desatualizado — ver §4.115**; era Grok/Ideogram/Midjourney, e os dois primeiros deixaram de servir de graça |
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

### Por que o AllBook tem uma vantagem que um app de clube não tem
Todo clube de leitura sofre dos mesmos dois males: **o ritmo se perde** (um
terminou, outro está na página 12) e **o spoiler afasta quem está atrasado**.

A defesa contra spoiler é ancorar cada comentário numa posição do livro e
esconder o que está adiante de onde a pessoa chegou. Num app de clube comum isso
depende de a pessoa **declarar à mão** onde está — e ninguém declara. **No
AllBook o player já sabe**: ele é quem toca o áudio. A trava de spoiler sai de
graça, e é isso que torna o clube melhor aqui dentro do que fora.

### O que fica de fora, de propósito
- **Clube no menu de baixo ou na Início** — contraria a decisão de 21/07
  ("nada de comunidade no Início; o foco é sempre o audiolivro"). Entrada pelo
  Perfil e pela ficha do livro.
- **Gamificação do clube** (ranking de quem ouviu mais, sequência de dias): faz
  a pessoa **mentir o progresso** para não ficar mal na foto — e progresso
  mentido quebra exatamente a trava de spoiler. Nocivo, não só supérfluo.
- **Chat em tempo real, "está digitando", presença.** ⚠️ **[DELIMITADA depois]**
  A presença por capítulo entrou na §4.58 item 8 (29/07, opt-in recíproco) e o
  chat ao vivo entrou com a sala de escuta (§4.81, 31/07) — esta exclusão segue
  valendo **só para a rodada do clube**, que continua assíncrona. Clube é assíncrono; cada
  um ouve no seu horário.
- **Resumo do livro por IA** — mata a razão de existir do clube. O uso honesto é
  outro: sugerir **perguntas de discussão** para quem tem que puxar a conversa.
- **Vários livros ao mesmo tempo no mesmo clube.** Um ciclo por vez.

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

~~**Contradição a resolver, e é decisão do Matheus.**~~ **[RESOLVIDA]** — a
recomendação daqui foi seguida: a Comunidade **tem** porta própria no
`BottomNav` (que hoje é Início · Biblioteca · Pedir · Catálogo · Comunidade), e
o Início ficou limpo de social, que era o coração da decisão de 21/07.

**O que "Recomendo" passa a ser.** Hoje é uma seção do Perfil que **ninguém vê**
— o rótulo diz "Visível para a comunidade" e ela vive no `localStorage`. Na
arquitetura acima, a recomendação com motivo é o **conteúdo que alimenta a
Comunidade**: é ela que dá o que ver quando você abre a página de alguém.

### O Mural: a decisão de 21/07 foi revisitada de propósito (28/07)

O Matheus pediu *"um mural, como se fosse um feed de notícias das pessoas que
você segue… uma atualização constante"* e que a pessoa *"possa falar sobre
coisas que está ouvindo"*. Isso **contraria o registro de 21/07** ("não é um
feed tipo Instagram/Facebook") — a contradição foi mostrada a ele, e ele
manteve o pedido. **Motivo da virada:** aquela decisão foi tomada quando a
Comunidade era um diretório; o defeito real de agora era outro — *seguir não
alimentava nada* e não havia voz própria fora da ficha de livro.

**O que sobrevive da decisão antiga:** nada de social no Início; e ~~**nada de
post solto** — a régua "todo post nasce amarrado a um livro"~~ **[REVOGADA pela
§4.58 item 4, um dia depois (29/07)]** — post só de texto passou a ser
permitido (nunca o padrão), e o próprio Mural morreu no item 7 da mesma seção.
A caixa de publicar anexa o livro em reprodução (troca entre os 5
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

### Por que isto é sério, e não preciosismo

A §4.39 já decidiu exatamente contra isto — *"escreve-se **um** mecanismo de
mensagens; o clube vira camada fina de regras"* — e a §4.40 registrou o preço de
ter ignorado a decisão: sala e clube viraram dois sistemas que não se falam, o
mural virou um chat que qualquer app tem, e o clube passou a jogar fora o próprio
diferencial. **Construir agora um terceiro sistema de conversa, com a terceira
moderação e o terceiro armazenamento, é repetir o mesmo erro pela terceira vez** —
e desta vez com duas janelas construindo em paralelo.

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

## 4.57 O Clube reorganizado: quatro modos desenhados, decisão em aberto (29/07)

> ⚠️ **[DECIDIDA POR INTEIRO]** — o clube virou **abas** na §4.89 (a proposta B
> daqui), e a "linha do ciclo" da proposta C **foi decidida na §4.101 (04/08)**:
> posição A, no topo da aba Agora. As medições e os preços por filosofia abaixo
> continuam valendo como apuração.

**O pedido do Matheus:** *"a página do Clube de Leitura… ela vai ter muitos livros
e muitos clubes, e a forma como está não tá bem organizada"*. Pediu **pelo menos
três propostas clicáveis** para escolher — e **sem tocar no código** antes da
escolha.

**Onde ver:** a folha `_propostas-clube.html` era temporária e **já foi apagada**
na faxina de 31/07 — restam as descrições das quatro filosofias logo abaixo, que
são o que a decisão precisa. Se a escolha voltar à pauta, desenha-se folha nova.

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
- ~~**Upload de imagem pelo usuário**~~ **[REVERTIDO na §4.74 (31/07) e no
  tópico com capa (01/08)]** — a imagem enviada entrou, encolhida no próprio
  navegador (canvas, `data:` URL, zero servidor); o custo que a rejeição temia
  não existia.

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

### O trecho toca dentro do cartão

*"Não faz sentido nenhum ele te levar para o áudio do livro; ele tem que ser
reproduzido aqui dentro."* Certo — um trecho de 40s que exige trocar de tela não é
trecho, é link. O play deixou de navegar; a capa continua sendo a porta do livro.

⚠️ **Limitação registrada no código:** o AllBook **não tem áudio** — nem o player
do livro toca som, ele avança um relógio. O componente faz o **comportamento**
certo (toca, a onda acende, o tempo corre, para no fim); quando o áudio existir,
entra um `<audio>` no lugar do relógio e a tela não muda.

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

### A caixa nasce fechada — e as duas alternativas rejeitadas

Uma linha com o avatar, que abre no lugar. **Botão flutuante** tapa conteúdo (a
§4.58 já dizia isso) e **caixa sempre aberta** empurraria o primeiro post para
baixo da dobra: quem entra na Comunidade quer ler antes de escrever.

---

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

### O que cada lente responde — a regra que decide tudo o resto

- **Feed (Todos):** *o que se está dizendo na comunidade.*
- **Seguindo:** *o que andaram fazendo as pessoas que eu escolhi.*

Daí sai o resto sem discussão caso a caso: **post aparece nas duas**;
**atividade, só na Seguindo** (era a regra do Matheus na §4.53: *"o que não
aparece nos dois são atividades"*); **cartão de clube e de fórum, só no Feed**,
porque clube que ninguém que você segue mencionou não responde à pergunta da
Seguindo.

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

### 2. "Aparece aqui e não ali" — o erro era o método, não o lugar

Eu tinha posto a foto **em quatro telas, à mão**. O app desenha a mesma bolinha
com inicial em **vinte e cinco lugares** — perfil da pessoa, sino, conversa do
livro, quem curtiu, clube, mural, seguidores, sugestões… Trocar um a um é como a
metade volta, e é exatamente o defeito que a §4.67 já tinha cobrado com o curtir.

**O conserto foi mudar de ferramenta:** `avatarDeLeitor(slug)` devolve um `style`
que pinta a foto **no fundo do próprio elemento** e apaga a letra. Cada avatar
precisa de **uma linha** e mantém tamanho, forma e borda que já tinha — 25
lugares consertados de uma vez, sem reescrever marcação nenhuma.

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

### Duas correções depois do primeiro uso dele (31/07, noite)

**A sala prendia quem entrava.** *"Eu não consigo minimizar o player, fazer
outras coisas dentro do aplicativo."* A sala nasceu tela cheia e sem saída
lateral — quando o app inteiro já sabe fazer o contrário com o livro. **Corrigido
com a mesma gramática do player:** a seta para baixo **minimiza** (você continua
dentro), a `BarraDaSala` no rodapé prova isso e devolve para lá com um toque, e
**sair** virou ação explícita, separada. A barra **substitui o MiniPlayer**
enquanto dura: duas barrinhas seriam duas transmissões disputando o rodapé, e a
do livro está parada desde que você entrou. E a sala em que você já está **sai do
feed** — cartão convidando para onde você já foi é convite falso.

> **Regra que fica:** tela cheia nova no AllBook precisa de um jeito de
> **minimizar**, não só de sair. Sem isso ela vira beco.

**O limbo entre duas telas cheias — segunda queixa, no mesmo dia.** A primeira
correção minimizava a sala **indo para o player**, e o player minimiza com
`history.back()`, que voltava para a sala:

> *"Você clica no ícone de baixar, ele volta para o player. Aí você clica de
> novo, ele volta para a sala ao vivo — ele fica nesse limbo. A forma de sair
> disso é clicar em voltar [do navegador], mas as pessoas deveriam poder voltar
> dentro do aplicativo mesmo."*

Ele está certo, e o defeito era estrutural: **duas telas cheias devolvendo uma
para a outra nunca chegam a uma tela com menu.**

**A regra, agora em `lib/navegacao.ts` e valendo para as duas:** minimizar
devolve para a **última tela do app que tinha navegação** — nunca para outra tela
cheia —, com `replace` para o voltar do navegador não trazer a tela cheia de
volta. Sem histórico nenhum (quem abre o app direto num endereço de sala), cai na
Comunidade.

**Isto corrigiu de quebra um furo antigo do player:** `history.back()` fazia quem
abrisse o app direto em `/player/:id` **sair do app** ao minimizar.

**Os botões de reação saíram — e o argumento é dele.** *"Você só colocou dois
botões de reação. Se vai ter dois, é melhor não ter nenhum. A pessoa já pode
digitar um monte deles, então não faz sentido ter botão de reação."* Eu tinha
posto dois emojis fixos ao lado do campo. Dois é escolha arbitrária minha, o
teclado já dá todos, e era **redundância com cara de recurso**. Nada substituiu:
o campo de escrever ocupa a linha inteira de novo.

---

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

## 4.83 Nome de leitor na tela é sempre porta para o perfil (31/07)

> *"Cliquei no livro 'O clube das 5 da manhã', tem a avaliação da Luciana, e eu
> não consigo clicar no perfil da Luciana."*

Era verdade: em `AvaliacoesDoLivro.tsx` o autor da resenha era **texto puro** —
foto e nome sem link —, enquanto no feed, no fórum, no mural e na sala tocar num
leitor sempre abre a página dele. O mesmo valia para quem responde a uma
avaliação.

**A regra que fica, e vale para tela nova:** *nome ou foto de leitor na tela é
sempre porta para o perfil* (`/user/:slug`, ou `/profile` quando é você). Se
numa tela nova o nome não leva a lugar nenhum, é defeito, não decisão.

**Varredura junto:** conferi os outros 20 lugares que desenham avatar de leitor.
Os comentários de post, o quem-reagiu e as sugestões já tinham link; os avatares
empilhados de "conversas de agora" e a citação de post **não** ganham link de
propósito (o cartão inteiro já leva a outro destino, e dois destinos no mesmo
cartão é o defeito oposto). O que estava faltando mesmo era a avaliação.

Aproveitando, o retrato do leitor na sala passou a **ampliar de verdade** — o
`AvatarAmpliavel` do `CommentThread` não recebia o `slug`, o mesmo esquecimento
que a §4.79 corrigiu no perfil.

---

### Decisões

- **Autor e narrador são o mesmo alvo: `pessoa`.** A primeira versão separava os
  dois e criava um buraco imediato — metade do catálogo escreve **e** narra, e
  quem seguisse "o autor" perderia a narração nova da mesma pessoa.
- **Quatro alvos:** pessoa, editora, Studio. (O "publicado por" é a editora; o
  "reproduzido por" é a pessoa que narra. Os dois já tinham página própria.)
- **A novidade não é inventada.** Sai de dado que já existe: a coleção
  **Lançamentos** (`collections.ts`) e as **narrações de origem `pedido`**
  (`narrations.ts`), que nasceram depois porque alguém pediu. Sem isso, "seguir"
  seria uma marcação sem consequência — o botão morto da §4.23. Só a **data** é
  semeada pelo id, porque o catálogo não guarda quando cada livro entrou.
- **Duas telas separadas:** `/seguidores` é gente (e alimenta o **feed** da
  Comunidade); `/acompanhando` é catálogo (e alimenta **avisos e atalhos**).
  Seguir um leitor e seguir um autor rendem coisas diferentes, e juntá-los na
  mesma lista faria a pessoa esperar feed de quem não posta.
- **Entrou como quarta porta do perfil**, ao lado de recomendações, comentários
  e clubes — a mesma pergunta ("o que é meu aqui?"), e o atalho rápido que ele
  pediu.
- **No sino, seis avisos por vez.** Seguir o Studio rende treze novidades de uma
  vez; treze avisos iguais afogariam o resto. A lista inteira fica em
  `/acompanhando`.

**Tela vazia com primeiro passo:** sem ninguém seguido, `/acompanhando` sugere os
autores e narradores **dos livros da sua biblioteca** — e, se ela estiver vazia,
editoras dos mais bem avaliados.

---

## 4.86 O xizinho que não existia no celular (31/07)

> *"Quando eu salvo um trecho no player, eu passo o mouse e só depois que eu
> passo o mouse é que aparece o xizinho de fechar. O que é muito bom. Acontece
> que, se eu estiver no celular, eu não tenho como passar o mouse. Eu vou ter que
> passar o dedo? Não teria uma forma mais fácil de resolver isso?"*

**O aviso não era do player: é o `toast` do shadcn, usado no app inteiro.** Ele
vem de fábrica com o botão de fechar em `opacity-0 group-hover:opacity-100`.

**E o defeito é pior do que "o botão não aparece".** Opacidade zero não é o mesmo
que ausência: o botão continuava **ocupando o canto e respondendo ao toque**. No
celular havia, portanto, uma área invisível de 24px que fecha o aviso — dá para
encostar sem querer e ver a mensagem sumir sem nunca saber o que a fez sumir. Um
controle invisível que funciona é pior do que um controle que não existe.

**Conserto: o X é visível sempre**, em qualquer largura, e o alvo cresceu de 24px
para 36px de lado (o cartão ganhou `pr-12` para abrir espaço). Medido na tela sem
nenhum ponteiro por perto: opacidade 1, 36×36, sem encostar no botão "Ajustar".

Não foi invenção nova — **o padrão já existia no projeto e o aviso era o último
fora dele**: os três pontinhos sobre as capas da Home já usam
`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`, e `dialog` e `sheet`
sempre mostraram o fechar. A varredura por `group-hover` achou só mais dois
casos, e os dois são **enfeite**, não controle: o disco de play que escurece a
capa em "Continuar ouvindo" e o número do capítulo que vira ▶ na lista de
`BookDetails` — nos dois o cartão/linha inteiro já é clicável, então no celular
não se perde ação, só realce. Ficaram como estão.

**A régua:** *passar o mouse não é interface no celular. Um controle ou está
sempre visível, ou não deve estar lá — esconder por opacidade deixa um botão
fantasma que o dedo acha sem querer.* Realce decorativo pode viver no hover;
**ação, não.**

**Para constar, o aviso já tinha duas saídas antes desta:** ele some sozinho em
5 segundos e aceita arrastar para o lado (o `swipe` do Radix, que a peça já
suportava). Nenhuma das duas se anuncia, e nenhuma serve para quem quer o aviso
fora da frente **agora** — que é o caso de quem acabou de guardar um trecho e
quer ver a barra de progresso por baixo.

---

## 4.87 "A conversa do livro não virou inútil?" — apurado, e a resposta é não (31/07) — decisão em aberto

> *"A gente já hoje tem várias formas de conversa sobre um livro. Talvez o ícone
> de conversa no livro seja inútil hoje, porque a gente já tem comunidade e já
> tem vários grupos de discussão sobre aquele livro. Você não acha que isso
> talvez seja inútil?"*

A suspeita merecia apuração — e a apuração fica aqui para ninguém refazer.

### A premissa não se confirma no código

⚠️ **[APURAÇÃO DESATUALIZADA desde 01/08]** — o tópico de fórum passou a poder
carregar um livro anexado (capa + link, e a busca acha tópico pelo nome do
livro). A contagem abaixo valia em 31/07; **refazer antes de bater o martelo**
da decisão desta seção.

**Não existe nenhum grupo de discussão sobre um livro específico.** Nenhum fórum
e nenhum tópico carrega `bookId` (`grupos.ts` e `forumConteudo.ts`: zero
ocorrências) — os grupos são todos por **tema** (mistério, Jane Austen, true
crime, ouvir dormindo…). O clube lê um livro por ciclo, mas é grupo fechado. A
conversa do livro é **a única conversa aberta sobre aquele livro em particular**,
e existe para os 60 do catálogo.

### O que só ela tem — e o que cairia junto

1. **Âncora no relógio do áudio**: comentário preso ao minuto exato. *"Num app
   de leitura isso não existe: a página não tem um relógio para pendurar a
   conversa"* (`MarcasDaConversa.tsx`) — é a peça mais "de audiolivro" do app.
2. **Trava de spoiler pela posição real**: o que está à frente de onde você
   parou não aparece (só a contagem "+3 à frente"), porque o player sabe onde
   você está. Num fórum, qualquer tópico pode entregar o final.
3. **É fundação de peças já aprovadas**: as marcas de conversa na barra do
   player e **metade dos trechos quentes do feed** (§4.58 item 8 — o trecho
   "citado num comentário") nascem dela. A notificação "responderam você" e o
   "ver a conversa inteira" do trecho apontam para lá.

### O que é verdadeiro no incômodo

Hoje são **seis portas de conversa** — feed da comunidade, fóruns, mural do
clube, conversa do livro, conversa do trecho, avaliações — e **nenhuma explica
qual serve para quê nem aponta para as outras**. A sensação de redundância é
real; o defeito é **falta de ponte, não peça sobrando**.

### Recomendação e decisão

**Recomendei manter.** Se o incômodo voltar, o caminho é construir as pontes
(a conversa do livro apontando para os grupos do tema; o grupo apontando para a
conversa dos livros que cita), não remover. **Decisão final é do Matheus e está
em aberto** — se ele reafirmar a remoção, ela leva junto as marcas do player e
metade dos trechos quentes, e isso precisa estar na conta.

**A proposta desenhada** (ele pediu: *"desenhe isso aí numa folha"*) está em
`client/public/_ponte-conversas.html` (temporária, fora do git): o mapa das seis
portas, a tabela mostrando que **4 pontes já existem e só o par livro↔fórum
falta**, as duas pontes em maquete com livro e grupo reais (Mistério → Suspense
& Mistério + True Crime; grupo de FC → Duna, 1984, Fundação, 3 Corpos, ordenados
por falas), e os subtítulos que dizem o papel de cada porta. Regras principais:
casamento gênero↔categoria por **mapa fixo num arquivo só** (as duas direções
não podem discordar), bloco **some** quando não há casamento honesto, grupos de
situação de escuta (dormindo, 2x, trânsito) ficam de fora, e a faixa do grupo
mostra **falas, não nota** — vende a conversa, não o livro.

### A correção dele — e o receio verdadeiro (31/07, mais tarde)

> *"Você está errado em uma coisa: quando eu falo 'a gente já tem vários grupos
> de discussões sobre aquele livro', eu falo 'a gente **pode ter**'. Alguém
> realmente interessado poderia abrir uma discussão sobre aquele livro em
> específico. [...] O meu receio é que sejam coisas parecidas. A conversa no
> livro, junto com os fóruns, pode se tornar muito parecida."*

A apuração continua de pé (não há grupo por livro **hoje**), mas a leitura da
frase dele estava errada — e o receio corrigido é **mais forte que o original**:
nada impede alguém de criar amanhã o tópico "A Paciente Silenciosa — aquele
final!" no grupo de suspense, e nesse dia a conversa do livro e o fórum viram
**concorrentes silenciosos**, cada um sem saber que o outro existe.

**A resposta que entrou na proposta: tópico↔livro é a terceira ponte.** Um
tópico pode se declarar "sobre um livro" (anexo opcional ao criar): ganha a capa
no topo, o aviso honesto de que **ali não há trava de spoiler** (a sala do livro
tem; o tópico é o lugar de debater o final), e as duas conversas passam a se
enxergar — o tópico aponta para a conversa do livro, e a conversa do livro lista
os tópicos que se declararam sobre ele. Convergência sem costura era o risco;
com costura, os papéis ficam distintos: **fio-do-ouvido sem spoiler** de um
lado, **debate com título e spoiler solto** do outro.

**O combinado, nas palavras dele:** protótipo **clicável**, fora do código do
produto (`client/public/_pontes-prototipo.html`, temporário, fora do git). *"Se
eu aprovar, você constrói no código. Se não, a gente exclui tudo mesmo."*

### As quatro foram rejeitadas — e o defeito comum vale mais que elas (01/08)

> *"Eu não gostei dessas propostas. Crie outras, melhores."* — e, perguntado o que
> falhou, ele marcou **"as ideias em si"** (não o formato, não o tamanho, não a
> premissa).

**O defeito comum, para não repetir:** as quatro discutiam **arrumação de caixas**
— onde cada conversa mora, quem aponta para quem. *Qualquer app de fórum poderia
ter aquelas quatro.* Nenhuma usava o que só o AllBook tem (o minuto exato, a
posição de escuta, o trecho de áudio); uma delas ("o fórum não fala de livro") era
**palha**, rejeitada por mim no próprio texto ao lado; e a "costura" apenas
organizava a convivência de duas coisas parecidas em vez de fazê-las **deixarem de
ser parecidas**.

**A régua que sai daqui:** *quando duas telas parecem iguais, o conserto é dar a
elas trabalhos diferentes — ou formas diferentes. Aviso, regra e ponte não
diferenciam nada aos olhos de quem chega.*

**A segunda leva** (`client/public/_propostas-conversas-A2.html`, mesmo molde)
parte de outra pergunta — *que forma a conversa toma quando o assunto é som?*:

- **A · A conversa vira o mapa do livro** — deixa de ser lista e ganha a forma do
  livro: uma régua do começo ao fim com bolhas onde se falou, e o que está adiante
  apagado. Um mapa nunca vai parecer uma lista de tópicos. **Recomendada.**
- **C · O fórum pergunta, o livro comenta** — o fórum vira lugar de pergunta, com
  resposta que pode ser **um trecho de áudio** e uma marcada como a que resolveu
  (fecha duas pendências da §4.72). **Recomendada, combina com A.**
- **B · Fone dentro, fórum fora** — a divisão passa a ser por **estado**: a sala é
  de quem está ouvindo agora. Nítida, mas dura: expulsa quem terminou.
- **D · Uma fala só, dois lugares** — a fala nasce no livro e **ecoa** no grupo do
  tema com a capa colada. Acaba a duplicação, mas afoga o grupo e vaza spoiler.

Mais três decisões de tela: a forma do eixo (régua horizontal / agrupada por
capítulo / trilho vertical), o que o fórum ganha em troca, e o que fazer quando
alguém abre tópico sobre um livro — inclusive a opção **"deixa acontecer"**, que
é a resposta honesta se a forma resolver sozinha.

### A recomendação, e a armadilha do "deletar" (04/08)

Ele pediu a **minha** recomendação numa folha clicável, dizendo estar *"levemente
inclinado a deletar isso"*. Antes de opinar, contei o que existe no código — e os
números viraram a resposta:

| medida | valor | leitura |
| --- | --- | --- |
| arquivos que usam a **tela** (`SalaDoLivro`) | **3** | a tela é barata de tirar |
| arquivos que importam o **dado** (`lib/comments.ts`) | **15** | o dado é caro de apagar |
| registros em `comments.ts` que são **avaliação com nota** | **33 de 51** | ⚠️ a armadilha |
| falas presas a um minuto do áudio | 10 | o ativo que só o AllBook tem |
| lugares que apontam para `/conversa` | 8 | precisam de destino |

**A armadilha, que quebra em silêncio:** `ratings.ts` lê `notasDoLivro` de
`comments.ts` — ou seja, **a nota dos livros mora no mesmo arquivo da conversa**.
Apagar o arquivo tira a estrela da home, da busca, da ficha e do perfil, e
**nenhum erro aparece na tela**: os livros só ficam sem nota. Se a decisão for
deletar, o passo 1 obrigatório é *separar avaliação de conversa em dois arquivos*.

**A recomendação: nem manter, nem deletar — encolher.** *Não delete a conversa,
delete o lugar dela.*

1. **Tirar a lista de conversa da ficha do livro** — é ela que causa o incômodo:
   na ficha é uma lista de gente falando embaixo de outra lista de gente falando
   (as avaliações). 1 arquivo, risco zero.
2. **As falas ficam no player, presas ao minuto** — escuta, não leitura; não
   compete com fórum nenhum e já está construído (custo 0).
3. **O debate do livro vai para o fórum, com a capa anexada** — 1 campo e 1 selo,
   já testado no protótipo. Responde à frase dele sem mapa, lente nem regra nova.
4. **Os 8 links passam a apontar para a ficha** — obrigatório se o 1 for feito;
   porta que leva a lugar nenhum é o pior defeito possível.

Folha clicável em `client/public/_recomendacao-conversa.html`, com um **simulador**
(manter / encolher / deletar mostra as consequências reais na hora), botões
*faço / não faço* por passo, e o **plano de demolição na ordem certa** caso ele
opte por deletar mesmo assim — o que eu construo se ele mandar, desde que o passo
da separação venha primeiro.

### ✅ DECIDIDO E CONSTRUÍDO (04/08) — encolher (`bd2422b`, `4ce5264`)

> `CAMINHO: Encolher` · os 4 passos aprovados: 1 FAÇO · 2 FAÇO · 3 FAÇO · 4 FAÇO

**Metade já existia** (conferido antes de construir): as falas no player
(`MarcasDaConversa`, a gaveta "Conversa deste trecho" com âncora e spoiler) e o
tópico de fórum com livro anexado (`criarTopico` já aceitava `{ bookId }`, a
linha já desenhava a capa). Custo real dos passos 2 e 3: **zero**.

**Construído:** a `SalaDoLivro` saiu da ficha e no lugar entrou `FalasDoLivro` —
três linhas, não uma lista (quantas falas, quantas presas ao áudio, a porta), que
**não mostra as falas** (senão vira a mesma lista menor), **não some em livro
mudo** e mostra o debate do fórum quando existe, via `topicosDoLivro(bookId)`.

**⚠️ O passo 4 foi executado ao contrário, e o motivo é o próprio passo 4.** Os
links são **6**, não 8, e **todos apontam para uma fala específica** ("responderam
você", "meus comentários", o comentário citado no feed). Como o passo 2 mantém a
conversa viva, mandá-los para a ficha criaria o **beco sem saída** que o passo 4
existia para evitar. O vetor se inverteu: o caminho novo é **da ficha para a
conversa**.

### O "bug" que não era bug — e o que ele revelou

> *"Abri A Paciente Silenciosa e, na Conversa, aparece um monte de coisa que eu
> tinha escrito, que eu não escrevi nesse livro específico."*

**O dado estava certo:** os 4 comentários têm `bookId: 106`, gravados em
**28/07 entre 22h30 e 22h52** (a hora está no próprio id). Os três caminhos que
escrevem comentário passam o alvo certo e `ehDoAlvo` compara sem coerção — **não
há caminho que grave o livro errado**. Duas outras causas, somadas:

1. **Os seus vinham empilhados no topo**, dentro do `CommentComposer`, antes de
   toda a conversa;
2. **as falas dos outros estavam travadas** — ele está no minuto 8 do capítulo 1,
   e as semeadas estavam adiante.

**Consertos:** a sala mistura tudo **na ordem do livro** (sem âncora primeiro,
depois por minuto); o cartão virou `MeuComentario.tsx` para existir fora da caixa;
`CommentComposer` ganhou `listarMeus` (ligado em perfil de pessoa/editora, onde
não há ordem de áudio); e `MEUS_COMENTARIOS_EVENT` faz a lista redesenhar ao
publicar — sem ele a fala só aparecia recarregando.

**Semeadas 18 falas em "A Paciente Silenciosa"**, com cada âncora conferida contra
`getChapters(106)` (13 capítulos, 10h40): nenhuma cai fora do livro nem no
capítulo errado.

**Duas réguas:** *sala precisa de fala no primeiro quarto de hora e de pelo menos
uma sem âncora* — semear só no meio e no fim faz a sala nascer muda justamente
para quem ainda não decidiu se vai ouvir. E: *ordem por engajamento serve para
lista de comentários; conversa presa ao áudio se ordena pelo minuto*, senão a
lista e o trilho do player contam histórias diferentes.

### A trava de spoiler deixou de ser parede e virou porta (05/08)

> *"Não gosto dessa trava de spoiler forçada. […] Eu gosto da ideia de o usuário
> poder ver isso, desde que ele saiba que ali provavelmente vai ter spoiler. E
> hoje está bloqueado completamente. Isso não é legal."*

**Ele tem razão, e o app já se contradizia:** o comentário marcado como spoiler
sempre teve *"toque para ver"*, mas o que estava **à frente no áudio** era
cadeado sem chave — decisão tomada no lugar da pessoa, no único ponto do app que
fazia isso.

**O que mudou (a trava continua ligada por padrão — o que mudou é ter saída):**

- **Na sala:** o aviso *"N mensagens presas em trechos à frente"* ganhou
  **"Mostrar mesmo assim — pode ter spoiler"**. Cada fala aberta vem com o selo
  âmbar *à frente de onde você está*, e o véu do spoiler explícito **continua por
  baixo** — duas camadas, porque são duas coisas diferentes (estar adiante ≠ ser
  spoiler declarado). Há o botão de esconder de volta.
- **No trilho do player:** as marcas apagadas eram `<span>` sem clique. Viraram
  botão. A gaveta abre com a tarja *"Você ainda não chegou aqui — pode ter
  spoiler"*.
- **⚠️ E o áudio não pula.** Tocar numa marca já ouvida leva o player até lá (é o
  esperado); tocar numa marca do futuro **abre só a conversa**, num ponto avulso
  (`pontoDaConversa`). Mover o áudio ali seria adiantar o livro sem pedir — quem
  quis espiar a conversa não pediu para pular a história. Testado: 00:31 → 00:33
  (só o tempo correndo) ao abrir uma marca de 50:03.

**Não fica guardado:** sair da tela recoloca a trava. *Destravar custa um toque;
um spoiler custa o livro.* Trocar para persistente é uma linha, se ele pedir.

**A régua:** *proteção boa é a que se pode dispensar. Sem saída, ela deixa de
proteger e passa a mandar.*

### O que os comentários de teste dele revelaram

Os quatro comentários que ele estranhou (*"isso nem tem nada a ver com o livro,
não sei o que está fazendo aqui"*) foram **apagados a pedido** — eram "surreal",
"isso foi profundo", "isso foi muito bom" e "bom".

**O que ficou como conserto:** a caixa da gaveta do player convidava com *"O que
você achou deste trecho?"* — que se lê como **caderno de anotações**. E o player
tem, lado a lado, um botão que anota **para você** (Marcar) e uma caixa que fala
**com os outros**. O convite virou *"Comente este trecho — quem chegar aqui vai
ler…"*. **Se o texto não diz para quem se está falando, o erro é do app, não de
quem escreveu.**

### Três defeitos na gaveta do player, e um na busca (05/08)

**1. A gaveta desenhava um segundo cartão de comentário, mais pobre.** O Matheus
listou os buracos de uma vez: *"a pessoa que faz o comentário: eu não posso
comentar em cima do comentário dela, não posso clicar no perfil dela, não vejo a
foto dela"*. Os três vinham da mesma causa — um componente próprio
(`FalaDoTrecho`) em vez do `CommentThread` da sala. Trocado: agora vêm juntos
foto que amplia, nome que leva ao perfil (testado: leva a `/user/beto`), curtir,
responder e denunciar. **Duas peças para a mesma coisa sempre divergem, e quem
perde é a mais escondida.**

**2. A gaveta abria na aba do clube.** *"Seria mais interessante que a primeira
coisa que aparecer fosse as conversas de todos."* Ele tem razão e o custo era
alto: um clube tem 6 pessoas e o livro tem o app inteiro, então a gaveta abria
quase sempre vazia, com a conversa cheia escondida atrás de um toque. **"De
todos" virou o padrão e foi para a esquerda** (a ordem na tela tem de acompanhar
qual é o padrão). A aba do clube **fica** — ver o que a *sua turma* disse naquele
minuto é diferente de ver o que o mundo disse, e é a decisão da §4.40 (o clube é
um filtro da sala, não uma segunda conversa). *O errado era o padrão, não a
existência* — e tirá-la é uma linha, se ele quiser.

**3. Clicar num resultado da lupa não abria o livro.** *"Clico no livro, ele não
abre e simplesmente trava."* Reproduzido: `SearchResults` navegava com
`setLocation` mas **não avisava quem o chamou**. Na página `/search` isso basta —
a tela inteira troca. Mas a **lupa do topo** abre a busca como folha
`fixed inset-0`: a rota mudava por baixo e a folha continuava montada por cima,
então a ficha abria **atrás**. Pior ao clicar no livro em que já se estava: nem a
rota mudava, e o app parecia morto. Agora `SearchResults` recebe `onEscolher`, e
a folha fecha antes de navegar (testado: `/book/106` → `/book/7`, "Duna").

**A régua:** *componente que navega precisa avisar quem o montou — quem abre por
cima é o único que sabe que precisa sair da frente.*

### A crítica que fiz da ideia dele, e onde ela procede

**Capa em todo tópico, do tamanho de cartão, destrói a lista.** Fórum é uma
lista para **varrer com o olho** — foi por isso que a busca de comunidades
voltou a ser lista (§4.76). Quinze cartões grandes são quinze telas de rolagem
para ler quinze títulos. **A capa entrou, mas em dois tamanhos:** miniatura de
40×58 na lista, e grande **só nos dois destaques** do topo. O que dá destaque é
ser exceção.

**Das três coisas que ele citou, uma é claramente melhor que as outras — e não
por ser mais barata.** A **capa do livro de que o tópico fala** é *informação*:
num app de audiolivro a maioria dos tópicos é sobre um livro, e saber qual antes
de tocar poupa o toque. De quebra, o tópico ganha um **link para o livro**, e a
busca passa a achar tópico **pelo nome do livro** (testado: buscar "paciente"
acha *"Me indiquem: suspense curto pra maratonar"*, cujo título não tem a
palavra). A **imagem enviada** entrou também, e é a saída para o tópico que não
é sobre livro nenhum ("quantos minutos vocês põem no temporizador?") — sem ela,
esses ficariam todos iguais.

⚠️ **O que eu NÃO argumentei, e o registro é para não regredir:** que upload não
dá sem servidor. Esse argumento já foi derrubado por ele duas vezes, e o próprio
`lib/forum.ts` guarda a resposta — `encolherImagem` reduz a foto no navegador
(canvas, JPEG) e grava como `data:` URL. Aqui usa 320px em vez dos 140 da capa
de comunidade, porque esta imagem também aparece grande.

## 4.93 A mesma regra, aplicada pela metade: a menção sem capa no comentário (01/08)

**A queixa**, sobre a caixa de comentário: *"não precisa ter o botão de responder
com o livro, se você já pode simplesmente colocar o @ e marcar o livro. Mas
deveria ter o ícone do livro quando você marca um livro, marca um autor ou
qualquer coisa do gênero"*. E o detalhe que ele chamou de pior: *"quando você
marca o livro, ele não aparece o livro. Aquele ícone do livro só aparece o link,
te levando ao livro, que é pior ainda"*.

**Ele tem razão duas vezes, e as duas são a mesma frase dele de 30/07.** Naquele
dia ele derrubou os botões "Livro" e "Clube" do compositor com o argumento *"se
você já pode marcar com @, qual é o sentido de ter isso aqui?"*, e a consequência
registrada na §4.58 foi que **a menção passou a virar o cartão do post** — porque
sem isso a queixa seguinte já tinha sido *"não colocou a capa"*.

**O erro foi meu, e é de escopo: apliquei a decisão só no post.** No dia seguinte
construí "responder com um livro" (§4.92) com **busca própria e botão próprio**
dentro do comentário — exatamente a redundância que ele tinha acabado de mandar
tirar do compositor, recriada um andar abaixo. E o comentário continuou sem
cartão: marcar `@Duna` respondendo alguém dava uma palavra laranja e nada mais.

> **A regra que fica:** *decisão sobre um gesto vale em todo lugar onde o gesto
> existe.* Quando uma decisão diz "o `@` é o caminho único", a pergunta a fazer
> na hora é **quantas caixas de texto o app tem** — não só a que estava aberta na
> tela. Meia regra é pior que nenhuma: quem aprendeu o gesto no post o repete no
> comentário e conclui que quebrou.

## 4.94 "Não consigo ver o número de seguidores dela. Isso é de propósito?" (01/08)

**Era de propósito — e a regra tinha envelhecido.** A §4.56 (28/07) decidiu:
*"nenhum número social inventado. A página não mostra seguidores (não há
servidor); mostra horas, títulos e recomendações, que são verdade desde o
primeiro dia"*. Fazia sentido naquele dia.

**O que mudou desde então:** o app passou a mostrar "você e mais 10 gostaram", a
contagem de comentários de um post, quantos membros tem um clube, quanta gente
está ouvindo numa sala ao vivo — tudo fictício, tudo semeado. E o **seu** perfil
mostra seguidores desde a §4.55, com gente de `community.ts`. A regra sobrou
valendo num lugar só: **a página dos outros**. Você tinha seguidores; eles, não.

> **A regra que fica:** *decisão tomada por uma limitação envelhece quando a
> limitação deixa de ser respeitada em outro lugar.* Não é a decisão que precisa
> ser defendida, é a **coerência**: no dia em que o app inventou o primeiro
> número social, esta seção virou dívida. O sinal de alarme é uma regra que só
> vale numa tela.

### A decisão de dado, que é onde estava a armadilha

**Uma relação só, e as duas listas saem dela.** O caminho fácil era escrever
`seguidoresDe` e `seguindoDe` separadas, cada uma sorteando gente — e elas se
contradiriam na primeira conferência (a Ana seguindo a Juliana sem a Juliana ter
a Ana entre os seguidores). Em `lib/rede.ts` existe **uma** função `segue(a, b)`,
semeada pelos dois slugs, e as duas listas são filtragens dela.

**Assimétrica de propósito:** `segue(a,b)` e `segue(b,a)` são perguntas
diferentes. Seguir de volta é escolha; um mundo em que todos se seguem de volta
não se parece com rede nenhuma.

**Números pequenos, e isso é honestidade.** Cerca de um terço dos pares, o que dá
7 a 9 seguidores numa comunidade de 27 leitores. A tentação era mostrar "312
seguidores" para parecer rede grande — e a lista com oito nomes desmentiria o
número em dez segundos.

**Você e ela não são semeados.** "Você segue a Juliana" vem de `following.ts`;
"a Juliana te segue" vem de `seguidores.ts`, que é a sua lista de verdade
(inclusive quem você aceitou e quem removeu). Duas respostas para a mesma
pergunta é o defeito que a §4.92 já tinha juntado numa fonte só.

---

### A régua — corrigida por ele, duas vezes, no meio da aplicação

A folha nasceu com a régua "uma palavra por gesto" (consistência interna). **Ele
a derrubou no primeiro lote:** troquei "Remover" por "Tirar" nos seguidores e
ele parou tudo — *"não existe a palavra tirar em rede social… você está criando
uma nomenclatura nova quando os usuários já estão adaptados"*. E de novo no
play: *"no player de áudio, a nomenclatura do botão se chama reproduzir"*. A
régua que vale daqui em diante, **nesta ordem**:

1. **O padrão de mercado em PT-BR** (Instagram, Facebook, WhatsApp, Spotify,
   Netflix, Zoom, Reddit) — o usuário chega treinado; não se inventa palavra
   quando o mundo já escolheu uma.
2. **Clareza para quem vê pela primeira vez** — o rótulo diz o objeto ("Ver
   perfil", não "Ver").
3. **Consistência interna** — só desempata quando 1 e 2 não decidem.

### O que foi proposto e REJEITADO — para ninguém propor de novo

- **"Tirar" no lugar de "Remover"** (seguidores, membro, foto) — rede social diz
  Remover; foi aplicado e **revertido** no mesmo dia.
- **"Ouvir"/"Tocar" no play** — o play chama **Reproduzir** (Spotify/YouTube);
  revertido, e o MiniPlayer foi alinhado junto.
- **"Aceitar" na fila da comunidade** — Facebook Groups diz **Aprovar**; ficou.
  ("Aceitar" vale para pedidos de pessoa: seguidores e lista de espera do clube.)
- **Downloads → Baixados, offline → sem internet** — Netflix e Spotify usam
  Downloads e offline; a proposta morreu quase inteira.
- **Ok → Pronto; Bio → Sobre você** — "Ok" é padrão universal de diálogo; "Bio"
  é o nome do campo no Instagram/TikTok.
- **"Ver tudo" → "Ver todos"; "Mostrar menos" → "Ver menos"** — os dois já são
  padrão (Spotify/YouTube); trocar era gosto, não correção.
- **"Veloc." → número** — o botão **já mostra** o número grande (1,00x) como
  ícone; a legenda é secundária. Nada a corrigir.
- **Unificar o dialeto minúsculo do fórum** — a minúscula com « » é a estética
  Orkut de propósito; dentro do fórum ela é coerente. Mantido.
- **Traduzir spoiler/post/link/feed/Story** — é o vocabulário corrente das redes
  em PT-BR; trocar criaria palavra que ninguém usa.

---

### A decisão: uma mescla, escolhida por ele numa folha desenhada

Foram quatro propostas de filosofias diferentes (`_editar-perfil-B.html`, fora do
git): o formulário completo, editar no lugar, o lápis como índice, e cada bloco
se editando sozinho. A resposta: *"uma mescla de A com C. Eu prefiro da forma
como está o C… porém tem coisas aqui no A que não tem no C. Então a gente vai
colocar todas as opções que tem no A para o C"*.

Ou seja: **a folha do C** (não tira você da página, e abre portas) **com o
conteúdo do A** (todos os interruptores). E ele deu o critério do que fica em
cada lugar sem precisar dizê-lo: *"quando você clica em minhas recomendações,
abre uma abazinha"* — o que se **escreve** merece tela; o que se **liga** não.

> **A regra que fica:** *o que liga/desliga resolve no lugar; o que se escreve
> abre página.* Mandar alguém para outra tela por causa de um interruptor é o
> "um toque a mais para tudo" que derrubou a proposta C pura.

**Por que folha e não tela cheia:** editar o perfil é olhar para ele. A folha
sobe por cima e a página continua atrás — o mesmo motivo pelo qual a caixa de
compartilhar abre no lugar (§4.58) e a lista de membros do clube não virou página
(§4.59).

## 4.97 O `@` morre nesta etapa; o endereço que valia era o link do perfil (04/08)

**A decisão é do Matheus, e derruba a recomendação da §4.95** — o registro fica
porque o argumento dele é o critério para o assunto voltar ou não:

> *"O @ nas redes sociais existe basicamente para você identificar outras
> pessoas… quando você vai pesquisar aquela pessoa ali, na aba de pesquisar. Mas
> hoje, no nosso aplicativo, você nem tem a opção de encontrar a pessoa — e eu
> também não acho que, nessa primeira etapa, seria algo interessante implementar,
> até porque nem vai ter tantas pessoas assim… A pessoa não pode ter um link de
> compartilhamento do perfil dela? Isso já resolveria essa questão."*

**Por que ele está certo:** o `@` é um identificador **para digitar** — só paga
o custo quando existe um campo de busca onde digitá-lo. O link é o mesmo
identificador **para mandar pronto**, e o app já vive de mandar link (livro,
clube, trecho). Com ~5 mil usuários na primeira etapa e sem busca de pessoas, o
caminho de descoberta real é alguém mandar o link para alguém.

**O que a apuração achou de quebrado no caminho:** o botão "Compartilhar" do seu
perfil **já existia e mentia por omissão** — mandava o endereço genérico do app
(`localhost:3000`), não a sua página, com um comentário no código justificando:
*"sem servidor não existe um link do seu perfil que abra para outra pessoa"*. É
o argumento que o Matheus já derrubou duas vezes (§4.53, sala ao vivo §4.81) — e
que o resto do app nunca seguiu: livro, clube e trecho sempre compartilharam os
seus links. O perfil era o único que se recusava.

**O que entrou (04/08, janela B):**

- **A sua página ganhou endereço** — `meuSlug()` em `lib/profile.ts`, derivado
  do nome ("Matheus" → `/user/matheus`): minúsculas, sem acento, espaços viram
  hífen. Sem campo para escolher, de propósito: escolher username é a metade do
  `@` que ficou para a etapa da busca.
- **O Compartilhar do perfil manda esse link**, com as recomendações no texto
  (o texto bom que já existia ficou).
- **`/user/:slug` reconhece você**: abrir o seu endereço desemboca em
  `/profile`. A checagem vem antes de `findMember`, então num empate de nome com
  um leitor fictício o seu endereço ganha — o servidor é quem um dia impede o
  empate de existir.
- **A página dos outros ganhou o mesmo gesto**: ícone de compartilhar no canto
  do topo (onde a sua tem o lápis e a engrenagem), mandando `/user/<slug>` da
  pessoa. É a regra da §4.93 — decisão sobre um gesto vale em todo lugar onde o
  gesto existe — e é como "encontrar alguém" funciona sem busca: um terceiro
  manda o link.

**A armadilha, registrada onde se olha antes de mexer em contas
(`BANCO-DE-DADOS.md` §2.9):** slug derivado do nome **muda quando o nome muda**
e mata todo link já compartilhado. Sem contas, inofensivo; com contas, o
endereço congela numa coluna própria.

**O gatilho para o `@` voltar à mesa:** existir busca de pessoas (ou contas
reais, o que vier primeiro). Aí o assunto não é mais "mostrar um arroba" — é o
username congelado da §2.9 virar o que a busca indexa.

---

---

# Regras herdadas do arquivo

> As seções abaixo foram para `docs/ROTEIRO-ARQUIVO.md` porque narram trabalho
> **já construído** — o código e o git contam a mesma história melhor. Cada uma,
> porém, deixou **uma regra que continua valendo**, e é ela que fica aqui. Estão
> na ordem cronológica original; para o contexto inteiro, a seção com o mesmo
> título está no arquivo.

- **0. Decisões já tomadas com o Matheus** — Terminar TODO o frontend antes do motor (backend/áudio); a cópia local do Matheus é a fonte da verdade e o GitHub é o espelho, com commit+push a cada etapa.
- **3. FOCO ATUAL — Terminar o frontend** — **O frontend está completo por decisão** (§4.98): a tela de Boas-vindas (onboarding), a última que faltava, foi conscientemente adiada para junto do backend; a abertura animada idem.
- **Modelo de negócio e a função central (24/07) — visão do Matheus, ainda em aberto** — A função central do AllBook é o livro sob demanda: qualquer título que não exista em áudio é narrado por IA — o catálogo é meio, não o produto.
- **Respostas a comentário (21/07, noite) — FEITO** — Resposta a comentário é de um nível só (aninhamento estilo Reddit rejeitado), não leva estrela, e a resposta que volta é simulada em replies.ts — some quando houver servidor.
- **Comentar o autor e o narrador (21/07, noite) — FEITO** — Um comentário tem OU bookId, OU personSlug, OU publisherSlug — nunca dois; quem percorrer comments.ts precisa filtrar o alvo, senão comentário de pessoa vaza como se fosse de livro.
- **Trabalhar com duas janelas do Claude Code ao mesmo tempo (21/07)** — Em arquivo compartilhado, editar por casamento de texto exato — nunca `sed` por número de linha, que envelhece no segundo em que a outra janela salva.
- **Decisões da barrinha do player e do "onde parei" (21/07)** — O progresso é permanente (localStorage `allbook_playback`) e a barra do MiniPlayer é só da visita (sessionStorage) — guardar as duas juntas é o que fazia a barra ressuscitar a cada abertura.
- **Busca virou aba "Buscar" no menu de baixo — modelo Apple TV (24/07, fim do dia)** — ~~Busca é aba fixa no menu de baixo~~ **[REVOGADA pela §4.37, dois dias depois]** — a aba virou "Catálogo" e a busca abre pela lupa na Início. Sobrevive só a rejeição do estado vazio: grade de capas é cara de tela dedicada.
- **Conquistas viram muitas medalhas, coloridas (22/07)** — As conquistas são a única exceção à sobriedade premium: medalha desbloqueada usa a cor da marca — o resto do perfil segue sóbrio.
- **Perfil repaginado: motivo na recomendação, troféus estampados, cabeçalho premium (23/07)** — Mudança no perfil próprio se aplica igual ao perfil de outro leitor (Profile e UserProfile andam juntos); recomendação carrega um 'por que recomendo' opcional.
- **4.5 ~~Decisão em aberto:~~ de onde vem a estrelinha — DECIDIDA em 4.15** — Não há fonte externa de nota (Goodreads fechou a API pública em 2020; Open Library e Google Books servem para capa e ficha, não para avaliação), e a estrela do comentário fica colada ao texto, nunca à linha do nome — e só em comentário de livro.
- **4.6 Notificações: por que a tela foi repaginada (24/07)** — O `relativeDate` de activity.ts só aceita AAAA-MM-DD: recortar os 10 primeiros caracteres de um ISO (UTC) cai no dia anterior — por isso Notifications tem o `quandoFoi` local, com o instante inteiro. Não troque um pelo outro.
- **4.9 Faxina "cara premium" (24/07)** — Animação de ENTRADA (a que começa invisível) tem de ser CSS, nunca framer-motion: o requestAnimationFrame sofre throttle em janela sem foco e a tela trava apagada.
- **4.10 Biblioteca reformada (24/07, noite)** — 'Biblioteca' é o lugar (união de Minha lista + em andamento + baixados) e 'Minha lista' é o que você salvou; e carrossel com snap-mandatory precisa de `scroll-pl-5`, senão o encaixe come o padding e a capa encosta na borda.
- **4.11 Editora ganhou perfil, e comentar deixou de ser só de livro (24/07, noite)** — Editora é declarada uma vez, como lista de ids (rejeitado um campo `publisher` por livro, que multiplicaria erro de grafia), sem ficha institucional inventada — e quando `npm run catalogo` trouxer o campo `publishers` da Open Library, é de lá que a lista deve sair.
- **4.12 Foto que amplia ao toque, estilo Instagram (24/07, noite)** — Camada sobreposta: o portal vai para `#root` e não para o `<body>` (o React escuta eventos só no root, e fora dali clique e tecla morrem); as três armadilhas estão comentadas em components/AvatarAmpliavel.tsx.
- **4.14 Estatísticas de verdade: nasceu o diário de audição (25/07)** — Numa tela de números, o desenho tem de se explicar no primeiro olhar e responder ao TOQUE — o mapa de constância estilo GitHub foi rejeitado por exigir legenda e mouse; e seção sem dado some, em vez de mostrar zero decorativo.
- **O que só apareceu na hora de construir (25/07)** — `story` e `performance` são opcionais no catálogo e caem no `rating` geral — rejeitado preencher os 59 livros com duas notas cada, que seriam números inventados.
- **4.16 As medalhas passaram a ser ganhas; meta e previsão (25/07)** — Cada medalha carrega a própria regra e só acende com dado real — nada de `unlocked` escrito à mão; conquista que depende de servidor (receber curtida) é trocada por um gesto que já existe.
- **Correção de 26/07: o lugar era o problema, sim — o pedido foi para o menu** — A porta do pedido mora no menu de baixo (é ação, não aba); nada de faixa encostada no billboard — o fundo ampliado e borrado da capa vaza sem `overflow-hidden` e muda de cor a cada slide.
- **4.19 Troféus com hierarquia: raridade, progresso e memória (25/07)** — Medalha tem três faixas de raridade em cor sólida (prata, marca, dourado — só a lendária brilha) e progresso visível quando bloqueada; quando tudo vale igual, nada vale.
- **4.20 Cartão de retrospectiva, e as medalhas iguais em todo lugar (25/07)** — Peça de compartilhar é desenhada em `<canvas>`, nunca capturando uma `div` com html2canvas — biblioteca a mais por resultado pior; e a mesma medalha tem a mesma aparência em toda tela.
- **4.21 O cartão ganhou uma segunda versão, e a escolha ficou com quem usa (25/07)** — Quando ele pedir 'mostra com mais informação' sem certeza, entregue as duas versões num alternador em vez de trocar uma pela outra.
- **Resolvido agora — não dependia de banco nenhum** — A tela /help lê os números das regras direto do código (`ratings.ts`, `requests.ts`) — ajuda que envelhece é pior que nenhuma; e fileira de tela deve ler de `collections.ts`, nunca montar lista à mão.
- **4.26 Na Story, nome vale mais que contagem (26/07)** — Em peça pública o destaque é nome (gênero, autor e voz do mês), não contagem — contagem é telemetria e ninguém comenta uma quantidade; as duas peças assinam igual.
- **4.27 O botão que apontava para baixo e não abria nada (26/07)** — Ícone tem de cumprir o que promete: seta para baixo expande no lugar, não navega.
- **O que o botão passou a mostrar, e por quê** — Gênero (`/category/:slug`) e coleção curada (`/collection/:slug`) são listas diferentes e convivem sem repetir.
- **A cor durou uma versão: ícone diz o mesmo sem o arco-íris** — Lista de gêneros: uma cor só (a da marca), ícone monocromático em vez de cor por gênero, e sem contagem de livros ao lado.
- **4.29 O player prometia marcações que nunca existiram (26/07)** — Marcação de áudio: dedupe de 5s (dois toques no mesmo ponto não viram duas linhas) e nota sempre opcional.
- **O azul que não era da casa** — Nenhuma superfície azul ou verde no app: tudo na escala #1a1a1a/#1c1c1c com borda branca a 10% e o laranja da marca — o ícone já diz o que é, a cor é sempre a nossa.
- **As marcações saíram do player (26/07, na sequência)** — O que a pessoa guarda precisa existir fora de onde foi criado — as notas aparecem em /bookmarks, na ficha e no Perfil, todas pela mesma consulta e pelo mesmo painel.
- **"Marcar" não era marcar, era anotar (26/07)** — O toque grava o ponto na hora e a caixa de nota abre por cima já salva — nota nunca é condição para guardar (quem ouve dirigindo ou caminhando toca e segue); no Modo Carro é um toque só, sem caixa.
- **"Marcações" virou "notas", e os atalhos subiram no Perfil (26/07)** — Na tela é 'notas', mas o nome interno segue `bookmarks` (chave, módulo, tipos) — renomear quebraria o storage de quem já usa; e antes de depurar lógica, verifique se o problema é de visibilidade.
- **4.31 "Meu acesso": a reforma que não convenceu, e a tela saiu (26/07)** — Tela precisa de pergunta, não de conteúdo — /plans foi removida por não responder pergunta nenhuma, e só volta quando existir 'quantos créditos eu tenho e o que faço com eles', aí nascendo do zero.
- **O diagnóstico: ela era invisível, não feia** — Para tela, demonstrar ganha de descrever — dirigir o app com o cursor narrando o caminho resolveu em um minuto o que três explicações em texto não resolveram.
- **A decisão, e de quem foi o argumento** — O menu de baixo fica em 5 itens — Descobrir foi fundida na Buscar em vez de ganhar aba própria.
- **O que veio, o que ficou de fora** — A grade de gêneros existe em dois desenhos de propósito (pastilhas com ícone na Início, cartões com capa na Buscar); Lançamentos não se repete porque já é card da Início.
- **O Top 10 virou "Em alta" — e a numeração ficou** — 'Em alta' hoje sai dos melhor avaliados e vira 'mais ouvidos' quando houver servidor — o desenho (fileira numerada) é o final e não muda.
- **O que dá tempo: hoje não existe arquivo nenhum** — Nenhum byte de áudio é gravado hoje — 'baixado' é só uma lista de ids —, então toda a decisão de proteção pode esperar o áudio existir.
- **4.36 "Histórico de escuta" mostrava o presente (26/07)** — Item de menu que só repete o que já está visível na tela não se sustenta — mesmo quando "faz" alguma coisa.
- **O conserto: o dado já existia, ninguém tinha olhado por ele** — O diário de audição já guarda `livros: Record<bookId, segundos>` por dia — `historicoDoLivro(diario, bookId)` fatia por título sem precisar de dado novo.
- **O nome durou uma versão: "histórico" é palavra guarda-chuva** — Rótulo de menu tem de nomear uma coisa, não uma categoria: "histórico" cabe qualquer coisa embaixo e por isso não diz nada.
- **A previsão de término entrou aqui — e é melhor que a das Estatísticas** — A previsão usa o ritmo daquele livro (dias parados incluídos) e a unidade acompanha o tamanho — dias até 45, depois meses, depois anos; "219 dias" ninguém processa.
- **Uma conta só, porque o app estava se contradizendo** — Previsão e redação do prazo vêm de `previsaoDeTermino`/`prazoLegivel` em `lib/listening.ts` — Estatísticas e player usam a mesma; a fonte única vale para a frase, não só para o dado.
- **4.37 A aba "Buscar" virou "Catálogo", e a lupa subiu para a Início (26/07)** — Aba nomeia lugar, não ação; nada no app pode depender de o teclado subir sozinho (o iOS bloqueia autofoco sem gesto), e painel sobreposto não pode nascer dentro do `<header>` com `z-50` — o contexto de empilhamento prende o z-index.
- **4.38 "Detalhes do título" saiu do menu do player (27/07)** — Item de menu se sustenta por conteúdo próprio, não por atalho para tela já alcançável — e ao testar progresso deixe UMA aba aberta: duas abas escrevem no mesmo `localStorage` e parecem roubar o progresso uma da outra.
- **O pedido do Matheus (27/07)** — O clube é dentro do AllBook, como um "a mais" — construí-lo como aplicativo à parte foi proposto e rejeitado pelo Matheus em 27/07.
- **Construído em 27/07 (fundação + sala), e as decisões que apareceram fazendo** — Conversa adiante aparece como marca apagada e sem clique (mostrar que existe não é spoiler; esconder faria a barra mentir), a Comunidade endereça por LIVRO e não por pessoa, e a denúncia é local com o app declarando que só vale neste aparelho.
- **O CLUBE foi construído (27/07, noite) — e o que se decidiu fazendo** — No clube nada é nominal nem cronometrado: a régua compara você com a mediana da roda (não com pessoas), a votação mostra número e esconde quem votou, a rodada não tem hora marcada, e os avisos de prazo são calculados na hora e não acendem o sino — tudo para ninguém mentir o progresso, que é o que quebra a trava de spoiler.
- **Como as pessoas ACHAM um clube e como se convidam (28/07)** — Clube tem data de estreia porque entrar num ciclo já no capítulo 6 constrange; a vitrine de estreias vai no Catálogo mas nunca na Início, e convidar é compartilhar o link do clube — convite por e-mail sem contas seria botão que finge.
- **Quatro ajustes do parecer da Janela A (a fazer antes de codar)** — A trava de spoiler só vira mecanismo depois das contas: hoje `playback.ts` guarda a posição no navegador, então quem ouve no celular e abre no computador aparece no capítulo 1 e a sala se fecha sozinha.
- **4.40 Apurado em 28/07: o clube não usa o próprio diferencial** — Ainda por resolver e medido em 28/07: 52 de 54 sinopses vêm da Open Library em inglês e 7 trazem marcação crua — a de *A Paciente Silenciosa* ainda abre com um link markdown de PDF.
- **O que o Matheus decidiu em 28/07, e o que foi construído** — Poderes do moderador: pauta e votação do próximo livro ficam separadas (só a votação troca o livro de todo mundo), remover membro é reversível para quem removeu, e diminuir o limite de vagas nunca expulsa ninguém.
- **Construído em 28/07, no mesmo dia (janela B)** — Interruptor de privacidade para "ouvindo agora" fica decidido desde já: quando o dado vier do progresso real, ele nasce com opção de esconder.
- **Avaliação × conversa: separadas em 28/07 (era "em aberto", o Matheus mandou fazer)** — Nota é avaliação, âncora é conversa: `commentsForBook` devolve só conversa e a média (`notasDoLivro`) continua somando as resenhas — não devolver estrela para o fio da sala.
- **Privacidade da vitrine: dois interruptores (28/07, pedido do Matheus)** — Esconder "ouvindo agora" tem de esconder também a capa desfocada do topo (uma entrega tanto quanto a outra), e `settings.ts` só aceita chave que o app obedece de verdade; com contas, a escolha vira pergunta do primeiro uso.
- **A cara nova da Comunidade: 4 propostas → a junção → 3 abas (28/07, noite)** — A escada da conversa, que continua valendo: sala = um livro · fórum = um assunto · clube = uma turma com prazo.
- **Segunda avaliação da Comunidade, e um quadro novo de 6 propostas (28/07, noite)** — Trecho é ponteiro, não cópia de áudio (livro + início + duração + a frase do porquê, obrigatória) e marca-se para trás, com os últimos 40 s — e o ponteiro precisa guardar QUAL versão do arquivo: remasterizar desloca os segundos e todo trecho passa a apontar para o lugar errado.
- **"Os botõezinhos eram uma camisa de força que eu mesmo pus"** — O moderador é a chave do clube: datas, vagas e marcos são campos livres e os botõezinhos só preenchem — o último marco sugerido é sempre o livro inteiro, capítulo de marco nunca regride, e a estreia trava quando o ciclo começa.
- **A tela de clubes tinha duas gavetas e nenhuma escala** — Pastilhas de tópico saem dos clubes que existem, nunca da lista de gêneros do catálogo (senão nasce "Romance · 0"), e a busca de clube varre também livro e autor — a pergunta real é "tem alguém lendo Duna?".
- **Encher de clube para ver se o desenho aguenta** — Desenho de lista só se prova com vinte itens, não com cinco — e figurante de clube (nome + cor) mora em `clubes.ts`; `community.ts` é só para leitores com biografia, encher um com o outro estraga a Comunidade.
- **Registrado porque ele levantou e descartou sozinho** — Votação do próximo livro perto do fim do ciclo já existe — não propor de novo.
- **A recomendação da janela A** — Um mecanismo, três formatos (sala, clube, fórum) e um vocabulário só de temas: o `genero` do clube já alimenta as pastilhas — um segundo vocabulário faria "Suspense" existir duas vezes, com contagens diferentes e busca que não se acha.
- **Construída no mesmo dia — e o que foi decidido fazendo** — A citação é valor solto (`bookId`, início, duração) e no comentário guarda-se só a duração — o início é a âncora que já existia; `?ate=` faz o player parar no fim do trecho, e a cerca cai quando a pessoa arrasta a barra.
- **O cortador de trecho, logo depois** — O cortador tem arraste E ajuste fino de ±1s/±5s porque o dedo cobre 4 a 6 segundos nessa escala — e, sem áudio, cortar é mirar pelo relógio, não pelo ouvido.
- **Quem cria modera o conteúdo — mas não pode demolir a casa** — Quem cria o fórum modera conteúdo (tudo reversível, e cobrir spoiler vem antes de esconder). ~~Só pode apagar o fórum enquanto nenhum tópico de outra pessoa estiver dentro~~ **[REVERTIDA pela §4.74 (31/07), três linhas abaixo]** — no molde Orkut o dono exclui a comunidade inteira.
- **A troca de nome, feita** — Na tela é "Fórum", no código continua `grupo` (renomear jogaria fora as chaves do `localStorage` de quem já usa) — e "grupo" significa outra coisa no clube, nas conquistas e na Ajuda: nunca substituir a palavra em massa.
- **A decisão: cortar se faz ouvindo, anexar se faz escrevendo** — Cortar se faz ouvindo (no player) e anexar se faz escrevendo (botão de clipe em qualquer campo) — o trecho é coisa guardada, nunca sub-ação de comentar; a mesma `Citacao` e o mesmo cartão valem na sala, no clube, no fórum e no feed.
- **O que isso implica, e por que vale** — A mesma `Citacao` serve sala do livro, mural do clube, fórum e feed — escrever um mecanismo só, nunca quatro parecidos; guardar o mesmo corte de novo não duplica.
- **Guardar num toque: o caminho era longo demais** — Padrão primeiro, ajuste depois: um toque guarda 40 s a partir de onde você está, e o corte exato é refinamento, nunca pedágio.
- **"Não tô vendo pra onde é que eles estão indo"** — Vocabulário: "trecho" é reservado ao pedaço de áudio; dentro das notas fala-se "marcação" e "ponto".
- **"Guardar 40s" nomeia o teto, não a coisa** — Rótulo nomeia a coisa, não o limite ("Guardar trecho"); a duração real só aparece no aviso, depois de guardar.
- **O ícone de aspas saiu do cartão de citação** — Ícone a 10px não é legível, e um terceiro sinal para o que rótulo e onda já dizem é ruído — não repor.
- **Guardar em um toque e poder corrigir** — Nunca pendurar ação essencial só no aviso que some em 5 s — repetir o caminho no próprio botão onde o dedo já está.
- **4.51 "Ver a conversa" levava à sinopse (28/07)** — Aviso de resposta abre a conversa (`/book/:id/conversa`); aviso do sistema, e o nome do livro dentro de uma frase, abrem a ficha.
- **4.52 Um pixel, um dono: as marcas saem de cima da barra (28/07)** — Medido: um dedo cobre ~34px; alvo de 5×5 dentro da área de arraste do slider fazia o toque virar arraste e o áudio pular de lugar.
- **A rede de segurança: "Voltar para 12:31"** — Salto acima de 15 s oferece "voltar para …" por 8 s, acima da barra — abaixo dela ficaria por cima do trilho da conversa.
- **Desenho: três correções minhas, aceitas ou pendentes** — Uma fileira de pílulas carrega um critério só (escopo vira ordem, estado vira seção); e enquanto houver pouca gente o feed se enche do que o app produz — trechos, clubes estreando —, não de gente.
- **O que isso simplifica** — "Privado" não é um modo do app: é só a pergunta de quem vira seu seguidor — não existem duas versões de tela nem dois cálculos de visibilidade.
- **Construído em 29/07 (maquete), no mesmo dia** — As promessas que o backend tem de honrar estão em `docs/BANCO-DE-DADOS.md` §3.1: recusar e remover são silenciosos, ligar a tranca não expulsa quem já seguia, e a visibilidade da atividade é filtrada no servidor, nunca na tela.
- **1. "Como é que eu vejo e aceito o pedido?"** — O contador de pedidos é somado no TopNav, nunca dentro de `unreadNotificationCount()` — `seguidores.ts` e `notifications.ts` não podem se importar (ciclo). E aviso que obriga a caçar outra tela é meia notificação: os botões vão no próprio cartão.
- **2. A privacidade estava expandida no painel; virou uma linha** — No painel Você toda entrada é uma linha com seta que abre outra tela — nada fica expandido ali dentro.
- **3. Seguidores são assunto de perfil, não de configuração** — Seguidores são assunto de perfil, não de privacidade — o contador mora na linha de números do perfil e é o único deles que leva a algum lugar.
- **Como fica, então** — O menu é para quem procura, o cartão no feed é para quem só está passando — clube e fórum aparecem nos dois lugares.
- **Cada parte do cartão leva ao seu lugar** — Número que descreve algo existente e não leva até ele morre na tela; e curiosidade de passagem abre em folha, não em tela, para não perder o lugar na rolagem.
- **~~Curtir: só curtir, sem descurtir~~ [REVERTIDA — o par voltou]** — o "só curtir" foi um atropelo meu sem fato novo (ver "O erro: eu reabri uma decisão dele", §4.73); vale o par de polegares. O que sobrevive desta linha: contador de reação de terceiros é simulado com semente pelo id (estável, senão a tela mente a cada desenho), e post seu começa em zero.
- **O que foi deixado de fora, e não é esquecimento** — O post aponta para livro, trecho ou clube — nunca para tópico de fórum; e os posts antigos do mural foram herdados, não apagados.
- **Detalhe de data, que veio de um mal-entendido útil** — Data relativa até 7 dias ("há 2 h", "ontem"); passados 7, data absoluta ("12 jul"), porque "há 3 semanas" obriga a fazer conta.
- **Chave de armazenamento nova, e por que não deu para reusar a do mural** — Os posts vivem em `allbook_posts` e os antigos do mural em `allbook_mural_posts` — qualquer operação de apagar precisa tentar nos dois formatos.
- **O botão de clube só existe se você estiver em algum clube** — Botão desabilitado é pior que botão ausente: parece defeito.
- **Dois defeitos que só apareceram na tela** — Preview de anexo dentro de um campo de escrita tem de ser inerte — o cartão que é link leva a pessoa embora e o texto vai junto.
- **A queixa que revelou dois buracos: "não colocou a capa do clube"** — Livro e clube podem dividir o mesmo nome no catálogo ("O clube das 5 da manhã") — a lista do `@` precisa deixar claro qual é qual.
- **O post que ele já tinha escrito ganhou a capa** — O cartão é derivado na leitura só quando não há nada gravado, e `semCartao` distingue "tirei o cartão" de "nunca teve" — nunca reescrever o localStorage na hora de ler.
- **A página de um post (/post/:id) — nasceu de uma necessidade, não de um desejo** — Todo aviso precisa de endereço: o sino leva a `/post/:id`, com a conversa já aberta — feed cronológico não serve de destino.
- **Três defeitos pegos na tela, e nenhum apareceu no tsc** — `autoFocus` só vale na montagem — para focar um campo depois, use um contador que o pai incrementa, com zero significando "não peça foco" (senão o teclado do celular sobe só para ler).
- **O esqueleto responde de volta — e por que isso não é enfeite** — A resposta automática do autor do post (2,5 s, e só em post de outra pessoa) é simulação — sai inteira quando houver servidor.
- **4.63 O que a primeira hora de uso revelou (30/07)** — A lista de defeitos mais útil vem de quem usa o app, não de quem lê o código.
- **"Esse curtir não está funcionando" — e ele funcionava** — Alvo de toque mínimo de 44px em qualquer botão pequeno: py-3 -my-3 (o padding cria o alvo, a margem negativa devolve o espaço ao layout).
- **A ordem dos comentários estava errada, e a ordem sozinha não resolvia** — Campo de comentar em cima e lista do mais novo para o mais velho — quem escreve precisa ver o que escreveu, senão escreve de novo.
- **O cartão de pessoa: a ideia foi dele, a ressalva foi minha, e as duas entraram** — Cartão de pessoa só existe com as capas dos livros dela dentro (narrações primeiro); sem livro nenhum, não há cartão — autor e narrador quase nunca têm foto.
- **A crítica que refez o compartilhar no mesmo dia — e vale como método** — Peça com equivalente óbvio nas redes que todo mundo usa se constrói inteira sem perguntar — só o que foge do padrão pede conversa.
- **Duas formas, e é a presença do texto que decide** — Compartilhar sem texto mostra o cartão original inteiro; com texto, a sua fala na frente e o original numa moldura menor — a forma sai do gesto, nunca de um seletor.
- **Saiu do "…" e virou botão da barra** — Compartilhar é ação de primeira classe (botão na barra, não menu), e o número ao lado só aparece quando é contagem real.
- **Dois defeitos meus, achados na tela** — Botão aceso que não faz nada é pior que botão ausente — ao proibir uma ação, apague o botão ou permita a ação.
- **O defeito que só a tela mostrou: o mesmo post duas vezes** — Um post aparece uma vez só por lente, e quem ganha é o compartilhamento (a lista é cronológica, basta guardar a primeira ocorrência).
- **Os cartões de convite: onde entram, e por que ali** — Convite no feed: nunca no topo, só na lente Todos, nunca com menos de 4 itens, sempre com etiqueta que o separa de propaganda; prefere clube que ainda vai estrear e nunca clube lotado.
- **A atividade voltou, mas num degrau abaixo** — Atividade de quem você segue entra como linha baixa na mesma cronologia dos posts (nunca cartão, teto de 12) — o feed feito de pessoas já falhou onze vezes.
- **O que entrou** — Dentro da página de uma pessoa o botão Seguir sai dos cartões (já está no alto); no feed ele fica, porque lá cada cartão é de alguém diferente.
- **As três portas, e as três páginas que elas precisavam (mesma noite)** — Porta de perfil leva número (zero fica apagada mas continua), o mesmo número nunca aparece duas vezes na tela, e a sua página e a dos outros usam um componente só (PortasDoPerfil).
- **4.67 O curtir deixou de existir pela metade (30/07, noite)** — A mesma ação existe em todo lugar onde faz sentido, por um componente só — ação que vale em metade dos lugares ensina a pessoa a parar de tentar.
- **"Não ter servidor não impede" — a régua repetida pelo Matheus** — Falta de back-end nunca é argumento para não construir ou construir menos: construa inteiro com a fonte de dados isolada.
- **As três regras, e o que cada uma evita** — Qualquer membro convida (remover é só do dono); clube lotado ou com ciclo começado não pode ser convidado, e o não aparece escrito em cinza em vez de o clube sumir da lista.
- **Os dois lados existem — e um deles é simulado, de propósito** — Simulação sempre estável pelo id e nunca com 100% de sucesso (1 em 4 recusa) — app onde todo convite é aceito ensina errado.
- **Detalhes que a tela cobrou** — Cartões que pedem resposta usam todos a mesma forma, e a decisão se efetiva dentro da lib (nunca em dois passos na tela).
- **Renomear o clube** — Nome vazio não passa: clube sem nome não é citável com @ nem achável na busca.
- **A votação passou a existir de verdade — e aceita de 2 a 5 livros** — Votação de 2 a 5 livros com 3 sugerido (com 5 opções e 8 pessoas o vencedor sai com 3 votos), e no empate quem desempata é o dono, nunca sorteio.
- **Quem perdeu a votação funda o próprio clube** — Nunca mover gente de um clube para outro (é decidir por ela); quem perdeu a votação recebe o convite de fundar o clube do livro derrotado, com o formulário já preenchido.
- **A lista de espera: clube cheio deixou de ser porta fechada** — Sem vaga, a tela diz o que fazer (aumentar o limite) em vez de apagar o botão; a turma 2 automática continua rejeitada, e o teto de 250 é onde fila vira mentira.
- **O convite honesto, que é o que faz a peça existir** — Interruptor de privacidade só se pede depois de mostrar o que se ganha, e o convite não vaza nome nem capítulo — a reciprocidade pressiona, e por isso o padrão é desligado.
- **4.71 Trechos quentes (30/07, noite)** — Rótulo não promete janela que os dados não têm (por isso da semana virou estão circulando), e trechos no mesmo bloco de 30s somam calor em vez de virar dois cartões iguais.
- **4. O sino não sabe que curtiram você** — Curtida notifica agrupada (Ana e mais 3 curtiram seu post), e descurtida não notifica.
- **As duas correções dele, no mesmo minuto** — Um par de reação só: polegares, âmbar no positivo e branco no negativo — o negativo se distingue por peso, nunca por outra cor fora da paleta.
- **A linha de recepção — a resposta ao pedido de audácia** — Elemento só existe quando carrega informação: a barra de divisão aparece apenas em post que dividiu, e os rostos de quem reagiu respondem o que número nenhum responde.
- **O que a lista aberta obrigou a consertar por baixo** — Número é sempre o tamanho da lista real (nunca um sorteio à parte), as duas listas saem de uma permutação só para ninguém aparecer nos dois lados, e o autor não reage a si mesmo.
- **Onde ficou** — Contador curado maior que a população fictícia se resolve com E mais N leitores no fim da lista — não baixando o número nem torcendo para ninguém contar.
- **4.74 A aba Fóruns vira o Orkut — decisão e escopo (31/07)** — Da referência Orkut ficou a estrutura e a governança; a aparência de 2004 saiu.
- **O que isso reverte, e fica registrado** — Na comunidade o dono exclui a casa inteira (reverte a §4.44), e a imagem é enviada de verdade, encolhida no próprio navegador (canvas 140x140, JPEG, data: URL, zero servidor).
- **A aba inteira, construída no mesmo dia** — Enquete sua nasce com zero voto; só a semeada tem votos fictícios — fingir doze votos no que você acabou de perguntar é a mentira mais fácil de perceber.
- **A pele voltou a ser a do AllBook, no fim do mesmo dia** — Do Orkut ficou a estrutura (ficha com os mesmos campos, mensagem numerada, paginação de 10 em 10, enquete com barra, evento com vou/talvez/não vou) e a governança intacta; a pele é a do AllBook.
- **O que ainda não existe** — Continuam faltando, sem botão morto na tela: convidar amigos para a comunidade e a denúncia com destino.
- **Os rostos: gerados, não fotografados — e por quê** — Se um dia se voltar a avatar gerado (DiceBear), só estilo CC0 — lorelei e micah são CC BY e exigiriam crédito na tela.
- **As capas: o mosaico das capas dos livros, não foto de banco** — Imagem de terceiro no app só CC0 ou domínio público (LoremFlickr veio cc-nc-nd com marca d'água, impróprio num app que será vendido) — e script que acha 8 de 24 e não reclama é o pior tipo de falha.
- **1. Ilustração no lugar de foto — eu troquei o pedido por uma objeção minha** — Levantar a objeção uma vez é obrigação; decidir por ela depois de ele responder é trocar o pedido dele pelo meu.
- **3. Capa de comunidade não é prateleira** — A capa de uma comunidade diz do que se fala ali, não o que se lê — nada de mosaico de capas de livro; e a foto enviada pelo dono sempre ganha da que veio pronta.
- **4.78 A busca de comunidades não era grade de quadradinhos (31/07)** — Grade é para o que se reconhece; lista é para o que se lê antes de escolher — a forma se decide pelo que a pessoa precisa saber naquele momento, não pelo que fica bonito.
- **O que foi feito — ligação de mão única** — Convite de evento não dá entrada no clube nem no fórum, e em comunidade privada só se chama quem já é da turma — convite para porta fechada é beco sem saída.
- **Um bug de estado achado no teste** — Nunca forçar redesenho com key={versao} no corpo da página: remontar apaga o estado dos filhos (lista aberta, texto meio digitado).
- **Como ficou** — Peça inteira só onde se age; o resto é lista com ver todas (N) — e o destaque é o fixado pelo moderador, senão o mais votado entre os abertos.
- **Um bug de tela achado no meio** — Componente que lê estado guardado fora do React precisa escutar o evento de mudança, senão só redesenha ao recarregar.
- **O que a ideia tem de forte, e não é óbvio** — A sala ao vivo é barata porque lib/sala.ts já prende cada comentário a um segundo do áudio — ela é a camada síncrona sobre peça existente.
- **Uma decisão de arquitetura proposta, e o motivo** — A sala é do player, não do clube, e é convocada de três portas (livro, clube, evento) — dentro do clube o caso de ouvir a dois ficaria sem lugar.
- **B descartada — e o argumento dele derruba o meu de vez** — Nada de turnos obrigatórios na sala: quem entra escolheu conversar, e quem não quer conversar tem o app inteiro para ouvir sozinho.
- **Moderação: o poder já existe, não se inventa nada** — Privacidade do que se diz na sala usa a moderação que o clube já tem (privado, aprovar quem entra, banir) — não se inventa poder novo.
- **Requisito novo: quem assiste precisa se situar** — Sala ao vivo: quem assiste vê o player inteiro (capítulo, quanto falta, posição) — só não tem os controles; perder o controle é a regra, perder o mapa é defeito.
- **O clube ao vivo — a ideia que fecha tudo** — O clube tem dois modos e nomes distintos: *rodada* (sem hora, §4.39) e *sessão de escuta* (com hora); ao vivo é vocação, não um segundo tipo de clube.
- **Construído em 31/07 (noite) — e o que se decidiu construindo** — Armadilha do dado semeado: cópia do usuário e original com o MESMO id na mesma lista fazem o buscador devolver sempre o original — tudo que a pessoa escreve some sem erro; a cópia tem de ganhar do fictício.
- **O que estava por baixo** — Bug silencioso conhecido: campo que só existe na config editável e nunca nos dados semeados faz o filtro devolver vazio em toda escolha, sem erro na tela.
- **O que foi feito** — Categoria de audiolivro não é só gênero do texto — inclui situação de escuta (trânsito, academia, dormindo); e o seletor "buscar em nome/descrição/ambos" foi rejeitado: busca sempre nos dois.
- **4.84 Seguir autor, narrador, editora e o Studio (31/07)** — O botão chama "Seguir" (verbo do Spotify/YouTube/Netflix); o que precisa ser explícito é a promessa embaixo dele, não o verbo.
- **Como ficou** — Tela que junta assuntos que não se encontram acaba com nome vago; e antes de tirar um ajuste "redundante", conferir se o lugar principal realmente faz o trabalho.
- **As quatro propostas, na folha de escolha (01/08)** — Rejeitada: desviar quem escreve nome de livro no fórum — depende de adivinhar pelo título (o erro "carro"×"Carrie" da §4.18) e a saída "publicar mesmo assim" denuncia a regra.
- **As oito, e o que cada uma revelou** — Banir ≠ remover (removido volta por porta, fila ou convite; banido não volta por caminho nenhum) e o lembrete de sessão só dispara com o app aberto — sem servidor não há alarme, e fingir que há é pior.
- **O que eu NÃO tirei, e é decisão dele** — Continua pendente da sala ao vivo: ela não aparece na Home (a tela mais vista) e ninguém é avisado quando uma sessão acaba e deixa rastro para ouvir depois.
- **✔ Decidido no mesmo dia: o clube vira abas** — O ponto de aviso só acende na aba fechada, e nunca por "mensagem nova" — ponto que nunca apaga deixa de significar coisa alguma.
- **4.90 A comunidade não tinha página de tópicos (31/07, noite)** — Conteúdo que cresce sem limite não mora na página da comunidade: resumo lá, lista completa numa página com endereço próprio.
- **4.88 A faxina: arquivos mortos, código morto e a pergunta dos testes (31/07, noite)** — Lacunas achadas na faxina, sem decisão: "você já pediu este título" existe e nenhuma tela chama (pedir duas vezes passa em silêncio); pauta encerrada some sem histórico; e a faxina de "Neste aparelho" não zera as horas das Estatísticas — decidir se deve.
- **Segunda passada, na mesma noite — "não tem mais nada pra ser limpo?"** — Depois de cortar função, rodar `npx tsc --noEmit --noUnusedLocals` — o `npm run check` deixa sobra passar; e o depcheck engana: acusa `tailwindcss`/`tw-animate-css` (importados na 1ª linha do `index.css`) e o time do backend futuro (passport, express-session, connect-pg-simple, memorystore), que ficam.
- **E o que faltava não era só tela: era conversa** — Tela nova que oferece busca, filtro ou paginação precisa de conteúdo que justifique a ferramenta — senão ela denuncia o vazio em vez de escondê-lo.
- **O método, que ele elegeu e ficou** — Ele decide vendo, não lendo: proposta de tela só vale desenhada de verdade (moldura de celular, cores, fontes e capas reais) — ASCII ele recusa sem ler.
- **As decisões que só apareceram construindo** — Capa de livro é retrato: esticada em banner deitado vira uma tira do meio da arte — usar a capa em pé sobre o borrão dela mesma; e mensagem de busca vazia tem de confessar o filtro ligado e oferecer soltá-lo.
- **O que morreu junto** — Quando uma aba vira destino, a função que a desenhava morre no mesmo commit — código que ninguém chama não dá erro, só faz a próxima pessoa achar que existe uma tela que não existe.
- **O que ficou** — Toda menção com @ vira cartão — e só a primeira do texto —, em post e em comentário, com prévia enquanto se escreve; cartão de pessoa nomeia o livro da miniatura.
- **Dois defeitos achados construindo** — Um pixel, um dono: dentro de um cartão-link, a capa e o nome abrem a ficha e o ▶ vai para o player — e navegação usa `Link`, nunca `<a href>` cru (recarrega o app inteiro).
- **4.96 Os nomes dos botões: a varredura inteira, e a régua que ficou (01/08)** — Existe uma rota real de API: `POST /api/folha/respostas` grava as escolhas de qualquer folha de propostas em `_respostas-de-folhas/`.
- **O que estava quebrado, e só apareceu ao mover** — Ao mudar um controle de lugar, verifique antes se ele faz alguma coisa — dois interruptores de Privacidade eram gravados no localStorage e nenhum código os lia; mudar de casa um botão morto só faz mais gente ver a mentira.
- **5. Backlog de faxina técnica (não urgente)** — Pendências de faxina: quando o backend nascer, filtrar campos sensíveis do log e trocar o 500 por mensagem genérica; falta uma `og:image` própria; conferir capas a olho (a busca por aproximação traz arte de outro volume da série — usar `isbnDaCapa`); o id 5 fica sem capa real de propósito (usa a tipográfica) e o ISBN 9781400079179 é do "Código Da Vinci", não de "Anjos e Demônios".

---

## A poda dos `.md` (04/08/2026) — o critério, e por que ele vale para a próxima

O Matheus mandou podar os `.md` do projeto e os pessoais dele, a partir da
recomendação pública de **Boris Cherny** (criador do Claude Code, YC Startup
School 2026): *"a cada 6 meses, apague seu claude.md, suas skills e seus hooks,
e veja o que o modelo faz. Para o Opus 5 recomendamos fortemente tentar, porque
o modelo pode não precisar mais das instruções extensas que os modelos
anteriores exigiam"* — a Anthropic cortou **+80%** do prompt interno do Claude
Code por ablação. A queixa dele, nas palavras dele: *"tem muitas decisões que a
gente toma que são muito específicas, e hoje já não fazem mais sentido; sem
contar que o roteiro está muito grande"*.

**Ele tinha razão, e a evidência é dura.** Uma varredura de 10 agentes conferiu
os documentos contra o código:

- o `CLAUDE.md` — o único que entra no contexto **em toda conversa** — tinha
  **7 afirmações falsas de gravidade alta**: dizia que o `BottomNav` tem
  "Buscar" e "Perfil" (tem Catálogo e Comunidade), listava **Fuse.js** como
  dependência (desinstalado em 31/07), dizia que `server/routes.ts` está vazio
  (tem a rota das folhas) e mandava *"começar pela tela Descobrir"*, que não
  existe desde 26/07. A tabela de rotas listava **23 de 53** — foi apagada, e no
  lugar ficou um ponteiro para `client/src/App.tsx`;
- no ROTEIRO, a auditoria da §4.72 listava **5 pendências, e as 5 são falsas
  hoje** — todas foram construídas depois, e o documento seguia pedindo. Quem
  lesse aquilo construiria de novo o que já existe.

**O critério que ficou, e é o que vale na próxima poda:**

| fica no `ROTEIRO.md` | vai para o `ROTEIRO-ARQUIVO.md` | sai de vez |
|---|---|---|
| decisão em vigor; ideia **rejeitada** cuja rejeição ainda vale; pendência em aberto; apuração cara; armadilha que quebra em silêncio | o relato do que foi construído — já está no código e no git | o que hoje é **falso**, o duplicado, e o que foi depois revertido |

**A regra por trás de tudo: não duplicar o que o código já diz.** A tabela de
rotas do `CLAUDE.md` não tinha como não envelhecer — nenhum documento que
espelha o código sobrevive a um ano de mudanças. Onde o código é a verdade, o
documento aponta para ele.

**Correção de premissa, apurada no mesmo dia:** o `ROTEIRO.md` **não** entra
sozinho no contexto de cada conversa — só o `CLAUDE.md` do projeto, o pessoal e
o `MEMORY.md` entram. O roteiro só pesa quando alguém o abre. Ou seja: podar o
`CLAUDE.md` reduz custo em **toda mensagem**; podar o roteiro é sobre torná-lo
**usável e verdadeiro**, não sobre custo por mensagem. As duas coisas valiam a
pena, por motivos diferentes.

**Números:** ROTEIRO de 8182 para o tamanho atual; `CLAUDE.md` de 342 para
151; o `CLAUDE.md` pessoal dele de 175 para 91; 4 memórias que viraram duplicata
apagadas; `docs/PROXIMOS-PASSOS.md` apagado (era de 21/07 e mandava construir a
tela de Perfil, pronta desde então).

### A segunda passada (04/08, à noite) — o que a poda sozinha não fazia

Quatro melhorias, todas medidas antes de feitas:

1. **O quadro de coordenação era o maior custo por sessão e ninguém tinha
   olhado para ele**: 36 mil caracteres (mais que `CLAUDE.md` + pessoal +
   `MEMORY.md` somados), porque o histórico morava dentro das células. Caiu
   para ~4,5 mil; o histórico foi para `docs/COORDENACAO-ARQUIVO.md`, e o
   próprio quadro ganhou a regra "célula = estado atual".
2. **A trava contra o apodrecimento**: `npm run docs:check`
   (`scripts/confere-docs.mjs`), rodando no hook `pre-commit` — confere se
   caminho, rota e comando citados no `CLAUDE.md` existem de verdade (erro
   bloqueia o commit) e avisa citação morta no ROTEIRO. É o conserto
   definitivo: sem ela, a poda teria de ser refeita a cada seis meses; com
   ela, a afirmação falsa aparece no dia em que nasce. Frase verdadeira sobre
   coisa morta ("X foi apagado") não acusa.
3. **A caça de contradições**: um agente leu o roteiro podado inteiro e achou
   **12 contradições reais** — quase todas no mesmo padrão: a reversão existia
   numa regra herdada de uma linha no fim, e a seção antiga seguia no corpo
   mandando o contrário. Todas ganharam nota `[REVOGADA/SUPERADA por §X]` no
   lugar onde o leitor tropeçaria. Três itens da fila de decisões já estavam
   decididos (o clube virou abas na §4.89; a saída da narração se resolveu com
   os créditos; a busca de pessoas foi adiada pela §4.97) — a fila foi
   corrigida. **Lição: podar sem caçar contradição deixa o documento menor e
   igualmente traiçoeiro.**
4. **O inventário do banco estava com um terço da realidade**: o
   `BANCO-DE-DADOS.md` cobria 21 chaves e o código tem **61**. As 39 ausentes
   entraram (seção 1.1), agrupadas, cada uma com a armadilha — inclusive duas
   transversais que o documento não nomeava: o *overlay por cima do esqueleto*
   (a chave guarda a diferença sobre dados semeados que vivem no código —
   mudar a semente órfã os dados em silêncio) e o *"eu" sem conta* (autor
   ausente = usuário local, quebra no dia em que houver contas).

**O teste de ablação, feito de verdade (e o resultado surpreende):** um agente
respondeu 8 perguntas operacionais **proibido de ler qualquer `.md`**, só com o
código. Acertou **7 de 8 com confiança alta** — porque os porquês deste projeto
estão escritos como comentário dentro dos próprios arquivos (`servidor.sh`
explica o launchd, `SearchResults.tsx` documenta a morte do Fuse, o
`catalog-enriched.ts` se declara gerado na linha 1). O que ele **não**
conseguiu: as regras exatas da coordenação entre janelas e o conteúdo do
checklist do banco — exatamente o que só os `.md` carregam. **Conclusão: o
`CLAUDE.md` compra velocidade (o agente gastou 17 chamadas de ferramenta para
redescobrir o que ele entrega de graça), e os únicos conteúdos insubstituíveis
são coordenação, checklist do banco e gosto/preferência — a poda não cortou
nada essencial, e comentário bom no código vale mais que parágrafo em
documento.**

`docs/BANCO-DE-DADOS.md`, fora a seção 1.1 nova, segue como era: checklist de
trabalho futuro, lido só ao mexer em banco.

---

## 4.98 A fila respondida de uma vez — nove decisões numa folha (04/08, noite)

A poda deixou a fila de pendências à vista, e o Matheus respondeu as **9
maduras** (+ 3 tarefas) numa folha clicável (`_fila-de-decisoes-C.html`).
Registro decisão a decisão — **as de rumo valem a partir de agora**:

1. **Linha do ciclo do clube — decisão ADIADA por ele, de propósito:** *"eu
   teria que ver as duas opções, tanto no topo da aba Agora quanto dentro da
   aba Conversa"*. Uma folha comparativa com as duas posições desenhadas está
   sendo feita; a escolha fica para ela.
2. **Crédito de pedido ACUMULA, com teto de 3 guardados** (era a pendência 1
   da "Atualização de 26/07" — fechada). Crédito que expira gera raiva por algo
   que não custou nada ao AllBook; acúmulo infinito criaria fila de produção
   que chega toda de uma vez.
3. **Os números dos planos (R$, nomes, teste grátis) ficam CONGELADOS até a
   tela de Planos nascer.** Saem da fila de pendências: viram parte do trabalho
   da tela, no dia dela. Número decidido sem lugar para morar envelhece igual
   documento.
4. **O "Ouvindo agora" volta a ter vitrine: fileira no topo da Comunidade,
   na lente Todos** (rosto + capinha; rosto abre a pessoa, capa abre o livro).
   Fecha a ressalva que sobrou da morte da aba Pessoas.
5. **O modo carro SAI do player** — decisão dele, contra a recomendação (que
   era manter por custo zero). A apuração da §4.33 (Audible não conecta nada;
   modo carro de todo mundo é tela de botão grande) fica como histórico; o
   critério da §4.50 (o "…" guarda o que é raro) até melhora: um item a menos.
6. **A tela Downloads FICA — assunto encerrado.** Offline é função central de
   app de audiolivro; quando o áudio real chegar, o download vira de verdade
   (e só no app instalado — regra já no checklist do banco).
7. **Perfil privado APARECE nas sugestões de gente, com o cadeado à vista**
   (padrão Instagram: privado limita o que se vê, não a existência). Fecha a
   escolha que ficou aberta em 29/07; vale como contrato do backend (3.1).
8. **/perguntas divide em "Ainda sem resposta" (em cima) e "Respondidas"** —
   quem entra para ajudar acha na hora o que precisa de gente.
9. **O onboarding fica para JUNTO DO BACKEND** — decisão dele, contra a
   recomendação de fazer o mínimo de 3 passos agora. Com isso, **o frontend
   está completo por decisão**: nenhuma tela pendente restante (a última foi
   conscientemente adiada, não esquecida).

**As três tarefas, todas aprovadas ("faz"):** as 10 fotos de comunidade que
faltam; a conferência de capas a olho nas categorias; a `og:image` própria
para o link do app.

---

## 4.101 A linha do ciclo tem endereço: o topo da aba "Agora" (04/08, noite)

**A última ponta em aberto da §4.57 fechou.** Na folha `_linha-do-ciclo-C.html`
— as duas posições desenhadas *no lugar real*, como ele pediu — o Matheus
escolheu a **posição A**: a linha inteira no topo da aba *Agora*, com a versão
de uma linha só acompanhando na *Conversa* (fazia parte da opção escolhida).

**O que ficou de pé (`components/clube/LinhaDoCiclo.tsx`):**

- A linha vive **dentro do `CartaoDoCiclo`** — que já é a primeira coisa da
  aba — **no lugar da régua você×roda**: duas barras de progresso na mesma
  tela seriam a mesma informação duas vezes. A régua saiu; a regra dela (§4.39)
  ficou: a comparação é **agregada, sem nomear ninguém** — apontar "Fulano está
  no 9" leva a mentir progresso, e progresso mentido quebra a trava de spoiler.
- A escala é a dos **capítulos do livro do ciclo**: o preenchimento vai até
  onde VOCÊ ouviu (etiqueta "você · cap. N" na ponta), as bolinhas são os
  **marcos do combinado** — acesas quando o prazo já passou —, e as pontas
  dizem as datas de início e de encontro.
- Embaixo, a frase da turma: *"A turma está entre o cap. 3 e o 6 · 5 já
  passaram de você"* — números de `progressoDosMembros`, os mesmos da roda,
  nada inventado (§4.92).
- Na aba *Conversa*, a **compacta**: só a frase, num filete acima do mural.
- A linha **some no clube que ainda vai estrear** (barra vazia fingindo
  informação — a lição da §4.99), e a frase some para quem está sozinho no
  clube (não há turma a situar).

**Rejeitadas na folha:** a posição B (só na Conversa — a aba Agora perderia o
resumo do momento), o "nas duas por inteiro" (a mesma régua em dois lugares) e
o "não construir".

---

## 4.100 A Comunidade sem cabeçalho: stories do ao vivo e o painel-quadradinho (04/08, noite)

> A §4.99 é da tela `/clubes` (janela B, mesma noite); esta é a reforma do topo
> da Comunidade, ditada pelo Matheus em cima da tela.

**Primeiro, um erro meu que virou lição de método.** O item 4 da folha da fila
(§4.98) — a fileira "Ouvindo agora" — **caiu no mesmo dia**: ele aprovou
achando que era a vitrine do **ao vivo** (a transmissão que se entra junto), e
era presença passiva. Palavra dele: *"eu só aprovei a construção porque pensei
que era para o ouvindo agora ao vivo"*. A fileira foi removida e o componente
apagado. **A lição, para toda folha futura: maquete de peça nova precisa dizer
também o que a peça NÃO é** — os dois blocos tinham nomes quase iguais ("AO
VIVO AGORA" / "OUVINDO AGORA") na mesma tela, e a confusão era inevitável.

**As decisões dele, todas construídas na hora:**

1. **O cabeçalho da Comunidade morreu** — o título repetia a aba do menu de
   baixo e o subtítulo ("Quem está ouvindo, conversando e recomendando") era
   decorativo. A tela abre direto no conteúdo.
2. **O ao vivo virou stories, no topo** — *"é uma coisa que as pessoas já estão
   acostumadas"*: anel gradiente vermelho-laranja girando, avatar do anfitrião,
   capinha do livro, selo AO VIVO e a contagem de ouvintes; tocar entra na sala
   no ponto da turma (`comunidade/SalasComoStories.tsx`). Substitui o cartão
   vermelho de três linhas. ⚠️ O componente antigo
   (`components/sala/SalasAoVivoNoFeed.tsx`, faixa da B) **ficou órfão** —
   candidato à próxima faxina, não apagado por ser de outra faixa.
3. **O menu "…" virou o quadradinho** — referência explícita dele: o Facebook.
   `comunidade/PainelDaComunidade.tsx` guarda os mesmos 11 destinos em cartões
   com grade de 2 colunas, salas ao vivo em destaque vermelho no alto e a seção
   "Criar" separada. `MenuDaComunidade.tsx` foi apagado. **A regra da §4.57 não
   mudou:** o painel só leva ao que é da comunidade; o que é seu continua no
   avatar. As contagens continuam reais e condicionais (§4.23). *(A primeira
   forma — botão na fileira das lentes, painel de tela inteira, ícones
   coloridos — durou uma olhada dele; as correções estão logo abaixo.)*
4. "Meus clubes" no painel já aponta para `/clubes/meus`, a rota que a B criou
   na §4.99 — as duas reformas da mesma noite se encaixaram sem conflito.

**As correções dele, na mesma noite, olhando a tela construída:**

1. **O botão foi para o canto do topo, ao lado da logo** — *"no Facebook tem
   [o menu] no canto superior esquerdo, do lado do nome… o nosso deveria ser
   exatamente assim, do lado da logo, mas mais no canto ainda"*. Saiu da
   fileira das lentes e virou o `BotaoDoPainel`, desenhado pelo `TopNav` **só
   na rota da Comunidade** — é a primeira peça de tela que o TopNav muda por
   rota.
2. **O ícone são as três barrinhas (hambúrguer).** A primeira tentativa foram
   três quadradinhos desenhados à mão, e ele vetou na hora: *"nem dá para
   saber que existe alguma coisa aplicável"*. Ícone inventado perde para o
   consagrado — vale a mesma régua dos nomes de botão (§4.94).
3. **O painel não cobre mais a tela: é gaveta lateral de ~80%** — *"ele deixa
   mais ou menos 80% e você consegue ainda ver a outra parte, como se
   basicamente minimizasse a janela"*. O feed fica visível escurecido atrás;
   tocar no véu fecha, Esc fecha, trocar de rota fecha. (A gaveta é desenhada
   fora do `<header>` do TopNav — dentro dele, o `z-50` cria contexto de
   empilhamento e ela não cobriria o menu de baixo; mesma armadilha já
   documentada da busca.)
4. **Os ícones coloridos morreram.** *"Isso deixa uma cara de inteligência
   artificial muito grande. Não me parece que foi feito por um programador
   sério, que uma equipe grande fez."* Todos os cartões usam o mesmo cinza
   neutro; a única cor que sobrou é o vermelho do ao vivo — semântica, não
   decoração. **Régua nova para telas futuras: cor só quando significa algo.**
5. **A linha "N perguntas esperando uma opinião" saiu do feed** — *"não faz
   sentido nesse modelo estar aqui; no máximo um ícone, vizinho do
   Seguindo"*. Virou exatamente isso: o balão de pergunta com contador na
   ponta da fileira das lentes, sumindo quando não há pergunta (§4.23). A
   porta-cartão de 30/07 fica **revogada nessa forma** — o destino
   `/perguntas` continua sendo um só mecanismo, só mudou o tamanho da porta.

---

## 4.99 A tela de clubes refeita: as portas com número, cada uma com a sua página (04/08, noite)

**A queixa, com 8 clubes de verdade:** *"eu estou em 8 clubes e ele está muito
confuso: o que é meus clubes, o que é encontrar um clube."* A medição deu razão
antes do desenho: a tela tinha **3 telas de rolagem** numa lista só, mostrava
**3 dos 8** clubes dele (5 atrás de "Ver os outros"), e **dois clubes seus
apareciam duas vezes** — "Não durmo mais" e "Clube Jane Austen" estavam entre
os seus E no carrossel de estreias, porque `clubesComecando()` incluía os seus
de propósito (a justificativa antiga — "quem criou quer vê-lo na vitrine" —
não sobreviveu ao uso).

**Duas folhas, duas rodadas de decisão dele:**

1. Na primeira (`_clubes-B.html`, 4 filosofias), ele **mesclou A com B** e
   ditou regras novas: **"não existe botão de busca em canto inferior… a busca
   sempre está no topo"** (a proposta B tinha busca embaixo — desenho meu,
   morto na hora); a estreia sua com etiqueta **entre os seus**; a separação
   meus × encontrar **abrindo outra página**; e *"uma aba de recomendação,
   mais ou menos como o seu perfil — clubes abertos que você possa entrar"*.
2. Na segunda (`_clubes-B2.html`, 3 formas da mescla, cada uma com a tela E a
   página que abre), ele escolheu a **M3**: *"esses quadradinhos aqui em cima
   ajudam muito a organizar… você sabe exatamente onde você está e para onde
   aquilo vai te levar"* — e confirmou as três páginas.

**O que ficou (construído em 04/08, janela B):**

- **A busca no topo**, primeira coisa da tela; buscando, varre TUDO (seus,
  estreias, abertos) — quem digita "Duna" não quer saber de gaveta.
- **As portas com número** — o MESMO componente `PortasDoPerfil` do perfil
  (§4.41: duas cópias divergem): **meus clubes · estreias · abertos**, cada
  uma abrindo `/clubes/meus`, `/clubes/estreias`, `/clubes/abertos`
  (`pages/ListasDeClubes.tsx`, três páginas irmãs num arquivo, como
  `RedeDaPessoa`). O número da porta é o que a página mostra (§4.23) — por
  isso "estreias" conta só as que **não** são suas.
- **A tela principal virou o agora**: os 3 próximos encontros (a data que
  ordena é a relevante — estreia usa o início, clube andando usa o encontro)
  e o **"Para você"**: clubes abertos do gênero dos seus, com o motivo escrito
  ("você está em 2 clubes de ficção científica") — `clubesParaVoce()` em
  `lib/clubes.ts`; clube cheio fica de fora (recomendar porta fechada é
  convite que mente).
- **A duplicata morreu na fonte**: `estreiasParaDescobrir()` =
  `clubesComecando()` sem os seus; o clube seu em pré-estreia ganha a
  **etiqueta laranja** no cartão (no lugar da régua de progresso, que seria
  uma barra vazia fingindo informação).
- **As pastilhas de assunto** foram para a página dos abertos, **contadas
  sobre aquela lista** — a pastilha antiga prometia "Ficção Científica · 6"
  contando clubes que a lista não mostrava.
- Os cartões saíram de dentro de `Clubes.tsx` para
  `components/clube/CartoesDaTelaDeClubes.tsx`: quatro páginas os usam agora.

**Rejeitadas, e por quê:** o M1 (porta única "Encontrar") escondia as estreias
dos outros da primeira tela; o M2 (abas) não era *"abrir em outra página"*,
que foi como ele descreveu o gesto — e aba não tem endereço para apontar de
fora. Da primeira folha: a D (gavetas por estado, seus e alheios juntos com
selo SEU) reintroduzia a mistura que era a queixa original.

**Apurado no teste, sem virar decisão:** durante a verificação a aba pulou
duas vezes de `/clubes` para `/community` sozinha — o console provou que eram
**full reloads do Vite** disparados pelas outras janelas salvando arquivo, não
defeito da tela. Se acontecer com as outras janelas paradas, aí é assunto.

**As correções dele, na mesma noite (04/08), olhando a tela construída:**

1. **Porta não tem ícone.** *"Eu tiraria esses ícones laranjas e essas
   figurinhas laranjas — não vamos colocar."* Saíram do componente
   `PortasDoPerfil` — que é compartilhado, então **o perfil mudou junto**
   (§4.41: um componente só, um desenho só). Saíram também as figurinhas dos
   títulos de seção e a estrelinha de dentro da etiqueta de estreia.
2. **Letra maior nas portas.** *"Meus clubes, estreias, abertos está muito
   pequeno — não faz sentido essa proporção."* Rótulo de 10px para 12px,
   número de 15px para 18px.
3. **"Próximos encontros" é a fileira da proposta B da folha 1**, que ele
   resgatou: *"tinha uma fileirinha… eles estavam separados, o dia estava bem
   mais bonito"*. Linhas finas de agenda (`LinhaDeAgenda`): capa em miniatura,
   nome, e o prazo sozinho à direita — âmbar quando é estreia, laranja quando
   falta ≤ 7 dias. Fina, a linha deixa caber **5** onde os 3 cartões gordos
   estufavam. O cartão rico (`CartaoDoSeuClube`) segue na página `/clubes/meus`.
4. **A grade de estreias é a da biblioteca.** *"Só tem dois livros um do lado
   do outro… onde tinha biblioteca e catálogo são três livros"* — erro de
   proporção. Agora `grid-cols-3` com capa 3:4, igual à estante. A etiqueta
   encurtou para "amanhã"/"em 4 dias": o título da página já diz que é
   estreia, e "começa em…" quebrava em duas linhas na capa estreita.

O "Para você" ficou — *"tá ok"* — com a ressalva dele de que talvez ainda mude
algo ali; se mexer, é iteração nova, não pendência.

## 4.102 A aba Comunidades vira o app do Reddit — e a página de dentro fica (05/08)

Ele navegou pela aba e sentenciou: *"não gosto do layout da forma como está…
os fóruns, a forma como estão os fóruns, as comunidades, isso não me agrada"*.
Em seguida mandou **screenshots do app do Reddit** e a ordem: *"pegue toda a
biblioteca de como é o Reddit pelo formato de aplicativo e a gente colocar
exatamente como é"*. Sem folha desta vez — a referência veio pronta, dele.

**O recorte, ditado por ele na mesma hora:** *"a página de dentro a gente
poderia manter… eu acho que até me agrada a parte de dentro assim como está."*
Ou seja: a **estrutura Orkut da §4.74/4.77 segue valendo em `Grupo.tsx` e
`Topico.tsx`** — reconfirmada por ele hoje. Só a vitrine de fora
(`Comunidades.tsx`, `/forum`) mudou de molde.

**O molde construído** (o screenshot dele, com as cores do AllBook): busca
redonda no topo → pastilhas "Explore comunidades por assunto" em três fileiras
que rolam de lado → fileira "Suas comunidades" (rosto redondo) → **cadeia de
carrosséis**: Recomendado para você, Semelhantes a X (uma por comunidade
dele), Mais populares, e carrosséis com nome de assunto → censo "Todas as
comunidades" → cartão de criar. O botão **Entrar mora no próprio cartão**
(entrar/pedir/cancelar/sair conforme a governança) — na lista antiga era
preciso abrir a comunidade para participar.

**A correção dele na primeira olhada** — registrada porque é método: *"ainda
não está como é no Reddit… tem bem mais carrosséis do que a forma como está.
Você meio que quis implementar do seu jeito"*. A primeira versão tinha UM
carrossel de fileira única; virou a cadeia acima, cada carrossel com **duas
fileiras de cartões empilhados** (coluna seguinte espiando), que é como o
Reddit faz. Fidelidade ao molde escolhido ganha de "meu jeito".

**Diferente do Reddit, de propósito (regras dele que não são de molde):**
o motivo escrito no cartão recomendado ("também é de suspense…", "2 conversas
esta semana") — recomendação sem porquê é lista aleatória (§4.78); as 36
categorias TODAS nas pastilhas, vazias apagadas mas clicáveis (§4.82); os
ícones de categoria (§4.82); a fileira "Suas comunidades" com "ver todas"
(§4.92); e o censo completo no fim — carrossel repete comunidade entre seções
como no Reddit, mas ninguém fica invisível.

**O que morreu nesta tela, e por quê:** os blocos "Acontecendo agora" e "Em
alta" da §4.82, os números do rodapé, a **paginação de 10 em 10** e a roleta
`<select>` de categoria — tudo era molde Orkut/vitrine antiga; a ordem foi
"exatamente como o Reddit". As funções da `forumVitrine` continuam vivas
(`Search.tsx` usa; `emAlta` agora completa o "Recomendado para você" quando
as sugestões pessoais não enchem as 6 vagas).

**A semeadura que a vitrine cobrou:** *"se só tem 16 hoje, crie mais
comunidades para deixar isso mais robusto da forma como seria"*. Entraram
**14 novas (16 → 30)** em `lib/grupos.ts`, na régua de sempre (nenhuma nasce
vazia, membros do elenco, assunto de audiolivro de verdade) e com estratégia:
uma nova **na categoria de cada comunidade dele** (alimenta os "Semelhantes a
X") e o resto espalhado (Terror, Romance, História, Humor, Autores, Filosofia,
Idiomas, Família, Poesia, Não-ficção). Tópicos datados **desta semana** — são
eles que dão motivo verdadeiro ao Recomendado.

**Fica de aviso para a próxima janela:** a docstring de `Grupo.tsx` ("a
estrutura é para ficar") continua CORRETA — ele a reconfirmou hoje. Quem for
mexer lá dentro precisa de ordem nova dele, não desta seção.

**As duas correções dele, minutos depois (05/08):** (1) o censo aberto era um
muro — *"para a pessoa chegar até o criar, ela tem que rolar tudo isso? Fica
muito distante"* — virou uma **linha fechada** ("Todas as comunidades · 30")
que só abre no toque, e o convite de criar subiu para logo depois dos
carrosséis; (2) *"assim que ela abre, ela deveria ter um botão"* de criar —
entrou o **botão laranja "＋ Criar" fixo ao lado da busca**, visível na
abertura da tela; o cartão-convite do fim continua, mas a porta principal é a
de cima.

## 4.103 O painel do hambúrguer vira o Menu do app — global, com "Seu conteúdo" e a engrenagem (05/08)

**A queixa dele:** *"os fóruns de discussões a gente não consegue abrir bem,
como também não consegue abrir os clubes de leitura… não existe um caminho
fácil"*. E era verdade — mas não por falta de porta: o painel da §4.100 já
tinha as oito, e o botão que o abre só existia na rota da Comunidade. **Porta
que aparece e some conforme a tela ninguém decora onde mora.**

**O caminho da decisão, porque ele muda a regra da §4.57:**

1. Minha primeira recomendação foi replicar o painel **como estava** para
   todas as telas (o molde Reddit/X: gaveta fixa no canto esquerdo). Ele
   vetou: *"replicar da forma como está agora não faz sentido"* — e pôs duas
   alternativas na mesa: **menu diferente por aba** ou **menu único revisado**.
2. **Menu por aba foi rejeitado** (com concordância dele): no Catálogo e na
   Biblioteca não há o que pôr — os filtros e gêneros já moram no corpo das
   telas, então a gente inventaria conteúdo para justificar o botão; e botão
   que muda de comportamento conforme a tela não se aprende, que era
   justamente a doença original.
3. **Ficou o menu único, revisado pela régua que ele mesmo enunciou:** *"se a
   gente já coloca as minhas notas ali, a gente tiraria da aba de
   configuração"* — **porta nova não convive com a porta velha**. "Minhas
   notas" e "Meus trechos" entraram na gaveta (seção "Seu conteúdo") e
   **saíram do `/you`**, onde custavam três toques (avatar → perfil →
   engrenagem); agora custam dois, de qualquer tela.
4. A ideia dele de itens soltos de "notificação, privacidade" virou **uma
   engrenagem só, no rodapé** ("Conta e configurações" → `/you`), como no X:
   o sino já mora no topo de toda tela (item de notificação seria porta
   dupla), e privacidade vive dentro do `/you` a um toque.

**A §4.57 fica revogada neste ponto:** o painel não é mais "só o que é da
comunidade" — é o **Menu** (título novo), com o social + o seu conteúdo + a
conta. A divisão que sobrevive: o hambúrguer é navegação; o **avatar continua
sendo a página pública** de quem você é.

**Conserto no mesmo passo:** o cartão "Trechos da semana" do painel contava os
trechos quentes da comunidade (`trechosQuentes()`) mas navegava para
`/trechos` — a prancheta PESSOAL. Destino que mente saiu; os trechos quentes
seguem no cartão do feed, que é a casa deles.

**Pendência pequena, dele:** "Meus clubes" agora tem duas portas (Menu e
`/you`). Pela régua desta seção a do `/you` deveria cair, mas ele só citou
notas e trechos — deixei como está e apontei. Uma linha, quando ele decidir.

## 4.104 A averiguação de design antes do backend — as 12 decisões da folha (05/08)

Ele pediu (*"me diga… o que está deixando esse aplicativo com a cara de algo
amador"*) uma varredura de TODAS as telas antes de ir ao backend. O resultado
virou a folha `_averiguacao-de-design-C.html`, e ele respondeu tudo numa
sentada. **As decisões, todas dele pela folha:**

1. **Sinopse curada em PT-BR no `books.ts`** — a ficha mostrava a `synopsis`
   da Open Library **em inglês** (`catalog-enriched.ts`, sem tradução). A
   curada vence; a importada vira reserva. (Rejeitado: traduzir no script —
   texto com cara de tradução e mexe em arquivo gerado.)
2. **A ficha do livro vira tela sem o TopNav** (como player/login/sala): o
   logo ficava atrás do botão de voltar flutuante — duas navegações
   empilhadas. (Rejeitado: barra própria com título; menos imersiva.) A
   BottomNav e o MiniPlayer **ficam** — a decisão era sobre o cabeçalho.
3. **Barras fixas com fundo fechado** — o conteúdo rolado aparecia de
   fantasma atrás dos cabeçalhos translúcidos (clube, chips da biblioteca).
4. **A sala ao vivo termina** — a semeada ficou presa no fim ("faltam 0 s",
   relógio 99 h): entra o estado "sessão encerrada" com saída para o livro, e
   as semeadas nascem com hora de começo realista. (Rejeitado: sala eterna
   que emenda outro livro — menos crível.)
5. **Mosaicos sem capa repetida entre vizinhos e sem capa genérica** — "Só na
   AllBook" e "Best-sellers" mostravam as mesmas capas coladas.
6. **O herói da Início ganha a arte sangrada** (Netflix): a própria capa,
   ampliada e desfocada, preenche o topo. (Rejeitados: gradiente de cor
   dominante e o fundo chapado de hoje.)

**Limpezas aprovadas:** tirar o 🔥 do título em `collections.ts`; fechar o
vão morto no fim da Início/Busca (com fim de lista discreto); o selo
"ALLBOOK ORIGINAL" do player sai de cima da capa (vira selo fora da arte,
como na ficha); +3 salas semeadas nos stories da Comunidade (fileira se
esconde com <2); a barrinha laranja de consenso dos posts morre (a frase
"X gostaram · Y discordou" já diz tudo).

**Rejeitada por ele (não mexer):** a nota ⭐ da fileira "Em alta" **fica**,
mesmo repetindo 4.9 nos primeiros — foi a única limpeza que ele não marcou.

**Recado formal para a janela B (ele aprovou o registro):** na vitrine nova
do `/forum`, a comunidade "Ficção Científica" aparece em duas seções vizinhas
e o motivo laranja "você está em 2 clubes de ficção científica" repete
idêntico em 3 cartões seguidos — variar o texto e deduplicar entre seções.

**Apurado na varredura, sem virar decisão:** a aba do localhost dele está com
zoom de 50% no Chrome — todos vemos o app com breakpoints de desktop dentro
da moldura; vale um teste em celular de verdade antes do backend.

### 4.103.1 A 2ª rodada, no mesmo dia: o nome que colidia e o `/you` inteiro (05/08)

Ele abriu o Menu novo e achou dois defeitos — o segundo é dos que se paga caro
por deixar passar.

**1. O cartão vermelho "Salas ao vivo agora" saiu.** *"Não acho que esse botão
vermelho, altamente destacado, possa fazer sentido."* O argumento que sustenta:
**menu é feito de lugares fixos; sala ao vivo é notícia** — e notícia mora no
feed, onde ela já está (os stories do topo, §4.100). A **bolinha vermelha do
hambúrguer saiu junto**, porque apontava para esse cartão: marca que leva a nada
é promessa vazia.

**2. A colisão de nomes — "Comunidade" nomeava DUAS telas.** *"A gente tem
'Todas as comunidades' e o botão embaixo 'Comunidade'. Ele dá a entender que é
a mesma coisa, mas são coisas completamente diferentes. Todas as comunidades
são os fóruns; e comunidade é aquela coisa que a gente viu, o feed de uma rede
social."*

**Quem cedeu foi a aba de baixo, e o porquê** (as duas saídas eram
defensáveis):
- **"comunidade" é preciso para um fórum temático e vago para um feed** — é o
  que o Reddit chama assim, e é o que a tela `/forum` é;
- a palavra está encravada em **~40 textos** da tela de fóruns (reformada na
  §4.102, no dia anterior), contra **uma linha** na barra de baixo;
- o código sempre concordou com isso: a rota é `/forum`, o módulo é
  `lib/forum.ts`, e a §4.44 já tinha decidido *"fórum, não grupo"*.

**O nome: "Feed" — e foram TRÊS tentativas.** Eu propus "Feed"; ele achou seco
(*"talvez se fosse um feed de notícia, um nome com esse"*). Propus **"Novidades"**
(*news feed* em português, sem anglicismo) e ele recusou: *"não acho que isso
remeta exatamente o que isso é"*. Parei de adivinhar e **pus as três saídas numa
pergunta com maquete** — inclusive a terceira via de renomear os FÓRUNS e
devolver "Comunidade" à aba. **Ele escolheu "Feed"**, sabendo do custo
declarado: é o único anglicismo do menu de baixo. A régua aprendida: **depois de
duas rejeições no mesmo ponto, alinhar vale mais que a terceira tentativa** —
e a pergunta tem que mostrar as opções desenhadas, não descritas. **A rota continua `/community`** — mexer nela quebraria links salvos,
e ninguém lê a barra de endereço num app.

**3. O painel `/you` inteiro veio para o Menu.** *"A gente deveria colocar lá
também estatística, conquista e downloads… ele está um pouco escondido hoje."*
Estava mesmo: três toques (avatar → perfil → engrenagem) para chegar às suas
próprias coisas.

**A linha de corte que ficou — e que vale para o que vier depois:** o **Menu
leva a lugares** (páginas suas que se visita para ver algo: notas, trechos,
downloads, estatísticas, conquistas); a **engrenagem guarda ajustes**
(privacidade, aparelho, ajuda, convidar, sair). Por isso o `/you` deixou de se
chamar "Você" e virou **"Configurações"** — a palavra que ele usou.

**Ordem das seções do Menu:** Comunidade → Seu conteúdo → **Criar por último**,
colado ao rodapé. Os dois blocos de "ir a algum lugar" ficam juntos; ação fica
no fim.

**Apontado e NÃO mexido (decisão dele):** "Notificações" continua sendo linha
das Configurações **e** o sino do topo — duas portas para `/notifications`.
Deixei porque, numa tela de configurações, esse item costuma ser *ajuste de
notificação*, que ainda não existe; se ele não vier, a linha deve cair.

---

## 4.105 Os ajustes do perfil viram uma lista só, e as duas placas morrem (05/08)

**A queixa dele**, navegando nas Configurações: *"quando a gente clica na
privacidade, a gente tem conta privada, e aqui tem um problema: o que aparece na
sua página — a gente clica e a gente vai para outro menu, para outra página,
para outra coisa. Eu acho que isso não faz muito sentido. O que poderia ser
feito é colocar todo esse botão do editar perfil nas configurações normais
mesmo… ele passa para o botão de privacidade e a gente faz uma única lista,
descendo de cima até embaixo, de todas essas coisas."*

**O defeito era circular, e pior do que ele descreveu.** A tela `/privacidade`
tinha uma **placa** no meio da lista mandando para o lápis do perfil (§4.95), e
o lápis tinha uma **porta** ("Quem pode me seguir") mandando de volta para a
`/privacidade`. Cada lado guardava metade dos interruptores e apontava para o
outro: quem procurava um ajuste pingava entre os dois sem nunca ver a lista
inteira. Na tela, a placa ainda ficava **entre** dois grupos de interruptores —
o lugar exato onde se espera outro interruptor.

**O que foi rejeitado, e o motivo (é o que mais se perde).**

- *Só trazer os cinco interruptores de volta para a Privacidade* — a leitura
  literal do pedido. **Desfaria a §4.95, que é decisão dele de 01/08**: o lápis
  voltaria a entregar um terço do que promete (foto, nome e bio), que é
  exatamente o que ele reprovou naquele dia. Atender um pedido reabrindo o
  buraco de outro não é atender.
- *Matar a folha e deixar só a tela* — a folha foi escolha dele numa folha de
  quatro propostas desenhadas (*"prefiro da forma como está o C"*), e o motivo
  dela continua de pé: ajustar o perfil olhando para o perfil, com a página
  mudando atrás.
- *Copiar os interruptores nos dois lugares* — dois blocos de código com o mesmo
  estado é a redundância varrida do compositor (§4.58) e da caixa de comentário
  (§4.93).

**A saída: uma peça só, em dois pontos de entrada.**
`components/perfil/AjustesDoPerfil.tsx` é a lista inteira; a tela
`/privacidade` a mostra por completo, e a folha do lápis mostra **a mesma**. Não
é controle duplicado — é o mesmo controle, lendo e gravando no mesmo `settings`,
com o `SETTINGS_EVENT` avisando a página atrás. Nenhum dos dois caminhos tem
mais placa apontando para o outro, porque os dois chegam na lista completa.

**A ordem da lista, de cima a baixo:** quem você é (foto/bio e recomendações) →
o que aparece na sua página (os 5 interruptores) → quem pode te seguir (conta
privada) → quando me avisar (os 2 do sino). Vai do mais visível ao mais
silencioso.

**Dois nomes mudaram junto:** a tela virou **"Perfil e privacidade"** (a rota
segue `/privacidade`) e a linha nas Configurações também — "Privacidade" sozinho
subestimava um destino que agora tem foto, bio e recomendações.

**A regra da §4.95 sobrevive inteira:** o que liga/desliga fica na lista; o que
se escreve (foto, bio, recomendação) abre página, porque formulário quer tela.

## 4.106 O cabeçalho se esconde ao rolar — o app inteiro ganha o gesto da ficha (05/08)

**O pedido dele**, depois de elogiar a ficha do livro sem TopNav (§4.104):
*"nas outras páginas — na página de início, na página de catálogo e no todo o
resto do aplicativo — a gente poderia replicar mais ou menos a mesma coisa…
quando a gente vai pra baixo, isso poderia sumir, e ele voltaria quando a gente
[rolasse] pra cima. Ele simplesmente toma aquele espaço que é dedicado a isso."*

**A decisão:** o TopNav desliza para fora ao rolar para baixo e volta com
qualquer rolada para cima — o padrão do YouTube e do Instagram. Perto do topo
da página (os primeiros 56px) ele nunca se esconde, e esconder pede 48px
somados de descida, para um dedo trêmulo não fazer a barra piscar.

**Como é feito (e por que assim):** um estado **compartilhado de módulo** em
`hooks/use-cabecalho-recolhido.ts`, com um único ouvinte de `scroll` em fase
de captura no `document` — o truque que já servia ao fundo opaco do TopNav, e
que funciona tanto no app real (quem rola é a janela) quanto na moldura de
desenvolvimento (quem rola é um contêiner). Estado de módulo, e não um estado
por componente, porque **quatro peças se movem juntas**: o TopNav
(`-translate-y-full`) e os três grudados em `top-14` que descolariam dele —
o `PageHeader` das telas internas, os chips da Biblioteca e a faixa de prévia
do Perfil, que transicionam para `top-0` e assumem o lugar do topo, sem vão.

**Os cantos cobertos:** carrossel horizontal não conta como rolagem (o
`scrollTop` de cada contêiner é comparado consigo mesmo — sem isso, passar
capas de lado faria a barra piscar); tela nova nasce com o topo à mostra; e
fechar a busca ou o Menu chama `mostrarCabecalho()`, porque a rolagem dentro
de uma sobreposição não pode roubar o cabeçalho de trás dela.

**O que ficou de fora, de propósito:** o menu de baixo e o MiniPlayer não se
escondem — o pedido foi só sobre o topo, e o rodapé é onde mora o controle do
que está tocando.

**Apurado no teste (vale para as próximas janelas):** mexer em `scrollTop` por
JavaScript **não dispara evento de scroll** quando a janela do Chrome está sem
foco — a automação via terminal parecia provar que o conserto não funcionava,
quando era o teste que mentia. Rolagem de verdade se testa com a roda do mouse
(`computer scroll`); e screenshots de aba sem foco congelam transições CSS no
meio (`top: 54px` de um `top-14 → top-0`) — artefato, não defeito.

**Conserto na sequência (mesmo dia, achado pelo Matheus):** o cabeçalho *"não
some de cima — ele simplesmente vai mais para cima, saindo do telefone"*. O
defeito era da **moldura de prévia**, não do app: no `DevMobileWrapper`, o
`scale` (que faz do elemento o referencial de todo `position: fixed`) e o
`overflow: hidden` (quem apara o que sai da tela) moravam em **elementos
diferentes** — e o que se pendura num não é aparado pelo outro, então o TopNav
em `-translate-y-full` pintava por cima do telefone. A moldura virou um
elemento só, que referencia E apara, como uma tela de verdade. No celular real
o defeito nunca existiu.

## 4.107 As lentes do Feed viram as abas do X — "Para você · Seguindo" (05/08)

Com o app do X aberto na mão, ele mandou copiar o par de abas: *"eu gostaria de
replicar essa coisa do X, para você e o seguindo, na nossa aba de Comunidade,
exatamente como está aqui… hoje a gente diz o 'todos' e 'seguindo', e tem o
ícone de perguntas. Minha sugestão era remover esse ícone."*

**O que mudou:**
- **"Todos" → "Para você"**, e as duas viraram **abas de largura igual** com
  sublinhado sob a ativa, divisória fina de ponta a ponta, sangrando até as
  bordas (`-mx-5`). Eram duas pílulas pequenas num canto. O azul do X virou o
  laranja da marca.
- **O ícone de perguntas saiu** do topo do feed (era a §4.100).

**Por que tirar o ícone não criou beco (§4.23):** a página `/perguntas`
continua com **duas portas** — o cartão "Perguntas sem resposta" no Menu do
hambúrguer (com contador) e o **selo "Pergunta" de cada post**, que é clicável
desde a §4.59. Conferido no código antes de remover.

**A posição NÃO subiu para o topo absoluto, e isso é decisão, não esquecimento.**
No X as abas são a primeira coisa da tela porque abaixo delas só existe o feed.
Aqui, os **stories de sala ao vivo e o compositor não mudam com a lente** —
pô-las acima deles prometeria um governo que elas não têm. Ficam logo acima do
que a lente de fato troca.

⚠️ **"Para você" é nome emprestado, não promessa cumprida — e ele sabe.** Eu
levantei que no X a aba é algoritmo e aqui a lista é cronológica pura (§4.58);
ele respondeu antes de eu terminar: *"já adianto que o código faz cronologia,
não tem nenhum algoritmo que rode um script específico… isso aí é tudo por
ordem"*. Fica registrado que **o nome está adiantado ao comportamento**. O que
segura a promessa hoje é o montador intercalar sugestões, clube, fórum e trechos
quentes — não é lista crua. No dia em que houver escolha de verdade, o nome vira
verdadeiro sem precisar de outra tela.

### 4.103.2 A poda do Menu: seis cartões viram três (05/08)

Ele voltou ao Menu com duas críticas, e as duas procediam.

**1. "Minhas X" + "Todas as X" viraram uma porta só.** *"A gente poderia
simplesmente colocar 'Comunidades', e as minhas dentro da aba… assim como
'Meus clubes' e 'Todos os clubes' poderiam ir por aí. A gente enxugaria isso."*

Fundir **só é honesto porque as duas telas de destino já abrem com as suas em
cima** — `/forum` tem a fileira "Suas comunidades" (§4.102) e `/clubes` lê
`meusClubes()` na abertura (§4.99). **Conferi no código antes de fundir:** sem
isso, unir esconderia o conteúdo dele atrás de uma lista de estranhos, e o
enxugamento viraria perda. O número das suas não se perdeu — virou a etiqueta
do cartão ("5 suas", "8 seus").

**A régua que fica:** *fundir "meu" com "todos" só quando a tela de destino
mostra o "meu" primeiro.* Se ela não mostrar, o atalho para o meu tem que
existir em algum lugar.

**2. "Quem eu sigo" e "Quem me segue" saíram** — e o código deu um motivo mais
forte que o dele. Ele desconfiou (*"não sei se faz muito sentido, não existe
isso em rede social nenhuma"*); a verdade é que **os dois cartões apontavam
para o MESMO endereço** (`/seguidores`). Dois botões, um destino, rótulos
diferentes prometendo listas diferentes.

E isto **já tinha sido decidido uma vez**: a §4.55 tirou seguidores do painel
privado com uma frase dele — *"seguidor é assunto de perfil"* — e mandou para a
linha de números do `/profile`, onde continuam. O painel os ressuscitou sem
querer na §4.100. **Decisão revogada volta se ninguém lembrar dela na hora de
montar tela nova**; é para isso que este documento existe.

**Como o Menu ficou:** Comunidade (Comunidades · Clubes · Perguntas) → Seu
conteúdo (Notas · Trechos · Downloads · Estatísticas · Conquistas) → Criar
(comunidade · clube) → engrenagem no rodapé.

**Apontado e não mexido:** a seção **"Criar"** ficou discutível — `/forum` ganhou
botão "＋ Criar" fixo no topo (§4.102) e `/clubes` também tem o seu. Mantive
porque criar de qualquer tela é atalho legítimo (é o que o Facebook faz), mas se
ele quiser podar, são dois cartões a menos.

## 4.108 Ideia registrada para debate futuro: ícones coloridos nas listas e no Menu (05/08)

**Não é decisão — é ideia dele, guardada para não se perder.** Vendo o app em
05/08: *"tanto nas listas como no menu do hambúrguer, você colocou alguns
ícones aqui coloridos, dando mais vida a esses ícones. Eu achei interessante.
Eu acho que a gente talvez possa debater futuramente sobre a utilização desses
ícones. Aqui como está agora, talvez a gente possa implementar isso
futuramente."* Fica **como está** por ora; a implementação é para depois, com
debate antes.

**O estado de hoje, para o debate encontrar o terreno:** a lista "Perfil e
privacidade" (§4.105) usa ícones em **laranja da marca** (`text-primary`); o
Menu do hambúrguer usa caixinhas **neutras** (`text-white/65` sobre
`bg-white/[0.06]`) — e ícones neutros ali foram decisão da §4.100, que este
debate revisitaria. Quando chegar a hora, o caminho natural é **folha de
propostas** comparando paletas (só laranja × uma cor por assunto × neutro),
porque o critério é gosto — e reformulação visual pede 4+ propostas de
filosofias diferentes, como de costume.

## 4.109 Discussão encerrada sem mudança: o pedido para te seguir já tem dois lares (05/08)

**Registrado para não reabrir.** Ele pediu para ver um pedido de seguir chegando
— com uma preocupação por trás: *"eu pensei que só ficava nas notificações"*. É
uma preocupação boa: aviso é coisa que passa, e um pedido perdido no meio de
dezoito linhas seria alguém perdido para sempre.

**Não é o caso, e por isso nada muda.** O pedido aparece em **quatro** lugares,
e um deles é permanente: o cartão com ✓/✗ em `/notifications` (§4.55), a aba
**"Pedidos · N"** em `/seguidores` — que guarda a fila enquanto ela existir —, o
contador do sino no `TopNav` (que soma `pedidosPendentes`) e o número na linha do
painel em `/you` e `/profile`. Ver o aviso passar não custa nada: a fila continua
inteira na tela de quem te segue.

**O que a conversa reconfirmou de passagem:** a fila só existe com a **conta
privada** ligada — com conta pública seguir é imediato, e uma aba "Pedidos" vazia
ali prometeria um controle que não existe (§4.54/§4.55). Continua valendo.

## 4.110 Identidade visual em aberto: a folha do "redesenho do zero" (05/08)

**O pedido, nas palavras dele:** *"me sugere coisas diferentes na parte do design
— mudar o fundo, mudar o logo, mudar essa cor laranja, mudar para preta… esqueça
tudo que a gente já debateu antes no roteiro, como se você tivesse criado do zero
aqui agora."* Daí a folha `client/public/_design-do-zero-B.html`, com **seis
decisões**: a direção visual (5 identidades inteiras, cada uma com a Início
desenhada), o símbolo da logo (5), a grafia do nome, o menu de baixo (3), o
cartão de livro (3) e o que abre a Início (3). **Nada foi decidido ainda** — a
folha responde em `_respostas-de-folhas/design-do-zero-B.json`.

**O diagnóstico que sustenta a folha** (conferido no código, não no roteiro):
o laranja `#FF6A00` sobre `#141414` é a combinação do **Audible**, e o cinza de
fundo com billboard giratório + fileiras é o **Netflix** — duas marcas
emprestadas na mesma tela; **não existe símbolo** (a logo é a palavra com o "All"
colorido, então não há ícone de app nem favicon); a narração sob demanda, que é a
ideia central, **não aparece no visual**; e sobraram efeitos datados (borrão atrás
do ícone ativo, sombra colorida sob o botão).

**O custo medido — é o que deve pesar na escolha:** 737 lugares chamam a cor
**pelo nome** (`primary`), logo trocar a cor de marca é ~1 linha do `index.css`
mais 99 literais (`orange-*`, `#f59e0b`); mas há **1.740 usos de branco/preto
transparentes** (`white/10`, `black/60`), que só funcionam sobre fundo escuro, e
258 hexadecimais em 95 arquivos. Em uma frase: **trocar a cor e a logo é barato;
trocar o escuro pelo claro é uma obra.**

**O que eu recomendei, e por quê:** direção **"Estúdio"** — grafite quente,
branco-osso e vermelho de gravação usado só onde há gravação (selo "no ar", onda,
botão Pedir). Sai do laranja do concorrente, **continua escura** (obra barata) e é
a única das cinco que conta o que o app faz de diferente. As outras quatro:
*Tinta* (papel claro, a mais distinta e a mais cara), *Meia-noite* (preto puro sem
cor de marca — atende o "mudar para preta", mas deixa o app anônimo), *Abajur*
(azul-noite com luz quente) e *Cartaz* (blocos de cor e tipografia gigante).

Relacionado: a §4.108 já previa que o debate dos ícones coloridos pediria uma
folha comparando paletas — é esta.

## 4.111 O rumo da marca — escolhido, mas ainda NÃO implementado (05/08)

> ⚠️ **Leia primeiro: nada disto está no app.** Eu implementei a marca no mesmo
> dia (componente, favicon, topo trocado) e **ele mandou desfazer** — o app
> voltou ao que era, com "All" laranja e o favicon antigo. O que segue é **rumo
> escolhido**, não código entregue.
>
> **O erro, e a lição que fica:** as escolhas dele na folha eram **matéria-prima
> para um prompt** — ele queria gerar a marca numa plataforma de IA de imagem, e
> a folha servia para decidir *o que descrever no pedido*. Eu li como autorização
> para desenhar e entregar. **Folha respondida não é ordem de construir**, ainda
> mais na identidade visual, que a §4.110 deixou explicitamente em aberto. Ele
> também **não gostou** do desenho feito à mão; o desenho não é o produto, o
> conceito é.

**O rumo escolhido** na folha `_logo-A.html`, entre seis propostas:

- **O símbolo — "a página que vira som".** Um livro aberto cuja página da
  esquerda é sólida e cuja página da direita **se desfaz em quatro linhas que
  encurtam e desbotam**. As linhas são ao mesmo tempo texto e onda sonora, e a
  ambiguidade é o ponto: é a ideia central do app (§ da narração sob demanda)
  num desenho só — o livro que só existe escrito virando voz.
- **O nome: "All" branco + "Book" laranja** — o **inverso** do que o topo trazia
  desde sempre ("All" em laranja). O laranja passa a cair sobre a palavra que o
  símbolo ilustra, e "All" para de competir com ele.
- **O ícone do app: marca laranja sobre quadrado escuro** (rejeitados: marca
  escura sobre quadrado laranja, e degradê laranja→âmbar).

Isto **aponta para uma das lacunas da §4.110** — lá está registrado que "não
existe símbolo, então não há ícone de app nem favicon". O conceito do símbolo
agora existe; **o arquivo, não**. O resto da §4.110 (fundo, paleta, cartão de
livro, topo da Início) continua em aberto.

**As cinco rejeitadas, e por quê** — vale guardar, porque a próxima rodada de
identidade não precisa redescobri-las:

| | Marca | Por que caiu |
|---|---|---|
| A | Lombadas numa prateleira que também são um equalizador | A leitura "livro" dependia inteira do risco da prateleira; sem ele, é app de música |
| B | O "A" de AllBook feito de duas páginas abertas | Casa com o nome, mas **não fala de áudio** em lugar nenhum |
| C | Livro aberto com o botão de play recortado | Entende-se na hora — e é o que todo app de audiolivro já fez |
| E | Livro com ondas subindo, como sinal no ar | O arco de fora é fino e some primeiro; exigiria versão separada só para o ícone |
| F | Marcador de página com barras de som dentro | A silhueta mais forte no tamanho pequeno, mas "marcador" já é o ícone de **salvar** dentro do próprio app |

**Apurado no caminho: IA de imagem não serve para fazer logo.** Ele tentou no
davinci.ai (Nano Banana Pro) e o que voltou foram cenários dourados de biblioteca
com uma marca carimbada em cima. Três causas, todas no texto do pedido — e as
três valem para a próxima vez:

1. **um pedido não pode conter dois produtos.** O texto pedia o fundo *e* a logo
   na mesma frase; gerador de imagem não separa, ele funde;
2. **linguagem de briefing humano vira cenário.** "Espaço vasto e acolhedor",
   "biblioteca viva" — a máquina pinta a cena descrita, ao pé da letra;
3. **prompt de logo é feito de proibição**, não de descrição: sem cenário, sem
   fotorrealismo, sem 3D, sem sombra, sem degradê, sem texto.

As seis propostas da folha foram desenhadas em SVG à mão só para **ele poder
escolher o conceito olhando**, como os `GenreIcon` (§4.27) — não para virarem a
marca final.

**A questão em aberto, e é ela que decide o próximo passo:** a saída de IA de
imagem é **PNG**, e marca precisa ser **vetor** (estica sem borrar, troca de cor
por CSS, encolhe até 16 px). Então o que vier da plataforma serve como **arte de
referência**; alguém ainda terá de redesenhá-la em vetor — eu, ele, ou um
ilustrador. Isso não foi decidido.

**Achado colateral, e continua valendo:** o `favicon.png` que o app serve desde o
começo é **o logo do Replit**, laranja, sobra do andaime original. Ninguém tinha
reparado, e **ele continua lá** — é um conserto pendente, independente de qual
marca vencer.

⚠️ **Armadilha para quando a marca finalmente entrar.** Cor de marca em
componente segue o token (`text-primary`) e custa uma linha do `index.css`, como
a §4.110 mediu — mas **arquivo estático de ícone não lê CSS**: o hexadecimal fica
escrito à mão dentro dele. Mudou a cor, são **dois lugares**.

## 4.112 A identidade nova: direção "Estúdio", com o tema claro "Tinta" ao lado (06/08)

**Ele decidiu na folha `_design-do-zero-B.html`, e mudou de ideia no caminho:**
*"Eu gosto muito da opção B… mas, com base no que você falou, cor sem cor
própria… essa coisa de cor vermelha para o player de áudio é uma cor muito mais
viva. Faz muito sentido. Então a gente vai escolher a direção C."* Ou seja: o
preto absoluto o atraiu, e o argumento que o virou foi o **contra** dele — app
sem cor de marca fica anônimo.

**O que passou a valer:**

- **Direção C, "Estúdio"** — fundo grafite **quente** `#121110` (não o cinza do
  Netflix), texto branco-osso `#F5F1EA`, e **vermelho de gravação** `#FF4438`
  usado só onde há gravação ou ação. Títulos em **Space Grotesk**; o Outfit saiu
  junto com o laranja.
- **Tema claro "Tinta" como alternativa, acréscimo dele:** *"que nas
  configurações do aplicativo a gente possa mudar o tema… o padrão seria a
  direção C, porém ele poderia oscilar entre a direção A"*. Papel creme
  `#F4EFE6` e carmim `#C1362F`, escolhido em `/settings` → Aparência, com as
  duas telas desenhadas em miniatura. O escuro segue sendo o padrão de fábrica.
- **Menu de baixo B** — aba ativa com **ícone preenchido** e rótulo em negrito;
  saíram o borrão colorido atrás do ícone e a sombra sob a pastilha do Pedir,
  que a folha classificou como sotaque de 2019. Ele hesitou com a C (sem
  rótulos): *"tô entre o B e a C, mas vamos por B"*.

**A decisão técnica que fez o tema claro caber num dia, e não numa semana.** A
folha media 1.740 usos de `white/NN` e `black/NN` espalhados por 95 arquivos —
todos só funcionam sobre fundo escuro, e era isso que encarecia. Em vez de
reescrevê-los, **`--color-white` e `--color-black` passaram a apontar para o
tema**: viraram "a cor do texto" e "a cor do papel". Uma linha no `index.css`, e
`text-white/40`, `bg-white/10` e `border-white/10` se invertem sozinhos, com
opacidade e tudo. **O que se ganha:** tela nova pode continuar escrevendo
`text-white/60` sem pensar. **O que se paga:** a classe passa a mentir sobre a
cor final — está avisado em letras garrafais no `index.css` e no CLAUDE.md.
Para texto sobre imagem, que precisa ser branco nos dois temas, existe a classe
`.sobre-midia`, que devolve branco puro ao bloco inteiro.

**Conferido no navegador, nos dois temas:** Início, ficha do livro, player, Feed
e Configurações. O player e a ficha saem particularmente bem no claro — a capa
vira cenário lavado, como página de revista. **Um susto que não era bug:** o
Feed apareceu fantasma numa captura; era a animação `fade-in` **congelada por
falta de foco na janela** do Chrome (a armadilha já conhecida da automação), e
a cor do texto estava correta o tempo todo.

**Ainda em aberto da mesma folha** (ele disse "fico devendo"): o **símbolo da
logo**, a grafia do nome, o cartão de livro e o topo da Início. Enquanto isso a
marca segue sendo a palavra com o "All" colorido — agora em vermelho — e o
favicon continua sendo o do Replit.

## 4.113 A folha das 48 logos — e por que voltamos a desenhar à mão (06/08)

**O pedido:** *"crie uma folha com diversas sugestões de logo… muitas sugestões
mesmo… uma logo tem que ser algo mais profissional, com a cara mais de prêmio"*.
No meio do trabalho, um segundo recado: *"pode colocar a cor"* — as logos saem
já coloridas, não em preto e branco.

**A folha:** `client/public/_muitas-logos-B.html` — 48 símbolos em 8 famílias
(a página que vira som · o monograma A · o ponto de gravação · lombadas ·
voz e onda · o marcador · geométrico · play e escuta), 12 grafias do nome e
6 trajes do ícone. Marcação **múltipla** nos símbolos (3 a 5 é o ideal), única
no nome e no traje; responde em `_respostas-de-folhas/muitas-logos-B.json`.

**A contradição que eu precisava enfrentar antes de aceitar a tarefa:** a §4.111
registra que ele **não gostou de logo desenhada à mão** e que o caminho combinado
virou gerar por IA de imagem (§4.115). Fiz a folha assim mesmo, e disse isso
dentro dela, por dois motivos:

1. **6 conceitos não são um leque.** Com 48 ele reconhece o que gosta batendo o
   olho, que é como ele decide (memória de design: ele escolhe vendo).
2. **SVG à mão fecha a lacuna que a IA não fecha.** A pergunta em aberto da
   §4.111 era "IA devolve PNG e marca precisa ser vetor — quem redesenha?".
   Um símbolo desenhado aqui **já é vetor**: estica sem borrar, troca de cor por
   token e vira favicon. Se um dos 48 servir, **não há plataforma no meio**.

**Como a cor entra, agora que ele pediu cor.** Em cada símbolo o vermelho de
gravação cai **só na parte que é som** (onda, barras, ponto do REC) e o
branco-osso fica com a parte que é livro. Mecanismo: os elementos de acento usam
`var(--acento, currentColor)`, e só o palco do cartão define `--acento`. Assim o
mesmo desenho serve às duas leituras — e as provas embaixo de cada cartão
(1 cor · ícone do app · 16 px) continuam mostrando que **nenhum depende da cor**.
*(Detalhe técnico que vale guardar: dentro de `<use>` o CSS por classe não
alcança o conteúdo clonado — propriedade herdável e propriedade personalizada
alcançam. Por isso acento por variável, não por classe.)*

**Duas janelas fizeram folha de logo ao mesmo tempo.** Ele pediu o mesmo trabalho
na A e na B; a A montou 12 marcas curadas (`_logo-premium-A.html`), a B montou o
leque de 48. Ficaram as duas — ângulos diferentes, não duplicata. **Vale como
alerta de coordenação:** pedido repetido em duas janelas não aparece no quadro
até alguém escrever nele, e as duas só se descobriram no meio do caminho.

## 4.114 A folha das 12 marcas curadas — e dois desenhos que não liam o que deviam (06/08)

**A folha:** `client/public/_logo-premium-A.html` — doze símbolos desenhados à
mão, um de cada família (livro+som, selo de estúdio, monograma, aspas de
narração, quadrado abstrato…), todos numa cor só primeiro (a regra do §4.115:
"forma que só funciona porque é laranja não é boa forma"), com a cor entrando
só na terceira pergunta. Cada marca traz o porquê e o ponto fraco de verdade,
inclusive a recomendada — o **selo do estúdio** (nº4): um carimbo/selo redondo
com o corte de play dentro, escolhido por separar o AllBook dos ícones
quadrados cheios de Audible e Storytel.

**Conferir no navegador antes de mostrar a ele valeu a pena — pegou dois
desenhos que não liam o conceito pretendido:**

1. **O "carimbo de gravação" (nº5) lia como pen-drive ou controle remoto**, não
   como livro — um retângulo arredondado com uma linha vertical solta dentro
   não tem nenhum gancho visual de "livro". Redesenhado com as páginas
   aparecendo na lateral direita (o jeito clássico de ícone de "livro
   fechado", como o do próprio app de Livros da Apple): agora lê na hora.
2. **O monograma "a" (nº7) lia como "d"** — a haste vertical subia acima do
   corpo da letra, criando um ascendente que é exatamente o que distingue um
   "d" de um "a". Cortei a haste na altura do topo do corpo; agora não
   ultrapassa e volta a ler como "a".

**Por que isso importa registrar:** a §4.111 já tinha registrado que ele não
gostou do desenho à mão da rodada anterior — "o desenho não é o produto, o
conceito é". Um desenho que não bate com o conceito que ele descreve embaixo é
pior que não ter desenho: é dele que decide, e ele decide vendo. Testar cada
marca na tela antes de entregar (em vez de confiar só na leitura do código
SVG) é o que pegou os dois erros acima.

## 4.115 As ferramentas para gerar a marca — o mercado grátis mudou (06/08)

**O pedido do Matheus:** ferramenta **gratuita** e no modelo que ele descreveu —
*"você digitava um prompt e ele gerava diversas imagens, aí você ia clicando
nessas imagens e ia aparecendo outras, mais ou menos como é no Pinterest, só que
no contexto daquela logo"*. Não é "gerar 4 e acabou": é **garimpo por
vizinhança**, onde cada imagem é a semente da próxima rodada.

**Duas recomendações da §4.35 morreram** (verificado na web em 06/08/2026):

| Ferramenta | O que mudou | Serve? |
|---|---|---|
| **Grok** | Tirou imagem e vídeo do plano grátis em **19/03/2026**; free virou só texto | ❌ não |
| **Ideogram** | Free caiu de 10/dia para **10 por semana**, e o **Remix virou pago** — justo o botão do modelo Pinterest | ❌ não |
| **Bing / Copilot Imagens** | Sempre gerou 4 e parou ali; **nunca teve** variar-a-partir-desta | ❌ não |
| **Midjourney** | Continua o melhor em variação (Vary sutil/forte, Remix), mas **não tem plano grátis** (~US$10/mês) | 💰 só pagando |

**O que ficou, na ordem em que recomendei:**

1. **Leonardo.ai** — é literalmente o que ele descreveu: a home é um **feed
   estilo Pinterest** das criações de todo mundo e cada imagem tem **Remix**, que
   abre o prompt daquela imagem para você mexer. **150 tokens/dia** de graça
   (~10–15 imagens). No plano grátis **as criações ficam públicas** no feed.
2. **Google AI Studio** (modelo *Nano Banana*) — não tem feed, mas é de longe o
   mais generoso de graça (**centenas de imagens/dia**, contra 10–15 do
   Leonardo) e o refino é por **conversa**: "essa terceira, barras mais grossas".
   Para **afinar um símbolo já escolhido**, conversar bate feed.
3. **Recraft** — ~30–50 créditos/dia. **Correção do que eu disse primeiro:** no
   plano grátis ele **não exporta SVG** do que a IA dele gera, só PNG/JPEG —
   exportar vetor do gerado exige o pago. **O que é grátis é o vetorizador**
   (joga um PNG, sai SVG), e é para isso que ele serve aqui: converter o que veio
   do Leonardo. Ataca a questão em aberto da §4.111 (PNG × marca precisa ser
   vetor), só que por outro caminho.
4. **NightCafe** — feed e "evolve", mas **5 créditos/dia**: pouco para garimpar.

**O caminho recomendado, em três passos:** garimpar o conceito no **Leonardo**
(feed + Remix, com o prompt 1 da folha `_logo-A.html`, só o símbolo) → afinar o
escolhido no **AI Studio** conversando → tirar em vetor no **Recraft**, ou mandar
o PNG para eu redesenhar em SVG aqui. O passo 3 continua sendo a decisão em
aberto da §4.111 — só que agora existe uma opção que não depende de ninguém
redesenhar à mão.

**Apurado que vale além desta tarefa:** plano grátis de IA de imagem **apodrece
rápido** — duas das três indicações escritas em 26/07 estavam furadas em 06/08.
Recomendação de ferramenta escrita em documento tem prazo de validade; **conferir
antes de mandar ele usar**.

**Achado que atravessa duas folhas: os prompts da §4.111 já nasceram velhos de
cor.** Enquanto eu conferia as ferramentas, a janela A começou a implementar a
direção **"Estúdio"** da §4.110 — grafite `#121110`, **vermelho de gravação
`#FF4438`**, título em Space Grotesk e o nome escrito **"allbook" minúsculo**. Os
dois prompts pedem **laranja `#FF6A00` sobre `#141414`** e **"AllBook"** com
maiúsculas: duas das três escolhas da folha `_logo-A.html` foram **superadas por
uma decisão dele em outra folha**.

**A saída, e vale como regra:** gerar o símbolo **monocromático** — branco sobre
preto, sem letra. Forma que só funciona porque é laranja não é boa forma; e assim
o garimpo não depende de qual paleta vence. **A cor entra no fim, num clique.**
Escrevi esse terceiro prompt na folha e rebaixei os dois coloridos para "depois
que a paleta parar de mexer". **O letreiro não precisa de IA** — nome escrito é
escolher fonte e digitar, e é onde esses modelos mais erram (dois L virando um).

**Houve uma folha `_ferramentas-de-logo-C.html`, e ela foi apagada no mesmo dia
— o recado vale mais que ela.** Ele: *"você criou uma folha gigantesca para
falar uma coisa que era simples de ser falada… você poderia ter falado aqui tudo
que você falou na folha. Você cria quando precisa **ilustrar alguma coisa
específica**. Quando pode falar aqui, você fala aqui."* **Folha é instrumento de
escolha visual** — maquete desenhada para ele bater o olho e clicar. Instrução,
passo a passo, comparação de ferramenta e prompt para copiar **vão no chat**.
(Recuperável pelo git; tudo o que valia está nesta seção.)

**O que resolveu "onde fica o botão" foi imagem anotada, não texto:** recortei a
tela que ele mandou e circulei o ícone de ajustes. Vale como padrão para
"não acho o botão".

### A terceira rejeição de desenho à mão — e a decisão que sai dela

**Ele viu as 60 logos das §4.113 e §4.114 e reprovou todas:** *"Nenhuma me
agradou. Todas eram muito ruim. Todas tinham o mesmo: era um vermelho, era outra
sem cores"*. **A frase que importa é essa última:** o que ele viu como variação
foi **variação de cor**, não de forma — 60 desenhos com a mesma assinatura
visual.

**É a terceira vez, e o padrão fecha:**

| Quando | O que foi | Veredito |
|---|---|---|
| 26/07 | 3 animações de abertura (`3669f8d`) | *"nenhuma me agradou"* |
| 05/08 | 6 conceitos de marca (§4.111) | escolheu o conceito, **não gostou do desenho** |
| 06/08 | 48 + 12 símbolos (§4.113, §4.114) | *"todas eram muito ruim"* |

**Não é falta de empenho — é limite da ferramenta.** SVG escrito à mão sai
geométrico, plano e simétrico, sempre com a mesma mão; e "cara de prêmio" mora no
refinamento de proporção e no acidente feliz, que aparecem quando se veem
**centenas** de tentativas, não dezenas. **Decisão: paramos de propor logo
desenhada à mão aqui.** Quem quiser retomar, leia esta tabela antes.

### A recomendação de assinatura (ele perguntou: *"qual plano eu assinaria?"*)

**Midjourney Basic, US$ 10, um mês — e cancelar.** Razões, na ordem:

1. **É a única saída ainda não tentada**, e é literalmente a que ele descreveu
   desde a §4.35: *"você digitava e ele te dava centenas de opções"*.
2. **Ele não precisa saber desenhar nem escrever prompt** — os prompts estão
   prontos na folha; ele cola e vai clicando em *Vary sutil* / *Vary forte*.
3. **Logo é trabalho de uma vez.** Mensalidade permanente para um arquivo só é
   dinheiro parado; dá para reassinar quando precisar.

**Rejeitados, com o motivo:** *Recraft Pro* (US$ 25–48) — caro, e o vetorizador
grátis já faz o que precisamos; *ChatGPT Plus* / *Google AI Pro* (~US$ 20) — IA
para tudo, imagem é acessório e nenhum dos dois tem o "clica e varia"; *fábricas
de logo* (Looka, Brandmark) — marca genérica de catálogo, e o conceito já existe.

**Ele assinou no mesmo dia.** O passo a passo e o prompt adaptado estão na folha,
na seção "Você assinou o Midjourney — comece por aqui".

### A armadilha do prompt no Midjourney: proibição não se escreve no texto

**Os prompts da §4.111 não servem no Midjourney como estão.** Metade deles é
lista de `No text, no library, no gradient…`, e o Midjourney **não lê negação em
linguagem natural** — pior, a palavra proibida escrita no meio do prompt tende a
**puxar** aquilo para a imagem. Proibição ali é um parâmetro no fim da linha:
`--no text, letters, gradient, …`.

Os outros três parâmetros que mudam o resultado em logo:

| Parâmetro | O que faz |
|---|---|
| `--ar 1:1` | quadrado, formato de ícone |
| `--style raw` | **o que mais importa** — desliga o embelezamento automático, que é o que enche logo de brilho, sombra e "arte" |
| `--stylize 50` | segura a mão do artista dele (0–40 também serve) |

⚠️ **Armadilha dentro da armadilha:** `--no` separa por vírgula, e frase sem
vírgula é fatiada em pedaços soltos (`--no modern clothing` vira "no modern" +
"no clothing", que chega a disparar a moderação). **Lista com vírgulas, sempre.**

**O que rende o plano de US$ 10:** ~3,5 h de geração rápida por mês, e cada
rodada de 4 imagens leva menos de um minuto — são centenas de rodadas. Não há
motivo para economizar clique.

### O erro que eu repeti duas vezes: prompt fechado demais

**Ele, sobre o meu prompt:** *"não gosto dessa ideia de você já partir de um
princípio de determinar qual é a cor… quem tem que determinar essas coisas é a
ferramenta que está criando. Você está limitando a plataforma."* **Ele está
certo, e o defeito é meu, não do Midjourney.** Meus dois prompts descreviam a
forma inteira (página esquerda sólida, quatro barras que encurtam, margens,
simetria) e ainda travavam a cor — sobrava à ferramenta executar, não inventar.
Resultado: 8 imagens praticamente iguais, exatamente a queixa que ele já tinha
feito das 60 logos desenhadas à mão.

**A regra que fica:** prompt **descritivo** serve para *reproduzir* uma ideia já
escolhida; prompt **aberto** serve para *descobrir*. Estávamos na fase de
descobrir e eu escrevi um prompt de reproduzir. **Na fase de garimpo: uma linha,
sem cor, sem forma ditada, `--stylize` alto** — e o `--no` só contra o que
estraga o enquadramento (mockup, cartão de visita, grade de variações).

**Isso reabre o conceito da §4.111.** "A página que vira som" foi escolhido entre
6 desenhos meus, não contra o que uma ferramenta de verdade produz. Se o garimpo
aberto trouxer coisa melhor, **o conceito escolhido não é compromisso** — o que
vale é o que ele reconhecer batendo o olho.

### O conceito novo, e ele é dele: os dois L de AllBook são o livro aberto

*"a gente pode colocar esses dois AllBook com alguma coisa como um fone de
ouvido… a gente aproveita esses dois AllBook e L como um livro aberto"*. **É
melhor que os seis conceitos anteriores, por três motivos:**

1. **Ninguém copia.** Livro-com-fone qualquer concorrente desenha; o **duplo L**
   existe só no nome AllBook. Identidade que nasce da palavra é própria por
   construção.
2. **Resolve a queixa da rodada 1** — ele queria o nome junto do símbolo. Aqui
   **o nome é o símbolo**: não há lockup para equilibrar, e o letreiro sozinho já
   é a marca.
3. **Aguenta o tamanho pequeno** justamente porque é letra: forma que o olho já
   sabe ler.

**O risco, e é o fone.** *Livro + fone* é a imagem mais batida do ramo (foi por
isso que a proposta C caiu na §4.111 — *"é o que todo app de audiolivro já
fez"*). Se o fone entrar, tem de ser **o arco por cima da palavra**, não um fone
desenhado ao lado: aí ele vira estrutura da marca em vez de ilustração colada.

⚠️ **Limite técnico que decide quem faz o quê:** logotipo tipográfico depende de
a letra estar **exata**, e é justamente onde IA de imagem falha — ela *desenha*
letra, não escreve. Então o Midjourney serve aqui para achar **o mecanismo** (como
os dois L se abrem, onde o arco passa), e **a execução é minha**, compondo com
fonte de verdade. Pela primeira vez a divisão de trabalho da §4.35 fica confortável
nos dois lados.

**Rodado, e o mecanismo funciona.** Primeira vez em toda a história da marca que
algo não foi rejeitado de saída: o duplo L virando livro aberto **se lê na hora**,
e a grafia "AllBook" saiu **certa** em várias imagens (a preocupação com os dois L
era exagerada — a palavra é curta e comum o bastante). O que continua ruim:

1. **A tipografia sai genérica** — itálico pesado com contorno, cara de logo de
   time ou de editora dos anos 90. É o oposto de "cara de prêmio".
2. **O arco do fone virou um sorriso** — não lê como fone e some no tamanho
   pequeno. Confirma o risco que já estava anotado aqui.
3. **`--no mockup` não segura o mockup** — voltou livro fotografado sobre mesa.
   Só `--no photo, photography` junto resolve.

**Extensão que eu propus, e é o próximo teste: os dois O de "Book" viram as
conchas do fone.** Assim o **nome inteiro** conta a história — `ll` é o livro,
`oo` é o fone — e nada fica colado por cima da palavra, que era o defeito do
arco. É a mesma lógica dele levada até o fim.

**Aviso de método que ele precisou ouvir:** ele estava **rodando prompts novos**
em vez de clicar em *V Forte* / *V Sutil* na imagem que já tinha chegado perto.
O garimpo mora no botão, não no texto — prompt novo recomeça do zero.

### A especificação final da marca — dita por ele, e o Midjourney não dá conta

Ele me pediu para **assumir o navegador** e operar o Midjourney; rodei **12
rodadas** na conta dele. Do que ele rejeitou saiu a especificação mais precisa
que a marca já teve:

1. **Tudo dentro do letreiro.** Nada de símbolo separado em cima, embaixo ou ao
   lado — *"as referências de livros e áudios teriam que ser embutidas no
   letreiro e não ser uma coisa separada"*.
2. **O infinito mora nos dois O de "Book"** — não é um símbolo à parte, e não
   pode se fundir com o B (o defeito da única que ele quase gostou: *"juntou o
   símbolo do infinito com o B"*, e ainda saíram **três** infinitos).
3. **Uma referência de livro e uma de áudio**, também embutidas nas letras.
4. **Simples e minimalista** — *"não pode ser uma coisa muito complexa"*.
5. Uma linha só.

**Por que a ferramenta não entrega isso, e é limite dela, não do prompt:** o
modelo **insere** o infinito e o livro como *caracteres a mais* em vez de
**transformar** as letras que já existem. Saiu `AlB∞k`, `All∞[livro]ook`,
`All ∞ B[livro]k` — a palavra quebra toda vez. IA de imagem **desenha** letra,
não escreve, e fundir dois glifos existentes mantendo a palavra legível está
fora do alcance dela.

**Onde isso deixa a marca:** a especificação virou trabalho de **execução**, não
de descoberta — e execução de spec é desenho, não sorteio. Isso **não contradiz**
a regra das três rejeições (§ acima): o que foi reprovado três vezes foi eu
**inventar** conceito; aqui o conceito é dele, detalhado ao nível da letra. Mas a
decisão é dele, e está registrada como pendente.

**O que também apareceu no caminho, e vale guardar:** os ajustes fixos da conta
dele estavam com **Estranheza 157** e **modo Cru ligado**, sujando toda geração —
e **voltam sozinhos** depois de mexer. Só `--weird 0` no fim do prompt segura.

### O infinito com dois players — reprovado (08/08)

Ele trouxe uma **imagem de fora** (infinito de traço grosso com um play vermelho
dentro do laço esquerdo, "Allbook" em Poppins Light com os dois **o** encostados)
e pediu para recriar em vetor **duplicando o play no laço direito**. Fiz a folha
`_logo-infinito-A.html` — o original mais as quatro direções possíveis, com troca
de paleta e de tamanho do play. **Ele reprovou de saída** e foi terminar a marca
com o ChatGPT. **Não apurei o motivo** — ficou em aberto; se o assunto voltar,
perguntar antes de redesenhar.

**O que sobrou de apurado, e poupa trabalho na próxima:**

- **A geometria do infinito está resolvida.** Dois círculos de raio R com centros
  em ±`R/cos α` (usei α=28°); os arcos viram reta nos pontos a `±R·sin²α/cos α`
  de x e `±R·sin α` de y. Esse `c = R/cos α` é o que faz a reta sair **tangente**
  ao arco — com qualquer outro valor o cruzamento do meio ganha uma quina visível.
  O path está no arquivo da folha.
- **Duplicar o play custa a legibilidade do símbolo.** Os dois vazios do laço são
  o que faz o ∞ ler como ∞; preenchidos, em tamanho de ícone vira duas manchas
  coladas. Isso vale para **qualquer** marca que ponha algo dentro dos dois laços,
  inclusive as que nascerem do ChatGPT.

### A régua que decide ícone: cor sobrevive, forma não (08/08)

Ele trouxe do ChatGPT uma leva de símbolos (infinito + livro aberto, uns com
onda de áudio dentro dos laços, outros com olhos de coruja). Montei
`_prova-icones.html`, que reduz o mesmo arquivo a 160 / 64 / 48 / 32 / 24 px, e
o resultado **contrariou a minha própria previsão** — vale guardar como régua:

- **Detalhe fino de forma morre; contraste de cor não.** Eu previ que a onda
  vermelha usada como bico sumiria em 32 px: **não some**, fica nítida até 24 px.
  Já as ondas brancas dentro dos laços viram **textura cinza** em 32 px — ou
  seja, o elemento que dizia "áudio" é o primeiro a morrer justamente na versão
  que apostava nele.
- **Rosto sobrevive à redução melhor que qualquer símbolo abstrato** (olho é
  mancha compacta; onda é pente). Isso não decide a marca — mede legibilidade,
  não originalidade, e coruja+livro continua sendo o clichê do ramo.
- **Meio-termo é o pior caminho:** trocar os olhos da coruja por ondas perde o
  rosto **e** o áudio de uma vez, e em 32 px o desenho fica igual ao que não tem
  coruja nenhuma, só com dois espetos a mais.

**Método a repetir:** antes de opinar sobre ícone, reduzir e olhar. A folha da
prova leva 5 minutos e desmentiu uma opinião minha que eu já tinha dito em voz
alta duas vezes.

### As 80 do gerador de logo — avaliadas e recusadas (08/08)

Ele trouxe uma grade de **80 marcas** de gerador automático. Recusei todas, com
um motivo só e verificável: **nenhuma diz áudio**. São livro aberto (~25 das 80),
pilha de livros, marcador e monograma "A"/"a" — todas anunciam *livros*, que é o
que todo concorrente tem. **Gerador desenha o substantivo do nome, nunca o verbo
do produto**: leu "book", desenhou book; não tem como saber que o produto é
*narrar o que ainda não existe em áudio*. Some a isso o azul/roxo com degradê
(briga com o vermelho de gravação) e a colisão de território — livro branco em
quadrado colorido é quase o ícone do Apple Books.

**O que se salva como ideia, não como logo:** o monograma **"ab" em traço
contínuo formando dois laços** (Q1-9, Q2-10, Q3-20 e o melhor, Q4-5, que quase
fecha num ∞) — a única das 80 aparentada com o infinito, e a única que carrega
as **iniciais**. Continua sem áudio.

**E um dado a favor da coruja:** entre as 80, livro aberto aparece a cada três, e
coruja **nenhuma**. Não prova originalidade (gerador não desenha bicho), mas o
clichê saturado neste território é o livro aberto — a marca dele não colide com
nada dessa grade.

## 4.116 O tema claro "Tinta" consertado — e o erro de projeto que o quebrava (08/08)

**A reclamação dele, na abertura da sessão:** *"o preto até que corrigiu, ficou
muito bom. O problema é que, quando a gente vai para o tema claro, as letras não
ficam visíveis e tem um problema pior ainda: as capas dos livros. Quando você
clica na capa do livro, simplesmente a cor toma conta da parte de trás."*

Ele estava certo nas duas contagens, e a causa das duas é a mesma decisão da
§4.112 levada longe demais.

### O erro: `black` também virou "a cor do papel"

Apontar `--color-white` para a cor do texto do tema foi acerto — é o que fez
1.700 classes se inverterem sozinhas. **Apontar `--color-black` para a cor do
papel foi erro**, e é reversível numa linha: no app, `black` quase nunca quer
dizer "o fundo". Ele quer dizer **escurecer**, e escurecer é escurecer nos dois
temas:

| Onde aparece | Quantos | O que fazia no tema claro |
|---|---|---|
| véu por trás das folhas e menus | ~40 | clareava — a folha branca flutuava sem véu |
| sombra (`shadow-black/40`) | 13 | sombra cor de papel: sumia |
| degradê sobre a capa (`from-black/90`) | 4 | pintava creme por cima da arte |

O último é exatamente o *"a cor toma conta da parte de trás"*: na ficha do livro
a capa ocupa 65% da tela e o degradê que a apagava virou papel creme por cima da
arte — a capa continuava lá, gritando, e o título por cima dela era tinta escura
sobre foto escura.

**O que passou a valer:** `black` é preto literal outra vez. O preço são os 85
pontos onde `text-black` significava "texto sobre botão claro" — todos trocados
por **`text-primary-foreground`** (sobre o vermelho) e **`text-background`**
(sobre botão branco), que é o par certo e se inverte sozinho. No escuro,
`--primary-foreground` deixou de ser branco e virou o grafite: branco sobre
`#FF4438` dá 3,3:1 e o grafite dá 6,3:1 — os botões já faziam isso à mão.

### A classe que existia e nunca foi usada

`.sobre-midia` nasceu na §4.112 para o texto que fica por cima de imagem. Estava
escrita no `index.css`, documentada no CLAUDE.md e avisada às outras janelas — e
com **zero usos em todo o app**, dois dias depois. Foi por isso que "as letras
não ficam visíveis": nome de categoria, título da ficha, cartão de trecho, faixa
do gênero, tudo caía em tinta escura sobre foto escura.

Agora ela está aplicada nos onze lugares que têm texto sobre imagem ou sobre cor
viva, e ganhou uma irmã: **`.veu-de-midia`**, o degradê preto de baixo para cima
que garante a leitura mesmo quando a capa é clara.

**Lição de método, e é a que interessa:** a §4.112 diz "conferido no navegador,
nos dois temas" — e estava conferido *de olho*. Olho não pega texto que continua
legível na captura pequena, nem mede contraste. **Conferência de tema agora se
faz medindo:** `scripts/auditoria-contraste.js`, colado no console, percorre todo
texto visível, compõe as camadas translúcidas até o fundo real e calcula o
contraste. Foi ele que mostrou o número que fechou o caso. *(Duas armadilhas
ficaram anotadas dentro do arquivo: o Chrome serializa as cores do `color-mix` do
Tailwind em `oklab()` e nem o canvas converte — a conversão está escrita à mão
lá; e elementos escondidos fora da tela entram na conta como falso positivo.)*

### A terceira causa, que o olho não pegaria

`text-white/40` quer dizer "texto secundário". Sobre o grafite, branco a 40%
rende **3,6:1**; sobre o papel creme, tinta a 40% rende **2,4:1** — e o app tem
1.677 usos dessas opacidades. A conta não é simétrica porque o papel é muito
mais claro (93%) do que o grafite é escuro (7%).

Como reescrever 1.677 classes está fora de cogitação, o `index.css` ganhou uma
**tabela de reforço que só vale no tema claro**: cada opacidade é remapeada para
a que dá o mesmo contraste (40% → 53%, 25% → 34%, 70% → 80%). Medido depois:
3,58:1 no claro contra 3,60:1 no escuro — paridade.

As regras ficam dentro de `@layer utilities` e com `:where()` de propósito: assim
empatam em especificidade com a classe original e ganham só por virem depois, e
um `hover:text-primary` na mesma tela continua ganhando delas. **Opacidade nova
(`text-white/33`) precisa de linha nova na tabela** — está avisado no arquivo.

### O que ficou sabido e não virou decisão

O app inteiro vive **abaixo do padrão de acessibilidade AA** nos textos
secundários — 3,6:1 contra os 4,5:1 exigidos —, e isso vale nos **dois** temas
desde muito antes deste conserto. Igualei os temas, que era o pedido; subir a
régua mudaria a aparência do Estúdio também, então fica registrado como escolha
em aberto, não como pendência.

### Outros consertos da mesma varredura

- **As medalhas** (`SeloDeMedalha`): as cores de `TIERS` são metálicas — prata,
  carmim, dourado — e metal só brilha sobre escuro. No claro o dourado dava
  1,9:1. O selo virou ilha escura nos dois temas.
- **Doze escurecimentos internos** (campo de texto, rodapé de cartão, bloco
  citado) usavam `bg-black/25`: no escuro isso é imperceptível, no claro virava
  um cinza pesado. Passaram a `bg-background/60`, que escurece no Estúdio e dá
  papel no Tinta.
- **O cabeçalho transparente** sobre o billboard usava `from-black/80`. Como o
  nome e os ícones dele são da cor do texto do tema, o véu preto os apagaria no
  claro: virou `from-background`.
- **Ícones `fill-black`** dentro de botão branco viraram `fill-current`.
- **`.sobre-midia` não redefine `--background`** — parece detalhe e não é: o
  degradê que funde a imagem com o fundo do app (`from-background`) mora dentro
  da mesma caixa que o texto, e apontá-lo para preto pintava uma tarja preta no
  pé de toda imagem.

---

## 4.117 A linha "Notificações" apontava para a caixa, e a vitrine repetia (08/08)

Saiu de um **levantamento do que falta no front-end** que ele pediu à janela B.
O apanhado inteiro está no chat e no git; aqui ficam só as decisões e o que
foi apurado com custo.

### A linha "Notificações" nas Configurações — decidido por ele

**A queixa, e ela é de régua:** *"não faz sentido ela estar em configurações.
Em configurações, ela só valeria a pena se fosse configuração de notificação.
Aí ela valeria a pena, mas como está, não pode ficar. Ou a gente adiciona
configuração de notificação, ou a gente retira as notificações."*

Ele tinha razão: a linha abria `/notifications`, **a mesma caixa do sino do
topo** — duas portas para a lista, e nenhuma para o ajuste.

**A saída não foi nenhuma das duas que ele ofereceu, e o motivo é um achado:
a configuração já existia.** Os dois interruptores ("curtidas no que eu
escrevi", "comentários no que eu escrevi") estavam prontos e funcionando desde
a §4.92, escondidos **no fim da lista de Perfil e privacidade** — onde ninguém
procura barulho. O próprio comentário no código já admitia o desconforto:
*"não é privacidade e sim barulho"*. Então não foi preciso escolher entre pôr
e tirar: **bastou mandar a linha para o lugar que sempre foi dela.**

- `/avisos` (novo) = **os ajustes**. `/notifications` = **a caixa** do sino.
  Nomes diferentes de propósito; endereços parecidos para coisas diferentes
  seria repetir na barra o problema que a tela veio desfazer.
- Os dois interruptores **saíram** de `AjustesDoPerfil` — não foram copiados.
  Controle em dois lugares é a redundância que a §4.105 varreu.
- A tela nova tem **uma porta para a caixa** no fim ("Ver meus avisos"): quem
  toca em "Notificações" procurando os avisos não cai num beco.
- As peças de desenho (título, moldura, porta, interruptor) saíram para
  `components/perfil/PecasDeAjuste.tsx`, porque agora há duas listas.

> **A régua que fica:** *numa tela de ajustes, o rótulo promete um ajuste.*
> Quando uma linha de Configurações leva a uma lista de conteúdo, ou ela vira
> ajuste, ou ela sai.

### A vitrine do `/forum` — o defeito da §4.104, e a lição que custou duas tentativas

O recado formal da §4.104 (a mesma comunidade em duas seções, o motivo repetido
palavra por palavra) estava **de pé desde 05/08** e foi consertado agora.

**A regra da dobra, e ela é estreita de propósito.** Repetir comunidade entre
carrosséis **continua valendo** — é decisão dele de 05/08, o molde do Reddit,
onde o que muda é o ângulo. O que estava errado era repetir na **mesma dobra**:
"Hábitos na vida real" aparecia em "Semelhantes a Suspense & Mistério" e outra
vez em "Semelhantes a Quem ouve no trânsito", os dois títulos visíveis sem
rolar. Agora **cada seção evita só o que a seção imediatamente anterior
mostrou**; duas seções adiante a comunidade volta. Deduplicar contra tudo o que
já apareceu esvaziaria as últimas seções — são 25 comunidades fora das suas
para 5 carrosséis.

**A lição que vale além desta tela — e eu precisei errar para achá-la.** O
motivo repetido tinha duas caras: "também é de ficção científica" (categoria) e
**"alguém que você segue está aqui"**, que saía igual em quatro cartões. A
primeira tentativa trocou a segunda frase pelo **nome** da pessoa — e na tela
**continuou igual**: eu sigo uma pessoa só, ela está em quatro comunidades, e
os quatro cartões passaram a dizer "Juliana S. está aqui".

> **Trocar o texto não conserta repetição quando o *dado* é o mesmo.** O
> desempate tem que ser **outro dado**. O motivo mais forte fica com o primeiro
> cartão; os seguintes caem para o que descreve cada comunidade por si
> (movimento da semana, acervo de conversas, tamanho). Empate ainda é possível
> — duas comunidades novas, do mesmo tamanho, sem conversa —, e aí a frase
> igual é a verdade: não há o que as separe.

**Armadilha registrada:** a limpeza roda na **lista final da tela**, não dentro
de `sugestoes()`. O carrossel "Recomendado para você" é feito de duas fontes
(`sugestoes` + `emAlta`) e as duas escrevem motivo — limpar só uma deixaria a
repetição atravessar a emenda.

### A seção de 2 cartões empilhava — pergunta dele, no mesmo dia

*"Quando você vai lá em semelhantes a suspense e mistério, só tem dois. Não
seria interessante ele ficar um do lado do outro?"*

**Ele tem razão, e não era escolha de desenho — era a grade.** O carrossel é
`grid-flow-col grid-rows-2`, que enche **por coluna**: com seis cartões dá três
colunas de dois (o molde que ele mesmo pediu na §4.102 — *"tem uma fileira
apenas de carrossel aqui"*); com **dois**, dá uma coluna só, um cartão embaixo
do outro, e metade da largura vazia.

**Por que o empilhado está errado ali, e são três coisas:**

1. **O gesto morre.** Carrossel promete "arrasta que tem mais" — e não tem. Não
   existe coluna seguinte espiando, que é o que faz o molde funcionar.
2. **A seção se disfarça de lista** no meio de uma tela onde tudo mais rola de
   lado. Mesmo título, mesmo cartão, comportamento diferente: o olho lê como se
   fosse outro componente.
3. **O vazio à direita não é neutro** — numa tela de carrosséis, meia largura
   ocupada parece conteúdo que não carregou.

**O que ficou:** 3 cartões ou menos → **uma** fileira; 4 ou mais → duas.

**O que eu NÃO fiz, e é a decisão que importa:** *não* encolhi os dois cartões
para caberem inteiros na largura da tela. É a saída óbvia e ela custa caro — o
cartão desta seção passaria a ter um tamanho que nenhuma outra tem, e **tamanho
de cartão é hierarquia**: menor lê como menos importante. Melhor manter os
300px e deixar o segundo espiando na borda, que já é o convite a arrastar.

### As folhas foram fechadas — decisão dele

*"Você pode fechar todas essas folhas, menos a folha pedir sem crédito, porque
essa ainda vai ser construída. As demais já foram vistas."*

**Fechadas:** `_logos-C.html`, `_o-que-cada-botao-faz-B.html`,
`_comentarios-fora-da-vitrine-B.html` — e, por consequência, toda a leva de
marca reprovada (`_muitas-logos-B`, `_logo-premium-A`, `_logo-infinito-A`).
Nenhuma delas espera resposta; onde o roteiro as cita, é história, não fila.

**Continua aberta, uma só:** `_pedir-sem-credito-A.html` — as 4 decisões de
crédito e planos. **É a próxima a virar tela**, e é a que destrava a §"planos
com crédito de pedido" (os números estão decididos desde 26/07 e não há tela
onde morar, porque a `/plans` foi removida na §4.31).

**Os arquivos `.html` não foram apagados**, e é decisão minha declarada: eles
não estão no git, então apagar é irreversível e custa nada guardar. O que foi
apagado é o **status de pendente**.

### O que este levantamento apurou, e não virou trabalho

- **O onboarding nunca foi construído** — é o único item remanescente da fila
  original de telas. Nada no código.
- **O favicon do app ainda é o do Replit** (`client/public/favicon.png`,
  1,1 KB, de 20/02), como a §4.111 já registrava. Segue pendente.
- **A crítica "o app nunca foi visto num celular" era falsa** e foi retirada: a
  moldura de prévia tem seletor de aparelho (iPhone 16 Pro Max, Galaxy S25
  Ultra, Pixel…), e ele usa. A anotação da §4.104 envelheceu; **conferir antes
  de repetir crítica lida em documento.**
- **Sobraram ~22 linhas com cor literal** em código de verdade (o resto é
  comentário ou cor que precisa ser escrita à mão, como o canvas do
  `CartaoDeResumo`, que não lê CSS). O que importa ali é o **âmbar da
  identidade antiga nos clubes** — `CartaoDoCiclo`, `FaixaDoClubeNoLivro`,
  `ClubesComecando`, `LinhaDoCiclo` — que briga com o vermelho novo.

### A segunda rodada, no mesmo dia: "parece uma coisa mais morta" (08/08)

Com o tema claro já consertado, ele voltou com três reclamações — e as três
tinham a mesma raiz, que a primeira rodada **não** pegou: eu tratei o tema claro
como "o escuro com as cores trocadas", e ele não é.

**1. Superfície não se empilha do mesmo jeito nos dois temas.** `bg-white/5` num
cartão quer dizer *"mais um degrau acima do fundo"*. No Estúdio isso é clarear;
no Tinta, a primeira rodada mandou escurecer o papel — e escurecer papel creme
com tinta quente dá um **cinza sujo**. Era o que deixava os blocos "escrito por /
narrado por" e os cartões do feed com cara de morto. Agora, no claro, esses
fundos são **branco** (com a borda dando o recorte), e o teto é 25%: acima disso
`bg-white/NN` não é superfície, é botão quase sólido, e ali a tinta é que vale.
*(A regra vale para `bg-`; texto, borda e anel continuam sendo tinta.)*

**2. O vermelho estava mesmo morto, e o motivo é físico.** O carmim de editora
`#C1362F` tem 61% de saturação. Sobre papel claro, uma cor média parece mais
apagada do que a mesma cor sobre grafite — contraste simultâneo. Subiu para
`#DA281B` (saturação 78%, luminosidade 48%), que é o ponto onde a cor fica viva
**sem** perder legibilidade: 4,4:1 sobre o papel, contra os 4,7:1 de antes. Mais
vivo que isso — o `#FF4438` do Estúdio — cai para 2,9:1 e deixa de servir como
cor de texto. *(Sobre foto continua valendo o `#FF4438`: `.sobre-midia` já o
devolve.)*

**3. A pastilha de ícone esmaecida não sobrevive ao papel.** `bg-primary/15` com
o ícone em `text-primary` é bonito sobre grafite — vermelho profundo com o ícone
brilhando. Sobre branco vira **rosa-bebê**, e foi isso que ele chamou de "ícone
cinza". As 12 pastilhas de ícone do app passaram a ter a **cor cheia com o ícone
em `primary-foreground`**, e ficou melhor nos dois temas (conferido). Os selos
com texto (`bg-primary/15 text-primary`) continuam esmaecidos de propósito — se
todos virassem vermelho cheio, a tela viraria semáforo.

**Dois consertos menores da mesma conversa:** o anel dos avatares
(`ring-white/15`) virava um aro escuro em volta da cara da pessoa no tema claro —
passou a ser **a cor do fundo**, que é o recorte que Instagram e Slack usam; e o
véu dos cartões com capa ao fundo deixou de ser chapado e virou **degradê
horizontal** (`from-black/30 … to-black/80`), para a capa voltar a aparecer do
lado da arte — era a reclamação de que "no escuro você vê a capa presente, no
claro não".

**A lição que fica, e é a mesma da primeira rodada em outra escala:** tema claro
não é a foto negativa do escuro. Clarear e escurecer não são operações
simétricas, porque o papel tem pouco espaço acima dele (6 pontos de L\*) e o
grafite tem muito. Toda vez que uma peça do escuro "some" no claro, a pergunta
certa não é *quanto* de opacidade falta — é **em que direção** aquela peça
deveria se afastar do fundo.

---

## 4.118 Pedir sem crédito: a assinatura, a escada e a tela de Planos (08/08)

As quatro decisões da folha `_pedir-sem-credito-A.html`, respondidas por ele, e
**construídas na mesma sessão**. A folha era a última em aberto (§4.117).

**A queixa que abriu tudo:** *"se a pessoa não tiver crédito, ela vai ter o
trabalho de digitar tudo isso — título do livro, autor, observações — e no final
de tudo só então vai aparecer uma mensagem dizendo 'olha, você não tem crédito,
você não vai pedir'."*

### As quatro respostas dele

| # | Escolha | O que significa |
|---|---|---|
| 1 | **1B** | O plano de acesso não dá crédito mensal, mas todo assinante ganha **um pedido de boas-vindas, uma vez na vida da conta** |
| 2 | **D** | Faltando crédito, a saída é **comprar um pedido avulso na hora** (R$ 39,90), sem trocar de assinatura |
| 3 | **3A** | Crédito não usado **acumula, com teto de 3** |
| 4 | **4B** | A escada tem **três faixas**, com a do meio marcada |

### O que resolve a queixa não é a mensagem — é a ordem

O conserto inteiro cabe numa frase: **a verdade vem antes do formulário, e o
botão diz a mesma coisa que o topo.** O estado aparece no alto desde o primeiro
segundo, em quatro versões — tem boas-vindas · tem N pedidos · acabaram, dá para
comprar avulso · não assina —, e o botão lá embaixo nunca promete "Pedir" para
quem não pode: ele diz "Pedir por R$ 39,90" ou "Assinar e pedir".

**Ninguém é barrado em nenhum caso.** Os campos ficam abertos, e quem sai para
ver os planos **volta com o que escreveu** (rascunho em `sessionStorage` —
`sessionStorage` e não `localStorage` de propósito: rascunho é de agora; voltar
semana que vem com um formulário pela metade seria assombração). A porta laranja
do menu continua sendo porta, e não catraca.

### Três decisões minhas, declaradas — nenhuma estava na folha

1. **O avulso exige assinatura ativa.** A folha não tratou quem não assina nada,
   e o avulso solto **fura a escada**: R$ 39,90 sem assinatura sai mais barato
   que o plano do meio (R$ 49,90, que já inclui o acesso), e o degrau de cima
   perde a razão de existir. Com assinatura a conta fecha: 19,90 + 39,90 = 59,90
   contra 49,90 — o plano continua ganhando, que é o que a folha queria do
   avulso ("o mais caro empurra para o plano").
2. **Os nomes das faixas não são os da maquete.** A folha chamava a de cima de
   **"Sem limite de fila"**, e isso mente — ela dá três livros por mês, que é um
   limite. Ficaram **Ouvir · Ouvir e pedir · Ouvir e pedir mais**: três degraus
   que se leem em ordem, e a régua dos nomes (§4.94) manda o óbvio ganhar do
   charmoso.
3. **"Assinatura" virou linha das Configurações.** Sem ela, a tela de planos
   teria uma porta só (a de Pedir) e quem já assina não teria onde ver o que tem
   nem como trocar. A etiqueta mostra o plano em vigor, como "Neste aparelho"
   mostra o tema.

### O risco que ele aceitou, e fica registrado

A própria folha nomeou o contra do **D**: *"quem paga avulso pode nunca assinar
o plano — e o plano é a receita que se repete"*. Ele escolheu sabendo. O que
segura isso é o preço: o avulso é caro o bastante para o plano ganhar em duas
compras. **Se um dia a maioria virar avulso, o lugar de mexer é
`PRECO_AVULSO`.**

### O que é verdade e o que é esqueleto

**Nada cobra.** "Assinar" grava o plano no `localStorage` — o mesmo grau de
verdade do login (`auth.ts`). O fluxo inteiro funciona; o gateway é que não
existe. Quando o pagamento entrar, **quem troca de fonte é
`lib/assinatura.ts`**, e nenhuma tela fica sabendo.

⚠️ **A recarga mensal é contada pelo relógio do aparelho** (`ultimaRecarga`, no
formato `AAAA-MM`): ao ler o estado, se o mês virou, o crédito entra respeitando
o teto. Adiantar o relógio do Mac adianta o mês. Aceitável num protótipo; num
servidor, não.

### Apurado no caminho, e é armadilha de teste

**Clique de automação em janela do Chrome sem foco não dispara `onClick` nem
`Link` do wouter** — mas *digitar num campo funciona*, o que faz parecer que o
clique chegou. Perdi três rodadas achando que `navegar("/plans")` estava
quebrado; o código estava certo desde o começo. `osascript -e 'tell application
"Google Chrome" to activate'` antes de clicar resolve, e `elemento.click()` pelo
console é o caminho seguro para conferir efeito de botão.

---

## 4.119 O banco de dados nasce: Postgres, o esquema inteiro e o catálogo dentro dele (08/08)

Pedido dele: *"vamos iniciar a criação de todo o banco de dados do aplicativo"*.

### A ressalva que eu fiz antes de começar — e o caminho escolhido

Migrar as 61 chaves do navegador de uma vez é exatamente o cenário de **quebra
silenciosa** que o `docs/BANCO-DE-DADOS.md` existe para evitar: o dado muda de
lugar, a tela continua compilando, ninguém vê erro, e a pessoa perde a
biblioteca. Então o alvo continua sendo *todo* o banco, mas em camadas, na ordem
que o próprio checklist manda (§4): **catálogo primeiro, porque não tem dado de
usuário e errar ali é barato.**

Nesta rodada: banco de pé, **esquema inteiro desenhado** (62 tabelas) e o
catálogo dentro dele — **sem trocar uma linha de tela**. O app continua lendo o
`localStorage`, idêntico; o banco enche por baixo.

### Postgres na máquina, não na nuvem — e por quê

Instalado com `brew install postgresql@17`, rodando como serviço
(`brew services`). Não pede conta, não custa nada, não depende de internet, e o
código não sabe onde o banco mora: **trocar por Neon/Supabase é mudar a linha
`DATABASE_URL` do `.env`**. A versão 17 (e não a 18) porque é a que os serviços
gerenciados rodam hoje — publicar depois não vira migração de versão.

**O que faltava e ninguém tinha notado:** não existia `drizzle.config.ts`. O
`npm run db:push` do `package.json` estava **quebrado desde sempre**.

### O esquema virou uma PASTA, não um arquivo

O esquema inteiro cabia num arquivo só, com **uma tabela de 3 colunas**. Virou a
pasta `shared/schema/`, um arquivo
por assunto: `catalogo`, `contas`, `biblioteca`, `opiniao`, `social`, `clubes`,
`forum`, `salas`, `pedidos`. Com 61 chaves para modelar, um arquivo único
passaria de duas mil linhas. `@shared/schema` continua valendo (o `index.ts`
reexporta tudo).

**Cada armadilha do checklist virou comentário na coluna que ela ameaça** — não
adianta o aviso morar num `.md` que ninguém abre na hora de escrever a consulta.

### Decisões de modelagem que valem registro

- **O `id` do livro é `integer` escrito à mão, nunca `serial`** (armadilha 2.1).
  Duna é o 7 no banco como é no `books.ts`.
- **A chave primária de pessoa é o slug**, não um número: o slug já é a
  identidade dela (URL do perfil, nome do arquivo de foto).
- **Papel (autor/narrador) não é coluna** — deduz-se da relação com os livros,
  pelo mesmo motivo que `people.ts` deriva a lista: assim ela não pode discordar
  do catálogo. Média de nota também não é coluna: média guardada envelhece calada.
- **A estante do clube não é uma tabela** — é `clube_ciclos` com `terminadoEm`
  preenchido. Duas tabelas obrigariam a copiar o ciclo ao terminar, e cópia é
  onde o dado racha.
- **Curtir virou UMA tabela para o app inteiro** (ordem da seção 3.1), com o tipo
  do alvo. Hoje são duas chaves quase iguais, e uma **já trocou de formato uma
  vez**; unificar agora evita a terceira.
- **Denúncia nasce `aberta`, com data** — vira fila de revisão, não um "escondido
  para mim" que ninguém lê.
- **`vinhetaSegundos` é coluna do livro.** A vinheta do AllBook desloca o áudio
  inteiro: se a abertura tem 8s, cada marcador de capítulo anda 8s e **toda
  posição salva aponta 8 segundos fora do lugar**. Guardar o número é o que
  permite recalcular em vez de descobrir pelo ouvido.
- **`creditos_de_movimento` (extrato de crédito) foi acrescentada** — não existe
  no front. É a tabela mais barata de criar agora e a mais cara de reconstruir
  depois: sem extrato, "sumiu um crédito meu" é palavra contra palavra.
- **A tabela `session` está declarada de propósito**, embora quem a crie seja o
  `connect-pg-simple`: sem declarar, o `drizzle-kit push` a trataria como tabela
  desconhecida e candidata a apagar — o que derrubaria o login de todo mundo.

### `MemStorage` morreu (armadilha 2.8)

`server/storage.ts` era uma lista na memória que sumia quando o servidor
desligava. Virou `PgStorage`, ligado ao Drizzle — **antes** de qualquer dado de
usuário passar por ali, que era o que o checklist mandava.

Nasceu também `GET /api/banco/saude`, e ela tem motivo: como nenhuma tela lê do
banco ainda, sem essa rota **não haveria nenhuma forma de perceber que o
Postgres caiu** — o app seguiria funcionando pelo `localStorage` e o erro
apareceria meses depois.

### A ingestão, e o obstáculo real que ela teve de contornar

`npm run db:catalogo` copia o catálogo do código para o banco (idempotente:
rodar duas vezes atualiza, não duplica).

O obstáculo: `client/src/lib/books.ts` é um arquivo **do navegador** — importa
PNGs e usa `import.meta.glob`, que é invenção do Vite. `tsx` quebraria na
primeira linha. A saída foi empacotar o catálogo com o **esbuild**, que já é
dependência do projeto, trocando as imagens por texto vazio e o glob por um
objeto vazio; as capas e as fotos são lidas **direto do disco**, o que é mais
confiável do que reproduzir o glob.

**Conferido contra o código, não de olho:** 59 livros no banco = 59 em
`books.ts`; 58 capas em disco + 1 livro sem capa (o "Organize-se", que já usava
a capa tipográfica); 11 vozes do Studio + 37 pessoas que só escrevem = 48;
nenhum livro órfão de editora; `Duna` continua sendo o id 7. `npm run check`
limpo.

### Um buraco achado NO PRÓPRIO CHECKLIST

As armadilhas **2.10 e 2.11** são citadas **seis vezes** no
`docs/BANCO-DE-DADOS.md` e **não existiam** — a seção 2 terminava na 2.9. São as
duas "transversais" que a recontagem de 04/08 prometeu escrever e ninguém
escreveu. Reconstruí as duas a partir das menções e do código, e elas agora
estão no documento:

- **2.10 — o dado do usuário é um REMENDO por cima de ficção que vive no
  código.** `allbook_clubes` não guarda clubes: guarda diferenças ("entrei
  neste", "removi fulano") aplicadas sobre clubes fixos do código, com ids como
  `misterio`. Migrar o remendo antes de o alvo existir faz o clube sumir da
  lista da pessoa sem erro nenhum.
- **2.11 — o dono implícito: ausente quer dizer "eu".** `autorSlug` vazio num
  post significa que o post é seu; `donoSlug` vale a constante `EU`. No banco o
  autor é coluna obrigatória, e `EU` não é ninguém — sem traduzir para o id da
  conta, os posts ficam órfãos.

### O que fica para as próximas etapas

Contas de verdade (Passport + senha + a migração de primeira entrada, e
recolocar o "Esqueci minha senha" que foi removido em 25/07), o destino da
ficção (armadilha 2.4), e só então as telas trocando `localStorage` por API.
**Nada disso foi feito aqui, e o app não mudou.**

### A terceira rodada: o que "não se destaca" e o que "parece mais claro" (08/08)

**1. Cartão branco que não descolava do papel.** Ele comparou com o que funciona
na própria tela: *"o botão Minha lista é branco, mas ele se destaca porque a cor
de fundo é creme"*. Estava certo — a superfície tinha ido para 40% de branco e a
borda, para 7% de tinta. **Duas linhas finas mudam tudo:** a superfície subiu
para ~80% (praticamente branco) e a **borda ganhou 70% a mais de peso** abaixo de
15%, porque linha fina sobre branco some mais do que sobre grafite.

**Ele também perguntou se os cartões não deviam ser escuros, como o botão
Continuar. Eu recomendei que não, e ele aceitou:** o "Continuar" é preto
justamente por ser a ação principal; se os cartões de informação também
escurecerem, o botão deixa de saltar e a tela perde a hierarquia.

**2. O vermelho do player "que se confunde com o creme".** Aqui a primeira
suspeita estava errada e a medição salvou: o botão **já estava** no vermelho
certo (`#DA281B`, medido no elemento). O que ele viu é real, mas é
**perceptual** — a mesma cor saturada perde brilho sobre fundo claro (contraste
simultâneo, o mesmo efeito que já tinha derrubado o carmim). *(Teste que fecha a
questão: um círculo com a cor pura desenhado ao lado do botão sai idêntico a ele
na captura — não havia transparência nenhuma.)*

A saída foi a que ele mesmo apontou ao dizer *"deveria ser mais vivo, como é no
tema escuro"*: **a faixa do player virou escura nos dois temas** (`sobre-midia` +
`bg-black/85`). Com fundo escuro, `.sobre-midia` devolve o `#FF4438` do Estúdio,
e o cartão de trecho passa a ser uma peça coesa — capa escurecida em cima, faixa
de player embaixo, como um cartão de música.

**3. E um bug de verdade, que ele fotografou:** a faixa "Este é o livro do
Terror de Madrugada" tinha `from-[#241a10]` — **marrom escrito à mão**, resto da
identidade laranja anterior — com o texto do tema por cima. No claro dava tinta
escura sobre marrom escuro, ilegível na metade esquerda. Os três pontos com esse
marrom (`FaixaDoClubeNoLivro`, `ClubesComecando`, `CartaoDoCiclo`) e o âmbar
`#f59e0b` do avatar em `lib/clubes.ts` passaram a usar o vermelho da marca. Era o
resto de âmbar velho que a janela B tinha apontado como pendência.

---

## 4.120 Contas de verdade: a senha passa a valer, e o "Esqueci minha senha" volta (08/08)

Etapa 2 do banco, na ordem do `docs/BANCO-DE-DADOS.md` (§4, item 2).

### O que mudou de fato

Até aqui `lib/auth.ts` deixava **qualquer e-mail entrar** e nunca guardava senha
— e isso não era descuido, era coerência: não havia com o que conferir. Agora há
servidor, e a senha passa a valer.

- `POST /api/contas/cadastrar · entrar · sair`, `GET /api/contas/eu`,
  `POST /api/contas/esqueci · redefinir`.
- Senha cifrada com **scrypt** (`node:crypto`, sem dependência nova), com sal
  próprio por senha e comparação `timingSafeEqual`.
- **Sessão em cookie assinado, guardada no banco** (`connect-pg-simple`).
- Criar conta cria, **na mesma transação**, a linha de `ajustes` e a de
  `assinaturas`. Sem transação, uma pessoa poderia existir sem preferências — e
  cada tela leria vazio e escolheria o padrão errado, sem erro nenhum.

### O `@username` congela (armadilha 2.9 resolvida)

O endereço público nasce do nome com a mesma regra do `meuSlug()` — quem já tinha
um link compartilhado continua com ele — e **daí em diante não muda sozinho**.
Antes ele era recalculado do nome a cada leitura: trocar o nome matava todo link
já enviado, em silêncio. Empate resolve com número (`matheus-2`), coisa que sem
contas simplesmente não existia.

### "Esqueci minha senha" volta (armadilha 2.3 resolvida)

Ele foi **removido** em 25/07 (§4.23) porque não havia senha para recuperar —
não era item de lista de espera, era o app não mentir. Voltou agora que há.

⚠️ **Ainda não existe envio de e-mail, e a tela diz isso na cara:** em
desenvolvimento o link vem na própria resposta, dentro de uma caixa que explica o
porquê. É o mesmo princípio que tirou o link em julho — melhor um aviso explícito
do que um "enviamos um e-mail" que nunca chega. Quando o envio existir, o servidor
para de devolver o campo e nada mais muda.

Token de **uso único**, com **1 hora** de prazo, e o que fica no banco é só o
**resumo** dele: quem ler o banco não redefine a senha de ninguém. Redefinir
**mata todos os outros pedidos em aberto** da conta — senão um link antigo, na
caixa de entrada de quem invadiu o e-mail, continuaria valendo depois da
recuperação.

### As três decisões de privacidade que ficam no código

1. **A mesma mensagem para e-mail que não existe e para senha errada.** Separar
   as duas transformaria a tela de login numa forma de descobrir quem tem conta
   no AllBook.
2. **O "esqueci" responde igual exista ou não a conta**, pelo mesmo motivo — e
   ele nem pede senha para ser chamado.
3. **No cadastro, dizer a verdade é o certo** ("já existe uma conta com esse
   e-mail"): o vazamento é o mesmo, mas quem está criando conta precisa saber que
   já tem uma, senão fica preso tentando.

### Como isso entrou sem mexer nas telas dos outros

Só **duas telas** usam `client/src/lib/auth.ts`: `Login.tsx` e `You.tsx` — e `You.tsx` é da
janela B. Deu para não encostar nela porque:

- **`readSession()` continua SÍNCRONO.** O `localStorage` deixou de ser a verdade
  e virou **espelho** dela: `readSession()` lê o espelho (instantâneo, como
  antes) e `sincronizarSessao()` corrige quando o servidor responde. Sem isso,
  cada tela que lê a sessão de dentro de um `useState(readSession)` teria de
  virar assíncrona.
- **`signOut()` continua `void`** — apaga o espelho na hora e avisa o servidor
  depois. O pior caso é uma sessão órfã no banco, que expira sozinha; esperar a
  rede deixaria o botão "Sair" parado.
- **A tela de trocar senha mora em `/login?token=…`**, não numa rota nova: rota
  nova exigiria mexer no `App.tsx`, que também é da B.

⚠️ **Servidor fora do ar não desloga ninguém**: em falha de rede o espelho fica
como está. Deslogar por Wi-Fi ruim seria pior do que mostrar um nome
desatualizado por alguns segundos.

### O que NÃO foi feito, e por quê

O checklist manda fazer a **migração de primeira entrada** (armadilha 2.2) *junto
com as contas, não depois*. **Ela não foi feita, de propósito:** os dados do
usuário ainda não têm tabela em uso — não há para onde migrar. Fazer agora seria
escrever uma migração que copia nada.

Ela entra na etapa 3, **na mesma mudança** que ligar a biblioteca ao banco, e é
lá que o `signOut` inverte de sentido: hoje ele não apaga a biblioteca porque ela
é *do navegador*; quando for *da conta*, apagar passa a ser o certo. O comentário
que diz isso está no próprio `signOut`, para não depender de alguém abrir o `.md`.

### Conferido, não suposto

Pela API: cadastro, e-mail repetido (409), senha errada e e-mail inexistente com
**a mesma mensagem**, senha certa, "esqueci" com e sem conta dando **a mesma
resposta**, redefinição, **token recusado na segunda vez**, senha antiga deixando
de valer, `matheus` → `matheus-2` na colisão. No banco: senha guardada como hash
de 161 caracteres, a senha em texto **não aparece em lugar nenhum**, `ajustes` e
`assinaturas` nascidos com os padrões certos (conta privada desligada, capítulo
desligado, `boasVindas: nao`). **A sessão sobrevive ao reinício do servidor** —
que era exatamente o motivo de guardá-la no banco. E na tela: criar conta, senha
errada mostrando o erro, o link de troca, a tela de senha nova, e a senha antiga
deixando de entrar.

### Armadilha de teste, confirmando o que a janela B registrou

Perdi tempo achando que a mensagem de erro não aparecia: **o clique não estava
chegando**, porque a janela do Chrome tinha perdido o foco (§4.118). Pelo
`elemento.click()` do console, o erro apareceu na hora. O registro da B está
certo e vale para as três janelas.

### A varredura final do tema claro, e a conferência do escuro (08/08)

Ele pediu duas coisas: procurar o que ainda estava errado no Tinta e **provar que
o Estúdio não regrediu**. A varredura por código achou o que o olho não acha.

**O que ainda quebrava no claro — sempre a mesma família: cor FIXA.**

- **Vermelhos claros da paleta** (`text-red-300`, `text-red-200`, `text-red-400`)
  em **23 arquivos**: o "AO VIVO" das salas, o "Sair da sala", os botões de
  apagar. Sobre grafite eles brilham; sobre papel creme dão ~1,8:1 e somem.
  Viraram `text-primary` (o vermelho do tema) e `text-destructive` (perigo).
- **Dois fundos escuros escritos à mão:** a barra flutuante da sala
  (`bg-[#1c1414]`) e o hover do banner de pedido (`bg-[#242424]`). A barra é peça
  de estúdio e ficou **escura nos dois temas**, agora com `sobre-midia`; o hover
  virou `bg-secondary`.
- **Um anel e uma borda que eram "a cor do fundo escuro"** (`ring-[#181818]` nos
  avatares empilhados, `border-[#1d1712]` na bolinha da linha do ciclo): viraram
  `ring-background` / `border-background`, que é o que elas sempre quiseram dizer.
- **Duas cores de tipo no feed** (`#5b9dff` azul-claro, `#c084fc` roxo-claro):
  2,2 a 3,0:1 sobre papel. Foram para `blue-500` e `purple-500`, que passam nos
  **dois** fundos.

**O que sobrou de cor literal, e de propósito:** as três metálicas das medalhas
(`#b6bcc6` prata, `#e3c169` dourado) — o selo já é ilha escura — e as cores do
`Reacoes` quando ele recebe a prop `claro`, que é um fundo claro **local**, não o
tema.

**A conferência do escuro, dita com todas as letras: o Estúdio mudou, sim.** Não
regrediu, mas não ficou idêntico, e as diferenças são estas:

1. véu, sombra e degradê ficaram **um pouco mais escuros** (preto de verdade em
   vez do grafite);
2. os **selos "AO VIVO"** passaram de rosa-claro para o vermelho de gravação —
   mais forte, e mais coerente com a identidade;
3. as **pastilhas de ícone** viraram cor cheia;
4. o **anel dos avatares** deixou de ser um halo claro e virou recorte da cor do
   fundo;
5. a **faixa do player** do cartão de trecho ficou mais escura;
6. o **cartão do clube** trocou o marrom âmbar pelo vermelho da marca.

Conferido tela a tela no Estúdio (Início, ficha, player, Feed, Perfil, Clube,
Comunidades): nada ilegível, nada quebrado. As telas que ainda aparecem na
medição de contraste do Tinta são os **textos terciários** — e elas aparecem com
o mesmo número no Estúdio: 3,1 contra 3,05; 2,54 contra 2,56. **É paridade, que
era o alvo**, e não conformidade AA — isso segue em aberto, como já registrado.

---

## 4.121 A biblioteca sobe para a conta — e "Sair" inverte de sentido (08/08)

Etapa 3 do banco: a camada que o checklist chama de **"a que mais dói se
sumir"**. Sete chaves passaram a viver na conta: `allbook_library`,
`allbook_playback`, `allbook_finished`, `allbook_listening`, `allbook_ratings`,
`allbook_bookmarks` e `allbook_trechos_guardados`.

### A decisão que segurou tudo: NENHUMA lib de dados foi aberta

`library.ts`, `playback.ts`, `listening.ts`, `ratings.ts`, `bookmarks.ts` e
`trechosGuardados.ts` estão **byte a byte como estavam**. **22 telas** leem
`playback.ts` e 10 leem `library.ts` — mexer na assinatura de qualquer uma viraria
uma reescrita do app, e ainda esbarraria no trabalho das outras janelas.

O gancho já existia: **cada uma delas dispara um evento de `window` em toda
escrita** (`allbook:library`, `allbook:playback`…), porque as telas precisavam se
redesenhar. `lib/sincronizacao.ts` escuta esses eventos e manda a mudança para a
conta. Nasceu **de graça**, de uma peça construída para outra coisa.

E o servidor conversa **no formato do navegador** (`[{id, addedAt}]`,
`{dia: {sec, horas, livros}}`…): a tradução para as tabelas mora em
`server/dados.ts`. O front continua um espelho burro.

### A migração de primeira entrada (armadilha 2.2), enfim

`mesclar()` junta o que está no navegador com o que está na conta, **sem perder
de nenhum lado**, e roda em toda entrada — não só na primeira. A regra de
desempate muda por assunto, e cada uma tem motivo:

| Assunto | Ganha | Por quê |
|---|---|---|
| biblioteca, concluídos | a data **mais antiga** | é quando aquilo aconteceu de fato |
| progresso, notas | o **mais recente** | é a última vez que a pessoa mexeu |
| diário | o **maior** de cada dia | somar duplicaria o histórico a cada entrada |
| marcações, trechos | **união por id** | é texto da pessoa: diante da dúvida, não apagar |

### E "Sair" inverteu, como o checklist previu

Até hoje `signOut` **não** apagava a biblioteca, de propósito: ela era *do
navegador*, e apagá-la faria a pessoa perder tudo por ter clicado em "Sair".
Agora ela é *da conta* — está no servidor e volta na próxima entrada —, então
**deixá-la seria o erro**: o próximo a pegar o celular veria a biblioteca, as
notas e os trechos de quem saiu. O comentário dentro do `signOut` mudou junto
com o código, que era a condição escrita no `.md`.

⚠️ **`allbook_downloads` continua ficando, e a ausência dele na lista é a
decisão**: baixado é **do aparelho** — o arquivo está *naquele* celular.

### Três defeitos achados testando, e todos consertados

1. **O progresso não gravava.** `sql\`... <> all(${array})\`` não expande array em
   lista de parâmetros; virou `notInArray` do Drizzle.
2. **Livro concluído aparecia em "Continuar ouvindo" com 0%.** `playback` e
   `finished` dividem a tabela `progresso`, então marcar como concluído cria a
   linha mesmo sem o player ter tocado. O GET passou a devolver só quem tem
   progresso de verdade.
3. **O servidor trocava o id das marcações — e isso DUPLICARIA cada nota a cada
   sincronização.** O navegador guarda o id dele (`"7-1200"`), o banco gerava
   outro; na volta, o front não reconhecia que era a mesma e ficava com duas.
   Nasceu a coluna `idLocal` (em `marcacoes` e `trechos_guardados`), e o id do
   navegador vence na leitura.

### E uma CORRIDA, que é o achado mais importante

A sincronização de abertura leva um ou dois segundos. Se a pessoa mexesse no app
**durante** ela — adicionar um livro logo ao abrir —, o envio carregava o valor
calculado *antes* e **desfazia o que ela tinha acabado de fazer**, sem erro
nenhum na tela. Peguei porque o primeiro teste de sincronização automática falhou
e o segundo passou; a diferença era só o tempo desde o carregamento.

O conserto: **`enviar()` relê o `localStorage` no instante do envio**, em vez de
receber o valor de fora. E os sete envios saem em paralelo, encurtando a janela.
Reproduzi a corrida de propósito depois — mexendo na biblioteca logo após o
carregamento — e navegador e conta batem.

### Um erro de modelagem que só apareceu ao ligar de verdade

A tabela `audicao` tinha chave `(dia, hora, livro)`. Parece mais normalizado e é
**errado**: o app **nunca soube qual livro foi ouvido em qual hora**. O diário
guarda `{ sec, horas: {}, livros: {} }` — dois recortes independentes do mesmo
total. Uma tabela cruzada obrigaria a **inventar** o cruzamento na migração.
Viraram três: `audicao_dia`, `audicao_por_hora` e `audicao_por_livro`.

### Conferido de ponta a ponta

Simulei alguém que usou o app por semanas sem conta (3 livros, progresso,
marcação com nota, avaliação), criei a conta e **tudo subiu**; saí e **os dados
locais sumiram, menos os downloads**; entrei de novo e **tudo voltou**. Depois
zerei o navegador inteiro — simulando **outro aparelho** — entrei, e a Biblioteca
apareceu na tela com os 3 títulos e "Duna, capítulo 4" em *Continue de onde
parou*. É o item 1 da seção 5 do checklist. Sem conta, o app funciona como sempre
e o servidor responde 401 — nada vaza.

### Limite conhecido, dito aqui para ninguém descobrir na marra

**Quem escreve por último ganha.** Cada assunto é gravado inteiro, não item a
item; com dois aparelhos abertos ao mesmo tempo, o segundo a salvar pode desfazer
o que o primeiro fez. Baixar antes de subir fecha quase toda a janela, mas ela
existe. O conserto (gravar por item, com carimbo) fica para quando houver gente
usando em dois aparelhos ao mesmo tempo — hoje não há.

### Armadilha nova: `npm run db:push` fica INTERATIVO

Quando a mudança pode perder dado — renomear tabela, ou criar restrição única
numa tabela que já tem linhas —, o `drizzle-kit` **para e espera um "sim"
digitado**, e a sessão do Claude não tem terminal interativo (o erro fala em
TTY). A saída é preparar o terreno antes: apagar a tabela vazia, ou limpar as
linhas de teste, e rodar de novo. Aconteceu duas vezes hoje.

---

## 4.122 O perfil, os ajustes e o resto do que é só da pessoa sobem para a conta (08/08)

Continuação direta da §4.121, e **não depende da decisão sobre a ficção** — é
tudo dado de uma pessoa só. Sete chaves novas: `allbook_profile`,
`allbook_settings`, `allbook_weekly_goal`, `allbook_achievements_won`,
`allbook_recommendations`, `allbook_book_requests` e `allbook_assinatura`.
São **14 no total** sincronizadas.

### Quatro libs ganharam evento — e é a convenção da casa, não invenção

`profile.ts`, `achievements.ts`, `recommendations.ts` e `requests.ts` eram as
únicas da família **sem um evento de `window`** ao escrever. Sem ele,
`lib/sincronizacao.ts` não teria como saber que o nome ou a foto mudaram.

A adição é de uma linha em cada, no ponto de gravação, e **não muda assinatura
nenhuma** — as telas não sabem que aconteceu. `assinatura.ts` (da janela B) já
tinha o dele, então não precisou ser aberto.

### Três decisões que valem registro

- **O e-mail NÃO viaja pela rota de dados.** Ele é o login. Trocá-lo é operação
  de conta — pede confirmação e checagem de duplicidade —, não efeito colateral
  de salvar o perfil. O servidor ignora o campo, e testei mandando um e-mail
  diferente de propósito.
- **A etapa do pedido vinda do navegador é ignorada.** Hoje o pedido nasce e
  fica em `recebido` porque não há fila (armadilha 2.6); quando o estúdio
  existir, **quem move o pedido é ele**. Aceitar a etapa do navegador deixaria
  qualquer um se declarar "pronto". Pedido que o estúdio já mexeu não é
  rebaixado.
- **A meta semanal é o único caso em que o LOCAL vence na entrada.** A conta
  nasce com a meta padrão (180 min), então deixar o servidor ganhar apagaria a
  meta que a pessoa escolheu antes de se cadastrar. Perfil e ajustes seguem a
  regra oposta (servidor vence onde tem valor), e a diferença está comentada nos
  dois lugares.

### O mesmo defeito de id apareceu de novo — nos pedidos

O servidor trocava o id do pedido por um `uuid`, e a sincronização **duplicaria
o pedido a cada rodada** — idêntico ao que aconteceu com as marcações na §4.121.
Ganhou a mesma coluna `idLocal`. Testei mandando três rodadas seguidas do que o
servidor devolveu: continua um pedido só.

**A lição, que vale para toda chave que ainda falta:** se o item tem id gerado no
navegador, **o banco precisa guardar esse id** — senão a identidade se perde na
volta e o dado se multiplica sozinho.

### E a semeadura chegou à porta do banco

Testando, apareceram na conta **quatro troféus que a pessoa nunca ganhou**. A
causa: o app semeia **42 dias de audição falsa** para as Estatísticas não
nascerem vazias (`allbook_listening_seeded`, cada dia com `exemplo: true`), e
`achievements.ts` calcula as medalhas em cima disso.

Enquanto era só no navegador, era vitrine. **Subindo para a conta, vira histórico
falso que atravessa aparelhos e fica indistinguível do real** — exatamente o que
o checklist mandava evitar (*"semeadura tem de morrer em produção"*).

**Conserto aplicado:** o servidor **recusa dias marcados como exemplo**. Medido
depois: 42 dias de demonstração no navegador, **zero na conta**.

⚠️ **O que NÃO foi consertado, e é pendência nomeada:** os troféus derivados
desse histórico ainda sobem, porque o front não distingue medalha ganha de
medalha calculada sobre exemplo. O conserto de verdade é a semeadura morrer — que
é decisão de produto, já prevista no checklist, e não código.

---

## 4.123 O troféu falso: a demonstração vazava para dentro da conta (08/08)

O Matheus perguntou por que os troféus derivados do histórico de exemplo não
tinham sido consertados na §4.122. **A resposta honesta é que a minha
justificativa era preguiçosa** — eu escrevi que "o front não distingue medalha
ganha de medalha calculada sobre exemplo", e o sinal estava lá o tempo todo:
cada dia do diário carrega `exemplo: true`, e `ResumoDeAudicao` **já expunha**
um `temExemplo`.

### O problema, em três elos

1. O app semeia **42 dias de audição falsa** para as Estatísticas não nascerem
   com gráficos vazios (`allbook_listening_seeded`).
2. `stats.ts` soma o diário **inteiro** — daí saem "39,7h ouvidas" e as
   sequências.
3. `achievements.ts` acende as medalhas com esses números, **carimba a data e
   grava**. Desde a §4.122 essa chave sobe para a conta: o troféu falso virava
   **permanente e sincronizado entre aparelhos**.

### O conserto: dois cálculos, um para mostrar e outro para gravar

`lerResumo({ soReal: true })` deixa de fora os dias de demonstração. Quem
**mostra** medalha (Conquistas, Perfil, Estatísticas) continua usando o resumo
completo — a demonstração é justamente o que se quer ver ali. Só o
`AvisoDeConquista`, que é **o único lugar que grava**, usa o resumo real.

Medido numa conta nova: a tela segue mostrando 39,7h e **4 medalhas acesas**; a
conta recebe **zero**. Depois de ouvir de verdade, "primeira-escuta" é ganha e
sobe — e as três que dependiam do histórico falso continuam de fora.

### E o vazamento maior, que só apareceu por um número não fechar

Ao conferir, registrei 5 minutos de audição e o resumo "real" respondeu **118
minutos**. O número não fechava, e ali estava o defeito de verdade:

`registrarAudicao` fazia `delete dia.exemplo` — *"o dia deixou de ser
demonstração no instante em que entrou audição real"*. A intenção era boa, o
efeito não: **os segundos semeados daquele dia continuavam lá e passavam a
contar como reais**. Um dia semeado com 6.780s (1h53) recebeu 300s de verdade e
devolveu 7.080s "reais".

**Agora o dia de exemplo é ZERADO antes de receber audição real**, não apenas
desmarcado. A marca vale para o dia inteiro e não há como separar o que é
semente do que é real **dentro** do mesmo dia — zerar é o único caminho honesto.
O custo é perder um dia de gráfico entre 42; o outro caminho creditava horas
inventadas a uma pessoa.

**Medido depois:** 6.780s de demonstração + 60s reais = **60s**.

### A lição, que vale para o resto da migração

**Todo dado semeado que passa a subir para a conta muda de natureza:** no
navegador ele é vitrine, no servidor ele é história da pessoa. A pergunta "isto
é demonstração?" precisa ser feita **na porta do banco** — foi assim com o
diário (§4.122) e com as medalhas (aqui), e vai valer igual para votos de
enquete, presenças e curtidas quando a camada social entrar.

---

## 4.124 A camada social fica como está, de propósito (08/08)

**Decisão do Matheus**, ao ser perguntado sobre o destino da ficção (armadilha
2.4): *"a camada da rede social vai ficar por enquanto até pra gente poder ver se
não é quebrada alguma coisa nesse processo, até pra gente poder simular a questão
dos comentários e tal"*.

Ou seja: **os leitores fictícios e os ~90 comentários fixos continuam**, e a
migração deles **não** acontece agora. O motivo é bom e vale registrar porque
inverte a ordem sugerida do checklist: enquanto o resto do banco assenta, a
comunidade fingida serve para **testar que nada quebrou** e para simular conversa
— coisa que uma comunidade real vazia não faria.

⚠️ **O que isso implica, para ninguém tropeçar depois:**

- `allbook_my_comments`, `allbook_replies`, `allbook_reactions`,
  `allbook_curtidas`, `allbook_posts`, `allbook_following`, `allbook_seguidores`
  e as chaves de clube e fórum **continuam só no navegador**. As tabelas delas
  existem e estão **vazias** de propósito.
- A armadilha **2.4 segue em aberto**, e continua sendo pré-requisito para abrir
  o app a gente de verdade — não para continuar desenvolvendo.
- Quando ela for decidida, lembrar da §4.123: **dado semeado que sobe para a
  conta muda de natureza**. Votos de enquete, presenças em evento e o número-base
  de curtidas são exatamente do mesmo tipo do troféu falso.

---

## 4.125 Os textos do app que a migração deixou mentindo (08/08)

Ao ser perguntado qual era o próximo passo do banco, fui olhar o estado real — e
o próximo passo não era uma etapa nova, era **dívida do que a gente acabou de
construir**. Cinco textos de tela continuavam dizendo que os dados vivem só no
aparelho, e isso deixou de ser verdade nas §4.121 e §4.122.

É literalmente o item da seção 5 do `docs/BANCO-DE-DADOS.md`: *"reler a seção 3 e
atualizar os textos do app que hoje dizem 'só neste aparelho'"* — e é o mesmo
princípio que fez o "Esqueci minha senha" ser **removido** em 25/07: o app não
mente sobre como funciona.

### O grave: o texto do botão "Sair"

`pages/You.tsx` promete, **no diálogo de confirmação**, que *"sua lista, seus
downloads e suas recomendações continuam salvos neste aparelho"*. Desde a §4.121
o `signOut` **apaga** a lista, o progresso, as notas e as recomendações do
navegador — de propósito, porque agora são da conta e voltam na entrada
seguinte.

Ou seja: a pessoa lê que fica, clica, e some. **A quebra silenciosa do checklist
acontecendo ao contrário** — o código mudou e o texto ficou para trás, sem nada
falhar.

⚠️ `You.tsx` e `RequestBook.tsx` são da **janela B**; deixei o recado no quadro
com o texto pronto para colar, em vez de editar arquivo alheio.

### Os que corrigi

- **`Login.tsx`** — dizia que a biblioteca subiria "na próxima etapa". Fui **eu**
  que escrevi isso na §4.120, e envelheceu na §4.121, uma etapa depois. Ficou um
  comentário no código avisando que este texto já mentiu uma vez.
- **`ProfileEdit.tsx`** — dizia *"ainda não existe conta nem servidor"*. Agora o
  texto **muda conforme haja conta ou não**: dizer a mesma frase para os dois
  casos enganaria metade das pessoas.

### A regra que fica

**Toda camada que sobe para a conta deixa um texto para trás.** A migração não
termina no código: termina quando a tela volta a dizer a verdade. Vale para
comentários, clubes e fóruns quando eles forem.

---

## 4.126 Cópia de segurança do banco — e o erro que eu cometi testando ela (08/08)

Desde a §4.121 o banco guarda **dado de gente**: biblioteca, progresso, notas,
marcações e trechos escritos pela pessoa. Ele rodava só nesta máquina e **não
havia cópia nenhuma** — um disco com problema apagaria tudo, que é literalmente o
medo que fez o `docs/BANCO-DE-DADOS.md` existir.

`scripts/backup-banco.sh`: `agora`, `listar`, `restaurar`, `instalar`,
`desinstalar`, `limpar-testes`. Instalado como LaunchAgent
(`com.allbook.backup`), uma cópia por dia às 13h, mantendo as **14 últimas**.
Formato `custom` do `pg_dump` — comprimido, e o `pg_restore` consegue trazer de
volta tabela por tabela, que é o que importa no dia em que só uma coisa se
perdeu.

⚠️ **As cópias ficam FORA do repositório** (`~/AllBook-backups`): dado de pessoa
não entra no git — um `git push` distraído publicaria a biblioteca e as notas de
alguém.

### Testei restaurando de verdade — e por isso o erro apareceu

**Cópia não testada não é cópia.** Fiz o caminho completo: criei dado, tirei a
cópia, **apaguei o banco** e restaurei. A conta, os livros, a nota escrita e o
catálogo voltaram inteiros.

### 🚨 O erro: apaguei a conta real do Matheus

Para "simular o desastre" rodei `delete from contas` **sem olhar o que havia na
tabela**. Eu supus que só existiam as minhas contas de teste — e ele tinha criado
a conta dele **dois minutos antes**, enquanto eu trabalhava.

Deu para devolver: a cópia tinha sido feita depois do cadastro dele, então a
conta, os ajustes, a assinatura e o dia de audição voltaram com o **mesmo id** —
e, como a tabela `session` não tem chave estrangeira para `contas`, ela
sobreviveu ao apagamento e **a sessão dele continuou valendo**. Ele não precisou
entrar de novo.

**A ironia não passa despercebida:** o backup que eu estava testando salvou o
estrago que o teste causou. Se eu tivesse feito o mesmo teste uma hora antes, o
dado dele teria sumido sem volta.

### O que mudou por causa disso

`limpar-testes` nasceu daqui. Ele apaga **só** contas `@teste.com` e
`@allbook.com.br`, **mostra o que vai apagar antes**, diz quantas contas reais
existem, e **não apaga nada** sem `--confirmo`. Conta de gente de verdade nunca
casa com o filtro.

**A regra, que vale para qualquer janela:** o banco deixou de ser um rascunho no
dia em que a primeira conta real entrou. **Nunca mais `delete from <tabela>` no
banco de verdade** — olhe o que está lá primeiro, e use o alvo estreito. Comando
cego em banco com gente dentro não é atalho, é acidente esperando data.

---

## 4.127 A fila do pedido existe: o estúdio ganhou uma mesa (08/08)

Armadilha **2.6** resolvida na parte que dependia de nós. Até hoje o pedido
nascia e **permanecia em `recebido` para sempre** — não havia fila, servidor nem
ninguém do outro lado. A tela era honesta sobre isso, mas a promessa pública do
AllBook é de **24 horas**.

`npm run estudio` — a fila, do mais antigo ao mais novo, com quem pediu, há
quanto tempo espera (avisando quando passa de 24h), a voz escolhida e a
observação. `mover`, `pronto`, `recusar`.

### Nenhuma tela mudou, e isso não foi sorte

O estúdio move o pedido **no servidor**, e a sincronização da §4.122 leva o
estado novo ao app sozinha — porque no `mesclar()` de `allbook_book_requests` o
**servidor vence** para o mesmo id. A trilha de quatro etapas que a janela B
construiu passa a mostrar o estado real **sem uma linha de mudança**, e o
`idLocal` (§4.122) garante que é o mesmo pedido dos dois lados.

### Duas decisões que valem registro

**1. É um comando de terminal, não uma tela de administração — por segurança.**
A ferramenta fala **direto com o banco**, sem rota HTTP. Uma rota de admin é uma
porta a mais exposta, com autenticação, papéis e o risco de alguém achá-la — tudo
isso para um estúdio que hoje é **uma pessoa, nesta máquina**. Quem tem acesso ao
banco local já é o dono do projeto. Quando o estúdio virar equipe, a rota (e uma
coluna de papel em `contas`) passam a valer a pena; antes disso seria superfície
de ataque sem dono.

**2. `pronto` EXIGE o livro entregue.** Marcar pronto sem apontar um livro seria
dizer a alguém que a narração dela está no catálogo quando não está — e o
comando recusa. Quando o livro ainda não existe, ele **ensina o caminho** em vez
de aceitar: acrescentar em `books.ts` → `npm run catalogo` → `npm run db:catalogo`
→ voltar com o id.

### O limite honesto: livro novo ainda não nasce daqui

**O catálogo que o app mostra vem do CÓDIGO** (`lib/books.ts`), não do banco —
medido: **63 arquivos** leem de lá, e alguns no topo do módulo. Um livro criado
só no banco existiria para as chaves estrangeiras e **não apareceria em tela
nenhuma**.

Avaliei fazer o app ler o catálogo do banco antes desta etapa e **descartei**: é
a maior reescrita que resta e o ganho hoje é baixo, porque o catálogo é curado à
mão e funciona. Fica registrado como o pré-requisito real para o pedido virar
livro de ponta a ponta — e para o áudio.

### Dívidas nomeadas

- **A tela não desenha `recusado`.** Ela conhece as quatro etapas da trilha; um
  pedido recusado fica mudo para quem pediu. O comando avisa isso ao recusar.
- **O crédito ainda é debitado no navegador** (`lib/assinatura.ts`, da janela B).
  O servidor registra o pedido mas não valida saldo — o que só fecha quando a
  criação do pedido passar pela API. Hoje nada cobra, então o risco é zero.

### Armadilha apurada: o `npm run` engole as `--flags`

`npm run estudio pronto <id> --livro 8` **falhava dizendo que faltava o livro**,
com o livro escrito ali. O `npm` interpreta a flag como dele e não a repassa;
funciona com `npm run estudio -- pronto <id> --livro 8`, mas exigir aquele `--`
perdido no meio é detalhe que ninguém lembra. O comando passou a aceitar o id do
livro como **número solto**: `npm run estudio pronto <id> 8`.

---

## 4.128 Onde o áudio vai morar: as contas, e a premissa que não se sustenta (08/08)

**Decisão em aberto** — o Matheus levantou duas preocupações antes de começarmos
o áudio, e as duas mudam a arquitetura. Registro aqui a apuração para a conversa
não recomeçar do zero.

### 1. "Um lugar que não pode ser derrubado por nada" — a premissa é falsa

Ele sugeriu a Cloudflare por acreditar que ela seria imune. **Não é, e nenhuma
é.** A Cloudflare já **cortou clientes por decisão própria**, mais de uma vez e
sob pressão pública — o *Daily Stormer* em 2017, o *8chan* em 2019, o
*Kiwi Farms* em 2022. É empresa americana e responde a ordem judicial como
qualquer outra. Escolher um provedor achando que ele é santuário é o pior dos
dois mundos: paga-se a conta e continua-se dependente.

**A defesa que funciona não é achar a fortaleza certa — é não depender de
nenhuma.** E ela é barata, porque tem duas pernas que já cabem na arquitetura:

1. **O mestre é dele, no disco dele.** É a decisão que a §4.34 já tinha tomado
   por outro motivo ("guardar sempre o MP3 mestre"). Com o mestre em mãos, o
   provedor de entrega vira detalhe: perdê-lo custa uma tarde, não o acervo.
2. **Escrever contra o protocolo S3, não contra um fornecedor.** R2, Backblaze
   B2, Wasabi, Scaleway, Hetzner, MinIO na própria máquina — **todos falam o
   mesmo protocolo**. Trocar de provedor passa a ser mudar três variáveis no
   `.env`, e não reescrever nada.

**A Cloudflare continua sendo a recomendação — mas pelo motivo certo**, que é o
item 2 abaixo, e apenas enquanto for a mais barata.

### 2. Os números — e por que o R2 ganha (é a saída de dados, não o disco)

Audiolivro é o pior caso de **egress** (dados que saem do servidor para quem
ouve) que existe: muitas horas, ouvidas repetidas vezes. Nas contas abaixo, MP3
mono a **64 kbps** — qualidade de fala boa, e a régua da indústria — dá
**28,8 MB por hora**; um livro médio de 10h dá **~290 MB**.

| Acervo | Tamanho (MP3 64 kbps) |
|---|---|
| 1.000 livros | ~290 GB |
| 5.000 livros | ~1,4 TB |
| 10.000 livros | ~2,9 TB |

Guardar **também** o mestre não comprimido (WAV) multiplica por 11: 3,2 GB por
livro, **~3,2 TB a cada mil livros**.

Custo mensal, acervo de 10.000 livros e 10.000 ouvintes a 20h/mês cada:

| | Armazenar | Saída de dados | Total/mês |
|---|---|---|---|
| **Cloudflare R2** ($0,015/GB) | ~$43 | **$0** | **~$43** |
| **AWS S3** ($0,023/GB + $0,09/GB de saída) | ~$66 | ~$518 | ~$584 |

**~13× de diferença, e ela quase toda vem do egress.** É esse o argumento para o
R2 — não a imunidade. Backblaze B2 e Wasabi têm política de saída parecida e
servem de plano B **sem reescrita**, pelo item 2 da seção anterior.

### 3. O disco de 22 TB: a ideia está certa, o formato não

Ele quer comprar **um** disco de ~22 TB. Três correções:

- **Um disco não é cópia de segurança — é uma cópia.** Se ele guarda os mestres
  e morre, o acervo morre junto. HDD é peça de desgaste. **Dois discos de 12 TB
  espelhados custam praticamente o mesmo que um de 22 TB** (~US$ 180–220 cada
  contra ~US$ 350–450 o de 22 TB; no Brasil, bem mais, conferir na hora) e
  sobrevivem à morte de um.
- **Nuvem e disco não são alternativas — são as duas pontas da mesma regra.** Um
  disco na mesa dele está no **mesmo lugar físico** que o Mac: incêndio, roubo ou
  raio levam os dois. A cópia fora de casa mais barata que existe hoje é
  justamente a nuvem. Ele precisa das duas coisas que propôs, não de uma delas.
- **22 TB só se justifica se o mestre for guardado sem compressão.** Se o mestre
  é MP3, como a §4.34 registrou, 22 TB comportam **~76 mil livros** — número que
  o AllBook não alcança tão cedo. Nesse caso **4 a 8 TB cobrem a década**, e a
  diferença de dinheiro vale mais como o segundo disco do espelho.

Bônus: o disco resolve de graça uma dívida já anotada na §4.126 — as cópias do
Postgres estão **no mesmo disco** que o banco.

### 4. O que isso muda no plano: nada bloqueia

**Nenhuma dessas decisões precisa ser tomada para o áudio começar.** O caminho
que não depende de compra nem de contrato:

1. A ingestão com `ffmpeg` (vinheta → fatiar → **recalcular capítulos depois da
   vinheta**, a armadilha da 2.5) rodando contra uma **pasta local**.
2. Uma camada de armazenamento com duas implementações — pasta local e
   S3-compatível — atrás da mesma interface.
3. Só quando o primeiro livro estiver tocando de verdade é que se escolhe o
   provedor. E aí a escolha é uma linha, que é exatamente o ponto da seção 1.

**O pré-requisito continua sendo o mesmo da §4.127:** o app lendo o catálogo do
**banco**, não de `lib/books.ts`.

---

## 4.129 A ingestão do áudio existe — e a quebra silenciosa foi provada (08/08)

Armadilha **2.5** resolvida na metade que não depende de decisão nenhuma. O
Matheus deu sinal verde com dois discos externos em mãos, e o caminho da §4.128
era justamente este: construir contra uma **pasta local**, de graça, e escolher
provedor só quando houver livro tocando.

`npm run audio <id> <arquivo|pasta>` — guarda o mestre, cola a vinheta, fatia em
HLS (AAC 64k mono, segmentos de 6s) e grava duração e capítulos **medidos**.
Também `refazer <id>`, `remover <id>`, e sem argumento a situação do acervo.

### A decisão que dá a portabilidade: `server/armazenamento.ts`

Uma interface de seis operações, com **uma** implementação hoje (pasta local).
Nada no projeto fala com fornecedor — nem com o disco. Trocar por R2, Backblaze
ou Wasabi é acrescentar uma classe e mexer no `.env`. Foi escrito assim por causa
do medo que ele levantou na §4.128, e é a resposta de engenharia para ele:
**portabilidade em vez de fortaleza**.

### A quebra silenciosa, reproduzida de propósito

O `BANCO-DE-DADOS.md` avisava que a vinheta desloca todo o livro e que isso não
dá erro nenhum. Testei fazendo acontecer:

| | antes da vinheta | depois de uma vinheta de 8s |
|---|---|---|
| Capítulo 1 | começa em 0s | **8s** |
| Capítulo 2 | 20s | **28s** |
| Capítulo 3 | 55s | **63s** |
| Alguém que parou em | 42s | **50s** ← corrigido sozinho |

Sem a última linha, essa pessoa retomaria 8 segundos antes do lugar **para
sempre**, e nada em tela nenhuma acusaria. O ajuste roda na mesma transação que
grava os capítulos.

⚠️ **Só vale para reprocessamento.** Na *primeira* ingestão a posição salva veio
da duração **estimada** (a conta por páginas), e não existe equivalência de onde
tirar — o script conta quantas pessoas estão nessa situação e **não converte**.
Chutar seria pior que deixar.

### Três decisões técnicas que valem registro

**1. Filtro `concat`, não o demuxer.** O demuxer emenda os arquivos já
codificados e arrasta junto o silêncio de padding que todo MP3 tem nas pontas;
em 30 faixas isso vira quase um segundo de deriva — e é dessa soma que saem os
marcadores de capítulo. O filtro decodifica antes de emendar. Além disso, o
script **mede a duração final** e a compara com a soma esperada, avisando se
divergir mais de 1s: a conferência que impede o erro de passar em silêncio.

**2. AAC 64k mono, e não MP3.** O mestre continua sendo o MP3 do estúdio; a cópia
de trabalho é AAC porque o formato de entrega é HLS e AAC é o que todo player
toca, inclusive o Safari — obrigatório no iPhone. 64 kbps mono é a régua da
indústria para fala: um livro de 10h dá ~290 MB.

**3. Capítulos, em ordem de preferência:** embutidos no arquivo (um `.m4b` de
audiolivro traz título e tempo prontos, e é a fonte mais confiável porque veio de
quem produziu) → um arquivo por capítulo numa pasta → um bloco só, com aviso.
⚠️ A ordem dos arquivos usa `numeric: true`: a ordem alfabética crua põe o
capítulo **10 antes do 2**, e o livro sairia embaralhado sem erro nenhum.
*(Testado com arquivos chamados `1`, `2` e `10`.)*

### Três defeitos achados testando — dois deles graves

1. **`AUDIO_RAIZ=` vazio virava caminho relativo** e a primeira ingestão gravou
   os mestres **dentro do repositório**, que é literalmente o que o comentário
   acima dela mandava evitar. `??` não pega string vazia. Agora a raiz é
   conferida (tem de ser absoluta) e `/mestres/` e `/entrega/` estão no
   `.gitignore` como cinto de segurança.
2. **`script/` nunca esteve no `tsconfig.json`** — ou seja, `npm run check`
   **jamais** conferiu `estudio.ts`, `ingestao-catalogo.ts` nem
   `importar-catalogo.ts`, todos escritos hoje. Incluída a pasta; apareceu um
   erro real de iteração, resolvido acrescentando `"target": "ES2022"` (o
   projeto não tinha `target`, e o padrão do TypeScript é ES5).
3. `progresso` tem chave composta e **não tem coluna `id`** — o `returning` que
   eu havia escrito quebraria em execução, e só não quebrou antes porque o item 2
   escondia o erro.

### O que falta, nomeado

- **Servir o áudio**: URL assinada por sessão com expiração de minutos, e limite
  de taxa por conta (a defesa barata contra raspagem, §4.34). Hoje **nada serve
  os segmentos**, então nada está exposto.
- **O player tocar HLS** e o app ler capítulos e duração do **banco** — e isso
  esbarra no mesmo pré-requisito de sempre: o catálogo vem do código.
- **A vinheta não existe** (§4.35, é trabalho de marca). O mecanismo está pronto:
  ponha os arquivos em `<AUDIO_RAIZ>/vinhetas/` e rode `refazer`.

---

## 4.130 A entrega do áudio: as três defesas, e o furo na frase "URL assinada" (08/08)

A outra metade da armadilha **2.5**. Duas rotas — `GET /api/audio/:id/lista.m3u8`
e `GET /api/audio/:id/s00042.ts` — e nenhum byte de narração sai sem conta.

### O furo que apareceu ao construir

A §4.34 pedia **"URL assinada por sessão, com expiração de minutos"**. Ao
escrever, a frase não fecha: **um audiolivro dura dez horas**. Numa lista VOD o
player baixa os endereços **uma vez** e usa a escuta inteira — endereço que
expira em minutos morre no meio do capítulo 3, e endereço que dura dez horas não
protege nada. A frase misturava dois mundos: assinatura serve para quando o
**provedor** entrega direto ao navegador, não para uma lista que o player guarda.

**A saída é pôr o servidor no meio.** Os endereços dentro da lista apontam para a
nossa rota, e a permissão é conferida **a cada pedaço**, na hora. Não existe
endereço que envelheça porque não existe endereço permanente. Quando o
armazenamento souber assinar (R2), `urlTemporaria()` devolve uma URL de 60s
gerada **naquele instante** e a rota redireciona — o áudio passa a ir do provedor
direto ao ouvinte, sem atravessar o servidor, e **nenhuma linha da rota muda**.

### As três defesas, e por que os números são esses

| Defesa | Onde | Número | A conta |
|---|---|---|---|
| Sessão obrigatória | rota | — | sem conta, nem lista nem pedaço |
| Rajada | memória | **600 pedaços/min** | = 1h de áudio por minuto. Ouvir a 2x consome 20; baixar um livro de 10h leva 10 min; raspar 10 mil livros levaria 70 dias |
| Livros distintos/dia | **banco** | **20 livros** | ninguém ouve 20 num dia; o acervo de 10 mil exigiria 500 dias de conta paga |

A terceira está no banco de propósito: em memória, quem raspa só precisaria
esperar o próximo reinício do servidor. A primeira está em memória de propósito:
seriam 6.000 escritas por livro ouvido, e quem burla reiniciando esbarra na
terceira. *(Testado: 610 pedidos → exatamente 600 passaram, 10 recusados.)*

### Dois defeitos que o teste pegou — e o primeiro era sério

**1. O limite punia quem estava ouvindo.** A primeira versão contava todas as
linhas do dia e barrava a partir do teto — **inclusive quando o livro pedido já
estava na lista**. Efeito: quem chegasse a 20 livros ficava sem conseguir
**voltar ao livro que estava ouvindo**; bastava recarregar a página para o player
perder o lugar no meio do capítulo. Um limite contra raspagem que castiga o
ouvinte está errado. Agora **reabrir livro já aberto nunca é barrado**, só livro
novo — e o livro recusado **não consome cota**, senão uma tentativa que não tocou
nada custaria o dia inteiro.

**2. `/api` sem rota devolvia a página do app com HTTP 200.** Apareceu testando
travessia de caminho: `/api/audio/1/....//mestres/…` respondeu **200**, e por um
instante pareceu vazamento do arquivo-mestre. Era HTML — o Vite (e o
`serveStatic`, em produção) mandam tudo que não reconhecem para o `index.html`,
que é o certo para rota de tela e errado para `/api`. Não era falha de segurança,
mas é armadilha de diagnóstico cara: um `fetch` para rota inexistente recebe 200
e quebra ao ler o JSON, longe da causa. Agora há um 404 honesto no fim das rotas.

### Decisões pequenas que valem registro

- **Livro sem narração devolve 404 com `podePedir: true`, não 403.** "Não existe"
  é diferente de "está barrado", e a tela precisa saber para oferecer o **pedido
  sob demanda** em vez de dizer "sem permissão" — é o coração do produto.
- **Só `s00042.ts` passa** pela rota do pedaço (regex fechada). Sem isso,
  `../../mestres/7/livro.mp3` entregaria justamente o arquivo que nunca pode ser
  servido. A camada de armazenamento também barra `..`; defesa de um nível só é
  defesa que um dia falha.
- **Banco diz que tem áudio e o disco diz que não** → erro que **nomeia o
  conserto** (`npm run audio refazer <id>`) em vez de um 500 mudo.

### O que falta

- **O player tocar HLS.** Nenhuma tela pede estas rotas ainda; falta o `hls.js`
  no player e o app ler duração e capítulos do **banco** — o que esbarra no mesmo
  pré-requisito de sempre: o catálogo vem do código (§4.127).
- **Limitar tentativas de login** (seção 2.3) continua aberto — é o mesmo
  mecanismo de rajada, agora que ele existe.
- **Marca d'água por conta** (§4.34) segue opcional e para depois.

---

## 4.131 A moldura de prévia virou um iframe — ela mentia sobre o celular (09/08)

**O pedido dele foi "está reduzido, põe em tamanho normal".** Estava mesmo: a
moldura encolhia o telefone para caber na altura da janela (medido: **95,7%**).
Mas ao medir apareceu um defeito maior, e é ele que justifica a troca.

**O que a moldura era, e por que isso a tornava inútil.** Uma `<div>` de 430px
com o app dentro. Uma div não é uma tela: as regras responsivas do Tailwind
(`sm:`, `md:`, `lg:`) olham a **largura da janela do navegador**, não a da caixa
em volta. Medido no Chrome dele, janela de 1728px: `sm`, `md` e `lg` **todas
ligadas**. Ou seja, o que aparecia dentro do desenho de telefone era o layout de
**computador** espremido num retângulo estreito — nunca foi o celular. Isto já
estava escrito no CLAUDE.md como armadilha a conviver; a decisão de hoje é que
uma ferramenta de conferência que mostra a tela errada não é para conviver, é
para consertar.

**A escolha: `<iframe>`.** Dentro dele a viewport é o próprio iframe, então as
media queries enxergam 430×932 de verdade. Vieram junto, de graça, três coisas
que estavam quebradas na prévia e obrigavam a testar "no app real":

- `position: fixed` ancora na **tela do telefone** (menu de baixo medido em
  779–844, colado no rodapé) e não na moldura;
- `window.scrollY` / `scrollTo` voltam a funcionar — antes quem rolava era a
  moldura, e havia vários desses espalhados pelas telas, inertes;
- trocar de aparelho na barra **re-renderiza o layout sem recarregar o app**
  (provado marcando o documento de dentro e vendo a marca sobreviver).

**O que foi rejeitado.** *Container queries* — resolveriam a largura sem iframe,
mas exigiriam reescrever todo o responsivo do projeto e ainda deixariam o
`fixed` e o `scrollY` mentindo. *Manter o encolhimento como padrão* — é o que os
DevTools fazem, e é justamente o que ele reclamou.

**A decisão de tamanho: 100% é o padrão, e a redução é botão.** Quando o
aparelho não cabe na janela, a área rola e aparece o botão "Caber na janela" —
nunca mais encolhe sozinho e sem avisar. A barra sempre mostra a escala em
número (`430x932 · 100%`), verde em tamanho real e âmbar quando reduzido: o
estado da ferramenta tem de estar visível, senão volta a mentir em silêncio.
**E com o iframe a redução deixou de falsificar o layout** — o `transform`
escala a imagem, mas a viewport de dentro continua sendo a do aparelho.

**Duas contas que viraram código.** A barra e a folga foram para 32 + 8×2
porque na janela dele (902px) isso deixa 854px, e é o que faz o **iPhone 16
(844) caber inteiro em tamanho real** — com 36 + 12×2 faltavam 2px. E a borda da
moldura virou `inset`: uma `border` somava 4px à caixa e derrubava de 100% o
aparelho que cabia raspando. *(O iPhone 16 Pro Max, 932px, não cabe inteiro numa
janela de MacBook com abas e favoritos — é física, não bug; para ele, o botão.)*

**A armadilha que o iframe criou, e a guarda.** A mesma URL passa a carregar
**duas vezes** (a moldura e o app). `lib/auth.ts` age ao ser carregado —
`ligarSincronizacao()` e `sincronizarSessao()` — e sem guarda cada abertura
sincronizaria a conta **em dois frames ao mesmo tempo**, contra o mesmo
`localStorage`: exatamente a corrida que duplica item. Daí `lib/dev-moldura.ts`
com o `EH_A_MOLDURA`, que vive em `lib/` (e não no componente) para o `auth` não
depender de um `.tsx` de desenvolvimento. **Módulo novo que aja ao ser carregado
precisa dessa guarda.**

**Ainda no mesmo dia, uma correção que só apareceu ao mostrar para alguém.** Ele
pediu um link para uma pessoa distante ver o app (túnel do `cloudflared` sobre o
servidor de desenvolvimento). Quem abria o link recebia **a moldura**: barra de
aparelhos e o app preso num desenho de telefone **dentro do próprio telefone**.
Por isso o `EH_A_MOLDURA` passou a exigir **acesso local** (`localhost`): de
fora, o app aparece inteiro na tela, como um app. A moldura é instrumento de
quem constrói, e o túnel mostrou que ela vazava para quem só quer ver.

**Sobrou uma perda, resolvida na barra:** a barra de endereço do Chrome mostra o
endereço da moldura e não muda mais com a navegação. Por isso a barra da prévia
passou a mostrar o caminho da tela aberta lá dentro (`/library`) — lido por
espiada periódica, porque o wouter navega por `pushState` e isso não emite
evento para quem está de fora.

---

## 4.132 A faxina de código morto — e a decisão da §4.88 revista (10/08)

Pedido dele, em uma frase: *"se tem código morto no projeto para matar e
otimizar, elimine tudo: coisas inúteis, código morto, e tudo isso."*

**Como se mediu, e por que não foi de olho.** Três varreduras escritas para esta
faxina (no scratchpad da sessão, não no repositório): o **grafo de importações**
a partir das raízes de verdade (`main.tsx`, `server/index.ts`, `vite.config.ts`,
os scripts do `npm`), que acha o arquivo que ninguém alcança; o **fecho de
alcance dentro de cada arquivo**, que acha a função morta que só outra função
morta chamava; e o `tsc` com `--noUnusedLocals --noUnusedParameters`, que acha o
import e o parâmetro sobrando. Rodadas **em ondas, até secar**: apagar um
arquivo mata a lib que só ele usava, que mata a função que só ela chamava. A
`vitrineDeConversas` (61 linhas) só apareceu na segunda onda.

**O saldo:** 47 arquivos, ~5.900 linhas e 31 dependências fora; as três medidas
agora dão zero. E 7 MB de imagem, que era o maior peso do app e não era código.

### As três coisas que valem mais que o número

1. **A aposta da §4.88 foi testada e perdeu.** Aquela faxina manteve o
   `apiRequest`/`queryClient` por serem *"infraestrutura documentada no CLAUDE.md
   para a hora do backend"*. O backend chegou em 08/08 (§4.119–§4.122) e **não
   usou nada disso**: o `lib/auth.ts` escreveu o seu próprio `chamar()`, e o
   `@tanstack/react-query` ficou no app com **zero `useQuery` e zero
   `useMutation`** — só o `Provider` envolvendo tudo. Guardar peça para um futuro
   que ainda não existe não paga: quando o futuro chega, ele traz o seu próprio
   jeito. Saiu o `Provider`, o `lib/queryClient.ts` e a dependência.
2. **Documentação duplicada é pior que código morto.** O `server/dados.ts` tinha
   a constante `CHAVES_SINCRONIZADAS` com as 14 chaves — **sem nenhum leitor**,
   ao lado dos 14 `case` do `switch` que fazem o trabalho de verdade, e da lista
   `CHAVES` do `lib/sincronizacao.ts`. Uma terceira cópia que ninguém executa não
   avisa quando diverge: ela só passa a mentir. Saiu; o porquê do
   `allbook_downloads` não subir continua no CLAUDE.md e neste arquivo.
3. **Um argumento que a função ignorava.** Em `lib/sincronizacao.ts`, o `porId`
   recebia a lista como primeiro parâmetro e **usava a variável do escopo de
   fora** — as seis chamadas passavam `local` para o nada. Não quebrava (era o
   mesmo valor), mas quem lesse acreditaria que aquele argumento mandava em
   alguma coisa. O parâmetro saiu.

### A decisão que eu mudei: os componentes do shadcn saem

A §4.88 deixou `components/ui/*` de fora do corte com dois argumentos: *"o Vite
já exclui do app final o que não é usado"* e *"apagar obrigaria a recriar peça a
peça"*. **Hoje eles saíram — 43 dos 55, ficaram os 12 que alguma tela usa.** Os
dois argumentos continuam verdadeiros e mesmo assim não bastam:

- O tree-shaking cobre o **bundle**, e o custo não estava no bundle: estava no
  `package.json`. Aqueles 43 arquivos seguravam **30 dependências** — `cmdk`,
  `react-day-picker`, `embla-carousel`, `input-otp`, `react-hook-form`, 22
  pacotes do Radix — que o `npm install` baixa, que aparecem em auditoria de
  segurança e que alguém atualiza. O projeto foi de **57 dependências para 27**.
- "Recriar peça a peça" virou um comando: `git show 16e72e5:client/src/components/ui/dialog.tsx`.
- E existe hoje um custo que a §4.88 não tinha: as regras de cor da §4.112 e da
  §4.116. Componente do shadcn vem com cor literal; "reutilizar" um deles é a
  porta de entrada do **defeito que mais se repete no projeto**. Quem trouxer um
  de volta tem de passar as cores para os tokens antes.

**O que NÃO saiu, de propósito:** as tabelas de `shared/schema/` que ainda não
têm código chamando (elas são o desenho do banco — o `drizzle-kit push` as cria,
e as tabelas existem no Postgres); os tipos exportados que só o próprio arquivo
usa (tirar a palavra `export` é ruído sem ganho); e as folhas
`client/public/_*.html`, que não são código do app.

### A trava, para não precisar de uma §4.133

`noUnusedLocals` e `noUnusedParameters` entraram no `tsconfig.json`. O
`npm run check` passa a **reprovar** import que ninguém usa, variável que
ninguém lê e parâmetro que a função ignora — as 21 sobras desta faxina teriam
sido pegas no dia em que nasceram. Parâmetro que precisa existir mas não é usado
leva `_` na frente. *(O que essa trava **não** pega é o arquivo inteiro que
ninguém importa e a função exportada sem consumidor — para esses, o jeito é
rodar o grafo de novo de tempos em tempos.)*

### A otimização que não era código: 7 MB de imagem

As 8 capas genéricas de reserva (uma por gênero) eram **PNG de 896×1280 somando
9 MB** — a de mistério sozinha tinha 1,6 MB. Para comparação: as **58 capas de
verdade**, em JPEG, somam 2,7 MB, ~47 KB cada. Cada capa de reserva pesava vinte
vezes mais que uma capa real, e todas entravam no que o navegador baixa.
Convertidas para JPEG na mesma resolução: **9 MB → 1,9 MB**, sem diferença
visível. As capas das comunidades também encolheram (1,4 MB → 760 KB), com uma
lição no meio: **recomprimir imagem já comprimida a engorda** — duas das cinco
ficaram maiores e foram devolvidas ao original. A pasta de imagens foi de ~14 MB
para 6,3 MB. **Imagem nova de reserva entra em JPEG, não em PNG.**

**O que ficou em aberto:** o `dist/public/index.js` tem 1,83 MB (528 KB
comprimido) num pedaço só, e o Vite avisa a cada build. Dividir por rota
(`import()` dinâmico) é a saída conhecida, mas mexe em como o app carrega e não
é faxina — fica registrado, não feito.

**Duas notas finais desta faxina.** O `npm audit fix` (conservador, sem
`--force`) fechou a única falha **alta** — `nanoid` — e mais uma; sobraram 4
moderadas, todas do mesmo `esbuild` antigo que o `drizzle-kit` carrega por baixo
(`@esbuild-kit/core-utils`). O `--force` resolveria fazendo **downgrade do
drizzle-kit**, que é a mesma troca que a §4.7 já recusou em 24/07 — continua
recusada, e é falha de ferramenta de desenvolvimento, não de código que roda no
navegador de ninguém. E há **sete nomes de função exportados em mais de um
arquivo** (`votar`, `souDono`, `meuVoto`, `desbanir`…): apurado e **deixado como
está**, porque são domínios diferentes (votar numa rodada de clube, numa pauta,
num fórum) e unificá-los é reorganizar arquitetura, não varrer lixo.

## 4.133 Séries: o livro deixa de ser solto (12/08)

**Ideia do Matheus, no meio do planejamento do acervo:** hoje um livro de série
entra no catálogo como se fosse avulso, e quem está no *Duna* não tem como saber
que existe *Messias de Duna* nem chegar nele. A referência que ele deu é o modo
como as lojas e os serviços de vídeo tratam temporadas: *"você alterna entre o
livro um, livro dois, livro três"*, dentro da própria ficha.

**Ele pediu explicitamente que outra janela construa isto** — esta entrada existe
para a tarefa nascer completa, sem precisar perguntar nada a ninguém.

### Por que é barato, e é o motivo de fazer agora

**Os dados já vêm prontos, de duas fontes independentes.** Apurado em 12/08:

- `audible library export -f json` entrega `series_title` e `series_sequence` por
  título, junto com `asin`, `narrators`, `genres` e `date_added`;
- a API pública de catálogo (`/1.0/catalog/products/<ASIN>`, **sem login**) aceita
  `series` em `response_groups` e devolve o mesmo.

Nada precisa ser classificado, inferido nem digitado à mão. Quando a ingestão do
acervo entrar (o contrato está em `~/Projects/baixalivro/docs/PLANO-ACERVO.md`),
a série chega junto de graça — e é por isso que a tabela deve existir **antes**, ou
o dado chega e não tem onde pousar.

### ⚠️ Série NÃO é coleção — e confundir as duas estraga as duas

Existe a tentação de reaproveitar `colecoes` + `colecoes_livros`
(`shared/schema/catalogo.ts:254`), que já é N-para-N com `ordem`. **Não use.**

- **Coleção é curadoria**: "Só na AllBook", "Para Maratonar". Alguém escolheu, e a
  ordem é editorial. Muda quando a curadoria muda.
- **Série é fato da obra**: *Duna* é o livro 1, e será o livro 1 para sempre. Não é
  opinião de ninguém.

Misturadas, uma lista feita à mão passaria a parecer parte da história do autor —
e a ordem de leitura ficaria à mercê de quem editar a curadoria.

### O que construir

**No banco** (`shared/schema/catalogo.ts`):

```
series          slug (PK) · titulo · titulo_original · descricao
livros          + serie_slug (FK → series, nullable) · serie_n (integer, nullable)
```

`nullable` nos dois porque **a maioria dos livros não é de série**, e essa é a
diferença que separa este desenho de `generoSlug` (que é `NOT NULL` e obrigou todo
livro a ter um gênero). Índice em `(serie_slug, serie_n)`.

⚠️ **`serie_n` não é sempre inteiro.** Existem `1.5` (novela entre dois livros) e
"livro 0" (prequela). Guardar como `real`, ou aceitar que a numeração da loja vem
como texto. Decidir na hora de ver o dado real — mas **não** assumir sequência
perfeita 1, 2, 3, porque não é.

**Na tela** (`client/src/pages/BookDetails.tsx`):

O seletor de série vive **ao lado do `SeletorDeNarracao`**, e são dois eixos
independentes que não se misturam:

- **qual livro da série** ← navegação entre obras
- **qual voz** ← `SeletorDeNarracao.tsx`, que já existe

Só aparece quando `serie_slug` não é nulo. Mostrar a posição ("Livro 2 de 6") e
permitir ir ao anterior e ao próximo sem voltar à busca.

⚠️ **Livro da série que ainda não está no acervo precisa aparecer assim mesmo**,
marcado como indisponível — senão a lista mente sobre o tamanho da série, e o
usuário conclui que ela tem 3 volumes quando tem 6. Esse é o caso em que o AllBook
pode oferecer produzir a narração, que é o coração do produto.

**Página da série** (`/series/:slug`): a lista em ordem, com o que existe e o que
falta. É a tela que a fileira da Início vai apontar.

### Onde isso encosta no plano do acervo

`edicoes.serie` e `edicoes.serie_n` já estão no esquema do `catalogo.sqlite` do
`baixalivro` (seção 2.1 do `PLANO-ACERVO.md`). A ingestão vai entregar os dois
campos por narração — quem construir aqui não precisa esperar por lá, mas deve usar
**os mesmos nomes** para a ponte não precisar de tradução.

---

## 4.134 O catálogo sai do código e vai para o banco — a ponte do acervo (21/08)

**Pedido dele, na abertura da tarefa:** *"delete todos os livros que tem hoje no
aplicativo e já deixe preparado para a migração do baixalivro"*. Os 63 livros de
hoje são maquete; os de verdade vêm do acervo.

### A ordem é o assunto todo — e não é a que parece

A pergunta que ele fez no meio (*"o melhor seria subir os livros reais e, depois,
apagar as maquetes?"*) tem uma resposta que nenhuma das duas metades acerta:
**as duas coisas estavam travadas pela mesma peça.** O catálogo morava em
`client/src/lib/books.ts`, um array literal que **62 arquivos** importavam.
Enquanto fosse assim, livro real não tinha por onde entrar (o banco não era lido
por ninguém) e maquete não tinha como sair (o app quebrava). A ponte vem
primeiro, obrigatoriamente — e é o que a janela B já havia escrito no quadro:
*"todo o catálogo de hoje é maquete e vai ser apagado, mas só **depois** de o app
passar a ler o catálogo do banco, nunca antes"*.

**Decidido apagar antes de subir os reais**, e o motivo é de teste, não de gosto:
misturados, não há como olhar o catálogo e saber qual livro é de verdade — as
notas, os narradores e parte das capas das maquetes são inventados. E é só com o
app vazio que aparecem as telas que nunca foram vistas sem livro nenhum, defeito
que hoje está escondido pelas 63 maquetes.

### O que foi construído

- **`server/catalogo.ts`** — `GET /api/catalogo` devolve gêneros e livros no
  **mesmo desenho da interface `Book`**, com os joins que trocam slug por nome
  (autor, narrador, gênero). **Sem sessão de propósito:** a vitrine é pública; o
  que exige conta é ouvir.
- **`/capas/<arquivo>`** — `express.static` sobre `CAPAS_RAIZ` (padrão
  `~/AllBook-capas`), **fora do repositório**, pela mesma razão do áudio-mestre:
  as 58 capas de hoje cabem no git, milhares não cabem.
- **`lib/books.ts` virou fachada.** Mesmos exports, mesma `interface Book`,
  mesmas funções — **nenhuma das 62 telas mudou uma linha**.

### As três armadilhas que isso tem, e a terceira quase passou

1. **`catalog` não pode trocar de referência.** Ele nasce `[]` e é preenchido com
   `push`. Um `catalog = novoArray` deixaria todos os importadores segurando o
   array velho, vazio, **sem erro nenhum**.
2. **O tipo `Genre` deixou de ser um union fechado de 8 nomes e virou `string`.**
   Os 8 continuam sendo as linhas de `generos`, mas enumerá-los no tipo faria o
   TypeScript recusar um gênero novo vindo do banco — erro numa linha sem defeito.
3. 🚨 **Esperar o catálogo antes do render NÃO basta — o `import` estático é
   avaliado antes.** Foi o defeito que apareceu no teste: o app abriu, as
   fileiras de baixo vieram certas e **o billboard do topo ficou um retângulo
   preto**, sem uma linha no console. A causa é que `Home.tsx` calcula
   `const heroBooks = destaquesDaCapa()` e `const continueListening =
   getBooksByIds([1, 7, 4])` **no nível do módulo**, e um `import App from
   "./App"` roda tudo isso antes da primeira linha do `main.tsx`. O conserto é
   uma linha e vale para toda tela de uma vez: o `App` entra por **`import()`
   dinâmico**, depois do `await carregarCatalogo()`.

### O limite conhecido, dito aqui para ninguém descobrir na marra

A rota devolve o **catálogo inteiro numa resposta só**, e isso tem prazo de
validade. Hoje são dezenas de livros e alguns KB. O acervo real tem **13.932
narrações já baixadas** (Ubook 4.953 · Storytel 4.422 · Tocalivros 3.268 ·
Audible 1.289), e nesse tamanho vira alguns MB em toda abertura. Quando o
catálogo passar de uns poucos milhares, a rota precisa de paginação — e aí a
busca e a grade de gênero, que hoje varrem `catalog` inteiro no navegador,
passam a perguntar ao servidor.

### Achado no caminho, e não era meu

`client/src/lib/bookmarks.ts` estava **apagado no diretório de trabalho, sem
commit**, e 6 arquivos ainda o importavam: o projeto não compilava. Restaurado
com `git restore`. Não havia nada substituindo-o — não era refatoração em curso.

### 4.134.1 O acervo entrou — e a nota voltou para quem a dá (21/08, à noite)

**A correção mais importante do dia veio dele, no meio do trabalho:** *"nota de
avaliação quem dá é o usuário, não vem do livro… isso que você fez é grave"*.

Ele estava certo, e eu tinha parado no meio do caminho. Ao ver que **nenhuma das
quatro lojas do acervo entrega avaliação** (conferido campo a campo no `cru` de
Audible, Storytel, Ubook e Tocalivros), eu tornei a coluna `nota` opcional para
não inventar número. Mas deixei a coluna lá — e enquanto ela existir, alguém
pode escrever nela uma nota que ninguém deu, que é exatamente o que as maquetes
faziam.

**Decidido: as três colunas de nota saíram de `livros`.** `nota`,
`nota_historia` e `nota_narracao` deixaram de existir. A nota agora é **calculada
de `avaliacoes`** na hora de ler o catálogo (`server/catalogo.ts`), a partir de
**5 avaliações** — a mesma régua que `lib/ratings.ts` já usava no navegador, e
pela mesma razão: com uma ou duas notas, "média" é a opinião de uma pessoa
vestida de consenso.

Consequência no front, e ela espalhou por 20 arquivos: `Book.rating` virou
opcional. Onde havia estrela, ela some quando não há nota; nas grades de três
colunas entra um travessão, porque sumir desalinharia a grade. Dois ajudantes
novos evitam que isso vire `?? 0` espalhado: `porNota` (livro sem nota vai para
o **fim**, não é tratado como zero) e `mediaDeNotas` (livro sem nota não entra
na conta nem como zero).

### A trava da vinheta, e a exceção da Audible

Enquanto eu importava, a janela das vinhetas avisou que estava colando a vinheta
do AllBook nos arquivos do acervo — **o que muda a duração do livro no disco**.
A regra que ela deu: só ingerir livro cujo `_ficha.json` já tenha o campo
`vinheta`, escrito depois de as duas pontas terem sido trocadas com sucesso.
Está implementada em `script/importar-acervo.ts`.

⚠️ **A Audible é exceção, e a decisão é dele.** Ela ficou de fora da colagem
(conferido: 0 em 300 fichas têm o campo), e a primeira leitura da regra a
barraria para sempre. Ele decidiu: *"você pode subir a Audible agora, e depois as
vinhetas entram depois na Audible… porque a gente ainda tem que recuperar os
áudios da Audible"*. Então a ficha sobe agora; a vinheta e o áudio vêm depois.
**Quem for ingerir ÁUDIO da Audible antes da vinheta precisa saber que terá de
reingerir** — a ficha não, porque a duração que ela guarda é a anunciada pela
loja, não a medida.

### O que o primeiro lote real revelou

2.436 livros entraram (Audible inteira + o que a vinheta já liberou). O que só
apareceu com dado de verdade na tela:

- **A capa do app precisou de porteiro.** O billboard estampou um livro sem
  autor ("Autor desconhecido"), sem descrição e com o título cru da loja, em
  caixa baixa e sem acento. Agora só entra na capa quem tem **capa real, autor
  conhecido e alguma descrição** — o livro continua no catálogo, na busca e nas
  listas; só não é cartão de visita.
- **O selo "Mais bem avaliados" mentia** num catálogo em que ninguém avaliou
  nada. Sem nota nenhuma, ele vira "Novo no acervo" e a ordem passa a ser por
  ano.
- **A duração deixou de ser estimada.** O app calculava duração pelo número de
  páginas (≈1h a cada 33) porque não havia áudio. O acervo traz a duração
  anunciada, e `duracaoDoLivro()` a prefere; a estimativa virou reserva.
- **A Início ficou vazia com 2.436 livros dentro** — porque a curadoria de
  `collections.ts` tinha sido esvaziada. Daí as **fileiras que o acervo monta
  sozinho**, uma por gênero, ordenadas por tamanho: prateleira curada volta
  quando alguém curar, mas fileira de gênero não precisa de ninguém.
- **59% do acervo chega sem categoria** (8.221 de 13.932) e vai para "Sem
  gênero". É o tamanho do trabalho de classificação que a §4.133 e os 35 gêneros
  da janela B vão encontrar.

### Dívidas nomeadas, para não se perderem

- **Um autor e um narrador por livro.** O acervo entrega listas (`"A & B"`) e o
  importador fica com o primeiro. O lugar dos demais é a tabela `narracoes`, que
  a janela B vai ligar.
- **Título cru.** A Ubook entrega títulos sem acento e sem pontuação ("100
  vendedor motivacao em vendas…"). É qualidade da origem, e o conserto é lá.
- **A camada social semeada continua amarrada a ids de maquete** (`comments.ts`,
  `Notifications.tsx`, `chamadaPorLivro`). Ela aponta para o vazio e some
  sozinha — a trava dos ids a partir de 100.000 garante que nunca colida com
  livro real. Quando a camada social virar de verdade, esse material sai.

---

## 4.135 A camada de rede fecha na Cloudflare — e o protocolo de segurança da plataforma (22/08)

A decisão de provedor estava parada desde 16/08. Em 22/08 ele fechou —
**Cloudflare** — e o critério não é preço: é a **camada de rede**, que nenhum
concorrente entrega inteira.

### As cinco camadas, e quem tem cada uma

Elas moram na **entrega e no domínio**, não no balde:

| Camada | O que faz | Cloudflare | Bunny | Backblaze B2 |
|---|---|---|---|---|
| **Proxy reverso** | o DNS aponta para o provedor, não para o servidor; o IP de origem some da vista pública | ✅ | ✅ | ❌ |
| **Anycast** | o mesmo IP é anunciado por BGP de centenas de datacenters ao mesmo tempo | ✅ ~330 PoPs | ✅ 119 PoPs | ❌ 3 regiões |
| **IP compartilhado** | o endereço serve milhões de domínios; separa-se quem é quem só pelo `Host`/SNI | ✅ | ✅ | ❌ |
| **ECH** — Encrypted Client Hello, [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html) | cifra o **SNI**, que no TLS comum viaja em texto puro no primeiro pacote | ✅ **por padrão** em domínio *proxied*; primeira grande CDN a implantar em escala | ❓ não confirmado | ❌ |
| **Project Galileo** | proteção gratuita para jornalismo e sociedade civil | ✅ | ❌ | ❌ |

**O ECH é a peça decisiva.** Sem ele, mesmo sob HTTPS o nome do domínio pedido
trafega em claro no handshake. Com ele, quem observa a rede vê apenas tráfego
para `cloudflare-ech.com`, sem distinguir qual dos milhões de sites é o destino.

### O que isso amarra no storage

A CDN **grátis** da Cloudflare **proíbe nos termos (seção 2.8) usar Free e Pro
principalmente para servir áudio e vídeo** — 100% do tráfego do AllBook. Para
ter a camada de rede da Cloudflare servindo o acervo, o storage tem de ser
**R2**, produto pago onde servir mídia por domínio próprio é o uso previsto.

| Acervo alvo 5,2 TB | Guardar | Entrega | Total/mês |
|---|---|---|---|
| **Cloudflare R2** ← escolhido | US$ 78 | incluída | **US$ 78** |
| B2 + Bunny CDN | US$ 36 | ~US$ 29 | US$ 65 |
| B2 sozinho | US$ 36 | grátis (3×) | US$ 36 |

Hoje, com os 296 GB da Audible, são **US$ 4,44/mês**. E a decisão da §1.7b de
fatiar o HLS em **10 s ou mais** passa a valer dinheiro de verdade: US$ 93 de
escrita por subida completa em 30 s, US$ 287 em 10 s, US$ 482 nos 6 s do padrão
do `ffmpeg`.

---

## O protocolo de segurança do AllBook

Intenção declarada por ele em 22/08: implementar **todas** as camadas, no
máximo de segurança. O que segue é a lista completa, conferida contra o código
de hoje.

### 1. Domínio e borda (painel da Cloudflare)

| Item | Estado | Nota |
|---|---|---|
| Todos os registros em modo *proxied* | a fazer | é o que ativa proxy reverso, anycast e IP compartilhado |
| **ECH** ligado | a fazer | padrão em domínio *proxied*; conferir que ficou ativo |
| **DNSSEC** | a fazer | assina as respostas do DNS contra envenenamento de cache |
| **TLS mínimo 1.3** | a fazer | 1.2 só se quebrar cliente antigo |
| **Modo Full (strict)** + certificado **Origin CA** no servidor | a fazer | ⚠️ em modo *Flexible* o cadeado é falso: o trecho Cloudflare→origem viaja em claro |
| **HSTS** com `max-age` de 1 ano, `includeSubDomains` e **preload** | a fazer | trava o downgrade para HTTP |
| Always Use HTTPS + Automatic HTTPS Rewrites | a fazer | |
| **WAF** com regras gerenciadas + OWASP core | a fazer | |
| **Bot Fight Mode** | a fazer | |
| **Turnstile** no cadastro, login e recuperação de senha | a fazer | substitui captcha sem entregar dado a terceiro |
| **Rate limiting na borda** | a fazer | barra a rajada antes de custar CPU do Node |
| **Cloudflare Access** no painel administrativo | a fazer | rota de admin não fica exposta à internet aberta |
| **Token Authentication** + hotlink protection nos segmentos | a fazer | o link do áudio não funciona colado noutro site |
| Regras de cache: segmento `.ts` cacheável, `lista.m3u8` **não** | a fazer | a playlist é por sessão; cachear vaza acesso |
| **2FA** na conta Cloudflare e no registrador + *registrar lock* | a fazer | a conta é a chave de tudo; sem isso o resto é decoração |

### 2. Aplicação (Express)

| Item | Estado | Onde |
|---|---|---|
| ⚠️ **`app.set("trust proxy", 1)`** | **falta — e quebra em silêncio** | `server/index.ts`. Sem isso, atrás do proxy o Express vê o IP da Cloudflare no lugar do IP real (o rate limit passa a punir todo mundo junto) e o cookie `secure` pode não ser emitido. **É o primeiro item.** |
| ⚠️ **Cabeçalhos de segurança** (`helmet`) | **falta** | grep em `server/` não achou HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy` nem `frame-ancestors` |
| **CSP** restritiva com nonce | falta | fecha a porta do XSS, que é o que o `httpOnly` já assume existir |
| Cookie `httpOnly` + `sameSite: lax` + `secure` em produção | ✅ existe | `server/contas.ts:66-72` — está correto |
| Prefixo **`__Host-`** no nome do cookie | a fazer | amarra o cookie ao domínio exato e a HTTPS |
| **`session.regenerate()`** no login | a fazer | contra fixação de sessão |
| Senha em `scrypt` + `timingSafeEqual` | ✅ existe | `server/senha.ts` |
| **Rate limit fora da memória** (KV ou Redis) | falta | `server/audio.ts:85` já registra que a versão atual não sobrevive a mais de uma instância |
| CORS fechado ao próprio domínio | a conferir | |

### 3. O conteúdo (o áudio)

| Item | Estado | Onde |
|---|---|---|
| **HLS cifrado em AES-128**, chave no Postgres, entregue só com sessão válida | ✅ existe | `server/audio.ts`, §4.130 |
| Chave de storage **opaca** (`sha256(loja\|id)[:24]`) — a URL não entrega a origem | ✅ existe | `baixalivro/src/entrega.py`, §1.7c |
| Playlist reescrita: nenhuma URL de provedor chega ao navegador | ✅ existe | `server/audio.ts` |
| **URL assinada de 60 s** + rota passando a redirecionar em vez de fazer stream pelo Express | a fazer | está previsto em comentário; sem isso a banda é paga duas vezes e o Node vira o gargalo |
| **Chave de cifra por narração**, rotacionável | a fazer | uma chave comprometida não abre o acervo inteiro |
| Limite de 600 segmentos/min e 20 livros/dia por conta | ✅ existe | `server/audio.ts` |

### 4. O aplicativo próprio — a camada que só ele tem

Um app **não usa o resolver de DNS do sistema** se não quiser. Ele embute o
próprio cliente **DoH** (DNS sobre HTTPS, porta 443) ou conecta direto ao IP com
o nome no cabeçalho `Host`. É a única peça da pilha que não depende de o usuário
configurar nada no aparelho — no navegador, o equivalente exige que a pessoa
ligue "DNS seguro" (Chrome/Firefox) ou "DNS privado" (Android 9+, vale para o
aparelho inteiro).

Somam-se aí: **certificate pinning** contra o certificado da Cloudflare, e o
segredo de sessão guardado no Keychain/Keystore em vez de armazenamento comum.

### 5. Operacional

- `SESSION_SECRET` e credenciais do R2 fora do repositório, em variável de
  ambiente. O `.env` já está no `.gitignore`.
- Backup do Postgres cifrado e **fora do disco do banco** — dívida já nomeada na
  §4.126, que o disco externo resolve.
- Rotação de credencial do R2 documentada, e chave com escopo só do balde.

### A pendência que trava o começo

O checkout do R2 recusou o cartão da Wise e o cartão via PayPal em 15/08. O
caminho que já funcionou noutra compra dele é **Apple Pay com cartão PayPal**;
plano B é gift card comprado com Pix. Enquanto não passar, nada muda no código:
`server/armazenamento.ts` segue com a `PastaLocal`, e a `S3Compativel` é uma
classe e três variáveis de ambiente, como a §4.129 registrou.

### Feito no mesmo dia: a conta, o balde e as duas gavetas (22/08, mais tarde)

O pagamento passou. Conta criada, **R2 ativo**, balde `allbook-audio` (Standard,
ENAM, público desabilitado) e token com escopo só desse balde.

`server/armazenamento.ts` ganhou a `S3Compativel` — e, mais importante, **duas
gavetas separadas**, porque a implementação ingênua furava a regra 1 do §1.7 em
silêncio:

- `armazenamentoDeMestres` — **sempre o disco.** Mestre e vinheta, que é insumo
  de produção e nunca é servida. `AUDIO_RAIZ=/Volumes/hd 18tb/AllBook-audio`.
- `armazenamento` — a entrega, e só ela vai para a nuvem.

⚠️ **O furo era real e mudo:** `script/ingerir-audio.ts` usava o mesmo objeto
para as duas coisas (linha 297, "guardando o mestre"). No instante em que
`AUDIO_S3_ENDPOINT` entrasse no `.env`, todo mestre subiria junto — sem erro,
sem aviso, dobrando o acervo de 5,2 para 10,4 TB. São ~R$ 400/mês, e a regra do
plano diz exatamente o contrário. `npm run r2:testar` agora **falha de saída**
se a gaveta dos mestres apontar para qualquer coisa que não seja o disco.

`npm run r2:testar` prova o caminho inteiro contra o balde de verdade: PUT,
HEAD, tamanho, GET com comparação de conteúdo, listagem, **URL assinada buscada
sem credencial** (o caminho do player) e apagar no fim. Sete verdes.

E `server/audio.ts:304` não precisou de uma linha: o `urlTemporaria()` que a
§4.128 deixou escrito "para o dia da troca" passou a devolver URL, e a rota
já redireciona sozinha.
