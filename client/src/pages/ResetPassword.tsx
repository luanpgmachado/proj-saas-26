import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "wouter";
import { api } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [, navigate] = useLocation();
  const token = params.get("token") ?? "";

  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      return;
    }
    api
      .getResetPassword(token)
      .then(() => setTokenValido(true))
      .catch(() => setTokenValido(false));
  }, [token]);

  const aoSubmeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.resetPassword(token, senha);
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setEnviando(false);
    }
  };

  if (tokenValido === false) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
        <div className="surface-card w-full max-w-[360px] p-6 text-center">
          <p className="text-sm text-destructive">Link inválido ou expirado.</p>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
        <div className="surface-card w-full max-w-[360px] p-6 text-center">
          <p className="text-sm text-foreground mb-4">Senha redefinida. Entre com a senha nova.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form onSubmit={aoSubmeter} className="surface-card w-full max-w-[360px] p-6">
        <h1 className="text-lg font-semibold mb-1">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground mb-6">Escolha uma senha nova.</p>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-muted-foreground mb-1">Nova senha</span>
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            autoFocus
            className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
          />
        </label>

        {erro ? <p className="text-sm text-destructive mb-4">{erro}</p> : null}

        <button
          type="submit"
          disabled={enviando || tokenValido !== true}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
        >
          {enviando ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}
