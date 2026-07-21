# Próximos passos — como atacar as telas que faltam

_Escrito em 21/07/2026, ao fim da sessão em que a tela Descobrir foi construída.
Serve para a próxima sessão começar sem depender do histórico da conversa._

## A pergunta em aberto

O Matheus quer pedir, numa sessão nova, que **todas as telas que faltam sejam
criadas de uma vez** — navegando pelo app, vendo o que falta e construindo.

## Recomendação: fazer em lotes, não tudo de uma vez

A parte de **navegar e levantar o que falta** é ótima e deve ser feita. O que
não recomendo é **construir as 8 telas numa tacada só**. Três motivos concretos,
todos observados na construção da Descobrir:

1. **Erro visual só aparece olhando.** A Descobrir passou na verificação de
   tipos e compilou — e mesmo assim tinha dois defeitos que só apareceram ao
   abrir no navegador: os números do Top 10 estouravam para fora, e ao escolher
   um gênero a página ficava com o título fora da tela. Nenhum teste pegaria
   isso. Multiplicado por 8 telas sem revisão no meio, os defeitos se acumulam.

2. **Faltam decisões de conteúdo.** A Descobrir só ficou boa porque veio uma
   receita dizendo o que mostrar, em que ordem e quais gêneros. Sem isso, as
   telas viram chute. E algumas são muito mais abertas que a Descobrir:
   - **Perfil:** mostra o quê? Estatísticas de audição? Assinatura? Conquistas?
   - **Configurações:** quais ajustes existem de verdade num app sem backend?
   - **Planos:** quanto custa? Quantos planos? Isso é decisão de negócio.

3. **Commit gigante é difícil de desfazer.** Se 8 telas entram juntas e 3
   ficam ruins, não dá para voltar atrás sem levar as 5 boas junto.

## Plano sugerido

**Passo 1 — Levantamento (rápido, vale fazer):** abrir o app no navegador,
clicar em tudo, listar o que está morto ou quebrado. Gerar um relatório curto.

**Passo 2 — Telas mecânicas, podem ir em lote:** são derivadas do catálogo que
já existe em `client/src/lib/books.ts`, e têm pouca decisão de conteúdo:
- **Categoria / Gênero** (`/category/:genero`) — a Descobrir já filtra por
  gênero; é extrair aquilo para uma rota própria. Tem até um `TODO` no código.
- **Autor / Narrador** — mesma ideia, agrupando por autor.
- **Busca (tela própria)** — a lógica já existe na Home e na Descobrir.
- **Ligar Estatísticas ao menu** — a tela existe, só não está linkada.

**Passo 3 — Telas que precisam de receita, uma por vez:**
- **Perfil** (a próxima da fila oficial)
- **Login / Cadastro**
- **Configurações**
- **Planos / Assinatura**
- **Boas-vindas (onboarding)**

Para essas, o caminho que funcionou foi: o Cowork escreve a receita (ver
`docs/receitas/descobrir.md` como modelo), e ela é executada aqui.

## Achado técnico a verificar no levantamento

O `MiniPlayer` navega para **`/player/current`**. Essa rota casa com
`/player/:id` tendo `id = "current"`, que **não é um id de livro real**. Vale
conferir no navegador o que acontece ao clicar no mini-player — pode estar
abrindo o player sem livro nenhum.

## Estado em 21/07/2026

- Telas prontas: Início, Descobrir, Biblioteca, Estatísticas, Detalhes, Player.
- Falta: Perfil, Login/Cadastro, Configurações, Busca, Categoria, Autor,
  Planos, Onboarding.
- `BookDetails.tsx` ainda tem dados de livros próprios, fora do catálogo
  central — vale unificar quando mexer nele.
