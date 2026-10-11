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
| A · voz `pm_alex` · aba 🟢 | 🔧 **07/10 — O CUSTO DO AGENTE DE ENRIQUECIMENTO (§4.171).** Agora: uma passada só por livro (livro + perfis pendentes), registro de perfis já verificados e um motor barato no lugar do Codex. Em espera: o vídeo dos perfis no app (`_perfis-app-video-A.html`) e, depois dele, banco/importador/telas de perfil. 🚨 **B/C: o mapa rótulo → prateleira mora em `shared/prateleiras.ts`, aplicado na LEITURA** (§4.170). ⚠️ Túnel no ar (não rode `fechar`). 🚨 O áudio não exige conta (§4.166). | `enriquecimento/*` · `script/pacote-enriquecimento.ts` · `client/public/_perfis-app-video-A*` · `client/src/pages/PersonProfile.tsx` · `client/src/pages/PublisherProfile.tsx` | não — serviço launchd sempre no ar | 07/10 |
| B · voz `pm_alex` · aba 🔵 | 🔧 **11/10 — CANAIS E FOTO DOS PERFIS EM CAMADAS (§4.174–4.179).** Passagem `~/AllBook-enriquecimento/passagem-2026-10-10-canais.md`. Feito em 11/10 (§4.179): as três redes vivas de novo (LinkedIn com uma conta antiga dele, login feito por ele); o perfil do LinkedIn é lido no navegador (a página nova só mostra os seguidores depois de carregar); LinkedIn vazio sai só quando já há o verdadeiro com foto (folha `_linkedin-vazio.html`, decisão dele). Antes (§4.177): canal automático do YouTube, Linktree pelo curl, grafia provada pelo texto, e 🚨 **a busca recusa resultado com lixo** (`fala_da_busca` em `leve.py` — D, vale para você também). O código mora fora do repo (`~/AllBook-enriquecimento/teste-motores/canais.py`, `redes.py`); aqui só a folha e o ROTEIRO. ⚠️ A: as instruções do agente de texto mudaram na cópia do pacote `sorteio-2026-10-09/instrucoes-pessoa.md` (bio não repete a apresentação; voz sintética; editora creditada como pessoa; site dedicado) — falta levar para `enriquecimento/instrucoes-pessoa.md`, que é seu. | `client/public/_canais-sorteio*.html` · `client/public/_linkedin-vazio*` · `docs/ROTEIRO.md` (§4.175, §4.177, §4.179) | não | 11/10 |
| C · voz `pf_dora` · aba 🟣 | ✅ **31/08 — OS DOIS ANOS DO LIVRO (§4.149)**, já na tela: a linha de cima da ficha diz "obra de 1520" e "áudio de 2010". 🚨 **A/B: `livros.ano` NÃO é o ano da obra** — é a data que a loja anuncia, e **no Ubook é a data da COLETA** (3.497 dos 4.938 em 2026, nos meses do download). Nunca use esse campo como ano de publicação: quem sabe a régua é `client/src/lib/anos.ts` (`anoDaObra`, `anoDaNarracao`). ⚠️ **Duas colunas novas em `livros`: `ano_obra` e `ano_obra_fonte`** (a prova), preenchidas em 1.151 livros por **`npm run anos`** (`script/anos.ts`, novo) lendo `ficha.ANO` do `_ficha.json`. **A importação do acervo não conhece esses campos** — se alguém acrescentar `anoObra` a um `set` do importador, ele apaga o trabalho do agente a cada passada. Rodar `npm run anos` depois de cada leva do agente do ano. ⚠️ **A ficha é montada campo a campo em `buildFromCatalog`** (`BookDetails.tsx`): campo novo no catálogo que não seja copiado ali **some da tela sem erro de tipo** — me custou uma rodada. | `shared/schema/catalogo.ts` · `script/anos.ts` · `client/src/lib/anos.ts` · `server/catalogo.ts` · `client/src/lib/books.ts` · `client/src/pages/BookDetails.tsx` · `client/src/pages/AudioPlayer.tsx` | não | 31/08 |
| D · voz `pf_dora` | 🔧 **10/10 — CAPAS DA AUDIBLE SEM A FAIXA AMARELA (§4.176).** Janela aberta pela passagem `~/.claude/passagens/2026-10-10-capas-audible.md`. Os 20 do teste foram trocados em 10/10 (`~/AllBook-enriquecimento/capas/trocar.py`, 783 áudios; A arte da guerra com a capa da L&PM, que ele escolheu). **O lote pelo ISBN (`lote_isbn.py`) terminou: 274 dos 604 trocados** (com as provas de capa de outro livro e de fundo posto pela loja); ele conferiu as 274 trocadas, em 5 rodadas (14 erradas, todas desfeitas). **Etapa de outra edição (11/10):** a passada pelo Bing e o `--programa` terminaram; ele conferiu a rodada 7 (44 desfeitas) e escolheu na rodada 2. Hoje: 232 dos 344 sem a faixa, 112 ainda com ela. Ele recusou a faixa apagada pelo LaMa (e a marca "audible ORIGINAL" também não serve) e pediu capa real da Amazon: o `amazon_busca.py` buscou os 112 (o Kindle ou impresso agrupado com o audiolivro) e eu conferi a olho (`lote/minhas-amazon.json`): 62 servem, 50 não têm capa (43 originais da Audible). **Esperando ele: a folha `_capas-edicao-D.html` (rodada 3, 60 livros).** Quando responder: `aplicar_edicao.py --rodada 3`. Não rode `aplicar_apagar.py` (faixa apagada é último recurso). A régua nova não põe sozinha capa da busca de imagens (errou 29 de 33). ⚠️ **O lote tem trava (`lote/rodando.trava`): para parar, mate o processo do Python, não o shell** — em 10/10 dois rodaram juntos e estragaram um áudio de *Os judeus* (consertado; ver §4.176). A troca muda três lugares: `capa.jpg` do pronto, `covr` dos `.m4a` e `~/AllBook-capas`. A original fica guardada em `capa-com-faixa.jpg`, e a Audible continua fora da vitrine. **A capa em pé no tocador saiu daqui:** a passagem `~/.claude/passagens/2026-10-10-capa-inteira-no-tocador.md` é para outra janela levar a ele num vídeo. ⚠️ **B: a busca padrão do `ddgs` devolve lixo ou "No results found" (10/10), mas `DDGS().text(..., backend="bing")` e `.images(..., backend="bing")` respondem bem com 20 s entre as buscas** — as duas janelas dividem a mesma cota. Detectar a tarja "Exclusivo audible", achar capa igual sem ela e com resolução boa, e levar isso para a passada do agente de livro. ⚠️ Código novo em `~/AllBook-enriquecimento/capas/` (fora do repo): **não edite** `teste-motores/leve.py`, `canais.py` nem `redes.py` (B) nem `enriquecimento/*` (A) — importe ou combine aqui. | `~/AllBook-enriquecimento/capas/*` · `client/public/_capas-*.html` · `client/public/_previa-capas-D*` · `docs/ROTEIRO.md` (§4.176) | não | 11/10 |

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
