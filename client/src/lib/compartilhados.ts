/**
 * Compartilhar um post — **republicar no seu perfil**.
 *
 * Aprovado pelo Matheus na §4.58 (item 3 das oito respostas), junto com curtir e
 * comentar. É a terceira ação do post, e a única que faz o post **viajar**: as
 * outras duas reagem onde ele está.
 *
 * ---
 *
 * **Por que isto é uma lista de ids, e não uma cópia do post.**
 *
 * Copiar o texto para dentro do seu compartilhamento congelaria o original: se
 * o autor editar (e ele pode, §4.58), a sua cópia continuaria mostrando a versão
 * antiga — e o selo "editado", que existe justamente para avisar que o sentido
 * mudou, não apareceria. Guardando só o id, o compartilhamento **acompanha** o
 * post: se ele muda, o que você republicou muda junto; se o autor apaga, o seu
 * compartilhamento some com ele, que é o certo (republicar não dá a você a posse
 * do que o outro escreveu).
 *
 * **Compartilhar post seu não existe.** Não há o que espalhar: ele já está no seu
 * perfil e já está no feed. A tela nem oferece a opção.
 *
 * ⚠️ **Sem servidor, o que você compartilha aparece para você.** Não há como o
 * seu compartilhamento chegar a outra pessoa — a maquete inteira é assim
 * (`community.ts`). O que a comunidade fictícia compartilha está em `posts.ts`,
 * escrito à mão, para a forma existir na tela desde o primeiro dia.
 */

const CHAVE = "allbook_compartilhados";

/** Aviso de que os seus compartilhamentos mudaram — a tela relê sem recarregar. */
export const COMPARTILHADOS_EVENT = "allbook:compartilhados";

export interface Compartilhamento {
  /** O id do post original. É por ele que se acha o conteúdo, sempre atual. */
  postId: string;
  /**
   * Quando **você** compartilhou.
   *
   * É esta data que manda no feed, não a do post original: um post de três dias
   * atrás que você acabou de compartilhar entra no topo, porque o
   * acontecimento novo é o seu gesto. É o que toda plataforma faz, e é o que dá
   * sentido a compartilhar coisa antiga.
   */
  date: string;
}

function ler(): Compartilhamento[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (item): item is Compartilhamento =>
        item && typeof item.postId === "string" && typeof item.date === "string",
    );
  } catch {
    return [];
  }
}

function gravar(lista: Compartilhamento[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(COMPARTILHADOS_EVENT));
}

export function euCompartilhei(postId: string): boolean {
  return ler().some((item) => item.postId === postId);
}

/**
 * Compartilha ou desfaz. Devolve o estado novo, para a tela reagir na hora.
 *
 * **Desfazer existe pelo mesmo motivo que o editar existe:** o gesto é público e
 * pode ser um engano — compartilhar sem poder voltar atrás obrigaria a pessoa a
 * pensar duas vezes antes de um clique que deveria ser leve.
 */
export function alternarCompartilhamento(postId: string): boolean {
  const atual = ler();
  const jaTinha = atual.some((item) => item.postId === postId);
  gravar(
    jaTinha
      ? atual.filter((item) => item.postId !== postId)
      : [...atual, { postId, date: new Date().toISOString() }],
  );
  return !jaTinha;
}

/** Os seus compartilhamentos, do mais recente para o mais antigo. */
export function meusCompartilhamentos(): Compartilhamento[] {
  return ler().sort((a, b) => b.date.localeCompare(a.date));
}
