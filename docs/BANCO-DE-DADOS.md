# O que fazer quando o banco de dados entrar

> **Por que este arquivo existe.** Pedido do Matheus em 25/07, com o medo certo:
> *"tem muita coisa que talvez vá se perdendo no banco de dados e eu vou
> esquecer, e você também pode esquecer. Esses botões que hoje não funcionam e
> passaram a funcionar lá, talvez não funcionem justamente por esquecimento."*
>
> Ele está certo, e o risco tem nome: **quebra silenciosa**. O dado muda de
> lugar, a tela continua compilando, ninguém vê erro nenhum — e a pessoa perde a
> biblioteca dela. Este é o checklist para isso não acontecer.

**Como usar:** é uma lista de trabalho, não um texto para ler uma vez. Marque
`[x]` conforme fizer. Se um item revelar uma decisão de rumo, ela vai para o
`ROTEIRO.md`; aqui fica o que **tem de ser feito**.

**A regra que organiza tudo:** *nada que funciona hoje pode parar de funcionar
depois*. Cada item abaixo diz **como está hoje** e **o que precisa acontecer**.

---

## 0. Onde o projeto está hoje (medido em 25/07, não de memória)

| Camada | Estado real |
|---|---|
| Tabelas no banco | **1** (`users`, em `shared/schema.ts`) |
| Métodos de armazenamento | **3** (`getUser`, `getUserByUsername`, `createUser`) |
| Rotas de API | **zero** — `server/routes.ts` está vazio |
| Armazenamento em uso | `MemStorage` — uma lista na memória que **some quando o servidor desliga** |
| Onde o app guarda tudo | **21 chaves no `localStorage` do navegador** (lista abaixo) |
| Áudio | **não existe** — nenhum arquivo, nenhum player real |

Ou seja: o backend está montado mas **vazio**. Todo o app funciona no navegador.

---

## 1. As 21 chaves do navegador — o que vira tabela

Cada linha é um dado que hoje vive só no aparelho da pessoa e **some se ela
trocar de celular**. A coluna "cuidado" é o que morde na migração.

### Conta e preferências

- [ ] `allbook_auth` — sessão (`lib/auth.ts`). ⚠️ **Hoje qualquer e-mail entra e
      a senha nunca é guardada** (decisão deliberada). Quando houver contas de
      verdade, toda sessão salva vira inválida — decida se derruba todo mundo ou
      migra.
- [ ] `allbook_profile` — nome, foto, e-mail, bio (`lib/profile.ts`).
- [ ] `allbook_settings` — velocidade, pular silêncio, etc. (`lib/settings.ts`).
      ⚠️ Preferência é da **conta** ou do **aparelho**? Velocidade de leitura
      costuma ser da conta; "baixar só no Wi-Fi" é do aparelho.

### Biblioteca e audição

- [ ] `allbook_library` — Minha lista (`lib/library.ts`).
- [ ] `allbook_downloads` — baixados (`lib/library.ts`). ⚠️ **É do aparelho, não
      da conta** — o arquivo está naquele celular. Não sincronize cegamente.
- [ ] `allbook_playback` — onde parou, em segundos (`lib/playback.ts`).
- [ ] `allbook_miniplayer` — se o mini player está visível (`lib/playback.ts`).
      Provavelmente **não** vai para o banco: é estado de tela.
- [ ] `allbook_finished` — concluídos (`lib/playback.ts`).
- [ ] `allbook_bookmarks` — marcações e notas do tocador (`lib/bookmarks.ts`,
      criada em 26/07). ⚠️ **É a única chave com texto escrito pela pessoa** —
      perder uma nota é perder trabalho dela, não uma preferência que se refaz em
      um toque. Deve ser das **primeiras** a sincronizar, e a que mais merece
      exportação antes da migração.
- [ ] `allbook_listening` — diário de audição, base das Estatísticas
      (`lib/listening.ts`).
- [ ] `allbook_listening_seeded` — marca que o diário já foi **semeado com dados
      falsos**. ⚠️ **Semeadura tem de morrer em produção**, senão o usuário novo
      recebe um histórico que não é dele.

### Opinião

- [ ] `allbook_ratings` — suas notas (`lib/ratings.ts`).
- [ ] `allbook_my_comments` — seus comentários de livro, pessoa e editora
      (`lib/myComments.ts`).
- [ ] `allbook_replies` — suas respostas (`lib/replies.ts`).
- [ ] `allbook_reactions` — curtir/descurtir (`lib/reactions.ts`).

### Social e progresso

- [ ] `allbook_following` — quem você segue (`lib/following.ts`).
- [ ] `allbook_notifications` — avisos (`lib/notifications.ts`).
- [ ] `allbook_recommendations` — suas recomendações no perfil
      (`lib/recommendations.ts`).
- [ ] `allbook_book_requests` — **pedidos de livro** (`lib/requests.ts`).
- [ ] `allbook_achievements_won` — troféus e a data de cada um
      (`lib/achievements.ts`).
- [ ] `allbook_weekly_goal` — meta semanal (`lib/goals.ts`).

---

## 2. As armadilhas — o que quebra em silêncio

Esta é a seção que justifica o arquivo. Nenhuma delas dá erro de compilação.

### 2.1 ⚠️ Os ids dos livros são escritos à mão

`books.ts` usa ids numéricos digitados (`7`, `102`, `301`…). No banco eles viram
chave primária. **Se algum id mudar, tudo que guarda `bookId` no navegador
aponta para o livro errado** — biblioteca, progresso, avaliações, comentários,
downloads, pedidos, capas em `assets/images/covers/<id>.jpg` e o mapa de
editoras em `publishers.ts`.

- [ ] **Preservar os ids atuais na primeira carga do banco.** É de longe o mais
      barato. Se remapear, escreva uma migração que traduza as chaves antigas.

### 2.2 ⚠️ Sair não apaga a biblioteca — e isso inverte com contas

Hoje `signOut` apaga só a sessão, de propósito: os dados são **do navegador**,
não da conta, e apagá-los faria a pessoa perder tudo por ter clicado em "Sair".
Com contas de verdade a lógica se inverte — a biblioteca passa a ser **da
conta**.

- [ ] Decidir e implementar a **migração de primeira entrada**: o que estava no
      aparelho sobe para a conta recém-criada, em vez de sumir.

### 2.3 ⚠️ "Esqueci minha senha" foi removido e **precisa voltar**

Este é literalmente o caso que o Matheus temia. O link saiu do Login em 25/07
(ROTEIRO 4.23) porque **não existe senha para recuperar** — `auth.ts` não guarda
senha. Quando houver contas, ele deixa de ser mentira e passa a ser
obrigatório.

- [ ] Recolocar "Esqueci minha senha" no `pages/Login.tsx` junto com o servidor
      de contas.

### 2.4 ⚠️ Metade da comunidade é ficção que precisa de destino

Não é dado do usuário — é **código**, e alguém precisa decidir o que acontece:

- [ ] `lib/community.ts` — os leitores fictícios (Ana Paula, Beto…). Somem? Viram
      semente? Se sumirem, todo comentário existente fica órfão.
- [ ] `lib/comments.ts` — ~90 comentários fixos de livro, pessoa e editora. Se
      sumirem, os perfis ficam vazios; se ficarem, misturam com os reais.
- [ ] `lib/replies.ts` — a resposta que "chega" é simulada por um esqueleto de
      seis falas fixas. Isso **tem de sair** quando houver gente de verdade.
- [ ] `lib/notifications.ts` — o aviso "responderam você" é simulado pelo mesmo
      esqueleto.
- [ ] `lib/reactions.ts` — sua curtida soma sobre um **número base fixo no
      código**. Com banco o número base some, e todas as contagens mudam de valor.

### 2.5 ⚠️ Áudio não existe — e três coisas dependem dele

- [ ] `lib/chapters.ts` — a lista de capítulos é **gerada**, não real.
- [ ] `duracaoEstimada` em `books.ts` — a duração vem de uma conta sobre o número
      de páginas (≈1h a cada 33 páginas), não de medição.
- [ ] `allbook_playback` guarda a posição **em segundos**. Quando o áudio real
      entrar, as durações mudam e toda posição salva fica deslocada.

### 2.6 ⚠️ O pedido de livro não sai do aparelho

`/request` grava no navegador e o pedido nasce e permanece em `recebido` — não há
fila, servidor nem estúdio ligado. A tela diz isso à pessoa, mas a promessa
pública é de **24 horas**.

- [ ] Fila real, os quatro estados (`recebido` → `procurando` → `produzindo` →
      `pronto`), e o livro entrando no catálogo ao final.

### 2.7 ⚠️ O catálogo é arquivo, não tabela

- [ ] `books.ts`, `publishers.ts` (mapa livro → editora escrito à mão),
      `people.ts` (derivado do catálogo), `collections.ts` e
      `catalog-enriched.ts` (**gerado** por `npm run catalogo`) precisam virar
      tabelas — e o script vira ingestão em vez de gravar arquivo no repositório.
- [ ] As capas hoje são arquivos no repositório (`assets/images/covers/<id>.jpg`).

### 2.8 ⚠️ `MemStorage` some quando o servidor desliga

- [ ] Trocar por armazenamento real ligado ao Drizzle antes de qualquer dado de
      usuário passar pelo servidor.

---

## 3. O que só existe com banco (promessas que o app já faz)

O app já promete estas coisas na tela. Nenhuma funciona sem servidor:

- [ ] **Dados que atravessam aparelhos.** Hoje a tela `/help` avisa a pessoa que
      tudo vive naquele celular. Quando o banco entrar, **essa resposta muda** —
      não esqueça de atualizar `pages/Help.tsx`.
- [ ] **Login que verifica de verdade** (hoje qualquer e-mail entra).
- [ ] **Comunidade com gente real** — seguir, ser respondido, ser notificado.
- [ ] **Produção de narração sob demanda** — o pipeline do `/request`.
- [ ] **Convite com código de indicação** — hoje o "Convidar amigos" compartilha
      o endereço do site; com contas, vira um link de indicação.

---

## 4. Ordem sugerida

1. **Esquema e ingestão do catálogo** (livros, editoras, pessoas, coleções) — é a
   base de tudo e não envolve dado de usuário, então erra barato.
2. **Contas de verdade** — Passport + senha, e a migração de primeira entrada
   (2.2) junto, não depois. Recolocar "Esqueci minha senha" (2.3).
3. **Dados do usuário**, na ordem em que doem se sumirem: biblioteca →
   progresso/diário → avaliações → comentários e reações → social.
4. **Decidir o destino da ficção** (2.4) antes de abrir para gente real, não
   depois.
5. **Áudio** (2.5) e **pipeline do pedido** (2.6) — os dois maiores, e os únicos
   que dependem de decisão de negócio além de código.

---

## 5. Antes de considerar a migração pronta

- [ ] Entrar com uma conta em **dois aparelhos** e ver a biblioteca nos dois.
- [ ] Fazer o caminho de quem já usava o app: dados do navegador **não sumiram**.
- [ ] Sair e voltar: nada se perdeu.
- [ ] Passar em cada item da seção 2 confirmando que **não** quebrou em silêncio.
- [ ] Reler a seção 3 e atualizar os textos do app que hoje dizem "só neste
      aparelho".
