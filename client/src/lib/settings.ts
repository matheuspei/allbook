/**
 * Preferências do app.
 *
 * Regra desta camada: **só entra aqui o que o app realmente obedece.** Chave que
 * liga e desliga sem mudar nada é enfeite — é o tipo de coisa que dá a "cara de
 * IA" já rejeitada no Perfil, e ainda ensina a pessoa a desconfiar dos botões.
 * Por isso a lista é curta: quando houver áudio e servidor de verdade, ela
 * cresce junto.
 *
 * Mora no `localStorage`, como o resto do protótipo.
 */

const STORAGE_KEY = "allbook_settings";

export interface Settings {
  /** Velocidade com que o player começa. O `AudioPlayer` lê isto ao abrir. */
  speed: number;
  /**
   * A sua página pública pode dizer o que você está ouvindo agora?
   * Pedido do Matheus (28/07): *"tem que ser algo que o usuário tenha que
   * escolher"*. Governa o bloco "Ouvindo agora" E o fundo do topo da página
   * (a capa desfocada também entrega o que está tocando). Ligado por padrão
   * enquanto não há contas — hoje ninguém além de você abre a sua página;
   * quando houver cadastro, a escolha deve virar pergunta do primeiro uso.
   */
  mostrarOuvindoAgora: boolean;
  /**
   * A sua página pública lista os clubes em que você está? Mesmo pedido, na
   * sequência: *"assim também como os clubes… o usuário pode escolher deixar
   * público ou privado"*. Só esconde da vitrine — dentro do clube você
   * continua aparecendo para a turma, que é outro contrato.
   */
  mostrarMeusClubes: boolean;
  /**
   * Conta privada: quem quiser te seguir precisa da **sua** aprovação
   * (ROTEIRO 4.54).
   *
   * **Nasce desligada**, por decisão do Matheus em 29/07: *"o perfil dela já
   * nasce público, e ela tem a opção de privar aquilo caso queira"*. No começo o
   * app precisa de circulação, e quem quer se fechar acha o interruptor.
   *
   * **Não governa o que você escreve.** O post continua indo ao feed geral —
   * escrever já é o ato de tornar público. Isto governa só quem enxerga a sua
   * **atividade** (está ouvindo, comentou, avaliou, entrou num clube).
   */
  contaPrivada: boolean;
  /**
   * A sua página pública mostra **o que você disse** (comentários nos livros e
   * posts do mural)?
   *
   * Pedido do Matheus em 29/07: *"se ela quer que as pessoas vejam o que ela
   * disse"*. Ligado por padrão — quem comenta num livro já está falando em
   * público; o interruptor serve para tirar da **vitrine** o histórico, não para
   * apagar as falas de onde elas foram ditas (dentro do livro elas continuam,
   * que é outro contrato — o mesmo raciocínio de "mostrar meus clubes").
   *
   * **Não existe interruptor para "o que eu recomendo", e é decisão dele:**
   * *"a parte do recomenda a gente pode excluir, porque já que ela está
   * recomendando, ela quer que as pessoas vejam"*. Recomendar é um ato
   * deliberadamente público — esconder seria desfazer o gesto.
   */
  mostrarMeusComentarios: boolean;
  /**
   * **Presença por capítulo** — mostrar em que ponto de um livro você está para
   * quem você segue e que te segue de volta (§4.58, item 8).
   *
   * **Nasce desligada, e isso foi condição.** Eu era contra a peça e perdi o
   * argumento — o mecanismo que o Matheus propôs resolve a privacidade: é
   * **recíproco** (quem não mostra, não vê) e só vale entre quem se segue
   * mutuamente. Mas reciprocidade **pressiona**: quem não liga fica cego. É bom
   * mecanismo e não é neutro, e por isso a escolha de ligar tem de ser um ato,
   * nunca o padrão.
   *
   * **Granularidade grossa, e essa foi a minha condição aceita:** mostra *"está
   * no capítulo 12"*, nunca *"ouvindo agora, neste segundo"*. Entrega quase todo
   * o valor ("tem gente perto de mim neste livro") e tira o que é de fato
   * sensível — presença ao vivo revela **rotina**.
   */
  mostrarMeuCapitulo: boolean;
}

/** Os mesmos degraus oferecidos dentro do player, para não haver duas escalas. */
export const SPEED_PRESETS = [0.7, 1.0, 1.2, 1.5, 1.7, 2.0];

export const defaultSettings: Settings = {
  speed: 1.0,
  mostrarOuvindoAgora: true,
  mostrarMeusClubes: true,
  contaPrivada: false,
  mostrarMeusComentarios: true,
  /* A única que nasce desligada. Ver o comentário do campo. */
  mostrarMeuCapitulo: false,
};

export function readSettings(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return defaultSettings;
    return {
      speed:
        typeof stored.speed === "number" && SPEED_PRESETS.includes(stored.speed)
          ? stored.speed
          : defaultSettings.speed,
      mostrarOuvindoAgora:
        typeof stored.mostrarOuvindoAgora === "boolean"
          ? stored.mostrarOuvindoAgora
          : defaultSettings.mostrarOuvindoAgora,
      mostrarMeuCapitulo:
        typeof stored.mostrarMeuCapitulo === "boolean"
          ? stored.mostrarMeuCapitulo
          : defaultSettings.mostrarMeuCapitulo,
      mostrarMeusClubes:
        typeof stored.mostrarMeusClubes === "boolean"
          ? stored.mostrarMeusClubes
          : defaultSettings.mostrarMeusClubes,
      contaPrivada:
        typeof stored.contaPrivada === "boolean"
          ? stored.contaPrivada
          : defaultSettings.contaPrivada,
      mostrarMeusComentarios:
        typeof stored.mostrarMeusComentarios === "boolean"
          ? stored.mostrarMeusComentarios
          : defaultSettings.mostrarMeusComentarios,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
