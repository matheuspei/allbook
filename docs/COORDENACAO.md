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
| A · voz `pm_alex` · aba 🟢 | 🔧 **23/09 — TÚNEL QUE SE RELIGA (§4.167):** `scripts/tunel.sh` é meu hoje; o túnel está ABERTO com link na mão de alguém de fora — **não rode `fechar`**. O Mac fica acordado enquanto durar. **22/09 — O ÁUDIO NÃO EXIGE MAIS CONTA (§4.166), ordem dele.** 🚨 **B/C: tirei `exigirConta` das quatro rotas de `server/audio.ts`** — quem abre o app, em casa ou pelo túnel, ouve sem entrar. Não a traga de volta: ele disse que a trava nunca foi pedida. A faixa "Entrar" do `AudioPlayer` (caso `precisa-entrar`) ficou inalcançável; não mexi nela porque o arquivo é da B. ⚠️ **Túnel NO AR** (`zsh scripts/tunel.sh situacao`) com um link que ele mandou a alguém de fora — **não o feche** sem ele pedir. 🚨 **A causa dos capítulos fora de ordem já foi consertada no importador** (commit 5934829). | `server/audio.ts` · `scripts/tunel.sh` | não — serviço launchd sempre no ar | 22/09 |
| B · voz `pm_alex` (reservada hoje) · aba 🔵 | 🔧 **21/09 — O PLAYER QUE FINGE TOCAR (§4.162) E O SELETOR DE VOZ.** Assumi `client/src/pages/AudioPlayer.tsx` — a **C o declarou em 31/08 e marcou ✅**, sem limpar a linha; se a C voltar a ele, me avise. Motivo: o Matheus apertou play e não saiu som — o log mostra `/api/contas/eu → {"conta":null}` e **todo `/api/audio/:id/situacao` em 401**, e a tela, em vez do recado, roda o cronômetro de maquete. Estou (1) fazendo a tela ler `tocador.situacao`/`recado` e (2) ligando o áudio ao `narracao.bookId` em vez do id da ficha. 🚨 **A/C: SÉRIE não é livro repetido** — com os autores da §4.153 o meu agrupamento juntou os 15 episódios de *Leia a Bula* numa ficha só. Travado: o pedaço cortado do título decide — adorno descartável (vazio, nome do autor, "na voz de") junta; adorno com conteúdo próprio só junta com outro idêntico. ⚠️ **`lib/obras.ts` agora casa por DUAS chaves** (título da obra e título completo normalizado), que é o que ligava o título estragado do Ubook à irmã boa — depois da §4.156 isso importa menos, mas continua valendo para quem não tiver ficha. ⚠️ **A vitrine tem 10.358 fichas para 12.628 gravações, e 393 obras com 2+ vozes** (eram 145). 🚨 **DECISÃO PENDENTE DO MATHEUS: 89 gêneros na Descobrir, com 12 famílias duplicadas** (Religião e Espiritualidade 1.183 × Religião 953 × Religião & Espiritualidade 507 × Espiritualidade 359; Biografias e Memórias × Biografias; Juvenil × Kids). Juntar exige escolher o nome que sobrevive — nem a A nem eu fizemos sozinhos. ⚠️ **Capítulos genéricos (6.149) NÃO têm conserto**: a loja não deu nome, conferido no disco; herdar da irmã foi descartado (a C achou ficha com duração errada, §4.155). | `client/src/pages/AudioPlayer.tsx` · `client/src/lib/obras.ts` · `client/src/lib/narrations.ts` · `docs/ROTEIRO.md` | não — serviço launchd sempre no ar | 21/09 |
| C · voz `pf_dora` · aba 🟣 | ✅ **31/08 — OS DOIS ANOS DO LIVRO (§4.149)**, já na tela: a linha de cima da ficha diz "obra de 1520" e "áudio de 2010". 🚨 **A/B: `livros.ano` NÃO é o ano da obra** — é a data que a loja anuncia, e **no Ubook é a data da COLETA** (3.497 dos 4.938 em 2026, nos meses do download). Nunca use esse campo como ano de publicação: quem sabe a régua é `client/src/lib/anos.ts` (`anoDaObra`, `anoDaNarracao`). ⚠️ **Duas colunas novas em `livros`: `ano_obra` e `ano_obra_fonte`** (a prova), preenchidas em 1.151 livros por **`npm run anos`** (`script/anos.ts`, novo) lendo `ficha.ANO` do `_ficha.json`. **A importação do acervo não conhece esses campos** — se alguém acrescentar `anoObra` a um `set` do importador, ele apaga o trabalho do agente a cada passada. Rodar `npm run anos` depois de cada leva do agente do ano. ⚠️ **A ficha é montada campo a campo em `buildFromCatalog`** (`BookDetails.tsx`): campo novo no catálogo que não seja copiado ali **some da tela sem erro de tipo** — me custou uma rodada. | `shared/schema/catalogo.ts` · `script/anos.ts` · `client/src/lib/anos.ts` · `server/catalogo.ts` · `client/src/lib/books.ts` · `client/src/pages/BookDetails.tsx` · `client/src/pages/AudioPlayer.tsx` | não | 31/08 |

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
