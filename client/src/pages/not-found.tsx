import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <AlertCircle className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm text-white/60">
          Esta tela ainda não existe no AllBook.
        </p>
        <Link href="/">
          <Button className="mt-6">Voltar para o Início</Button>
        </Link>
      </div>
    </div>
  );
}
