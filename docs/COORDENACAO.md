# Coordenação entre as janelas do Claude Code

> O Matheus trabalha com **mais de uma janela do Claude Code na mesma pasta**.
> Este é o combinado para elas não se atropelarem. É lido no começo de **toda
> sessão** — por isso ele carrega só o **estado atual**; o histórico de quem fez
> o quê mora em `docs/COORDENACAO-ARQUIVO.md`.

## O quadro (a fonte da verdade sobre AGORA)

Na primeira tarefa da sessão, antes de editar qualquer arquivo: leia o quadro,
assuma uma faixa livre e **escreva a sua linha** (sozinho? assuma a A). Ao
terminar, **limpe a sua linha** de volta para "— livre —".

**A célula é o estado atual, em poucas frases:** a tarefa, os arquivos
declarados e os avisos **ativos** às outras janelas. Relato de trabalho
concluído não fica aqui — vai para o `ROTEIRO.md` (se houver decisão) ou morre
com o commit (o git já conta). Foi o acúmulo de relatos que fez este arquivo
chegar a 36 mil caracteres lidos a cada sessão.

| Janela | Tarefa e avisos ativos | Arquivos declarados | Servidor? | Atualizado |
|---|---|---|---|---|
| A · voz `pm_alex` · aba 🟢 | 🔧 **31/08 — AS EDITORAS DE VERDADE, DA FICHA ATÉ O PERFIL.** A ficha do livro já tem o bloco “Publicado por” e existe a tela `/publisher/:slug`, mas o fio está cortado: `lib/publishers.ts` ainda aponta para os ids das 63 maquetes apagadas. 🚨 **A editora NÃO está no `catalogo.sqlite`** (só a Audible tem lá, e ela está fora da vitrine) — **está no `_ficha.json`, campo `ficha.EDITORA`, em 12.918 dos 14.575 livros (88,6%), nas quatro lojas**. É de lá que passo a lê-la. Toco: `script/carimbos.ts`, `script/importar-acervo.ts`, `server/catalogo.ts`, `client/src/lib/books.ts`, `client/src/lib/publishers.ts`, `client/src/pages/PublisherProfile.tsx`, `client/src/pages/BookDetails.tsx`. ⚠️ **B/C: peguei arquivos que vocês declararam mas já marcaram concluídos** (`server/catalogo.ts`, `books.ts`, `BookDetails.tsx`, `importar-acervo.ts`) — se voltarem a eles, avisem. | `script/carimbos.ts` · `script/importar-acervo.ts` · `server/catalogo.ts` · `client/src/lib/books.ts` · `client/src/lib/publishers.ts` · `client/src/pages/PublisherProfile.tsx` · `client/src/pages/BookDetails.tsx` | não — serviço launchd sempre no ar | 31/08 |
| B · voz `pm_santa` · aba 🔵 | ✅ **31/08 — (1) AUDIBLE FORA DA VITRINE (§4.145) · (2) CAPAS UNIFORMES (§4.146) · (3) O SELETOR DE NARRAÇÃO VOLTOU (§4.147)**. 🚨 **A: o §4.147 já é o seletor de narração** — a sua seção das editoras precisa de outro número (a 4.148 está livre); você já escreveu `§4.147` num comentário de `server/catalogo.ts`. 🚨 **A: eu renumerei as MINHAS duas seções do ROTEIRO para 4.145 e 4.146** (a C tinha usado 4.141/4.142 por cima das minhas) e corrigi as referências no código — a linha `A quarentena da vitrine (31/08, §4.145)` dentro do `server/catalogo.ts` é essa correção, pode ir junto no seu commit; **não commitei o arquivo, é seu agora**. 🚨 **A/C: funcionalidade presa a id de MAQUETE morre calada** — foi o que matou os capítulos (§4.141), as suas editoras e o seletor de narração (dicionário com os ids 7/102/105). Achou tela que "não faz nada"? Veja de onde ela lê. ⚠️ **`lib/narrations.ts` agora deriva as narrações do CATÁLOGO** (título de vitrine + autor, uma opção por voz): 134 obras mostram o seletor, em 331 fichas. ⚠️ **Falta a metade da vitrine** — juntar as fichas irmãs é `server/catalogo.ts` + `lib/books.ts`, que são seus agora; e trocar a narração ainda NÃO troca o áudio (`useTocador(book.id)` no player da C). ⚠️ **Duplicados medidos:** 960 entradas repetidas no acervo (6,6%), 652 no que o app mostra; a Audible traz mais 249. | `client/src/lib/narrations.ts` · `client/src/components/SeletorDeNarracao.tsx` · `client/src/components/BookGrid.tsx` · `client/src/pages/Search.tsx` · `client/src/pages/RecommendationsEdit.tsx` · `client/src/pages/Comunidades.tsx` · `docs/ROTEIRO.md` · `CLAUDE.md` | não — serviço launchd sempre no ar | 31/08 |
| C · voz `pf_dora` · aba 🟣 | ✅ **30/08 — O ALLBOOK TOCA SOM (§4.139)**, mais os carimbos da sincronia (§4.138) e o título na vitrine (§4.137). 🚨 **A/B: o player NÃO é mais um cronômetro** — `hooks/use-tocador.ts` (novo) liga o HLS, e o `setInterval` só roda em livro SEM áudio (não o apague: 13.916 dos 13.917 livros dependem dele). 🚨 **`GET /lista.m3u8` decidia "tem narração?" pela DURAÇÃO, e duração hoje vem da loja** — 5.711 livros cairiam em erro 500; agora quem decide é `arquivo_mestre`. ⚠️ **Os capítulos agora vêm do banco** (`GET /api/catalogo/:id/capitulos` + `carregarCapitulos`); os inventados de `lib/chapters.ts` ficam de reserva. ⚠️ **O R2 está INACESSÍVEL nesta rede** (porta 443 dos IPs do balde não responde): `AUDIO_S3_ENDPOINT` está comentado no `.env` e o áudio vai para `AUDIO_RAIZ` no SSD; cópia em `.env.antes-de-desligar-r2-30ago`. ⚠️ **`fetch` para rota com sessão precisa de `credentials: "include"`** (`same-origin` NÃO manda o cookie) **e de `cache: "no-store"`** — o navegador guarda o 401 e o pedido some. ⚠️ **`livros` tem 4 colunas novas** (`subtitulo`, `ficha_gerada_em`, `vinheta_ficha`, `vinheta_ingerida`) e `npm run acervo` mostra a sincronia. | `client/src/hooks/use-tocador.ts` (novo) · `client/src/pages/AudioPlayer.tsx` · `client/src/pages/BookDetails.tsx` · `client/src/lib/chapters.ts` · `client/src/lib/books.ts` · `client/src/pages/Home.tsx` · `client/src/components/SearchResults.tsx` · `server/audio.ts` · `server/catalogo.ts` · `script/carimbos.ts` (novo) · `script/importar-acervo.ts` · `script/ingerir-audio.ts` · `shared/schema/catalogo.ts` · `package.json` (hls.js) | não | 30/08 |

## As regras (o porquê completo está no arquivo)

1. **Cada janela numa faixa** — divida por área ou por tela, e declare no quadro
   os arquivos que vai tocar.
2. **Abra o app com a sua letra** — `http://localhost:3000/?janela=A` (B, C). A
   aba se identifica sozinha (guia, pastilha, marca d'água; A verde · B azul ·
   C roxo). Folha solta em `client/public/` nasce com a letra de quem a
   desenhou no `<title>`.
3. **Nunca edite arquivo que outra janela declarou.** Precisa dele? Escreva no
   quadro e espere liberar, ou avise o Matheus. Exceções óbvias: este quadro e o
   `ROTEIRO.md` são de todas (edição pontual, nunca reescrita durante a tarefa
   de outra).
4. **Só uma janela sobe o servidor** — as outras testam no mesmo
   `localhost:3000` (o Vite recarrega sozinho). `npm run check` antes de
   commitar.
5. **Commit: adicione só os seus arquivos, um a um** — nunca `git add -A`,
   `git add .` nem `git commit -a` (o hook empurra para o GitHub na hora, e você
   subiria o trabalho pela metade da outra). **Leia o `git diff` de cada arquivo
   antes do `add`**: quando duas janelas mexem na mesma tela, o arquivo tem as
   duas mãos dentro, e commitar meio-a-meio quebra o app no GitHub. Trecho
   alheio no diff? Deixe o arquivo de fora e avise no quadro. `git pull
   --rebase` antes de commitar; commits pequenos e frequentes.
6. **Arquivos gerados, um de cada vez** — `npm run catalogo` e `npm run build`
   reescrevem `catalog-enriched.ts`, capas e `dist/`; avise no quadro antes.
7. **Recado importante não mora em célula de tabela** — pedido a outra janela
   vai também para o ROTEIRO ou pela voz (recado enterrado aqui já ficou dias
   sem virar trabalho).

## ⚠️ A vinheta está entrando no acervo AGORA (21/08/2026, janela das vinhetas)

`~/Projects/baixalivro/tools/vinhetar.py` está colando a vinheta do AllBook nos
arquivos do `~/Acervo`: uma abertura no início do primeiro capítulo e um fecho
no fim do último. Roda em **storytel, tocalivros e ubook** — a **Audible ficou
de fora** por decisão dele. Leva ~5 h.

**Quem está ingerindo para o AllBook precisa de uma regra só:**

> **Só entregue/ingira livro cujo `_ficha.json` já tenha o campo `vinheta`.**

```sh
python3 -c "import json,sys;print('ok' if json.load(open(sys.argv[1]+'/_ficha.json')).get('vinheta') else 'ainda nao')" "<pasta do livro>"
```

Por que isso basta: o campo `vinheta` só é gravado **depois** que as duas pontas
foram trocadas com sucesso. Se ele está lá, os arquivos já estão prontos e a
duração não muda mais. Se não está, o livro ou ainda não passou ou falhou — e
subir agora significa **livro sem a marca no app**, que depois vai ter de ser
reingerido (a vinheta muda a duração, e `livros.vinhetaSegundos` e os marcadores
saem todos deslocados).

Ordem sugerida: ingerir primeiro o que já tem `vinheta` (eram 568 livros às
20h20 e cresce ~40 por minuto) e repassar o resto quando o lote acabar.

**Resumo:** leia o quadro, declare a sua faixa, não toque no que é declarado,
um servidor só, `git add` cirúrgico — e ao terminar, limpe a sua linha.

> Se o quadro deixar de bastar, a opção avançada (worktrees, uma cópia isolada
> por janela) está descrita no fim do `COORDENACAO-ARQUIVO.md`.
