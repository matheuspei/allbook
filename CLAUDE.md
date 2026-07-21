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
  - `src/lib/` — `books.ts` (catálogo fixo dos livros), `queryClient.ts` (cliente
    TanStack Query + helper `apiRequest`), `utils.ts`
  - `src/assets/images/` — capas dos livros (PNG)
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
- `/` → Home
- `/discover` → Discover
- `/library` → Library
- `/statistics` → Statistics
- `/book/:id` → BookDetails
- `/player/:id` → AudioPlayer

O menu inferior (`BottomNav`) aponta para: Início (`/`), Biblioteca (`/library`),
Descobrir (`/discover`) e **Perfil (`/profile`)** — mas **`/profile` ainda NÃO existe**
(é a próxima tela a construir). A tela de Estatísticas existe mas não está ligada
no menu.

**Comportamento de navegação:** a tela `AudioPlayer` (`/player/:id`) é **tela cheia** —
ela esconde o TopNav e o BottomNav. Em todas as outras rotas, o `MiniPlayer` flutua
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
- **Busca** é feita só no navegador, com Fuse.js, em cima do catálogo fixo.

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
