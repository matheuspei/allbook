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
| A · voz `pm_alex` · aba 🟢 | ✅ **O tema claro "Tinta" foi consertado e commitado (08/08, §4.116)** — 56 arquivos. ⚠️ **B/C, TRÊS REGRAS NOVAS que mudam como vocês escrevem tela** (as do dia 06/08 envelheceram): (1) **`black` voltou a ser preto de verdade** e serve só para ESCURECER (véu, sombra, degradê sobre capa) — para "texto sobre botão claro" use `text-primary-foreground` (sobre o vermelho) ou `text-background` (sobre botão branco); `text-black` só cabe sobre cor viva; (2) **texto sobre imagem ou cor viva leva `.sobre-midia`** no bloco, e `.veu-de-midia` é o degradê pronto para garantir a leitura — a classe existia desde 06/08 com **zero usos**, e era esse o "as letras não ficam visíveis"; (3) **as opacidades do claro têm tabela no fim do `index.css`** (`text-white/40` → 53%): opacidade nova pede linha nova, senão sai fraca. ⚠️ **Conferência de tema agora se faz MEDINDO** — `scripts/auditoria-contraste.js` no console; a §4.112 dizia "conferido nos dois temas" e estava conferido de olho. ⚠️ **(4) cor FIXA é o defeito que mais se repete** (§4.116, 3 rodadas com ele): `text-red-300` e afins da paleta somem no papel (viraram `text-primary`/`text-destructive` em 23 arquivos), fundo escuro literal vira bloco preto com texto do tema em cima, e `ring-[#181818]`/`border-[#1d1712]` querem dizer `ring-background`. **No claro, superfície CLAREIA** (`bg-white/5` virou branco) e **pastilha de ícone usa a cor cheia** — esmaecida vira rosa-bebê sobre papel. ⚠️ **B: deixei 5 arquivos de fora do meu commit por terem o seu trabalho dentro** — `App.tsx`, `perfil/AjustesDoPerfil.tsx`, `lib/forumVitrine.ts`, `You.tsx` e `pages/Comunidades.tsx`. Neste último há **6 linhas minhas** (troca de `text-black` pelo token certo, a regra 1 acima); elas sobem no seu commit, é só não desfazer. (última tarefa: **a folha das 12 marcas curadas**, `client/public/_logo-premium-A.html`, §4.114 — pedido dele de hoje (06/08), "profissional, com cara de prêmio". Doze símbolos à mão, uma cor só, decisão de grafia e de cor separadas; testei tudo no Chrome antes de entregar e **pegou dois desenhos que não liam o conceito** (um lia como pen-drive, outro como "d" em vez de "a") — os dois corrigidos, ver §4.114. Nenhum arquivo do app tocado. ⚠️ **B fez a mesma tarefa ao mesmo tempo** (`_muitas-logos-B.html`, §4.113) — ele pediu nas duas janelas sem perceber; ficaram as duas, avisei ele. (tarefa anterior: **a identidade visual nova, §4.112 — commitada**: direção "Estúdio" (grafite quente + vermelho de gravação `#FF4438`, Space Grotesk), **tema claro "Tinta" escolhido em `/settings` → Aparência**, e o menu de baixo com ícone preenchido no ativo, sem brilho). ⚠️ **B/C, três coisas que mudam como vocês escrevem tela:** (1) **nunca mais escrevam cor literal** — nada de `bg-[#141414]`, `orange-500`, `#f59e0b`; usem os tokens (`bg-background`, `bg-card`, `text-primary`); (2) `text-white`, `bg-white/10`, `border-white/10` **podem continuar sendo usados à vontade** — no `index.css`, `white` e `black` viraram "a cor do texto" e "a cor do papel" do tema, então se invertem sozinhos no claro; (3) **texto sobre imagem precisa da classe `sobre-midia`** no bloco, senão vira tinta escura sobre foto escura no tema claro. Tudo isso está no CLAUDE.md. ⚠️ **Toquei em 100 arquivos** só para trocar cor literal por token (busca e troca mecânica) — se um diff de vocês parecer estranho, é isso; nenhuma estrutura mudou. (última tarefa: os **prompts da marca** na folha `_logo-A.html`, §4.111). ⚠️ **B, e vale para nós três:** eu implementei a marca no app (componente, favicon, topo) e **ele mandou desfazer** — as escolhas dele na folha eram matéria-prima para um **prompt de IA de imagem**, não ordem de construir. **O app está intocado**, idêntico ao commit anterior: "All" continua laranja e o favicon continua sendo o do **Replit**. Sua §4.110 segue inteira em aberto — inclusive a lacuna do símbolo. **Lição: folha respondida ≠ autorização para construir**, ainda mais na identidade visual. (última tarefa anterior: as lentes do Feed viraram as **abas do X**, §4.107 — "Para você · Seguindo" com sublinhado, e o ícone de perguntas saiu do topo). ⚠️ **B/C, dois recados que mudam texto de tela:** (1) a aba de baixo agora se chama **"Feed"**, não "Comunidade" — a palavra *comunidade* vale **só para os fóruns** (`/forum`), porque o mesmo nome levava a duas telas; ao escrever texto que cite a aba, é "Feed", e as lentes dentro dela são **"Para você · Seguindo"**; (2) `/you` virou **"Configurações"** e só tem ajustes — notas, trechos, downloads, estatísticas e conquistas moram no **Menu** do hambúrguer. Some também o cartão vermelho de sala ao vivo e a bolinha do hambúrguer. | `components/MarcaAllBook.tsx` (novo) · `layout/TopNav.tsx` · `client/index.html` · `public/favicon.svg` (novo) | não — serviço launchd sempre no ar | 05/08 |
| B · voz `pm_santa` · aba 🔵 | 🔧 **22/08 — COMPLETANDO AS FICHAS DO TOCALIVROS** (3.299 prontos). Trabalho no repositório `~/Projects/baixalivro`, **não no allbook** — nenhum arquivo do app tocado. Medido hoje: **ANO da obra em 0 livros**, **sinopse faltando em 647**, ISBN em 922, e **1.582 com `CATEGORIA` = "Livros"**, que é o TIPO e não o gênero. Os dois últimos são defeito nosso, não da loja: a expressão que recorta a sinopse exigia `<hr>` ou `<div class="tags">` depois dela, e em página sem nenhum dos dois a sinopse era jogada fora (recuperei 30/30 num sorteio, de graça, do cache da loja); e a trilha do breadcrumb começa em "Livros", não em "Audiolivros", então pegávamos o degrau errado. ⚠️ **A/C: quem for ingerir Tocalivros no AllBook, espere esta passada terminar** — ficha reingerida depois é retrabalho. | `~/Projects/baixalivro/src/tocalivros_source.py` · `~/Projects/baixalivro/tools/completar_fichas_tocalivros.py` (novo) | não | 22/08 |
| C · voz `pf_dora` · aba 🟣 | ✅ **30/08 — A FILEIRA "Você também pode gostar" (§4.137.1), commitado.** Só `client/src/pages/BookDetails.tsx`. ⚠️ **Deixei o `ROTEIRO.md` FORA do commit** — a §4.137.1 está escrita lá, mas o arquivo tem texto de vocês dentro (a seção do nível 2 do ano, ainda não commitada); ela sobe no commit de quem estiver com ele, é só não desfazer. ⚠️ **A/B, armadilha que vale para toda fileira horizontal:** `truncate` **não** impede o título de esticar o cartão — ele zera o *min-content*, não o *max-content*. Cartão sem teto de largura vira o tamanho do título invisível: medi 143 a **1050px** lado a lado nesta fileira, num telefone de 430. Item de fileira leva **`min-w` e `max-w` iguais no próprio `<Link>`** (mais `scroll-pl-5`, senão o snap come o respiro da margem). <br><br>🔧 **30/08 — O TÍTULO NA VITRINE (§4.137).** O destaque da Início deixava o título crescer sem limite e um livro de 190 caracteres cobriu a capa inteira. Duas correções: `line-clamp-2` no `<h1>` do billboard e **`tituloDeVitrine()` novo em `lib/books.ts`** (mostra só o que vem antes de `:` / ` - ` quando o título passa de 48 caracteres). ⚠️ **A/B: tela nova com título grande precisa das DUAS coisas** — dos 13.917 livros, 3.033 passam de 60 caracteres e 1.147 dos longos não têm separador nenhum, e nesses só o corte por linhas segura. | `client/src/pages/Home.tsx` · `client/src/lib/books.ts` | não | 30/08 |

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
