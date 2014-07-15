--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: csv_with_lat_lon; Type: TABLE; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE TABLE csv_with_lat_lon (
    mean_lateness text,
    late_count text,
    longitude text,
    latitude text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    the_geom geometry(Geometry,4326),
    cartodb_id integer NOT NULL,
    the_geom_webmercator geometry(Geometry,3857)
);


ALTER TABLE public.csv_with_lat_lon OWNER TO development_cartodb_user_1;

--
-- Name: csv_with_lat_lon_cartodb_id_seq; Type: SEQUENCE; Schema: public; Owner: development_cartodb_user_1
--

CREATE SEQUENCE csv_with_lat_lon_cartodb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.csv_with_lat_lon_cartodb_id_seq OWNER TO development_cartodb_user_1;

--
-- Name: csv_with_lat_lon_cartodb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: development_cartodb_user_1
--

ALTER SEQUENCE csv_with_lat_lon_cartodb_id_seq OWNED BY csv_with_lat_lon.cartodb_id;


--
-- Name: cartodb_id; Type: DEFAULT; Schema: public; Owner: development_cartodb_user_1
--

ALTER TABLE ONLY csv_with_lat_lon ALTER COLUMN cartodb_id SET DEFAULT nextval('csv_with_lat_lon_cartodb_id_seq'::regclass);


--
-- Data for Name: csv_with_lat_lon; Type: TABLE DATA; Schema: public; Owner: development_cartodb_user_1
--

COPY csv_with_lat_lon (mean_lateness, late_count, longitude, latitude, created_at, updated_at, the_geom, cartodb_id, the_geom_webmercator) FROM stdin;
0	0	                  16.5607329	48.1199611	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E61000008F4AFB308C8F304066A5A4E25A0F4840	1	0101000020110F000088F7845A4C213C41D232DCD53C5F5741
0	0	                  -75.96557	4.58971	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000EBFF1CE6CBFD52C0247F30F0DC5B1240	2	0101000020110F0000A53F3F12202160C1F7A1BFEEBD371F41
0	0	                  7.6493752	45.1974684	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E61000007655FBCFF5981E4029FFFFA446994640	3	0101000020110F0000F57EB31A89FC2941631D6DA62D905541
0	0	                  -58.5363498	-34.8222787	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000AB1B391CA7444DC04459AE6D406941C0	4	0101000020110F0000F4BCC42983DB58C1F41A18D775954FC1
0	0	                  -6.2443635	53.4269294	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E61000002A58E36C3AFA18C0B759619FA5B64A40	5	0101000020110F00003DB1F4BA9E3625C1E3EFE284D6F05A41
0	0	                  5.3810421	43.2976116	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000BE9877E62F86154083740C2318A64540	6	0101000020110F0000E816A7BBCD4722415505D168D16F5441
0	0	                  2.0797638	41.300621	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000CB3C03345BA30040D3BEB9BF7AA64440	7	0101000020110F00008ACD3CFAF1420C419EB9E734444A5341
0	0	                  -75.9976624	37.8250646	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000BA1C65B3D9FF52C02D0B81B79BE94240	8	0101000020110F0000881B8EA2DE2260C12A2EA7ACFD5F5141
4.166666666666666	7	                  2.5711	49.004	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000FDF675E09C9104408D976E1283804840	9	0101000020110F00003926CE2B167811410FFDCD0875F05741
0	0	                  30.808439	36.922395	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E61000009ACFB9DBF5CE3E40397F130A11764240	10	0101000020110F0000D042EDDE652A4A41FF1684CA81E45041
0	0	                  33.6112819	34.8703004	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E610000081913C7C3ECE40400DD9E500666F4140	11	0101000020110F0000F2359C64CB8B4C41FEBF76B62EA24F41
50	3	                  -43.3719988	-22.9869915	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E61000005C131CA89DAF45C013EE9579ABFC36C0	12	0101000020110F000062F18C34FD6A52C122B215C7961144C1
0	0	                  -84.208889	9.993611	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E6100000A0DFF76F5E0D55C047E4BB94BAFC2340	13	0101000020110F0000EE93995431E161C1302C3ECAD70F3141
6.779661016949152	4	                  11.7815595	48.3539793	2011-10-04 12:33:22.327	2011-10-04 12:33:29.332	0101000020E610000098C1189128902740017B96314F2D4840	14	0101000020110F000072644C341D0334416B4006EE6E855741
\.


--
-- Name: csv_with_lat_lon_cartodb_id_seq; Type: SEQUENCE SET; Schema: public; Owner: development_cartodb_user_1
--

SELECT pg_catalog.setval('csv_with_lat_lon_cartodb_id_seq', 156, false);


--
-- Name: csv_with_lat_lon_pkey; Type: CONSTRAINT; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

ALTER TABLE ONLY csv_with_lat_lon
    ADD CONSTRAINT csv_with_lat_lon_pkey PRIMARY KEY (cartodb_id);

ALTER TABLE csv_with_lat_lon CLUSTER ON csv_with_lat_lon_pkey;


--
-- Name: csv_with_lat_lon_the_geom_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX csv_with_lat_lon_the_geom_idx ON csv_with_lat_lon USING gist (the_geom);


--
-- Name: csv_with_lat_lon_the_geom_webmercator_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX csv_with_lat_lon_the_geom_webmercator_idx ON csv_with_lat_lon USING gist (the_geom_webmercator);


--
-- Name: test_quota; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER test_quota BEFORE INSERT OR UPDATE ON csv_with_lat_lon FOR EACH STATEMENT EXECUTE PROCEDURE cdb_checkquota('1', '104857600', 'public');


--
-- Name: test_quota_per_row; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER test_quota_per_row BEFORE INSERT OR UPDATE ON csv_with_lat_lon FOR EACH ROW EXECUTE PROCEDURE cdb_checkquota('0.001', '104857600', 'public');


--
-- Name: track_updates; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER track_updates AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON csv_with_lat_lon FOR EACH STATEMENT EXECUTE PROCEDURE cdb_tablemetadata_trigger();


--
-- Name: update_the_geom_webmercator_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_the_geom_webmercator_trigger BEFORE INSERT OR UPDATE OF the_geom ON csv_with_lat_lon FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();


--
-- Name: update_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_updated_at_trigger BEFORE UPDATE ON csv_with_lat_lon FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


--
-- Name: csv_with_lat_lon; Type: ACL; Schema: public; Owner: development_cartodb_user_1
--

REVOKE ALL ON TABLE csv_with_lat_lon FROM PUBLIC;
REVOKE ALL ON TABLE csv_with_lat_lon FROM development_cartodb_user_1;
GRANT ALL ON TABLE csv_with_lat_lon TO development_cartodb_user_1;
GRANT SELECT ON TABLE csv_with_lat_lon TO tileuser;
GRANT SELECT ON TABLE csv_with_lat_lon TO publicuser;


--
-- PostgreSQL database dump complete
--

