type ModalConfirmacaoProps = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  confirmando?: boolean;
};

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  aoConfirmar,
  aoCancelar,
  confirmando = false,
}: ModalConfirmacaoProps) {
  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={aoCancelar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-cabecalho">
          <h3>{titulo}</h3>
        </div>
        <p style={{ marginBottom: 20, color: "#666" }}>{mensagem}</p>
        <div className="modal-acoes">
          <button type="button" onClick={aoCancelar} disabled={confirmando}>
            Cancelar
          </button>
          <button
            type="button"
            className="primary"
            onClick={aoConfirmar}
            disabled={confirmando}
            style={{ background: "#c62828", borderColor: "#c62828" }}
          >
            {confirmando ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
