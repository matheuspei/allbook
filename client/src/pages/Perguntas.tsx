import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, HelpCircle } from "lucide-react";

import CartaoDePost from "@/components/comunidade/CartaoDePost";
import { COMENTARIOS_EVENT, temResposta } from "@/lib/comentariosDePost";
import { POSTS_EVENT, todosOsPosts, type Post } from "@/lib/posts";
import { MURAL_EVENT } from "@/lib/mural";

/**
 * As perguntas da comunidade (`/perguntas`).
 *
 * **Por que uma página, e não o filtro que estava no feed** (30/07). O selo
 * "Pergunta" existia e não levava a lugar nenhum; o Matheus cobrou: *"esse ícone
 * precisa ser clicável dentro do mural, que hoje não é, e levaria para uma página
 * onde só mostraria perguntas"*. Ele está aplicando a régua da §4.59 — **rótulo
 * que nomeia uma categoria e não leva até ela morre na tela** — e o filtro local
 * não cumpria isso: mudava a lista embaixo da pessoa, sem endereço nem título.
 *
 * **Isto não é a "aba de perguntas" que a §4.58 rejeitou.** O que foi rejeitado
 * ali era dividir a Comunidade em duas plateias — dois lugares onde se escreve e
 * se lê por padrão. Esta página não é padrão de nada: é um **recorte sob
 * demanda**, alcançado pelo selo de um post ou pela pílula do feed. Pergunta
 * continua sendo um tipo de post, e continua aparecendo no feed junto com o resto.
 *
 * **A divisão em duas seções é decisão do Matheus (04/08, §4.98):** "Ainda sem
 * resposta" vem **em cima** — quem entra para ajudar acha na hora o que precisa
 * de gente — e "Respondidas" embaixo. Antes era um filtro de pílulas, que
 * escondia um dos lados; a divisão mostra os dois, na ordem que cobra.
 */
export default function Perguntas() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const atualizar = () => setPosts(todosOsPosts().filter((post) => post.pergunta));
    atualizar();
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    return () => {
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
      window.removeEventListener(COMENTARIOS_EVENT, atualizar);
    };
  }, []);

  const semResposta = posts.filter((post) => !temResposta(post.id));
  const respondidas = posts.filter((post) => temResposta(post.id));
  // Cabeçalho de seção só quando os DOIS grupos existem — com um só, seria
  // rótulo repetindo o que o subtítulo do topo já disse (§4.23: nada de ruído).
  const dividida = semResposta.length > 0 && respondidas.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24 text-white" data-testid="perguntas-page">
      <header className="relative overflow-hidden px-5 pb-4 pt-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <Link
          href="/community"
          className="relative inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/45 transition-colors hover:text-white"
          data-testid="voltar-comunidade"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Feed
        </Link>
        <h1 className="relative mt-2.5 flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight">
          <HelpCircle className="h-6 w-6 text-primary" />
          Perguntas
        </h1>
        <p className="relative mt-1.5 text-sm text-white/45">
          {posts.length === 0
            ? "Ninguém perguntou nada por aqui ainda"
            : semResposta.length === 0
              ? "Todas já têm resposta"
              : `${semResposta.length} ${semResposta.length === 1 ? "ainda espera" : "ainda esperam"} uma opinião`}
        </p>

      </header>

      {posts.length === 0 ? (
        /* Estado vazio com saída, não parede: quem chega aqui sem perguntas
           precisa saber onde se faz uma (§4.23). */
        <div className="mx-5 mt-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-[13px] leading-relaxed text-white/55">
            Quem quer indicação escreve um post e marca como <strong>Pergunta</strong> — ele
            aparece no feed e vem para cá.
          </p>
          <Link
            href="/community"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground"
            data-testid="ir-perguntar"
          >
            Perguntar no Feed
          </Link>
        </div>
      ) : (
        <div className="px-5 pt-1">
          {dividida && (
            <h2
              className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-primary"
              data-testid="secao-sem-resposta"
            >
              Ainda sem resposta
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px]">{semResposta.length}</span>
            </h2>
          )}
          <div className="space-y-3">
            {semResposta.map((post) => (
              <CartaoDePost key={post.id} post={post} />
            ))}
          </div>
          {dividida && (
            <h2
              className="mb-3 mt-7 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-white/40"
              data-testid="secao-respondidas"
            >
              Respondidas
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{respondidas.length}</span>
            </h2>
          )}
          <div className="space-y-3">
            {respondidas.map((post) => (
              <CartaoDePost key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
