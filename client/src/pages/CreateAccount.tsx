import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "wouter";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function CreateAccount() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { entrarComSessaoExistente } = useAuth();

  const [email, setEmail] = useState<string | null>(null);
  const [erroToken, setErroToken] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) {
      setErroToken("Cadastro só por convite. Peça pro admin te convidar.");
      return;
    }
    api
      .getInvite(token)
      .then((res) => setEmail(res.email))
      .catch((err) => setErroToken(err instanceof Error ? err.message : "Convite inválido ou expirado"));
  }, [token]);

  const aoSubmeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const usuario = await api.redeemInvite(token, nome, senha);
      entrarComSessaoExistente(usuario);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setEnviando(false);
    }
  };

  if (erroToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
        <div className="surface-card w-full max-w-[360px] p-6 text-center">
          <p className="text-sm text-destructive">{erroToken}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form onSubmit={aoSubmeter} className="surface-card w-full max-w-[360px] p-6">
        <h1 className="text-lg font-semibold mb-1">Criar conta</h1>
        <p className="text-sm text-muted-foreground mb-6">{email ?? "Validando convite..."}</p>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
          <input
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
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
          disabled={enviando || !email}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
        >
          {enviando ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
