import { Link } from "wouter";
import { ArrowRight, CalendarClock, Users } from "lucide-react";

import AcoesDoPost from "@/components/comunidade/AcoesDoPost";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import { catalog, slugify } from "@/lib/books";
import { EU, clubePorId, corDoMembro, nomeDoMembro, souDono, vagasRestantes, type Clube } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import { isFollowing, toggleFollow } from "@/lib/following";
import { initialOf, readProfile } from "@/lib/profile";
import { type Post } from "@/lib/posts";
import { useState } from "react";

/**
 * O cartão de um post — **a peça que decide se a Comunidade sai do cru**.
 *
 * Construído antes de qualquer tela, de propósito: se o cartão não impressiona
 * sozinho, nenhuma tela em volta salva (ROTEIRO §4.58, ordem de construção).
 *
 * **As quatro formas, e o que muda entre elas:**
 *
 * 1. **Com livro** — a capa ocupa a largura toda, alta, com o título por cima do
 *    escurecido. É a forma mais comum e a mais barata: a capa já existe, já é
 *    bonita, e já é porta para a ficha.
 * 2. **Com trecho** — o cartão de citação em tamanho grande (capa ao fundo, onda
 *    e play). É o que só o AllBook tem: 40 segundos que tocam e param no fim.
 * 3. **Com clube** — capa do livro da vez, prazo e vagas. É convite disfarçado
 *    de post: quem lê pode entrar dali.
 * 4. **Só texto** — sem objeto. Ganha **tratamento tipográfico** (corpo maior,
 *    entrelinha larga) para ter presença em vez de virar buraco entre dois
 *    cartões com capa. Permitido, nunca o padrão.
 *
 * **O que o cabeçalho mostra:** foto, nome, quando — e o "seguir" **só se você
 * ainda não segue**. O Matheus quis o botão no cartão e eu era contra por
 * poluição; o acordo foi ele sumir depois de cumprir a função, em vez de virar
 * "Seguindo ✓" ocupando espaço em todo post para sempre (§4.58).
 */
export default function CartaoDePost({ post }: { post: Post }) {
  const membro = post.autorSlug ? findMember(post.autorSlug) : undefined;
  const meuPerfil = readProfile();
  const ehMeu = post.autorSlug === undefined;
  const [seguindo, setSeguindo] = useState(() =>
    post.autorSlug ? isFollowing(post.autorSlug) : true,
  );

  const nome = ehMeu ? meuPerfil.name : (membro?.name ?? "Leitor");
  const href = ehMeu ? "/profile" : `/user/${post.autorSlug}`;

  return (
    <article
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"
      data-testid={`post-${post.id}`}
    >
      <header className="flex items-center gap-2.5">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2.5">
          {ehMeu && meuPerfil.photo ? (
            <img src={meuPerfil.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${
                membro?.color ?? "from-primary to-orange-600"
              } font-display text-sm font-bold`}
            >
              {ehMeu ? initialOf(meuPerfil.name) : nome.charAt(0)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold">{nome}</span>
            <span className="block text-[11px] text-white/35">
              {quando(post.date)}
              {post.editadoEm && " · editado"}
            </span>
          </span>
        </Link>

        {/*
          **Fica como "Seguindo" em vez de sumir** — o Matheus discordou da minha
          versão: *"ele tem que aparecer você seguindo, que é o padrão já das
          redes sociais"*. É decisão dele, e o padrão dá o que a minha não dava:
          poder **deixar de seguir** dali mesmo. O estado apagado (sem anel,
          texto fraco) é o que evita a poluição que me preocupava.
        */}
        {!ehMeu && (
          <button
            onClick={() => {
              if (post.autorSlug) setSeguindo(toggleFollow(post.autorSlug));
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
              seguindo
                ? "text-white/35 hover:text-white/70"
                : "text-primary ring-1 ring-inset ring-primary/40 hover:bg-primary/10"
            }`}
            data-testid={`seguir-${post.autorSlug}`}
          >
            {seguindo ? "Seguindo" : "Seguir"}
          </button>
        )}
      </header>

      {/*
        **O selo "Perguntou" saiu em 29/07**, e a dúvida foi do Matheus: *"fico me
        questionando se ele faz sentido"*. Faz — mas só quando existir o que ele
        promete: respostas embaixo e o filtro "sem resposta". Sozinho ele é
        rótulo, e rótulo sem mecanismo é a decoração que a §4.23 manda varrer.
        `post.pergunta` continua no modelo, esperando as respostas.
      */}

      {post.texto && (
        <p
          className={
            post.objeto
              ? "mt-2 text-[14px] leading-relaxed text-white/85"
              : /* Sem objeto, o texto **é** o cartão: corpo maior e entrelinha
                   larga, para ter presença em vez de virar buraco. */
                "mt-2.5 font-display text-[19px] font-semibold leading-snug tracking-tight text-white/90"
          }
        >
          {post.texto}
        </p>
      )}

      {post.objeto?.tipo === "livro" && <CapaDoLivro bookId={post.objeto.bookId} />}
      {post.objeto?.tipo === "trecho" && (
        <div className="mt-3">
          <CitacaoDeAudio citacao={post.objeto.citacao} grande />
        </div>
      )}
      {post.objeto?.tipo === "clube" && <CartaoDoClube clubeId={post.objeto.clubeId} />}

      <AcoesDoPost post={post} />
    </article>
  );
}

/**
 * O livro citado — **capa inteira, sem corte** (refeito em 29/07).
 *
 * **O defeito que isto conserta era meu.** A primeira versão punha a capa numa
 * faixa de 160px com `object-cover`: capa de livro é **retrato** (2:3), então o
 * recorte comia a arte — no cartão do Duna, o título do livro sumia e sobrava a
 * chuva de estrelas. Num app onde **a capa é a peça de design mais cuidada do
 * produto**, usá-la como textura de fundo é desperdício.
 *
 * Agora ela aparece **inteira**, e quem preenche o resto é **ela mesma,
 * desfocada** — o mesmo truque que o topo do player usa, então não é invenção:
 * é a identidade da casa aplicada aqui.
 *
 * **Três links, não um** (pedido do Matheus): título → a ficha; autor → a página
 * dele; narrador → a página dele. A tela `/person/:slug` já serve autor **e**
 * narrador desde sempre — não usá-la aqui era jogar fora o que existe.
 */
function CapaDoLivro({ bookId }: { bookId: number }) {
  const livro = catalog.find((item) => item.id === bookId);
  if (!livro) return null;

  return (
    <div
      className="relative mt-3 flex items-center gap-3.5 overflow-hidden rounded-xl p-3.5"
      data-testid="post-livro"
    >
      {/* A própria capa, desfocada e escurecida, é o fundo. Nada de cor nova. */}
      <div aria-hidden className="absolute inset-0">
        <img src={livro.cover} alt="" className="h-full w-full scale-125 object-cover blur-2xl" />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <Link href={`/book/${livro.id}`} className="relative shrink-0">
        {/* `object-contain` e proporção 2:3: a arte aparece **inteira**. */}
        <img
          src={livro.cover}
          alt={livro.title}
          className="h-[132px] w-[88px] rounded-lg object-cover shadow-lg shadow-black/50 ring-1 ring-white/10"
        />
      </Link>

      <div className="relative min-w-0 flex-1">
        <Link href={`/book/${livro.id}`} className="block">
          <span className="line-clamp-2 font-display text-[15.5px] font-bold leading-tight">
            {livro.title}
          </span>
        </Link>

        <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/55">
          por{" "}
          <Link
            href={`/person/${slugify(livro.author)}`}
            className="font-semibold text-white/85 underline-offset-2 hover:underline"
            data-testid="post-livro-autor"
          >
            {livro.author}
          </Link>
          <br />
          narrado por{" "}
          <Link
            href={`/person/${slugify(livro.narrator)}`}
            className="font-semibold text-white/85 underline-offset-2 hover:underline"
            data-testid="post-livro-narrador"
          >
            {livro.narrator}
          </Link>
        </p>

        <Link
          href={`/book/${livro.id}`}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[11.5px] font-bold transition-colors hover:bg-white/20"
        >
          Ver o livro
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/**
 * O clube citado — **refeito em 29/07**.
 *
 * A primeira versão era uma linha com capinha de 48px, e as duas críticas foram
 * certeiras (uma minha, uma do Matheus): ela **destoava** no meio de cartões com
 * capa grande, e — pior — *"você não consegue dizer que isso é um clube de
 * leitura; tem pouca informação"*. Um cartão que não se nomeia obriga a pessoa a
 * clicar para descobrir o que é.
 *
 * Agora ele **se apresenta**: a capa do livro da vez ao fundo, o selo dizendo o
 * que é, e as três coisas que decidem se alguém entra — **o livro, o ritmo e as
 * vagas**. O "Entrar" é explícito, porque o cartão de clube é, na prática, um
 * convite.
 */
function CartaoDoClube({ clubeId }: { clubeId: string }) {
  const clube = clubePorId(clubeId);
  if (!clube) return null;
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  const vagas = vagasRestantes(clube);

  /*
   * **Cuidado que um bug meu revelou:** nem todo dono está em `community.ts` —
   * os clubes semeados usam também os "figurantes" declarados em `clubes.ts`.
   * `findMember` devolvia `undefined` para eles e o cartão dizia "seu clube"
   * num clube que não é seu. Agora o nome vem de `nomeDoMembro`, que consulta
   * as duas listas, e o link só existe para quem tem página.
   */
  const meu = souDono(clube);
  const donoTemPagina = findMember(clube.donoSlug) !== undefined;
  const [vendoMembros, setVendoMembros] = useState(false);

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl ring-1 ring-inset ring-white/10"
      data-testid="post-clube"
    >
      {/*
        **Mesmo formato dos outros dois** (29/07): capa **inteira**, em retrato, e
        o fundo é ela mesma desfocada. A versão anterior recortava a capa numa
        faixa de 144px — o defeito que eu já tinha consertado no cartão de livro e
        que o Matheus cobrou nos outros: se cortar a arte é ruim num, é ruim nos
        três. Três cartões, uma gramática.
      */}
      <div className="relative flex items-start gap-3.5 p-3.5">
        <div aria-hidden className="absolute inset-0">
          {livro && (
            <img src={livro.cover} alt="" className="h-full w-full scale-125 object-cover blur-2xl" />
          )}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {livro && (
          <Link href={`/book/${livro.id}`} className="relative shrink-0">
            <img
              src={livro.cover}
              alt={livro.title}
              className="h-[120px] w-20 rounded-lg object-cover shadow-lg shadow-black/50 ring-1 ring-white/10"
            />
          </Link>
        )}

        <div className="relative min-w-0 flex-1">
          {/* Diz o que é antes de qualquer outra coisa — era o que faltava. */}
          <span className="inline-block rounded-full bg-primary px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-black">
            Clube de leitura
          </span>

          <Link href={`/clube/${clube.id}`} className="mt-1.5 block">
            <span className="line-clamp-2 font-display text-[15px] font-bold leading-tight hover:text-primary">
              {clube.nome}
            </span>
          </Link>

          {/* **Cada parte leva ao seu lugar** (29/07): o livro da vez abre a
              ficha dele, o moderador abre a página dele. Antes o cartão inteiro
              era um link só e tudo caía no clube — o livro citado ali ficava
              sendo informação morta. */}
          {livro && (
            <p className="mt-1 truncate text-[11.5px] text-white/65">
              lendo{" "}
              <Link
                href={`/book/${livro.id}`}
                className="font-semibold text-white/90 underline-offset-2 hover:underline"
                data-testid="clube-livro"
              >
                {livro.title}
              </Link>
            </p>
          )}

          {/*
            **Os dois números viraram alvos** (29/07, pedido do Matheus: *"as
            quatro pessoas também não são links clicáveis"*). Número que descreve
            algo que existe no app e não leva até ele é informação que morre na
            tela. As pessoas abrem a lista **aqui mesmo**, sem sair do feed; as
            etapas abrem o clube, onde o ritmo mora.
          */}
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setVendoMembros(true)}
              className="flex items-center gap-1 text-white/60 underline-offset-2 hover:text-white hover:underline"
              data-testid="clube-membros"
            >
              <Users className="h-3 w-3" />
              {clube.membros.length} {clube.membros.length === 1 ? "pessoa" : "pessoas"}
            </button>
            <Link
              href={`/clube/${clube.id}`}
              className="flex items-center gap-1 text-white/60 underline-offset-2 hover:text-white hover:underline"
              data-testid="clube-etapas"
            >
              <CalendarClock className="h-3 w-3" />
              {clube.ciclo.marcos.length}{" "}
              {clube.ciclo.marcos.length === 1 ? "etapa" : "etapas"}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-white/[0.07] bg-black/25 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[11.5px] text-white/50">
          {meu ? (
            "seu clube"
          ) : (
            <>
              moderado por{" "}
              {donoTemPagina ? (
                <Link
                  href={`/user/${clube.donoSlug}`}
                  className="font-semibold text-white/75 underline-offset-2 hover:underline"
                  data-testid="clube-moderador"
                >
                  {nomeDoMembro(clube.donoSlug)}
                </Link>
              ) : (
                <span className="font-semibold text-white/75" data-testid="clube-moderador">
                  {nomeDoMembro(clube.donoSlug)}
                </span>
              )}
            </>
          )}
          {vagas !== undefined && vagas > 0 && ` · ${vagas} ${vagas === 1 ? "vaga" : "vagas"}`}
        </span>
        <Link
          href={`/clube/${clube.id}`}
          className="ml-3 flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-primary"
        >
          Entrar
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {vendoMembros && (
        <QuemEstaNoClube clube={clube} onFechar={() => setVendoMembros(false)} />
      )}
    </div>
  );
}

/**
 * A turma do clube, numa folha — e **cada nome abre a página da pessoa**.
 *
 * Pedido do Matheus em 29/07: *"esses quatro membros, eu também teria que ver
 * quem são; deveria abrir uma listinha e aí eu poderia clicar nos membros"*.
 *
 * Abre **sem sair do feed**, de propósito: ver quem está numa turma é curiosidade
 * de passagem, e mandar a pessoa para outra tela por isso a faria perder o lugar
 * na rolagem.
 */
function QuemEstaNoClube({ clube, onFechar }: { clube: Clube; onFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="folha-de-membros"
    >
      <div
        className="max-h-[75vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />
        <h2 className="font-display text-lg font-bold">{clube.nome}</h2>
        <p className="mt-0.5 text-xs text-white/40">
          {clube.membros.length} {clube.membros.length === 1 ? "pessoa" : "pessoas"} nesta turma
        </p>

        <div className="mt-4 space-y-1">
          {clube.membros.map((slug) => {
            const ehVoce = slug === EU;
            const temPagina = findMember(slug) !== undefined;
            const conteudo = (
              <>
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${corDoMembro(
                    slug,
                  )} font-display text-sm font-bold`}
                >
                  {nomeDoMembro(slug).charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {nomeDoMembro(slug)}
                    {slug === clube.donoSlug && (
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/50">
                        modera
                      </span>
                    )}
                  </span>
                  {findMember(slug)?.bio && (
                    <span className="block truncate text-[11px] text-white/35">
                      {findMember(slug)?.bio}
                    </span>
                  )}
                </span>
              </>
            );

            return ehVoce || !temPagina ? (
              <div key={slug} className="flex items-center gap-3 rounded-xl px-2 py-2">
                {conteudo}
              </div>
            ) : (
              <Link
                key={slug}
                href={`/user/${slug}`}
                onClick={onFechar}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.06]"
                data-testid={`membro-${slug}`}
              >
                {conteudo}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * "há 2 h", "ontem", "12 jul" — a mesma escala das notificações, com uma
 * diferença no fim.
 *
 * **Passada uma semana, vira data absoluta.** "Há 3 semanas" obriga a pessoa a
 * fazer conta para saber quando foi; "12 jul" ela lê. O relativo serve para o
 * que é recente (é a informação útil: "isto acabou de acontecer"), e o absoluto
 * para o que já saiu do calor do momento.
 */
function quando(iso: string): string {
  const data = new Date(iso);
  const minutos = Math.floor((Date.now() - data.getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
}
