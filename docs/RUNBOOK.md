# Runbook

## Ordem de trabalho
1. Leia `AGENTS.md` para fluxo PDCA e engenharia de contexto.
2. Consulte `docs/INDEX.md` para mapa da documentacao.
3. Leia `README.md` para entender a estrutura.
4. Leia `docs/CONTEXT.md` e `docs/RULES.md`.
5. Escolha o prompt adequado em `docs/PROMPTS/`.
6. Abra projeto e issues no Linear via MCP para registrar escopo, riscos e dependencias.
7. Execute a tarefa respeitando `docs/UX_BLUEPRINT.md` e `docs/API_CONTRACT.md`.
8. Se requisitos mudarem, atualize os documentos canonicos antes do codigo.

## Uso do ambiente
- Guia operacional: `docs/USAGE.md`.

## Uso diario
- Front-end segue `docs/UX_BLUEPRINT.md`.
- Back-end segue `docs/API_CONTRACT.md`.
- Infra garante build e deploy sem tocar regra de negocio.
- Reviewer aponta desvios sem alterar arquivos.

## Deploy em VPS Hostinger com Coolify (workflow oficial)

Ambiente atual:
- VPS: Ubuntu 24.04 LTS
- Host Coolify: `31.97.240.105`
- Acesso SSH: `ssh root@31.97.240.105`

### Pre-requisitos
- Repositorio GitHub atualizado.
- `Dockerfile` no projeto (raiz ou subpasta).
- Token/API do Coolify configurados no MCP `coolify`.

### 1) Sincronizacao com GitHub
```powershell
git add .
git commit -m "Preparando para deploy"
git push origin main
```

### 2) Criar aplicacao no Coolify via MCP
Padrao:
- `build_pack='dockerfile'`
- `ports_exposes='3001'`
- Ambiente `production`
- Em Dockerfile, usar `npm ci --include=dev` no stage de build para evitar falha quando `NODE_ENV=production` for passado em build-time pelo Coolify.

Se app nova:
- criar projeto (se necessario)
- criar environment `production`
- criar app com `application action=create_public` apontando para o repo

### 3) Deploy inicial via MCP
- Disparar `deploy` para UUID da aplicacao.
- Acompanhar status em `deployment action=get` ate `finished` (ou erro).
- Inspecionar logs de deploy para diagnosticar falhas.

### 4) DNS manual na Hostinger (acao do usuario)
Como MCP da Hostinger nao esta disponivel:
1. Abrir painel Hostinger -> DNS / Nameservers.
2. Criar registro `A`.
3. Nome: subdominio (ex: `app`) ou `@`.
4. Valor: IP da VPS (`31.97.240.105`).

### 5) Dominio e SSL no Coolify
1. Tentar atualizar `fqdn` automaticamente via MCP (`application action=update`).
2. Fallback proativo: se falhar, abrir pagina do app no Coolify:
`https://31.97.240.105:8000/project/[PROJECT-UUID]/environment/[ENV-NAME]/application/[APP-UUID]#configuration`
3. No campo **Domains**, salvar URL completa com HTTPS (ex: `https://seu-dominio.com`).
4. Executar **Redeploy**.

### 6) Banco de dados
- Para este projeto, a API exige `DATABASE_URL` (ou `REPLIT_DB_URL`).
- Recomendado: criar PostgreSQL no Coolify e usar `internal_db_url` como `DATABASE_URL`.
- Executar migracao de schema apos primeiro deploy (`npm run db:push`) em job/manual command do Coolify.

### 7) Validacao final
- URL HTTP provisoria (Coolify/sslip) deve responder.
- URL HTTPS final (dominio) deve responder.
- Endpoint de API deve retornar resposta imediata (200/404), nunca timeout.
