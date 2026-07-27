/**
 * Denunciar um comentário — o começo da moderação.
 *
 * **Por que entra agora, antes de haver gente de verdade.** O Matheus foi
 * direto: moderação é a peça principal do clube, não um acabamento. E a sala do
 * livro tem um risco próprio — quem estraga o final de um livro para outra
 * pessoa não é "conteúdo ofensivo", é dano ao produto. Sem um jeito de dizer
 * "isto aqui é spoiler", a trava de âncora sozinha não basta (ROTEIRO 4.39).
 *
 * **O que isto faz hoje, com honestidade:** esconde o comentário **para você**,
 * na hora, e guarda o registro no navegador. Não existe fila de revisão porque
 * não existe servidor — e prometer "um moderador vai analisar" seria mentira do
 * tipo que o app já varreu em outros cantos (ROTEIRO 4.23). A tela diz
 * exatamente isso.
 *
 * **O que muda quando houver servidor:** `denunciar` vira um POST, a lista de
 * denúncias vira fila, e ganham corpo os poderes de moderador que já estão
 * decididos — marcar spoiler no comentário alheio, esconder, silenciar. A
 * assinatura destas funções não precisa mudar.
 */

const CHAVE = "allbook_denuncias";

/** Avisa as telas de que a lista mudou (o mesmo padrão do resto da casa). */
export const MODERACAO_EVENT = "allbook:moderacao";

export type MotivoDaDenuncia = "spoiler" | "ofensa" | "outro";

export interface Denuncia {
  /** Id do comentário — de `comments.ts` ou dos seus, em `myComments.ts`. */
  commentId: string;
  motivo: MotivoDaDenuncia;
  /** ISO. Quando houver servidor, é o carimbo que a fila ordena. */
  date: string;
}

export function readDenuncias(): Denuncia[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (item): item is Denuncia =>
        item && typeof item.commentId === "string" && typeof item.date === "string",
    );
  } catch {
    return [];
  }
}

/** Os ids escondidos — o que a sala precisa saber para não desenhar. */
export function idsEscondidos(): Set<string> {
  return new Set(readDenuncias().map((item) => item.commentId));
}

export function foiDenunciado(commentId: string): boolean {
  return readDenuncias().some((item) => item.commentId === commentId);
}

function salvar(lista: Denuncia[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage a denúncia não persiste; a tela já escondeu */
  }
  window.dispatchEvent(new Event(MODERACAO_EVENT));
}

export function denunciar(commentId: string, motivo: MotivoDaDenuncia): void {
  if (foiDenunciado(commentId)) return;
  salvar([...readDenuncias(), { commentId, motivo, date: new Date().toISOString() }]);
}

/**
 * Desfazer — e ele **não** é firula.
 *
 * O botão de denúncia é pequeno e mora ao lado de "responder"; toque errado no
 * celular vai acontecer. Sem desfazer, um dedo torto apaga da sua tela um
 * comentário que você queria ler, sem volta.
 */
export function desfazerDenuncia(commentId: string): void {
  salvar(readDenuncias().filter((item) => item.commentId !== commentId));
}
