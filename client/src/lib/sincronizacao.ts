/**
 * A ponte entre o `localStorage` e a conta.
 *
 * Etapa 3 do banco (08/08, §4.121). É o que faz a biblioteca, o progresso, o
 * diário, as notas, as marcações e os trechos **pararem de morrer com o
 * navegador**.
 *
 * ---
 *
 * ## Por que este arquivo não importa NENHUMA lib de dados
 *
 * `library.ts`, `playback.ts`, `listening.ts`, `ratings.ts`, `bookmarks.ts` e
 * `trechosGuardados.ts` continuam **exatamente como estavam** — não abri nenhuma
 * delas. Duas razões, e as duas pesam:
 *
 * 1. **22 telas leem `playback.ts`** e 10 leem `library.ts`. Mexer na assinatura
 *    de qualquer uma viraria uma reescrita do app.
 * 2. Cada uma delas **já dispara um evento de `window` em toda escrita**
 *    (`allbook:library`, `allbook:playback`…), porque as telas precisavam se
 *    redesenhar. Escutar esses eventos dá exatamente o gancho de que a
 *    sincronização precisa, **de graça**.
 *
 * Então este módulo lê e escreve as chaves `allbook_*` direto, e o servidor
 * conversa **no formato do navegador** (a conversão para as tabelas mora em
 * `server/dados.ts`). O front continua um espelho burro.
 *
 * ⚠️ **Quem não tem conta não é afetado em nada.** Sem sessão, nada aqui roda, e
 * o app funciona como sempre funcionou — só no navegador.
 */

/**
 * As chaves que sobem para a conta, e o evento que cada uma dispara quando muda.
 *
 * ⚠️ **`allbook_downloads` NÃO está aqui, e a ausência é a decisão:** baixado é
 * **do aparelho**, não da conta — o arquivo está *naquele* celular. Sincronizar
 * faria o tablet anunciar como baixado um arquivo que só existe no telefone.
 * `allbook_miniplayer`, `allbook_playing` e o modo de ver a Biblioteca também
 * ficam de fora: são estado de tela e preferência de aparelho.
 */
const CHAVES: { chave: string; evento: string }[] = [
  /* — biblioteca e audição (§4.121) — */
  { chave: "allbook_library", evento: "allbook:library" },
  { chave: "allbook_playback", evento: "allbook:playback" },
  { chave: "allbook_finished", evento: "allbook:playback" },
  { chave: "allbook_listening", evento: "allbook:listening" },
  { chave: "allbook_ratings", evento: "allbook:ratings" },
  { chave: "allbook_bookmarks", evento: "allbook:bookmarks" },
  { chave: "allbook_trechos_guardados", evento: "allbook:trechos" },

  /* — quem a pessoa é, e o que é só dela (§4.122) — */
  { chave: "allbook_profile", evento: "allbook:profile" },
  { chave: "allbook_settings", evento: "allbook:settings" },
  { chave: "allbook_weekly_goal", evento: "allbook:goal" },
  { chave: "allbook_achievements_won", evento: "allbook:conquistas" },
  { chave: "allbook_recommendations", evento: "allbook:recomendacoes" },
  { chave: "allbook_book_requests", evento: "allbook:pedidos" },
  { chave: "allbook_assinatura", evento: "allbook:assinatura" },
];

/* -------------------------------------------------------------------------- */
/* Ler e escrever o espelho                                                    */
/* -------------------------------------------------------------------------- */

function ler(chave: string): unknown {
  try {
    const cru = localStorage.getItem(chave);
    return cru ? JSON.parse(cru) : null;
  } catch {
    return null;
  }
}

function escrever(chave: string, valor: unknown): void {
  try {
    if (valor === null || valor === undefined) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* storage cheio: o dado continua no servidor, que é o que importa agora */
  }
}

function avisarTelas(): void {
  // Um evento de cada tipo, sem repetir — as telas releem o que lhes interessa.
  for (const evento of Array.from(new Set(CHAVES.map((c) => c.evento)))) {
    window.dispatchEvent(new Event(evento));
  }
}

/* -------------------------------------------------------------------------- */
/* Mesclar — o coração da migração de primeira entrada (armadilha 2.2)         */
/* -------------------------------------------------------------------------- */

/**
 * Junta o que está no navegador com o que está na conta, **sem perder de
 * nenhum dos dois lados**.
 *
 * ⚠️ **Isto é a "migração de primeira entrada" que o checklist exigia** (2.2):
 * *"o que estava no aparelho sobe para a conta recém-criada, em vez de sumir"*.
 * Sem ela, quem usou o app por semanas e depois criasse conta veria a biblioteca
 * inteira desaparecer — e nada na tela explicaria o porquê.
 *
 * Ela roda em **toda entrada**, não só na primeira: é o mesmo problema quando
 * alguém usa o app deslogado num aparelho e depois entra nele.
 *
 * A regra de desempate muda por assunto, e cada uma tem motivo:
 * - **biblioteca / concluídos**: fica a data **mais antiga** — é quando aquilo
 *   de fato aconteceu.
 * - **progresso / notas**: fica o **mais recente** — é a última vez que a pessoa
 *   mexeu, e é essa que vale.
 * - **diário**: fica o **maior** de cada dia; somar duplicaria o histórico a cada
 *   entrada, inflando as Estatísticas sem ninguém notar.
 * - **marcações / trechos**: **união por id** — são textos escritos pela pessoa,
 *   e o certo diante da dúvida é não apagar nenhum.
 */
function mesclar(chave: string, local: any, servidor: any): any {
  const porId = (lista: any[], id: (i: any) => string, ganha: (a: any, b: any) => any) => {
    const mapa = new Map<string, any>();
    for (const item of [...(servidor ?? []), ...(local ?? [])]) {
      if (!item) continue;
      const k = id(item);
      const atual = mapa.get(k);
      mapa.set(k, atual ? ganha(atual, item) : item);
    }
    return Array.from(mapa.values());
  };

  const maisAntigo = (campo: string) => (a: any, b: any) =>
    String(a?.[campo] ?? "") <= String(b?.[campo] ?? "") ? a : b;
  const maisNovo = (campo: string) => (a: any, b: any) =>
    String(a?.[campo] ?? "") >= String(b?.[campo] ?? "") ? a : b;

  switch (chave) {
    case "allbook_library":
      return porId(local, (i) => String(i.id), maisAntigo("addedAt"));

    case "allbook_playback":
      return porId(local, (i) => String(i.bookId), maisNovo("updatedAt")).sort((a: any, b: any) =>
        String(b.updatedAt).localeCompare(String(a.updatedAt)),
      );

    case "allbook_ratings":
      return porId(local, (i) => String(i.bookId), maisNovo("updatedAt"));

    case "allbook_bookmarks":
    case "allbook_trechos_guardados":
      return porId(local, (i) => String(i.id), (a) => a);

    case "allbook_finished": {
      const junto: Record<string, string> = { ...(servidor ?? {}) };
      for (const [id, quando] of Object.entries(local ?? {})) {
        const atual = junto[id];
        // Terminar um livro acontece uma vez: vale a data mais antiga.
        junto[id] = atual && atual <= String(quando) ? atual : String(quando);
      }
      return junto;
    }

    case "allbook_listening": {
      const junto: Record<string, any> = { ...(servidor ?? {}) };
      for (const [dia, valor] of Object.entries<any>(local ?? {})) {
        const outro = junto[dia];
        if (!outro) {
          junto[dia] = valor;
          continue;
        }
        // O MAIOR, nunca a soma — ver o comentário do topo.
        const maior = (Number(valor?.sec) || 0) >= (Number(outro?.sec) || 0) ? valor : outro;
        junto[dia] = maior;
      }
      return junto;
    }

    /* ---- as chaves de §4.122 ---- */

    case "allbook_achievements_won": {
      /* `{ chave: ISO }`. Ganhar um troféu acontece uma vez: vale a data mais
         antiga, senão entrar de novo "reganharia" tudo hoje. */
      const junto: Record<string, string> = { ...(servidor ?? {}) };
      for (const [id, quando] of Object.entries(local ?? {})) {
        const atual = junto[id];
        junto[id] = atual && atual <= String(quando) ? atual : String(quando);
      }
      return junto;
    }

    case "allbook_recommendations":
      return porId(local, (i) => String(i.id), maisAntigo("date"));

    case "allbook_book_requests":
      return porId(local, (i) => String(i.id), maisNovo("date"));

    case "allbook_profile":
    case "allbook_settings": {
      /*
       * Objetos **sem carimbo de tempo**, então não há como saber qual lado é o
       * mais novo. A regra é campo a campo: **o servidor vence onde tem valor**,
       * e o local preenche o que lá está vazio.
       *
       * É o que resolve o caso real: quem usou o app sem conta e escreveu uma
       * bio não pode perdê-la ao se cadastrar (a conta nasce sem bio) — mas
       * quem já tem o perfil na conta também não pode vê-lo sobrescrito por um
       * aparelho velho.
       */
      const l = (local ?? {}) as Record<string, unknown>;
      const s = (servidor ?? {}) as Record<string, unknown>;
      const junto: Record<string, unknown> = { ...l };
      for (const [campo, valor] of Object.entries(s)) {
        const vazio = valor === undefined || valor === null || valor === "";
        if (!vazio) junto[campo] = valor;
      }
      return junto;
    }

    case "allbook_assinatura":
      /* Quem manda é a conta: o plano e os créditos vivem lá. */
      return servidor ?? local;

    case "allbook_weekly_goal":
      /*
       * Aqui o **local** vence quando existe, ao contrário da assinatura.
       *
       * A razão é o caso da primeira entrada: a conta nasce com a meta padrão
       * (180 min), então deixar o servidor ganhar apagaria a meta que a pessoa
       * escolheu de propósito antes de se cadastrar. Num aparelho novo o local
       * está vazio, e aí o da conta vale.
       */
      return local ?? servidor;

    default:
      return local ?? servidor;
  }
}

/* -------------------------------------------------------------------------- */
/* Conversa com o servidor                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Tem alguém logado?
 *
 * Lê a chave da sessão **direto**, em vez de importar `readSession` de
 * `lib/auth.ts` — de propósito: `auth.ts` precisa chamar as funções daqui
 * (ao entrar e ao sair), e importar um ao outro criaria um **ciclo entre os dois
 * módulos**. O mesmo cuidado que `books.ts` já toma com `people.ts`.
 */
function logado(): boolean {
  try {
    const cru = localStorage.getItem("allbook_auth");
    return Boolean(cru && JSON.parse(cru)?.email);
  } catch {
    return false;
  }
}

/**
 * Manda uma chave para a conta.
 *
 * ⚠️ **Ele lê o `localStorage` AQUI DENTRO, e isso conserta uma corrida de
 * verdade** (achada testando, §4.121). A primeira versão recebia o valor de
 * fora, calculado antes; se a pessoa mexesse no app durante a sincronização de
 * abertura — que leva um ou dois segundos —, o envio carregava o valor **de
 * antes** e desfazia o que ela tinha acabado de fazer. Adicionar um livro logo
 * ao abrir o app fazia o livro sumir sozinho, sem erro nenhum na tela.
 *
 * Lendo na hora do envio, o que sobe é sempre o estado mais recente.
 */
async function enviar(chave: string): Promise<void> {
  await fetch("/api/dados", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chave, valor: ler(chave) }),
  });
}

/** Marca que este navegador já mandou tudo para a conta — evita reenviar à toa. */
const MARCA_DE_ENVIO = "allbook_sync_estado";

/* -------------------------------------------------------------------------- */
/* Entrar: baixar, mesclar, subir                                              */
/* -------------------------------------------------------------------------- */

/**
 * Traz o que está na conta, junta com o que está aqui, e devolve o resultado
 * para os dois lados.
 *
 * Chamada ao entrar, ao cadastrar e a cada carregamento do app com sessão viva —
 * é ela que faz a biblioteca aparecer num aparelho novo.
 *
 * **Falha de rede não apaga nada**: se o servidor não responder, o navegador
 * segue com o que tem. Perder a biblioteca por causa de um Wi-Fi ruim seria bem
 * pior do que ficar um tempo sem sincronizar.
 */
export async function sincronizarDados(): Promise<void> {
  if (!logado()) return;

  let doServidor: Record<string, any>;
  try {
    const resposta = await fetch("/api/dados", { credentials: "include" });
    if (!resposta.ok) return;
    doServidor = await resposta.json();
  } catch {
    return;
  }

  /*
   * Junta tudo **primeiro**, e só então envia. Assim a janela em que o
   * navegador e a conta discordam é a menor possível — e os envios saem em
   * paralelo, em vez de sete idas à rede em fila.
   */
  for (const { chave } of CHAVES) {
    escrever(chave, mesclar(chave, ler(chave), doServidor[chave]));
  }
  // A tela já mostra o resultado antes de a rede confirmar: o dado é o mesmo.
  avisarTelas();

  await Promise.all(
    CHAVES.map(({ chave }) =>
      // `enviar` relê o storage na hora — ver o aviso lá dentro sobre a corrida.
      enviar(chave).catch(() => {
        /* sem rede agora; a próxima escrita da pessoa reenvia */
      }),
    ),
  );

  try {
    localStorage.setItem(MARCA_DE_ENVIO, new Date().toISOString());
  } catch {
    /* sem storage: só perde a marca, não o dado */
  }
}

/* -------------------------------------------------------------------------- */
/* Sair: o dado passa a ser DA CONTA                                           */
/* -------------------------------------------------------------------------- */

/**
 * Apaga do navegador o que agora é da conta.
 *
 * ⚠️ **Isto é a inversão que a armadilha 2.2 previu, e ela acontece aqui.**
 * Antes, `signOut` deixava a biblioteca de propósito: ela era *do navegador*, e
 * apagá-la faria a pessoa perder tudo por ter clicado em "Sair". Agora ela é *da
 * conta* — está guardada no servidor e volta na próxima entrada. **Deixá-la aqui
 * é que seria o erro:** o próximo a usar este celular veria a biblioteca, as
 * notas e os trechos de quem saiu.
 *
 * `allbook_downloads` **não** é apagado: continua sendo do aparelho.
 */
export function limparDadosDaConta(): void {
  for (const { chave } of CHAVES) escrever(chave, null);
  try {
    localStorage.removeItem(MARCA_DE_ENVIO);
  } catch {
    /* nada a fazer */
  }
  avisarTelas();
}

/* -------------------------------------------------------------------------- */
/* Depois de entrar: toda mudança sobe sozinha                                 */
/* -------------------------------------------------------------------------- */

/**
 * Passa a ouvir os eventos que as libs já disparam e manda a mudança para a
 * conta.
 *
 * **Espera 800ms antes de enviar** (e reinicia a espera a cada evento novo):
 * arrastar a barra do player dispara `allbook:playback` muitas vezes por
 * segundo, e sem isso seriam dezenas de chamadas de rede por gesto.
 */
let ligado = false;

export function ligarSincronizacao(): void {
  if (ligado || typeof window === "undefined") return;
  ligado = true;

  const relogios = new Map<string, number>();

  for (const { chave, evento } of CHAVES) {
    window.addEventListener(evento, () => {
      if (!logado()) return;

      const anterior = relogios.get(chave);
      if (anterior) window.clearTimeout(anterior);

      relogios.set(
        chave,
        window.setTimeout(() => {
          void enviar(chave).catch(() => {
            /* sem rede: a próxima mudança tenta de novo */
          });
        }, 800),
      );
    });
  }
}
