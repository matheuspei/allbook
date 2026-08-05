import { useSyncExternalStore } from "react";

/**
 * O cabeçalho que se esconde ao rolar (§4.106, pedido do Matheus em 05/08).
 *
 * Rolou para baixo, o topo desliza para fora e devolve os 56px à leitura;
 * qualquer rolada para cima — ou chegar perto do topo da página — o traz de
 * volta na hora. O padrão do YouTube e do Instagram, nascido do elogio dele à
 * ficha do livro sem TopNav.
 *
 * É um **estado compartilhado de módulo**, não um estado por componente: o
 * `TopNav` e os sub-cabeçalhos grudados (`PageHeader`, os chips da Biblioteca)
 * precisam se mover **juntos**, no mesmo instante — cada um com o próprio
 * ouvinte poderia divergir por um quadro e abrir fresta. Um ouvinte só no
 * `document`, todo mundo assina o mesmo valor.
 *
 * O ouvinte fica em **fase de captura** porque `scroll` não borbulha: assim
 * vale tanto quando quem rola é a janela (o app de verdade no celular) quanto
 * quando é um contêiner interno — o caso do `DevMobileWrapper`, cuja moldura
 * tem o próprio `overflow`. É o mesmo truque do fundo opaco do TopNav.
 */

/** Quantos px rolados para baixo, somados, antes de esconder. */
const LIMIAR_DE_DESCIDA = 48;
/** Até esta altura o cabeçalho nunca se esconde (a própria altura dele). */
const FAIXA_DO_TOPO = 56;

let recolhido = false;
const assinantes = new Set<() => void>();
/**
 * A última posição vertical de CADA contêiner que rolou. Guardar por
 * contêiner é o que filtra os carrosséis horizontais: neles o `scrollTop`
 * não muda entre um evento e outro, e a barra não pode piscar toda vez que
 * a pessoa passa as capas de lado.
 */
const posicoes = new WeakMap<object, number>();
let descidaAcumulada = 0;

function avisar(valor: boolean) {
  if (valor === recolhido) return;
  recolhido = valor;
  assinantes.forEach((avise) => avise());
}

function aoRolar(evento: Event) {
  const alvo = evento.target;
  const ehContainer = alvo instanceof HTMLElement && alvo !== document.documentElement;
  const y = ehContainer ? alvo.scrollTop : window.scrollY;
  const chave: object = ehContainer ? alvo : window;

  const anterior = posicoes.get(chave);
  posicoes.set(chave, y);
  // Primeiro evento deste contêiner, ou rolagem só horizontal: não conta.
  if (anterior === undefined || anterior === y) return;

  if (y <= FAIXA_DO_TOPO || y < anterior) {
    descidaAcumulada = 0;
    avisar(false);
    return;
  }
  // O limiar acumulado evita o tremor: um dedo parado num touchscreen gera
  // deltas de 1–2px para os dois lados, e sem a soma a barra ia e vinha.
  descidaAcumulada += y - anterior;
  if (descidaAcumulada >= LIMIAR_DE_DESCIDA) avisar(true);
}

function assinar(avise: () => void) {
  assinantes.add(avise);
  if (assinantes.size === 1) {
    document.addEventListener("scroll", aoRolar, { passive: true, capture: true });
  }
  return () => {
    assinantes.delete(avise);
    if (assinantes.size === 0) {
      document.removeEventListener("scroll", aoRolar, { capture: true });
    }
  };
}

/**
 * Traz o cabeçalho de volta por fora da rolagem — na troca de rota e ao
 * fechar a busca ou o Menu. Sem isto, quem fechasse uma sobreposição com a
 * página rolada ficava sem topo até o próximo gesto.
 */
export function mostrarCabecalho() {
  descidaAcumulada = 0;
  avisar(false);
}

/** `true` = o topo está escondido; os grudados em `top-14` vão para `top-0`. */
export function useCabecalhoRecolhido(): boolean {
  return useSyncExternalStore(assinar, () => recolhido);
}
