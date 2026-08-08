/**
 * **A assinatura e os créditos de pedido** — o dinheiro do AllBook, do lado de
 * quem usa.
 *
 * ---
 *
 * **De onde saiu.** As quatro decisões da folha `_pedir-sem-credito-A.html`,
 * respondidas pelo Matheus em 08/08 (ROTEIRO §4.118), mais a escada de preços
 * que ele fechou em 26/07. A queixa que abriu tudo: *"se a pessoa não tiver
 * crédito, ela vai ter o trabalho de digitar tudo isso… e no final de tudo só
 * então vai aparecer uma mensagem dizendo 'você não tem crédito'"*.
 *
 * **O que ele escolheu, e é o que este arquivo implementa:**
 * - **1B** — o plano de acesso não dá crédito mensal, mas todo assinante ganha
 *   **um pedido de boas-vindas, uma vez na vida da conta**;
 * - **D** — faltando crédito, a saída é **comprar um pedido avulso na hora**,
 *   sem trocar de assinatura;
 * - **3A** — crédito não usado **acumula, com teto de 3**;
 * - **4B** — a escada tem **três faixas**, com a do meio marcada.
 *
 * ---
 *
 * ⚠️ **O que é de verdade e o que é esqueleto.** Tudo aqui vive no
 * `localStorage`, como a biblioteca e os comentários. **Não há cobrança**: o
 * botão "Assinar" grava o plano no aparelho e pronto — nenhum centavo troca de
 * mãos, nenhum servidor é avisado. Isso não é botão morto, é o mesmo grau de
 * verdade do login (`auth.ts`): o fluxo inteiro funciona, o gateway é que não
 * existe ainda. **Quando o pagamento entrar, é este arquivo que troca de
 * fonte** — a tela não precisa saber.
 *
 * ⚠️ **A recarga mensal é contada pelo relógio do aparelho.** Sem servidor não
 * há "início do ciclo": o que existe é o mês em que o crédito foi creditado
 * pela última vez (`ultimaRecarga`, no formato `AAAA-MM`). Ao ler o estado, se
 * o mês virou, o crédito do plano entra — respeitando o teto. Mexer o relógio
 * do Mac adianta o mês, e isso é aceitável num protótipo; num servidor, não
 * seria.
 */

const STORAGE_KEY = "allbook_assinatura";

/** Avisa a tela que o saldo ou o plano mudou (mesma aba). */
export const ASSINATURA_EVENT = "allbook:assinatura";

/**
 * As três faixas — decisão **4B**.
 *
 * **A quarta faixa (2 pedidos, R$ 69,90) saiu**, e o motivo é de venda, não de
 * preguiça: quatro preços de R$ 20 em R$ 20 viram uma tabela, a pessoa para
 * para fazer conta, e quem para de decidir não assina. O padrão do mundo é
 * bom · melhor · ótimo, com o do meio marcado — a faixa de cima existe em boa
 * medida para fazer a do meio parecer justa. **O preço:** quem queria
 * exatamente dois pedidos paga por três.
 */
export type Plano = "nenhum" | "ouvir" | "pedir" | "pedirMais";

export interface Faixa {
  id: Exclude<Plano, "nenhum">;
  nome: string;
  /** A linha embaixo do nome — o que a faixa entrega. */
  entrega: string;
  /** Em reais, por mês. */
  preco: number;
  /** Quantos pedidos por mês. Zero = nenhum (mas o de boas-vindas vale). */
  creditosPorMes: number;
  /** O rodapé do cartão, quando há algo a dizer (ex.: preço por pedido). */
  nota?: string;
  /** A do meio é a marcada — é ela que a escada quer vender. */
  destaque?: boolean;
}

/**
 * ⚠️ **Os nomes NÃO são os da maquete, e a troca é minha (08/08).** A folha
 * chamava a faixa de cima de **"Sem limite de fila"**, e isso mente: ela dá
 * três livros por mês, que é um limite. Um nome que promete "sem limite" ao
 * lado do número "3" é a primeira coisa que alguém aponta — e a régua dos nomes
 * do app (§4.94) manda escolher o **óbvio** em vez do charmoso. Ficaram
 * "Ouvir", "Ouvir e pedir" e "Ouvir e pedir mais": três degraus que se leem em
 * ordem, e nenhum promete o que não entrega.
 *
 * Os números seguem sendo **"por exemplo"**, palavra dele em 26/07.
 */
export const FAIXAS: Faixa[] = [
  {
    id: "ouvir",
    nome: "Ouvir",
    entrega: "O catálogo inteiro, sem limite de horas",
    preco: 19.9,
    creditosPorMes: 0,
    nota: "Com um pedido de boas-vindas, uma vez",
  },
  {
    id: "pedir",
    nome: "Ouvir e pedir",
    entrega: "1 livro narrado por mês",
    preco: 49.9,
    creditosPorMes: 1,
    nota: "R$ 30 por pedido",
    destaque: true,
  },
  {
    id: "pedirMais",
    nome: "Ouvir e pedir mais",
    entrega: "3 livros narrados por mês",
    preco: 89.9,
    creditosPorMes: 3,
    nota: "R$ 23 por pedido — o mais barato",
  },
];

/**
 * **O teto do acúmulo** — decisão 3A.
 *
 * Três é o número dele. Crédito que vira pó gera raiva por algo que não custou
 * nada ao AllBook; acúmulo infinito cria uma dívida de produção que pode chegar
 * toda no mesmo dia — e a promessa do app é **24 horas**, que é exatamente o
 * que não se cumpre com fila.
 */
export const TETO_DE_CREDITOS = 3;

/**
 * **O pedido avulso** — decisão D.
 *
 * Mais caro que dentro do plano de propósito: R$ 39,90 contra os R$ 30 do plano
 * do meio. É o degrau que empurra para a assinatura em vez de substituí-la.
 */
export const PRECO_AVULSO = 39.9;

export interface Assinatura {
  plano: Plano;
  /** Pedidos guardados. Nunca passa de `TETO_DE_CREDITOS`. */
  creditos: number;
  /**
   * O pedido de boas-vindas ainda está disponível? (decisão 1B)
   *
   * ⚠️ **Nasce `false` e só vira `true` quando a assinatura entra** — nunca no
   * cadastro. A folha nomeou o buraco: sem isso, dá para abusar criando contas.
   * Como é **uma vez na vida da conta**, trocar de plano não o devolve.
   */
  boasVindas: boolean;
  /** Já usou o de boas-vindas alguma vez? Impede que ele volte. */
  boasVindasUsado: boolean;
  /** `AAAA-MM` da última vez que o crédito mensal entrou. */
  ultimaRecarga: string;
}

const PADRAO: Assinatura = {
  plano: "nenhum",
  creditos: 0,
  boasVindas: false,
  boasVindasUsado: false,
  ultimaRecarga: "",
};

function mesDeHoje(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

export function faixaDe(plano: Plano): Faixa | undefined {
  return FAIXAS.find((faixa) => faixa.id === plano);
}

/**
 * O estado da assinatura, **já com a recarga do mês aplicada**.
 *
 * A recarga acontece na leitura, e não num relógio de fundo, pelo mesmo motivo
 * que o resto do app relê o `localStorage` ao montar a tela: não há processo
 * vivo entre uma visita e outra. Quem abre o app no dia 1º recebe o crédito no
 * primeiro `readAssinatura()` — e grava, para não creditar duas vezes.
 */
export function readAssinatura(): Assinatura {
  let estado = PADRAO;
  try {
    const cru = localStorage.getItem(STORAGE_KEY);
    if (cru) estado = { ...PADRAO, ...(JSON.parse(cru) as Partial<Assinatura>) };
  } catch {
    return PADRAO;
  }

  const mes = mesDeHoje();
  const faixa = faixaDe(estado.plano);
  if (!faixa || faixa.creditosPorMes === 0 || estado.ultimaRecarga === mes) return estado;

  /* Mês virado: o crédito do plano entra, e o teto corta o que passar. Nunca
     subtrai — quem já tem 3 e ganha 1 continua com 3, não volta para 1. */
  const recarregado: Assinatura = {
    ...estado,
    creditos: Math.min(TETO_DE_CREDITOS, estado.creditos + faixa.creditosPorMes),
    ultimaRecarga: mes,
  };
  gravar(recarregado);
  return recarregado;
}

function gravar(estado: Assinatura): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    /* Sem espaço ou modo privado: a tela segue com o que tem na memória. */
  }
  window.dispatchEvent(new Event(ASSINATURA_EVENT));
}

/**
 * Assinar (ou trocar de) plano.
 *
 * **O crédito do mês entra na hora**, e não no mês seguinte: quem acabou de
 * pagar por "1 livro por mês" espera poder pedir hoje. **O de boas-vindas entra
 * junto, uma única vez** — inclusive para quem assina só o "Ouvir", que é o
 * ponto inteiro da decisão 1B: a porta laranja do menu funciona pelo menos uma
 * vez para todo assinante.
 */
export function assinar(plano: Exclude<Plano, "nenhum">): Assinatura {
  const atual = readAssinatura();
  const faixa = faixaDe(plano);
  const novo: Assinatura = {
    ...atual,
    plano,
    creditos: Math.min(TETO_DE_CREDITOS, atual.creditos + (faixa?.creditosPorMes ?? 0)),
    boasVindas: atual.boasVindasUsado ? false : true,
    ultimaRecarga: mesDeHoje(),
  };
  gravar(novo);
  return novo;
}

/** Cancelar — o plano cai, e **o que já foi creditado fica**. */
export function cancelar(): Assinatura {
  const atual = readAssinatura();
  const novo: Assinatura = { ...atual, plano: "nenhum", ultimaRecarga: "" };
  gravar(novo);
  return novo;
}

/**
 * Quantos pedidos dá para enviar agora — contando o de boas-vindas.
 *
 * É o número que a tela de Pedir mostra no alto. Zero significa que o botão
 * **não pode dizer "Pedir"**, e é essa a regra que conserta a queixa original.
 */
export function pedidosDisponiveis(): number {
  const estado = readAssinatura();
  return estado.creditos + (estado.boasVindas ? 1 : 0);
}

export function podePedir(): boolean {
  return pedidosDisponiveis() > 0;
}

/**
 * Gasta um pedido. **O de boas-vindas sai primeiro**, de propósito: ele é o que
 * não se recupera, e guardá-lo enquanto se queima crédito mensal deixaria a
 * pessoa com um saldo que ela não sabe explicar.
 *
 * Devolve `false` quando não havia o que gastar — a tela nunca deve chegar
 * aqui, mas um `enviar()` disparado duas vezes chega.
 */
export function consumirPedido(): boolean {
  const estado = readAssinatura();
  if (estado.boasVindas) {
    gravar({ ...estado, boasVindas: false, boasVindasUsado: true });
    return true;
  }
  if (estado.creditos > 0) {
    gravar({ ...estado, creditos: estado.creditos - 1 });
    return true;
  }
  return false;
}

/**
 * Comprar um pedido avulso — decisão **D**.
 *
 * ⚠️ **Exige assinatura ativa, e a regra é minha (08/08).** A folha não tratou
 * o caso de quem não assina nada, e deixar o avulso solto **fura a escada**: um
 * pedido por R$ 39,90 sem assinatura sairia mais barato que o plano do meio
 * (R$ 49,90, que já inclui o acesso), e o degrau de cima perderia a razão de
 * existir. Com assinatura, a conta volta a fechar: R$ 19,90 + R$ 39,90 =
 * R$ 59,90, contra R$ 49,90 do plano — o plano continua ganhando, que é o que
 * a folha queria ("o avulso mais caro empurra para o plano").
 *
 * O crédito comprado **entra como qualquer outro** e respeita o teto: continua
 * valendo a regra do roteiro de 26/07 — *nada de duas moedas*.
 */
export function comprarAvulso(): boolean {
  const estado = readAssinatura();
  if (estado.plano === "nenhum") return false;
  gravar({ ...estado, creditos: Math.min(TETO_DE_CREDITOS, estado.creditos + 1) });
  return true;
}

/** "R$ 49,90" — um lugar só para o formato, para não divergir entre telas. */
export function emReais(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}
