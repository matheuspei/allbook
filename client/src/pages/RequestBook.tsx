import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AudioLines, Check, Clock, Headphones, Mic, Trash2 } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import PersonAvatar from "@/components/PersonAvatar";
import { useToast } from "@/hooks/use-toast";
import { findVoice, studioVoices } from "@/lib/studio";
import { findPerson } from "@/lib/people";
import {
  MAX_REQUEST_NOTE,
  MAX_REQUEST_TITLE,
  REQUEST_STEPS,
  addRequest,
  alreadyInCatalog,
  myRequests,
  removeRequest,
  type BookRequest,
} from "@/lib/requests";

/**
 * Pedir um livro que ainda não existe em áudio — a tela do diferencial do app.
 *
 * **Por que ela existe.** O ROTEIRO já registrava a ideia central: a pessoa
 * escolhe **qualquer** livro e, se ele nunca foi narrado, o AllBook Studio
 * produz. Só que não havia **onde pedir** — o app era uma vitrine fechada, e o
 * que não estava no catálogo não existia para quem usa. Esta tela é a porta.
 *
 * **Ela chega por dois caminhos**, e o mais importante é o segundo:
 * 1. pela tela do estúdio, para quem foi ver quem produz as narrações;
 * 2. **pela busca sem resultado** — quem procurou um título e não achou está no
 *    momento exato de intenção. Ali o app deixa de dizer só "nada encontrado" e
 *    passa a oferecer produzir, com o título já preenchido (`?titulo=`).
 *
 * **Sobre plano e preço não há uma palavra**, de propósito: o ROTEIRO registra
 * que isso está em aberto, e tela que inventa número vira promessa que o produto
 * não fez.
 *
 * **A reforma de 26/07 (ver ROTEIRO 4.28): a tela deixou de prometer o que não
 * pode cumprir.** O formulário exigia "quem narra" logo de saída, e o Matheus viu
 * o furo: muitos livros **já foram narrados**, e nesses casos o AllBook traz a
 * narração que existe — nenhuma voz escolhida vale, e a escolha era promessa
 * quebrada. Pior: quem pede **não tem como saber** se o livro já tem áudio. Duas
 * mudanças saíram disso:
 * 1. a escolha da voz ganhou um "se" no rótulo — *"quem narra, se o estúdio
 *    gravar"* —, então ela nunca promete o que não pode cumprir;
 * 2. o app confere **na hora** o que ele conhece de fato — o próprio catálogo —
 *    e avisa quando o livro já está lá, com o link para ouvir agora.
 *
 * **O que foi tentado e desfeito no mesmo dia:** um par de opções perguntando
 * *"se já existir narração, pode ser ela ou você quer uma do estúdio?"*. Funcionava
 * como interface e era ruim como negócio — ver o motivo no ROTEIRO 4.28. Em uma
 * frase: trazer uma narração pronta é mais barato para o AllBook do que gravar, e
 * o botão oferecia o caminho caro para quem se contentaria com o barato.
 */
export default function RequestBook() {
  const { toast } = useToast();

  // Título vindo da busca sem resultado (`/request?titulo=...`). Lido do
  // `window.location` e não de um hook de rota para não depender da API de
  // query do wouter, que muda entre versões.
  const [titulo, setTitulo] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("titulo")?.slice(0, MAX_REQUEST_TITLE) ?? "";
    } catch {
      return "";
    }
  });
  const [autor, setAutor] = useState("");
  const [observacao, setObservacao] = useState("");
  /** `undefined` = deixar o estúdio escolher. É o padrão, não um vazio. */
  const [vozEscolhida, setVozEscolhida] = useState<string | undefined>(undefined);
  const [pedidos, setPedidos] = useState<BookRequest[]>([]);

  /**
   * O livro já está no AllBook? É a única das três respostas possíveis que o app
   * dá **na hora** — o catálogo ele conhece. Evita alguém esperar 24 horas por um
   * livro que já pode ouvir agora, e é aqui que aparece a saída de quem já ouviu
   * e não gostou: pedir a mesma obra numa voz do estúdio.
   */
  const jaTemos = useMemo(() => alreadyInCatalog(titulo), [titulo]);

  // `localStorage` só existe no navegador — daí ler depois de montar.
  useEffect(() => {
    setPedidos(myRequests());
    window.scrollTo(0, 0);
  }, []);

  function enviar() {
    const limpo = titulo.trim();
    if (!limpo) return;

    addRequest({ title: limpo, author: autor, note: observacao, voiceSlug: vozEscolhida });
    setPedidos(myRequests());
    setTitulo("");
    setAutor("");
    setObservacao("");
    setVozEscolhida(undefined);
    toast({
      title: "Pedido registrado",
      description: `"${limpo}" entrou na sua lista de pedidos.`,
    });
  }

  function apagar(id: string) {
    removeRequest(id);
    setPedidos(myRequests());
    toast({ title: "Pedido removido" });
  }

  return (
    <div className="pb-10" data-testid="page-request-book">
      <PageHeader title="Pedir um livro" />

      <header className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(115% 75% at 50% 0%, hsl(24 100% 50%) 0%, transparent 68%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background"
        />

        <div className="relative flex flex-col items-center px-5 pb-6 pt-8 text-center">
          {/* Microfone, e não a estrelinha de "IA": o app vende narração
              profissional, e o ícone de varinha mágica é o clichê visual que o
              ROTEIRO ("Estilo: evitar a cara de IA") manda evitar. */}
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 ring-2 ring-white/15 shadow-lg shadow-black/40">
            <Mic className="h-8 w-8 text-primary" />
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-white">
            Qualquer livro,
            <br />
            narrado em 24 horas
          </h1>

          {/* A promessa de prazo é a propaganda central do produto (ROTEIRO
              4.17). Fica no alto, como chip, porque é ela que faz a pessoa
              pedir — e não uma linha perdida no meio do texto. O prazo mora em
              `REQUEST_PROMISE`, para não existirem duas versões dele no app. */}
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/30">
            <Clock className="h-3 w-3" />
            Do pedido ao play em um dia
          </span>

          {/*
            As duas metades da promessa, uma frase para cada, na ordem em que o
            pedido acontece. **Cortado o aparte entre travessões** ("e a maioria
            dos livros nunca ganhou", 26/07): o Matheus achou que ele não fazia
            sentido ali — é estatística sobre o mercado, não sobre o que vai
            acontecer com o pedido dele, e enfraquecia justo a frase que precisa
            ser forte. O que fica é o que o app faz: traz, ou grava.
          */}
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            Diga qual livro você quer ouvir. Se ele já existe em áudio, o AllBook traz para dentro
            do app. Se ainda não existe, o{" "}
            <Link href="/studio" className="font-semibold text-primary hover:underline">
              AllBook Studio
            </Link>{" "}
            grava a obra inteira, do primeiro ao último capítulo.
          </p>
        </div>
      </header>

      <section className="px-5" data-testid="request-form">
        <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4">
          <Campo
            rotulo="Título do livro"
            obrigatorio
            valor={titulo}
            aoMudar={(v) => setTitulo(v.slice(0, MAX_REQUEST_TITLE))}
            placeholder="Ex.: O Nome do Vento"
            testid="input-request-title"
          />

          {/*
            A resposta que o app pode dar na hora, sem servidor: o catálogo ele
            conhece. Sem este aviso, alguém pedia — e esperava 24 horas por — um
            livro que já podia ouvir naquele segundo. O aviso **não bloqueia** o
            botão de pedir: o campo pode ter casado com o livro errado (títulos
            parecidos existem), e travar o pedido por um palpite do app seria
            pior do que informar e deixar a pessoa decidir.
          */}
          {jaTemos && (
            <div
              className="flex gap-3 rounded-lg border border-primary/25 bg-primary/[0.07] p-3"
              data-testid="notice-already-in-catalog"
            >
              <img
                src={jaTemos.cover}
                alt=""
                aria-hidden="true"
                className="h-16 w-11 shrink-0 rounded object-cover ring-1 ring-white/10"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-white">
                  Este já está no AllBook
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-white/55">
                  <span className="text-white/75">{jaTemos.title}</span>, narrado por{" "}
                  {jaTemos.narrator}. Não precisa pedir — dá para ouvir agora.
                </p>
                <Link
                  href={`/book/${jaTemos.id}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
                  data-testid="link-listen-existing"
                >
                  <Headphones className="h-3.5 w-3.5" />
                  Ouvir agora
                </Link>
              </div>
            </div>
          )}

          <Campo
            rotulo="Autor"
            valor={autor}
            aoMudar={setAutor}
            placeholder="Se souber — ajuda a achar o livro certo"
            testid="input-request-author"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-widest text-white/40">
              Alguma observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value.slice(0, MAX_REQUEST_NOTE))}
              rows={3}
              placeholder="Edição, tradução, idioma… o que ajudar a produzir do jeito que você quer."
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
              data-testid="input-request-note"
            />
            <span className="block text-right text-[10px] text-white/25">
              {observacao.length}/{MAX_REQUEST_NOTE}
            </span>
          </div>

          {/*
            Escolher a voz (pedido do Matheus, 25/07). Os perfis das vozes já
            existiam; faltava deixar a pessoa dizer qual delas quer. **"O estúdio
            escolhe" é a primeira opção e o padrão** porque quem está pedindo um
            livro que nem existe ainda quase nunca conhece o elenco — obrigar a
            escolher antes de pedir seria pôr um obstáculo na frente do
            diferencial do app.

            **O rótulo carrega um "se", e é essa palavra que conserta a promessa
            quebrada** (26/07, ROTEIRO 4.28): quando o livro já tem narração, o
            AllBook traz a que existe e voz nenhuma se aplica. Dizer "se o estúdio
            gravar" é mais honesto do que esconder o campo — quem quer opinar
            continua podendo, sabendo exatamente quando a opinião vale.
          */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-widest text-white/40">
              Quem narra, se o estúdio gravar
            </label>
            <p className="text-[12px] leading-snug text-white/40">
              Vale quando o livro ainda não tem narração — o caso da maioria. Se preferir, o estúdio
              escolhe a voz que combina com o título.
            </p>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
              <OpcaoDeVoz
                nome="O estúdio escolhe"
                automatica
                selecionada={!vozEscolhida}
                aoClicar={() => setVozEscolhida(undefined)}
                testid="option-voice-auto"
              />
              {studioVoices.map((voz) => (
                <OpcaoDeVoz
                  key={voz.slug}
                  nome={voz.name}
                  foto={findPerson(voz.slug)?.photo}
                  selecionada={vozEscolhida === voz.slug}
                  aoClicar={() => setVozEscolhida(voz.slug)}
                  testid={`option-voice-${voz.slug}`}
                />
              ))}
            </div>

            {/* O timbre da voz escolhida, para a escolha ser informada e não
                só um rosto bonito numa fileira. */}
            <p className="min-h-[32px] text-[12px] leading-snug text-white/45">
              {vozEscolhida
                ? findVoice(vozEscolhida)?.timbre
                : "O estúdio ouve o texto e escolhe entre as 11 vozes da casa."}
            </p>
          </div>

          <button
            type="button"
            onClick={enviar}
            disabled={titulo.trim().length === 0}
            className="h-12 w-full rounded-lg bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/25"
            data-testid="button-send-request"
          >
            Pedir esta narração
          </button>
        </div>

        {/*
          O aviso é curto e verdadeiro. Sem servidor, o pedido não sai do
          aparelho — dizer o contrário faria a pessoa esperar por algo que não
          está a caminho. Sobre plano e preço, nada: está em aberto no ROTEIRO.
        */}
        <p className="mt-3 px-1 text-[12px] leading-relaxed text-white/35">
          Enquanto o AllBook está em fase aberta, pedir não custa nada. Por ora o pedido fica
          guardado neste aparelho: o estúdio ainda não está ligado do outro lado.
        </p>
      </section>

      <section className="px-5 pt-8" data-testid="request-path">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
          <AudioLines className="h-4 w-4 text-primary" />
          O caminho do pedido
        </h2>

        <ol className="mt-3 space-y-3">
          {REQUEST_STEPS.map((etapa, indice) => (
            <li key={etapa.status} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] font-bold text-white/40 ring-1 ring-white/10">
                {indice + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{etapa.label}</span>
                <span className="block text-[12px] leading-snug text-white/45">{etapa.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {pedidos.length > 0 && (
        <section className="px-5 pt-8" data-testid="my-requests">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
            <Check className="h-4 w-4 text-primary" />
            Seus pedidos
            <span className="ml-auto text-xs font-normal text-white/40">
              {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            </span>
          </h2>

          <div className="mt-3 space-y-2">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4"
                data-testid={`card-request-${pedido.id}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{pedido.title}</span>
                  {pedido.author && (
                    <span className="block text-[12px] text-white/45">{pedido.author}</span>
                  )}
                  {pedido.note && (
                    <span className="mt-1 block text-[12px] leading-snug text-white/35 italic">
                      "{pedido.note}"
                    </span>
                  )}
                  {/* A voz vem com "se" na frente pelo mesmo motivo do
                      formulário: ela só entra em cena caso o estúdio precise
                      gravar. Sem o "se", o cartão prometia uma voz que pode
                      nunca ser usada. */}
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] text-primary ring-1 ring-primary/25">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {REQUEST_STEPS[0].label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                      <Mic className="h-3 w-3" />
                      Se gravar:{" "}
                      {pedido.voiceSlug
                        ? (findVoice(pedido.voiceSlug)?.name ?? "voz do estúdio")
                        : "voz escolhida pelo estúdio"}
                    </span>
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => apagar(pedido.id)}
                  aria-label={`Remover o pedido de ${pedido.title}`}
                  className="p-1 text-white/25 transition-colors hover:text-white/60"
                  data-testid={`button-remove-request-${pedido.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Um rosto na fileira de escolha da voz. */
function OpcaoDeVoz({
  nome,
  foto,
  automatica,
  selecionada,
  aoClicar,
  testid,
}: {
  nome: string;
  foto?: string;
  /** A opção "o estúdio escolhe" — não tem rosto, tem a marca do estúdio. */
  automatica?: boolean;
  selecionada: boolean;
  aoClicar: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={selecionada}
      className={`flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
        selecionada ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-white/5"
      }`}
      data-testid={testid}
    >
      {automatica ? (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-2 ring-white/15">
          <AudioLines className="h-4 w-4 text-primary" />
        </span>
      ) : (
        <PersonAvatar name={nome} photo={foto} size="sm" />
      )}
      <span
        className={`text-[10px] leading-tight ${selecionada ? "font-semibold text-primary" : "text-white/55"}`}
      >
        {nome}
      </span>
    </button>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  obrigatorio,
  testid,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder: string;
  obrigatorio?: boolean;
  testid: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] uppercase tracking-widest text-white/40">
        {rotulo}
        {obrigatorio && <span className="ml-1 text-primary">*</span>}
      </label>
      <input
        type="text"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
        data-testid={testid}
      />
    </div>
  );
}
