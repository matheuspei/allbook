/**
 * Sessão do usuário — quem está "logado" neste navegador.
 *
 * Ainda não existe servidor de contas: nada é verificado contra um banco. Esta
 * camada só guarda, no `localStorage`, quem disse que entrou, para as telas
 * poderem se comportar de forma diferente para visitante e para quem tem conta.
 *
 * **A senha nunca é guardada** — nem aqui, nem em lugar nenhum. Guardar senha em
 * texto puro no navegador é um hábito ruim que ninguém lembra de desfazer depois,
 * e como não há nada para conferir, ela não serviria para nada. Quando o Passport
 * entrar no servidor, `signIn`/`signUp` viram chamadas de rede e o resto das
 * telas não precisa mudar.
 */

import { defaultProfile, readProfile, saveProfile } from "@/lib/profile";

const STORAGE_KEY = "allbook_auth";

export interface Session {
  name: string;
  email: string;
  /** Quando a sessão foi criada (ISO). Só informativo por ora. */
  since: string;
}

export const MIN_PASSWORD = 6;

export function readSession(): Session | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return null;
    if (typeof stored.email !== "string" || !stored.email) return null;
    return {
      name: typeof stored.name === "string" ? stored.name : "",
      email: stored.email,
      since: typeof stored.since === "string" ? stored.since : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function isSignedIn(): boolean {
  return readSession() !== null;
}

/**
 * Entrar com uma conta que "já existe".
 *
 * Como não há banco, qualquer e-mail válido entra. O nome do perfil salvo neste
 * navegador é preservado: quem já editou o perfil não perde o que escreveu ao
 * entrar de novo.
 */
export function signIn(email: string): Session {
  const profile = readProfile();
  const session: Session = {
    name: profile.name || nameFromEmail(email),
    email: email.trim().toLowerCase(),
    since: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  saveProfile({ ...profile, email: session.email });
  return session;
}

/**
 * Criar conta. Diferente de `signIn`, o nome digitado aqui manda: é uma conta
 * nova, então o perfil passa a ser dessa pessoa.
 */
export function signUp(name: string, email: string): Session {
  const session: Session = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    since: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

  const profile = readProfile();
  saveProfile({ ...profile, name: session.name, email: session.email });
  return session;
}

/**
 * Sair.
 *
 * Só a sessão é apagada. Biblioteca, downloads e recomendações continuam onde
 * estão de propósito: neste protótipo eles são deste navegador, não da conta —
 * apagá-los faria a pessoa perder o que montou por ter clicado em "Sair". O
 * perfil volta ao padrão para o cabeçalho não continuar mostrando o nome de
 * quem acabou de sair.
 */
export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY);
  saveProfile({ ...defaultProfile });
}

/** "maria.souza@x.com" → "Maria". Palpite razoável quando não há nome. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "";
  const first = local.split(/[._-]/)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Validação simples: tem algo, um @ e um ponto depois dele. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
