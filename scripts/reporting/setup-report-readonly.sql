\set ON_ERROR_STOP on

\if :{?database_name}
\else
  \echo 'Missing psql variable: -v database_name=NOME_DATABASE_PRODUCAO'
  \quit 1
\endif

\if :{?report_user}
\else
  \echo 'Missing psql variable: -v report_user=report_readonly'
  \quit 1
\endif

\if :{?report_password}
\else
  \echo 'Missing psql variable: -v report_password=SENHA_GERADA_FORA_DO_GIT'
  \quit 1
\endif

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'report_user', :'report_password')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'report_user'
)
\gexec

ALTER ROLE :"report_user" WITH LOGIN PASSWORD :'report_password';
ALTER ROLE :"report_user" SET default_transaction_read_only = on;
ALTER ROLE :"report_user" SET statement_timeout = '30s';
ALTER ROLE :"report_user" SET idle_in_transaction_session_timeout = '60s';

GRANT CONNECT ON DATABASE :"database_name" TO :"report_user";
GRANT USAGE ON SCHEMA public TO :"report_user";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"report_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"report_user";

SELECT
  :'database_name' AS database_name,
  :'report_user' AS report_user,
  'readonly role configured' AS status;
