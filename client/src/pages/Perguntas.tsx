import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, HelpCircle } from "lucide-react";

import CartaoDePost from "@/components/comunidade/CartaoDePost";
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
 * **O que ela vai ganhar quando existirem respostas** (item 3 da §4.58): a divisão
 * entre "sem resposta" e "já respondidas". É o que dá utilidade de verdade — hoje
 * a página junta, amanhã ela cobra.
 */
export default function Perguntas() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const atualizar = () => setPosts(todosOsPosts().filter((post) => post.pergunta));
    atualizar();
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="perguntas-page">
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
          Comunidade
        </Link>
        <h1 className="relative mt-2.5 flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight">
          <HelpCircle className="h-6 w-6 text-primary" />
          Perguntas
        </h1>
        <p className="relative mt-1.5 text-sm text-white/45">
          {posts.length === 0
            ? "Ninguém perguntou nada por aqui ainda"
            : `${posts.length} ${posts.length === 1 ? "pergunta esperando" : "perguntas esperando"} uma opinião`}
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
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-bold text-black"
            data-testid="ir-perguntar"
          >
            Fazer uma pergunta
          </Link>
        </div>
      ) : (
        <div className="space-y-3 px-5 pt-1">
          {posts.map((post) => (
            <CartaoDePost key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
