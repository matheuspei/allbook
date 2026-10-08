# Tarefa: o perfil de UMA pessoa (autor, narrador ou os dois)

Você recebe um nome, os papéis (autor, narrador) e os livros em que ele
aparece no AllBook. Monte o perfil que o ouvinte vê ao tocar no nome: quem é,
uma biografia curta, uma foto e os links.

## Passo 1 — é a pessoa certa? (`identificacao`)

O risco número um é o **homônimo**: a foto e a história de um desconhecido com
o mesmo nome. Antes de usar qualquer página, confira que ela fala de quem
**escreve ou narra** — a própria página precisa dizer isso (a bio do perfil diz
"escritora", "narrador", "locutor", "dublador", cita um livro ou a editora).

- Nome comum (*Ana Silva*, *João Santos*): exija que a página cite **um dos
  livros da lista**, a editora ou o trabalho de narração. Profissão sozinha não
  basta.
- Nome raro: a profissão dita na página basta.
- Em `identificacao.como`, diga o que provou a identidade, com a frase.

Às vezes o nome não é de uma pessoa: uma agência de notícias (Reuters), um
jornal, uma editora, uma produtora, "Diversos", uma voz sintética. Diga isso em
`tipo` e não escreva biografia de pessoa para ele.

## Passo 2 — a apresentação (`apresentacao`) e a biografia (`bio`)

O perfil abre com a **apresentação**: **duas frases, até 35 palavras**, que
dizem quem é a pessoa a quem nunca ouviu falar dela ("Escritor e
empreendedor, vive em São Paulo e trabalha com autoconhecimento desde 2008.
Fundou o Brotherhood e a Escola de Virtudes."). Sem o nome no começo — o nome
já está em cima. A biografia inteira abre num "Ler mais", embaixo.

A **biografia** (`bio`) é o texto do "Ler mais": como um verbete curto de
enciclopédia, em português do Brasil, de **60 a 200 palavras**: quem é, o que faz, de onde é, as obras ou trabalhos mais
conhecidos, prêmios. Tom neutro, sem adjetivo de propaganda.

- **Traga a trajetória, com datas e lugares** (o que o dono do app mais
  valorizou na comparação de 08/10): onde nasceu ou vive, a formação com o
  ano, como e quando começou, os marcos da carreira — tudo o que a própria
  pessoa publica sobre a vida profissional. Havendo material, prefira
  130–200 palavras a um resumo genérico; lista de títulos do catálogo não
  substitui biografia.

- **Só fatos que estão nas fontes**, todas listadas em `bio.provas`.
- **Nada óbvio para um app brasileiro** ("narra em português", "títulos no
  catálogo em português") e **nenhum número de registro** (DRT, OAB, CRM): não
  dizem nada ao ouvinte.
- Pessoa com pouca presença pública: uma ou duas frases bastam ("Narradora
  brasileira, voz de mais de 40 audiolivros"). **Vale mesmo quando a única
  fonte é a página de uma loja** — a loja prova o fato, só o nome dela não
  entra no texto. Bio vazia é só para quando não se sabe nem o que a pessoa
  faz.
- Só a vida profissional. Nada de família, saúde, endereço ou contato pessoal
  de quem não é figura pública.
- Para autor morto há muito tempo, a biografia é a de enciclopédia mesmo.

## Passo 3 — a foto (`foto`)

Uma foto do rosto, de qualquer página pública — Wikipedia e Wikimedia, site
oficial, página da editora ou da loja, entrevista, **ou rede social** —, desde
que a página **prove a identidade** como no passo 1.

- `url_imagem`: o endereço **direto da imagem** (termina em .jpg, .png, .webp
  ou é servido como imagem). Se só achou a página e não o endereço da imagem,
  deixe `url_imagem` vazio e preencha `pagina`.
- `prova_de_identidade`: a frase da página que liga a foto ao escritor ou
  narrador.
- Foto de grupo, logotipo, capa de livro ou desenho não serve como foto de
  pessoa. **Foto de palco ou de longe também não** (a do piloto mostrava o
  pastor pequeno no meio do palco): o app a mostra num círculo de 112 px, e
  ali só um retrato de perto funciona.
- Confira que o endereço é **a imagem**, e não a página que a mostra: no
  piloto, um `.../square.jpg` devolvia uma página HTML.
- **Resolução boa: ao menos 300 px no lado menor.** O app mostra a foto num
  círculo de 112 px em telas que dobram ou triplicam os pixels. Ache a versão
  grande da mesma foto (Goodreads `p8` no lugar de `p5`, LinkedIn `400_400`
  no lugar de `200_200`, YouTube `=s800`).

## Passo 4 — os dados curtos e os canais da pessoa

- `nome_completo`, `nascimento` e `morte` (só o ano), `nacionalidade` — cada um
  com prova, como sempre.
- `links`: **os canais que a própria pessoa mantém, para o ouvinte poder
  acompanhá-la** — site, Substack, Instagram, X, Facebook, YouTube, TikTok,
  LinkedIn, Threads, podcast. Procure **todos**, não pare no primeiro. Cada um
  passa pela mesma prova de identidade da foto: o perfil precisa ser DELA
  (cita os livros, a narração, a editora, ou é o link do site oficial dela).
  **Wikipedia e Wikidata não entram em `links`** (decisão dele, 09/10): o
  AllBook tem a biografia própria; elas servem só de fonte.
- 🚨 **O Instagram é o canal que mais importa** — é o que o ouvinte usa para
  seguir a pessoa. Procure-o com o nome **e a profissão** (`"<nome>" locutor
  instagram`, `… narrador instagram`, `… dublador instagram`, `… escritor
  instagram`) e pelo @ das outras redes. Perder o Instagram é o erro que o
  dono do app mais apontou (Mateus Prado, Pedro Franco, Daniel Vieira da
  Silva).
- **Página que lista os canais e que você aceitou** (Linktree, wiki de
  dublagem, site oficial, descrição do YouTube): **todos** os canais que ela
  lista entram — no 08/10 a Dublapédia do Pedro Franco listava o Instagram
  dele, e ele ficou de fora.
- 🚨 **Nunca e-mail, telefone ou endereço** de pessoa, mesmo que estejam
  públicos — o perfil liga o ouvinte aos canais dela, não aos contatos.

### Como achar os canais — uma busca POR REDE, sempre

No piloto de 05/10 o agente achou só o Substack de um autor que tinha
Instagram, LinkedIn, YouTube e Facebook — todos no primeiro resultado do
Google. Não repita isso:

1. **Faça uma busca para cada rede**, mesmo que a anterior já tenha dado um
   canal: `"<nome>" instagram`, `"<nome>" linkedin`, `"<nome>" youtube`,
   `"<nome>" facebook`, `"<nome>" tiktok`, `"<nome>" twitter OR x.com`,
   `"<nome>" substack OR newsletter OR podcast`, `"<nome>" site oficial`.
   Essas buscas **não contam** no limite de economia das regras gerais.
2. **Procure a página que lista todos de uma vez:** a página "sobre" ou o
   rodapé do site dele, a página de autor da editora, o Linktree, a assinatura
   da newsletter, a descrição do canal do YouTube.
3. **A prova de identidade de um canal pode ser QUALQUER uma destas:**
   - um site ou canal que já é comprovadamente dele aponta para este;
   - o **trecho que a própria busca mostra** do perfil (nome, @ e a bio)
     diz que ele escreve ou narra, ou cita um livro, a editora ou outra marca
     dele (um projeto, uma empresa que ele fundou);
   - a página do canal, quando abre.
4. **Instagram, Facebook e LinkedIn quase nunca abrem para leitura
   automática. Não abrir NÃO é motivo para descartar:** use como prova o
   trecho que a busca mostrou e diga isso em `observacoes`.

Com nome comum, continue exigindo que o trecho ou a página cite um livro, a
editora, a narração ou uma marca dele — profissão sozinha não separa
homônimos.

**Mas some os sinais — cautela demais também é erro** (08/10). No sorteio de
08/10 os dois agentes descartaram o YouTube `@MateusPrado77` como "homônimo da
área de tecnologia" — e a própria biografia do narrador dizia que ele trabalha
com tecnologia e publica audiolivros no YouTube desde 2020, e a descrição do
canal é "Tecnologia e narração". O dono do app achou o canal, o Instagram, o
TikTok, o Substack e o Linktree numa busca simples. Regras:

- Canal com o mesmo nome cuja descrição fala de **narração, locução,
  audiolivro, dublagem ou voz** já cumpre a exigência do nome comum.
- O que a biografia achada diz da pessoa (outra profissão, cidade, projeto)
  também é sinal: um canal com o mesmo nome que fala da mesma coisa **e** de
  narração é dela.
- **Profissão de voz** (locutor, radialista, jornalista de rádio ou TV, ator,
  dublador) com o nome completo igual e conteúdo compatível com o que a pessoa
  narra é dela: quem narra reportagens da Reuters e do Guardian e é jornalista
  de rádio é a mesma pessoa (Daniel Vieira da Silva, 09/10).
- **Canal achado só pelo @ igual** (o programa testa o mesmo apelido em outras
  redes) **não prova nada sozinho**: sem descrição que cite livro, narração,
  editora ou a marca dela, não entra. Em 09/10 entraram por isso um YouTube
  "Doidivana" que não era da Ivana Arruda Leite e um "bookerang" italiano
  parado havia 18 anos.
- Achou um canal provado? Abra-o e procure o **Linktree / página de links**:
  ele costuma listar todos os outros, que então ficam provados por ele.
- **Perfil de anúncio ou de site de freelancer** (99freelas, Workana,
  GetNinjas, Fiverr, Upwork) pode servir de **fonte** para a biografia, mas
  **não é canal** e não entra em `links` — o ouvinte quer seguir a pessoa,
  não contratá-la. Página parada há muitos anos também não é canal.
