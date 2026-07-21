/**
 * Perfil do usuário — nome, foto, bio e redes.
 *
 * Enquanto não existe backend nem contas, tudo mora no `localStorage` deste
 * navegador: é o perfil de uma pessoa só, nesta máquina. Quando a API existir,
 * `readProfile`/`saveProfile` viram chamadas de rede e o resto das telas não
 * precisa mudar.
 */

const STORAGE_KEY = "allbook_profile";

export interface Profile {
  name: string;
  email: string;
  /** Foto em data URL (o arquivo é reduzido antes de salvar). Vazio = usa a inicial. */
  photo: string;
  /**
   * Texto livre. Se a pessoa quiser divulgar uma rede social, escreve o @ aqui
   * por conta própria — o app não tem campo de link nem transforma isso em
   * link clicável, de propósito: não cabe à plataforma empurrar quem está aqui
   * para fora, nem abrir uma porta fácil para autopromoção.
   */
  bio: string;
}

export const MAX_BIO = 160;

export const defaultProfile: Profile = {
  name: "Matheus",
  email: "matheus@allbook.com.br",
  photo: "",
  bio: "",
};

export function readProfile(): Profile {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return defaultProfile;
    // Só os campos conhecidos: descarta o que sobrou de versões anteriores
    // (havia um campo de Instagram, retirado de propósito).
    return {
      name: typeof stored.name === "string" ? stored.name : defaultProfile.name,
      email: typeof stored.email === "string" ? stored.email : defaultProfile.email,
      photo: typeof stored.photo === "string" ? stored.photo : defaultProfile.photo,
      bio: typeof stored.bio === "string" ? stored.bio : defaultProfile.bio,
    };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** A inicial mostrada quando não há foto. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Reduz a imagem antes de guardar.
 *
 * Sem isso, uma foto de celular (vários MB) estoura o limite do localStorage,
 * que gira em torno de 5 MB — o salvamento falharia justo depois de a pessoa
 * ter escolhido a foto. Recorta no centro, em quadrado, e reduz para 256px.
 */
export function fileToSquareDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Esse arquivo não parece ser uma imagem."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não consegui preparar a imagem."));
          return;
        }

        // Recorta o maior quadrado central da foto original.
        const side = Math.min(image.width, image.height);
        const sx = (image.width - side) / 2;
        const sy = (image.height - side) / 2;

        ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };

      image.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
