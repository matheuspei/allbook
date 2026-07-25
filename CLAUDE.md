# AllBook — Guia do Projeto (CLAUDE.md)

> Este arquivo é lido automaticamente pelo Claude Code toda vez que ele abre este
> projeto. Ele é a "carteira de identidade" do AllBook: diz o que é o projeto,
> como rodar, o estilo visual e as regras de como trabalhar. Mantenha atualizado.
>
> O roteiro (o que já existe e o que falta construir) fica em `docs/ROTEIRO.md`.

---

## Sobre o projeto
AllBook é um **aplicativo de audiolivros em português (PT-BR)**, inspirado no
Audible/Storytel (catálogo + player) e no Netflix/HBO (descoberta e streaming).
Objetivo de longo prazo: armazenar uma grande quantidade de audiolivros e permitir
ouvi-los com um bom player. O dono do projeto (Matheus) tem **pouca experiência em
programação** — leve isso em conta em tudo.

## Como falar com o Matheus
- Responder **sempre em português**.
- Explicar em **linguagem simples, sem jargão**. Ao usar um termo técnico, explicar
  o que ele significa em uma frase.
- Fluxo padrão: **faça a mudança e depois explique em poucas palavras** o que foi
  feito e por quê. Não é preciso pedir permissão a cada passo — há autonomia para agir.
- Para tarefas grandes ou ambíguas, tudo bem propor um plano curto antes de executar.

## Como rodar o projeto
- `npm install` — instalar as dependências (só na primeira vez ou quando mudarem).
- `npm run dev` — sobe o app inteiro em **http://localhost:3000** (Express + Vite
  como middleware). É o comando do dia a dia.
- `npm run dev:client` — sobe só o frontend, sem o servidor (porta 3000).
- `npm run check` — verifica erros de tipo (TypeScript).
- `npm run build` — gera a versão de produção.
- `npm start` — roda a versão de produção já construída.
- `npm run db:push` — (uso futuro) cria/atualiza as tabelas no banco de dados.
- `npm run catalogo` — busca capas e fichas reais dos livros (ver abaixo).

### O servidor roda como serviço do sistema (launchd), fora da sessão do Claude

**Sintoma:** o servidor caía toda vez que o Matheus fechava e reabria o Claude
Code (ou fechava a tampa do MacBook), e era preciso subir de novo.

**Causa, apurada em 24/07:** quando o Claude roda `npm run dev`, o processo
nasce **no mesmo grupo de processos da sessão do Claude** (confirmado com
`ps -o pid,ppid,pgid`: o `npm`, o `tsx` e o shell compartilhavam o PGID, e o pai
de tudo era o processo do Claude Code). Ao encerrar a sessão, o sistema mata o
grupo inteiro — e o servidor vai junto. **Não é bug do projeto**; é só quem é o
dono do processo.

**Solução (24/07): virou um serviço do sistema (launchd).** Rodar num Terminal
(`scripts/servidor.sh`) já tirava o servidor do grupo do Claude, mas ainda exigia
uma janela aberta e não voltava sozinho se caísse. Agora o servidor é um
**LaunchAgent** (`com.allbook.devserver`), no mesmo esquema que o voicemode já usa
nesta máquina: o **sistema** é dono do processo, ele **sobe ao ligar o Mac**
(`RunAtLoad`) e **se reergue sozinho** se cair (`KeepAlive`). Gerência pelo
`scripts/servidor-servico.sh`:

- `zsh scripts/servidor-servico.sh instalar` — cria e liga o serviço (uma vez só).
- `… status` — diz se está carregado e se a porta 3000 responde.
- `… logs` — log ao vivo (`~/Library/Logs/allbook-devserver.log`).
- `… reiniciar` — após mexer no código do servidor (`server/`); o Vite recarrega
  o frontend sozinho, mas mudança no back-end pede reinício.
- `… parar` / `iniciar` / `desinstalar`.

O `scripts/servidor.sh` (rodar num Terminal) continua como **alternativa manual**,
para quem não quiser o serviço sempre no ar. **Não use os dois ao mesmo tempo** —
brigam pela porta 3000.

**Consequência para o Claude:** não suba `npm run dev` solto na sessão — esse
morre com a sessão. Mas o serviço launchd é diferente: rodar
`zsh scripts/servidor-servico.sh instalar`/`iniciar`/`status` **de dentro de uma
sessão do Claude é seguro**, porque o launchd bootstrapa o job no domínio do
usuário, não no grupo de processos da sessão. Com o serviço no ar, a porta 3000
já costuma responder; se não responder, rode o `status` e, se preciso, `instalar`.

### `npm run catalogo` — de onde vêm as capas e as fichas

O catálogo tem duas metades. **A curada à mão** fica em `books.ts`: id, título em
português, autor, narrador, nota e gênero. **A importada** vem da
[Open Library](https://openlibrary.org) por `npm run catalogo`, que grava:

- `client/src/assets/images/covers/<id>.jpg` — a capa real de cada livro
- `client/src/lib/catalog-enriched.ts` — ano, páginas, ISBN, sinopse e título
  original. **Arquivo gerado: não edite à mão.**

O `books.ts` junta as duas na hora de montar o `catalog`. Livro sem capa baixada
cai na imagem genérica do gênero.

O script **roda uma vez na sua máquina**, não durante o uso do app — por isso o
AllBook nunca depende de internet nem da API para funcionar. Ao acrescentar um
livro em `books.ts`, acrescente-o também na lista `ALVOS` do script e rode de novo.

**Três coisas que só apareceram testando, e que estão no script por isso:**
- A busca usa o **título original**, não o português (medido: 2 capas de 6 em
  português, 6 de 6 pelo original).
- Pede 5 resultados e prefere o primeiro **com capa** — a edição do topo às vezes
  não tem imagem.
- Tenta de novo antes de desistir: falhas de rede passageiras derrubavam livros
  que passavam na segunda tentativa.

**Limite conhecido:** comparar títulos **não** detecta capa errada. A Open Library
agrupa as edições de uma série, então "O Problema dos 3 Corpos" veio com a arte de
"The Dark Forest" enquanto o título devolvido estava certo. Para esses casos use o
campo `isbnDaCapa` no `ALVOS`, que fixa a capa por uma edição específica.
**Conferir capa exige olho humano** — vale passar pelas telas de categoria de vez
em quando.

### A moldura de celular da prévia NÃO simula um celular

Em desenvolvimento o app aparece dentro de uma moldura de telefone
(`DevMobileWrapper`). Ela é só uma caixa com largura fixa — **as regras
responsivas do Tailwind (`sm:`, `md:`…) continuam olhando a largura da janela do
navegador**, não a da moldura. Numa janela larga, a prévia mostra o layout de
**desktop** espremido num retângulo com cara de celular.

Consequências práticas ao revisar:
- Classes como `sm:hidden` não se comportam como no celular real. Para ver o
  layout de celular de verdade, estreite a **janela** do navegador para menos de
  640px, ou use o modo dispositivo do DevTools.
- A moldura tem o próprio `overflow`, então **quem rola é ela, não a janela**.
  Código que lê `window.scrollY` ou chama `window.scrollTo` não funciona na
  prévia (funciona no app real). Ainda há `window.scrollTo` em `BookDetails.tsx`,
  `CategoryBooks.tsx`, `Collection.tsx` e `PersonProfile.tsx` — inofensivo, mas
  não faz nada na prévia.

## Tecnologias (stack)
**Frontend:** React 19, Vite, TypeScript (strict), Tailwind CSS v4 (plugin
`@tailwindcss/vite`), shadcn/ui (base Radix UI), Framer Motion (animações),
Wouter (rotas), TanStack Query (dados), Fuse.js (busca), lucide-react (ícones).

**Backend (ainda embrionário):** Express 5, Passport (login), Drizzle ORM +
PostgreSQL — preparado, mas praticamente sem uso real ainda. O armazenamento hoje
é `MemStorage`, uma lista na memória que **some quando o servidor desliga**.

## Estrutura de pastas
- `client/` — o app (frontend)
  - `src/pages/` — as telas (uma por rota)
  - `src/components/layout/` — TopNav, BottomNav, MiniPlayer
  - `src/components/ui/` — componentes shadcn/ui (reutilizar, não reinventar)
  - `src/hooks/` — use-toast, use-mobile
  - `src/lib/` — `books.ts` (catálogo), `people.ts` (autores e narradores),
    `catalog-enriched.ts` (**gerado**, ver abaixo), `queryClient.ts` (cliente
    TanStack Query + helper `apiRequest`), `utils.ts`
    - Comunidade: `community.ts` (os leitores, fictícios de propósito),
      `comments.ts` (**os comentários, com dono, livro e data — não ficam mais
      dentro do `BookDetails`**), `following.ts` (quem você segue),
      `activity.ts` (junta recomendação + comentário no que a tela Comunidade
      mostra, e monta as sugestões "com motivo"), `reactions.ts` (curtir e
      descurtir; os dois mostram número e pesam igual na ordem),
      `replies.ts` (respostas que ficam no localStorage — as suas e as
      recebidas; **um nível só**, com "@Fulano"), `notifications.ts`
      (aviso "responderam você"; a resposta de volta é simulada pelo esqueleto
      até haver servidor)
    - Preferências e sessão: `settings.ts`, `auth.ts`, `profile.ts`,
      `recommendations.ts`
  - `src/assets/images/` — 8 capas genéricas por gênero (PNG), usadas como reserva
    - `covers/` — a capa real de cada livro, `<id do livro>.jpg`, baixada pelo script
    - `people/` — foto de autor/narrador, `<slug>.jpg`. Basta soltar o arquivo:
      o Vite acha sozinho. Sem foto, o avatar é gerado do nome. Ver o `LEIA-ME.md`
      da pasta.
  - `src/App.tsx` — onde ficam as **rotas**
- `server/`
  - `index.ts` — entrada do Express, porta 3000
  - `routes.ts` — registro das rotas da API (prefixo `/api`) — hoje vazio
  - `storage.ts` — interface `IStorage` + implementação `MemStorage`
  - `vite.ts` — middleware do Vite (só em desenvolvimento)
  - `static.ts` — serve o frontend construído (só em produção)
- `shared/` — `schema.ts`: tabelas Drizzle + tipos Zod compartilhados entre
  client e server. Hoje só a tabela `users`.
- `docs/` — roteiro e decisões do projeto.

**Atalhos de import:** `@/` → `client/src`, `@shared` → `shared`,
`@assets` → `attached_assets` (essa pasta ainda não existe; criar se for usar).

## Rotas atuais (wouter, em `App.tsx`)

| Rota | Tela |
| --- | --- |
| `/` | Home |
| `/login` | Login (entrar e criar conta na mesma tela) |
| `/discover` | Discover |
| `/library` | Library |
| `/statistics` | Statistics |
| `/profile` | Profile |
| `/profile/edit` | ProfileEdit |
| `/profile/recommendations` | RecommendationsEdit |
| `/settings` | Settings (configurações; importada como `SettingsPage`) |
| `/community` | Community |
| `/user/:slug` | UserProfile (outro leitor) |
| `/downloads` | Downloads |
| `/notifications` | Notifications |
| `/book/:id` | BookDetails |
| `/person/:slug` | PersonProfile (autor **e** narrador na mesma tela) |
| `/category/:slug` | CategoryBooks (todos os livros de um gênero) |
| `/collection/:slug` | Collection (livros de uma coleção curada, ex.: "Lançamentos") |
| `/player/:id` | AudioPlayer |

**Ordem importa:** `/profile/edit` e `/profile/recommendations` vêm **antes** de
`/profile` no `Switch`, senão a rota mais curta captura as outras duas.

O menu inferior (`BottomNav`) aponta para Início, Biblioteca, Descobrir e Perfil.
Estatísticas fica no TopNav e também dentro do Perfil.

**Comportamento de navegação:** `AudioPlayer` (`/player/:id`) e `Login` (`/login`) são
**tela cheia** — escondem o TopNav e o BottomNav (o Login esconde também o MiniPlayer). Em todas as outras rotas, o `MiniPlayer` flutua
logo acima do BottomNav.

## Identidade visual (seguir à risca)
- **Tema escuro por padrão.** Fundo `#141414` (quase preto), cartões um pouco mais
  claros, texto branco.
- **Cor de destaque (marca): laranja/âmbar** — `hsl(24 100% 50%)` (~`#FF6A00`),
  com toques de amarelo/âmbar (`#f59e0b`) no estilo Audible. Usar em botões
  principais, destaques e selos como "AllBook Original".
- **Fontes:** títulos em **Outfit** (`font-display`, com `tracking-tight`); textos em
  **Inter** (`font-sans`).
- Cantos arredondados (`--radius: 0.75rem`). Visual **mobile-first** (pensado para celular).
- Usar os componentes de `components/ui` (shadcn) e ícones de `lucide-react`.
  Não adicionar novas bibliotecas de UI sem necessidade real.
- **Referência de padrão:** olhar `Home.tsx` e `BookDetails.tsx` antes de criar uma
  tela nova, para manter a mesma cara.

## Padrões de código
- TypeScript no modo **strict**. Componentes React (function components + hooks).
- **Textos da interface em português (PT-BR).**
- Para criar uma tela nova: (1) criar o arquivo em `client/src/pages/`, (2) registrar
  a rota em `App.tsx`, (3) se for item de menu, ligar no `BottomNav`.
- **Dados dos livros hoje são fixos ("mock")** e ficam em **`client/src/lib/books.ts`**,
  que é a fonte única: `catalog` (todos os livros, cada um com `genre`), `genres`,
  e os ajudantes `getBooksByIds` e `getBooksByGenre`. Home e Descobrir leem daí —
  **telas novas devem fazer o mesmo, e não recriar listas de livros**. O
  `BookDetails.tsx` ainda tem dados próprios, herdados de antes. (No futuro, trocar
  tudo por chamadas à API usando TanStack Query.)
- **Biblioteca do usuário** é guardada no `localStorage` do navegador.
- **Busca** é feita só no navegador, em cima do catálogo fixo, em duas etapas:
  substring sem acento e, se não achar nada, casamento palavra a palavra com
  distância de edição. **Não usa mais Fuse.js** — ele casava "carro" com "Carrie"
  e assim escondia a oferta de produzir a narração (ver `docs/ROTEIRO.md` 4.18).

### Para adicionar uma rota de API (quando chegar a hora)
Registrar em `server/routes.ts` sob o prefixo `/api`. Adicionar os métodos na
interface `IStorage` e implementar em `MemStorage` (ou numa futura versão ligada
ao banco de dados).

## Prioridade atual
- **FOCO AGORA: terminar o FRONTEND** — construir as telas que faltam, começando por
  **Descobrir** e **Perfil**.
- **Liberdade:** pode mexer em qualquer parte do código (inclusive backend) quando a
  tarefa realmente exigir — mas a prioridade é o frontend. Só construir backend, banco
  e áudio "de verdade" depois do frontend completo, ou quando o Matheus pedir.
- **Ordem sugerida das telas:** Descobrir → Perfil → Login/Cadastro → Configurações →
  Busca → Categoria/Gênero → Autor → Planos → Boas-vindas (onboarding).

Detalhes e checklist completo em `docs/ROTEIRO.md`.

## Trabalhar com duas janelas ao mesmo tempo (regra importante)
O Matheus costuma abrir **duas janelas do Claude Code na mesma pasta**. Como as duas
mexem nos mesmos arquivos e no mesmo git, elas podem se atropelar. O combinado
completo — com o **quadro de trabalho** que diz quem está com o quê agora — fica em
**`docs/COORDENACAO.md`**; mantenha a sua linha do quadro atualizada. O essencial:

- **Assuma a faixa livre sozinho, sem esperar o Matheus pedir.** Na **primeira tarefa
  de cada sessão**, antes de editar qualquer arquivo: leia `docs/COORDENACAO.md`, veja
  no quadro qual faixa está livre e **registre-se nela** (se as duas estiverem livres,
  pegue a faixa que combina com a tarefa pedida; sozinho, pegue a Janela A). O Matheus
  **não precisa colar frase nenhuma** — isto acontece automaticamente. Só quando ele
  mandar explicitamente uma faixa ("fica no servidor") é que você segue a ordem dele.
- **Nunca edite um arquivo que a outra janela declarou** no quadro.
- **Só uma janela roda o servidor** (porta 3000), mas **as duas verificam nele**: o
  Vite recarrega sozinho a cada arquivo salvo, então qualquer janela testa a própria
  mudança abrindo `http://localhost:3000` no navegador. Quem não subiu o servidor não
  liga um segundo — só olha o app que já está no ar.
- **No commit, adicione só os seus arquivos** (`git add <caminho>`) — **nunca `git add -A`,
  `git add .` ou `git commit -a`**, senão você sobe o trabalho pela metade da outra janela
  (o hook empurra pro GitHub na hora). Rode `git pull --rebase` antes de commitar.

## Git / backup (regra importante)
- Ao terminar uma tela ou etapa, fazer **commit + push automaticamente** para o GitHub
  e depois **avisar em uma frase** o que foi salvo.
- Mensagens de commit curtas e descritivas (ex.: `feat: cria tela Descobrir`).
- Nunca deixar o trabalho semanas sem backup no GitHub.
- Repositório: `github.com/matheuspei/allbook` · branch principal: `main`.

**Backup automático (ativo):** o hook `.githooks/post-commit` faz o push sozinho a
cada commit. Consequência importante: **todo commit vai direto para o GitHub** — não
existe mais um estado "commitado mas não publicado" para revisar antes. Se o push
falhar (sem internet), o hook avisa no terminal e o commit fica salvo só localmente.

Numa cópia nova do repositório, o hook precisa ser ligado uma vez com
`git config core.hooksPath .githooks`.

## O que NÃO fazer
- Não expor segredos/chaves no código — usar variáveis de ambiente (`.env`, já ignorado no git).
- Não instalar bibliotecas grandes sem necessidade.
- Não reescrever telas que já funcionam sem pedido — preservar o que está bom.
- Não reorganizar a estrutura de pastas — ela já está boa.

## Onde ficam as decisões
O roteiro, o checklist de telas e as decisões de rumo ficam em **`docs/ROTEIRO.md`**,
dentro do repositório — é lá que se olha para saber o que vem a seguir. O documento
"AllBook — Fluxo de Trabalho" continua no Projeto do Cowork. Este `CLAUDE.md` guarda
as regras técnicas do dia a dia.

O Cowork é onde o Matheus pensa e escreve; o que vale para o código é sempre o
arquivo que está **dentro** do projeto. Quando vier uma versão nova do Cowork,
fundir aqui e avisar o que mudou.

### Registrar decisão é obrigação, não favor (regra importante)

**Ao tomar uma decisão de rumo — ou ao descartar uma ideia — escrever em
`docs/ROTEIRO.md` na hora, junto com o motivo.** Não esperar o fim da sessão e
não esperar o Matheus pedir: ele pode fechar a janela antes, o contexto pode
estourar antes, e aí o porquê se perde.

**O filtro é: registrar decisão, não trabalho feito.** O que foi construído já
está no código e no histórico do git, e repetir isso no roteiro só cria
documento que envelhece mal. O que nenhum código conta é:

- **por que** se escolheu um caminho;
- **o que foi rejeitado** e a razão (o mais valioso, e o que mais se perde —
  quem chegar depois vê só a ausência e propõe de novo a mesma coisa);
- o que foi **apurado sem gerar decisão**, para ninguém refazer a pesquisa.

Dois exemplos do próprio roteiro, no formato certo: a seção "Estilo: evitar a
cara de IA" (uma abordagem rejeitada, com os motivos) e a seção "Decisão em
aberto: de onde vem a estrelinha" (pesquisa registrada, decisão explicitamente
não tomada).

Preferências sobre **como trabalhar com o Matheus** — e não sobre o AllBook —
vão para a memória do Claude Code, não para cá: elas o acompanham em qualquer
projeto.
