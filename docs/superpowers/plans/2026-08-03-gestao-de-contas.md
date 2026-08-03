# Gestão de Contas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a criação de conta via CLI por convite (validando o email de verdade), acrescentar papel admin com um painel de gestão de usuários, e adicionar recuperação de senha — tudo por email via SMTP do próprio domínio (Hostinger).

**Architecture:** Uma tabela `tokens` genérica (convite e reset de senha) + um módulo de email (SMTP via nodemailer, usando a caixa `noreply@meucontrole.cloud` já existente na hospedagem de email da Hostinger) + um módulo de geração/validação de token, reaproveitando a sessão/auth já existentes. `requireAdmin` empilha sobre o `requireAuth` já em produção. Frontend ganha rotas reais pré-login (convite/reset chegam por link de email, precisam de URL própria) e uma tela de administração de usuários, visível só pra quem é admin.

**Tech Stack:** Express + Postgres/drizzle-orm + React/wouter já existentes. Novo: `nodemailer` (envio de email via SMTP).

## Pré-requisito (resolvido antes da Task 3)

Domínio `meucontrole.cloud` já tem hospedagem de email da Hostinger configurada (MX, DKIM, SPF, DMARC já publicados — confirmado via API da Hostinger). Caixa existente: `noreply@meucontrole.cloud`. Servidor SMTP: `smtp.hostinger.com`, porta `465` (SSL). Isso dá os valores `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` necessários pra Task 3 — sem criar conta em serviço nenhum novo.

## Global Constraints

- Spec de referência: `docs/superpowers/specs/2026-08-03-gestao-de-contas-design.md`.
- Chat, commits e mensagens de erro voltadas ao usuário: PT-BR. Nomes técnicos (tabelas, colunas, rotas, funções) em inglês, seguindo `shared/schema.ts`/`server/routes.ts` já existentes. Nomes de domínio/UX no front em PT-BR, seguindo `AuthContext.tsx`/`Login.tsx`.
- Dados financeiros continuam sem `userId` — nenhuma tabela de domínio é tocada neste plano.
- `npm run db:push` só roda contra banco local/dev, nunca produção neste fluxo (`docs/canonicos/RUNBOOK.md`, Guardrail obrigatório) — mesma regra do plano anterior.
- Tokens (convite/reset) armazenados como hash (sha256), nunca em texto puro no banco.
- `/api/auth/forgot-password` sempre responde com a mesma mensagem genérica, exista ou não a conta — não pode vazar se um email tem cadastro.
- `SMTP_USER`, `SMTP_PASSWORD` e `EMAIL_FROM` obrigatórias em produção (mesmo padrão de fail-fast do `SESSION_SECRET` em `server/auth.ts`).
- Projeto não tem suite automatizada. Verificação manual via `tsc --noEmit`, `curl` e (a partir da Task 3) envio real de email — registrada em `docs/logs/TEST_LOG.md`.
- `npx tsc --noEmit -p tsconfig.server.json` sempre mostra 1 erro pré-existente não relacionado em `server/seed.ts:34` — ignorar, só checar que não aparece nenhum erro novo.

---

## Visão geral de arquivos

**Backend (novo):**
- `server/tokens.ts` — gera/hasheia/valida token de convite ou reset.
- `server/email.ts` — transporte SMTP (nodemailer), `sendInviteEmail`, `sendResetPasswordEmail`.

**Backend (modificado):**
- `shared/schema.ts` — `isAdmin` em `users`, tabela `tokens`.
- `server/storage.ts` — métodos de `tokens`, gestão de usuário, limpeza de sessão.
- `server/auth.ts` — `requireAdmin`.
- `server/routes.ts` — rotas de convite/reset (públicas) e admin (`/admin/users/*`).
- `package.json` — dependência `nodemailer`.

**Frontend (novo):**
- `client/src/pages/CreateAccount.tsx` — resgatar convite.
- `client/src/pages/ForgotPassword.tsx` — pedir reset.
- `client/src/pages/ResetPassword.tsx` — definir senha nova.
- `client/src/pages/AdminUsers.tsx` — CRUD de usuário (admin only).

**Frontend (modificado):**
- `client/src/context/AuthContext.tsx` — `Usuario.isAdmin`, `entrarComSessaoExistente`.
- `client/src/lib/api.ts` — métodos novos.
- `client/src/pages/Login.tsx` — links "Criar conta"/"Esqueceu senha?".
- `client/src/App.tsx` — rotas reais pré-login + `/admin/users`.
- `client/src/components/BarraLateral.tsx` — item "Usuários" (admin only).

**Docs:**
- `docs/USAGE.md` — `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`EMAIL_FROM`/`APP_URL`, bootstrap do primeiro admin.
- `docs/logs/TEST_LOG.md` — verificação final.

---

### Task 1: Schema — `isAdmin` e tabela `tokens`

**Files:**
- Modify: `shared/schema.ts`

**Interfaces:**
- Produces: `users.isAdmin: boolean`. `tokens` (tabela), `Token`/`InsertToken` — campos `id`, `email: string`, `tokenHash: string`, `type: string` (`"invite"|"reset"`), `userId: number|null`, `createdByUserId: number|null`, `expiresAt: Date`, `usedAt: Date|null`, `createdAt: Date`.

- [ ] **Step 1: Adicionar `isAdmin` em `users`**

Em `shared/schema.ts`, no bloco `export const users = pgTable("users", { ... })`, depois de `name: varchar("name", { length: 255 }).notNull(),` e antes de `createdAt: timestamp(...)`, adicionar:

```ts
  isAdmin: boolean("is_admin").notNull().default(false),
```

- [ ] **Step 2: Adicionar a tabela `tokens`**

Logo depois do bloco `users` (depois de `});` que fecha `users`, antes de `export const categoriesRelations`), inserir:

```ts
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  userId: integer("user_id").references(() => users.id),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 3: Adicionar os tipos**

No final do arquivo, depois de `export type InsertUser = typeof users.$inferInsert;`, adicionar:

```ts
export type Token = typeof tokens.$inferSelect;
export type InsertToken = typeof tokens.$inferInsert;
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.server.json`
Expected: só o erro conhecido de `server/seed.ts:34`, nenhum erro novo.

- [ ] **Step 5: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: isAdmin em users e tabela tokens"
```

---

### Task 2: Módulo de tokens (`server/tokens.ts`)

**Files:**
- Create: `server/tokens.ts`

**Interfaces:**
- Produces: `generateToken(): string`, `hashToken(token: string): string`, `isExpired(expiresAt: Date): boolean`, `expiryFromNow(hours: number): Date`.

- [ ] **Step 1: Criar o módulo**

```ts
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

export function expiryFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
```

- [ ] **Step 2: Verificar na prática**

Run (de dentro da pasta do projeto, arquivo temporário — apagar depois):

```bash
cat > _tmp-check-tokens.ts << 'EOF'
import { generateToken, hashToken, isExpired, expiryFromNow } from "./server/tokens";

const t1 = generateToken();
const t2 = generateToken();
console.log("tokens diferentes:", t1 !== t2);
console.log("hash diferente do token:", hashToken(t1) !== t1);
console.log("hash deterministico:", hashToken(t1) === hashToken(t1));

const passado = new Date(Date.now() - 1000);
const futuro = new Date(Date.now() + 1000 * 60 * 60);
console.log("data passada expirada:", isExpired(passado));
console.log("data futura nao expirada:", !isExpired(futuro));
console.log("expiryFromNow(1) no futuro:", !isExpired(expiryFromNow(1)));
EOF
npx tsx _tmp-check-tokens.ts
rm _tmp-check-tokens.ts
```

Expected: todas as linhas `true`.

- [ ] **Step 3: Commit**

```bash
git add server/tokens.ts
git commit -m "feat: modulo de geracao e validacao de token"
```

---

### Task 3: Dependência nodemailer + módulo de email (`server/email.ts`)

**Files:**
- Modify: `package.json`
- Create: `server/email.ts`

**Interfaces:**
- Produces: `sendInviteEmail(email: string, token: string): Promise<void>`, `sendResetPasswordEmail(email: string, token: string): Promise<void>`.

**Pré-requisito:** `SMTP_USER`, `SMTP_PASSWORD` e `EMAIL_FROM` reais (ver seção "Pré-requisito" no topo do plano — caixa `noreply@meucontrole.cloud` já existe na Hostinger) precisam estar disponíveis pra rodar o Step 3. Se ainda não existirem, pare e peça ao controlador — não invente um envio fake.

- [ ] **Step 1: Adicionar dependências**

Em `package.json`, em `dependencies`, depois de `"connect-pg-simple": "^10.0.0",`, adicionar:

```json
    "nodemailer": "^9.0.3",
```

Em `devDependencies`, depois de `"@types/connect-pg-simple": "^7.0.3",`, adicionar:

```json
    "@types/nodemailer": "^8.0.1",
```

Run: `npm install`

- [ ] **Step 2: Criar o módulo**

```ts
import nodemailer from "nodemailer";

const isProd = process.env.NODE_ENV === "production";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com";
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_URL = process.env.APP_URL || "http://localhost:3001";

if (isProd && (!SMTP_USER || !SMTP_PASSWORD)) {
  throw new Error("SMTP_USER e SMTP_PASSWORD devem estar definidas em producao.");
}
if (isProd && !EMAIL_FROM) {
  throw new Error("EMAIL_FROM deve estar definida em producao (ex: 'Financa Familiar <noreply@meucontrole.cloud>').");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
});

export async function sendInviteEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/criar-conta?token=${token}`;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Convite - Financa Familiar",
    html: `<p>Voce foi convidado para o Financa Familiar.</p><p><a href="${link}">Clique aqui para criar sua conta</a></p><p>Este link expira em 7 dias.</p>`,
  });
}

export async function sendResetPasswordEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/redefinir-senha?token=${token}`;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Redefinir senha - Financa Familiar",
    html: `<p>Clique no link abaixo para definir uma nova senha.</p><p><a href="${link}">Redefinir senha</a></p><p>Este link expira em 1 hora. Se voce nao pediu isso, ignore este email.</p>`,
  });
}
```

- [ ] **Step 3: Verificar envio real**

Com `SMTP_USER`, `SMTP_PASSWORD` e `EMAIL_FROM` reais setados na sessão (`$env:SMTP_USER="noreply@meucontrole.cloud"`, `$env:SMTP_PASSWORD=...`, `$env:EMAIL_FROM="Financa Familiar <noreply@meucontrole.cloud>"`), rodar (troca `destino@real.com` por um email que você acessa de verdade):

```bash
cat > _tmp-check-email.ts << 'EOF'
import { sendInviteEmail } from "./server/email";

sendInviteEmail("destino@real.com", "token-de-teste-123")
  .then(() => { console.log("enviado sem erro"); process.exit(0); })
  .catch((err) => { console.error("erro:", err); process.exit(1); });
EOF
npx tsx _tmp-check-email.ts
rm _tmp-check-email.ts
```

Expected: `enviado sem erro`, e o email chega de verdade na caixa de entrada (confirmar manualmente). Se a conexão SMTP falhar, confirmar porta/host: Hostinger também aceita `587` com `secure:false` (STARTTLS) como alternativa a `465`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json server/email.ts
git commit -m "feat: modulo de envio de email via SMTP (Hostinger)"
```

---

### Task 4: Storage — tokens e gestão de usuário

**Files:**
- Modify: `server/storage.ts`

**Interfaces:**
- Consumes: `tokens`, `Token`, `InsertToken` de `@shared/schema` (Task 1); `pool` de `./db`.
- Produces: `storage.createToken(token: InsertToken): Promise<Token>`, `storage.getTokenByHash(tokenHash: string, type: string): Promise<Token | undefined>`, `storage.markTokenUsed(id: number): Promise<void>`, `storage.getUsers(): Promise<User[]>`, `storage.updateUser(id: number, patch: {name?: string; isAdmin?: boolean}): Promise<User | undefined>`, `storage.updateUserPassword(id: number, passwordHash: string): Promise<void>`, `storage.deleteUser(id: number): Promise<boolean>`, `storage.deleteSessionsForUser(userId: number): Promise<void>`.

- [ ] **Step 1: Importar `tokens`/`Token`/`InsertToken` e `pool`**

Em `server/storage.ts`, no bloco de import de `@shared/schema`, adicionar `tokens,` depois de `users,`, e `type Token,` / `type InsertToken,` depois de `type InsertUser,`.

Trocar a linha `import { db } from "./db";` por `import { db, pool } from "./db";`.

- [ ] **Step 2: Adicionar os métodos**

Imediatamente antes do fechamento da classe (`}` antes de `export const storage = new DatabaseStorage();`), depois dos métodos de usuário já existentes (`createUser`), inserir:

```ts

  async createToken(token: InsertToken): Promise<Token> {
    const [created] = await db.insert(tokens).values(token).returning();
    return created;
  }

  async getTokenByHash(tokenHash: string, type: string): Promise<Token | undefined> {
    const [found] = await db
      .select()
      .from(tokens)
      .where(and(eq(tokens.tokenHash, tokenHash), eq(tokens.type, type)));
    return found;
  }

  async markTokenUsed(id: number): Promise<void> {
    await db.update(tokens).set({ usedAt: new Date() }).where(eq(tokens.id, id));
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: number, patch: { name?: string; isAdmin?: boolean }): Promise<User | undefined> {
    const [updated] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async deleteSessionsForUser(userId: number): Promise<void> {
    await pool.query(`DELETE FROM session WHERE (sess->>'userId')::int = $1`, [userId]);
  }
```

- [ ] **Step 3: Garantir banco local disponível**

Pré-requisito: Docker Desktop rodando. Verificar se o container de dev existe:

Run: `docker ps -a --filter name=financa-dev-db`

Se não existir, criar (mesmas credenciais do `DATABASE_URL` já usado antes):

```bash
docker run -d --name financa-dev-db \
  -e POSTGRES_USER=app_financas \
  -e POSTGRES_PASSWORD='1%qms6fnQjMUJc0n7j3ZIKBs' \
  -e POSTGRES_DB=financeiro_bl \
  -p 5433:5432 \
  postgres:16-alpine
```

Se existir mas estiver parado: `docker start financa-dev-db`.

Definir `DATABASE_URL` local:

```powershell
$env:DATABASE_URL="postgres://app_financas:1%25qms6fnQjMUJc0n7j3ZIKBs@localhost:5433/financeiro_bl"
```

- [ ] **Step 4: Aplicar schema e testar round-trip**

Run: `npm run db:push`
Expected: cria/atualiza `users` (coluna `is_admin`) e `tokens`, sem erro.

Run (arquivo temporário na raiz do projeto, apagar depois):

```bash
cat > _tmp-check-storage.ts << 'EOF'
import { storage } from "./server/storage";
import { hashPassword } from "./server/passwords";

async function main() {
  const user = await storage.createUser({
    email: `teste-${Date.now()}@example.com`,
    passwordHash: await hashPassword("senha123"),
    name: "Teste Storage",
  });
  console.log("usuario criado, isAdmin default false:", user.isAdmin === false);

  const atualizado = await storage.updateUser(user.id, { isAdmin: true, name: "Teste Editado" });
  console.log("update aplicado:", atualizado?.isAdmin === true && atualizado?.name === "Teste Editado");

  const token = await storage.createToken({
    email: "convidado@example.com",
    tokenHash: "hash-fake-123",
    type: "invite",
    createdByUserId: user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  });
  console.log("token criado:", token.id > 0);

  const encontrado = await storage.getTokenByHash("hash-fake-123", "invite");
  console.log("token encontrado por hash:", encontrado?.id === token.id);

  await storage.markTokenUsed(token.id);
  const usado = await storage.getTokenByHash("hash-fake-123", "invite");
  console.log("token marcado como usado:", usado?.usedAt !== null);

  const lista = await storage.getUsers();
  console.log("getUsers retorna array com o usuario criado:", lista.some((u) => u.id === user.id));

  const deletou = await storage.deleteUser(user.id);
  console.log("delete retornou true:", deletou === true);

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
EOF
npx tsx _tmp-check-storage.ts
rm _tmp-check-storage.ts
```

Expected: todas as linhas `true`.

- [ ] **Step 5: Commit**

```bash
git add server/storage.ts
git commit -m "feat: metodos de token e gestao de usuario em storage"
```

---

### Task 5: `requireAdmin` (`server/auth.ts`)

**Files:**
- Modify: `server/auth.ts`

**Interfaces:**
- Consumes: `storage.getUserById` (existente, de `./storage`).
- Produces: `requireAdmin(req, res, next)` — Express middleware, `401` sem sessão, `403` se autenticado mas não admin.

- [ ] **Step 1: Importar storage**

Em `server/auth.ts`, depois de `import { pool } from "./db";`, adicionar:

```ts
import { storage } from "./storage";
```

- [ ] **Step 2: Adicionar `requireAdmin`**

No final do arquivo, depois da função `requireAuth`, adicionar:

```ts

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nao autenticado" });
  }
  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: "Acesso restrito a administradores" });
    }
    next();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.server.json`
Expected: só o erro conhecido de `server/seed.ts:34`.

- [ ] **Step 4: Commit**

```bash
git add server/auth.ts
git commit -m "feat: middleware requireAdmin"
```

---

### Task 6: Rotas públicas de convite e recuperação de senha

**Files:**
- Modify: `server/routes.ts`

**Interfaces:**
- Consumes: `generateToken`, `hashToken`, `isExpired`, `expiryFromNow` (Task 2); `sendResetPasswordEmail` (Task 3); `storage.createToken`/`getTokenByHash`/`markTokenUsed`/`updateUserPassword`/`deleteSessionsForUser` (Task 4); `hashPassword` (existente).
- Produces: `GET /api/auth/invites/:token`, `POST /api/auth/invites/:token/redeem`, `POST /api/auth/forgot-password`, `GET /api/auth/reset-password/:token`, `POST /api/auth/reset-password/:token`. Login e `/auth/me` passam a retornar `isAdmin`.

- [ ] **Step 1: Atualizar imports**

Em `server/routes.ts`, trocar:

```ts
import { verifyPassword } from "./passwords";
```

por:

```ts
import { hashPassword, verifyPassword } from "./passwords";
import { generateToken, hashToken, isExpired, expiryFromNow } from "./tokens";
import { sendResetPasswordEmail } from "./email";
```

- [ ] **Step 2: Incluir `isAdmin` na resposta de login**

Trocar (dentro de `router.post("/auth/login", ...)`, no callback de `req.session.regenerate`):

```ts
    res.json({ id: user.id, email: user.email, name: user.name });
```

por:

```ts
    res.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
```

- [ ] **Step 3: Incluir `isAdmin` na resposta de `/auth/me`**

Trocar (dentro de `router.get("/auth/me", ...)`):

```ts
  res.json({ id: user.id, email: user.email, name: user.name });
```

por:

```ts
  res.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
```

- [ ] **Step 4: Adicionar as rotas novas**

Depois de `router.get("/auth/me", ...)` (o bloco do Step 3) e **antes** de `router.use(requireAuth);`, inserir:

```ts

const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

router.get("/auth/invites/:token", asyncHandler(async (req, res) => {
  const rawToken = getParamString(req.params.token);
  const found = await storage.getTokenByHash(hashToken(rawToken), "invite");
  if (!found || found.usedAt || isExpired(found.expiresAt)) {
    return res.status(400).json({ error: "Convite invalido ou expirado" });
  }
  res.json({ email: found.email });
}));

router.post("/auth/invites/:token/redeem", asyncHandler(async (req, res) => {
  const rawToken = getParamString(req.params.token);
  const { name, senha } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof senha !== "string" || !senha) {
    return res.status(400).json({ error: "nome e senha sao obrigatorios" });
  }

  const found = await storage.getTokenByHash(hashToken(rawToken), "invite");
  if (!found || found.usedAt || isExpired(found.expiresAt)) {
    return res.status(400).json({ error: "Convite invalido ou expirado" });
  }

  const existente = await storage.getUserByEmail(found.email);
  if (existente) {
    return res.status(400).json({ error: "Ja existe conta com esse email" });
  }

  const passwordHash = await hashPassword(senha);
  const user = await storage.createUser({ email: found.email, passwordHash, name: name.trim() });
  await storage.markTokenUsed(found.id);

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Erro ao iniciar sessao" });
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  });
}));

router.post("/auth/forgot-password", forgotPasswordRateLimit, asyncHandler(async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== "string") {
    return res.status(400).json({ error: "email e obrigatorio" });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const user = await storage.getUserByEmail(emailNormalizado);
  if (user) {
    const rawToken = generateToken();
    await storage.createToken({
      email: user.email,
      tokenHash: hashToken(rawToken),
      type: "reset",
      userId: user.id,
      expiresAt: expiryFromNow(1),
    });
    try {
      await sendResetPasswordEmail(user.email, rawToken);
    } catch (err) {
      console.error("Erro ao enviar email de recuperacao:", err);
    }
  }

  res.json({ message: "Se esse email tiver uma conta, enviamos um link de redefinicao." });
}));

router.get("/auth/reset-password/:token", asyncHandler(async (req, res) => {
  const rawToken = getParamString(req.params.token);
  const found = await storage.getTokenByHash(hashToken(rawToken), "reset");
  if (!found || found.usedAt || isExpired(found.expiresAt)) {
    return res.status(400).json({ error: "Link invalido ou expirado" });
  }
  res.json({ valid: true });
}));

router.post("/auth/reset-password/:token", asyncHandler(async (req, res) => {
  const rawToken = getParamString(req.params.token);
  const { senha } = req.body ?? {};
  if (typeof senha !== "string" || !senha) {
    return res.status(400).json({ error: "senha e obrigatoria" });
  }

  const found = await storage.getTokenByHash(hashToken(rawToken), "reset");
  if (!found || found.usedAt || isExpired(found.expiresAt) || !found.userId) {
    return res.status(400).json({ error: "Link invalido ou expirado" });
  }

  const passwordHash = await hashPassword(senha);
  await storage.updateUserPassword(found.userId, passwordHash);
  await storage.markTokenUsed(found.id);
  await storage.deleteSessionsForUser(found.userId);

  res.json({ success: true });
}));
```

- [ ] **Step 5: Testar de ponta a ponta**

Pré-requisito: banco local ativo (Task 4), servidor rodando (`npx tsx watch server/index.ts`), `RESEND_API_KEY`/`EMAIL_FROM` reais setados no ambiente do servidor.

Como a rota de **criar** convite só existe na Task 7, insira um convite direto pra testar esta task isoladamente (arquivo temporário, apagar depois):

```bash
cat > _tmp-seed-invite.ts << 'EOF'
import { storage } from "./server/storage";
import { generateToken, hashToken, expiryFromNow } from "./server/tokens";

async function main() {
  const token = generateToken();
  await storage.createToken({
    email: "convidado-teste@example.com",
    tokenHash: hashToken(token),
    type: "invite",
    expiresAt: expiryFromNow(24),
  });
  console.log("TOKEN:", token);
  process.exit(0);
}
main();
EOF
npx tsx _tmp-seed-invite.ts
rm _tmp-seed-invite.ts
```

Anota o `TOKEN` impresso. Com o servidor rodando:

```bash
curl -s http://localhost:3001/api/auth/invites/TOKEN_AQUI
```
Expected: `{"email":"convidado-teste@example.com"}`

```bash
curl -s -c cookies.txt -X POST http://localhost:3001/api/auth/invites/TOKEN_AQUI/redeem \
  -H "Content-Type: application/json" \
  -d '{"name":"Convidado Teste","senha":"senha-forte-456"}'
```
Expected: JSON com `id`, `email`, `name`, `isAdmin:false` — sessão já criada (cookie em `cookies.txt`).

```bash
curl -s -b cookies.txt http://localhost:3001/api/auth/me
```
Expected: mesmo usuário, `200`.

```bash
curl -s http://localhost:3001/api/auth/invites/TOKEN_AQUI
```
Expected: `400` (token já usado).

```bash
curl -s -X POST http://localhost:3001/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"convidado-teste@example.com"}'
curl -s -X POST http://localhost:3001/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"nao-existe@example.com"}'
```
Expected: **mesma mensagem** genérica nos dois casos. Confirmar no log do servidor (ou na caixa de entrada real, se usar um email de verdade) que o email de reset foi enviado só no primeiro caso.

Parar o servidor. Apagar `cookies.txt` (não commitar).

- [ ] **Step 6: Commit**

```bash
git add server/routes.ts
git commit -m "feat: rotas publicas de convite e recuperacao de senha"
```

---

### Task 7: Rotas admin (`server/routes.ts`)

**Files:**
- Modify: `server/routes.ts`

**Interfaces:**
- Consumes: `requireAdmin` (Task 5); `generateToken`, `hashToken`, `expiryFromNow` (Task 2); `sendInviteEmail` (Task 3); `storage.getUsers`/`updateUser`/`deleteUser`/`deleteSessionsForUser`/`createToken`/`getUserByEmail` (Task 4/existente).
- Produces: `GET /api/admin/users`, `POST /api/admin/users/invite`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id` — todas atrás de `requireAdmin`.

- [ ] **Step 1: Atualizar imports**

Trocar:

```ts
import { requireAuth } from "./auth";
```

por:

```ts
import { requireAuth, requireAdmin } from "./auth";
```

Trocar:

```ts
import { sendResetPasswordEmail } from "./email";
```

por:

```ts
import { sendInviteEmail, sendResetPasswordEmail } from "./email";
```

- [ ] **Step 2: Adicionar as rotas admin**

Imediatamente depois de `router.use(requireAuth);` e **antes** de `router.get("/categories", ...)`, inserir:

```ts

router.get("/admin/users", requireAdmin, asyncHandler(async (req, res) => {
  const usuarios = await storage.getUsers();
  res.json(usuarios.map((u) => ({ id: u.id, email: u.email, name: u.name, isAdmin: u.isAdmin })));
}));

router.post("/admin/users/invite", requireAdmin, asyncHandler(async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "email e obrigatorio" });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const existente = await storage.getUserByEmail(emailNormalizado);
  if (existente) {
    return res.status(400).json({ error: "Ja existe conta com esse email" });
  }

  const rawToken = generateToken();
  await storage.createToken({
    email: emailNormalizado,
    tokenHash: hashToken(rawToken),
    type: "invite",
    createdByUserId: req.session.userId!,
    expiresAt: expiryFromNow(24 * 7),
  });

  await sendInviteEmail(emailNormalizado, rawToken);
  res.json({ success: true });
}));

router.patch("/admin/users/:id", requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(getParamString(req.params.id));
  const { name, isAdmin } = req.body ?? {};

  if (id === req.session.userId && isAdmin === false) {
    return res.status(400).json({ error: "Voce nao pode remover seu proprio acesso de admin" });
  }

  const patch: { name?: string; isAdmin?: boolean } = {};
  if (typeof name === "string" && name.trim()) patch.name = name.trim();
  if (typeof isAdmin === "boolean") patch.isAdmin = isAdmin;

  const updated = await storage.updateUser(id, patch);
  if (!updated) return res.status(404).json({ error: "Usuario nao encontrado" });
  res.json({ id: updated.id, email: updated.email, name: updated.name, isAdmin: updated.isAdmin });
}));

router.delete("/admin/users/:id", requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(getParamString(req.params.id));
  if (id === req.session.userId) {
    return res.status(400).json({ error: "Voce nao pode deletar a propria conta" });
  }

  const deleted = await storage.deleteUser(id);
  if (!deleted) return res.status(404).json({ error: "Usuario nao encontrado" });
  await storage.deleteSessionsForUser(id);
  res.json({ success: true });
}));
```

- [ ] **Step 3: Testar de ponta a ponta**

Servidor rodando, banco local ativo. Cria um segundo usuário de teste e promove um deles a admin direto no banco (não existe UI pra isso ainda — é o primeiro admin):

```bash
npx tsx server/scripts/create-user.ts admin-teste@example.com "senha-forte-789" "Admin Teste"
```

```bash
cat > _tmp-promote-admin.ts << 'EOF'
import { storage } from "./server/storage";

async function main() {
  const user = await storage.getUserByEmail("admin-teste@example.com");
  if (!user) throw new Error("usuario nao encontrado");
  await storage.updateUser(user.id, { isAdmin: true });
  console.log("promovido a admin:", user.id);
  process.exit(0);
}
main();
EOF
npx tsx _tmp-promote-admin.ts
rm _tmp-promote-admin.ts
```

Login como admin:

```bash
curl -s -c cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin-teste@example.com","senha":"senha-forte-789"}'
```

Rotas admin com sessão de admin:

```bash
curl -s -b cookies.txt http://localhost:3001/api/admin/users
```
Expected: lista de usuários, incluindo o `isAdmin:true` do admin-teste.

```bash
curl -s -b cookies.txt -X POST http://localhost:3001/api/admin/users/invite -H "Content-Type: application/json" -d '{"email":"outro-convidado@example.com"}'
```
Expected: `{"success":true}` — confirmar que o email de convite chegou de verdade (se `outro-convidado@example.com` for uma caixa real que você acessa).

Rota admin com sessão **não-admin** (login com `voce@example.com` do plano anterior, ou o convidado da Task 6):

```bash
curl -s -c cookies-comum.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"convidado-teste@example.com","senha":"senha-forte-456"}'
curl -s -b cookies-comum.txt -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/admin/users
```
Expected: `403`.

Auto-proteção do admin:

```bash
curl -s -b cookies.txt -X PATCH http://localhost:3001/api/admin/users/<ID_DO_ADMIN_TESTE> -H "Content-Type: application/json" -d '{"isAdmin":false}'
curl -s -b cookies.txt -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3001/api/admin/users/<ID_DO_ADMIN_TESTE>
```
Expected: ambos `400` (não pode remover o próprio admin nem se autodeletar).

Deletar outro usuário e confirmar sessão dele morre:

```bash
curl -s -b cookies.txt -X DELETE http://localhost:3001/api/admin/users/<ID_DO_CONVIDADO_TESTE>
curl -s -b cookies-comum.txt -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/auth/me
```
Expected: delete `200`, depois `/auth/me` com o cookie antigo do convidado `401` (sessão limpa pelo `deleteSessionsForUser`).

Parar o servidor. Apagar `cookies.txt`/`cookies-comum.txt` (não commitar).

- [ ] **Step 4: Commit**

```bash
git add server/routes.ts
git commit -m "feat: rotas admin de gestao de usuario"
```

---

### Task 8: Cliente HTTP e `AuthContext` (frontend)

**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/context/AuthContext.tsx`

**Interfaces:**
- Produces: `api.createInvite`, `api.getUsers`, `api.updateUser`, `api.deleteUser`, `api.getInvite`, `api.redeemInvite`, `api.forgotPassword`, `api.getResetPassword`, `api.resetPassword`. `Usuario` ganha `isAdmin: boolean`. `useAuth()` ganha `entrarComSessaoExistente(usuario: Usuario): void`.

- [ ] **Step 1: Atualizar tipos de retorno em `api.ts`**

Trocar (2 ocorrências, em `login` e `me`):

```ts
    request<{ id: number; email: string; name: string }>("/auth/login", {
```
por
```ts
    request<{ id: number; email: string; name: string; isAdmin: boolean }>("/auth/login", {
```

e

```ts
  me: () => request<{ id: number; email: string; name: string }>("/auth/me"),
```
por
```ts
  me: () => request<{ id: number; email: string; name: string; isAdmin: boolean }>("/auth/me"),
```

- [ ] **Step 2: Adicionar os métodos novos**

No objeto `api`, depois de `me: () => ...,`, adicionar:

```ts
  createInvite: (email: string) => request<{ success: boolean }>("/admin/users/invite", { method: "POST", body: JSON.stringify({ email }) }),
  getUsers: () => request<{ id: number; email: string; name: string; isAdmin: boolean }[]>("/admin/users"),
  updateUser: (id: number, data: { name?: string; isAdmin?: boolean }) =>
    request<{ id: number; email: string; name: string; isAdmin: boolean }>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: number) => request<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  getInvite: (token: string) => request<{ email: string }>(`/auth/invites/${token}`),
  redeemInvite: (token: string, name: string, senha: string) =>
    request<{ id: number; email: string; name: string; isAdmin: boolean }>(`/auth/invites/${token}/redeem`, {
      method: "POST",
      body: JSON.stringify({ name, senha }),
    }),
  forgotPassword: (email: string) => request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  getResetPassword: (token: string) => request<{ valid: boolean }>(`/auth/reset-password/${token}`),
  resetPassword: (token: string, senha: string) =>
    request<{ success: boolean }>(`/auth/reset-password/${token}`, { method: "POST", body: JSON.stringify({ senha }) }),
```

- [ ] **Step 3: Atualizar `AuthContext.tsx`**

Trocar:

```ts
type Usuario = { id: number; email: string; name: string };
```
por
```ts
type Usuario = { id: number; email: string; name: string; isAdmin: boolean };
```

Trocar:

```ts
type ValorContexto = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};
```
por
```ts
type ValorContexto = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  entrarComSessaoExistente: (usuario: Usuario) => void;
  sair: () => Promise<void>;
};
```

Depois da função `entrar`, adicionar:

```ts

  const entrarComSessaoExistente = (usuarioLogado: Usuario) => {
    setUsuario(usuarioLogado);
  };
```

Trocar:

```ts
  const valor = useMemo<ValorContexto>(
    () => ({ usuario, carregando, entrar, sair }),
    [usuario, carregando]
  );
```
por
```ts
  const valor = useMemo<ValorContexto>(
    () => ({ usuario, carregando, entrar, entrarComSessaoExistente, sair }),
    [usuario, carregando]
  );
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/api.ts client/src/context/AuthContext.tsx
git commit -m "feat: cliente HTTP e AuthContext com isAdmin e sessao pos-convite"
```

---

### Task 9: Tela de criar conta (`client/src/pages/CreateAccount.tsx`)

**Files:**
- Create: `client/src/pages/CreateAccount.tsx`

**Interfaces:**
- Consumes: `api.getInvite`, `api.redeemInvite` (Task 8); `useAuth().entrarComSessaoExistente` (Task 8); `useSearchParams` de `wouter`.

- [ ] **Step 1: Criar a página**

```tsx
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
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/CreateAccount.tsx
git commit -m "feat: tela de criar conta via convite"
```

---

### Task 10: Telas de recuperação de senha

**Files:**
- Create: `client/src/pages/ForgotPassword.tsx`
- Create: `client/src/pages/ResetPassword.tsx`

**Interfaces:**
- Consumes: `api.forgotPassword`, `api.getResetPassword`, `api.resetPassword` (Task 8); `useSearchParams`/`useLocation`/`Link` de `wouter`.

- [ ] **Step 1: Criar `ForgotPassword.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoSubmeter = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    try {
      const res = await api.forgotPassword(email);
      setMensagem(res.message);
    } catch {
      setMensagem("Se esse email tiver uma conta, enviamos um link de redefinição.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form onSubmit={aoSubmeter} className="surface-card w-full max-w-[360px] p-6">
        <h1 className="text-lg font-semibold mb-1">Esqueceu a senha?</h1>
        <p className="text-sm text-muted-foreground mb-6">Informe seu email pra receber um link de redefinição.</p>

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

        {mensagem ? <p className="text-sm text-muted-foreground mb-4">{mensagem}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar link"}
        </button>

        <Link href="/" className="block text-center text-sm text-muted-foreground mt-4 hover:text-foreground">
          Voltar pro login
        </Link>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Criar `ResetPassword.tsx`**

```tsx
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
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ForgotPassword.tsx client/src/pages/ResetPassword.tsx
git commit -m "feat: telas de recuperacao de senha"
```

---

### Task 11: Rotas pré-login em `App.tsx` + links no `Login.tsx`

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/Login.tsx`

**Interfaces:**
- Consumes: `CreateAccount` (Task 9), `ForgotPassword`/`ResetPassword` (Task 10), `AdminUsers` (Task 12 — importado aqui mas a rota só é montada quando `usuario.isAdmin`, então referenciar o import antes da Task 12 existir o arquivo é seguro porque é `lazy()`, só é resolvido quando a rota é acessada).

- [ ] **Step 1: Substituir `App.tsx`**

Substituir o conteúdo de `client/src/App.tsx` por:

```tsx
import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { LayoutAplicativo } from "./components/LayoutAplicativo";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Code-splitting por rota: reduz JS inicial e melhora TTI/FID em conexoes lentas.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const AnnualView = lazy(() => import("./pages/AnnualView"));
const Goals = lazy(() => import("./pages/Goals"));
const Investments = lazy(() => import("./pages/Investments"));
const Recurrences = lazy(() => import("./pages/Recurrences"));
const Categories = lazy(() => import("./pages/Categories"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

export default function App() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return (
      <Switch>
        <Route path="/criar-conta" component={CreateAccount} />
        <Route path="/esqueci-senha" component={ForgotPassword} />
        <Route path="/redefinir-senha" component={ResetPassword} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <LayoutAplicativo>
      <Suspense fallback={<div className="surface-card p-5 mt-8">Carregando...</div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/payment-methods" component={PaymentMethods} />
          <Route path="/annual" component={AnnualView} />
          <Route path="/goals" component={Goals} />
          <Route path="/investments" component={Investments} />
          <Route path="/recurrences" component={Recurrences} />
          <Route path="/categories" component={Categories} />
          {usuario.isAdmin ? <Route path="/admin/users" component={AdminUsers} /> : null}
        </Switch>
      </Suspense>
    </LayoutAplicativo>
  );
}
```

Nota: sem token na URL, `/criar-conta` renderiza `CreateAccount`, que mostra a mensagem "Cadastro só por convite" (comportamento já definido no componente da Task 9) — não existe cadastro livre.

- [ ] **Step 2: Adicionar links no `Login.tsx`**

Em `client/src/pages/Login.tsx`, adicionar o import no topo:

```tsx
import { Link } from "wouter";
```

Depois do botão de submit (`</button>` do botão "Entrar"), antes do `</form>` de fechamento, adicionar:

```tsx

        <div className="flex items-center justify-between mt-4 text-sm">
          <Link href="/esqueci-senha" className="text-muted-foreground hover:text-foreground">
            Esqueceu a senha?
          </Link>
          <Link href="/criar-conta" className="text-muted-foreground hover:text-foreground">
            Criar conta
          </Link>
        </div>
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros (mesmo `AdminUsers` ainda não existindo como arquivo real — só existirá após a Task 12; se este erro aparecer aqui, é porque a Task 12 precisa rodar antes de fechar esta verificação. Se o arquivo `client/src/pages/AdminUsers.tsx` ainda não existe neste ponto, criar um placeholder mínimo agora só pra destravar o `tsc`:

```tsx
export default function AdminUsers() {
  return null;
}
```

A Task 12 substitui esse conteúdo pelo componente completo.)

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/pages/Login.tsx client/src/pages/AdminUsers.tsx
git commit -m "feat: rotas pre-login e links de criar conta/esqueci senha"
```

---

### Task 12: Painel de administração de usuários

**Files:**
- Modify: `client/src/pages/AdminUsers.tsx` (substituir o placeholder da Task 11 pelo componente completo)
- Modify: `client/src/components/BarraLateral.tsx`

**Interfaces:**
- Consumes: `api.getUsers`/`createInvite`/`updateUser`/`deleteUser` (Task 8); `useAuth()` (existente); `ModalConfirmacao` (existente, `client/src/components/ModalConfirmacao.tsx`).

- [ ] **Step 1: Substituir `AdminUsers.tsx`**

```tsx
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
```

- [ ] **Step 2: Adicionar item "Usuários" na sidebar**

Em `client/src/components/BarraLateral.tsx`, adicionar `Users` ao import de `lucide-react` (depois de `LogOut,`):

```tsx
  Users,
```

Trocar o bloco `navConfig`:

```tsx
  const navConfig: ItemNav[] = useMemo(
    () => [
      { href: "/categories", titulo: "Categorias", Icone: Tags },
      { href: "/payment-methods", titulo: "Métodos de Pagamento", Icone: CreditCard },
    ],
    []
  );
```

por:

```tsx
  const navConfig: ItemNav[] = useMemo(() => {
    const itens: ItemNav[] = [
      { href: "/categories", titulo: "Categorias", Icone: Tags },
      { href: "/payment-methods", titulo: "Métodos de Pagamento", Icone: CreditCard },
    ];
    if (usuario?.isAdmin) {
      itens.push({ href: "/admin/users", titulo: "Usuários", Icone: Users });
    }
    return itens;
  }, [usuario?.isAdmin]);
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/AdminUsers.tsx client/src/components/BarraLateral.tsx
git commit -m "feat: painel de administracao de usuarios"
```

---

### Task 13: Docs + verificação end-to-end final

**Files:**
- Modify: `docs/USAGE.md`
- Modify: `docs/logs/TEST_LOG.md`

**Interfaces:**
- Nenhuma nova — esta task só documenta e verifica o que as Tasks 1-12 construíram.

- [ ] **Step 1: Documentar variáveis novas em `docs/USAGE.md`**

Adicionar no final do arquivo (depois da seção "## 13) Variavel SESSION_SECRET"):

```markdown
## 14) Variaveis de email (SMTP Hostinger)
- `SMTP_HOST`: `smtp.hostinger.com` (default no codigo, so precisa setar se mudar).
- `SMTP_PORT`: `465` (SSL, default no codigo) ou `587` (STARTTLS) se `465` nao funcionar.
- `SMTP_USER`: `noreply@meucontrole.cloud` (caixa ja existente na hospedagem de email da Hostinger).
- `SMTP_PASSWORD`: senha da caixa `noreply@meucontrole.cloud`. Obrigatoria em producao (o modulo `server/email.ts` recusa subir sem ela).
- `EMAIL_FROM`: `"Financa Familiar <noreply@meucontrole.cloud>"`. Obrigatoria em producao.
- `APP_URL`: base usada nos links de convite/reset (ex.: `https://meucontrole.cloud`). Em dev, default `http://localhost:3001`.
- `$env:SMTP_USER="noreply@meucontrole.cloud"`, `$env:SMTP_PASSWORD="..."`, `$env:EMAIL_FROM="Financa Familiar <noreply@meucontrole.cloud>"`, `$env:APP_URL="..."` Define localmente (PowerShell).
- Em producao: configurar as 4 (`SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `APP_URL`) no Coolify como variavel de ambiente do app.

## 15) Promover o primeiro admin
- Nao existe UI pra promover o primeiro admin (a UI de gestao de usuario exige jah ser admin pra acessar).
- Rodar uma vez, manualmente, com `DATABASE_URL` apontando pro banco certo (local ou producao):
  - `npx tsx -e "import('./server/storage.ts').then(async ({storage}) => { const u = await storage.getUserByEmail('seu@email.com'); if (!u) throw new Error('usuario nao encontrado'); await storage.updateUser(u.id, { isAdmin: true }); console.log('promovido:', u.id); process.exit(0); })"`
- Depois disso, promover outros admins pela propria UI (`/admin/users`, editar, marcar "E admin").
```

- [ ] **Step 2: Build completo**

Run: `npm run build`
Expected: build termina sem erro (client + server).

- [ ] **Step 3: Verificação manual de ponta a ponta (navegador)**

Pré-requisito: banco local ativo, servidor rodando (`npm start` ou `npm run dev`), `SMTP_USER`/`SMTP_PASSWORD`/`EMAIL_FROM`/`APP_URL` reais setados, pelo menos um usuário promovido a admin (Step 1 desta task, ou o `admin-teste@example.com` da Task 7).

Checklist:
- Logar como admin → sidebar mostra item "Usuários" (usuário comum não vê esse item).
- `/admin/users` → tabela carrega, mostra as contas existentes.
- Convidar um email real (que você acessa) → email de convite chega de verdade.
- Abrir o link do convite (`/criar-conta?token=...`) → email pré-preenchido, preencher nome+senha → conta criada, já loga, cai direto no dashboard.
- Deslogar, tentar `/criar-conta` sem token → mensagem "cadastro só por convite".
- No login, clicar "Esqueceu a senha?" → pedir reset pro mesmo email real → email de reset chega.
- Abrir o link do reset (`/redefinir-senha?token=...`) → definir senha nova → mensagem de sucesso → logar com a senha nova.
- Como admin, editar o nome de outra conta → reflete na tabela.
- Como admin, tentar remover o próprio `isAdmin` ou se auto-deletar → bloqueado (checkbox desabilitado / botão desabilitado na própria linha).
- Como admin, deletar a conta criada por convite → some da tabela; se essa pessoa estava logada em outra aba, a sessão dela morre (próxima ação dá erro de não-autenticado).

- [ ] **Step 4: Registrar em `docs/logs/TEST_LOG.md`**

Adicionar entrada no topo do arquivo (mesmo padrão das entradas existentes), com data de hoje, ambiente, checklist do Step 3 executado e resultado.

- [ ] **Step 5: Commit**

```bash
git add docs/USAGE.md docs/logs/TEST_LOG.md
git commit -m "docs: variaveis de email, bootstrap de admin e verificacao e2e de gestao de contas"
```

---

## Depois deste plano (fora de escopo, não incluir aqui)

- Promover o primeiro admin em produção (`docs/USAGE.md` seção 16) e configurar `SMTP_USER`/`SMTP_PASSWORD`/`EMAIL_FROM`/`APP_URL` no Coolify antes do deploy.
- Aplicar `isAdmin`/`tokens` em produção via `db:push` manual (mesmo canal humano já documentado no plano anterior).
