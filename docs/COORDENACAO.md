# Coordenação entre duas janelas do Claude Code

> **Por que este arquivo existe.** O Matheus costuma trabalhar com **duas janelas
> do Claude Code abertas ao mesmo tempo, na mesma pasta do projeto**. Como as duas
> mexem nos mesmos arquivos e no mesmo git, elas podem se atropelar: uma edita o
> que a outra está escrevendo, as duas sobem o servidor na mesma porta, ou uma faz
> commit levando junto o trabalho pela metade da outra. Este documento é o
> **combinado** que as duas seguem para isso não acontecer. Ele é lido no começo de
> cada sessão (o `CLAUDE.md` aponta para cá).

---

## O quadro de trabalho (leia e atualize sempre)

**A janela se registra sozinha — o Matheus não cola frase nenhuma.** Na primeira
tarefa de cada sessão, antes de mexer em qualquer arquivo, **leia a tabela abaixo**,
veja qual faixa está livre e **escreva a sua linha** assumindo essa faixa. Se as
duas estiverem livres, pegue a que combina com a tarefa pedida; se você é a única
janela aberta, assuma a Janela A. Ao terminar ou trocar de tarefa, **limpe a sua
linha** (volte para "— livre —"). O quadro é a fonte da verdade sobre quem está com
o quê **agora**.

| Janela | Faixa (área que vai tocar) | Arquivos/pasta em uso | Está rodando o servidor? | Atualizado |
|--------|-----------------------------|-----------------------|--------------------------|------------|
| A | — livre — (27/07, tudo commitado: selo/marca d'água da janela na prévia, ver 1.1 abaixo. Antes: "Detalhes do título" saiu do menu do player, porque tocar no título já abre a ficha (ROTEIRO 4.38); e o "está tocando" virou um só para player e barrinha — sair do player não parece mais parar a audição. `AudioPlayer.tsx`, `MiniPlayer.tsx`, `playback.ts` e `BookDetails.tsx` **liberados**.) Aba `🟢 JANELA A` | — | não — serviço launchd sempre no ar (escutando na **rede local**; `HOST=127.0.0.1` fecha) | 27/07 |
| B | — livre — (26/07, tudo commitado: Descobrir fundida na Buscar/Catálogo (4.32); proteção do áudio registrada (4.34); aberturas animadas adiadas para depois do backend (4.35); "Histórico de escuta" do player virou **"Meu ritmo neste livro"**, com previsão de término em conta única com as Estatísticas (4.36). `AudioPlayer.tsx` **devolvido**.) Aba `🔵 JANELA B` | — | não — serviço launchd sempre no ar | 27/07 |
| C | — livre — (26/07: o botão "Categorias" da Início passou a expandir a lista de gêneros — ver ROTEIRO 4.27, que também deixa em aberto o destino da tela Descobrir) | — | não — serviço launchd sempre no ar | 26/07 |

> Use "Janela A" e "Janela B" só como apelido. Se abrir uma terceira, acrescente a
> linha "C". A hora ("Atualizado") ajuda a saber se uma linha ficou esquecida —
> linha velha de horas atrás pode ser limpa.

---

## As regras

### 1. Cada janela numa faixa diferente
O jeito mais seguro de não colidir é **não trabalhar no mesmo lugar**. Divida por
área. Divisão sugerida (ajuste conforme a tarefa, mas registre no quadro):

- **Faixa da tela / frontend** → `client/` (as telas, componentes, estilos).
- **Faixa de dados / servidor** → `server/`, `shared/`, `script/`.

Se as duas precisam mexer em telas ao mesmo tempo, divida por **tela**: uma janela
na tela Descobrir, outra no Perfil — e cada uma declara no quadro os arquivos dela.

### 1.1 Abra o app com a sua letra: `?janela=A`

Todas as abas do Chrome se chamavam "localhost" e mostravam a mesma tela — não
dava para saber qual janela do Claude tinha aberto qual aba. Desde 27/07 o
próprio app resolve isso: **abra `http://localhost:3000/?janela=A`** (ou `B`, ou
`C`) e aquela aba passa a se identificar em três lugares:

- o **nome da guia** vira `🟢 JANELA A — AllBook`;
- uma **pastilha colorida** aparece na barra de desenvolvimento, no alto;
- uma **marca d'água** grande fica no fundo, ao lado da moldura do telefone.

Cores: **A verde · B azul · C roxo**. A letra fica guardada no `sessionStorage`,
que é por aba — sobrevive a recarregar e a navegar pelo app, e **não** contamina
as outras abas. Só passe o `?janela=` uma vez, na primeira abertura.

Nada disso aparece no app publicado nem no celular (é `import.meta.env.DEV`), e
nenhuma das marcas encosta na tela do app — todas vivem na área de
desenvolvimento em volta. Código em `client/src/components/DevJanela.tsx`.

### 2. Nunca edite um arquivo que a outra janela declarou
Se o arquivo que você precisa está na faixa da outra janela, **não edite por cima**.
Opções, nesta ordem: (a) faça a sua parte em outro arquivo; (b) escreva no quadro
que você precisa daquele arquivo e espere a outra liberar; (c) se for urgente,
avise o Matheus para ele coordenar. O que **não** pode é as duas salvarem o mesmo
arquivo sem saber uma da outra — foi assim que o conflito aconteceu.

### 3. Só uma janela roda o servidor (porta 3000) — mas as duas verificam nele
`npm run dev` e `npm run dev:client` ocupam a porta 3000. **Só uma janela sobe o
servidor** — marque "sim" na coluna do quadro. Se as duas subirem, a segunda dá
erro de porta ocupada ou rouba a porta da primeira.

**Isso não impede a outra janela de testar.** O servidor do Vite recarrega o app
sozinho a cada arquivo salvo (hot-reload), então **as duas janelas verificam no
mesmo app rodando** — basta abrir `http://localhost:3000` no navegador (ferramentas
Claude-in-Chrome) e conferir a própria mudança ali. Quem não subiu o servidor
**não liga um segundo**; apenas olha o app que já está no ar. O Matheus costuma
deixar o app aberto no Chrome dele na porta 3000 — dá para testar direto nele.

Além do teste visual, use `npm run check` (verifica tipos, não precisa de porta)
antes de commitar.

### 4. Commit e push com cuidado — o hook empurra sozinho
O hook `post-commit` faz **push automático para o GitHub a cada commit**. Com duas
janelas isso exige disciplina, senão vira bagunça:

- **Nunca use `git add -A`, `git add .` ou `git commit -a`.** Eles varrem *tudo* que
  mudou na pasta — inclusive o trabalho pela metade da outra janela — e sobem junto.
  **Adicione só os arquivos da sua faixa, um a um:** `git add client/src/pages/Perfil.tsx`.
- **Escolher o arquivo certo não basta: leia o `git diff` dele antes de adicionar.**
  Armadilha real, em 26/07: o `AudioPlayer.tsx` estava na faixa B, mas **dentro do
  mesmo arquivo** havia trechos da janela A (um componente novo que ela ainda não
  tinha adicionado ao git). Commitar aquele arquivo teria subido a chamada do
  componente **sem o componente** — app quebrado no GitHub, e a culpa apareceria na
  janela errada. Git separa por arquivo, não por trecho; quando duas janelas mexem na
  mesma tela, o arquivo é território comum. **O que fazer:** rodar
  `git diff <arquivo>` e conferir se cada bloco é seu. Se houver trecho alheio, deixe
  o arquivo de fora, commite o resto, e **escreva no quadro** que aquele arquivo tem
  as duas mãos dentro — a outra janela commita o conjunto inteiro e o seu trecho vai
  junto (foi o que aconteceu; conferido depois no histórico).
- **Antes de commitar, traga o que a outra já subiu:** `git pull --rebase`. Isso
  evita o push ser recusado por a outra janela ter publicado antes de você.
- **Commits pequenos e frequentes.** Quanto menor a janela de tempo entre editar e
  commitar, menor a chance de as duas baterem.
- **Avise no quadro** (ou pela voz) quando for commitar, para a outra não commitar no
  mesmo instante.

### 5. Arquivos gerados e scripts pesados — um de cada vez
`npm run catalogo` e `npm run build` reescrevem arquivos gerados
(`client/src/lib/catalog-enriched.ts`, capas, `dist/`). **Só uma janela roda esses
por vez** — avise no quadro antes. Duas rodando ao mesmo tempo corrompem a saída.

### 6. Ao terminar, limpe a sua linha
Acabou a tarefa ou vai trocar de assunto? Volte a sua linha do quadro para
"— livre —". Linha esquecida faz a outra janela achar que uma área está travada
quando não está.

---

## Resumo em uma frase
**Leia o quadro, escolha uma faixa só sua, não edite o que a outra declarou, só uma
sobe o servidor, e no commit adicione apenas os seus arquivos (nunca `git add -A`).**

---

## Se isto ainda não bastar (opção avançada: worktrees)
Se mesmo assim as janelas se atrapalharem muito, o passo seguinte é dar a **cada
janela a sua própria cópia isolada** do projeto com `git worktree` — aí elas nem
enxergam os arquivos uma da outra, e só se encontram na hora de juntar no GitHub. É
mais robusto, porém mais complexo (pastas separadas, juntar branches depois). Peça
ao Claude para montar isso **só se o quadro acima não resolver** — para o uso do dia
a dia, o combinado deste arquivo costuma bastar.
