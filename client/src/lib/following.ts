/**
 * Quem você segue.
 *
 * Seguir alguém nasce de um encontro, não de uma lista: você lê um comentário
 * na tela do livro, clica no nome, olha o que a pessoa recomenda e então segue.
 * Por isso o botão mora no perfil dela (`/user/:slug`) e não numa tela de
 * "descobrir gente".
 *
 * Guardado no `localStorage` deste navegador, como o resto do protótipo. Vira
 * uma tabela de relacionamento quando houver backend.
 */

const STORAGE_KEY = "allbook_following";

/** Os slugs de `community.ts` que você segue. */
export function readFollowing(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function isFollowing(slug: string): boolean {
  return readFollowing().includes(slug);
}

/** Segue ou deixa de seguir. Devolve o estado novo, para a tela já reagir. */
export function toggleFollow(slug: string): boolean {
  const current = readFollowing();
  const following = current.includes(slug);
  const next = following ? current.filter((item) => item !== slug) : [...current, slug];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return !following;
}
