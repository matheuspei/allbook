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
- [x] **Comunidade** — PRONTA (21/07). Rotas `/community` e `/user/:slug`, mais
  `/profile/recommendations` para montar a própria lista pública. Os leitores são
  fictícios (`client/src/lib/community.ts`) e o nome nos comentários de cada livro
  leva ao perfil de quem escreveu. Ver a memória "AllBook: comunidade" para as
  decisões de produto por trás disso.
- [ ] Login / Cadastro
- [ ] Configurações
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

---

## 4. DEPOIS do frontend — o motor (resumo)
1. Modelo de dados real (shared/schema.ts). 2. Backend/API (Drizzle + PostgreSQL; banco grátis: Neon/Supabase). 3. Áudio real em object storage (Cloudflare R2 / Supabase Storage / S3) + streaming. 4. Ligar telas à API + login (Passport). 5. Virar app: PWA → Capacitor.

---

## 5. Backlog de faxina técnica (não urgente)
- **`@assets` aponta para pasta inexistente** (`attached_assets/` em `vite.config.ts`). Criar a pasta vazia ou remover o atalho, antes que algum import futuro quebre.
- **Metatags do Replit no `client/index.html`** (`og:image`/`twitter:image` apontam pro Replit). Trocar por uma imagem do AllBook antes de divulgar links.
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
