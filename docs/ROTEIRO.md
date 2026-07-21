# AllBook — Estado Atual e Roteiro

_Documento vivo. Atualizado em 21/07/2026. Serve de "mapa" pra continuar o projeto entre sessões._

Repositório: `github.com/matheuspei/allbook` · Roda localmente em `localhost:3000`

---

## 0. Decisões já tomadas com o Matheus (21/07/2026)
- **Estratégia: terminar TODO o frontend (as "vitrines") primeiro**, e só depois construir backend, áudio e o resto ("o estoque"). Fecha a cara final do produto antes de ligar o motor.
- **Fonte da verdade = a cópia no computador do Matheus.** O GitHub deve ser o espelho atualizado dela. Regra nova: salvar no GitHub (commit + push) a cada tela/etapa concluída — nada de ficar meses sem backup.
- **Sincronização conferida:** em 21/07/2026, a cópia local e a do GitHub estão iguais (as telas "Descobrir" e "Perfil" não funcionam nas duas). Seguro construir em cima do que está no GitHub.

---

## 1. O que o AllBook é HOJE (a verdade, sem susto)

O AllBook, neste momento, é uma **maquete de alta fidelidade** — um app de audiolivros lindo por fora, mas ainda sem "motor" por dentro:

- **A parte visual (frontend) está bem avançada e bonita.** ~2.400 linhas, 5 telas prontas: Início (Home), Biblioteca, Detalhes do Livro, Player de Áudio e Estatísticas. Tem menu inferior, mini-player, busca e carrossel — cara de Audible/Storytel de verdade. Grande ativo.
- **Os livros são "de mentirinha" (dados fixos no código)**, escritos à mão dentro de `Home.tsx` e `BookDetails.tsx`. As capas são 8 imagens genéricas de gênero.
- **Não existe áudio real tocando** — o Player é a interface, sem reproduzir arquivos ainda.
- **O backend (servidor) está praticamente vazio** — `server/routes.ts` não tem rotas; o armazenamento é uma lista na memória, que some ao desligar.
- **O banco de dados não é usado** — só a tabela de `usuários` que veio do template. Sem molde para livros/capítulos/áudio/progresso.
- **Git:** 5 commits, TODOS de um único dia (05/03/2026), último há ~5 meses. A automação de "salvar sozinho no GitHub" NÃO está ativa. Adotar disciplina de commit por etapa.

**Resumo:** vitrine excelente; falta construir o estoque, o caixa e o depósito por trás dela.

### Tecnologias já em uso
Frontend: React 19, Vite, Tailwind CSS, shadcn/ui (55 componentes), Framer Motion, Wouter (navegação), Fuse.js (busca), TanStack Query. Backend: Express 5, Passport (login), preparado para PostgreSQL + Drizzle — sem uso real. Pastas `client/`, `server/`, `shared/` — **organização de pastas já está boa, não mexer.**

---

## 2. Onde a gente quer chegar
Um app que **armazena muitos audiolivros**, inspirado no Audible/Storytel (catálogo + player) e no Netflix/HBO (descoberta e streaming).

---

## 3. FOCO ATUAL — Terminar o frontend (as telas)

Telas que existem hoje: Início, Biblioteca, Detalhes do Livro, Player, Estatísticas.

Telas que faltam pra completar o frontend (checklist):
- [ ] **Descobrir / Explorar** — já prometida pelo menu inferior, ainda não existe (prioridade)
- [ ] **Perfil** — já prometida pelo menu inferior, ainda não existe (prioridade)
- [ ] **Login / Cadastro** — entrar e criar conta
- [ ] **Configurações** — ajustes, tema, conta
- [ ] **Busca (tela própria)** — hoje só existe dentro da Home
- [ ] **Categoria / Gênero** — ver todos os livros de um gênero
- [ ] **Autor / Narrador** — página de um autor
- [ ] **Planos / Assinatura** — se for cobrar no futuro
- [ ] **Boas-vindas (onboarding)** — primeiras telas ao abrir o app
- [ ] Ligar a tela de **Estatísticas** ao menu (existe mas não está linkada)

Ordem sugerida de construção: **Descobrir → Perfil → Login/Cadastro → Configurações → Busca → Categoria → Autor → Planos → Onboarding.**

_A decidir: como o trabalho feito na nuvem chega ao computador do Matheus. Definido: construção via Claude Code no Cursor (ver doc "Fluxo de Trabalho")._

---

## 4. DEPOIS do frontend — construir o motor (resumo)
1. **Modelo de dados real** (`shared/schema.ts`): livros, autores, narradores, categorias, capítulos, progresso, biblioteca.
2. **Backend/API** (`server/routes.ts` + Drizzle + PostgreSQL): rotas reais; semear com os livros de exemplo. Banco grátis sugerido: **Neon** ou **Supabase**.
3. **Áudio de verdade:** arquivos grandes vão para um "depósito" (object storage: Cloudflare R2 / Supabase Storage / S3); o banco guarda só a URL; o Player transmite (streaming) e salva o progresso.
4. **Ligar telas à API** (trocar dados fixos por chamadas reais; ativar login com o Passport que já existe).
5. **Virar app de celular:** começar por PWA (instalável, aproveita o código atual) → depois Capacitor (App Store/Play Store). App nativo (React Native/Flutter) só se necessário.

---

## 5. Ferramentas
Usar **um editor só** (Cursor serve bem, é baseado no VS Code). Claude Code no terminal para tarefas maiores. Enviar pro GitHub com frequência (backup + histórico).

---

## Glossário rápido (linguagem simples)
- **Frontend:** as telas que o usuário vê (o "salão do restaurante").
- **Backend / Servidor:** o programa por trás que guarda e processa os dados (a "cozinha").
- **API:** a "janelinha de pedidos" entre as telas e o servidor.
- **Banco de dados:** onde ficam guardadas as informações organizadas (livros, usuários, progresso).
- **Object storage / "depósito":** armazém na internet para arquivos grandes (os áudios).
- **Streaming:** enviar o áudio em pedacinhos conforme se ouve, sem baixar tudo antes.
- **Commit / push:** tirar uma "foto" do projeto e enviá-la pro GitHub (backup + máquina do tempo).
