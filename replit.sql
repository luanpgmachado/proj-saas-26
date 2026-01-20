--
-- PostgreSQL database dump
--

\restrict xHpkIVIRWNBjtyvDRBElWtRYqURyyFO4ohtXXhOgwj7PVZRBpF4ZnBclWwX6EXs

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    kind character varying(50) NOT NULL,
    monthly_budget_cents integer
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: goal_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_contributions (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    date date NOT NULL,
    amount_cents integer NOT NULL
);


--
-- Name: goal_contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goal_contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goal_contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goal_contributions_id_seq OWNED BY public.goal_contributions.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    target_cents integer NOT NULL
);


--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: investment_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investment_contributions (
    id integer NOT NULL,
    investment_id integer NOT NULL,
    date date NOT NULL,
    amount_cents integer NOT NULL
);


--
-- Name: investment_contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investment_contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: investment_contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investment_contributions_id_seq OWNED BY public.investment_contributions.id;


--
-- Name: investments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investments (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: investments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: investments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investments_id_seq OWNED BY public.investments.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    is_card boolean DEFAULT false NOT NULL,
    paid_in_month boolean DEFAULT true NOT NULL,
    closing_day integer,
    due_day integer
);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: reserve_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserve_contributions (
    id integer NOT NULL,
    reserve_id integer NOT NULL,
    date date NOT NULL,
    amount_cents integer NOT NULL
);


--
-- Name: reserve_contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reserve_contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reserve_contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reserve_contributions_id_seq OWNED BY public.reserve_contributions.id;


--
-- Name: reserves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserves (
    id integer NOT NULL,
    name character varying(255) DEFAULT 'Reserva de Emergência'::character varying NOT NULL
);


--
-- Name: reserves_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reserves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reserves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reserves_id_seq OWNED BY public.reserves.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    date date NOT NULL,
    description text NOT NULL,
    type character varying(50) NOT NULL,
    amount_cents integer NOT NULL,
    category_id integer,
    payment_method_id integer,
    "group" character varying(50) NOT NULL,
    installment_group_id character varying(255),
    installment_index integer,
    installment_total integer
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: goal_contributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_contributions ALTER COLUMN id SET DEFAULT nextval('public.goal_contributions_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: investment_contributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_contributions ALTER COLUMN id SET DEFAULT nextval('public.investment_contributions_id_seq'::regclass);


--
-- Name: investments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments ALTER COLUMN id SET DEFAULT nextval('public.investments_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: reserve_contributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserve_contributions ALTER COLUMN id SET DEFAULT nextval('public.reserve_contributions_id_seq'::regclass);


--
-- Name: reserves id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves ALTER COLUMN id SET DEFAULT nextval('public.reserves_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, kind, monthly_budget_cents) FROM stdin;
1	Mercado	expense	\N
2	Necessidades	expense	\N
3	Eletrônicos	expense	\N
4	Assinaturas	expense	\N
5	Roupa	expense	\N
6	Beleza	expense	\N
7	Presentes	expense	\N
8	Saúde	expense	\N
9	Despesas eventuais	expense	\N
10	Desenvolvimento	expense	\N
11	Uber/transporte	expense	\N
12	IFood/restaurante	expense	\N
13	Lazer	expense	\N
14	Moradia	expense	\N
15	Outro	expense	\N
\.


--
-- Data for Name: goal_contributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goal_contributions (id, goal_id, date, amount_cents) FROM stdin;
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goals (id, name, target_cents) FROM stdin;
\.


--
-- Data for Name: investment_contributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.investment_contributions (id, investment_id, date, amount_cents) FROM stdin;
\.


--
-- Data for Name: investments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.investments (id, name) FROM stdin;
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_methods (id, name, type, is_card, paid_in_month, closing_day, due_day) FROM stdin;
\.


--
-- Data for Name: reserve_contributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserve_contributions (id, reserve_id, date, amount_cents) FROM stdin;
\.


--
-- Data for Name: reserves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserves (id, name) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, date, description, type, amount_cents, category_id, payment_method_id, "group", installment_group_id, installment_index, installment_total) FROM stdin;
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 15, true);


--
-- Name: goal_contributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goal_contributions_id_seq', 1, false);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goals_id_seq', 1, false);


--
-- Name: investment_contributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investment_contributions_id_seq', 1, false);


--
-- Name: investments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investments_id_seq', 1, false);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 1, false);


--
-- Name: reserve_contributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reserve_contributions_id_seq', 1, false);


--
-- Name: reserves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reserves_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: goal_contributions goal_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_contributions
    ADD CONSTRAINT goal_contributions_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: investment_contributions investment_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_contributions
    ADD CONSTRAINT investment_contributions_pkey PRIMARY KEY (id);


--
-- Name: investments investments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT investments_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: reserve_contributions reserve_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserve_contributions
    ADD CONSTRAINT reserve_contributions_pkey PRIMARY KEY (id);


--
-- Name: reserves reserves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves
    ADD CONSTRAINT reserves_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: goal_contributions goal_contributions_goal_id_goals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_contributions
    ADD CONSTRAINT goal_contributions_goal_id_goals_id_fk FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: investment_contributions investment_contributions_investment_id_investments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_contributions
    ADD CONSTRAINT investment_contributions_investment_id_investments_id_fk FOREIGN KEY (investment_id) REFERENCES public.investments(id);


--
-- Name: reserve_contributions reserve_contributions_reserve_id_reserves_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserve_contributions
    ADD CONSTRAINT reserve_contributions_reserve_id_reserves_id_fk FOREIGN KEY (reserve_id) REFERENCES public.reserves(id);


--
-- Name: transactions transactions_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: transactions transactions_payment_method_id_payment_methods_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_payment_method_id_payment_methods_id_fk FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- PostgreSQL database dump complete
--

\unrestrict xHpkIVIRWNBjtyvDRBElWtRYqURyyFO4ohtXXhOgwj7PVZRBpF4ZnBclWwX6EXs

