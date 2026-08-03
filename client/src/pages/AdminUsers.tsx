import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ModalConfirmacao from "../components/ModalConfirmacao";

type UsuarioAdmin = { id: number; email: string; name: string; isAdmin: boolean };

export default function AdminUsers() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [emailConvite, setEmailConvite] = useState("");
  const [convidando, setConvidando] = useState(false);
  const [mensagemConvite, setMensagemConvite] = useState<string | null>(null);

  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [adminEdicao, setAdminEdicao] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [paraExcluir, setParaExcluir] = useState<UsuarioAdmin | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = () => {
    setCarregando(true);
    api
      .getUsers()
      .then(setUsuarios)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar usuarios"))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const aoConvidar = async () => {
    setConvidando(true);
    setMensagemConvite(null);
    try {
      await api.createInvite(emailConvite.trim().toLowerCase());
      setMensagemConvite(`Convite enviado para ${emailConvite}.`);
      setEmailConvite("");
    } catch (err) {
      setMensagemConvite(err instanceof Error ? err.message : "Erro ao enviar convite");
    } finally {
      setConvidando(false);
    }
  };

  const abrirEdicao = (alvo: UsuarioAdmin) => {
    setEditando(alvo);
    setNomeEdicao(alvo.name);
    setAdminEdicao(alvo.isAdmin);
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvandoEdicao(true);
    try {
      const atualizado = await api.updateUser(editando.id, { name: nomeEdicao, isAdmin: adminEdicao });
      setUsuarios((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)));
      setEditando(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      await api.deleteUser(paraExcluir.id);
      setUsuarios((prev) => prev.filter((u) => u.id !== paraExcluir.id));
      setParaExcluir(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Usuários</h1>
      </div>

      <div className="surface-card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">Convidar nova pessoa</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailConvite}
            onChange={(event) => setEmailConvite(event.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
          />
          <button
            type="button"
            onClick={aoConvidar}
            disabled={convidando || !emailConvite.trim()}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {convidando ? "Enviando..." : "Convidar"}
          </button>
        </div>
        {mensagemConvite ? <p className="text-sm text-muted-foreground mt-3">{mensagemConvite}</p> : null}
      </div>

      {erro ? <p className="text-sm text-destructive mb-4">{erro}</p> : null}

      <div className="surface-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-input text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Admin</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-input last:border-0">
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">{u.isAdmin ? "Sim" : "Não"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth focus-ring"
                        aria-label={`Editar ${u.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setParaExcluir(u)}
                        disabled={u.id === usuario?.id}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-smooth focus-ring disabled:opacity-30 disabled:pointer-events-none"
                        aria-label={`Excluir ${u.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editando ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditando(null)}>
          <div className="surface-card w-full max-w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Editar {editando.email}</h3>

            <label className="block mb-4">
              <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
              <input
                type="text"
                value={nomeEdicao}
                onChange={(event) => setNomeEdicao(event.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
              />
            </label>

            <label className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                checked={adminEdicao}
                onChange={(event) => setAdminEdicao(event.target.checked)}
                disabled={editando.id === usuario?.id}
              />
              <span className="text-sm">É admin</span>
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium hover:bg-secondary transition-smooth focus-ring"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
              >
                {salvandoEdicao ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ModalConfirmacao
        aberto={paraExcluir !== null}
        titulo="Excluir usuário"
        mensagem={paraExcluir ? `Excluir ${paraExcluir.name} (${paraExcluir.email})? Essa conta perde acesso imediatamente.` : ""}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setParaExcluir(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
