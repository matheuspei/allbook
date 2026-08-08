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

## 0. Onde o projeto está hoje (atualizado em 08/08, medido — não de memória)

| Camada | Estado real |
|---|---|
| Banco | **Postgres 17 rodando na máquina**, banco `allbook` (LaunchAgent do Homebrew) |
| Tabelas | **62**, em `shared/schema/` (um arquivo por assunto) |
| Armazenamento em uso | `PgStorage` — Drizzle sobre o Postgres. O `MemStorage`, que sumia com o servidor, **morreu em 08/08** |
| Catálogo no banco | **cheio**: 59 livros, 48 pessoas, 10 editoras, 8 gêneros, 13 coleções |
| Rotas de API | **10** — folhas, saúde do banco, 6 de conta e 2 de dados |
| Contas | **de verdade desde 08/08**: senha cifrada (scrypt), sessão em cookie guardada no banco, "Esqueci minha senha" funcionando |
| Dados da pessoa | **14 chaves já sobem para a conta**: biblioteca, progresso, concluídos, diário, notas, marcações e trechos (§4.121); perfil, ajustes, meta, conquistas, recomendações, pedidos e assinatura (§4.122) |
| Onde o app guarda tudo | ainda as chaves `allbook_*`, **mas agora como espelho**: as 7 acima voltam do servidor ao entrar; as outras 54 continuam só no navegador |
| Áudio | **não existe** — nenhum arquivo, nenhum player real |

Ou seja: o banco está de pé, o catálogo dentro dele, as contas são de verdade e
**a biblioteca já atravessa aparelhos**. O que falta é a camada social — e ela
depende de decidir o destino da ficção (2.4) antes, porque hoje conversa com
gente que não existe.

⚠️ **Nenhuma tela mudou para isso acontecer.** As libs do `localStorage` estão
intactas; `lib/sincronizacao.ts` escuta os eventos que elas já disparavam. Ao
escrever tela nova, **continue lendo das libs** — quem sincroniza é a ponte.

> **Como era em 25/07, para dar a medida do que mudou:** 1 tabela (`users`, com
> 3 colunas), zero rotas, `MemStorage` na memória, e nem o `drizzle.config.ts`
> existia — o `npm run db:push` estava quebrado desde sempre.

### Os comandos

| Comando | O que faz |
|---|---|
| `npm run db:push` | cria/atualiza as tabelas a partir de `shared/schema/` |
| `npm run db:catalogo` | copia o catálogo do código para o banco (idempotente) |
| `npm run db:psql` | abre o banco no terminal para olhar as tabelas |
| `brew services list \| grep postgres` | o Postgres está no ar? |
| `curl localhost:3000/api/banco/saude` | o **servidor** enxerga o banco? |

---

## 1. As 61 chaves do navegador — o que vira tabela

Cada linha é um dado que hoje vive só no aparelho da pessoa e **some se ela
trocar de celular**. A coluna "cuidado" é o que morde na migração.

> **Recontagem de 04/08:** este inventário nasceu com 21 chaves; a comunidade,
> os clubes, os fóruns e a sala ao vivo criaram mais 39 sem ninguém atualizar
> aqui (uma varredura automática achou a diferença). As 39 estão na **seção
> 1.1**, agrupadas por assunto. Duas armadilhas transversais delas viraram as
> seções **2.10** e **2.11**.

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

- [x] `allbook_library` — Minha lista (`lib/library.ts`). **Sobe para a conta desde 08/08 (§4.121).**
- [ ] `allbook_downloads` — baixados (`lib/library.ts`). ⚠️ **É do aparelho, não
      da conta** — o arquivo está naquele celular. Não sincronize cegamente.
- [x] `allbook_playback` — onde parou, em segundos (`lib/playback.ts`). **Sobe para a conta (§4.121)** — o aviso dos segundos e da vinheta continua valendo (2.5).
- [ ] `allbook_miniplayer` — se o mini player está visível (`lib/playback.ts`).
      Provavelmente **não** vai para o banco: é estado de tela.
- [x] `allbook_finished` — concluídos (`lib/playback.ts`). **Sobe para a conta (§4.121).** ⚠️ Divide a tabela `progresso` com o `playback`: gravar um não pode apagar o outro.
- [ ] `allbook_bookmarks` — marcações e notas do tocador (`lib/bookmarks.ts`,
      criada em 26/07). ⚠️ **É a única chave com texto escrito pela pessoa** —
      perder uma nota é perder trabalho dela, não uma preferência que se refaz em
      um toque. Deve ser das **primeiras** a sincronizar, e a que mais merece
      exportação antes da migração. **Sobe para a conta desde 08/08 (§4.121)**,
      e o id do navegador é preservado na coluna `idLocal` — sem ele, cada
      sincronização duplicaria a marcação.
- [ ] `allbook_listening` — diário de audição, base das Estatísticas
      (`lib/listening.ts`). **Sobe para a conta (§4.121)** — em TRÊS tabelas
      (`audicao_dia`, `audicao_por_hora`, `audicao_por_livro`), porque o diário
      nunca soube qual livro foi ouvido em qual hora; uma tabela cruzada
      obrigaria a inventar o cruzamento.
- [ ] `allbook_listening_seeded` — marca que o diário já foi **semeado com dados
      falsos**. ⚠️ **Semeadura tem de morrer em produção**, senão o usuário novo
      recebe um histórico que não é dele. **Contido em parte (08/08, §4.122):** o
      servidor **recusa** dias marcados como `exemplo`, então os 42 dias falsos
      ficam no navegador e não ocupam a conta. ⚠️ **MAS os troféus calculados em
      cima deles ainda sobem** — `achievements.ts` não distingue medalha ganha de
      medalha derivada de exemplo. O conserto é a semeadura morrer.

### Opinião

- [x] `allbook_ratings` — suas notas (`lib/ratings.ts`). **Sobe para a conta (§4.121).**
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

## 1.1 As 39 chaves que a recontagem de 04/08 achou fora do inventário

Mesmo formato: dado que some se a pessoa trocar de aparelho. **Negrito** = dado
que a pessoa criou (perder dói: texto escrito, escolha feita); sem negrito =
preferência, cache ou estado que se refaz. Fonte: varredura automática de
`client/src` + leitura de cada lib.

### Clube

- [ ] **`allbook_clubes`** (`lib/clubes.ts`) — tudo que é seu nos clubes:
      criados, entradas, ciclos, estantes, removidos, convidados, renomeados,
      fila de espera, privacidade. ⚠️ Caso máximo da armadilha 2.10 (overlay);
      membros são fictícios (2.4); estante usa `bookId` à mão (2.1).
- [ ] **`allbook_mural`** (`lib/muralDoClube.ts`) — suas mensagens no mural
      (capítulo, spoiler, citação de áudio) e sua moderação (ocultados,
      spoilers). ⚠️ Moderação hoje só vale neste aparelho — com servidor vira
      estado global: decidir se migra ou zera. Citações presas a segundos de um
      áudio que não existe (2.5).
- [ ] **`allbook_rodadas`** (`lib/rodadas.ts`) — rodadas abertas, **suas
      respostas em texto**, seu voto no próximo livro, encerramentos.
      ⚠️ O efeito da votação encerrada mora em `allbook_clubes` — as duas
      migram juntas ou o estado racha. Votos fictícios semeados morrem em
      produção.
- [ ] **`allbook_pautas`** (`lib/pautas.ts`) — pautas que você abriu, seu voto,
      encerradas antes do prazo. ⚠️ Voto é anônimo por regra ("número aberto,
      nome fechado") — a API não pode expor quem votou em quê.
- [ ] `allbook_convites` (`lib/convites.ts`) — convites de clube enviados e
      recebidos. ⚠️ A resposta do convidado é **simulada** (aceita sozinho) —
      a simulação morre em produção; vira relação entre contas, não migrar como
      está (mesmo caso do `allbook_seguidores`).

### Fórum / comunidades

- [ ] **`allbook_grupos_participo`**, **`allbook_grupos_meus_topicos`**,
      **`allbook_grupos_minhas_respostas`**, **`allbook_grupos_meus`**,
      **`allbook_grupos_capas`**, `allbook_grupos_moderacao` (`lib/grupos.ts`)
      — onde você entrou, os tópicos e respostas que **escreveu**, os fóruns
      que fundou, a capa escolhida por tópico, e a moderação do dono.
      ⚠️ Tópicos/respostas apontam ids semeados que vivem no código (2.10);
      id local `meu-g-<timestamp>` precisa virar id de servidor; capa enviada
      é `data:` URL no localStorage — na migração vira upload de arquivo;
      dono implícito "eu" (2.11).
- [ ] **`allbook_forum_governanca`**, `allbook_forum_recusados`,
      `allbook_forum_admitidos` (`lib/forum.ts`) — a configuração de cada
      comunidade no molde Orkut (entrada, visibilidade, moderadores, banidos,
      fila, imagem) e as decisões do moderador. ⚠️ Mapa por id de fórum
      semeado (2.10); imagem `data:` URL vira upload; membros = código +
      remendo — no banco a lista tem de ser **uma só**. `grupos.ts` e
      `forum.ts` leem chaves um do outro por string crua (import circular
      evitado): mudar uma tabela exige olhar as duas libs.
- [ ] **`allbook_forum_enquetes`**, **`allbook_forum_votos`**,
      **`allbook_forum_eventos`**, **`allbook_forum_presencas`**,
      `allbook_forum_presencas_outros`, `allbook_convites_de_evento`
      (`lib/forumConteudo.ts`, `lib/convitesDeEvento.ts`) — enquetes e eventos
      que você criou, seu voto, sua presença. ⚠️ Votos e presenças fictícios
      são semeados e **morrem em produção** (enquete real começa zerada);
      `presencas_outros` é dado fictício **persistido** pela simulação de
      convite — a chave inteira morre com o servidor.

### Posts / feed da Comunidade

- [ ] **`allbook_posts`** (`lib/posts.ts`) e **`allbook_mural_posts`**
      (`lib/mural.ts`) — seus posts, no formato novo e no legado. ⚠️ **Dois
      formatos convivem de propósito** — a migração converte os DOIS numa
      tabela só, senão metade dos posts fica para trás (2.11 também: autor
      ausente = "eu").
- [ ] **`allbook_comentarios_post`** (`lib/comentariosDePost.ts`) — seus
      comentários em posts. ⚠️ `postId` pode apontar post semeado (código) ou
      seu (localStorage) — destinos diferentes na migração.
- [ ] **`allbook_curtidas`** (`lib/curtidas.ts`) — sua reação por fala (post,
      fórum, mural). ⚠️ Já trocou de formato uma vez (lista→mapa) e o leitor
      converte o antigo — a migração aceita os dois; unificar com
      `reactions.ts` numa tabela única (já mandado na 3.1).
- [ ] **`allbook_melhor_resposta`** (`lib/melhorResposta.ts`) — a melhor
      resposta que quem perguntou marcou. ⚠️ Regra a honrar: **só quem
      perguntou** marca — não é poder de moderador.
- [ ] `allbook_avisos_curtida_lidos` (`lib/avisosDeCurtida.ts`) — avisos de
      curtida já lidos. ⚠️ Os avisos derivam de curtidas fictícias — em
      produção os ids desta chave não correspondem a nada; morre e renasce.

### Sala ao vivo

- [ ] **`allbook_salas_ao_vivo`** (`lib/salaAoVivo.ts`) — salas que você
      abriu, **suas falas do chat**, o rastro que fica. ⚠️ Regra a honrar:
      sala privada **não** deixa rastro. Salas semeadas andam com o relógio —
      não migrar a simulação.
- [ ] `allbook_sessoes_lembradas` (`lib/salaAoVivo.ts`) — lembretes já
      mostrados. ⚠️ Paliativo da falta de servidor; morre inteira.
- [ ] `allbook_rastro_ligado` (`components/sala/RastroDaSessao.tsx`) — o
      interruptor do rastro. ⚠️ Mora num **componente**, não numa lib — fácil
      de esquecer na varredura.

### Rede, notificações, player, moderação

- [ ] **`allbook_acompanhando`** (`lib/acompanhando.ts`) — autores, narradores,
      editoras e o Studio que você segue. ⚠️ Slugs apontam `people.ts` /
      `publishers.ts`, que são código (2.7); as "novidades" têm data semeada —
      com banco a data vira real.
- [ ] `allbook_system_read` (`lib/notifications.ts`) — avisos de sistema lidos.
      ⚠️ Ids `s1–s3` fixos no código; morre em produção.
- [ ] `allbook_narration_choice` (`lib/narrations.ts`) — a voz escolhida por
      livro. ⚠️ Vira campo do usuário no servidor; `bookId` à mão (2.1).
- [ ] **`allbook_trechos_guardados`** (`lib/trechosGuardados.ts`) — os trechos
      que você cortou, **com nota privada**. ⚠️ A nota é privada por
      construção (`comoCitacao()` a remove) — no banco, a separação vale na
      **API**, não só na tela. Com `allbook_bookmarks`, é texto da pessoa:
      prioridade máxima de sincronização.
- [ ] `allbook_denuncias` (`lib/moderacao.ts`) — o que você denunciou.
      ⚠️ Migrar como denúncia **aberta** com data — vira fila de revisão, não
      um simples "escondido".

### Estado de tela (provavelmente NÃO migra — dizer isso é decisão, não esquecimento)

- [ ] `allbook_library_view` e `allbook_library_sort` (**`pages/Library.tsx`**,
      fora de lib!), `allbook_playing` (sessionStorage), `allbook_ultima_tela`
      (sessionStorage), `allbook_dev_janela` (só DEV). ⚠️ As quatro de
      sessionStorage/DEV morrem com a aba por desenho; as da Biblioteca são
      preferência de aparelho.

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

### 2.2 ✅ Sair não apagava a biblioteca — a inversão ACONTECEU (08/08)

Hoje `signOut` apaga só a sessão, de propósito: os dados são **do navegador**,
não da conta, e apagá-los faria a pessoa perder tudo por ter clicado em "Sair".
Com contas de verdade a lógica se inverte — a biblioteca passa a ser **da
conta**.

- [x] Decidir e implementar a **migração de primeira entrada**: o que estava no
      aparelho sobe para a conta recém-criada, em vez de sumir. **Feito em 08/08
      (§4.121):** `mesclar()` em `lib/sincronizacao.ts`, e ela roda em **toda**
      entrada, não só na primeira — o mesmo problema existe quando alguém usa o
      app deslogado num aparelho e depois entra nele.
- [x] **`signOut` inverteu junto**, como esta seção previa: agora ele apaga do
      navegador o que virou da conta. Deixar seria pior — o próximo a pegar o
      celular veria a biblioteca, as notas e os trechos de quem saiu.
      **`allbook_downloads` continua ficando**: é do aparelho.

### 2.3 ✅ "Esqueci minha senha" foi removido e precisava voltar — RESOLVIDO (08/08)

Este é literalmente o caso que o Matheus temia. O link saiu do Login em 25/07
(ROTEIRO 4.23) porque **não existia senha para recuperar** — `auth.ts` não
guardava senha. Com o servidor de contas ele deixou de ser mentira.

- [x] Recolocar "Esqueci minha senha" no `pages/Login.tsx` junto com o servidor
      de contas. **Feito em 08/08 (§4.120).** Token de uso único, 1 hora de
      prazo, só o resumo do token no banco, e redefinir mata os outros pedidos em
      aberto da conta.
- [ ] ⚠️ **Falta o envio de e-mail.** Hoje o link volta na própria resposta, em
      desenvolvimento, e a tela explica isso. Quando houver serviço de e-mail, é
      só parar de devolver o campo `link` em `/api/contas/esqueci` — o resto já
      está pronto.
- [ ] ⚠️ **Falta limitar tentativas.** Nada impede hoje um robô chutar senha ou
      pedir mil links. Entra junto com o limite de taxa da seção 2.5, que também
      precisa de conta para existir.

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

**⚠️ O áudio nasce em MP3 (confirmado pelo Matheus, 26/07) — e isso está certo,
desde que o mestre seja guardado.** A proteção contra cópia (ver ROTEIRO 4.34)
não muda o que o estúdio entrega: o MP3 é o **arquivo-mestre**, fica guardado e
**nunca é servido**; na ingestão, o `ffmpeg` corta o mesmo áudio nos segmentos
que o app toca.

- [ ] **Guardar sempre o MP3 mestre.** É a única regra irreversível daqui: com o
      original em mãos, o corte pode ser refeito a qualquer momento. O caro é
      perder o mestre, ou construir o player para tocar o MP3 direto — aí o
      formato de entrega vira o de produção.
- [ ] Áudio segmentado (HLS/DASH) gerado na ingestão, nunca um arquivo inteiro
      exposto.
- [ ] URL assinada por sessão, com expiração de minutos.
- [ ] **Limite de taxa por conta** — é a defesa contra raspagem em escala (o
      concorrente baixando o acervo), e é a mais barata das três. Precisa de
      conta de verdade, então nasce junto com o login no servidor.
- [ ] **Vinheta do AllBook** no começo e no fim de cada livro (decisão do
      Matheus, 26/07) — barata, e contra o concorrente ela vale mais do que
      parece: ou ele corta 10 mil arquivos, ou distribui o acervo carimbado com o
      nome do AllBook. Reforço opcional: vinhetas curtas também no meio, em
      posições variáveis.
      - **Colar a vinheta é o MESMO passo que fatiar** — uma chamada de `ffmpeg`
        na ingestão faz as duas coisas: concatena abertura + livro + fecho e já
        corta o resultado em segmentos. Não é um segundo sistema, e ninguém toca
        em arquivo à mão. Com o mestre limpo guardado, trocar a vinheta é rodar o
        script de novo. (`ffmpeg` já está instalado na máquina do Matheus.)
      - **Misturar no áudio, e não deixar como faixa separada na playlist.** Como
        item separado seria fácil de trocar, mas também trivial de descartar por
        quem raspa — e o propósito dela é justamente ser difícil de remover.
      - ⚠️ **A vinheta desloca todo o tempo do livro.** Se a abertura tem 8s,
        cada marcador de capítulo anda 8s, a duração total muda, e **as posições
        já salvas em `allbook_playback` apontam para o lugar errado**. A
        automação tem de recalcular os capítulos **depois** de inserir a vinheta,
        e a conversão das posições antigas entra no mesmo cuidado do item acima
        sobre `allbook_playback`. É o tipo de coisa que não dá erro nenhum — só
        faz todo mundo retomar 8 segundos fora do lugar.
- [ ] Marca d'água por usuário: opcional e para depois. Ela resolve outra coisa
      que a vinheta não resolve — **qual conta** vazou, não qual empresa. Ver a
      comparação no ROTEIRO 4.34.
- [ ] Download offline **só no app**, não no navegador (no navegador o arquivo
      fica no disco da pessoa). Hoje `allbook_downloads` é só uma marca, e
      **nenhum byte é gravado** — não há nada exposto ainda.

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

### 2.8 ✅ `MemStorage` some quando o servidor desliga — RESOLVIDO (08/08)

- [x] Trocar por armazenamento real ligado ao Drizzle antes de qualquer dado de
      usuário passar pelo servidor. **Feito em 08/08 (§4.119):**
      `server/storage.ts` virou `PgStorage`, sobre o Postgres, e nenhum dado de
      usuário chegou a passar pela versão em memória.

### 2.9 ⚠️ O endereço do perfil deriva do nome — com contas, ele precisa congelar

Desde 04/08 a sua página tem endereço público (`/user/<slug>`, função
`meuSlug()` em `lib/profile.ts`) e o botão "Compartilhar" do perfil envia esse
link (ROTEIRO §4.97). O slug é **derivado do nome na hora** — mudou o nome,
mudou o endereço, e todo link já compartilhado morre em silêncio.

- [x] Com contas, o endereço vira coluna própria (username), **escolhido uma vez
      e congelado** — não recalculado do nome. A migração deve gerar o inicial a
      partir do nome com a mesma regra do `meuSlug()` de hoje. **Feito em 08/08
      (§4.120):** `contas.username`, gerado no cadastro pela mesma regra.
- [x] O servidor passa a garantir unicidade (duas pessoas chamadas Matheus não
      podem dividir `/user/matheus`). **Feito:** a coluna é `unique` e o cadastro
      resolve o empate com número (`matheus-2`). Hoje, num empate com um leitor
      fictício, o seu endereço ainda ganha (`UserProfile.tsx` checa você antes de
      `findMember`) — regra que só se sustenta enquanto os fictícios existirem.
- [ ] ⚠️ **`meuSlug()` de `lib/profile.ts` ainda deriva do nome**, e continua
      sendo o que as telas usam — o username do banco só vale para quem tem
      conta. As telas passam a ler o do servidor na etapa 3; até lá, **quem não
      entrou continua com o endereço que muda junto com o nome**.
- [ ] O `@` visível e a busca por pessoas ficaram **de fora desta etapa por
      decisão do Matheus** (§4.97); quando entrarem, o username desta coluna é o
      que a busca indexa.

### 2.10 ⚠️ O seu dado é um REMENDO por cima de ficção que vive no código

> **Esta seção e a 2.11 foram escritas em 08/08 (§4.119).** As duas eram citadas
> **seis vezes** neste arquivo e não existiam: a recontagem de 04/08 prometeu
> escrevê-las e a seção 2 terminava na 2.9. Foram reconstruídas a partir das
> menções e do código.

Quase nada do que a pessoa fez nas telas novas é um objeto completo. É uma
**lista de diferenças** aplicada por cima de conteúdo fixo que mora no código:

| A chave guarda | O alvo dela mora | Exemplo de id |
|---|---|---|
| `allbook_clubes` — entradas, renomeados, removidos, fila | `lib/clubes.ts` | `misterio`, `exorcista` |
| `allbook_grupos_*` — participo, meus tópicos, respostas | `lib/grupos.ts` | `suspense-misterio` |
| `allbook_forum_governanca` — moderadores, banidos, fila | ids semeados de fórum | idem |
| `allbook_comentarios_post` — `postId` | pode ser post do código **ou** seu | os dois convivem |
| `allbook_mural` — mensagens de clube | clubes do código | idem |

**Por que quebra em silêncio:** migrar o remendo antes de o alvo existir no banco
não dá erro nenhum — a linha entra apontando para um clube que não está lá, e a
pessoa simplesmente **não vê mais o clube na lista dela**. Nenhuma tela reclama.

- [ ] **Semear primeiro, remendar depois.** Cada clube, fórum e tópico fictício
      vira linha **antes** de qualquer chave do navegador ser convertida.
- [ ] **Traduzir os ids de texto para os ids do banco**, com uma tabela de-para
      guardada — `misterio` → um `uuid`. Sem ela, a conversão não é repetível: se
      der errado no meio, não há como rodar de novo.
- [ ] **Ids locais `meu-g-<timestamp>`** (fórum criado pela pessoa) precisam
      virar id de servidor pelo mesmo de-para.
- [ ] **Decidir o destino da ficção ANTES** (armadilha 2.4). Se os clubes
      fictícios não vão existir, o remendo que aponta para eles não deve ser
      migrado — e não descobrir isso agora significa migrar lixo.

### 2.11 ⚠️ O dono implícito: "ausente" quer dizer "eu"

Em toda a camada social, **a falta do autor É o autor**:

| Onde | Como está | Significado |
|---|---|---|
| `lib/posts.ts` | `autorSlug?: string` | *"Ausente = você"* |
| `lib/mural.ts` | `MeuPost` não tem autor nenhum | é seu por definição |
| `lib/comentariosDePost.ts` | `autorSlug?` | *"Ausente = você"* |
| `lib/clubes.ts`, `lib/convites.ts` | `donoSlug: EU` | `EU` é uma **constante**, não uma pessoa |
| `lib/forum.ts` | `donoSlug?` | *"Ausente = o dono é quem o esqueleto diz (ou você)"* |

Faz todo o sentido sem contas — só existe uma pessoa neste navegador. Com banco,
`conta_id` é **coluna obrigatória**, e `EU` não é ninguém.

**Por que quebra em silêncio:** uma migração que só copia os campos existentes
grava `NULL` onde deveria ir o seu id. Se a coluna aceitar nulo, os seus posts
viram posts **de ninguém** e somem do seu perfil; se não aceitar, a migração
falha no meio e deixa metade convertida.

- [ ] **Toda leitura de migração precisa receber o id da conta como parâmetro** e
      preencher `autor ?? contaId`. Não é opcional em lugar nenhum.
- [ ] **`EU` vira o id da conta** em clubes, convites e governança de fórum.
- [ ] **Os DOIS formatos de post** (`allbook_posts` e `allbook_mural_posts`)
      passam pela mesma tradução — converter só o novo deixa metade para trás.
- [ ] **Conferir depois de migrar:** nenhum post, comentário, mensagem de clube
      ou resposta de fórum com autor nulo. É uma consulta de uma linha por
      tabela, e é a única prova de que a tradução pegou tudo.

---

## 3. O que só existe com banco (promessas que o app já faz)

O app já promete estas coisas na tela. Nenhuma funciona sem servidor:

- [ ] **Dados que atravessam aparelhos.** Hoje a tela `/help` avisa a pessoa que
      tudo vive naquele celular. Quando o banco entrar, **essa resposta muda** —
      não esqueça de atualizar `pages/Help.tsx`.
- [ ] **Login que verifica de verdade** (hoje qualquer e-mail entra).
- [ ] **Comunidade com gente real** — seguir, ser respondido, ser notificado.
      **A parte de seguidores já tem tela pronta e contrato escrito: ver 3.1.**
- [ ] **Produção de narração sob demanda** — o pipeline do `/request`.
- [ ] **Convite com código de indicação** — hoje o "Convidar amigos" compartilha
      o endereço do site; com contas, vira um link de indicação.

---

## 3.1 Etapa 2 do backend — seguidores e conta privada (construído em 29/07 como maquete)

> **Leia esta seção antes de mexer em qualquer coisa social.** A tela já existe e
> funciona (`/seguidores`, e o interruptor em `Você › Privacidade`), mas **os
> seguidores são fictícios**: vêm de `community.ts`, porque ninguém pode pedir
> para te seguir sem servidor. O que a pessoa faz (aceitar, recusar, remover)
> vale de verdade — o que é fingido é a **origem**, não o efeito.
>
> Decisão de rumo e o porquê de cada regra: **ROTEIRO §4.53 e §4.54**.

**O contrato que o servidor tem de honrar** (é o que a interface já promete):

- [ ] **`seguidores` é uma relação com estado**, não uma lista: `pendente`,
      `aceito`, `recusado`, `removido`. O front já pensa assim
      (`lib/seguidores.ts`), mas guarda só os **seus** lados da relação.
- [ ] **Pedido só existe com a conta privada ligada.** Com conta pública, seguir
      é imediato e não gera pendência — a tela esconde a aba de pedidos, e o
      servidor não deve criar registro `pendente` nesse caso.
- [ ] **Ligar a conta privada não expulsa quem já seguia** (é o que o aviso da
      tela diz, e o que o Instagram faz). Se um dia isso mudar, muda o texto
      junto.
- [ ] **Recusar e remover são silenciosos.** A tela promete, em letras miúdas:
      *"Ninguém é avisado quando você recusa ou remove"*. **Não** mande
      notificação nesses dois casos — mande em "fulano começou a te seguir" e em
      "fulano pediu para te seguir".
- [ ] **Aceitar depois de ter removido volta a valer.** O front já trata
      (`aceitarPedido` limpa o `removidos`); no banco, o estado novo substitui o
      velho em vez de conviver com ele.
- [ ] **A visibilidade da atividade é do servidor, não da tela.** Hoje nada
      esconde de verdade: os fictícios não têm para quem esconder. Com contas, o
      que é de seguidor **não pode sair na API** para quem não é — filtrar no
      front seria vazar e depois esconder.
- [ ] **O post não obedece a essa tranca** (§4.54). Post vai ao feed geral
      mesmo com a conta privada. Só a **atividade** (está ouvindo, comentou,
      avaliou, entrou num clube) é restrita a seguidores.
- [ ] **A conta privada nasce desligada** (`defaultSettings.contaPrivada:
      false`), por decisão do Matheus. Migrar a chave `allbook_settings` junto
      com as outras preferências.
- [ ] **Remover seguidor precisa existir na API desde o primeiro dia.** É a peça
      que só dói depois: sem ela, um "sim" dado às pressas vale para sempre.

**Chave nova no navegador** (soma-se ao inventário da seção 1):
`allbook_seguidores` — `{aceitos[], recusados[], removidos[]}`, slugs de
`community.ts`. **Vira relação entre contas; não migrar como está.**

**Acrescentado em 29/07 (§4.55 do ROTEIRO), e também é contrato:**

- [ ] **O pedido chega como notificação**, com aceitar/recusar no próprio aviso
      (`/notifications`). O servidor precisa emitir dois eventos distintos:
      `pediu_para_seguir` (só com conta privada) e `comecou_a_seguir` (conta
      pública). **Recusar e remover não emitem nada.**
- [ ] **O contador do sino soma os pedidos pendentes.** Hoje o TopNav faz a soma
      no cliente para evitar import circular; com API, é um número só vindo do
      servidor.
- [ ] **Três chaves de vitrine em `allbook_settings`** governam o que a página
      pública mostra: `mostrarOuvindoAgora`, `mostrarMeusComentarios` (novo) e
      `mostrarMeusClubes`. **Elas filtram a API, não a tela** — o mesmo
      raciocínio da atividade: filtrar no front seria mandar e depois esconder.
- [ ] **Não existe chave para "o que eu recomendo"**, por decisão do Matheus
      (recomendar é público por natureza). Não inventar uma no backend.

**Da Comunidade (ROTEIRO §4.53–§4.58), quando ela existir:**

- [ ] **Notificação de interação**: curtiram seu post, comentaram nele,
      responderam ao seu comentário. **Curtidas agrupadas** ("Ana e mais 3") —
      um evento por curtida vira enxurrada e mata o valor do sino.
- [ ] **Post editado guarda o histórico** o bastante para exibir o selo
      "editado". Sem ele, o autor vira o sentido do texto e os comentários
      anteriores ficam sem pé.
- [ ] **Curtir precisa valer no app inteiro** — hoje só a conversa do livro
      usa `reactions.ts`. Ao migrar, a tabela de reações é uma só, com o tipo do
      alvo (comentário · post · resposta de fórum · mensagem de clube).
- [ ] **Presença por capítulo** ("está no cap. 12"), se for construída: opt-in
      **recíproco** (quem não mostra, não vê), só entre quem se segue, **nunca
      em tempo real** — granularidade de capítulo, porque presença ao vivo
      revela rotina.

---

## 4. Ordem sugerida

1. ✅ **Esquema e ingestão do catálogo** (livros, editoras, pessoas, coleções) —
   é a base de tudo e não envolve dado de usuário, então erra barato.
   **Feito em 08/08 (§4.119).** O esquema das *outras* camadas também já está
   desenhado (`shared/schema/`), mas as tabelas delas estão **vazias** e nenhuma
   tela as usa — o que vem abaixo continua todo em aberto.
2. 🔸 **Contas de verdade** — Passport + senha, e a migração de primeira entrada
   (2.2) junto, não depois. Recolocar "Esqueci minha senha" (2.3).
   **Feito em 08/08 (§4.120), MENOS a migração de primeira entrada** — e o desvio
   é consciente: os dados do usuário ainda não têm tabela em uso, então não há
   para onde migrar. Ela entra na etapa 3, **na mesma mudança** que ligar a
   biblioteca ao banco. ⚠️ **É lá que o `signOut` inverte de sentido** (2.2):
   hoje ele não apaga a biblioteca porque ela é *do navegador*; quando for *da
   conta*, apagar passa a ser o certo.
3. 🔸 **Dados do usuário**, na ordem em que doem se sumirem: biblioteca →
   progresso/diário → avaliações → comentários e reações → social.
   **Feito em 08/08 (§4.121) até "avaliações"**, mais as duas chaves de texto da
   pessoa (marcações e trechos), que o inventário marcou como prioridade máxima.
   **Falta:** comentários, reações e a camada social — e elas dependem do item 4
   abaixo, porque hoje conversam com gente que não existe.
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
