type ModalConfirmacaoProps = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  confirmando?: boolean;
  textoConfirmar?: string;
  textoCancelar?: string;
  varianteConfirmar?: "primario" | "destrutivo";
};

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  aoConfirmar,
  aoCancelar,
  confirmando = false,
  textoConfirmar = "Excluir",
  textoCancelar = "Cancelar",
  varianteConfirmar = "destrutivo",
}: ModalConfirmacaoProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={aoCancelar}>
      <div className="surface-card w-full max-w-[420px] p-0" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-0">
          <h3 className="text-lg font-semibold">{titulo}</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground">{mensagem}</p>
          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={aoCancelar}
              disabled={confirmando}
              className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring disabled:opacity-60"
            >
              {textoCancelar}
            </button>
            <button
              type="button"
              onClick={aoConfirmar}
              disabled={confirmando}
              className={[
                "h-10 px-4 rounded-md text-sm font-medium shadow-card-sm transition-smooth focus-ring disabled:opacity-60",
                varianteConfirmar === "destrutivo"
                  ? "bg-destructive text-destructive-foreground hover:brightness-[0.98]"
                  : "bg-primary text-primary-foreground hover:brightness-[0.98]",
              ].join(" ")}
            >
              {confirmando ? "Processando..." : textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
