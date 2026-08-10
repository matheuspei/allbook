/**
 * **Quem segue quem**, entre os leitores da comunidade (§4.94).
 *
 * ---
 *
 * **A pergunta que criou este arquivo** (01/08): *"cliquei no perfil da Juliana e
 * percebi que não consigo ver o número de seguidores dela. Isso é de propósito?"*.
 *
 * Era de propósito, e a razão estava escrita na §4.56 (28/07): *"nenhum número
 * social inventado — a página não mostra seguidores (não há servidor)"*. **A
 * regra envelheceu.** Desde então o app passou a mostrar "você e mais 10
 * gostaram", contagem de comentários, quantos membros tem um clube e quanta
 * gente está ouvindo numa sala ao vivo — todos fictícios, todos semeados. E o
 * **seu** perfil mostra seguidores desde a §4.55, com gente de `community.ts`.
 *
 * Sobrou uma regra que valia só para a página dos outros: você tem seguidores,
 * eles não. É a assimetria que ele viu.
 *
 * ---
 *
 * **Uma relação só, e as duas listas saem dela.** A tentação era escrever
 * `seguidoresDe` e `seguindoDe` separadas, cada uma sorteando gente. Elas se
 * contradiriam na primeira conferência: a Ana apareceria seguindo a Juliana sem
 * a Juliana ter a Ana entre os seguidores. Aqui existe **uma** função —
 * `segue(a, b)` — e as duas listas são filtragens dela.
 *
 * **Assimétrica de propósito.** `segue(a, b)` e `segue(b, a)` são perguntas
 * diferentes, com respostas independentes: seguir de volta é escolha, não regra.
 * Um mundo em que todo mundo se segue de volta não se parece com rede nenhuma.
 *
 * **Você entra na conta de verdade.** Se você segue a Juliana, você **é** um dos
 * seguidores dela — o número sobe na hora em que você toca em "Seguir", e o seu
 * nome aparece no topo da lista. Sem isso, o botão seria um gesto sem efeito
 * visível, que é o defeito que a §4.67 mediu no curtir.
 *
 * ⚠️ **Isto é maquete.** A relação entre dois leitores fictícios é semeada pelos
 * slugs — estável (não dança a cada desenho) e sem nada gravado. O que **você**
 * faz continua em `following.ts` e `seguidores.ts`, que são de verdade dentro da
 * maquete. Quando houver servidor, esta função sai inteira; ver
 * `docs/BANCO-DE-DADOS.md`, "Etapa 2 — seguidores e conta privada".
 */

import { community, type CommunityMember } from "@/lib/community";
import { meusSeguidores } from "@/lib/seguidores";

/** O mesmo semeador do resto do app: número estável a partir de um texto. */
function semear(texto: string): number {
  let n = 0;
  for (let i = 0; i < texto.length; i += 1) n = (n * 31 + texto.charCodeAt(i)) % 99991;
  return n;
}

/**
 * `de` segue `para`?
 *
 * **Cerca de um terço dos pares**, o que dá 7 a 9 seguidores por leitor numa
 * comunidade de 27. Números pequenos são o certo aqui: a comunidade **é**
 * pequena, e um "312 seguidores" ao lado de uma lista de oito nomes é a
 * contradição que se acha em dez segundos.
 */
function segue(de: string, para: string): boolean {
  if (de === para) return false;
  return semear(`${de}>${para}`) % 100 < 32;
}

/** Os leitores do esqueleto que seguem esta pessoa. **Não inclui você.** */
export function seguidoresDe(slug: string): CommunityMember[] {
  return community.filter((membro) => segue(membro.slug, slug));
}

/** Os leitores do esqueleto que esta pessoa segue. **Não inclui você.** */
export function seguindoDe(slug: string): CommunityMember[] {
  return community.filter((membro) => segue(slug, membro.slug));
}

/**
 * Ela te segue?
 *
 * Não é semeado: sai de `seguidores.ts`, que é onde mora a sua lista de
 * seguidores — inclusive quem você aceitou e quem você removeu. Duas respostas
 * para "a Ana Paula me segue?" seria o mesmo defeito que juntou as contagens de
 * comunidade numa fonte só (§4.92).
 */
export function meSegue(slug: string): boolean {
  return meusSeguidores().some((membro) => membro.slug === slug);
}
/** Quantos esta pessoa segue, **contando você** se ela te segue. */
export function totalSeguindo(slug: string): number {
  return seguindoDe(slug).length + (meSegue(slug) ? 1 : 0);
}
