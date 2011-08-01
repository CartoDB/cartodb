--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET escape_string_warning = off;

--
-- Name: plpgsql; Type: PROCEDURAL LANGUAGE; Schema: -; Owner: simon
--

CREATE OR REPLACE PROCEDURAL LANGUAGE plpgsql;


ALTER PROCEDURAL LANGUAGE plpgsql OWNER TO simon;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE api_keys (
    id integer NOT NULL,
    api_key text NOT NULL,
    user_id integer NOT NULL,
    domain text NOT NULL
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.api_keys_id_seq OWNER TO postgres;

--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE api_keys_id_seq OWNED BY api_keys.id;


--
-- Name: client_applications; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE client_applications (
    id integer NOT NULL,
    name text,
    url text,
    support_url text,
    callback_url text,
    key text,
    secret text,
    user_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.client_applications OWNER TO postgres;

--
-- Name: client_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE client_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.client_applications_id_seq OWNER TO postgres;

--
-- Name: client_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE client_applications_id_seq OWNED BY client_applications.id;


--
-- Name: oauth_nonces; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE oauth_nonces (
    id integer NOT NULL,
    nonce text,
    "timestamp" integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.oauth_nonces OWNER TO postgres;

--
-- Name: oauth_nonces_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE oauth_nonces_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.oauth_nonces_id_seq OWNER TO postgres;

--
-- Name: oauth_nonces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE oauth_nonces_id_seq OWNED BY oauth_nonces.id;


--
-- Name: oauth_tokens; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE oauth_tokens (
    id integer NOT NULL,
    user_id integer,
    type text,
    client_application_id integer,
    token text,
    secret text,
    callback_url text,
    verifier text,
    scope text,
    authorized_at timestamp without time zone,
    invalidated_at timestamp without time zone,
    valid_to timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.oauth_tokens OWNER TO postgres;

--
-- Name: oauth_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE oauth_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.oauth_tokens_id_seq OWNER TO postgres;

--
-- Name: oauth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE oauth_tokens_id_seq OWNED BY oauth_tokens.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE schema_migrations (
    filename text NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE tags (
    id integer NOT NULL,
    name text NOT NULL,
    user_id integer NOT NULL,
    table_id integer NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE tags_id_seq OWNED BY tags.id;


--
-- Name: user_tables; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE user_tables (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    privacy integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    tags text,
    geometry_columns text,
    rows_counted integer DEFAULT 0,
    rows_estimated integer DEFAULT 0,
    indexes character varying[],
    database_name text
);


ALTER TABLE public.user_tables OWNER TO postgres;

--
-- Name: user_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_tables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_tables_id_seq OWNER TO postgres;

--
-- Name: user_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_tables_id_seq OWNED BY user_tables.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users (
    id integer NOT NULL,
    email text NOT NULL,
    crypted_password text NOT NULL,
    salt text NOT NULL,
    database_name text,
    username text NOT NULL,
    tables_count integer DEFAULT 0 NOT NULL,
    admin boolean,
    enabled boolean DEFAULT false,
    invite_token text,
    invite_token_date date,
    subdomain character varying,
    map_enabled boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE api_keys ALTER COLUMN id SET DEFAULT nextval('api_keys_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE client_applications ALTER COLUMN id SET DEFAULT nextval('client_applications_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE oauth_nonces ALTER COLUMN id SET DEFAULT nextval('oauth_nonces_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE oauth_tokens ALTER COLUMN id SET DEFAULT nextval('oauth_tokens_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE tags ALTER COLUMN id SET DEFAULT nextval('tags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE user_tables ALTER COLUMN id SET DEFAULT nextval('user_tables_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- Name: api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: client_applications_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY client_applications
    ADD CONSTRAINT client_applications_key_key UNIQUE (key);


--
-- Name: client_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY client_applications
    ADD CONSTRAINT client_applications_pkey PRIMARY KEY (id);


--
-- Name: oauth_nonces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY oauth_nonces
    ADD CONSTRAINT oauth_nonces_pkey PRIMARY KEY (id);


--
-- Name: oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY oauth_tokens
    ADD CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: oauth_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY oauth_tokens
    ADD CONSTRAINT oauth_tokens_token_key UNIQUE (token);


--
-- Name: schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY user_tables
    ADD CONSTRAINT user_tables_pkey PRIMARY KEY (id);


--
-- Name: users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: api_keys_api_key_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX api_keys_api_key_index ON api_keys USING btree (api_key);


--
-- Name: oauth_nonces_nonce_timestamp_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX oauth_nonces_nonce_timestamp_index ON oauth_nonces USING btree (nonce, "timestamp");


--
-- Name: tags_table_id_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX tags_table_id_index ON tags USING btree (table_id);


--
-- Name: tags_user_id_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX tags_user_id_index ON tags USING btree (user_id);


--
-- Name: tags_user_id_table_id_name_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX tags_user_id_table_id_name_index ON tags USING btree (user_id, table_id, name);


--
-- Name: user_tables_name_user_id_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX user_tables_name_user_id_index ON user_tables USING btree (name, user_id);


--
-- Name: user_tables_user_id_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX user_tables_user_id_index ON user_tables USING btree (user_id);


--
-- Name: user_tables_user_id_privacy_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX user_tables_user_id_privacy_index ON user_tables USING btree (user_id, privacy);


--
-- Name: users_subdomain_index; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX users_subdomain_index ON users USING btree (subdomain);


--
-- Name: public; Type: ACL; Schema: -; Owner: simon
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM simon;
GRANT ALL ON SCHEMA public TO simon;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

