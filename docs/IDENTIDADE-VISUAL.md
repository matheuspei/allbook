# AllBook — Identidade visual (seguir à risca)

Saiu do CLAUDE.md em 10/10/2026. Ler antes de criar ou mexer em tela.

**Direção "Estúdio"** (06/08, §4.112): o app parece a cabine onde o livro é
gravado. Fundo grafite quente `#121110`, texto branco-osso `#F5F1EA`, e um
**vermelho de gravação** `#FF4438` que só aparece onde há gravação ou ação —
o botão Pedir, selos, o play. Títulos em **Space Grotesk** (`font-display`),
texto em **Inter**. Cantos `--radius: 0.75rem`, mobile-first. *(O laranja do
Audible e o `#141414` do Netflix saíram justamente por serem dos outros.)*

**São dois temas, e a pessoa escolhe em `/settings`:** "Estúdio" (escuro, o
padrão) e "Tinta" (claro — papel creme `#F4EFE6` e carmim `#C1362F`). Quem
aplica é a classe `.dark` no `<html>`; a lógica está em `lib/tema.ts` e um
script inline no `client/index.html` evita o piscar na abertura.

**A regra de ouro para escrever tela nova: nunca escreva cor literal.**
`bg-[#141414]`, `text-orange-500`, `#f59e0b` — nada disso. Use os tokens
(`bg-background`, `bg-card`, `text-primary`, `border-border`).

**`white` é a cor do texto do tema** (branco-osso no Estúdio, tinta no Tinta),
então `text-white`, `bg-white/10` e `border-white/10` podem ser usados à vontade
— eles se viram sozinhos nos dois temas.

**`black` é preto de verdade**, e serve para uma coisa só: **escurecer**. Véu de
folha (`bg-black/55`), sombra (`shadow-black/40`), degradê sobre capa — tudo isso
escurece nos dois temas, como em qualquer app. *(Ele já foi "a cor do papel", e
o tema claro ficou sem véu, sem sombra e com a capa tomando o fundo — §4.116.)*
Para "texto sobre botão claro" **não** use `text-black`: é
`text-primary-foreground` sobre o vermelho e `text-background` sobre botão
branco.

**Texto por cima de imagem ou de cor viva leva `.sobre-midia` no bloco** — ela
devolve branco puro a tudo que estiver dentro. Se a foto puder ser clara, some
um `<div className="veu-de-midia absolute inset-0" />` entre a imagem e o texto.
⚠️ Dentro de `.sobre-midia` o `--background` **não** muda, de propósito: é o que
deixa o degradê de fusão (`from-background`) continuar valendo lá dentro.

**No fim do `index.css` há a tabela que acerta o tema claro**, e ela faz duas
coisas diferentes: *texto, borda e anel* ganham mais alpha (`text-white/40` vira
53%, para dar o mesmo contraste que 40% dá sobre o grafite); *fundo de
superfície* (`bg-white/5` e afins, até 25%) deixa de ser tinta e vira **branco**
— no claro, papel elevado é papel mais branco, e escurecer o creme dá cinza sujo.
Usou uma opacidade que não está na tabela? Acrescente a linha.

**Pastilha de ícone usa a cor cheia** (`bg-primary text-primary-foreground`), não
`bg-primary/15`: esmaecido vira rosa-bebê sobre papel. Selo com texto continua
esmaecido — se tudo virasse vermelho cheio, a tela viraria semáforo.

⚠️ **Tema claro não é a foto negativa do escuro.** Clarear e escurecer não são
simétricos: o papel tem pouco espaço acima dele e o grafite tem muito. Quando uma
peça "some" no claro, a pergunta não é *quanta* opacidade falta — é **em que
direção** ela deveria se afastar do fundo.

🚨 **`line-clamp-*` define o `display` — nunca escreva `block` ao lado dele**
(31/08, §4.146). O corte por linhas do Tailwind funciona ligando
`display: -webkit-box`; um `block`, `flex` ou `inline-block` na mesma
`className` o desliga **em silêncio**, e o título cresce sem limite. Foi o que
esticou a grade de capas do perfil de pessoa com um título de 10 linhas. O
`truncate` não sofre disso (não mexe em `display`).

⚠️ **Cartão de livro que é `<button>` leva `flex flex-col`.** O navegador
centraliza verticalmente o conteúdo de um botão esticado — e numa grade todas as
células são esticadas até a mais alta —, então a capa do vizinho desce sozinha.
`div` e `<a>` não têm o problema.

Antes de criar tela nova, olhar `Home.tsx` e `BookDetails.tsx` para manter a
mesma cara — e não acrescentar biblioteca de UI nova.

**Conferir tema se faz medindo, não de olho.** Uma captura pequena esconde texto
fraco. Cole `scripts/auditoria-contraste.js` no console do navegador e rode
`auditarContraste()`: ele percorre todo texto visível, compõe as camadas
translúcidas até o fundo real e lista o que está abaixo da régua. O porquê está
na §4.116 do ROTEIRO.
