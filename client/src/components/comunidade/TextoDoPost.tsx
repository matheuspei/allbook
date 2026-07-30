import { Link } from "wouter";

import { hrefDaMencao, type Mencao } from "@/lib/posts";

/**
 * O texto de um post, com as **menções virando link**.
 *
 * A menção é guardada fora do texto (ver `Mencao` em `lib/posts.ts`): o texto
 * fica limpo — `"me lembrou @Hábitos Atômicos"` — e a lista de menções vem ao
 * lado. Quem monta o link de volta é isto aqui.
 *
 * **A menção é texto com link, não um segundo cartão** (§4.58). Preserva o "um
 * objeto por post": o cartão continua sendo um só, e a menção é uma palavra
 * clicável.
 *
 * ⚠️ **Casa sempre o rótulo mais longo primeiro.** Se o post menciona *Helena
 * Vasques* e *Helena* (hipoteticamente), começar pelo curto quebraria o nome no
 * meio e deixaria " Vasques" solto. Ordenar por tamanho decrescente é o que
 * garante que o nome inteiro ganhe.
 *
 * **Menção que não casa volta a ser texto** — de propósito. Se a pessoa editou o
 * post e apagou parte do nome, o certo é a palavra deixar de ser link, e nunca um
 * link apontando para coisa que o texto não diz mais.
 */
export default function TextoDoPost({
  texto,
  mencoes,
  className,
}: {
  texto: string;
  mencoes?: Mencao[];
  className?: string;
}) {
  const pedacos = fatiar(texto, mencoes ?? []);

  return (
    /* `whitespace-pre-line`: quem escreve em dois parágrafos vê dois parágrafos.
       O compositor é um `textarea`, então a quebra de linha é possível. */
    <p className={`whitespace-pre-line ${className ?? ""}`} data-testid="texto-do-post">
      {pedacos.map((pedaco, i) =>
        typeof pedaco === "string" ? (
          pedaco
        ) : (
          <Link
            key={`${pedaco.rotulo}-${i}`}
            href={hrefDaMencao(pedaco.alvo)}
            className="font-semibold text-primary underline-offset-2 hover:underline"
            data-testid="mencao"
          >
            {pedaco.rotulo}
          </Link>
        ),
      )}
    </p>
  );
}

/** Quebra o texto em pedaços de texto puro e menções, na ordem em que aparecem. */
function fatiar(texto: string, mencoes: Mencao[]): (string | Mencao)[] {
  if (mencoes.length === 0) return [texto];

  const porTamanho = [...mencoes].sort((a, b) => b.rotulo.length - a.rotulo.length);
  const pedacos: (string | Mencao)[] = [];
  let sobra = "";
  let i = 0;

  while (i < texto.length) {
    if (texto[i] === "@") {
      const achada = porTamanho.find((mencao) =>
        texto.startsWith(`@${mencao.rotulo}`, i),
      );
      if (achada) {
        if (sobra) {
          pedacos.push(sobra);
          sobra = "";
        }
        pedacos.push(achada);
        i += achada.rotulo.length + 1;
        continue;
      }
    }
    sobra += texto[i];
    i += 1;
  }

  if (sobra) pedacos.push(sobra);
  return pedacos;
}
