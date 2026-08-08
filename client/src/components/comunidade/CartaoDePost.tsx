import { Link } from "wouter";
import { ArrowRight, CalendarClock, Check, HelpCircle, Repeat2, Users } from "lucide-react";

import AcoesDoPost from "@/components/comunidade/AcoesDoPost";
import CampoComMencao from "@/components/comunidade/CampoComMencao";
import ComentariosDoPost from "@/components/comunidade/ComentariosDoPost";
import PostCitado from "@/components/comunidade/PostCitado";
import TextoDoPost from "@/components/comunidade/TextoDoPost";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import { catalog, slugify } from "@/lib/books";
import { EU, clubePorId, corDoMembro, nomeDoMembro, souDono, vagasRestantes, type Clube } from "@/lib/clubes";
import { findMember, fotoDoMembro, avatarDeLeitor } from "@/lib/community";
import { findPerson } from "@/lib/people";
import { COMENTARIOS_EVENT } from "@/lib/comentariosDePost";
import { MELHOR_RESPOSTA_EVENT, resolvidaCom } from "@/lib/melhorResposta";
import { isFollowing, toggleFollow } from "@/lib/following";
import { initialOf, readProfile } from "@/lib/profile";
import {
  MAX_POST,
  compartilharPost,
  desfazerCompartilhamento,
  editarPost,
  meuCompartilhamentoDe,
  postPorId,
  type Mencao,
  type Post,
} from "@/lib/posts";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
export default function CartaoDePost({
  post,
  /** Na página de um post só, a conversa já vem aberta. */
  abrirSempre,
  compartilhamento,
  semSeguir,
}: {
  post: Post;
  abrirSempre?: boolean;
  /**
   * Esconde o "Seguir" do cabeçalho.
   *
   * Existe para a **página da pessoa**: ali o botão já está no alto, e repeti-lo
   * em cada post é oferecer cinco vezes a mesma coisa — a poluição que eu temia
   * quando o botão entrou no cartão (§4.58). No feed ele continua, porque lá cada
   * cartão é de alguém diferente e é a única chance de seguir.
   */
  semSeguir?: boolean;
  /**
   * Quem republicou este post, quando ele chega ao feed por compartilhamento.
   * `porSlug` ausente = **você**.
   */
  compartilhamento?: { porSlug?: string; date: string };
}) {
  const membro = post.autorSlug ? findMember(post.autorSlug) : undefined;
  const meuPerfil = readProfile();
  const ehMeu = post.autorSlug === undefined;
  /* A pergunta que já foi resolvida, e com qual livro (§4.92). Relido no evento
     porque marcar a melhor resposta acontece dentro dos comentários. */
  const [resolvida, setResolvida] = useState(() => resolvidaCom(post.id));
  useEffect(() => {
    const atualizar = () => setResolvida(resolvidaCom(post.id));
    window.addEventListener(MELHOR_RESPOSTA_EVENT, atualizar);
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    return () => {
      window.removeEventListener(MELHOR_RESPOSTA_EVENT, atualizar);
      window.removeEventListener(COMENTARIOS_EVENT, atualizar);
    };
  }, [post.id]);
  const [seguindo, setSeguindo] = useState(() =>
    post.autorSlug ? isFollowing(post.autorSlug) : true,
  );
  const [editando, setEditando] = useState(false);
  const [comentando, setComentando] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);

  const nome = ehMeu ? meuPerfil.name : (membro?.name ?? "Leitor");
  const href = ehMeu ? "/profile" : `/user/${post.autorSlug}`;

  /*
    **O post que este carrega dentro** — só existe em compartilhamento (30/07).

    Quando **não há texto**, o gesto foi um recompartilhamento simples, e a forma
    certa é o cartão original **inteiro** com uma linha em cima dizendo quem
    republicou: quem lê quer ver o post, não uma miniatura dele. Por isso este
    ramo desenha o original e passa a linha adiante, em vez de montar um cartão
    novo com o mesmo conteúdo encolhido.

    Com texto, cai no fluxo normal e o original aparece na moldura de citação
    (`PostCitado`), embaixo da sua fala.
  */
  const citado = post.objeto?.tipo === "post" ? postPorId(post.objeto.postId) : undefined;
  if (citado && !post.texto.trim() && citado.objeto?.tipo !== "post") {
    return (
      <CartaoDePost
        post={citado}
        abrirSempre={abrirSempre}
        semSeguir={semSeguir}
        compartilhamento={{ porSlug: post.autorSlug, date: post.date }}
      />
    );
  }

  return (
    <article
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"
      data-testid={`post-${post.id}`}
    >
      {/*
        **A linha de quem compartilhou, e não uma caixa dentro da caixa.**
        Aninhar o cartão original dentro de um segundo cartão dobra as bordas e
        empurra a capa para dentro de uma moldura menor — num feed de capas,
        isso é perder o que faz o cartão funcionar. Uma linha em cima diz a mesma
        coisa e devolve o espaço ao conteúdo. É o que o Twitter faz, e pelo mesmo
        motivo.
      */}
      {compartilhamento && (
        <p
          className="mb-2.5 flex items-center gap-1.5 text-[11.5px] text-white/40"
          data-testid="linha-compartilhado"
        >
          <Repeat2 className="h-3.5 w-3.5 shrink-0" />
          {compartilhamento.porSlug ? (
            <>
              <Link
                href={`/user/${compartilhamento.porSlug}`}
                className="font-semibold text-white/60 underline-offset-2 hover:underline"
              >
                {findMember(compartilhamento.porSlug)?.name ?? "Alguém"}
              </Link>
              compartilhou
            </>
          ) : (
            <span className="font-semibold text-white/60">Você compartilhou</span>
          )}
          <span className="text-white/25">· {quando(compartilhamento.date)}</span>
        </p>
      )}

      <header className="flex items-center gap-2.5">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* **O rosto do leitor** (31/07): PNG transparente por cima do gradiente
              dele. Quem não tem arquivo continua na inicial, como sempre. */}
          {ehMeu && meuPerfil.photo ? (
            <img src={meuPerfil.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span
              className={`relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${
                membro?.color ?? "from-primary to-primary/60"
              } font-display text-sm font-bold`} {...avatarDeLeitor(membro?.slug)}
            >
              {!ehMeu && post.autorSlug && fotoDoMembro(post.autorSlug) ? (
                <img
                  src={fotoDoMembro(post.autorSlug)}
                  alt={nome}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : ehMeu ? (
                initialOf(meuPerfil.name)
              ) : (
                nome.charAt(0)
              )}
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
        {!ehMeu && !semSeguir && (
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
        **O selo é um link, e foi o Matheus quem cobrou isso** (30/07): *"esse
        ícone precisa ser clicável dentro do mural, que hoje não é, e levaria para
        uma página onde só mostraria perguntas"*.

        Ele está aplicando a régua da §4.59 — rótulo que nomeia uma categoria e não
        leva até ela morre na tela. É a mesma razão pela qual o selo tinha saído em
        29/07: sem destino, era enfeite. Agora tem `/perguntas`.
      */}
      {post.pergunta &&
        (resolvida ? (
          /*
            **A pergunta resolvida troca de selo** (§4.92). Enquanto o selo
            laranja diz *"isto espera uma resposta"*, este diz *"já foi
            respondida, e foi assim"* — e o verde é a cor de resolvido no resto
            do app. Sem isto, a lista de perguntas não sabe distinguir a que
            fechou da que ninguém respondeu, e as duas coisas ficam iguais.
          */
          <span
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-emerald-400"
            data-testid="selo-resolvida"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            Resolvida
          </span>
        ) : (
          <Link
            href="/perguntas"
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary/25"
            data-testid="selo-pergunta"
          >
            <HelpCircle className="h-3 w-3" />
            Pergunta
          </Link>
        ))}

      {editando ? (
        <EditarOTexto post={post} onPronto={() => setEditando(false)} />
      ) : (
        post.texto && (
          <TextoDoPost
            texto={post.texto}
            mencoes={post.mencoes}
            className={
              post.objeto
                ? "mt-2 text-[14px] leading-relaxed text-white/85"
                : /* Sem objeto, o texto **é** o cartão: corpo maior e entrelinha
                     larga, para ter presença em vez de virar buraco. */
                  "mt-2.5 font-display text-[19px] font-semibold leading-snug tracking-tight text-white/90"
            }
          />
        )
      )}

      {post.objeto?.tipo === "livro" && <CapaDoLivro bookId={post.objeto.bookId} />}
      {post.objeto?.tipo === "trecho" && (
        <div className="mt-3">
          <CitacaoDeAudio citacao={post.objeto.citacao} grande />
        </div>
      )}
      {post.objeto?.tipo === "clube" && <CartaoDoClube clubeId={post.objeto.clubeId} />}
      {post.objeto?.tipo === "pessoa" && <CartaoDePessoa slug={post.objeto.slug} />}
      {citado && <PostCitado post={citado} />}

      <AcoesDoPost
        post={post}
        onEditar={() => setEditando(true)}
        comentariosAbertos={comentando}
        onComentar={() => setComentando((valor) => !valor)}
        compartilhandoAberto={compartilhando}
        onCompartilhar={() => setCompartilhando((valor) => !valor)}
      />

      {compartilhando && (
        <CaixaDeCompartilhar post={post} onPronto={() => setCompartilhando(false)} />
      )}

      {/*
        **A conversa abre no lugar, e só quando pedida.** Feed com cinco
        comentários abertos por post deixa de ser feed — a pessoa rola dez telas
        para ver quatro posts. O contador na barra já diz que há conversa.

        `abrirSempre` existe para a página de um post só (`/post/:id`), onde
        esconder a conversa não faria sentido: quem chegou ali chegou por ela.
      */}
      {(comentando || abrirSempre) && <ComentariosDoPost post={post} />}
    </article>
  );
}

/**
 * Compartilhar — **com a opção de escrever em cima**.
 *
 * A caixa abre no lugar, embaixo da barra de ações, e não numa folha que cobre a
 * tela: compartilhar é gesto de passagem, e tirar a pessoa do feed para isso a
 * faz perder o lugar na rolagem (o mesmo argumento da lista de membros do clube,
 * §4.59).
 *
 * **O texto é opcional, e os dois caminhos são um toque:** publicar vazio faz o
 * recompartilhamento simples; escrever antes faz a citação. Não há escolha de
 * "tipo" a fazer — a forma sai do que você fez, que é como o Twitter e o
 * Facebook resolvem isso.
 *
 * **Quem já compartilhou entra editando:** a caixa abre com o seu texto, o botão
 * vira "Salvar" e aparece o "Desfazer". Foi o pedido do Matheus — *"ela pode
 * editar, comentar e tal"* — e é o que faz o botão aceso significar um estado, e
 * não um contador de vezes.
 */
function CaixaDeCompartilhar({ post, onPronto }: { post: Post; onPronto: () => void }) {
  const { toast } = useToast();
  const meu = meuCompartilhamentoDe(post.id);
  const [texto, setTexto] = useState(meu?.texto ?? "");

  return (
    <div
      className="mt-2.5 rounded-xl bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/10"
      data-testid={`caixa-compartilhar-${post.id}`}
    >
      <textarea
        value={texto}
        onChange={(evento) => setTexto(evento.target.value.slice(0, MAX_POST))}
        placeholder="Escreva algo sobre isto (opcional)…"
        autoFocus
        rows={2}
        className="w-full resize-none bg-transparent px-1 text-[13.5px] leading-relaxed placeholder:text-white/30 focus:outline-none"
        data-testid="texto-do-compartilhamento"
      />

      <div className="mt-1.5 flex items-center justify-end gap-2">
        {meu && (
          <button
            onClick={() => {
              desfazerCompartilhamento(post.id);
              onPronto();
              toast({ title: "Compartilhamento desfeito" });
            }}
            className="mr-auto rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold text-white/40 transition-colors hover:text-white/80"
            data-testid="desfazer-compartilhamento"
          >
            Desfazer
          </button>
        )}
        <button
          onClick={onPronto}
          className="rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            compartilharPost(post.id, texto);
            onPronto();
            toast({
              title: meu ? "Compartilhamento atualizado" : "Compartilhado",
              description: meu
                ? undefined
                : texto.trim()
                  ? "Está no seu perfil e no feed, com o que você escreveu."
                  : "Está no seu perfil e no feed, com o seu nome em cima.",
            });
          }}
          className="rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-primary-foreground"
          data-testid="confirmar-compartilhamento"
        >
          {meu ? "Salvar" : "Compartilhar"}
        </button>
      </div>
    </div>
  );
}

/**
 * Reescrever o texto de um post seu, **no lugar**.
 *
 * Editar foi decisão do Matheus contra o meu argumento (§4.58): *"nas grandes
 * plataformas você consegue editar"*. A condição que ficou é o selo "editado",
 * que a `editarPost` grava — sem ele, o autor vira o sentido do texto e faz os
 * comentários anteriores parecerem loucos.
 *
 * **Edita-se o texto, não o anexo.** Trocar a capa depois de o post circular
 * seria a troca de sentido que nem o selo consegue avisar: quem já viu o cartão
 * viu outro livro. Para trocar o objeto, apaga e escreve de novo.
 *
 * **A menção continua funcionando aqui** porque o campo é o mesmo do compositor
 * (`CampoComMencao`) — dá para citar um livro novo ao corrigir a frase.
 */
function EditarOTexto({ post, onPronto }: { post: Post; onPronto: () => void }) {
  const [texto, setTexto] = useState(post.texto);
  const [mencoes, setMencoes] = useState<Mencao[]>(post.mencoes ?? []);

  return (
    <div className="mt-2 rounded-xl bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/10">
      <CampoComMencao
        texto={texto}
        mencoes={mencoes}
        onMudar={(novoTexto, novasMencoes) => {
          setTexto(novoTexto);
          setMencoes(novasMencoes);
        }}
        placeholder="Escreva de novo…"
        autoFocus
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          onClick={onPronto}
          className="rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
          data-testid="cancelar-edicao"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            editarPost(post.id, texto, mencoes);
            onPronto();
          }}
          disabled={texto.trim().length === 0 && post.objeto === undefined}
          className="rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-primary-foreground disabled:opacity-30"
          data-testid="salvar-edicao"
        >
          Salvar
        </button>
      </div>
    </div>
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
      className="sobre-midia relative mt-3 flex items-center gap-3.5 overflow-hidden rounded-xl p-3.5"
      data-testid="post-livro"
    >
      {/* A própria capa, desfocada e escurecida, é o fundo. Nada de cor nova.
          Fundo escuro nos dois temas ⇒ o bloco leva `sobre-midia`. */}
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
 * A pessoa citada — **e quem preenche o cartão são os livros dela** (30/07).
 *
 * **A ideia foi do Matheus; a ressalva foi minha, e ela está no desenho.** Ele
 * propôs *"um cartãozinho que levaria para aquele perfil, assim como já existe nos
 * livros"*. Meu receio, com a §4.53 na mão: as **onze** maquetes de Comunidade
 * falharam porque o feed era **sobre pessoas** — texto sem corpo —, e neste app
 * quase nenhum autor tem foto (o avatar é uma inicial colorida). Um cartão de
 * rosto ao lado de um cartão de capa perde sempre.
 *
 * O acordo: o cartão existe, **e o corpo dele são as capas**. A fileira de livros
 * é o que dá presença, e é também a informação que decide se você quer o perfil —
 * *"quem é essa narradora?"* se responde vendo o que ela narrou, não vendo a cara
 * dela.
 *
 * **Sem livro nenhum não há cartão** (`return null`): sobraria um retângulo com um
 * nome, que é exatamente o cru de que ele reclamou nas maquetes antigas.
 */
function CartaoDePessoa({ slug }: { slug: string }) {
  const pessoa = findPerson(slug);
  if (!pessoa) return null;

  /* O chapéu vem do que ela **fez**, e a ordem segue o peso: quem escreveu e
     narrou aparece como as duas coisas. */
  const chapeus = [
    pessoa.wrote.length > 0 ? `${pessoa.wrote.length} ${pessoa.wrote.length === 1 ? "livro escrito" : "livros escritos"}` : null,
    pessoa.narrated.length > 0
      ? `${pessoa.narrated.length} ${pessoa.narrated.length === 1 ? "narração" : "narrações"}`
      : null,
  ].filter(Boolean);

  /* Prioriza o que ela narrou: no AllBook a voz é o motivo de escolha (§4.15). */
  const capas = [...pessoa.narrated, ...pessoa.wrote].slice(0, 5);
  if (capas.length === 0) return null;

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/8"
      data-testid="post-pessoa"
    >
      <div className="flex items-center gap-3 p-3.5 pb-2.5">
        <Link href={`/person/${pessoa.slug}`} className="shrink-0">
          {pessoa.photo ? (
            <img
              src={pessoa.photo}
              alt={pessoa.name}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-white/15"
            />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-lg font-bold">
              {pessoa.name.charAt(0)}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/person/${pessoa.slug}`} className="block">
            <span className="block truncate font-display text-[15px] font-bold leading-tight hover:text-primary">
              {pessoa.name}
            </span>
          </Link>
          <span className="mt-0.5 block truncate text-[11.5px] text-white/45">
            {chapeus.join(" · ")}
          </span>
        </div>

        <Link
          href={`/person/${pessoa.slug}`}
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/12 px-3 py-2 text-[11.5px] font-bold transition-colors hover:bg-white/20"
          data-testid="ver-perfil-pessoa"
        >
          Ver perfil
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* **As capas são o cartão.** Rolam de lado quando são muitas, e cada uma
          abre o livro dela — número que não leva ao objeto morre na tela (§4.59). */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3.5 pb-3.5">
        {capas.map((livro) => (
          <Link key={livro.id} href={`/book/${livro.id}`} className="shrink-0">
            <img
              src={livro.cover}
              alt={livro.title}
              className="h-[74px] w-[50px] rounded-md object-cover shadow-md shadow-black/40 ring-1 ring-white/10 transition-transform hover:scale-105"
            />
          </Link>
        ))}
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
export function CartaoDoClube({ clubeId }: { clubeId: string }) {
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
      {/* Fundo escuro nos dois temas (capa borrada + véu) ⇒ `sobre-midia`. */}
      <div className="sobre-midia relative flex items-start gap-3.5 p-3.5">
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
          <span className="inline-block rounded-full bg-primary px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
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

      <div className="relative flex items-center justify-between border-t border-white/[0.07] bg-background/60 px-3 py-2.5">
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
          Ver o clube
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
        className="max-h-[75vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-card p-5 pb-9 animate-in slide-in-from-bottom duration-300"
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
                  )} font-display text-sm font-bold`} {...avatarDeLeitor(
                    slug,
                  )}
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
