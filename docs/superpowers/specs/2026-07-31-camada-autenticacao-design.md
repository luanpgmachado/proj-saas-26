# Design — Camada de Autenticação

Data: 2026-07-31
Status: aprovado (aguardando plano de implementação)

## Contexto

`meucontrole.cloud` (proj-financa-v1) está em produção sem nenhuma camada de
segurança: `cors()` liberado geral, zero middleware de autenticação em
`/api`, nenhuma tabela de usuário no modelo de dados. Qualquer pessoa com a
URL lê e escreve todos os dados financeiros da família.

## Requisitos confirmados

- Login individual por pessoa (2-5 contas), não login compartilhado.
- Dados financeiros continuam compartilhados entre todos os logados — sem
  isolamento por usuário no modelo de dados (`categories`, `transactions`,
  `recurrences`, `goals`, `reserves`, `investments` seguem como estão).
- Sem autocadastro público. Contas criadas manualmente (script CLI).
- Login por email + senha.

## Abordagens consideradas

| Abordagem | Descrição | Decisão |
|---|---|---|
| A. Sessão server-side (Postgres) | `express-session` + `connect-pg-simple` + bcrypt | **Escolhida** |
| B. JWT stateless | Token assinado em cookie httpOnly | Rejeitada — revogação de token exige blocklist (volta a ter estado), overkill pra 2-5 contas |
| C. Basic Auth na borda (Traefik) | `htpasswd` no proxy, sem código de app | Rejeitada como solução final — sem tela própria, sem logout real, UX ruim |

## Arquitetura

### Dados (novo)
- `users`: `id`, `email` (unique), `passwordHash` (bcrypt), `name`, `createdAt`.
- `session` (gerida por `connect-pg-simple`, schema padrão da lib): sessões
  ativas persistidas no mesmo Postgres. Sem Redis.

### Backend
- `server/auth.ts` (novo): configura `express-session` + `connect-pg-simple`
  sobre a conexão Postgres existente (`server/db.ts`); exporta middleware
  `requireAuth`.
- Rotas novas em `server/routes.ts`, fora de `requireAuth`:
  - `POST /api/auth/login` — `{email, senha}` → cria sessão.
  - `POST /api/auth/logout` — destrói sessão.
  - `GET /api/auth/me` — retorna usuário logado ou `401`.
- Todo `/api/*` restante passa a exigir `requireAuth`.
- `server/scripts/create-user.ts` (novo): script CLI para criar conta
  manualmente (email + senha → hash bcrypt → insert). Sem endpoint de
  autocadastro público.
- Rate limit em `POST /api/auth/login` (`express-rate-limit`, ex.: 5
  tentativas / 15 min por IP).
- `SESSION_SECRET` obrigatório via env em produção; processo recusa subir
  sem ele.

### Frontend
- `client/src/pages/Login.tsx` (novo): formulário email + senha.
- `client/src/context` — `AuthContext` (novo): chama `GET /api/auth/me` no
  load da SPA; sem sessão válida renderiza só a tela de login; com sessão
  válida guarda nome/email do usuário.
- Header ganha nome do usuário logado + botão logout.
- Interceptor global de resposta: qualquer `401` vindo de `/api/*` redireciona
  para `/login`.

## Fluxo de dados

1. Browser envia `POST /api/auth/login` com `{email, senha}`.
2. Servidor confere hash bcrypt. Sucesso → regenera sessão, grava `userId`
   na sessão (persistida no Postgres), seta cookie `httpOnly` + `secure`
   (produção) + `sameSite=lax`.
3. Requests seguintes: `express-session` lê cookie, carrega sessão do
   Postgres, popula `req.session.userId`.
4. `requireAuth` responde `401` para toda rota `/api/*` sem `userId` válido
   na sessão.
5. SPA no load faz `GET /api/auth/me`: `401` → tela de login; `200` →
   renderiza app e guarda usuário no contexto.
6. Logout: `POST /api/auth/logout` destrói a sessão no banco e limpa o
   cookie.

## Tratamento de erro

- Login inválido: mensagem genérica "email ou senha inválidos" — não revela
  se o email existe (evita enumeração de conta).
- Rate limit no endpoint de login trava tentativas de força bruta.
- Cookie `secure` ligado apenas com `NODE_ENV=production` (Coolify/Traefik já
  termina HTTPS em `meucontrole.cloud`).
- `SESSION_SECRET` ausente em produção = falha rápida no boot, não sobe
  silenciosamente sem proteção.
- Toda resposta `401` de `/api/*` segue o formato de erro já usado pelo
  `errorHandler` de `server/index.ts`.

## Testes

Projeto não tem suite automatizada; segue o padrão existente de verificação
manual registrada em `docs/logs/TEST_LOG.md`. Checklist mínimo:

- Login com conta seedada → sessão criada, cookie presente.
- `GET /api/transactions` sem cookie → `401`.
- Mesma rota com sessão válida → `200`.
- Logout → sessão destruída no banco, `GET /api/auth/me` volta a dar `401`.
- 6 tentativas erradas de login seguidas → bloqueado pelo rate limit.
- Registrar rodada em `docs/logs/TEST_LOG.md`.

## Fora de escopo

- Isolamento de dados por usuário (todas as tabelas de domínio continuam sem
  `userId`).
- Recuperação de senha por email (com 2-5 contas conhecidas, reset é manual
  via banco/script se necessário).
- OAuth/login social.
- Permissões diferenciadas por papel (admin vs membro) — todos os logados
  têm o mesmo acesso.
