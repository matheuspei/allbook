import { Link } from "wouter";
import { avatarDeLeitor } from "@/lib/community";
import { Radio } from "lucide-react";
import { useEffect, useState } from "react";

import { quantosPoderiaVer, quemEstaNoLivro, type PresencaNoLivro as Presenca } from "@/lib/presenca";
import { readSettings, saveSettings } from "@/lib/settings";
import { useToast } from "@/hooks/use-toast";

/**
 * "Quem está neste livro" — **por capítulo, nunca por segundo** (§4.58, item 8).
 *
 * A peça responde a uma pergunta que só um app de audiolivro pode responder:
 * *tem gente perto de mim neste livro?*. Perto no sentido que importa aqui —
 * mesmo trecho da história —, e não no de estar com o fone no ouvido agora.
 *
 * **Três formas, e a terceira é a que faz o recurso existir:**
 *
 * 1. Ligado e com gente: a fileira de quem está no livro, com o capítulo.
 * 2. Ligado e sem ninguém: **não aparece nada**. Um bloco vazio dizendo
 *    "ninguém por perto" é ruído — e num livro pouco ouvido seria permanente.
 * 3. **Desligado, mas com gente que você poderia ver:** o convite, com o número
 *    real. Sem ele, o interruptor pediria um sim no escuro — e ninguém liga um
 *    recurso de privacidade sem saber o que ganha. A contagem não vaza nome nem
 *    capítulo.
 */
export default function PresencaNoLivro({ bookId }: { bookId: number }) {
  const { toast } = useToast();
  const [ligado, setLigado] = useState(() => readSettings().mostrarMeuCapitulo);
  const [gente, setGente] = useState<Presenca[]>([]);
  const [poderiaVer, setPoderiaVer] = useState(0);

  useEffect(() => {
    setGente(quemEstaNoLivro(bookId));
    setPoderiaVer(quantosPoderiaVer(bookId));
  }, [bookId, ligado]);

  if (ligado && gente.length === 0) return null;
  if (!ligado && poderiaVer === 0) return null;

  return (
    <section className="px-5 py-5" data-testid="presenca-no-livro">
      <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        <Radio className="h-3.5 w-3.5 text-primary" />
        Quem está neste livro
      </h2>

      {ligado ? (
        <div className="space-y-2.5">
          {gente.map(({ member, chapter, total }) => (
            <Link
              key={member.slug}
              href={`/user/${member.slug}`}
              className="flex items-center gap-3"
              data-testid={`presenca-${member.slug}`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${member.color} text-xs font-bold`} {...avatarDeLeitor(member.slug)}
              >
                {member.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{member.name}</span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.round((chapter / total) * 100)}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-white/40">
                cap. {chapter} de {total}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
          <p className="text-[12.5px] leading-relaxed text-white/60">
            <b className="text-white">
              {poderiaVer} {poderiaVer === 1 ? "pessoa" : "pessoas"}
            </b>{" "}
            que você segue e que te {poderiaVer === 1 ? "segue" : "seguem"} de volta{" "}
            {poderiaVer === 1 ? "está" : "estão"} ouvindo este livro. Para ver em que capítulo,
            mostre o seu — é troca.
          </p>
          <button
            onClick={() => {
              saveSettings({ ...readSettings(), mostrarMeuCapitulo: true });
              setLigado(true);
              toast({
                title: "Presença ligada",
                description: "Só o capítulo, e só para quem se segue com você. Dá para desligar em Privacidade.",
              });
            }}
            className="mt-2.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-black"
            data-testid="ligar-presenca"
          >
            Mostrar o meu capítulo
          </button>
        </div>
      )}
    </section>
  );
}
