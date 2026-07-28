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
}

/** Os mesmos degraus oferecidos dentro do player, para não haver duas escalas. */
export const SPEED_PRESETS = [0.7, 1.0, 1.2, 1.5, 1.7, 2.0];

export const defaultSettings: Settings = {
  speed: 1.0,
  mostrarOuvindoAgora: true,
  mostrarMeusClubes: true,
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
      mostrarMeusClubes:
        typeof stored.mostrarMeusClubes === "boolean"
          ? stored.mostrarMeusClubes
          : defaultSettings.mostrarMeusClubes,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** "1.0" → "1x", "1.2" → "1,2x" — como se lê em português. */
export function formatSpeed(speed: number): string {
  return `${String(speed).replace(".", ",").replace(",0", "")}x`;
}
