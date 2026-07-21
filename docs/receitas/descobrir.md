# AllBook — Receita da tela Descobrir (para colar no Claude Code)

> Abra uma conversa NOVA no Claude Code (dentro do Cursor, na pasta do projeto)
> e cole o texto abaixo.

---

Tarefa: criar a tela DESCOBRIR (rota /discover).

Contexto: o menu inferior (BottomNav) já aponta pra /discover, mas a tela não
existe — hoje o clique não leva a nada. Siga o padrão visual e de código que já
existe em client/src/pages/Home.tsx, BookDetails.tsx e App.tsx. Tema escuro
(#141414), títulos na fonte Outfit (font-display, tracking-tight), texto em Inter,
cor de destaque laranja (~#FF6A00), mobile-first, componentes de components/ui
(shadcn) e ícones lucide-react. NÃO crie backend.

Dados: os livros hoje estão fixos dentro de Home.tsx, e as capas de gênero já
existem (coverScifi, coverRomance, coverHorror, coverMystery, coverBusiness,
coverBiography, coverSelfhelp, coverProductivity). Reutilize esses dados/capas.
Se ajudar, pode extrair a lista de livros para client/src/lib/books.ts e usar nas
duas telas — mas só se não complicar; senão, replique os dados fixos na Descobrir.

Crie client/src/pages/Discover.tsx e registre a rota /discover em App.tsx.
A Descobrir é a tela de EXPLORAR o catálogo (diferente da Início, que é
personalizada). De cima pra baixo:

1) Barra de busca no topo: campo com ícone de lupa (lucide Search), placeholder
   "Buscar títulos, autores...". Reaproveite a MESMA lógica de busca da Home
   (Fuse.js sobre o catálogo fixo) e o mesmo estilo de resultados. Se complicar,
   deixe a busca funcional filtrando o catálogo local.

2) "Navegar por gênero": título (h2) + grade de cartões coloridos, 2 colunas no
   celular, cantos arredondados, no estilo dos categoryCards da Home. 8 gêneros,
   cada um com um gradiente: Ficção Científica, Romance, Terror, Mistério,
   Negócios, Biografia, Autoajuda, Produtividade. Ao tocar num gênero, por
   enquanto filtre e mostre os livros daquele gênero usando os dados fixos.
   Deixe um TODO para a futura rota /category/:genero.

3) "Top 10 da semana": título (h2) + fileira horizontal deslizante (use a classe
   .scrollbar-hide que já existe) com 10 livros numerados (número grande, estilo
   Netflix Top 10). Cada item leva a /book/:id.

4) "Lançamentos": título (h2) + fileira horizontal de capas (mesmo estilo das
   fileiras da Home), ~6-8 livros. Cada um leva a /book/:id.

Regras: não quebre as outras telas; o BottomNav já linka /discover, confirme que
o item fica destacado quando ativo; mantenha a mesma cara das telas existentes.
Ao terminar, faça commit + push com a mensagem "feat: cria tela Descobrir" e me
diga em uma frase o que foi feito. Se faltar alguma decisão de conteúdo/layout que
não está aqui, me pergunte antes em vez de chutar.
