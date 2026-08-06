import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Camera, Trash2 } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MAX_BIO,
  fileToSquareDataUrl,
  initialOf,
  readProfile,
  saveProfile,
  type Profile,
} from "@/lib/profile";

/**
 * Editar perfil (`/profile/edit`).
 *
 * A bio existe pensando nos comentários dos livros: é ela que aparece junto do
 * que a pessoa escreveu, para o leitor saber de quem é a opinião.
 */
export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Profile>(readProfile);
  const [saved, setSaved] = useState<Profile>(readProfile);

  useEffect(() => {
    const current = readProfile();
    setForm(current);
    setSaved(current);
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const nameError = form.name.trim().length === 0;

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onPickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Limpa o input para dar para escolher o mesmo arquivo de novo depois.
    event.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await fileToSquareDataUrl(file);
      update("photo", dataUrl);
    } catch (error) {
      toast({
        title: "Não deu para usar essa imagem",
        description: error instanceof Error ? error.message : "Tente outra foto.",
      });
    }
  }

  function onSave() {
    if (nameError) {
      toast({ title: "O nome não pode ficar vazio" });
      return;
    }

    const cleaned: Profile = {
      ...form,
      name: form.name.trim(),
      bio: form.bio.trim(),
    };

    try {
      saveProfile(cleaned);
    } catch {
      // Praticamente só acontece se o localStorage estiver cheio.
      toast({
        title: "Não consegui salvar",
        description: "O armazenamento do navegador parece estar cheio.",
      });
      return;
    }

    setSaved(cleaned);
    setForm(cleaned);
    toast({ title: "Perfil atualizado" });
    setLocation("/profile");
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="profile-edit-page">
      <PageHeader
        title="Editar perfil"
        fallback="/profile"
        action={
          <button
            onClick={onSave}
            disabled={!dirty || nameError}
            className="text-sm font-bold text-primary disabled:text-white/25 transition-colors shrink-0"
            data-testid="button-save-profile"
          >
            Salvar
          </button>
        }
      />

      <main className="px-5 py-6 space-y-8">
        <section className="flex flex-col items-center gap-3" data-testid="section-photo">
          <Avatar className="w-24 h-24">
            {form.photo && <AvatarImage src={form.photo} alt="Sua foto" className="object-cover" />}
            <AvatarFallback className="bg-white/10 text-white font-display font-semibold text-3xl">
              {initialOf(form.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              data-testid="button-pick-photo"
            >
              <Camera className="w-4 h-4" />
              {form.photo ? "Trocar foto" : "Escolher foto"}
            </button>

            {form.photo && (
              <button
                onClick={() => update("photo", "")}
                className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-red-400 transition-colors"
                data-testid="button-remove-photo"
              >
                <Trash2 className="w-4 h-4" />
                Remover foto
              </button>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={onPickPhoto}
            className="hidden"
            data-testid="input-photo"
          />
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-xs font-semibold text-white/40 uppercase tracking-wider">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={40}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors"
              data-testid="input-name"
            />
            {nameError && <p className="text-xs text-red-400">O nome não pode ficar vazio.</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="bio" className="block text-xs font-semibold text-white/40 uppercase tracking-wider">
                Bio
              </label>
              <span
                className={`text-[11px] ${
                  form.bio.length > MAX_BIO - 20 ? "text-primary" : "text-white/30"
                }`}
                data-testid="text-bio-count"
              >
                {form.bio.length}/{MAX_BIO}
              </span>
            </div>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => update("bio", e.target.value.slice(0, MAX_BIO))}
              rows={6}
              placeholder="Conte o que você gosta de ouvir — gêneros, autores favoritos, o que está na fila."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-white/25"
              data-testid="input-bio"
            />
            <p className="text-[11px] text-white/30">Aparece no seu perfil, visível para outros leitores.</p>
          </div>

        </section>

        <p className="text-[11px] text-white/25 leading-relaxed">
          Por enquanto o perfil fica salvo só neste navegador — ainda não existe conta nem servidor.
        </p>
      </main>
    </div>
  );
}
