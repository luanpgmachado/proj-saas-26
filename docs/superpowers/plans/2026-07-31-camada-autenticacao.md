# Camada de Autenticação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o acesso a `meucontrole.cloud` atrás de login individual (email + senha), sem alterar o modelo de dados financeiro existente.

**Architecture:** Sessão server-side (`express-session` + `connect-pg-simple`, guardada no mesmo Postgres) com cookie `httpOnly`. Toda rota `/api/*` exceto `/api/auth/*` passa a exigir sessão válida. Contas são criadas por script CLI, sem autocadastro. SPA renderiza a tela de login no lugar do app quando não há sessão.

**Tech Stack:** Express 4 + Postgres (drizzle-orm) já existentes. Novo: `bcryptjs` (hash de senha), `express-session` + `connect-pg-simple` (sessão), `express-rate-limit` (throttle de login).

## Global Constraints

- Spec de referência: `docs/superpowers/specs/2026-07-31-camada-autenticacao-design.md`.
- Chat, commits e mensagens de erro voltadas ao usuário: PT-BR. Nomes técnicos (tabelas, colunas, rotas, funções ligadas ao contrato API) em inglês, seguindo o padrão já usado em `shared/schema.ts` e `server/routes.ts`. Nomes de domínio/UX no front (hooks, variáveis de estado) em PT-BR, seguindo o padrão de `CompetenciaMensalContext.tsx`.
- Dados financeiros (`categories`, `transactions`, `recurrences`, `goals`, `reserves`, `investments`, etc.) continuam sem `userId` — nenhuma tabela de domínio é tocada neste plano.
- Sem autocadastro público. Contas só via `server/scripts/create-user.ts`.
- `npm run db:push` só roda contra banco local/dev (`DATABASE_URL` apontando pro túnel local). Nunca contra produção neste fluxo (`docs/canonicos/RUNBOOK.md`, Guardrail obrigatório).
- Sem animações/modais fora do já existente em `docs/canonicos/UX_BLUEPRINT.md`.
- Projeto não tem suite automatizada (sem jest/vitest). Verificação é manual, via `tsc --noEmit` e chamadas HTTP reais (`curl`), como já registrado em `docs/logs/TEST_LOG.md`.

---

## Visão geral de arquivos

**Backend (novo):**
- `server/passwords.ts` — hash/verificação de senha (bcryptjs), sem dependências de sessão.
- `server/auth.ts` — middleware de sessão (`sessionMiddleware`) e `requireAuth`.
- `server/scripts/create-user.ts` — CLI pra criar conta.

**Backend (modificado):**
- `shared/schema.ts` — tabela `users`.
- `server/storage.ts` — `getUserByEmail`, `getUserById`, `createUser`.
- `server/routes.ts` — rotas `/auth/login`, `/auth/logout`, `/auth/me` + proteção do resto de `/api`.
- `server/index.ts` — monta `sessionMiddleware`.
- `package.json` — novas dependências.

**Frontend (novo):**
- `client/src/context/AuthContext.tsx` — estado de sessão no client.
- `client/src/pages/Login.tsx` — tela de login.

**Frontend (modificado):**
- `client/src/lib/api.ts` — chamadas de auth + handler global de 401.
- `client/src/App.tsx` — renderiza `Login` ou o app conforme sessão.
- `client/src/main.tsx` — envolve com `AuthProvider`.
- `client/src/components/BarraLateral.tsx` — nome do usuário + botão sair.

**Docs (modificado):**
- `docs/USAGE.md` — como criar usuário local e variável `SESSION_SECRET`.
- `docs/logs/TEST_LOG.md` — registro da rodada de verificação final.

---

### Task 1: Dependências de autenticação

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: pacotes `bcryptjs`, `express-session`, `connect-pg-simple`, `express-rate-limit` disponíveis em `node_modules`, com tipos (`@types/express-session`, `@types/connect-pg-simple`) resolvendo no `tsc`.

- [ ] **Step 1: Adicionar dependências no `package.json`**

Em `dependencies`, depois de `"express": "^4.21.2",`:

```json
    "express-rate-limit": "^8.6.1",
    "express-session": "^1.19.0",
    "connect-pg-simple": "^10.0.0",
    "bcryptjs": "^3.0.3",
```

Em `devDependencies`, depois de `"@types/express": "^5.0.0",`:

```json
    "@types/express-session": "^1.19.0",
    "@types/connect-pg-simple": "^7.0.3",
```

- [ ] **Step 2: Instalar**

Run: `npm install`
Expected: instala sem erro, `package-lock.json` atualizado.

- [ ] **Step 3: Verificar resolução dos pacotes**

Run: `node -e "require('bcryptjs'); require('express-session'); require('connect-pg-simple'); require('express-rate-limit'); console.log('ok')"`
Expected: imprime `ok`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adiciona dependencias de autenticacao"
```

---

### Task 2: Tabela `users` no schema

**Files:**
- Modify: `shared/schema.ts`

**Interfaces:**
- Produces: `users` (tabela drizzle), `User` (`typeof users.$inferSelect`), `InsertUser` (`typeof users.$inferInsert`) — campos `id: number`, `email: string`, `passwordHash: string`, `name: string`, `createdAt: Date`.

- [ ] **Step 1: Adicionar `timestamp` ao import do drizzle**

Em `shared/schema.ts:1`, trocar:

```ts
import { pgTable, serial, varchar, integer, date, text, boolean } from "drizzle-orm/pg-core";
```

por:

```ts
import { pgTable, serial, varchar, integer, date, text, boolean, timestamp } from "drizzle-orm/pg-core";
```

- [ ] **Step 2: Adicionar a tabela `users`**

Em `shared/schema.ts`, logo depois do bloco `investmentContributions` (depois da linha 88, antes de `export const categoriesRelations`), inserir:

```ts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 3: Adicionar os tipos**

No final do arquivo, depois de `export type InsertInvestmentContribution = typeof investmentContributions.$inferInsert;`, adicionar:

```ts
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.server.json`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: adiciona tabela users ao schema"
```

---

### Task 3: Hash de senha (`server/passwords.ts`)

Módulo isolado (sem tocar em sessão/DB) pra poder ser usado tanto pelas rotas quanto pelo script de criação de usuário sem carregar o pool de sessão.

**Files:**
- Create: `server/passwords.ts`

**Interfaces:**
- Produces: `hashPassword(senha: string): Promise<string>`, `verifyPassword(senha: string, hash: string): Promise<boolean>`.

- [ ] **Step 1: Criar o módulo**

```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function verifyPassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
```

- [ ] **Step 2: Verificar hash/compare na prática**

Run:

```bash
npx tsx -e "
import('./server/passwords.ts').then(async (m) => {
  const hash = await m.hashPassword('senha-teste-123');
  console.log('hash diferente da senha:', hash !== 'senha-teste-123');
  console.log('senha correta:', await m.verifyPassword('senha-teste-123', hash));
  console.log('senha errada:', await m.verifyPassword('outra-senha', hash));
});
"
```

Expected:
```
hash diferente da senha: true
senha correta: true
senha errada: false
```

- [ ] **Step 3: Commit**

```bash
git add server/passwords.ts
git commit -m "feat: modulo de hash de senha"
```

---

### Task 4: Métodos de usuário em `server/storage.ts`

**Files:**
- Modify: `server/storage.ts`

**Interfaces:**
- Consumes: `users`, `User`, `InsertUser` de `@shared/schema` (Task 2).
- Produces: `storage.getUserByEmail(email: string): Promise<User | undefined>`, `storage.getUserById(id: number): Promise<User | undefined>`, `storage.createUser(user: InsertUser): Promise<User>`.

- [ ] **Step 1: Importar `users`/`User`/`InsertUser`**

Em `server/storage.ts:1-32`, no bloco de import de `@shared/schema`, adicionar depois de `investmentContributions,`:

```ts
  users,
```

E depois de `type InsertInvestmentContribution,`:

```ts
  type User,
  type InsertUser,
```

- [ ] **Step 2: Adicionar os métodos**

Em `server/storage.ts:810-811`, imediatamente antes do fechamento da classe (`}` na linha 811, antes de `export const storage = new DatabaseStorage();`), inserir:

```ts

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
```

- [ ] **Step 3: Aplicar o schema no banco local**

Pré-requisito: túnel SSH local aberto e `$env:DATABASE_URL` apontando pro banco local (`docs/USAGE.md`, seção 1).

Run: `npm run db:push`
Expected: drizzle-kit relata criação da tabela `users` (`+ users`), sem erro.

- [ ] **Step 4: Verificar round-trip real no banco**

Run:

```bash
npx tsx -e "
import('./server/storage.ts').then(async ({ storage }) => {
  const criado = await storage.createUser({ email: 'teste@example.com', passwordHash: 'hash-fake', name: 'Teste' });
  console.log('criado:', criado.id, criado.email);
  const porEmail = await storage.getUserByEmail('teste@example.com');
  console.log('achou por email:', porEmail?.id === criado.id);
  const porId = await storage.getUserById(criado.id);
  console.log('achou por id:', porId?.email === 'teste@example.com');
  process.exit(0);
});
"
```

Expected: `criado: <id> teste@example.com`, `achou por email: true`, `achou por id: true`.

(A linha de teste fica no banco local — sem problema, é dado de desenvolvimento.)

- [ ] **Step 5: Commit**

```bash
git add server/storage.ts
git commit -m "feat: metodos de usuario em storage"
```

---

### Task 5: Script CLI para criar conta (`server/scripts/create-user.ts`)

**Files:**
- Create: `server/scripts/create-user.ts`
- Modify: `docs/USAGE.md`

**Interfaces:**
- Consumes: `storage.getUserByEmail`, `storage.createUser` (Task 4), `hashPassword` (Task 3).

- [ ] **Step 1: Criar o script**

```ts
import { pool } from "../db";
import { storage } from "../storage";
import { hashPassword } from "../passwords";

async function main() {
  const [, , email, senha, ...nomeParts] = process.argv;
  const name = nomeParts.join(" ").trim();

  if (!email || !senha || !name) {
    console.error("Uso: npx tsx server/scripts/create-user.ts <email> <senha> <nome completo>");
    await pool.end();
    process.exit(1);
  }

  const emailNormalizado = email.trim().toLowerCase();
  const existente = await storage.getUserByEmail(emailNormalizado);
  if (existente) {
    console.error(`Ja existe usuario com email ${emailNormalizado}.`);
    await pool.end();
    process.exit(1);
  }

  const passwordHash = await hashPassword(senha);
  const user = await storage.createUser({ email: emailNormalizado, passwordHash, name });

  console.log(`Usuario criado: id=${user.id} email=${user.email} name=${user.name}`);
  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
```

- [ ] **Step 2: Rodar contra o banco local e conferir**

Limpar a linha de teste da Task 4 e criar a primeira conta real:

Run: `npx tsx -e "import('./server/storage.ts').then(async ({storage}) => { /* apenas garante que o modulo carrega */ console.log('ok'); process.exit(0); })"` — pular, ir direto:

Run: `npx tsx server/scripts/create-user.ts voce@example.com "senha-forte-123" "Seu Nome"`
Expected: `Usuario criado: id=<n> email=voce@example.com name=Seu Nome`

Rodar de novo com o mesmo email:

Run: `npx tsx server/scripts/create-user.ts voce@example.com "outra-senha" "Seu Nome"`
Expected: `Ja existe usuario com email voce@example.com.` e saída com código 1.

- [ ] **Step 3: Documentar em `docs/USAGE.md`**

Adicionar seção no final do arquivo (depois da seção `## 11) Deploy em producao`):

```markdown
## 12) Criar conta de acesso (local ou producao)
- Requisitos: `DATABASE_URL` apontando pro banco correto (local ou producao, via variavel de ambiente).
- `npx tsx server/scripts/create-user.ts email@exemplo.com "senha-forte" "Nome da Pessoa"` Cria conta. Sem autocadastro publico — toda conta passa por este script.
- Rodar de novo com o mesmo email retorna erro sem duplicar.

## 13) Variavel SESSION_SECRET
- Obrigatoria em producao (`NODE_ENV=production`); o servidor recusa subir sem ela.
- `$env:SESSION_SECRET="valor-aleatorio-longo"` Define localmente (opcional em dev).
- Em producao: configurar no Coolify como variavel de ambiente do app, com um valor aleatorio gerado uma vez e mantido estavel (trocar o valor invalida todas as sessoes ativas).
```

- [ ] **Step 4: Commit**

```bash
git add server/scripts/create-user.ts docs/USAGE.md
git commit -m "feat: script CLI para criar usuario"
```

---

### Task 6: Middleware de sessão (`server/auth.ts`)

**Files:**
- Create: `server/auth.ts`

**Interfaces:**
- Consumes: `pool` de `./db` (conexão Postgres existente).
- Produces: `sessionMiddleware` (Express middleware), `requireAuth(req, res, next)` (Express middleware, responde `401` sem `req.session.userId`). Módulo aumenta `express-session` com `SessionData.userId: number`.

- [ ] **Step 1: Criar o módulo**

```ts
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Request, Response, NextFunction } from "express";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET deve estar definida em producao.");
}

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "dev-secret-nao-usar-em-producao",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nao autenticado" });
  }
  next();
}
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.server.json`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add server/auth.ts
git commit -m "feat: middleware de sessao e requireAuth"
```

---

### Task 7: Rotas de autenticação e proteção de `/api` (integração completa)

Task central — depois deste task o site inteiro exige login. Testado de ponta a ponta com o servidor real rodando.

**Files:**
- Modify: `server/routes.ts`
- Modify: `server/index.ts`

**Interfaces:**
- Consumes: `requireAuth` (Task 6), `storage.getUserByEmail`/`getUserById` (Task 4), `verifyPassword` (Task 3), `sessionMiddleware` (Task 6).
- Produces: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Todo `/api/*` restante exige sessão.

- [ ] **Step 1: Adicionar rotas de auth e proteção em `server/routes.ts`**

No topo do arquivo, depois de `import type { ParsedQs } from "qs";`, adicionar:

```ts
import rateLimit from "express-rate-limit";
import { requireAuth } from "./auth";
import { verifyPassword } from "./passwords";
```

Depois da definição de `asyncHandler` (`server/routes.ts:23-26`) e **antes** de `router.get("/categories", ...)` (linha 28), inserir:

```ts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

router.post("/auth/login", loginRateLimit, asyncHandler(async (req, res) => {
  const { email, senha } = req.body ?? {};
  if (typeof email !== "string" || typeof senha !== "string") {
    return res.status(400).json({ error: "email e senha sao obrigatorios" });
  }

  const user = await storage.getUserByEmail(email.trim().toLowerCase());
  const senhaValida = user ? await verifyPassword(senha, user.passwordHash) : false;
  if (!user || !senhaValida) {
    return res.status(401).json({ error: "email ou senha invalidos" });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Erro ao iniciar sessao" });
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name });
  });
}));

router.post("/auth/logout", asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Erro ao encerrar sessao" });
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
}));

router.get("/auth/me", asyncHandler(async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Nao autenticado" });
  const user = await storage.getUserById(req.session.userId);
  if (!user) return res.status(401).json({ error: "Nao autenticado" });
  res.json({ id: user.id, email: user.email, name: user.name });
}));

router.use(requireAuth);
```

- [ ] **Step 2: Montar `sessionMiddleware` em `server/index.ts`**

Em `server/index.ts:6`, depois de `import routes from "./routes";`, adicionar:

```ts
import { sessionMiddleware } from "./auth";
```

Em `server/index.ts:17`, entre `app.use(express.json());` e `app.use("/api", routes);`, adicionar:

```ts
app.use(sessionMiddleware);
```

- [ ] **Step 3: Subir o servidor local e testar o fluxo completo**

Pré-requisito: túnel local + `DATABASE_URL` ativos (mesmo do Task 4), usuário já criado no Task 5 (`voce@example.com` / `senha-forte-123`).

Run (em background, deixar rodando): `npx tsx watch server/index.ts`

Em outro terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/categories
```
Expected: `401`

```bash
curl -s -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"voce@example.com","senha":"senha-forte-123"}'
```
Expected: JSON com `id`, `email`, `name` — sem campo de senha/hash.

```bash
curl -s -b cookies.txt -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/categories
```
Expected: `200`

```bash
curl -s -b cookies.txt -X POST http://localhost:3001/api/auth/logout
```
Expected: `{"success":true}`

```bash
curl -s -b cookies.txt -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/categories
```
Expected: `401` (sessão destruída no servidor, cookie velho não vale mais)

```bash
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"x@x.com","senha":"errada"}'; done; echo
```
Expected: cinco `401` e o sexto `429`.

Encerrar o servidor local depois do teste. Apagar `cookies.txt` (não commitar).

- [ ] **Step 4: Commit**

```bash
git add server/routes.ts server/index.ts
git commit -m "feat: rotas de login/logout/me e protecao de /api"
```

---

### Task 8: Cliente HTTP com suporte a auth (`client/src/lib/api.ts`)

**Files:**
- Modify: `client/src/lib/api.ts`

**Interfaces:**
- Produces: `api.login(email, senha)`, `api.logout()`, `api.me()`, `setUnauthorizedHandler(handler: (() => void) | null)`.

- [ ] **Step 1: Adicionar handler global de 401**

Em `client/src/lib/api.ts:1-2`, depois de `const API_BASE = "/api";`, adicionar:

```ts
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}
```

- [ ] **Step 2: Disparar o handler em respostas 401**

Em `client/src/lib/api.ts:12-24`, dentro do bloco `if (!res.ok) { ... }`, depois de `err.body = text;` e antes de `throw err;`, adicionar:

```ts
    if (res.status === 401) {
      onUnauthorized?.();
    }
```

- [ ] **Step 3: Adicionar os métodos de auth no objeto `api`**

Em `client/src/lib/api.ts`, dentro do objeto `export const api = { ... }`, adicionar como primeiras entradas (antes de `getMonthSummary`):

```ts
  login: (email: string, senha: string) =>
    request<{ id: number; email: string; name: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
  logout: () => request<{ success: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<{ id: number; email: string; name: string }>("/auth/me"),
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "feat: chamadas de auth e handler de 401 no cliente HTTP"
```

---

### Task 9: `AuthContext`

**Files:**
- Create: `client/src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `api.login`, `api.logout`, `api.me`, `setUnauthorizedHandler` de `../lib/api` (Task 8).
- Produces: `AuthProvider` (component), `useAuth(): { usuario: {id:number; email:string; name:string} | null; carregando: boolean; entrar(email: string, senha: string): Promise<void>; sair(): Promise<void> }`.

- [ ] **Step 1: Criar o contexto**

```tsx
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
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/context/AuthContext.tsx
git commit -m "feat: AuthContext no cliente"
```

---

### Task 10: Tela de login (`client/src/pages/Login.tsx`)

**Files:**
- Create: `client/src/pages/Login.tsx`

**Interfaces:**
- Consumes: `useAuth()` de `../context/AuthContext` (Task 9).

- [ ] **Step 1: Criar a página**

```tsx
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoSubmeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form onSubmit={aoSubmeter} className="surface-card w-full max-w-[360px] p-6">
        <h1 className="text-lg font-semibold mb-1">Finança Familiar</h1>
        <p className="text-sm text-muted-foreground mb-6">Entre com sua conta.</p>

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
          disabled={enviando}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm hover:brightness-[0.98] transition-smooth focus-ring disabled:opacity-60"
        >
          {enviando ? "Entrando..." : "Entrar"}
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
git add client/src/pages/Login.tsx
git commit -m "feat: tela de login"
```

---

### Task 11: Conectar auth na raiz da aplicação

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/main.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 9), `Login` (Task 10).

- [ ] **Step 1: Envolver a árvore com `AuthProvider` em `main.tsx`**

Substituir o conteúdo de `client/src/main.tsx` por:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CompetenciaMensalProvider } from "./context/CompetenciaMensalContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <CompetenciaMensalProvider>
        <App />
      </CompetenciaMensalProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Gatear o app em `App.tsx`**

Substituir o conteúdo de `client/src/App.tsx` por:

```tsx
import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { LayoutAplicativo } from "./components/LayoutAplicativo";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";

// Code-splitting por rota: reduz JS inicial e melhora TTI/FID em conexoes lentas.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const AnnualView = lazy(() => import("./pages/AnnualView"));
const Goals = lazy(() => import("./pages/Goals"));
const Investments = lazy(() => import("./pages/Investments"));
const Recurrences = lazy(() => import("./pages/Recurrences"));
const Categories = lazy(() => import("./pages/Categories"));

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
    return <Login />;
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
        </Switch>
      </Suspense>
    </LayoutAplicativo>
  );
}
```

Sem sessão válida, a raiz renderiza só `<Login />` (sem sidebar, sem chamadas às rotas de domínio). Não existe rota `/login` dedicada — a troca é por estado, não por URL, então um F5 depois de logar mantém a página em que a pessoa estava.

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/main.tsx
git commit -m "feat: gateia app por sessao de autenticacao"
```

---

### Task 12: Nome do usuário e logout na sidebar + verificação end-to-end

**Files:**
- Modify: `client/src/components/BarraLateral.tsx`
- Modify: `docs/logs/TEST_LOG.md`

**Interfaces:**
- Consumes: `useAuth()` (Task 9).

- [ ] **Step 1: Adicionar usuário + logout no rodapé da sidebar**

Em `client/src/components/BarraLateral.tsx:1-14`, ajustar os imports:

```tsx
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Tags,
  CreditCard,
  ChevronLeft,
  Wallet,
  Target,
  LineChart,
  LogOut,
} from "lucide-react";
import { LinkNavegacao } from "./LinkNavegacao";
import { SeletorCompetenciaMensal } from "./SeletorCompetenciaMensal";
import { useAuth } from "../context/AuthContext";
```

Em `client/src/components/BarraLateral.tsx:24-25`, logo no início de `export function BarraLateral() {`, adicionar:

```tsx
  const { usuario, sair } = useAuth();
```

Substituir o bloco `<footer ...>...</footer>` (linhas 128-136) por:

```tsx
      <footer className="px-2 pb-3 flex flex-col gap-2">
        <div
          className={[
            "flex items-center gap-2 px-2 h-9",
            recolhida ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          {recolhida ? null : (
            <span
              className="text-xs text-sidebar-muted truncate"
              title={usuario?.email}
            >
              {usuario?.name}
            </span>
          )}
          <button
            type="button"
            onClick={() => sair()}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-sidebar-muted hover:text-foreground hover:bg-secondary transition-smooth focus-ring"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center" aria-label="Competência mensal">
          <SeletorCompetenciaMensal recolhida={recolhida} />
        </div>
      </footer>
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 3: Build completo**

Run: `npm run build`
Expected: build termina sem erro (client + server).

- [ ] **Step 4: Verificação manual de ponta a ponta**

Pré-requisito: túnel local + `DATABASE_URL` ativos, usuário criado (Task 5).

Run: `npm start` (ou `npm run dev` para hot-reload), abrir `http://localhost:3001` (ou `:5000` no modo dev) no navegador.

Checklist:
- Acessar a raiz sem estar logado → aparece só a tela de login (sem sidebar, sem dado financeiro visível).
- Tentar senha errada → mensagem "email ou senha invalidos", continua na tela de login.
- Logar com a conta criada na Task 5 → aparece o app completo, sidebar com nome da pessoa no rodapé.
- Navegar entre páginas (`/transactions`, `/goals`, etc.) → continuam funcionando normalmente.
- Recarregar a página (F5) logado → continua logado, sem pedir senha de novo.
- Clicar em "Sair" → volta pra tela de login.
- Depois do logout, tentar recarregar → continua na tela de login (sessão realmente encerrada, não é só estado do React).

- [ ] **Step 5: Registrar em `docs/logs/TEST_LOG.md`**

Adicionar entrada no topo do arquivo (mesmo padrão das entradas existentes), com data de hoje, ambiente, checklist executado (Step 4) e resultado.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/BarraLateral.tsx docs/logs/TEST_LOG.md
git commit -m "feat: nome do usuario e logout na sidebar"
```

---

## Depois deste plano (fora de escopo, não incluir aqui)

- Criar as contas reais de produção via `create-user.ts` contra `DATABASE_URL` de produção (comando permitido — só `db:push`/seed/backfill/SQL manual são proibidos em produção pelo Guardrail).
- Configurar `SESSION_SECRET` no Coolify antes do deploy (o processo recusa subir em produção sem essa variável).
- Aplicar a tabela `users`/`session` em produção pelo canal já usado pelo time pra alterações de schema (fora do fluxo deste agente, conforme Guardrail).
