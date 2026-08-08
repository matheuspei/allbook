/**
 * Auditoria de contraste — para conferir tema MEDINDO, e não de olho.
 *
 * Por que existe: em 06/08 o tema claro foi dado como "conferido no navegador,
 * nos dois temas" e estava quebrado (ROTEIRO §4.116) — captura pequena esconde
 * texto fraco, e olho nenhum estima contraste. Este script percorre todo texto
 * visível da tela, **compõe as camadas translúcidas até o fundo real** e calcula
 * a razão de contraste de cada um.
 *
 * Como usar:
 *   1. abra o app no navegador, no tema que quer conferir;
 *   2. cole este arquivo inteiro no console (DevTools → Console);
 *   3. `auditarContraste()` devolve os piores casos.
 *
 * Para comparar os dois temas na mesma tela, sem recarregar:
 *   const claro = auditarContraste();
 *   document.documentElement.classList.add('dark');
 *   const escuro = auditarContraste();
 *
 * ⚠️ Duas armadilhas que já custaram tempo aqui:
 *   • o Chrome serializa as cores do `color-mix` do Tailwind em `oklab()`, e nem
 *     o canvas converte — por isso a conversão está escrita à mão embaixo;
 *   • elementos escondidos fora da tela (o painel do Menu, por exemplo) entram na
 *     conta e aparecem como falso positivo. Confira o caso antes de consertar.
 */

/** Converte qualquer cor computada (`oklab`, `rgb`, `#hex`) para `{rgb, a}`. */
function corParaRgb(valor) {
  const s = (valor || "").trim();
  const n = (s.match(/-?[\d.]+/g) || []).map(Number);
  if (s.startsWith("oklab")) {
    const [L, a, b] = n;
    const alpha = n[3] === undefined ? 1 : n[3];
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const q = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const linear = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * q,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * q,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * q,
    ];
    const gama = (c) => {
      const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
      return Math.min(255, Math.max(0, Math.round(v * 255)));
    };
    return { rgb: linear.map(gama), a: alpha };
  }
  if (s.startsWith("rgb")) return { rgb: [n[0], n[1], n[2]], a: n[3] === undefined ? 1 : n[3] };
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const v = h.length === 3
      ? h.split("").map((c) => parseInt(c + c, 16))
      : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return { rgb: v, a: 1 };
  }
  return null;
}

function auditarContraste({ limite = 12 } = {}) {
  const px = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminancia = ([r, g, b]) =>
    0.2126 * px(r / 255) + 0.7152 * px(g / 255) + 0.0722 * px(b / 255);
  const razaoEntre = (a, b) => {
    const x = luminancia(a) + 0.05;
    const y = luminancia(b) + 0.05;
    return Math.max(x, y) / Math.min(x, y);
  };
  const compor = (frente, fundo) => frente.rgb.map((c, i) => c * frente.a + fundo[i] * (1 - frente.a));

  const escuro = document.documentElement.classList.contains("dark");
  const papel = corParaRgb(escuro ? "#121110" : "#F4EFE6").rgb;

  /** Sobe a árvore empilhando os fundos até achar um opaco. */
  function fundoDe(el) {
    const pilha = [];
    let temImagem = false;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") temImagem = true;
      const c = corParaRgb(cs.backgroundColor);
      if (c && c.a > 0) pilha.push(c);
      if (c && c.a === 1) break;
    }
    let acc = papel;
    for (let i = pilha.length - 1; i >= 0; i--) acc = compor(pilha[i], acc);
    return { fundo: acc, temImagem };
  }

  const achados = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.children.length) continue;            // só as folhas carregam texto
    const texto = el.textContent.trim();
    if (!texto) continue;
    const caixa = el.getBoundingClientRect();
    if (caixa.width < 4 || caixa.height < 4) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity < 0.15) continue;
    const cor = corParaRgb(cs.color);
    if (!cor || cor.a < 0.05) continue;

    const { fundo, temImagem } = fundoDe(el);
    const razao = razaoEntre(compor(cor, fundo), fundo);
    const tamanho = parseFloat(cs.fontSize);
    /* A régua do WCAG AA: 3:1 para texto grande, 4,5:1 para o resto. */
    const minimo = tamanho >= 24 || (tamanho >= 18.66 && +cs.fontWeight >= 700) ? 3 : 4.5;
    if (razao < minimo) {
      achados.push({
        texto: texto.slice(0, 40),
        razao: +razao.toFixed(2),
        minimo,
        tamanho,
        sobreImagem: temImagem,
        classe: (el.className || "").toString().slice(0, 80),
      });
    }
  }
  achados.sort((a, b) => a.razao - b.razao);
  console.table(achados.slice(0, limite));
  return { tema: escuro ? "Estúdio" : "Tinta", abaixoDoMinimo: achados.length, piores: achados.slice(0, limite) };
}
