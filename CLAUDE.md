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
(erros de tipo), `npm run build`, `npm run catalogo`. O resto está no `package.json`.

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

### O catálogo tem duas metades, e uma é arquivo gerado
A parte curada à mão fica em `client/src/lib/books.ts` (id, título, autor, narrador,
nota, gênero). A parte importada vem da [Open Library](https://openlibrary.org) por
`npm run catalogo`, que grava as capas em
`client/src/assets/images/covers/<id>.jpg` e as fichas em
`client/src/lib/catalog-enriched.ts` — **arquivo gerado, não edite à mão**. O script
roda na máquina, nunca durante o uso: o app não depende de internet. Ao acrescentar
um livro em `books.ts`, acrescente-o também na lista `ALVOS` do script e rode de novo.

O que só apareceu testando, e por isso está no script:
- a busca usa o **título original**, não o português (medido: 2 capas de 6 pelo
  português, 6 de 6 pelo original);
- pede 5 resultados e prefere o primeiro **com capa** — a edição do topo às vezes
  não tem imagem;
- tenta de novo antes de desistir: falha de rede passageira derrubava livro bom.

**Limite conhecido:** comparar títulos **não** detecta capa errada. A Open Library
agrupa as edições de uma série — "O Problema dos 3 Corpos" veio com a arte de "The
Dark Forest" e o título devolvido estava certo. Nesses casos, fixe a edição pelo
campo `isbnDaCapa` no `ALVOS`. **Conferir capa exige olho humano.**

### `books.ts` é a fonte única dos livros
`catalog`, `genres`, `getBooksByIds` e `getBooksByGenre` saem de lá. **Tela nova lê
dali e não recria lista de livro.** (O `BookDetails.tsx` ainda tem dados próprios,
herdados de antes.)

### A busca não usa Fuse.js — de propósito
Ela roda só no navegador, em duas etapas: substring sem acento e, se não achar nada,
palavra a palavra com distância de edição. O Fuse.js foi **removido** porque casava
"carro" com "Carrie" e assim escondia a oferta de produzir a narração — que é o
coração do produto (ROTEIRO 4.18). Não traga de volta.

### O banco existe (08/08), mas o app ainda lê o navegador
Desde 08/08 há **Postgres 17 de verdade** rodando na máquina (banco `allbook`),
com **62 tabelas** em `shared/schema/` — um arquivo por assunto — e o **catálogo
já dentro dele**. O `MemStorage` morreu; `server/storage.ts` é Drizzle sobre
Postgres.

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

Comandos: `npm run db:push` (aplica o esquema), `npm run db:catalogo` (recarrega
o catálogo, idempotente), `npm run db:psql` (abre o banco no terminal),
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
  `components/ui/` — shadcn (reutilizar, não reinventar) · e as subpastas por
  assunto: `clube/`, `comunidade/`, `forum/`, `perfil/`, `sala/`
- `client/src/lib/` — o estado do app, um arquivo por assunto
- `client/src/assets/images/` — 8 capas genéricas por gênero (reserva);
  `covers/<id>.jpg` (do script) e `people/<slug>.jpg` (basta soltar o arquivo; sem
  foto, o avatar é gerado do nome)
- `server/` — Express na porta 3000 · `shared/schema/` — Drizzle + Zod
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
