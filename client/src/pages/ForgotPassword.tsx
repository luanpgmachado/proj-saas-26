import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoSubmeter = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    try {
      await api.forgotPassword(email);
      setMensagem("Se esse email tiver uma conta, enviamos um link de redefinição.");
    } catch {
      setMensagem("Se esse email tiver uma conta, enviamos um link de redefinição.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form onSubmit={aoSubmeter} className="surface-card w-full max-w-[360px] p-6">
        <h1 className="text-lg font-semibold mb-1">Esqueceu a senha?</h1>
        <p className="text-sm text-muted-foreground mb-6">Informe seu email pra receber um link de redefinição.</p>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-muted-foreground mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
            className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
          />
        </label>

        {mensagem ? <p className="text-sm text-muted-foreground mb-4">{mensagem}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar link"}
        </button>

        <Link href="/" className="block text-center text-sm text-muted-foreground mt-4 hover:text-foreground">
          Voltar pro login
        </Link>
      </form>
    </div>
  );
}
