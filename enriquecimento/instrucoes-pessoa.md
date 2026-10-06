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

- **Só fatos que estão nas fontes**, todas listadas em `bio.provas`.
- Pessoa com pouca presença pública: uma ou duas frases bastam ("Narradora
  brasileira, voz de mais de 40 audiolivros da Tocalivros"). Sem nada achado:
  `texto: null`.
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
  pessoa.

## Passo 4 — os dados curtos e os canais da pessoa

- `nome_completo`, `nascimento` e `morte` (só o ano), `nacionalidade` — cada um
  com prova, como sempre.
- `links`: **os canais que a própria pessoa mantém, para o ouvinte poder
  acompanhá-la** — site, Substack, Instagram, X, Facebook, YouTube, TikTok,
  LinkedIn, Threads, podcast. Procure **todos**, não pare no primeiro. Cada um
  passa pela mesma prova de identidade da foto: o perfil precisa ser DELA
  (cita os livros, a narração, a editora, ou é o link do site oficial dela).
  Wikipedia e Wikidata também entram, como "saiba mais".
- 🚨 **Nunca e-mail, telefone ou endereço** de pessoa, mesmo que estejam
  públicos — o perfil liga o ouvinte aos canais dela, não aos contatos.
