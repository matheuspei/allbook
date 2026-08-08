import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Guardar e conferir senha.
 *
 * **Nada aqui guarda a senha.** O que vai para o banco é o resultado de um
 * algoritmo que só anda para a frente: dá para conferir se a senha digitada bate,
 * e não dá para voltar do valor guardado para a senha original. É a promessa que
 * `lib/auth.ts` já fazia sem servidor (*"a senha nunca é guardada"*) e que
 * continua valendo agora que existe uma.
 *
 * **Por que `scrypt`, e não uma biblioteca:** ele vem no próprio Node
 * (`node:crypto`), é feito para senha — de propósito lento e pesado de memória,
 * o que encarece o ataque de força bruta — e evita mais uma dependência num
 * projeto que já pediu para não crescer sem motivo.
 *
 * **Cada senha tem o seu sal**, sorteado na hora: sem ele, duas pessoas com a
 * mesma senha teriam o mesmo valor guardado, e quebrar uma quebraria as duas.
 */

const scryptAsync = promisify(scrypt);

/** Tamanho da chave derivada, em bytes. */
const TAMANHO = 64;

export async function cifrar(senha: string): Promise<string> {
  const sal = randomBytes(16).toString("hex");
  const derivada = (await scryptAsync(senha, sal, TAMANHO)) as Buffer;
  return `${derivada.toString("hex")}.${sal}`;
}

/**
 * A senha digitada bate com a guardada?
 *
 * A comparação é `timingSafeEqual`, e não `===`, de propósito: `===` para no
 * primeiro caractere diferente, e **o tempo que ele leva conta quantos
 * caracteres acertaram** — dá para descobrir o valor letra a letra medindo a
 * demora. `timingSafeEqual` leva sempre o mesmo tempo.
 */
export async function conferir(senha: string, guardada: string): Promise<boolean> {
  const [hex, sal] = guardada.split(".");
  if (!hex || !sal) return false;

  const alvo = Buffer.from(hex, "hex");
  const derivada = (await scryptAsync(senha, sal, TAMANHO)) as Buffer;

  // `timingSafeEqual` explode se os tamanhos diferem — conferir antes.
  if (alvo.length !== derivada.length) return false;
  return timingSafeEqual(alvo, derivada);
}

/**
 * Um token de uso único, para o "Esqueci minha senha".
 *
 * Devolve o par: o que vai **no link para a pessoa** e o que vai **para o
 * banco**. São diferentes de propósito — o banco guarda só o resumo, então quem
 * ler o banco não consegue redefinir a senha de ninguém.
 */
export function novoToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: resumoDeToken(token) };
}

export function resumoDeToken(token: string): string {
  // Um resumo simples basta: o token já é aleatório de 256 bits, então não há o
  // que adivinhar — o sal e a lentidão do scrypt existem para senha escolhida
  // por gente, que é curta e previsível.
  return createHash("sha256").update(token).digest("hex");
}
