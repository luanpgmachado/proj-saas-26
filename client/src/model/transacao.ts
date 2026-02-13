export type TipoTransacao = "entry" | "exit";

export type GrupoTransacao = "fixed" | "variable" | "installment" | "entry";

export type Transacao = {
  id: number;
  date: string;
  description: string;
  type: TipoTransacao;
  amountCents: number;
  categoryId: number;
  paymentMethodId: number;
  group: GrupoTransacao;
  isPaid: boolean;
  paidAt: string | null;
};
