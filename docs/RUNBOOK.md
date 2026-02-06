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

## Deploy em VM Oracle Free (Nginx + systemd + firewall)

Padrao recomendado:
- Node/Express em porta interna (ex: `3001`) e **nao expor porta alta** diretamente.
- Nginx expondo `80/443` e fazendo proxy de `/api/` para o Node.
- Front buildado (`Vite`) servido como static pelo Nginx.

Checklist (rodar na VM):
```bash
# 1) Portas e bind
sudo ss -ltnp | sed -n '1,140p'

# 2) Teste local
curl -sv http://127.0.0.1:3001/ 2>&1 | head -n 20 || true
curl -sv http://127.0.0.1/ 2>&1 | head -n 20 || true

# 3) Nginx
sudo nginx -t
sudo systemctl status nginx --no-pager -l || true
sudo tail -n 200 /var/log/nginx/error.log || true

# 4) Firewall (ordem importa: ACCEPT 80/443 antes do REJECT/DROP)
sudo iptables -L INPUT -n -v --line-numbers | sed -n '1,80p'
sudo iptables -S | sed -n '1,220p'
```

Firewall (quando usa iptables com REJECT/DROP no fim):
```bash
sudo iptables -I INPUT 5 -p tcp -m state --state NEW --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -p tcp -m state --state NEW --dport 443 -j ACCEPT
sudo netfilter-persistent save || true
```

Ingress da OCI (Console):
- Liberar TCP `80` e `443` na Subnet via Security List ou NSG (source `0.0.0.0/0` ou seu IP).

Bug tipico (Express):
- Se existir `app.get("*", ...)`, garantir que requests em `/api/*` **nao** fiquem pendurados:
  - Se `req.path.startsWith("/api")` => `next()`.
