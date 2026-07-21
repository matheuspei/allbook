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
- [ ] **Perfil** — prometida pelo menu inferior, não existe (próxima)
- [ ] Login / Cadastro
- [ ] Configurações
- [ ] Busca (tela própria)
- [ ] Categoria / Gênero (rota futura `/category/:genero`)
- [ ] Autor / Narrador
- [ ] Planos / Assinatura
- [ ] Boas-vindas (onboarding)
- [ ] Ligar Estatísticas ao menu

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
- **Backup automático não existe** — disciplina é commit + push manual a cada etapa (o Claude Code faz).
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
