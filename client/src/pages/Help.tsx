import { useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, LifeBuoy } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { PERCENT_PARA_AVALIAR, MINIMO_PARA_MEDIA } from "@/lib/ratings";
import { REQUEST_PROMISE } from "@/lib/requests";

/**
 * Ajuda e suporte — as perguntas que o próprio app levanta.
 *
 * **Por que ela existe.** No Perfil, "Ajuda e suporte" era um dos dois itens que
 * só mostravam um aviso de "em breve" — beco sem saída (ROTEIRO 4.23). Uma tela
 * de perguntas frequentes **não depende de servidor**: o conteúdo é o próprio
 * funcionamento do app, que já está construído.
 *
 * **As respostas saem do código, não de um texto solto.** O tanto que é preciso
 * ouvir para avaliar e o mínimo de avaliações para a média vêm de `ratings.ts`,
 * e o prazo do pedido vem de `requests.ts`. Se a regra mudar lá, esta tela muda
 * junto — uma ajuda que envelhece é pior do que nenhuma.
 *
 * **Sem canal de contato, por ora.** Um formulário que não envia seria o mesmo
 * beco sem saída em outro lugar. Quando houver um e-mail de suporte de verdade,
 * é uma linha aqui embaixo.
 */

interface Pergunta {
  pergunta: string;
  resposta: React.ReactNode;
}

const grupos: { titulo: string; perguntas: Pergunta[] }[] = [
  {
    titulo: "Ouvir e encontrar",
    perguntas: [
      {
        pergunta: "E se o livro que eu quero não estiver no catálogo?",
        resposta: (
          <>
            Você pode pedir. Na busca, quando nada é encontrado, aparece a opção de encomendar a
            narração — ou vá direto em{" "}
            <Link href="/request" className="font-semibold text-primary hover:underline">
              pedir um livro
            </Link>
            . O estúdio grava o título inteiro e entrega {REQUEST_PROMISE}.
          </>
        ),
      },
      {
        pergunta: "Quem narra os audiolivros?",
        resposta: (
          <>
            As narrações são produzidas pelo{" "}
            <Link href="/studio" className="font-semibold text-primary hover:underline">
              AllBook Studio
            </Link>
            . Cada voz tem nome, timbre e um tipo de livro em que funciona melhor, e você pode
            escolher qual delas quer ao pedir um título — ou deixar o estúdio escolher.
          </>
        ),
      },
      {
        pergunta: "Dá para ouvir sem internet?",
        resposta: (
          <>
            Sim. No menu de opções de cada livro há a opção de baixar, e o que você baixou fica
            reunido em{" "}
            <Link href="/downloads" className="font-semibold text-primary hover:underline">
              Downloads
            </Link>
            .
          </>
        ),
      },
      {
        pergunta: "Onde ficam os livros que eu salvei?",
        resposta: (
          <>
            Na{" "}
            <Link href="/library" className="font-semibold text-primary hover:underline">
              Biblioteca
            </Link>
            , que reúne tudo que é seu: o que você salvou na Minha lista, o que está ouvindo — mesmo
            sem ter salvado — e o que baixou.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Avaliações e comentários",
    perguntas: [
      {
        pergunta: "Por que não consigo avaliar um livro?",
        resposta: (
          <>
            A nota só abre depois de {PERCENT_PARA_AVALIAR}% ouvidos. É proposital: avaliação de
            quem não ouviu não ajuda ninguém a escolher.
          </>
        ),
      },
      {
        pergunta: "Por que alguns livros não mostram nota da comunidade?",
        resposta: (
          <>
            A média só aparece a partir de {MINIMO_PARA_MEDIA} avaliações. Com duas ou três notas, a
            média diz mais sobre quem avaliou do que sobre o livro.
          </>
        ),
      },
      {
        pergunta: "Posso comentar em qualquer lugar?",
        resposta: (
          <>
            Sim — na página de qualquer livro, e também nos perfis de autor, de narrador e de
            editora. Seus comentários podem ser apagados por você a qualquer momento.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Conta e cobrança",
    perguntas: [
      {
        pergunta: "O AllBook é pago?",
        resposta: (
          <>
            Não. O app está em fase aberta e tudo — inclusive pedir a narração de um livro — é
            gratuito enquanto durar essa fase.
          </>
        ),
      },
      {
        pergunta: "Como mudo meu nome, foto ou e-mail?",
        resposta: (
          <>
            Em{" "}
            <Link href="/profile/edit" className="font-semibold text-primary hover:underline">
              editar perfil
            </Link>
            . Downloads e espaço ficam em{" "}
            <Link href="/settings" className="font-semibold text-primary hover:underline">
              Neste aparelho
            </Link>
            .
          </>
        ),
      },
      {
        pergunta: "Meus dados ficam guardados onde?",
        resposta: (
          <>
            Neste aparelho, por enquanto. Biblioteca, downloads, avaliações e comentários vivem no
            seu navegador — ainda não há servidor de contas, então nada disso viaja para outro
            aparelho.
          </>
        ),
      },
    ],
  },
];

export default function Help() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pb-10" data-testid="page-help">
      <PageHeader title="Ajuda e suporte" fallback="/profile" />

      <header className="px-5 pt-6 pb-2">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
          Como podemos ajudar?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          As dúvidas mais comuns sobre como o AllBook funciona.
        </p>
      </header>

      {grupos.map((grupo) => (
        <section
          key={grupo.titulo}
          className="px-5 pt-7"
          data-testid={`help-group-${grupo.titulo}`}
        >
          <h2 className="font-display text-lg font-bold tracking-tight text-white">
            {grupo.titulo}
          </h2>

          <div className="mt-3 space-y-2">
            {grupo.perguntas.map((item) => (
              <article
                key={item.pergunta}
                className="rounded-xl border border-white/5 bg-white/5 p-4"
                data-testid="help-item"
              >
                <h3 className="text-sm font-semibold text-white">{item.pergunta}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{item.resposta}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="px-5 pt-8" data-testid="help-footer">
        <Link
          href="/studio"
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">
              Quer entender como as narrações são feitas?
            </span>
            <span className="block text-[12px] leading-snug text-white/50">
              O estúdio explica o processo e apresenta as vozes da casa.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
        </Link>
      </section>
    </div>
  );
}
