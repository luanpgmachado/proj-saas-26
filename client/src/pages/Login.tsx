import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoSubmeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form onSubmit={aoSubmeter} className="surface-card w-full max-w-[360px] p-6">
        <h1 className="text-lg font-semibold mb-1">Finança Familiar</h1>
        <p className="text-sm text-muted-foreground mb-6">Entre com sua conta.</p>

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

        <label className="block mb-4">
          <span className="block text-xs font-medium text-muted-foreground mb-1">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
          />
        </label>

        {erro ? <p className="text-sm text-destructive mb-4">{erro}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
