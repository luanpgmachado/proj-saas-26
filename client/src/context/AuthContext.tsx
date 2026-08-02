import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler } from "../lib/api";

type Usuario = { id: number; email: string; name: string };

type ValorContexto = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<ValorContexto | null>(null);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUsuario(null));

    api
      .me()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  const entrar = async (email: string, senha: string) => {
    const usuarioLogado = await api.login(email, senha);
    setUsuario(usuarioLogado);
  };

  const sair = async () => {
    await api.logout();
    setUsuario(null);
  };

  const valor = useMemo<ValorContexto>(
    () => ({ usuario, carregando, entrar, sair }),
    [usuario, carregando]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return ctx;
}
