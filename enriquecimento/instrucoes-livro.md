# Tarefa: a ficha de UM livro

Você recebe um audiolivro como as lojas o descrevem: título, autores,
narradores, editora, loja, página da loja, sinopse, data da loja. Devolva os
campos abaixo.

## Passo 1 — identifique a obra (`obra_identificada`)

Antes de qualquer ano, diga em uma ou duas frases **que obra é esta**: quem
escreveu, se é um texto original ou tradução, se é a obra inteira, uma
adaptação, um resumo, um trecho, uma coletânea, uma pregação, uma aula. Tudo o
que vem depois depende disso.

- `tipo`: o que é o conteúdo (livro, coletânea, pregação ou palestra, curso,
  programa ou podcast, notícia ou documentário, meditação ou sons, outro).
- `edicao`: integral, adaptada (recontada para criança, simplificada),
  resumida, trecho (uma parte, um capítulo, "Parte 4") ou não sei. O campo
  `integral` da loja ajuda, mas a loja às vezes chama de integral a adaptação.

## Passo 2 — os dois anos, que são coisas DIFERENTES

**`ano_obra` — o ano em que a OBRA saiu pela primeira vez**, em qualquer
idioma. É o ano do texto, não desta gravação nem desta edição.

- Tradução → o ano da obra original. *O Pequeno Príncipe* é 1943, mesmo que a
  tradução brasileira seja de 2015.
- Saiu primeiro em jornal ou revista (folhetim) → o ano em que saiu **em
  livro**; mencione o folhetim na `nota`.
- Escrita num ano e publicada em outro → o ano da **publicação**.
- **Coletânea moderna de textos antigos** (contos de vários anos reunidos por
  uma editora agora) → o ano de UM dos textos não é o ano da coletânea. Só vale
  o ano em que esta coletânea saiu como livro; se ela só existe em áudio, vazio.
- **Adaptação ou resumo** de uma obra → o ano da adaptação, se houver prova; o
  ano da obra original vai na `nota`, não no valor.
- Pregação, palestra, aula, programa de rádio, podcast, livro da Bíblia → em
  geral vazio. Só preencha se o texto foi publicado como livro, com prova.

**`ano_audio` — o ano em que ESTA gravação foi lançada** (este narrador, esta
produção). Vem da página da loja, da produtora ou da editora do áudio.

- O dado `ano_na_loja` da entrada é uma pista. ⚠️ No **Ubook** ele é a data em
  que o livro foi coletado (quase sempre 2026), e por isso não serve. Na
  Storytel e na Audible costuma estar certo.
- O mesmo título gravado por outro narrador é outra gravação, com outro ano.

### As armadilhas que já aconteceram (não repita)

- **Entidade errada:** *A Batalha dos Livros* de Raul Pompeia recebeu 1704,
  que é o livro de Jonathan Swift com o mesmo nome; o conto *O Espelho*, de
  Machado de Assis, recebeu 1660, de outro livro chamado *Martyrs Mirror*.
  Confira **autor e título** na fonte, sempre.
- **Ano de nascimento do autor:** *Dom Quixote* recebeu 1547, que é quando
  Cervantes nasceu. A obra é de 1605.
- **Ano da edição:** *O Patinho Feio* recebeu 2013, "confirmado" por Open
  Library e Internet Archive. As duas mostravam a edição; o conto é de 1843.
- **Ano do audiolivro como ano da obra:** a página da loja diz quando o
  ÁUDIO saiu, nunca quando o texto saiu.
- **Tradução como obra:** *Josué* (livro da Bíblia) recebeu 2002, que é o ano
  de uma tradução da Bíblia.
- **Um texto da coletânea:** *Treze lendas dos Mythos de Cthulhu* recebeu
  1928, ano de um dos treze contos.

### As checagens antes de responder

- `ano_obra` não pode ser depois de `ano_audio`.
- `ano_obra` tem de caber na vida do autor (se for póstumo, diga na nota).
- Se duas fontes boas discordam, explique na nota e escolha a que fala da
  **primeira publicação**; se não der para decidir, deixe vazio.
- Para `ano_obra`, procure **duas fontes independentes** quando a obra for
  conhecida. Uma basta para obra pequena, se a fonte for a editora ou o autor.

## Passo 3 — os créditos e o resto

- `autores` e `narradores`: a lista **completa e correta** de nomes, como a
  pessoa assina. Preencha sempre que a entrada vier com "Autor desconhecido",
  "Narrador não informado", com o nome de uma empresa no lugar de gente, ou com
  o nome invertido. Se a entrada já está certa, repita-a com a prova da
  página da loja.
- `tradutores`: quem traduziu o texto que é lido nesta gravação, se for
  tradução.
- `titulo_original` e `idioma_original`: para tradução, o título e o idioma
  da obra original (idioma em código de duas letras: `en`, `fr`, `es`, `pt`).
  Obra escrita em português: título original igual ao título e idioma `pt`.
- `serie`: se a obra faz parte de uma série ou coleção numerada, o nome da
  série e o número deste volume (*Harry Potter*, 1). Coleção de editora sem
  ordem de leitura (ex.: "Clássicos Zahar") não é série.
- `idade`: só para livro infantil ou juvenil — a faixa de quem ouve (0-4,
  5-8, 9-12, 13-17). Livro para adulto: `adulto`. Sem como saber: vazio.
- `prateleira`: a prateleira do AllBook onde o livro deve morar, da lista
  abaixo, com o motivo em uma frase.

### As prateleiras do AllBook

{{PRATELEIRAS}}

⚠️ **Ficção × Literatura — regra PROVISÓRIA, em teste.** Use
**Clássicos** para obra antiga e consagrada (em geral de autor já morto há
décadas). Entre as outras obras de ficção que não cabem numa prateleira de
gênero (Romance, Fantasia e Ficção Científica, Suspense, Contos e Crônicas,
Poesia e Teatro): **Literatura** para obra com reconhecimento literário (prêmio
literário, estudo na escola ou na universidade, autor tratado pela crítica como
escritor literário); **Ficção** para ficção de entretenimento, comercial ou de
autor sem esse reconhecimento. Diga no `motivo` qual sinal você usou.
