# Design — Gestão de Contas (convites, admin, recuperação de senha)

Data: 2026-08-03
Status: aprovado (aguardando plano de implementação)

Nota pós-implementação (2026-08-03): este spec descreve o design original com Resend. Durante a implementação, descobrimos que o domínio já tinha hospedagem de email da Hostinger configurada (DKIM/SPF/DMARC prontos) — trocamos para SMTP via essa caixa existente (`noreply@meucontrole.cloud`) em vez de criar uma conta Resend nova. Onde este documento menciona Resend/`RESEND_API_KEY`, leia como "SMTP Hostinger" (`SMTP_USER`/`SMTP_PASSWORD`/`EMAIL_FROM`) — o restante do design (convite, admin, recuperação de senha) não mudou. Ver `docs/superpowers/plans/2026-08-03-gestao-de-contas.md` para o design final.

## Contexto

A camada de autenticação (spec `2026-07-31-camada-autenticacao-design.md`) está em produção: login por email+senha, sessão server-side, sem autocadastro, sem papéis, sem recuperação de senha — decisões deliberadas para um app de 2-5 contas conhecidas.

Uso real revelou lacunas:
- Contas eram criadas via CLI (`create-user.ts`) sem validar se o email existe de verdade (ex.: `email.com` em vez de `gmail.com` foi aceito).
- Toda alteração de conta (criar, editar, remover) depende de acesso ao servidor/CLI — não há como delegar isso.
- Não existe caminho de recuperação se alguém esquecer a senha.

Este spec substitui essas três decisões "fora de escopo" do spec anterior por um fluxo real, mantendo os princípios do produto (app pequeno, famílias, controle explícito).

## Requisitos confirmados

- Validação real de email: resolvida via **convite** — conta só existe se alguém receber e abrir um link enviado para aquele email. Não há verificação de formato/domínio separada; a entrega do email É a validação.
- Envio de email (convite e recuperação de senha) via **Resend**.
- Autocadastro público **fechado**: só é possível criar conta resgatando um convite gerado por um admin. Não existe formulário de "criar conta" livre.
- Convite é gerado e enviado automaticamente pelo sistema (admin só informa o email do convidado).
- Papel **admin**: campo `isAdmin` na tabela `users`, alterável (não é um papel fixo codificado). A conta do Luan (id=1) é a primeira admin.
- Usuários comuns não administram outras contas. Administração (criar convite, editar nome/isAdmin, deletar) é exclusiva de admin.
- Recuperação de senha própria via email ("Esqueceu senha?"), disponível para qualquer conta (admin ou não) — não depende de admin.
- Dados financeiros continuam compartilhados entre todos os logados (sem mudança de modelo de dados de domínio).

## Abordagens consideradas

| Abordagem | Descrição | Decisão |
|---|---|---|
| A. Tabela única `tokens` (invite + reset) | Um módulo de email, uma tabela de tokens, `requireAdmin` sobre o `requireAuth` já existente | **Escolhida** |
| B. Tabelas separadas para convite e reset | Mais explícito, mas duas tabelas quase idênticas para 2-10 contas é complexidade sem ganho | Rejeitada — viola YAGNI |
| C. Migrar para Auth-as-a-Service (Clerk/Auth0/Supabase Auth) | Ganha convite/papéis prontos | Rejeitada — descartaria as 12 tasks de sessão/login já construídas e validadas em produção, pivot injustificado |

## Arquitetura

### Dados

- `users` (modificar): adicionar `isAdmin: boolean` (`not null`, default `false`).
- `tokens` (nova):
  - `id`, `email` (destino do convite ou email da conta em reset)
  - `tokenHash` (hash sha256 do token — nunca o token puro no banco)
  - `type` (`invite` | `reset`)
  - `userId` (nullable — nulo em convite, preenchido em reset, aponta pra conta existente)
  - `createdByUserId` (nullable — admin que gerou o convite; nulo em reset, é self-service)
  - `expiresAt`, `usedAt` (nullable), `createdAt`

### Backend

- `server/tokens.ts` (novo): gera token aleatório (`crypto.randomBytes`), calcula hash sha256, valida expiração e uso único.
- `server/email.ts` (novo): cliente Resend, `sendInviteEmail(email, token)` e `sendResetPasswordEmail(email, token)`. Requer `RESEND_API_KEY`.
- `server/auth.ts` (modificar): `requireAdmin` — verifica `isAdmin` da conta da sessão atual (consulta ao banco; escala de 2-10 contas não justifica cache), aplicado depois de `requireAuth`.
- `server/storage.ts` (modificar): métodos para `tokens` (criar, buscar por hash, marcar usado) e para gestão de usuário (listar, atualizar nome/isAdmin, deletar + limpar sessões da conta deletada).
- Rotas novas em `server/routes.ts`:
  - Admin (atrás de `requireAdmin`): `POST /api/admin/users/invite`, `GET /api/admin/users`, `PATCH /api/admin/users/:id` (nome e/ou `isAdmin` — **não** email), `DELETE /api/admin/users/:id`.
  - Públicas: `GET /api/auth/invites/:token` (valida, retorna email pra pré-preencher), `POST /api/auth/invites/:token/redeem` (cria conta + já loga), `POST /api/auth/forgot-password` (sempre resposta genérica), `GET /api/auth/reset-password/:token`, `POST /api/auth/reset-password/:token`.
- Guardas: admin não pode deletar a própria conta nem remover o próprio `isAdmin`. Deletar usuário também limpa as sessões ativas dessa conta (automatiza a nota operacional manual do spec anterior). Redefinir senha invalida sessões antigas da conta.

### Frontend

- `client/src/pages/CreateAccount.tsx` (novo): lê `?token=` da URL, valida via `GET /api/auth/invites/:token`, formulário nome+senha (email vem do convite, travado), resgata e já loga.
- `client/src/pages/ForgotPassword.tsx` (novo): formulário de email, sempre mostra mensagem genérica de sucesso.
- `client/src/pages/ResetPassword.tsx` (novo): lê `?token=` da URL, formulário de nova senha.
- `client/src/pages/AdminUsers.tsx` (novo): tabela de contas (nome, email, badge admin), ação convidar (modal com campo email), editar (nome/isAdmin), deletar (modal de confirmação, reaproveitando `ModalConfirmacao` existente). Visível só se `usuario.isAdmin`.
- **Mudança de arquitetura no roteamento:** o spec anterior decidiu não ter rota `/login` — troca de tela era só por estado (sem sessão → renderiza `<Login/>`), porque a única tela pré-login era o login. Agora existem 3 destinos pré-login que **precisam** de URL própria (links de convite/reset vêm por email apontando pra uma URL específica). `App.tsx` passa a ter rotas reais também no estado deslogado: `/criar-conta`, `/esqueci-senha`, `/redefinir-senha`, com `Login` como default. Rotas autenticadas ganham `/admin/users` (só admin).
- `Login.tsx` ganha links "Criar conta" (sem token na URL → mensagem "cadastro só por convite, peça pro admin") e "Esqueceu senha?".
- `BarraLateral.tsx` ganha item de navegação "Usuários", condicionado a `usuario?.isAdmin`.
- `AuthContext.tsx`: tipo `Usuario` ganha `isAdmin: boolean`.
- `lib/api.ts`: métodos novos para convite, resgate, forgot/reset password, CRUD de usuário admin.

## Fluxo de dados

**Convite:** admin informa email → `POST /api/admin/users/invite` cria token (`type=invite`) → Resend envia email com link `/criar-conta?token=X` → pessoa abre, token validado, formulário nome+senha → `POST /api/auth/invites/:token/redeem` cria a conta, marca token usado, cria sessão (já loga).

**Esqueci senha:** email → `POST /api/auth/forgot-password` (sempre "se existir, mandamos link", exista ou não a conta) → se existir, cria token `reset`, Resend envia link `/redefinir-senha?token=X` → nova senha → `POST /api/auth/reset-password/:token` atualiza hash, marca token usado, invalida sessões antigas da conta.

**Admin CRUD:** `/admin/users` lista contas, convida (fluxo acima), edita nome/isAdmin, deleta (remove conta + sessões ativas dela).

## Tratamento de erro

- Token expirado/usado/inválido: erro genérico em PT-BR, sem detalhar o motivo exato.
- Rota admin sem ser admin: `403` (distinto do `401` de sessão ausente — a pessoa está logada, só não autorizada).
- Rate limit também em `/api/auth/forgot-password` (mesmo padrão do login), evita spam de email e reduz enumeração por tempo de resposta.
- Falha ao enviar email (Resend indisponível): não derruba a request. Convite: admin vê erro claro. Forgot-password: continua retornando a mensagem genérica (evita enumeração), erro real só logado no servidor.
- Tokens armazenados como hash (sha256) — um dump do banco não expõe token utilizável.

## Testes

Sem suite automatizada (convenção já estabelecida do projeto) — verificação manual registrada em `docs/logs/TEST_LOG.md`, desta vez incluindo envio real de email (Resend) e não só chamadas HTTP:
- Convite: enviar para email real, confirmar recebimento, resgatar, confirmar login automático.
- Esqueci senha: mesma verificação de ponta a ponta com email real.
- Token expirado/usado: forçar `expiresAt`/`usedAt` direto no banco e confirmar rejeição.
- Admin: não-admin batendo em `/api/admin/*` → `403`. Admin tentando deletar a própria conta ou remover o próprio `isAdmin` → bloqueado.
- Deletar conta: confirmar que sessão ativa dessa conta para de funcionar.

## Fora de escopo

- Edição de email de conta existente (mudar email exigiria reconfirmação — não incluído nesta versão).
- Múltiplos níveis de papel além de admin/comum.
- Auditoria/log de ações administrativas.
- Expiração/rotação de `RESEND_API_KEY` automatizada.
- Isolamento de dados por usuário (continua fora de escopo, herdado do spec anterior).
