# AllBook — Guia do Projeto (CLAUDE.md)

AllBook é um **aplicativo de audiolivros em português (PT-BR)**, com a cara do
Audible/Storytel (catálogo + player) e do Netflix (descoberta). A ideia central
não é o catálogo: é **narrar sob demanda o livro que ainda não existe em áudio**.

O dono do projeto (Matheus) tem **pouca experiência em programação**. Responder
sempre em português e em linguagem simples; ao usar um termo técnico, explicar em
uma frase o que ele significa. Os textos da interface também são todos em PT-BR.

---

## Como rodar

O comando do dia a dia é `npm run dev` (http://localhost:3000) — **mas não o rode
solto dentro da sessão do Claude** (ver logo abaixo). Os outros: `npm run check`
(erros de tipo), `npm run build`, `npm run audio`. O resto está no `package.json`.

### O servidor é um serviço do sistema (launchd), fora da sessão do Claude

`npm run dev` disparado pelo Claude nasce **no mesmo grupo de processos da sessão**
(apurado em 24/07 com `ps -o pid,ppid,pgid`). Quando o Matheus fecha a janela do
Claude ou a tampa do MacBook, o sistema mata o grupo inteiro e o servidor vai junto
— não é bug do projeto, é só quem é o dono do processo. Por isso o servidor virou
um **LaunchAgent** (`com.allbook.devserver`): sobe ao ligar o Mac e se reergue
sozinho se cair.

- `zsh scripts/servidor-servico.sh status | iniciar | reiniciar | logs`
  (`instalar` só na primeira vez). Rodar isso **de dentro da sessão do Claude é
  seguro**: o launchd registra o job no domínio do usuário, não no grupo da sessão.
- Mexeu em `server/`, rode `reiniciar`. Mudança no frontend o Vite recarrega sozinho.
- `scripts/servidor.sh` é a alternativa manual, num Terminal. **Não use os dois ao
  mesmo tempo** — brigam pela porta 3000.

---

## Armadilhas apuradas (não descobrir de novo)

### A moldura de celular da prévia é um `<iframe>` — e agora simula o celular
Desde 09/08 (§4.131) a moldura de prévia (`DevMobileWrapper`) é um iframe de
verdade, e não mais uma `<div>` de largura fixa. **Isso inverteu a armadilha que
estava escrita aqui:** as regras responsivas do Tailwind (`sm:`, `md:`…) agora
enxergam a largura do aparelho (430×932 e não a da janela), `position: fixed`
ancora na tela do telefone, e `window.scrollY` / `scrollTo` **voltaram a
funcionar** na prévia. Trocar de aparelho na barra troca o layout na hora, sem
recarregar o app. Não é mais preciso estreitar a janela para conferir celular.

⚠️ **A contrapartida: a mesma URL carrega duas vezes** — a página de cima (só a
moldura) e a de dentro do iframe (o app). Módulo que **aja ao ser carregado**
(falar com o servidor, instalar ouvinte, escrever no `localStorage`) faria tudo
em dobro; é o caso do `lib/auth.ts`, cuja sincronização de conta em dois frames
seria a mesma corrida que duplica item. Guarde-o com `EH_A_MOLDURA` de
`lib/dev-moldura.ts`. Em produção nada disso existe.

⚠️ **A barra do Chrome não mostra mais a tela aberta** (o endereço é o da
moldura); quem mostra é a barra da prévia, no canto direito. E o console do
navegador abre no frame de fora: para rodar `auditarContraste()` ou qualquer
script no app, **troque o contexto para o iframe** no seletor do console (ou use
`document.querySelector('iframe').contentWindow`).

A prévia abre em **tamanho real (100%)**. Aparelho mais alto que a janela faz a
área rolar e aparece o botão "Caber na janela" — a escala fica sempre visível em
número na barra, e reduzir já não falsifica o layout (a viewport de dentro
continua a do aparelho).

**A moldura só existe em acesso local** (`localhost`). Quando o servidor é
exposto por um túnel para mostrar o app a alguém de longe, quem abre o link vê
o app inteiro na tela, sem barra de aparelhos — a moldura é instrumento de quem
constrói. Para expor: `cloudflared tunnel --url http://localhost:3000`.

### O catálogo vem do BANCO desde 21/08 — e o app não tem livro nenhum agora

Até 21/08 os livros moravam no **código**: um array literal em
`client/src/lib/books.ts` com 63 maquetes, que **62 arquivos** importavam. Isso
travava três coisas ao mesmo tempo — livro novo não nascia de um pedido, o
player não tinha capítulo medido para ler, e o acervo de verdade não tinha por
onde entrar. Hoje:

- **`GET /api/catalogo`** (`server/catalogo.ts`) devolve gêneros e livros do
  Postgres, no mesmo desenho da `interface Book`. **Sem sessão** — a vitrine é
  pública; o que exige conta é ouvir.
- **`lib/books.ts` é uma fachada.** Mesmos exports de sempre (`catalog`,
  `genres`, `getBooksByIds`…), só que a lista **nasce vazia e se enche** em
  `carregarCatalogo()`. Nenhuma tela mudou.
- **As capas vêm de `/capas/<arquivo>`**, servido de `CAPAS_RAIZ` (padrão
  `~/AllBook-capas`), **fora do repositório** — milhares de imagens não entram
  no git, pela mesma razão do áudio-mestre.

🚨 **As 63 maquetes foram apagadas** (código, capas, banco) para o acervo real
entrar. Hoje o banco tem **13.917 livros** vindos do `baixalivro`, dos quais
**12.628 aparecem no app**.

🚨 **A diferença é a Audible, e ela está ESCONDIDA, não apagada** (31/08,
§4.145). Os 1.289 livros dela continuam no banco com id, ficha e capa; quem os
tira da vitrine é a lista `LOJAS_FORA_DA_VITRINE` em `server/catalogo.ts`,
aplicada **só na leitura**. O motivo é temporário e é nosso: falta colar a
vinheta e conferir as capas. **Para trazê-los de volta**, apague `audible` da
lista e reinicie o servidor — nada precisa ser reimportado. ⚠️ **A lista de
gêneros também passou a devolver só gênero com ao menos um livro visível**,
senão 22 categorias que só a Audible usa virariam cards abrindo em grade vazia
na Descobrir.

⚠️ **`catalog` nunca troca de referência** — nasce `[]` e é preenchido com
`push`. Um `catalog = novoArray` deixaria os 62 importadores segurando o array
velho, vazio, **sem erro nenhum**.

🚨 **A armadilha que custou uma rodada de teste: `import` estático é avaliado
ANTES da primeira linha do `main.tsx`.** Esperar o catálogo antes do render não
basta — telas que calculam no nível do módulo (`Home.tsx` tem `const heroBooks =
destaquesDaCapa()`) leriam a lista ainda vazia e a guardariam para sempre. Por
isso o `App` entra por **`import()` dinâmico**, depois do `await`. Tela nova que
calcule algo do catálogo fora de um componente depende disso.

⚠️ **Os alvos de npm "catalogo" e "db:catalogo" SAÍRAM** (§4.134). O primeiro
buscava capa e ficha na Open Library para a lista de maquetes; o segundo levava
o array literal para dentro do banco. Os dois dependiam de um array que deixou
de existir, e por isso hoje só quebrariam. Precisa de um deles?
`git show a4885cf~1:script/importar-catalogo.ts > /tmp/x.ts`.

🚨 **Funcionalidade presa a id de maquete morre calada — já aconteceu três
vezes.** Os capítulos inventados (§4.141), as editoras da ficha e o **seletor de
narração** (§4.147) apontavam para os ids 1, 7, 101, 102… das 63 maquetes
apagadas em 21/08. Com o acervo começando no id 100.000, cada um passou a
devolver lista vazia **sem erro nenhum**, e o botão simplesmente não apareceu.
Achou uma tela que "não faz nada"? Antes de reescrevê-la, veja de onde ela lê.

⚠️ **Toda a curadoria de `lib/collections.ts` foi esvaziada** (`bookIds: []`),
e não por arrumação: as listas apontavam para os ids das maquetes, e um livro
real que calhasse de receber o id 7 apareceria em "Só na AllBook" **por acaso**.
A estrutura (slug, rótulo, gradiente, descrição) ficou.

### O acervo TOCA sem ser copiado (31/08, §4.142)

**Dois modos, e o padrão hoje é o segundo:**

- **`hls`** — o livro passou pelo `npm run audio`: virou segmentos de ~6s. É
  formato de **entrega remota**, para quando o áudio subir para a nuvem.
- **`acervo`** — o servidor entrega o arquivo que já está no SSD, capítulo a
  capítulo (`livros.pastaAcervo` + `capitulos.arquivo`). **13.917 livros tocam
  assim, com zero byte copiado.**

🚨 **Converter o acervo não cabe:** são 1,34 TB e 29.319 h; em HLS dariam **840
GB ao lado**, e há 179 GB livres. Enquanto se testa na própria máquina,
converter é trabalho e disco jogados fora — decisão dele, 31/08.

- `GET /api/audio/:id/situacao` → `hls` | `acervo` | `sem-narracao` (três telas
  diferentes) · `GET /api/audio/:id/capitulo/:n` → o arquivo, com sessão e
  `Range`.
- ⚠️ **O nome do arquivo nunca vem do pedido** — sai do banco e passa por
  `basename` antes de virar caminho.
- ⚠️ **`hooks/use-tocador.ts` traduz a posição.** No `hls`, `currentTime` é o
  segundo do livro; no `acervo`, é o segundo **do capítulo**. Use
  `posicaoNoLivro()` e `irPara()` — nunca `audio.currentTime` direto.
- ⚠️ **`npm run audio remover` apaga os capítulos e a duração do banco** (é o
  desfazer completo); a reimportação os devolve.

### Os capítulos são REAIS — o gerador de maquete foi apagado (31/08, §4.141)

🚨 **`lib/chapters.ts` já teve um gerador que sorteava de 8 a 14 capítulos por
livro** ("Capítulo 1", "Capítulo 2"…). Fazia sentido enquanto o app era maquete;
com o acervo dentro, punha **12 capítulos num livro que tem 3**. Ele saiu, e a
regra agora é uma só: **o que não veio do banco não aparece.**

- Os capítulos entram na **importação do acervo** (`npm run acervo importar`),
  não só com o áudio: **100% das fichas** trazem número e título certos.
- A **duração** de cada capítulo vem na ficha só da Audible (100%) e da Storytel
  (99%) — Tocalivros 32%, **Ubook 0%**. O que falta o importador **mede com
  `ffprobe`**; estimar está proibido, era o defeito de origem.
- ⚠️ **Livro com áudio ingerido não é sobrescrito**: ali os capítulos foram
  medidos com a vinheta somada, e trocar pela ficha deslocaria quem já ouviu.
- ⚠️ `getChapters` devolve **vazio na primeira chamada** e dispara o
  carregamento; quem mostra capítulo escuta `CHAPTERS_EVENT` e redesenha.

### A editora vem do `_ficha.json`, não do `catalogo.sqlite` (31/08, §4.148)

Todo livro do app mostra "Publicado por" com link para `/publisher/:slug`, e o
perfil da editora lista o catálogo dela — como o do autor sempre fez.

🚨 **A editora NÃO está na coluna `titulos.editora` do acervo.** Lá só a
**Audible** a preenche (1.592 de 1.597); storytel, tocalivros e ubook mandam
zero. E como a Audible está fora da vitrine (§4.145), ler dali significava
**nenhum livro visível com editora**. Ela mora no **`_ficha.json` de cada pasta
do "pronto", em `ficha.EDITORA`**: 12.918 de 14.575 (88,6%), nas quatro lojas.
Hoje **12.766 dos 13.917 livros têm editora (91,7%)**, em **692 casas**.

⚠️ **`EDITORA` não é `PUBLICADOR`.** A ficha traz as duas: `PUBLICADOR` é quem
produziu o **áudio** ("Tocalivros Stúdios"), papel que no AllBook é do Studio;
`EDITORA` é quem publicou o **livro**.

- **`npm run acervo fichas`** reconcilia só a editora, direto das fichas — 7s,
  sem tocar em capa, capítulo, duração nem id. É o caminho para a correção
  feita no baixalivro chegar aqui **sem reimportar** os 13.917.
- 🚨 **Ninguém precisa lembrar de rodá-lo:** o LaunchAgent `com.allbook.fichas`
  (`scripts/sincronizar-fichas.sh`) o dispara todo dia às 5h30, como a cópia de
  segurança do banco. `zsh scripts/sincronizar-fichas.sh situacao | logs`.
- ⚠️ **Slug de editora, uma vez criado, NUNCA muda.** Ele é endereço e é por ele
  que o app guarda quem a pessoa acompanha; trocá-lo deixa o seguimento
  apontando para o vazio **sem erro nenhum**. `resolverEditoras`
  (`script/editoras.ts`) reusa sempre o slug que já está no banco.
- ⚠️ **Variantes do mesmo nome são uma editora só** ("Mundo Cristão" e "Editora
  Mundo Cristão" seriam dois perfis com metade do catálogo cada). Quem junta é
  `chaveDeEditora`; quem batiza o grupo é a variante mais frequente.
- ⚠️ **"Independente" e "Sem gênero" não entram**: são a ausência da coisa, não
  a coisa. Perfil de "Independente" juntaria 137 livros sem relação nenhuma.
- ⚠️ **`lib/publishers.ts` é DERIVADO do catálogo**, como `people.ts` — não
  volte a escrever lista de ids ali. `Book.publisher` é o **slug**; o nome de
  tela sai de `publisherNames` (`books.ts`) ou de `publisherOfBook()`.

🚨 **Terceiro caso seguido de tela morta por id de maquete** — depois dos
capítulos (§4.141) e do seletor de narração (§4.147). A regra: **tela que "não
faz nada", veja de onde ela lê.** Aqui a lista curada apontava para os ids das
63 maquetes apagadas e devolvia `undefined` para os 13.917 livros, calada.

### Os carimbos que ligam o acervo ao app (30/08, §4.138)

O acervo do `baixalivro` continua sendo corrigido (fichas, anos, vinhetas)
depois de o livro já ter entrado aqui. Quatro colunas de `livros` existem para
que nada disso se perca em silêncio:

- **`subtitulo`** — o importador **não cola mais** título e subtítulo. `Book`
  tem `subtitle`; a busca procura nele e a ficha o mostra. ⚠️ **Só a Audible o
  separa na origem** (899 de 1.597; ubook/storytel/tocalivros mandam zero), por
  isso `tituloDeVitrine(book)` + `line-clamp` seguem sendo a defesa principal
  de quem desenha tela com título grande.
- **`ficha_gerada_em`** e **`vinheta_ficha`** — o que a ficha do acervo dizia na
  última importação. Quem escreve é `npm run acervo importar`.
- **`vinheta_ingerida`** — com que vinheta o áudio foi montado. 🚨 **Só o
  `npm run audio` escreve.** Incluí-la num `set` de importação apagaria o
  carimbo a cada passada, e é a comparação dela com `vinheta_ficha` que
  responde "este áudio está velho?" — vinheta trocada **desloca toda posição
  salva** do livro.

`npm run acervo` (sem argumento) diz quantos faltam entrar, quantas fichas
mudaram, quantas vinhetas diferem e quantos áudios estão velhos. O carimbo
(`a1/f15@2026-08-21`) é montado em `script/carimbos.ts` — **um lugar só**, para
os dois scripts não montarem strings diferentes da mesma vinheta.

### `books.ts` é a fonte única dos livros
`catalog`, `genres`, `getBooksByIds` e `getBooksByGenre` saem de lá. **Tela nova lê
dali e não recria lista de livro** — e não fala com `/api/catalogo` por conta
própria: quem carrega é o `main.tsx`, uma vez, na abertura. (As fichas escritas à
mão que o `BookDetails.tsx` guardava saíram em 21/08 com as maquetes.)

### A busca não usa Fuse.js — de propósito
Ela roda só no navegador, em duas etapas: substring sem acento e, se não achar nada,
palavra a palavra com distância de edição. O Fuse.js foi **removido** porque casava
"carro" com "Carrie" e assim escondia a oferta de produzir a narração — que é o
coração do produto (ROTEIRO 4.18). Não traga de volta.

### O banco existe (08/08), mas o app ainda lê o navegador
Desde 08/08 há **Postgres 17 de verdade** rodando na máquina (banco `allbook`),
com **62 tabelas** em `shared/schema/` — um arquivo por assunto — e o **catálogo
já dentro dele**. O `MemStorage` morreu em 08/08; o `PgStorage` que o substituiu
**também morreu, em 10/08**, porque nenhuma rota chegou a chamá-lo — quem fala
com o banco é `server/db.ts` (o `db` do Drizzle), direto, em `contas.ts`,
`dados.ts` e `audio.ts`.

Desde 08/08 o **login é de verdade** (§4.120): senha cifrada, sessão em cookie
guardada no banco, "Esqueci minha senha" funcionando. `lib/auth.ts` fala com
`/api/contas/*`, mas **`readSession()` continua síncrono** — o `localStorage`
virou *espelho* da sessão, não a verdade. Tela que precise saber quem está
logado segue usando `readSession()` como sempre.

Desde 08/08 **14 chaves sobem para a conta**: biblioteca, progresso, concluídos,
diário, notas, marcações e trechos (§4.121); perfil, ajustes, meta semanal,
conquistas, recomendações, pedidos e assinatura (§4.122). Entre num aparelho novo
e tudo aparece. **`allbook_downloads` NÃO sobe** — baixado é do aparelho.

⚠️ **Chave nova que precise subir?** Acrescente-a à lista `CHAVES` de
`lib/sincronizacao.ts` e o caso correspondente em `server/dados.ts`. Se a lib
dela não disparar evento de `window` ao gravar, **adicione o evento** (uma linha,
o padrão da casa) — é ele que a sincronização escuta. E **se o item tiver id
gerado no navegador, o banco tem de guardar esse id** (coluna `idLocal`): sem
ele, cada sincronização duplica o item. Já mordeu duas vezes.

⚠️ **Mesmo assim, tela nenhuma mudou, e tela nova continua lendo das libs.** O
`localStorage` virou *espelho*: `lib/sincronizacao.ts` escuta os eventos que as
libs já disparavam (`allbook:library`, `allbook:playback`…) e leva a mudança
para a conta. **Não chame a API direto de uma tela** — quem sincroniza é a
ponte, e meia migração é o que quebra em silêncio.

⚠️ **"Sair" agora apaga do navegador o que virou da conta.** Antes ele
preservava a biblioteca de propósito; hoje deixá-la mostraria os dados de quem
saiu para o próximo que pegar o celular.

Comunidade, clubes, fóruns e perfil **continuam só no navegador**.

Comandos: `npm run db:push` (aplica o esquema), `npm run db:psql` (abre o banco
no terminal),
`curl localhost:3000/api/banco/saude` (o servidor enxerga o banco?). Postgres
fora do ar: `brew services start postgresql@17`. O endereço mora no `.env`, que
não vai para o git — em cópia nova, `cp .env.example .env`.

🚨 **O banco tem CONTA DE VERDADE dentro. Nunca rode `delete from <tabela>` nele.**
Em 08/08 eu apaguei a conta real do Matheus assim, "só para testar" — ele a tinha
criado dois minutos antes, e só não se perdeu porque a cópia de segurança tinha
acabado de rodar (§4.126). Para limpar dado de teste existe alvo estreito:
`zsh scripts/backup-banco.sh limpar-testes` (mostra o que vai apagar, e só apaga
com `--confirmo`). **Antes de apagar qualquer coisa, olhe o que está lá.**

**Cópia de segurança:** `zsh scripts/backup-banco.sh agora | listar | restaurar
<arquivo>`. Já roda sozinha uma vez por dia (LaunchAgent `com.allbook.backup`),
guardando as 14 últimas em `~/AllBook-backups` — **fora do repositório**, porque
dado de pessoa não entra no git.

### O áudio: ingestão e entrega existem (08/08); o player, não

`npm run audio <id do livro> <arquivo ou pasta>` leva o que o estúdio entregou
até o banco (`refazer <id>`, `remover <id>`, sem argumento = a situação). Ele
guarda o mestre, cola a vinheta, fatia em HLS e grava duração e capítulos
**medidos**. Os arquivos moram em `AUDIO_RAIZ` (padrão `~/AllBook-audio`),
**fora do repositório** — áudio-mestre é o ativo mais caro do projeto.

- **Três regras que o script existe para cumprir:** o mestre é copiado **antes**
  de qualquer processamento (falha do `ffmpeg` no meio não leva o original); o
  mestre **nunca é servido**, só os segmentos; e os capítulos são calculados
  **depois** da vinheta.
- ⚠️ **A vinheta desloca o livro inteiro.** Mudou o tamanho dela, o script soma a
  diferença em **toda posição salva** daquele livro, na mesma transação. Sem
  isso, todo mundo retomaria N segundos fora do lugar **sem erro nenhum**.
- **Nada fala com fornecedor.** `server/armazenamento.ts` é uma interface com
  uma implementação (pasta local); trocar por R2/B2/Wasabi é acrescentar uma
  classe e mexer no `.env`, porque todos falam o protocolo S3 (§4.128).
- **Capítulos, em ordem de preferência:** embutidos no arquivo (`.m4b`) → um
  arquivo por capítulo numa pasta → um bloco só (e ele avisa).
- ⚠️ **`AUDIO_RAIZ` tem de ser caminho absoluto** — vazio ou relativo gravava
  dentro do repositório, e isso já aconteceu.

**Servir** é `GET /api/audio/:id/lista.m3u8` (a lista) e `/api/audio/:id/s00042.ts`
(um pedaço de ~6s), com **sessão obrigatória** e dois limites: 600 pedaços/min
por conta (memória) e 20 livros distintos por dia (tabela `audio_acessos`).
**Nenhuma tela pede essas rotas ainda** — falta `hls.js` no player.

- ⚠️ **A permissão é conferida a cada pedaço, não por URL assinada.** Um livro
  tem 10h e o player guarda os endereços da lista: assinatura que expira em
  minutos morreria no meio da escuta (§4.130). Quando houver R2,
  `urlTemporaria()` passa a devolver endereço e a rota redireciona sozinha.
- ⚠️ **Livro sem narração devolve 404 com `podePedir: true`**, não 403 — "não
  existe" e "está barrado" levam a telas diferentes.
- ⚠️ **Rota `/api` inexistente agora devolve 404 JSON.** Antes caía no
  `index.html` com HTTP 200, e um `fetch` quebrava ao ler o JSON longe da causa.

### Ordem das rotas no `Switch` (wouter)
A rota **mais específica vem antes da mais curta**, senão a curta captura a longa
(`/profile/edit` antes de `/profile`, `/forum/minhas` antes de `/forum/:id`). Há
várias dessas no `App.tsx`, todas comentadas no próprio arquivo. As rotas de verdade
estão em `client/src/App.tsx` — é lá que se olha, não numa tabela aqui.

---

## Onde ficam as coisas
- `client/src/pages/` — as telas (uma por rota) · `App.tsx` — as rotas
- `client/src/components/layout/` — TopNav, BottomNav, MiniPlayer ·
  `components/ui/` — os **12 componentes do shadcn que o app usa de verdade**
  (§4.132: os 43 que nunca foram usados saíram em 10/08 — precisa de um deles?
  `git show 16e72e5:client/src/components/ui/dialog.tsx > …`, e **passe as cores
  literais dele para os tokens** antes de usar) · e as subpastas por assunto:
  `clube/`, `comunidade/`, `forum/`, `perfil/`, `sala/`
- `client/src/lib/` — o estado do app, um arquivo por assunto
- `client/src/assets/images/` — 8 capas genéricas por gênero (reserva, **em JPEG
  desde 10/08**: eram PNG e pesavam 9 MB, contra 2,7 MB das 58 capas de verdade
  — imagem nova aqui entra em JPEG); `covers/<id>.jpg` (do script) e
  `people/<slug>.jpg` (basta soltar o arquivo; sem foto, o avatar é gerado do nome)
- `server/` — Express na porta 3000 · `shared/schema/` — Drizzle (o `zod` e o
  `drizzle-zod` saíram em 10/08: estavam no `package.json` sem um único import)
- `client/public/_*.html` — **folhas de proposta**, o instrumento com que o Matheus
  decide desenho clicando (elas respondem em `/api/folha/respostas`). Não são código
  do app e não estão no git — não apague achando que é sobra.
- Atalhos: `@/` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`

## Identidade visual (seguir à risca)

**Direção "Estúdio"** (06/08, §4.112): o app parece a cabine onde o livro é
gravado. Fundo grafite quente `#121110`, texto branco-osso `#F5F1EA`, e um
**vermelho de gravação** `#FF4438` que só aparece onde há gravação ou ação —
o botão Pedir, selos, o play. Títulos em **Space Grotesk** (`font-display`),
texto em **Inter**. Cantos `--radius: 0.75rem`, mobile-first. *(O laranja do
Audible e o `#141414` do Netflix saíram justamente por serem dos outros.)*

**São dois temas, e a pessoa escolhe em `/settings`:** "Estúdio" (escuro, o
padrão) e "Tinta" (claro — papel creme `#F4EFE6` e carmim `#C1362F`). Quem
aplica é a classe `.dark` no `<html>`; a lógica está em `lib/tema.ts` e um
script inline no `client/index.html` evita o piscar na abertura.

**A regra de ouro para escrever tela nova: nunca escreva cor literal.**
`bg-[#141414]`, `text-orange-500`, `#f59e0b` — nada disso. Use os tokens
(`bg-background`, `bg-card`, `text-primary`, `border-border`).

**`white` é a cor do texto do tema** (branco-osso no Estúdio, tinta no Tinta),
então `text-white`, `bg-white/10` e `border-white/10` podem ser usados à vontade
— eles se viram sozinhos nos dois temas.

**`black` é preto de verdade**, e serve para uma coisa só: **escurecer**. Véu de
folha (`bg-black/55`), sombra (`shadow-black/40`), degradê sobre capa — tudo isso
escurece nos dois temas, como em qualquer app. *(Ele já foi "a cor do papel", e
o tema claro ficou sem véu, sem sombra e com a capa tomando o fundo — §4.116.)*
Para "texto sobre botão claro" **não** use `text-black`: é
`text-primary-foreground` sobre o vermelho e `text-background` sobre botão
branco.

**Texto por cima de imagem ou de cor viva leva `.sobre-midia` no bloco** — ela
devolve branco puro a tudo que estiver dentro. Se a foto puder ser clara, some
um `<div className="veu-de-midia absolute inset-0" />` entre a imagem e o texto.
⚠️ Dentro de `.sobre-midia` o `--background` **não** muda, de propósito: é o que
deixa o degradê de fusão (`from-background`) continuar valendo lá dentro.

**No fim do `index.css` há a tabela que acerta o tema claro**, e ela faz duas
coisas diferentes: *texto, borda e anel* ganham mais alpha (`text-white/40` vira
53%, para dar o mesmo contraste que 40% dá sobre o grafite); *fundo de
superfície* (`bg-white/5` e afins, até 25%) deixa de ser tinta e vira **branco**
— no claro, papel elevado é papel mais branco, e escurecer o creme dá cinza sujo.
Usou uma opacidade que não está na tabela? Acrescente a linha.

**Pastilha de ícone usa a cor cheia** (`bg-primary text-primary-foreground`), não
`bg-primary/15`: esmaecido vira rosa-bebê sobre papel. Selo com texto continua
esmaecido — se tudo virasse vermelho cheio, a tela viraria semáforo.

⚠️ **Tema claro não é a foto negativa do escuro.** Clarear e escurecer não são
simétricos: o papel tem pouco espaço acima dele e o grafite tem muito. Quando uma
peça "some" no claro, a pergunta não é *quanta* opacidade falta — é **em que
direção** ela deveria se afastar do fundo.

🚨 **`line-clamp-*` define o `display` — nunca escreva `block` ao lado dele**
(31/08, §4.146). O corte por linhas do Tailwind funciona ligando
`display: -webkit-box`; um `block`, `flex` ou `inline-block` na mesma
`className` o desliga **em silêncio**, e o título cresce sem limite. Foi o que
esticou a grade de capas do perfil de pessoa com um título de 10 linhas. O
`truncate` não sofre disso (não mexe em `display`).

⚠️ **Cartão de livro que é `<button>` leva `flex flex-col`.** O navegador
centraliza verticalmente o conteúdo de um botão esticado — e numa grade todas as
células são esticadas até a mais alta —, então a capa do vizinho desce sozinha.
`div` e `<a>` não têm o problema.

Antes de criar tela nova, olhar `Home.tsx` e `BookDetails.tsx` para manter a
mesma cara — e não acrescentar biblioteca de UI nova.

**Conferir tema se faz medindo, não de olho.** Uma captura pequena esconde texto
fraco. Cole `scripts/auditoria-contraste.js` no console do navegador e rode
`auditarContraste()`: ele percorre todo texto visível, compõe as camadas
translúcidas até o fundo real e lista o que está abaixo da régua. O porquê está
na §4.116 do ROTEIRO.

## Duas janelas do Claude ao mesmo tempo
O Matheus costuma abrir duas janelas na mesma pasta. **Na primeira tarefa de cada
sessão, antes de editar qualquer arquivo, leia `docs/COORDENACAO.md` e registre-se
sozinho numa faixa livre do quadro** (se estiver sozinho, assuma a Janela A) — ele
não precisa pedir. Nunca edite arquivo que a outra janela declarou. Só uma janela
sobe o servidor, mas as duas conferem no mesmo `localhost:3000`.

## Git
- **No commit, adicione só os seus arquivos** (`git add <caminho>`) — **nunca
  `git add -A`, `git add .` nem `git commit -a`**: você subiria o trabalho pela
  metade da outra janela. `git pull --rebase` antes de commitar.
- O hook `.githooks/post-commit` **empurra para o GitHub sozinho a cada commit** —
  não existe estado "commitado mas não publicado" para revisar antes. Em cópia nova
  do repositório, ligar uma vez: `git config core.hooksPath .githooks`.
- Ao terminar uma tela ou etapa, commitar e avisar em uma frase o que foi salvo.
  Repositório `github.com/matheuspei/allbook`, branch `main`.

## Onde ficam as decisões
`docs/ROTEIRO.md` guarda as decisões de rumo **ainda em vigor**; o histórico do que
já foi construído mora em `docs/ROTEIRO-ARQUIVO.md`, que só se abre para consultar o
passado. `docs/COORDENACAO.md` é o combinado entre as janelas. **Antes de mexer em
banco, backend ou contas, abra `docs/BANCO-DE-DADOS.md`** — é o checklist da
migração do localStorage, com as armadilhas que quebram em silêncio.

**Ao tomar uma decisão de rumo — ou ao descartar uma ideia — escreva no ROTEIRO na
hora, com o motivo.** Não espere o fim da sessão nem o Matheus pedir: a janela fecha,
o contexto estoura, e o porquê se perde. O filtro é **registrar decisão, não trabalho
feito** — o que foi construído já está no código e no git. Vale registrar: por que se
escolheu um caminho, **o que foi rejeitado e por quê** (é o que mais se perde), e o
que foi apurado sem virar decisão.

## Prioridade e limites
- A prioridade ainda é o **frontend**. Backend, banco e áudio de verdade só depois
  dele completo, ou quando o Matheus pedir — mas pode mexer em qualquer parte do
  código quando a tarefa exigir.
- Não reescrever tela que já funciona sem pedido, e não reorganizar as pastas.
