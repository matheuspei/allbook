/**
 * Sessão do usuário — quem está logado neste navegador.
 *
 * **Mudou em 08/08 (§4.120): agora existe servidor de contas.** Antes, qualquer
 * e-mail entrava e a senha não era guardada em lugar nenhum — não havia com o
 * que conferir. Hoje `signIn`/`signUp` batem em `/api/contas/*`, a senha é
 * conferida de verdade contra o banco, e quem manda na sessão é um **cookie
 * assinado**, não o `localStorage`.
 *
 * **A senha continua não sendo guardada aqui** — ela é digitada, enviada e
 * esquecida. No servidor, o que fica é o resultado do `scrypt`, do qual não se
 * volta para a senha original.
 *
 * ---
 *
 * ## Por que `readSession()` continua SÍNCRONO
 *
 * A verdade sobre quem está logado passou a morar no servidor, e perguntar ao
 * servidor é assíncrono. Só que as telas leem a sessão de dentro de um
 * `useState(readSession)` — trocar para assíncrono obrigaria a mexer em cada uma
 * delas, e uma delas (`You.tsx`) é de outra janela do Claude.
 *
 * A saída é o padrão de sempre: **o `localStorage` deixa de ser a verdade e vira
 * um espelho dela.** `readSession()` lê o espelho (instantâneo, como antes);
 * `sincronizarSessao()` pergunta ao servidor e corrige o espelho quando a
 * resposta chega. O caso que isso cobre é o real: a sessão expirou no servidor,
 * o espelho ainda diz que você está logado, e a próxima leitura acerta.
 */

import { EH_A_MOLDURA } from "@/lib/dev-moldura";
import { defaultProfile, readProfile, saveProfile } from "@/lib/profile";
import {
  ligarSincronizacao,
  limparDadosDaConta,
  sincronizarDados,
} from "@/lib/sincronizacao";

const STORAGE_KEY = "allbook_auth";

/** Avisa as telas abertas que a sessão mudou (o padrão de evento da casa). */
export const AUTH_EVENT = "allbook:auth";

export interface Session {
  name: string;
  email: string;
  /** Quando a sessão foi criada (ISO). Só informativo. */
  since: string;
  /**
   * O endereço público da pessoa: `/user/<username>`.
   *
   * ⚠️ **Vem do servidor e é congelado lá** (armadilha 2.9 do
   * `docs/BANCO-DE-DADOS.md`). Antes o endereço era recalculado do nome a cada
   * leitura, então trocar o nome matava todo link já compartilhado, em silêncio.
   */
  username?: string;
}

export const MIN_PASSWORD = 6;

/* -------------------------------------------------------------------------- */
/* O espelho no navegador                                                      */
/* -------------------------------------------------------------------------- */

export function readSession(): Session | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return null;
    if (typeof stored.email !== "string" || !stored.email) return null;
    return {
      name: typeof stored.name === "string" ? stored.name : "",
      email: stored.email,
      since: typeof stored.since === "string" ? stored.since : new Date().toISOString(),
      username: typeof stored.username === "string" ? stored.username : undefined,
    };
  } catch {
    return null;
  }
}

function gravarEspelho(session: Session | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sem storage a sessão vale só nesta aba; o cookie continua valendo */
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/* -------------------------------------------------------------------------- */
/* Conversa com o servidor                                                     */
/* -------------------------------------------------------------------------- */

/** O que a API devolve em `conta`. */
interface ContaDaApi {
  id: string;
  nome: string;
  email: string;
  username: string;
  foto: string | null;
  bio: string;
  desde: string;
}

function paraSessao(conta: ContaDaApi): Session {
  return {
    name: conta.nome,
    email: conta.email,
    since: conta.desde,
    username: conta.username,
  };
}

/**
 * `fetch` com o que toda chamada de conta precisa.
 *
 * ⚠️ **`credentials: "include"` não é enfeite:** sem ele o navegador não manda
 * o cookie de sessão, e o servidor responderia "ninguém está logado" para quem
 * acabou de entrar — um erro que não aparece em nenhum lugar, só faz o app
 * parecer que esqueceu a pessoa.
 */
async function chamar<T>(caminho: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(caminho, {
    method: corpo === undefined ? "GET" : "POST",
    credentials: "include",
    headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(
      typeof dados?.erro === "string" ? dados.erro : "Não consegui falar com o servidor.",
    );
  }
  return dados as T;
}

/**
 * Pergunta ao servidor quem está logado e corrige o espelho.
 *
 * Roda sozinha quando este módulo é carregado — ou seja, quando o Login ou as
 * Configurações abrem, que são exatamente as telas onde o estado da sessão
 * aparece. *(O lugar ideal seria o `App.tsx`, no início do app; ele é de outra
 * janela do Claude hoje. Quando liberar, mover para lá.)*
 *
 * **Servidor fora do ar não desloga ninguém**: em caso de falha de rede o
 * espelho fica como está. Deslogar por causa de um Wi-Fi ruim seria pior do que
 * mostrar por alguns segundos um nome desatualizado.
 */
export async function sincronizarSessao(): Promise<Session | null> {
  try {
    const { conta } = await chamar<{ conta: ContaDaApi | null }>("/api/contas/eu");
    const sessao = conta ? paraSessao(conta) : null;

    // Só escreve se algo mudou — senão todo carregamento dispara o evento e as
    // telas que o escutam se redesenham à toa.
    const atual = readSession();
    const mudou = JSON.stringify(atual) !== JSON.stringify(sessao);
    if (mudou) gravarEspelho(sessao);

    if (conta) {
      const perfil = readProfile();
      saveProfile({ ...perfil, name: conta.nome, email: conta.email, bio: conta.bio || perfil.bio });
    }
    return sessao;
  } catch {
    return readSession();
  }
}

/* -------------------------------------------------------------------------- */
/* Entrar, criar conta, sair                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Entrar numa conta que já existe.
 *
 * Agora **recusa senha errada** — era o que não existia. O erro que sobe daqui é
 * o texto do servidor, que é o mesmo para e-mail inexistente e senha errada, de
 * propósito: separar os dois transformaria a tela num jeito de descobrir quem
 * tem conta no AllBook.
 */
export async function signIn(email: string, senha: string): Promise<Session> {
  const { conta } = await chamar<{ conta: ContaDaApi }>("/api/contas/entrar", {
    email: email.trim().toLowerCase(),
    senha,
  });

  const sessao = paraSessao(conta);
  gravarEspelho(sessao);

  // O nome do perfil deste navegador é preservado: quem já editou o perfil não
  // perde o que escreveu ao entrar de novo (era assim antes, e continua).
  const perfil = readProfile();
  saveProfile({ ...perfil, name: conta.nome || perfil.name, email: conta.email });

  // ⚠️ **A migração de primeira entrada acontece aqui** (armadilha 2.2): o que
  // estava neste navegador sobe para a conta em vez de sumir, e o que já estava
  // na conta desce. Ver `mesclar()` em `lib/sincronizacao.ts`.
  await sincronizarDados();
  return sessao;
}

/**
 * Criar conta. Diferente de `signIn`, o nome digitado aqui manda: é uma conta
 * nova, então o perfil passa a ser dessa pessoa.
 */
export async function signUp(name: string, email: string, senha: string): Promise<Session> {
  const { conta } = await chamar<{ conta: ContaDaApi }>("/api/contas/cadastrar", {
    nome: name.trim(),
    email: email.trim().toLowerCase(),
    senha,
  });

  const sessao = paraSessao(conta);
  gravarEspelho(sessao);

  const perfil = readProfile();
  saveProfile({ ...perfil, name: conta.nome, email: conta.email });

  // Conta recém-criada: é o caso clássico da armadilha 2.2 — quem usou o app por
  // semanas sem conta não pode ver a biblioteca sumir ao se cadastrar.
  await sincronizarDados();
  return sessao;
}

/**
 * Sair.
 *
 * **Continua síncrona** (`void`), porque é assim que as telas a chamam: o
 * espelho é apagado na hora e o servidor é avisado em seguida. Esperar a rede
 * para só então limpar deixaria o botão "Sair" parado por um instante, e o pior
 * caso do jeito atual é uma sessão órfã no banco, que expira sozinha.
 *
 * ⚠️ **A inversão da armadilha 2.2 ACONTECEU (§4.121), e este comentário mudou
 * junto com o código.** Até 08/08, sair não apagava a biblioteca de propósito:
 * ela era *do navegador*, e apagá-la faria a pessoa perder tudo por ter clicado
 * em "Sair". Agora a biblioteca, o progresso, o diário, as notas, as marcações e
 * os trechos são **da conta** — estão no servidor e voltam na próxima entrada —,
 * então **deixá-los aqui é que seria o erro**: o próximo a pegar este celular
 * veria os dados de quem saiu.
 *
 * **`allbook_downloads` continua ficando**: baixado é do aparelho, e o arquivo
 * está neste celular.
 */
export function signOut(): void {
  gravarEspelho(null);
  saveProfile({ ...defaultProfile });
  limparDadosDaConta();
  void chamar("/api/contas/sair", {}).catch(() => {
    /* sem rede o cookie continua no navegador até expirar; o espelho já saiu */
  });
}

/* -------------------------------------------------------------------------- */
/* Esqueci minha senha (armadilha 2.3)                                         */
/* -------------------------------------------------------------------------- */

/**
 * Pede o link de redefinição.
 *
 * ⚠️ **Ainda não há envio de e-mail.** Em desenvolvimento o servidor devolve o
 * link em `link`, e a tela mostra isso na cara — melhor um aviso explícito do
 * que um "enviamos um e-mail" que nunca chega. Quando o envio existir, o campo
 * some sozinho (o servidor só o inclui fora de produção).
 *
 * A resposta é a **mesma exista ou não a conta**: senão esta chamada viraria um
 * verificador de quem tem cadastro, e ela nem pede senha.
 */
export async function pedirRedefinicao(email: string): Promise<{ link?: string }> {
  return chamar<{ ok: true; link?: string }>("/api/contas/esqueci", {
    email: email.trim().toLowerCase(),
  });
}

/** Troca a senha usando o token do link. Cada token vale **uma vez** e por 1 hora. */
export async function redefinirSenha(token: string, senha: string): Promise<void> {
  await chamar("/api/contas/redefinir", { token, senha });
}

/* -------------------------------------------------------------------------- */

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

/*
 * Corrige o espelho assim que uma tela de sessão abre (ver `sincronizarSessao`)
 * e, se houver alguém logado, traz os dados da conta e passa a mandar cada
 * mudança para lá.
 *
 * `ligarSincronizacao` só instala os ouvintes de evento — é barato e não fala
 * com a rede enquanto ninguém mexer em nada.
 *
 * ⚠️ **Menos na moldura de prévia** (`EH_A_MOLDURA`, ver `DevMobileWrapper`).
 * Em desenvolvimento a página de cima é só a moldura e o app roda dentro de um
 * iframe — as duas carregam este módulo, e sem esta guarda cada abertura
 * sincronizaria a conta **duas vezes ao mesmo tempo**, nos dois frames, contra
 * o mesmo `localStorage`. É exatamente a corrida que duplica item (a armadilha
 * do `idLocal` no CLAUDE.md). Quem manda na conta é o frame onde o app está.
 */
if (!EH_A_MOLDURA) {
  ligarSincronizacao();
  void sincronizarSessao().then((sessao) => {
    if (sessao) void sincronizarDados();
  });
}
