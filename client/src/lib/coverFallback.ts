/**
 * Capa de reserva tipográfica, gerada como SVG (data URI), para livros sem capa
 * real baixada.
 *
 * Substitui os PNGs genéricos de gênero — que, repetidos em vários livros, davam
 * cara de protótipo ("buraco" preenchido com a mesma imagem). Aqui cada livro
 * sem capa ganha uma capa PRÓPRIA, editorial: título e autor em serifa sobre um
 * fundo sóbrio derivado do gênero, com moldura fina e o selo AllBook. Parece uma
 * capa minimalista de verdade, não um espaço reservado.
 *
 * É um data URI (a imagem vive na própria string), então funciona em qualquer
 * `<img src>` existente sem tocar nas telas.
 */

/** Dois tons escuros por gênero, para o degradê de fundo. Nada de cor vibrante. */
const TONS_POR_GENERO: Record<string, [string, string]> = {
  "Ficção Científica": ["#1a2740", "#0d1526"],
  Romance: ["#3a1f2e", "#20111a"],
  Terror: ["#2a1414", "#140a0a"],
  Mistério: ["#1c2230", "#10141c"],
  Negócios: ["#2a2416", "#16130b"],
  Biografia: ["#1a2622", "#0d1512"],
  Autoajuda: ["#2a1f2e", "#16101a"],
  Produtividade: ["#16262a", "#0b1416"],
};

const TOM_PADRAO: [string, string] = ["#232323", "#141414"];

/** Quebra o título em até 4 linhas curtas para caber na capa. */
function quebrarLinhas(texto: string, maxPorLinha: number): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of texto.split(/\s+/)) {
    if (atual && (atual + " " + palavra).length > maxPorLinha) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = atual ? `${atual} ${palavra}` : palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas.slice(0, 4);
}

/** Escapa o que quebraria o XML do SVG. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function capaTipografica(title: string, author: string, genre: string): string {
  const [topo, base] = TONS_POR_GENERO[genre] ?? TOM_PADRAO;
  const linhas = quebrarLinhas(title, 14);
  const yInicial = 205 - ((linhas.length - 1) * 34) / 2;

  const tituloTspans = linhas
    .map((linha, i) => `<tspan x="150" y="${yInicial + i * 34}">${escapar(linha)}</tspan>`)
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${topo}"/><stop offset="1" stop-color="${base}"/>` +
    `</linearGradient></defs>` +
    `<rect width="300" height="400" fill="url(#bg)"/>` +
    `<rect x="15" y="15" width="270" height="370" rx="6" fill="none" stroke="#ffffff" stroke-opacity="0.14"/>` +
    `<text x="150" y="60" text-anchor="middle" fill="#FF6A00" font-family="Georgia, serif" font-size="12" font-weight="700" letter-spacing="4">ALLBOOK</text>` +
    `<line x1="125" y1="76" x2="175" y2="76" stroke="#FF6A00" stroke-width="2"/>` +
    `<text text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="27" font-weight="700">${tituloTspans}</text>` +
    `<text x="150" y="352" text-anchor="middle" fill="#ffffff" fill-opacity="0.6" font-family="Georgia, serif" font-size="14" font-style="italic">${escapar(author)}</text>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
