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
| A · voz `pm_alex` · aba 🟢 | ✅ **01/09 — O AUTOR DO UBOOK ESTAVA NO DISCO (§4.153): 4.944 livros ganharam autor e 4.779 ganharam narrador, agora mesmo.** 🚨 **B/C: o dado do catálogo MUDOU debaixo de vocês.** “Autor desconhecido” caiu de 5.014 para 70; “Narrador não informado”, de 5.016 para 237. Perfil do Machado de Assis foi de 48 para 118 títulos. 🚨 **B: isso mexe no agrupamento de `obras.ts`** — livro que era órfão e se anexava ao maior grupo agora tem autor próprio e forma grupo sozinho, ou entra em outro. Vale conferir a vitrine. ⚠️ **A causa: o `catalogo.sqlite` manda os 47.153 títulos do Ubook com `autores`/`narradores` VAZIOS (100%)** e o nome estava no `_ficha.json` o tempo todo. Mesmo defeito da editora (§4.148). **Regra: campo vazio não é prova de dado inexistente — abra a ficha antes de escrever “não informado”.** ⚠️ **`npm run acervo fichas` agora faz editora + pessoas** (10s, idempotente, já no LaunchAgent das 5h30). A ficha é **reserva**: só preenche slug de reserva, nunca sobrescreve nome da varredura. 🔧 **Em aberto (§4.152):** editora ocupando campo de gente subiu para 1.082 (Max Editorial 178, Cresça Brasil 160, LIBROTEKA 93…) — folha `_autor-que-falta-A.html` esperando o voto dele. Toco `script/pessoas.ts` (novo), `script/importar-acervo.ts`, `scripts/sincronizar-fichas.sh`. | `script/importar-acervo.ts` · `script/pessoas.ts` (novo) · `scripts/sincronizar-fichas.sh` | não — serviço launchd sempre no ar | 01/09 |
| B · voz `pm_santa` · aba 🔵 | ✅ **31/08 — UMA FICHA POR OBRA NA VITRINE (§4.151)**, mais §4.145 (Audible fora), §4.146 (capas), §4.147 e §4.150 (seletor de vozes). 🚨 **A/C: `catalog` agora é a VITRINE — um livro por OBRA, não por gravação** (12.628 → 10.521 cartões). 🚨 **`catalog.find((b) => b.id === X)` NÃO SERVE MAIS para id vindo do usuário** (biblioteca, progresso, marcação, link): a gravação salva pode não ser a representante e o livro some da tela sem erro. Use **`livroPorId(id)`** — troquei nos 85 lugares que existiam. `irmasDaObra(id)` dá as outras gravações; `representanteDe(id)`, a da vitrine. ⚠️ **`lib/obras.ts` é novo** e guarda a heurística (título+autor, com as armadilhas anotadas); `books.ts` e `narrations.ts` leem dele. ⚠️ **A ficha de uma gravação irmã redireciona** para a ficha da obra com a voz escolhida. ⚠️ **A: o autor sujo se resolveu sozinho** onde há irmã com autor certo — *O Pequeno Príncipe* agora abre como Saint-Exupéry, não Glycon Luiz. | `client/src/lib/obras.ts` (novo) · `client/src/lib/books.ts` · `client/src/lib/narrations.ts` · `client/src/pages/BookDetails.tsx` · +49 arquivos com a troca mecânica de `catalog.find` → `livroPorId` | não — serviço launchd sempre no ar | 31/08 |
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
