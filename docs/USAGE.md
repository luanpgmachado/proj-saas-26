# Uso Local (fora do Replit)

## Requisitos
- Node.js 20+
- npm 9+
- PostgreSQL 16+

## 1) Subir ambiente completo local
- `npm install` Instala dependencias do projeto.
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5432/financas"` Define a conexao local do banco.
- `npm run db:push` Cria/atualiza as tabelas no banco local.
- `npm run dev` Sobe front-end e back-end juntos.

## 2) Subir somente o front-end local
- `npm install` Instala dependencias do projeto.
- `npm run dev:client` Sobe o Vite em `http://localhost:5000`.

## 3) Subir somente o back-end local
- `npm install` Instala dependencias do projeto.
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5432/financas"` Define a conexao local do banco.
- `npm run dev:server` Sobe a API em `http://localhost:3001/api`.

## 4) Subir o banco de dados local
- `psql -U postgres` Entra no Postgres local.
- `CREATE DATABASE financas;` Cria o banco local.

## 5) Criar environments no PowerShell (local)
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5432/financas"` Exporta a variavel na sessao atual.
- `[Environment]::SetEnvironmentVariable("DATABASE_URL","postgres://usuario:senha@localhost:5432/financas","User")` Persiste a variavel no perfil do usuario.

## 6) Fluxo completo para deixar o ambiente no ar (local)
- `psql -U postgres` Entra no Postgres local.
- `CREATE DATABASE financas;` Cria o banco.
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5432/financas"` Define a conexao local.
- `npm install` Instala dependencias.
- `npm run db:push` Aplica o schema no banco.
- `npm run dev` Sobe front-end e back-end.
