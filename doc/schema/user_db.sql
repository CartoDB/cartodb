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
-- Name: plpgsql; Type: PROCEDURAL LANGUAGE; Schema: -; Owner: postgres
--

CREATE OR REPLACE PROCEDURAL LANGUAGE plpgsql;


ALTER PROCEDURAL LANGUAGE plpgsql OWNER TO postgres;

SET search_path = public, pg_catalog;

--
-- Name: box2d; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE box2d;


--
-- Name: box2d_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box2d_in(cstring) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_in';


ALTER FUNCTION public.box2d_in(cstring) OWNER TO postgres;

--
-- Name: box2d_out(box2d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box2d_out(box2d) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_out';


ALTER FUNCTION public.box2d_out(box2d) OWNER TO postgres;

--
-- Name: box2d; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE box2d (
    INTERNALLENGTH = 16,
    INPUT = box2d_in,
    OUTPUT = box2d_out,
    ALIGNMENT = int4,
    STORAGE = plain
);


ALTER TYPE public.box2d OWNER TO postgres;

--
-- Name: box3d; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE box3d;


--
-- Name: box3d_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d_in(cstring) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_in';


ALTER FUNCTION public.box3d_in(cstring) OWNER TO postgres;

--
-- Name: box3d_out(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d_out(box3d) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_out';


ALTER FUNCTION public.box3d_out(box3d) OWNER TO postgres;

--
-- Name: box3d; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE box3d (
    INTERNALLENGTH = 48,
    INPUT = box3d_in,
    OUTPUT = box3d_out,
    ALIGNMENT = double,
    STORAGE = plain
);


ALTER TYPE public.box3d OWNER TO postgres;

--
-- Name: box3d_extent; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE box3d_extent;


--
-- Name: box3d_extent_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d_extent_in(cstring) RETURNS box3d_extent
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_in';


ALTER FUNCTION public.box3d_extent_in(cstring) OWNER TO postgres;

--
-- Name: box3d_extent_out(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d_extent_out(box3d_extent) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_extent_out';


ALTER FUNCTION public.box3d_extent_out(box3d_extent) OWNER TO postgres;

--
-- Name: box3d_extent; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE box3d_extent (
    INTERNALLENGTH = 48,
    INPUT = box3d_extent_in,
    OUTPUT = box3d_extent_out,
    ALIGNMENT = double,
    STORAGE = plain
);


ALTER TYPE public.box3d_extent OWNER TO postgres;

--
-- Name: chip; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE chip;


--
-- Name: chip_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION chip_in(cstring) RETURNS chip
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_in';


ALTER FUNCTION public.chip_in(cstring) OWNER TO postgres;

--
-- Name: chip_out(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION chip_out(chip) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_out';


ALTER FUNCTION public.chip_out(chip) OWNER TO postgres;

--
-- Name: chip; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE chip (
    INTERNALLENGTH = variable,
    INPUT = chip_in,
    OUTPUT = chip_out,
    ALIGNMENT = double,
    STORAGE = extended
);


ALTER TYPE public.chip OWNER TO postgres;

--
-- Name: geography; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE geography;


--
-- Name: geography_analyze(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_analyze(internal) RETURNS boolean
    LANGUAGE c STRICT
    AS '$libdir/postgis-1.5', 'geography_analyze';


ALTER FUNCTION public.geography_analyze(internal) OWNER TO postgres;

--
-- Name: geography_in(cstring, oid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_in(cstring, oid, integer) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_in';


ALTER FUNCTION public.geography_in(cstring, oid, integer) OWNER TO postgres;

--
-- Name: geography_out(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_out(geography) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_out';


ALTER FUNCTION public.geography_out(geography) OWNER TO postgres;

--
-- Name: geography_typmod_in(cstring[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_typmod_in(cstring[]) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_typmod_in';


ALTER FUNCTION public.geography_typmod_in(cstring[]) OWNER TO postgres;

--
-- Name: geography_typmod_out(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_typmod_out(integer) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_typmod_out';


ALTER FUNCTION public.geography_typmod_out(integer) OWNER TO postgres;

--
-- Name: geography; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE geography (
    INTERNALLENGTH = variable,
    INPUT = geography_in,
    OUTPUT = geography_out,
    TYPMOD_IN = geography_typmod_in,
    TYPMOD_OUT = geography_typmod_out,
    ANALYZE = geography_analyze,
    ALIGNMENT = double,
    STORAGE = main
);


ALTER TYPE public.geography OWNER TO postgres;

--
-- Name: geometry; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE geometry;


--
-- Name: geometry_analyze(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_analyze(internal) RETURNS boolean
    LANGUAGE c STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_analyze';


ALTER FUNCTION public.geometry_analyze(internal) OWNER TO postgres;

--
-- Name: geometry_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_in(cstring) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_in';


ALTER FUNCTION public.geometry_in(cstring) OWNER TO postgres;

--
-- Name: geometry_out(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_out(geometry) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_out';


ALTER FUNCTION public.geometry_out(geometry) OWNER TO postgres;

--
-- Name: geometry_recv(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_recv(internal) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_recv';


ALTER FUNCTION public.geometry_recv(internal) OWNER TO postgres;

--
-- Name: geometry_send(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_send(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_send';


ALTER FUNCTION public.geometry_send(geometry) OWNER TO postgres;

--
-- Name: geometry; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE geometry (
    INTERNALLENGTH = variable,
    INPUT = geometry_in,
    OUTPUT = geometry_out,
    RECEIVE = geometry_recv,
    SEND = geometry_send,
    ANALYZE = geometry_analyze,
    DELIMITER = ':',
    ALIGNMENT = int4,
    STORAGE = main
);


ALTER TYPE public.geometry OWNER TO postgres;

--
-- Name: geometry_dump; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE geometry_dump AS (
	path integer[],
	geom geometry
);


ALTER TYPE public.geometry_dump OWNER TO postgres;

--
-- Name: gidx; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE gidx;


--
-- Name: gidx_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION gidx_in(cstring) RETURNS gidx
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'gidx_in';


ALTER FUNCTION public.gidx_in(cstring) OWNER TO postgres;

--
-- Name: gidx_out(gidx); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION gidx_out(gidx) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'gidx_out';


ALTER FUNCTION public.gidx_out(gidx) OWNER TO postgres;

--
-- Name: gidx; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE gidx (
    INTERNALLENGTH = variable,
    INPUT = gidx_in,
    OUTPUT = gidx_out,
    ALIGNMENT = double,
    STORAGE = plain
);


ALTER TYPE public.gidx OWNER TO postgres;

--
-- Name: pgis_abs; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE pgis_abs;


--
-- Name: pgis_abs_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_abs_in(cstring) RETURNS pgis_abs
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'pgis_abs_in';


ALTER FUNCTION public.pgis_abs_in(cstring) OWNER TO postgres;

--
-- Name: pgis_abs_out(pgis_abs); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_abs_out(pgis_abs) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'pgis_abs_out';


ALTER FUNCTION public.pgis_abs_out(pgis_abs) OWNER TO postgres;

--
-- Name: pgis_abs; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE pgis_abs (
    INTERNALLENGTH = 8,
    INPUT = pgis_abs_in,
    OUTPUT = pgis_abs_out,
    ALIGNMENT = double,
    STORAGE = plain
);


ALTER TYPE public.pgis_abs OWNER TO postgres;

--
-- Name: spheroid; Type: SHELL TYPE; Schema: public; Owner: postgres
--

CREATE TYPE spheroid;


--
-- Name: spheroid_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION spheroid_in(cstring) RETURNS spheroid
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ellipsoid_in';


ALTER FUNCTION public.spheroid_in(cstring) OWNER TO postgres;

--
-- Name: spheroid_out(spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION spheroid_out(spheroid) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ellipsoid_out';


ALTER FUNCTION public.spheroid_out(spheroid) OWNER TO postgres;

--
-- Name: spheroid; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE spheroid (
    INTERNALLENGTH = 65,
    INPUT = spheroid_in,
    OUTPUT = spheroid_out,
    ALIGNMENT = double,
    STORAGE = plain
);


ALTER TYPE public.spheroid OWNER TO postgres;

--
-- Name: _st_asgeojson(integer, geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_asgeojson(integer, geometry, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asGeoJson';


ALTER FUNCTION public._st_asgeojson(integer, geometry, integer, integer) OWNER TO postgres;

--
-- Name: _st_asgeojson(integer, geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_asgeojson(integer, geography, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_geojson';


ALTER FUNCTION public._st_asgeojson(integer, geography, integer, integer) OWNER TO postgres;

--
-- Name: _st_asgml(integer, geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_asgml(integer, geometry, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asGML';


ALTER FUNCTION public._st_asgml(integer, geometry, integer, integer) OWNER TO postgres;

--
-- Name: _st_asgml(integer, geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_asgml(integer, geography, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_gml';


ALTER FUNCTION public._st_asgml(integer, geography, integer, integer) OWNER TO postgres;

--
-- Name: _st_askml(integer, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_askml(integer, geometry, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asKML';


ALTER FUNCTION public._st_askml(integer, geometry, integer) OWNER TO postgres;

--
-- Name: _st_askml(integer, geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_askml(integer, geography, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_kml';


ALTER FUNCTION public._st_askml(integer, geography, integer) OWNER TO postgres;

--
-- Name: _st_bestsrid(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_bestsrid(geography) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_BestSRID($1,$1)$_$;


ALTER FUNCTION public._st_bestsrid(geography) OWNER TO postgres;

--
-- Name: _st_bestsrid(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_bestsrid(geography, geography) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_bestsrid';


ALTER FUNCTION public._st_bestsrid(geography, geography) OWNER TO postgres;

--
-- Name: _st_buffer(geometry, double precision, cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_buffer(geometry, double precision, cstring) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'buffer';


ALTER FUNCTION public._st_buffer(geometry, double precision, cstring) OWNER TO postgres;

--
-- Name: _st_contains(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_contains(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'contains';


ALTER FUNCTION public._st_contains(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_containsproperly(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_containsproperly(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'containsproperly';


ALTER FUNCTION public._st_containsproperly(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_coveredby(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_coveredby(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'coveredby';


ALTER FUNCTION public._st_coveredby(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_covers(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_covers(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'covers';


ALTER FUNCTION public._st_covers(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_covers(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_covers(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'geography_covers';


ALTER FUNCTION public._st_covers(geography, geography) OWNER TO postgres;

--
-- Name: _st_crosses(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_crosses(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'crosses';


ALTER FUNCTION public._st_crosses(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_dfullywithin(geometry, geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_dfullywithin(geometry, geometry, double precision) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dfullywithin';


ALTER FUNCTION public._st_dfullywithin(geometry, geometry, double precision) OWNER TO postgres;

--
-- Name: _st_distance(geography, geography, double precision, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_distance(geography, geography, double precision, boolean) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'geography_distance';


ALTER FUNCTION public._st_distance(geography, geography, double precision, boolean) OWNER TO postgres;

--
-- Name: _st_dumppoints(geometry, integer[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_dumppoints(the_geom geometry, cur_path integer[]) RETURNS SETOF geometry_dump
    LANGUAGE plpgsql
    AS $$
DECLARE
  tmp geometry_dump;
  tmp2 geometry_dump;
  nb_points integer;
  nb_geom integer;
  i integer;
  j integer;
  g geometry;
  
BEGIN
  
  RAISE DEBUG '%,%', cur_path, ST_GeometryType(the_geom);

  -- Special case (MULTI* OR GEOMETRYCOLLECTION) : iterate and return the DumpPoints of the geometries
  SELECT ST_NumGeometries(the_geom) INTO nb_geom;

  IF (nb_geom IS NOT NULL) THEN
    
    i = 1;
    FOR tmp2 IN SELECT (ST_Dump(the_geom)).* LOOP

      FOR tmp IN SELECT * FROM _ST_DumpPoints(tmp2.geom, cur_path || tmp2.path) LOOP
	    RETURN NEXT tmp;
      END LOOP;
      i = i + 1;
      
    END LOOP;

    RETURN;
  END IF;
  

  -- Special case (POLYGON) : return the points of the rings of a polygon
  IF (ST_GeometryType(the_geom) = 'ST_Polygon') THEN

    FOR tmp IN SELECT * FROM _ST_DumpPoints(ST_ExteriorRing(the_geom), cur_path || ARRAY[1]) LOOP
      RETURN NEXT tmp;
    END LOOP;
    
    j := ST_NumInteriorRings(the_geom);
    FOR i IN 1..j LOOP
        FOR tmp IN SELECT * FROM _ST_DumpPoints(ST_InteriorRingN(the_geom, i), cur_path || ARRAY[i+1]) LOOP
          RETURN NEXT tmp;
        END LOOP;
    END LOOP;
    
    RETURN;
  END IF;

    
  -- Special case (POINT) : return the point
  IF (ST_GeometryType(the_geom) = 'ST_Point') THEN

    tmp.path = cur_path || ARRAY[1];
    tmp.geom = the_geom;

    RETURN NEXT tmp;
    RETURN;

  END IF;


  -- Use ST_NumPoints rather than ST_NPoints to have a NULL value if the_geom isn't
  -- a LINESTRING or CIRCULARSTRING.
  SELECT ST_NumPoints(the_geom) INTO nb_points;

  -- This should never happen
  IF (nb_points IS NULL) THEN
    RAISE EXCEPTION 'Unexpected error while dumping geometry %', ST_AsText(the_geom);
  END IF;

  FOR i IN 1..nb_points LOOP
    tmp.path = cur_path || ARRAY[i];
    tmp.geom := ST_PointN(the_geom, i);
    RETURN NEXT tmp;
  END LOOP;
   
END
$$;


ALTER FUNCTION public._st_dumppoints(the_geom geometry, cur_path integer[]) OWNER TO postgres;

--
-- Name: _st_dwithin(geometry, geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_dwithin(geometry, geometry, double precision) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_dwithin';


ALTER FUNCTION public._st_dwithin(geometry, geometry, double precision) OWNER TO postgres;

--
-- Name: _st_dwithin(geography, geography, double precision, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_dwithin(geography, geography, double precision, boolean) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'geography_dwithin';


ALTER FUNCTION public._st_dwithin(geography, geography, double precision, boolean) OWNER TO postgres;

--
-- Name: _st_equals(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_equals(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'geomequals';


ALTER FUNCTION public._st_equals(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_expand(geography, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_expand(geography, double precision) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_expand';


ALTER FUNCTION public._st_expand(geography, double precision) OWNER TO postgres;

--
-- Name: _st_intersects(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_intersects(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'intersects';


ALTER FUNCTION public._st_intersects(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_linecrossingdirection(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_linecrossingdirection(geometry, geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'ST_LineCrossingDirection';


ALTER FUNCTION public._st_linecrossingdirection(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_longestline(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_longestline(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_longestline2d';


ALTER FUNCTION public._st_longestline(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_maxdistance(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_maxdistance(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_maxdistance2d_linestring';


ALTER FUNCTION public._st_maxdistance(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_orderingequals(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_orderingequals(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_same';


ALTER FUNCTION public._st_orderingequals(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_overlaps(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_overlaps(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'overlaps';


ALTER FUNCTION public._st_overlaps(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_pointoutside(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_pointoutside(geography) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_point_outside';


ALTER FUNCTION public._st_pointoutside(geography) OWNER TO postgres;

--
-- Name: _st_touches(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_touches(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'touches';


ALTER FUNCTION public._st_touches(geometry, geometry) OWNER TO postgres;

--
-- Name: _st_within(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _st_within(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'within';


ALTER FUNCTION public._st_within(geometry, geometry) OWNER TO postgres;

--
-- Name: addauth(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addauth(text) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$ 
DECLARE
	lockid alias for $1;
	okay boolean;
	myrec record;
BEGIN
	-- check to see if table exists
	--  if not, CREATE TEMP TABLE mylock (transid xid, lockcode text)
	okay := 'f';
	FOR myrec IN SELECT * FROM pg_class WHERE relname = 'temp_lock_have_table' LOOP
		okay := 't';
	END LOOP; 
	IF (okay <> 't') THEN 
		CREATE TEMP TABLE temp_lock_have_table (transid xid, lockcode text);
			-- this will only work from pgsql7.4 up
			-- ON COMMIT DELETE ROWS;
	END IF;

	--  INSERT INTO mylock VALUES ( $1)
--	EXECUTE 'INSERT INTO temp_lock_have_table VALUES ( '||
--		quote_literal(getTransactionID()) || ',' ||
--		quote_literal(lockid) ||')';

	INSERT INTO temp_lock_have_table VALUES (getTransactionID(), lockid);

	RETURN true::boolean;
END;
$_$;


ALTER FUNCTION public.addauth(text) OWNER TO postgres;

--
-- Name: addbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addbbox(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_addBBOX';


ALTER FUNCTION public.addbbox(geometry) OWNER TO postgres;

--
-- Name: addgeometrycolumn(character varying, character varying, integer, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addgeometrycolumn(character varying, character varying, integer, character varying, integer) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	ret  text;
BEGIN
	SELECT AddGeometryColumn('','',$1,$2,$3,$4,$5) into ret;
	RETURN ret;
END;
$_$;


ALTER FUNCTION public.addgeometrycolumn(character varying, character varying, integer, character varying, integer) OWNER TO postgres;

--
-- Name: addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) RETURNS text
    LANGUAGE plpgsql STABLE STRICT
    AS $_$
DECLARE
	ret  text;
BEGIN
	SELECT AddGeometryColumn('',$1,$2,$3,$4,$5,$6) into ret;
	RETURN ret;
END;
$_$;


ALTER FUNCTION public.addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) OWNER TO postgres;

--
-- Name: addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	catalog_name alias for $1;
	schema_name alias for $2;
	table_name alias for $3;
	column_name alias for $4;
	new_srid alias for $5;
	new_type alias for $6;
	new_dim alias for $7;
	rec RECORD;
	sr varchar;
	real_schema name;
	sql text;

BEGIN

	-- Verify geometry type
	IF ( NOT ( (new_type = 'GEOMETRY') OR
			   (new_type = 'GEOMETRYCOLLECTION') OR
			   (new_type = 'POINT') OR
			   (new_type = 'MULTIPOINT') OR
			   (new_type = 'POLYGON') OR
			   (new_type = 'MULTIPOLYGON') OR
			   (new_type = 'LINESTRING') OR
			   (new_type = 'MULTILINESTRING') OR
			   (new_type = 'GEOMETRYCOLLECTIONM') OR
			   (new_type = 'POINTM') OR
			   (new_type = 'MULTIPOINTM') OR
			   (new_type = 'POLYGONM') OR
			   (new_type = 'MULTIPOLYGONM') OR
			   (new_type = 'LINESTRINGM') OR
			   (new_type = 'MULTILINESTRINGM') OR
			   (new_type = 'CIRCULARSTRING') OR
			   (new_type = 'CIRCULARSTRINGM') OR
			   (new_type = 'COMPOUNDCURVE') OR
			   (new_type = 'COMPOUNDCURVEM') OR
			   (new_type = 'CURVEPOLYGON') OR
			   (new_type = 'CURVEPOLYGONM') OR
			   (new_type = 'MULTICURVE') OR
			   (new_type = 'MULTICURVEM') OR
			   (new_type = 'MULTISURFACE') OR
			   (new_type = 'MULTISURFACEM')) )
	THEN
		RAISE EXCEPTION 'Invalid type name - valid ones are:
	POINT, MULTIPOINT,
	LINESTRING, MULTILINESTRING,
	POLYGON, MULTIPOLYGON,
	CIRCULARSTRING, COMPOUNDCURVE, MULTICURVE,
	CURVEPOLYGON, MULTISURFACE,
	GEOMETRY, GEOMETRYCOLLECTION,
	POINTM, MULTIPOINTM,
	LINESTRINGM, MULTILINESTRINGM,
	POLYGONM, MULTIPOLYGONM,
	CIRCULARSTRINGM, COMPOUNDCURVEM, MULTICURVEM
	CURVEPOLYGONM, MULTISURFACEM,
	or GEOMETRYCOLLECTIONM';
		RETURN 'fail';
	END IF;


	-- Verify dimension
	IF ( (new_dim >4) OR (new_dim <0) ) THEN
		RAISE EXCEPTION 'invalid dimension';
		RETURN 'fail';
	END IF;

	IF ( (new_type LIKE '%M') AND (new_dim!=3) ) THEN
		RAISE EXCEPTION 'TypeM needs 3 dimensions';
		RETURN 'fail';
	END IF;


	-- Verify SRID
	IF ( new_srid != -1 ) THEN
		SELECT SRID INTO sr FROM spatial_ref_sys WHERE SRID = new_srid;
		IF NOT FOUND THEN
			RAISE EXCEPTION 'AddGeometryColumns() - invalid SRID';
			RETURN 'fail';
		END IF;
	END IF;


	-- Verify schema
	IF ( schema_name IS NOT NULL AND schema_name != '' ) THEN
		sql := 'SELECT nspname FROM pg_namespace ' ||
			'WHERE text(nspname) = ' || quote_literal(schema_name) ||
			'LIMIT 1';
		RAISE DEBUG '%', sql;
		EXECUTE sql INTO real_schema;

		IF ( real_schema IS NULL ) THEN
			RAISE EXCEPTION 'Schema % is not a valid schemaname', quote_literal(schema_name);
			RETURN 'fail';
		END IF;
	END IF;

	IF ( real_schema IS NULL ) THEN
		RAISE DEBUG 'Detecting schema';
		sql := 'SELECT n.nspname AS schemaname ' ||
			'FROM pg_catalog.pg_class c ' ||
			  'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace ' ||
			'WHERE c.relkind = ' || quote_literal('r') ||
			' AND n.nspname NOT IN (' || quote_literal('pg_catalog') || ', ' || quote_literal('pg_toast') || ')' ||
			' AND pg_catalog.pg_table_is_visible(c.oid)' ||
			' AND c.relname = ' || quote_literal(table_name);
		RAISE DEBUG '%', sql;
		EXECUTE sql INTO real_schema;

		IF ( real_schema IS NULL ) THEN
			RAISE EXCEPTION 'Table % does not occur in the search_path', quote_literal(table_name);
			RETURN 'fail';
		END IF;
	END IF;


	-- Add geometry column to table
	sql := 'ALTER TABLE ' ||
		quote_ident(real_schema) || '.' || quote_ident(table_name)
		|| ' ADD COLUMN ' || quote_ident(column_name) ||
		' geometry ';
	RAISE DEBUG '%', sql;
	EXECUTE sql;


	-- Delete stale record in geometry_columns (if any)
	sql := 'DELETE FROM geometry_columns WHERE
		f_table_catalog = ' || quote_literal('') ||
		' AND f_table_schema = ' ||
		quote_literal(real_schema) ||
		' AND f_table_name = ' || quote_literal(table_name) ||
		' AND f_geometry_column = ' || quote_literal(column_name);
	RAISE DEBUG '%', sql;
	EXECUTE sql;


	-- Add record in geometry_columns
	sql := 'INSERT INTO geometry_columns (f_table_catalog,f_table_schema,f_table_name,' ||
										  'f_geometry_column,coord_dimension,srid,type)' ||
		' VALUES (' ||
		quote_literal('') || ',' ||
		quote_literal(real_schema) || ',' ||
		quote_literal(table_name) || ',' ||
		quote_literal(column_name) || ',' ||
		new_dim::text || ',' ||
		new_srid::text || ',' ||
		quote_literal(new_type) || ')';
	RAISE DEBUG '%', sql;
	EXECUTE sql;


	-- Add table CHECKs
	sql := 'ALTER TABLE ' ||
		quote_ident(real_schema) || '.' || quote_ident(table_name)
		|| ' ADD CONSTRAINT '
		|| quote_ident('enforce_srid_' || column_name)
		|| ' CHECK (ST_SRID(' || quote_ident(column_name) ||
		') = ' || new_srid::text || ')' ;
	RAISE DEBUG '%', sql;
	EXECUTE sql;

	sql := 'ALTER TABLE ' ||
		quote_ident(real_schema) || '.' || quote_ident(table_name)
		|| ' ADD CONSTRAINT '
		|| quote_ident('enforce_dims_' || column_name)
		|| ' CHECK (ST_NDims(' || quote_ident(column_name) ||
		') = ' || new_dim::text || ')' ;
	RAISE DEBUG '%', sql;
	EXECUTE sql;

	IF ( NOT (new_type = 'GEOMETRY')) THEN
		sql := 'ALTER TABLE ' ||
			quote_ident(real_schema) || '.' || quote_ident(table_name) || ' ADD CONSTRAINT ' ||
			quote_ident('enforce_geotype_' || column_name) ||
			' CHECK (GeometryType(' ||
			quote_ident(column_name) || ')=' ||
			quote_literal(new_type) || ' OR (' ||
			quote_ident(column_name) || ') is null)';
		RAISE DEBUG '%', sql;
		EXECUTE sql;
	END IF;

	RETURN
		real_schema || '.' ||
		table_name || '.' || column_name ||
		' SRID:' || new_srid::text ||
		' TYPE:' || new_type ||
		' DIMS:' || new_dim::text || ' ';
END;
$_$;


ALTER FUNCTION public.addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) OWNER TO postgres;

--
-- Name: addpoint(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addpoint(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_addpoint';


ALTER FUNCTION public.addpoint(geometry, geometry) OWNER TO postgres;

--
-- Name: addpoint(geometry, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION addpoint(geometry, geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_addpoint';


ALTER FUNCTION public.addpoint(geometry, geometry, integer) OWNER TO postgres;

--
-- Name: affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  $2, $3, 0,  $4, $5, 0,  0, 0, 1,  $6, $7, 0)$_$;


ALTER FUNCTION public.affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_affine';


ALTER FUNCTION public.affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: area(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION area(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_area_polygon';


ALTER FUNCTION public.area(geometry) OWNER TO postgres;

--
-- Name: area2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION area2d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_area_polygon';


ALTER FUNCTION public.area2d(geometry) OWNER TO postgres;

--
-- Name: asbinary(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asbinary(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asBinary';


ALTER FUNCTION public.asbinary(geometry) OWNER TO postgres;

--
-- Name: asbinary(geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asbinary(geometry, text) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asBinary';


ALTER FUNCTION public.asbinary(geometry, text) OWNER TO postgres;

--
-- Name: asewkb(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asewkb(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'WKBFromLWGEOM';


ALTER FUNCTION public.asewkb(geometry) OWNER TO postgres;

--
-- Name: asewkb(geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asewkb(geometry, text) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'WKBFromLWGEOM';


ALTER FUNCTION public.asewkb(geometry, text) OWNER TO postgres;

--
-- Name: asewkt(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asewkt(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asEWKT';


ALTER FUNCTION public.asewkt(geometry) OWNER TO postgres;

--
-- Name: asgml(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asgml(geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, 15, 0)$_$;


ALTER FUNCTION public.asgml(geometry) OWNER TO postgres;

--
-- Name: asgml(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION asgml(geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, $2, 0)$_$;


ALTER FUNCTION public.asgml(geometry, integer) OWNER TO postgres;

--
-- Name: ashexewkb(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION ashexewkb(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asHEXEWKB';


ALTER FUNCTION public.ashexewkb(geometry) OWNER TO postgres;

--
-- Name: ashexewkb(geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION ashexewkb(geometry, text) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asHEXEWKB';


ALTER FUNCTION public.ashexewkb(geometry, text) OWNER TO postgres;

--
-- Name: askml(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION askml(geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML(2, transform($1,4326), 15)$_$;


ALTER FUNCTION public.askml(geometry) OWNER TO postgres;

--
-- Name: askml(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION askml(geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML(2, transform($1,4326), $2)$_$;


ALTER FUNCTION public.askml(geometry, integer) OWNER TO postgres;

--
-- Name: askml(integer, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION askml(integer, geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML($1, transform($2,4326), $3)$_$;


ALTER FUNCTION public.askml(integer, geometry, integer) OWNER TO postgres;

--
-- Name: assvg(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION assvg(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'assvg_geometry';


ALTER FUNCTION public.assvg(geometry) OWNER TO postgres;

--
-- Name: assvg(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION assvg(geometry, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'assvg_geometry';


ALTER FUNCTION public.assvg(geometry, integer) OWNER TO postgres;

--
-- Name: assvg(geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION assvg(geometry, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'assvg_geometry';


ALTER FUNCTION public.assvg(geometry, integer, integer) OWNER TO postgres;

--
-- Name: astext(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION astext(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asText';


ALTER FUNCTION public.astext(geometry) OWNER TO postgres;

--
-- Name: azimuth(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION azimuth(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_azimuth';


ALTER FUNCTION public.azimuth(geometry, geometry) OWNER TO postgres;

--
-- Name: bdmpolyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION bdmpolyfromtext(text, integer) RETURNS geometry
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	geomtext alias for $1;
	srid alias for $2;
	mline geometry;
	geom geometry;
BEGIN
	mline := MultiLineStringFromText(geomtext, srid);

	IF mline IS NULL
	THEN
		RAISE EXCEPTION 'Input is not a MultiLinestring';
	END IF;

	geom := multi(BuildArea(mline));

	RETURN geom;
END;
$_$;


ALTER FUNCTION public.bdmpolyfromtext(text, integer) OWNER TO postgres;

--
-- Name: bdpolyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION bdpolyfromtext(text, integer) RETURNS geometry
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	geomtext alias for $1;
	srid alias for $2;
	mline geometry;
	geom geometry;
BEGIN
	mline := MultiLineStringFromText(geomtext, srid);

	IF mline IS NULL
	THEN
		RAISE EXCEPTION 'Input is not a MultiLinestring';
	END IF;

	geom := BuildArea(mline);

	IF GeometryType(geom) != 'POLYGON'
	THEN
		RAISE EXCEPTION 'Input returns more then a single polygon, try using BdMPolyFromText instead';
	END IF;

	RETURN geom;
END;
$_$;


ALTER FUNCTION public.bdpolyfromtext(text, integer) OWNER TO postgres;

--
-- Name: boundary(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION boundary(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'boundary';


ALTER FUNCTION public.boundary(geometry) OWNER TO postgres;

--
-- Name: box(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box(geometry) RETURNS box
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX';


ALTER FUNCTION public.box(geometry) OWNER TO postgres;

--
-- Name: box(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box(box3d) RETURNS box
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_BOX';


ALTER FUNCTION public.box(box3d) OWNER TO postgres;

--
-- Name: box2d(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box2d(box3d_extent) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_BOX2DFLOAT4';


ALTER FUNCTION public.box2d(box3d_extent) OWNER TO postgres;

--
-- Name: box2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box2d(geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX2DFLOAT4';


ALTER FUNCTION public.box2d(geometry) OWNER TO postgres;

--
-- Name: box2d(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box2d(box3d) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_BOX2DFLOAT4';


ALTER FUNCTION public.box2d(box3d) OWNER TO postgres;

--
-- Name: box3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d(geometry) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX3D';


ALTER FUNCTION public.box3d(geometry) OWNER TO postgres;

--
-- Name: box3d(box2d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d(box2d) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_to_BOX3D';


ALTER FUNCTION public.box3d(box2d) OWNER TO postgres;

--
-- Name: box3d_extent(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3d_extent(box3d_extent) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_extent_to_BOX3D';


ALTER FUNCTION public.box3d_extent(box3d_extent) OWNER TO postgres;

--
-- Name: box3dtobox(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION box3dtobox(box3d) RETURNS box
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT box($1)$_$;


ALTER FUNCTION public.box3dtobox(box3d) OWNER TO postgres;

--
-- Name: buffer(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION buffer(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'buffer';


ALTER FUNCTION public.buffer(geometry, double precision) OWNER TO postgres;

--
-- Name: buffer(geometry, double precision, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION buffer(geometry, double precision, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_Buffer($1, $2, $3)$_$;


ALTER FUNCTION public.buffer(geometry, double precision, integer) OWNER TO postgres;

--
-- Name: buildarea(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION buildarea(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_buildarea';


ALTER FUNCTION public.buildarea(geometry) OWNER TO postgres;

--
-- Name: bytea(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION bytea(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_bytea';


ALTER FUNCTION public.bytea(geometry) OWNER TO postgres;

--
-- Name: centroid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION centroid(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'centroid';


ALTER FUNCTION public.centroid(geometry) OWNER TO postgres;

--
-- Name: checkauth(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION checkauth(text, text) RETURNS integer
    LANGUAGE sql
    AS $_$ SELECT CheckAuth('', $1, $2) $_$;


ALTER FUNCTION public.checkauth(text, text) OWNER TO postgres;

--
-- Name: checkauth(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION checkauth(text, text, text) RETURNS integer
    LANGUAGE plpgsql
    AS $_$ 
DECLARE
	schema text;
BEGIN
	IF NOT LongTransactionsEnabled() THEN
		RAISE EXCEPTION 'Long transaction support disabled, use EnableLongTransaction() to enable.';
	END IF;

	if ( $1 != '' ) THEN
		schema = $1;
	ELSE
		SELECT current_schema() into schema;
	END IF;

	-- TODO: check for an already existing trigger ?

	EXECUTE 'CREATE TRIGGER check_auth BEFORE UPDATE OR DELETE ON ' 
		|| quote_ident(schema) || '.' || quote_ident($2)
		||' FOR EACH ROW EXECUTE PROCEDURE CheckAuthTrigger('
		|| quote_literal($3) || ')';

	RETURN 0;
END;
$_$;


ALTER FUNCTION public.checkauth(text, text, text) OWNER TO postgres;

--
-- Name: checkauthtrigger(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION checkauthtrigger() RETURNS trigger
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'check_authorization';


ALTER FUNCTION public.checkauthtrigger() OWNER TO postgres;

--
-- Name: collect(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION collect(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'LWGEOM_collect';


ALTER FUNCTION public.collect(geometry, geometry) OWNER TO postgres;

--
-- Name: combine_bbox(box2d, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION combine_bbox(box2d, geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_combine';


ALTER FUNCTION public.combine_bbox(box2d, geometry) OWNER TO postgres;

--
-- Name: combine_bbox(box3d_extent, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION combine_bbox(box3d_extent, geometry) RETURNS box3d_extent
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'BOX3D_combine';


ALTER FUNCTION public.combine_bbox(box3d_extent, geometry) OWNER TO postgres;

--
-- Name: combine_bbox(box3d, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION combine_bbox(box3d, geometry) RETURNS box3d
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'BOX3D_combine';


ALTER FUNCTION public.combine_bbox(box3d, geometry) OWNER TO postgres;

--
-- Name: compression(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION compression(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getCompression';


ALTER FUNCTION public.compression(chip) OWNER TO postgres;

--
-- Name: contains(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION contains(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'contains';


ALTER FUNCTION public.contains(geometry, geometry) OWNER TO postgres;

--
-- Name: convexhull(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION convexhull(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'convexhull';


ALTER FUNCTION public.convexhull(geometry) OWNER TO postgres;

--
-- Name: crosses(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION crosses(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'crosses';


ALTER FUNCTION public.crosses(geometry, geometry) OWNER TO postgres;

--
-- Name: datatype(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION datatype(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getDatatype';


ALTER FUNCTION public.datatype(chip) OWNER TO postgres;

--
-- Name: difference(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION difference(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'difference';


ALTER FUNCTION public.difference(geometry, geometry) OWNER TO postgres;

--
-- Name: dimension(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dimension(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dimension';


ALTER FUNCTION public.dimension(geometry) OWNER TO postgres;

--
-- Name: disablelongtransactions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION disablelongtransactions() RETURNS text
    LANGUAGE plpgsql
    AS $$ 
DECLARE
	rec RECORD;

BEGIN

	--
	-- Drop all triggers applied by CheckAuth()
	--
	FOR rec IN
		SELECT c.relname, t.tgname, t.tgargs FROM pg_trigger t, pg_class c, pg_proc p
		WHERE p.proname = 'checkauthtrigger' and t.tgfoid = p.oid and t.tgrelid = c.oid
	LOOP
		EXECUTE 'DROP TRIGGER ' || quote_ident(rec.tgname) ||
			' ON ' || quote_ident(rec.relname);
	END LOOP;

	--
	-- Drop the authorization_table table
	--
	FOR rec IN SELECT * FROM pg_class WHERE relname = 'authorization_table' LOOP
		DROP TABLE authorization_table;
	END LOOP;

	--
	-- Drop the authorized_tables view
	--
	FOR rec IN SELECT * FROM pg_class WHERE relname = 'authorized_tables' LOOP
		DROP VIEW authorized_tables;
	END LOOP;

	RETURN 'Long transactions support disabled';
END;
$$;


ALTER FUNCTION public.disablelongtransactions() OWNER TO postgres;

--
-- Name: disjoint(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION disjoint(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'disjoint';


ALTER FUNCTION public.disjoint(geometry, geometry) OWNER TO postgres;

--
-- Name: distance(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION distance(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_mindistance2d';


ALTER FUNCTION public.distance(geometry, geometry) OWNER TO postgres;

--
-- Name: distance_sphere(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION distance_sphere(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_distance_sphere';


ALTER FUNCTION public.distance_sphere(geometry, geometry) OWNER TO postgres;

--
-- Name: distance_spheroid(geometry, geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION distance_spheroid(geometry, geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_distance_ellipsoid';


ALTER FUNCTION public.distance_spheroid(geometry, geometry, spheroid) OWNER TO postgres;

--
-- Name: dropbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropbbox(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dropBBOX';


ALTER FUNCTION public.dropbbox(geometry) OWNER TO postgres;

--
-- Name: dropgeometrycolumn(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropgeometrycolumn(character varying, character varying) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	ret text;
BEGIN
	SELECT DropGeometryColumn('','',$1,$2) into ret;
	RETURN ret;
END;
$_$;


ALTER FUNCTION public.dropgeometrycolumn(character varying, character varying) OWNER TO postgres;

--
-- Name: dropgeometrycolumn(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropgeometrycolumn(character varying, character varying, character varying) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	ret text;
BEGIN
	SELECT DropGeometryColumn('',$1,$2,$3) into ret;
	RETURN ret;
END;
$_$;


ALTER FUNCTION public.dropgeometrycolumn(character varying, character varying, character varying) OWNER TO postgres;

--
-- Name: dropgeometrycolumn(character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropgeometrycolumn(character varying, character varying, character varying, character varying) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	catalog_name alias for $1;
	schema_name alias for $2;
	table_name alias for $3;
	column_name alias for $4;
	myrec RECORD;
	okay boolean;
	real_schema name;

BEGIN


	-- Find, check or fix schema_name
	IF ( schema_name != '' ) THEN
		okay = 'f';

		FOR myrec IN SELECT nspname FROM pg_namespace WHERE text(nspname) = schema_name LOOP
			okay := 't';
		END LOOP;

		IF ( okay <> 't' ) THEN
			RAISE NOTICE 'Invalid schema name - using current_schema()';
			SELECT current_schema() into real_schema;
		ELSE
			real_schema = schema_name;
		END IF;
	ELSE
		SELECT current_schema() into real_schema;
	END IF;

	-- Find out if the column is in the geometry_columns table
	okay = 'f';
	FOR myrec IN SELECT * from geometry_columns where f_table_schema = text(real_schema) and f_table_name = table_name and f_geometry_column = column_name LOOP
		okay := 't';
	END LOOP;
	IF (okay <> 't') THEN
		RAISE EXCEPTION 'column not found in geometry_columns table';
		RETURN 'f';
	END IF;

	-- Remove ref from geometry_columns table
	EXECUTE 'delete from geometry_columns where f_table_schema = ' ||
		quote_literal(real_schema) || ' and f_table_name = ' ||
		quote_literal(table_name)  || ' and f_geometry_column = ' ||
		quote_literal(column_name);

	-- Remove table column
	EXECUTE 'ALTER TABLE ' || quote_ident(real_schema) || '.' ||
		quote_ident(table_name) || ' DROP COLUMN ' ||
		quote_ident(column_name);

	RETURN real_schema || '.' || table_name || '.' || column_name ||' effectively removed.';

END;
$_$;


ALTER FUNCTION public.dropgeometrycolumn(character varying, character varying, character varying, character varying) OWNER TO postgres;

--
-- Name: dropgeometrytable(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropgeometrytable(character varying) RETURNS text
    LANGUAGE sql STRICT
    AS $_$ SELECT DropGeometryTable('','',$1) $_$;


ALTER FUNCTION public.dropgeometrytable(character varying) OWNER TO postgres;

--
-- Name: dropgeometrytable(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropgeometrytable(character varying, character varying) RETURNS text
    LANGUAGE sql STRICT
    AS $_$ SELECT DropGeometryTable('',$1,$2) $_$;


ALTER FUNCTION public.dropgeometrytable(character varying, character varying) OWNER TO postgres;

--
-- Name: dropgeometrytable(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dropgeometrytable(character varying, character varying, character varying) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	catalog_name alias for $1;
	schema_name alias for $2;
	table_name alias for $3;
	real_schema name;

BEGIN

	IF ( schema_name = '' ) THEN
		SELECT current_schema() into real_schema;
	ELSE
		real_schema = schema_name;
	END IF;

	-- Remove refs from geometry_columns table
	EXECUTE 'DELETE FROM geometry_columns WHERE ' ||
		'f_table_schema = ' || quote_literal(real_schema) ||
		' AND ' ||
		' f_table_name = ' || quote_literal(table_name);

	-- Remove table
	EXECUTE 'DROP TABLE '
		|| quote_ident(real_schema) || '.' ||
		quote_ident(table_name);

	RETURN
		real_schema || '.' ||
		table_name ||' dropped.';

END;
$_$;


ALTER FUNCTION public.dropgeometrytable(character varying, character varying, character varying) OWNER TO postgres;

--
-- Name: dump(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dump(geometry) RETURNS SETOF geometry_dump
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dump';


ALTER FUNCTION public.dump(geometry) OWNER TO postgres;

--
-- Name: dumprings(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dumprings(geometry) RETURNS SETOF geometry_dump
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dump_rings';


ALTER FUNCTION public.dumprings(geometry) OWNER TO postgres;

--
-- Name: enablelongtransactions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION enablelongtransactions() RETURNS text
    LANGUAGE plpgsql
    AS $$ 
DECLARE
	"query" text;
	exists bool;
	rec RECORD;

BEGIN

	exists = 'f';
	FOR rec IN SELECT * FROM pg_class WHERE relname = 'authorization_table'
	LOOP
		exists = 't';
	END LOOP;

	IF NOT exists
	THEN
		"query" = 'CREATE TABLE authorization_table (
			toid oid, -- table oid
			rid text, -- row id
			expires timestamp,
			authid text
		)';
		EXECUTE "query";
	END IF;

	exists = 'f';
	FOR rec IN SELECT * FROM pg_class WHERE relname = 'authorized_tables'
	LOOP
		exists = 't';
	END LOOP;

	IF NOT exists THEN
		"query" = 'CREATE VIEW authorized_tables AS ' ||
			'SELECT ' ||
			'n.nspname as schema, ' ||
			'c.relname as table, trim(' ||
			quote_literal(chr(92) || '000') ||
			' from t.tgargs) as id_column ' ||
			'FROM pg_trigger t, pg_class c, pg_proc p ' ||
			', pg_namespace n ' ||
			'WHERE p.proname = ' || quote_literal('checkauthtrigger') ||
			' AND c.relnamespace = n.oid' ||
			' AND t.tgfoid = p.oid and t.tgrelid = c.oid';
		EXECUTE "query";
	END IF;

	RETURN 'Long transactions support enabled';
END;
$$;


ALTER FUNCTION public.enablelongtransactions() OWNER TO postgres;

--
-- Name: endpoint(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION endpoint(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_endpoint_linestring';


ALTER FUNCTION public.endpoint(geometry) OWNER TO postgres;

--
-- Name: envelope(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION envelope(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_envelope';


ALTER FUNCTION public.envelope(geometry) OWNER TO postgres;

--
-- Name: equals(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION equals(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geomequals';


ALTER FUNCTION public.equals(geometry, geometry) OWNER TO postgres;

--
-- Name: estimated_extent(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION estimated_extent(text, text) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT SECURITY DEFINER
    AS '$libdir/postgis-1.5', 'LWGEOM_estimated_extent';


ALTER FUNCTION public.estimated_extent(text, text) OWNER TO postgres;

--
-- Name: estimated_extent(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION estimated_extent(text, text, text) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT SECURITY DEFINER
    AS '$libdir/postgis-1.5', 'LWGEOM_estimated_extent';


ALTER FUNCTION public.estimated_extent(text, text, text) OWNER TO postgres;

--
-- Name: expand(box3d, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION expand(box3d, double precision) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_expand';


ALTER FUNCTION public.expand(box3d, double precision) OWNER TO postgres;

--
-- Name: expand(box2d, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION expand(box2d, double precision) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_expand';


ALTER FUNCTION public.expand(box2d, double precision) OWNER TO postgres;

--
-- Name: expand(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION expand(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_expand';


ALTER FUNCTION public.expand(geometry, double precision) OWNER TO postgres;

--
-- Name: exteriorring(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION exteriorring(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_exteriorring_polygon';


ALTER FUNCTION public.exteriorring(geometry) OWNER TO postgres;

--
-- Name: factor(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION factor(chip) RETURNS real
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getFactor';


ALTER FUNCTION public.factor(chip) OWNER TO postgres;

--
-- Name: find_extent(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION find_extent(text, text) RETURNS box2d
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	tablename alias for $1;
	columnname alias for $2;
	myrec RECORD;

BEGIN
	FOR myrec IN EXECUTE 'SELECT extent("' || columnname || '") FROM "' || tablename || '"' LOOP
		return myrec.extent;
	END LOOP;
END;
$_$;


ALTER FUNCTION public.find_extent(text, text) OWNER TO postgres;

--
-- Name: find_extent(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION find_extent(text, text, text) RETURNS box2d
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	schemaname alias for $1;
	tablename alias for $2;
	columnname alias for $3;
	myrec RECORD;

BEGIN
	FOR myrec IN EXECUTE 'SELECT extent("' || columnname || '") FROM "' || schemaname || '"."' || tablename || '"' LOOP
		return myrec.extent;
	END LOOP;
END;
$_$;


ALTER FUNCTION public.find_extent(text, text, text) OWNER TO postgres;

--
-- Name: find_srid(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION find_srid(character varying, character varying, character varying) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	schem text;
	tabl text;
	sr int4;
BEGIN
	IF $1 IS NULL THEN
	  RAISE EXCEPTION 'find_srid() - schema is NULL!';
	END IF;
	IF $2 IS NULL THEN
	  RAISE EXCEPTION 'find_srid() - table name is NULL!';
	END IF;
	IF $3 IS NULL THEN
	  RAISE EXCEPTION 'find_srid() - column name is NULL!';
	END IF;
	schem = $1;
	tabl = $2;
-- if the table contains a . and the schema is empty
-- split the table into a schema and a table
-- otherwise drop through to default behavior
	IF ( schem = '' and tabl LIKE '%.%' ) THEN
	 schem = substr(tabl,1,strpos(tabl,'.')-1);
	 tabl = substr(tabl,length(schem)+2);
	ELSE
	 schem = schem || '%';
	END IF;

	select SRID into sr from geometry_columns where f_table_schema like schem and f_table_name = tabl and f_geometry_column = $3;
	IF NOT FOUND THEN
	   RAISE EXCEPTION 'find_srid() - couldnt find the corresponding SRID - is the geometry registered in the GEOMETRY_COLUMNS table?  Is there an uppercase/lowercase missmatch?';
	END IF;
	return sr;
END;
$_$;


ALTER FUNCTION public.find_srid(character varying, character varying, character varying) OWNER TO postgres;

--
-- Name: fix_geometry_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION fix_geometry_columns() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
	mislinked record;
	result text;
	linked integer;
	deleted integer;
	foundschema integer;
BEGIN

	-- Since 7.3 schema support has been added.
	-- Previous postgis versions used to put the database name in
	-- the schema column. This needs to be fixed, so we try to
	-- set the correct schema for each geometry_colums record
	-- looking at table, column, type and srid.
	UPDATE geometry_columns SET f_table_schema = n.nspname
		FROM pg_namespace n, pg_class c, pg_attribute a,
			pg_constraint sridcheck, pg_constraint typecheck
			WHERE ( f_table_schema is NULL
		OR f_table_schema = ''
			OR f_table_schema NOT IN (
					SELECT nspname::varchar
					FROM pg_namespace nn, pg_class cc, pg_attribute aa
					WHERE cc.relnamespace = nn.oid
					AND cc.relname = f_table_name::name
					AND aa.attrelid = cc.oid
					AND aa.attname = f_geometry_column::name))
			AND f_table_name::name = c.relname
			AND c.oid = a.attrelid
			AND c.relnamespace = n.oid
			AND f_geometry_column::name = a.attname

			AND sridcheck.conrelid = c.oid
		AND sridcheck.consrc LIKE '(srid(% = %)'
			AND sridcheck.consrc ~ textcat(' = ', srid::text)

			AND typecheck.conrelid = c.oid
		AND typecheck.consrc LIKE
		'((geometrytype(%) = ''%''::text) OR (% IS NULL))'
			AND typecheck.consrc ~ textcat(' = ''', type::text)

			AND NOT EXISTS (
					SELECT oid FROM geometry_columns gc
					WHERE c.relname::varchar = gc.f_table_name
					AND n.nspname::varchar = gc.f_table_schema
					AND a.attname::varchar = gc.f_geometry_column
			);

	GET DIAGNOSTICS foundschema = ROW_COUNT;

	-- no linkage to system table needed
	return 'fixed:'||foundschema::text;

END;
$$;


ALTER FUNCTION public.fix_geometry_columns() OWNER TO postgres;

--
-- Name: force_2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION force_2d(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_2d';


ALTER FUNCTION public.force_2d(geometry) OWNER TO postgres;

--
-- Name: force_3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION force_3d(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_3dz';


ALTER FUNCTION public.force_3d(geometry) OWNER TO postgres;

--
-- Name: force_3dm(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION force_3dm(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_3dm';


ALTER FUNCTION public.force_3dm(geometry) OWNER TO postgres;

--
-- Name: force_3dz(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION force_3dz(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_3dz';


ALTER FUNCTION public.force_3dz(geometry) OWNER TO postgres;

--
-- Name: force_4d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION force_4d(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_4d';


ALTER FUNCTION public.force_4d(geometry) OWNER TO postgres;

--
-- Name: force_collection(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION force_collection(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_collection';


ALTER FUNCTION public.force_collection(geometry) OWNER TO postgres;

--
-- Name: forcerhr(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION forcerhr(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_forceRHR_poly';


ALTER FUNCTION public.forcerhr(geometry) OWNER TO postgres;

--
-- Name: geography(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography(geometry) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_from_geometry';


ALTER FUNCTION public.geography(geometry) OWNER TO postgres;

--
-- Name: geography(geography, integer, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography(geography, integer, boolean) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_enforce_typmod';


ALTER FUNCTION public.geography(geography, integer, boolean) OWNER TO postgres;

--
-- Name: geography_cmp(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_cmp(geography, geography) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_cmp';


ALTER FUNCTION public.geography_cmp(geography, geography) OWNER TO postgres;

--
-- Name: geography_eq(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_eq(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_eq';


ALTER FUNCTION public.geography_eq(geography, geography) OWNER TO postgres;

--
-- Name: geography_ge(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_ge(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_ge';


ALTER FUNCTION public.geography_ge(geography, geography) OWNER TO postgres;

--
-- Name: geography_gist_compress(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_compress(internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_compress';


ALTER FUNCTION public.geography_gist_compress(internal) OWNER TO postgres;

--
-- Name: geography_gist_consistent(internal, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_consistent(internal, geometry, integer) RETURNS boolean
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_consistent';


ALTER FUNCTION public.geography_gist_consistent(internal, geometry, integer) OWNER TO postgres;

--
-- Name: geography_gist_decompress(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_decompress(internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_decompress';


ALTER FUNCTION public.geography_gist_decompress(internal) OWNER TO postgres;

--
-- Name: geography_gist_join_selectivity(internal, oid, internal, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_join_selectivity(internal, oid, internal, smallint) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_join_selectivity';


ALTER FUNCTION public.geography_gist_join_selectivity(internal, oid, internal, smallint) OWNER TO postgres;

--
-- Name: geography_gist_penalty(internal, internal, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_penalty(internal, internal, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_penalty';


ALTER FUNCTION public.geography_gist_penalty(internal, internal, internal) OWNER TO postgres;

--
-- Name: geography_gist_picksplit(internal, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_picksplit(internal, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_picksplit';


ALTER FUNCTION public.geography_gist_picksplit(internal, internal) OWNER TO postgres;

--
-- Name: geography_gist_same(box2d, box2d, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_same(box2d, box2d, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_same';


ALTER FUNCTION public.geography_gist_same(box2d, box2d, internal) OWNER TO postgres;

--
-- Name: geography_gist_selectivity(internal, oid, internal, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_selectivity(internal, oid, internal, integer) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_selectivity';


ALTER FUNCTION public.geography_gist_selectivity(internal, oid, internal, integer) OWNER TO postgres;

--
-- Name: geography_gist_union(bytea, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gist_union(bytea, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'geography_gist_union';


ALTER FUNCTION public.geography_gist_union(bytea, internal) OWNER TO postgres;

--
-- Name: geography_gt(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_gt(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_gt';


ALTER FUNCTION public.geography_gt(geography, geography) OWNER TO postgres;

--
-- Name: geography_le(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_le(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_le';


ALTER FUNCTION public.geography_le(geography, geography) OWNER TO postgres;

--
-- Name: geography_lt(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_lt(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_lt';


ALTER FUNCTION public.geography_lt(geography, geography) OWNER TO postgres;

--
-- Name: geography_overlaps(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_overlaps(geography, geography) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_overlaps';


ALTER FUNCTION public.geography_overlaps(geography, geography) OWNER TO postgres;

--
-- Name: geography_typmod_dims(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_typmod_dims(integer) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_typmod_dims';


ALTER FUNCTION public.geography_typmod_dims(integer) OWNER TO postgres;

--
-- Name: geography_typmod_srid(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_typmod_srid(integer) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_typmod_srid';


ALTER FUNCTION public.geography_typmod_srid(integer) OWNER TO postgres;

--
-- Name: geography_typmod_type(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geography_typmod_type(integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_typmod_type';


ALTER FUNCTION public.geography_typmod_type(integer) OWNER TO postgres;

--
-- Name: geomcollfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomcollfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromText($1)) = 'GEOMETRYCOLLECTION'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.geomcollfromtext(text) OWNER TO postgres;

--
-- Name: geomcollfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomcollfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromText($1, $2)) = 'GEOMETRYCOLLECTION'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.geomcollfromtext(text, integer) OWNER TO postgres;

--
-- Name: geomcollfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomcollfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromWKB($1)) = 'GEOMETRYCOLLECTION'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.geomcollfromwkb(bytea) OWNER TO postgres;

--
-- Name: geomcollfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomcollfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromWKB($1, $2)) = 'GEOMETRYCOLLECTION'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.geomcollfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: geometry(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(box3d_extent) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_LWGEOM';


ALTER FUNCTION public.geometry(box3d_extent) OWNER TO postgres;

--
-- Name: geometry(box2d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(box2d) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_to_LWGEOM';


ALTER FUNCTION public.geometry(box2d) OWNER TO postgres;

--
-- Name: geometry(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(box3d) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_LWGEOM';


ALTER FUNCTION public.geometry(box3d) OWNER TO postgres;

--
-- Name: geometry(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'parse_WKT_lwgeom';


ALTER FUNCTION public.geometry(text) OWNER TO postgres;

--
-- Name: geometry(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(chip) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_to_LWGEOM';


ALTER FUNCTION public.geometry(chip) OWNER TO postgres;

--
-- Name: geometry(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_bytea';


ALTER FUNCTION public.geometry(bytea) OWNER TO postgres;

--
-- Name: geometry(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry(geography) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geometry_from_geography';


ALTER FUNCTION public.geometry(geography) OWNER TO postgres;

--
-- Name: geometry_above(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_above(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_above';


ALTER FUNCTION public.geometry_above(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_below(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_below(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_below';


ALTER FUNCTION public.geometry_below(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_cmp(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_cmp(geometry, geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_cmp';


ALTER FUNCTION public.geometry_cmp(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_contain(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_contain(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_contain';


ALTER FUNCTION public.geometry_contain(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_contained(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_contained(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_contained';


ALTER FUNCTION public.geometry_contained(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_eq(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_eq(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_eq';


ALTER FUNCTION public.geometry_eq(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_ge(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_ge(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_ge';


ALTER FUNCTION public.geometry_ge(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_gist_joinsel(internal, oid, internal, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_gist_joinsel(internal, oid, internal, smallint) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_joinsel';


ALTER FUNCTION public.geometry_gist_joinsel(internal, oid, internal, smallint) OWNER TO postgres;

--
-- Name: geometry_gist_sel(internal, oid, internal, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_gist_sel(internal, oid, internal, integer) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_sel';


ALTER FUNCTION public.geometry_gist_sel(internal, oid, internal, integer) OWNER TO postgres;

--
-- Name: geometry_gt(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_gt(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_gt';


ALTER FUNCTION public.geometry_gt(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_le(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_le(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_le';


ALTER FUNCTION public.geometry_le(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_left(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_left(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_left';


ALTER FUNCTION public.geometry_left(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_lt(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_lt(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_lt';


ALTER FUNCTION public.geometry_lt(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_overabove(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_overabove(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overabove';


ALTER FUNCTION public.geometry_overabove(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_overbelow(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_overbelow(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overbelow';


ALTER FUNCTION public.geometry_overbelow(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_overlap(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_overlap(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overlap';


ALTER FUNCTION public.geometry_overlap(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_overleft(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_overleft(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overleft';


ALTER FUNCTION public.geometry_overleft(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_overright(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_overright(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overright';


ALTER FUNCTION public.geometry_overright(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_right(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_right(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_right';


ALTER FUNCTION public.geometry_right(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_same(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_same(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_samebox';


ALTER FUNCTION public.geometry_same(geometry, geometry) OWNER TO postgres;

--
-- Name: geometry_samebox(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometry_samebox(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_samebox';


ALTER FUNCTION public.geometry_samebox(geometry, geometry) OWNER TO postgres;

--
-- Name: geometryfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometryfromtext(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.geometryfromtext(text) OWNER TO postgres;

--
-- Name: geometryfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometryfromtext(text, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.geometryfromtext(text, integer) OWNER TO postgres;

--
-- Name: geometryn(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometryn(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_geometryn_collection';


ALTER FUNCTION public.geometryn(geometry, integer) OWNER TO postgres;

--
-- Name: geometrytype(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geometrytype(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_getTYPE';


ALTER FUNCTION public.geometrytype(geometry) OWNER TO postgres;

--
-- Name: geomfromewkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomfromewkb(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOMFromWKB';


ALTER FUNCTION public.geomfromewkb(bytea) OWNER TO postgres;

--
-- Name: geomfromewkt(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomfromewkt(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'parse_WKT_lwgeom';


ALTER FUNCTION public.geomfromewkt(text) OWNER TO postgres;

--
-- Name: geomfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT geometryfromtext($1)$_$;


ALTER FUNCTION public.geomfromtext(text) OWNER TO postgres;

--
-- Name: geomfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT geometryfromtext($1, $2)$_$;


ALTER FUNCTION public.geomfromtext(text, integer) OWNER TO postgres;

--
-- Name: geomfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomfromwkb(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_WKB';


ALTER FUNCTION public.geomfromwkb(bytea) OWNER TO postgres;

--
-- Name: geomfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT setSRID(GeomFromWKB($1), $2)$_$;


ALTER FUNCTION public.geomfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: geomunion(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION geomunion(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geomunion';


ALTER FUNCTION public.geomunion(geometry, geometry) OWNER TO postgres;

--
-- Name: get_proj4_from_srid(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_proj4_from_srid(integer) RETURNS text
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
BEGIN
	RETURN proj4text::text FROM spatial_ref_sys WHERE srid= $1;
END;
$_$;


ALTER FUNCTION public.get_proj4_from_srid(integer) OWNER TO postgres;

--
-- Name: getbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION getbbox(geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX2DFLOAT4';


ALTER FUNCTION public.getbbox(geometry) OWNER TO postgres;

--
-- Name: getsrid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION getsrid(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_getSRID';


ALTER FUNCTION public.getsrid(geometry) OWNER TO postgres;

--
-- Name: gettransactionid(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION gettransactionid() RETURNS xid
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'getTransactionID';


ALTER FUNCTION public.gettransactionid() OWNER TO postgres;

--
-- Name: hasbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION hasbbox(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_hasBBOX';


ALTER FUNCTION public.hasbbox(geometry) OWNER TO postgres;

--
-- Name: height(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION height(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getHeight';


ALTER FUNCTION public.height(chip) OWNER TO postgres;

--
-- Name: interiorringn(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION interiorringn(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_interiorringn_polygon';


ALTER FUNCTION public.interiorringn(geometry, integer) OWNER TO postgres;

--
-- Name: intersection(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION intersection(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'intersection';


ALTER FUNCTION public.intersection(geometry, geometry) OWNER TO postgres;

--
-- Name: intersects(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION intersects(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'intersects';


ALTER FUNCTION public.intersects(geometry, geometry) OWNER TO postgres;

--
-- Name: isclosed(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION isclosed(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_isclosed_linestring';


ALTER FUNCTION public.isclosed(geometry) OWNER TO postgres;

--
-- Name: isempty(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION isempty(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_isempty';


ALTER FUNCTION public.isempty(geometry) OWNER TO postgres;

--
-- Name: isring(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION isring(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'isring';


ALTER FUNCTION public.isring(geometry) OWNER TO postgres;

--
-- Name: issimple(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION issimple(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'issimple';


ALTER FUNCTION public.issimple(geometry) OWNER TO postgres;

--
-- Name: isvalid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION isvalid(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'isvalid';


ALTER FUNCTION public.isvalid(geometry) OWNER TO postgres;

--
-- Name: length(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION length(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length_linestring';


ALTER FUNCTION public.length(geometry) OWNER TO postgres;

--
-- Name: length2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION length2d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length2d_linestring';


ALTER FUNCTION public.length2d(geometry) OWNER TO postgres;

--
-- Name: length2d_spheroid(geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION length2d_spheroid(geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_length2d_ellipsoid';


ALTER FUNCTION public.length2d_spheroid(geometry, spheroid) OWNER TO postgres;

--
-- Name: length3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION length3d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length_linestring';


ALTER FUNCTION public.length3d(geometry) OWNER TO postgres;

--
-- Name: length3d_spheroid(geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION length3d_spheroid(geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length_ellipsoid_linestring';


ALTER FUNCTION public.length3d_spheroid(geometry, spheroid) OWNER TO postgres;

--
-- Name: length_spheroid(geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION length_spheroid(geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_length_ellipsoid_linestring';


ALTER FUNCTION public.length_spheroid(geometry, spheroid) OWNER TO postgres;

--
-- Name: line_interpolate_point(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION line_interpolate_point(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_interpolate_point';


ALTER FUNCTION public.line_interpolate_point(geometry, double precision) OWNER TO postgres;

--
-- Name: line_locate_point(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION line_locate_point(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_locate_point';


ALTER FUNCTION public.line_locate_point(geometry, geometry) OWNER TO postgres;

--
-- Name: line_substring(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION line_substring(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_substring';


ALTER FUNCTION public.line_substring(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: linefrommultipoint(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linefrommultipoint(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_from_mpoint';


ALTER FUNCTION public.linefrommultipoint(geometry) OWNER TO postgres;

--
-- Name: linefromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linefromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1)) = 'LINESTRING'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.linefromtext(text) OWNER TO postgres;

--
-- Name: linefromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linefromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1, $2)) = 'LINESTRING'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.linefromtext(text, integer) OWNER TO postgres;

--
-- Name: linefromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linefromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'LINESTRING'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.linefromwkb(bytea) OWNER TO postgres;

--
-- Name: linefromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linefromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'LINESTRING'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.linefromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: linemerge(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linemerge(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'linemerge';


ALTER FUNCTION public.linemerge(geometry) OWNER TO postgres;

--
-- Name: linestringfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linestringfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT LineFromText($1)$_$;


ALTER FUNCTION public.linestringfromtext(text) OWNER TO postgres;

--
-- Name: linestringfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linestringfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT LineFromText($1, $2)$_$;


ALTER FUNCTION public.linestringfromtext(text, integer) OWNER TO postgres;

--
-- Name: linestringfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linestringfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'LINESTRING'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.linestringfromwkb(bytea) OWNER TO postgres;

--
-- Name: linestringfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION linestringfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'LINESTRING'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.linestringfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: locate_along_measure(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION locate_along_measure(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT locate_between_measures($1, $2, $2) $_$;


ALTER FUNCTION public.locate_along_measure(geometry, double precision) OWNER TO postgres;

--
-- Name: locate_between_measures(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION locate_between_measures(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_locate_between_m';


ALTER FUNCTION public.locate_between_measures(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: lockrow(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lockrow(text, text, text) RETURNS integer
    LANGUAGE sql STRICT
    AS $_$ SELECT LockRow(current_schema(), $1, $2, $3, now()::timestamp+'1:00'); $_$;


ALTER FUNCTION public.lockrow(text, text, text) OWNER TO postgres;

--
-- Name: lockrow(text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lockrow(text, text, text, text) RETURNS integer
    LANGUAGE sql STRICT
    AS $_$ SELECT LockRow($1, $2, $3, $4, now()::timestamp+'1:00'); $_$;


ALTER FUNCTION public.lockrow(text, text, text, text) OWNER TO postgres;

--
-- Name: lockrow(text, text, text, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lockrow(text, text, text, timestamp without time zone) RETURNS integer
    LANGUAGE sql STRICT
    AS $_$ SELECT LockRow(current_schema(), $1, $2, $3, $4); $_$;


ALTER FUNCTION public.lockrow(text, text, text, timestamp without time zone) OWNER TO postgres;

--
-- Name: lockrow(text, text, text, text, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lockrow(text, text, text, text, timestamp without time zone) RETURNS integer
    LANGUAGE plpgsql STRICT
    AS $_$ 
DECLARE
	myschema alias for $1;
	mytable alias for $2;
	myrid   alias for $3;
	authid alias for $4;
	expires alias for $5;
	ret int;
	mytoid oid;
	myrec RECORD;
	
BEGIN

	IF NOT LongTransactionsEnabled() THEN
		RAISE EXCEPTION 'Long transaction support disabled, use EnableLongTransaction() to enable.';
	END IF;

	EXECUTE 'DELETE FROM authorization_table WHERE expires < now()'; 

	SELECT c.oid INTO mytoid FROM pg_class c, pg_namespace n
		WHERE c.relname = mytable
		AND c.relnamespace = n.oid
		AND n.nspname = myschema;

	-- RAISE NOTICE 'toid: %', mytoid;

	FOR myrec IN SELECT * FROM authorization_table WHERE 
		toid = mytoid AND rid = myrid
	LOOP
		IF myrec.authid != authid THEN
			RETURN 0;
		ELSE
			RETURN 1;
		END IF;
	END LOOP;

	EXECUTE 'INSERT INTO authorization_table VALUES ('||
		quote_literal(mytoid::text)||','||quote_literal(myrid)||
		','||quote_literal(expires::text)||
		','||quote_literal(authid) ||')';

	GET DIAGNOSTICS ret = ROW_COUNT;

	RETURN ret;
END;
$_$;


ALTER FUNCTION public.lockrow(text, text, text, text, timestamp without time zone) OWNER TO postgres;

--
-- Name: longtransactionsenabled(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION longtransactionsenabled() RETURNS boolean
    LANGUAGE plpgsql
    AS $$ 
DECLARE
	rec RECORD;
BEGIN
	FOR rec IN SELECT oid FROM pg_class WHERE relname = 'authorized_tables'
	LOOP
		return 't';
	END LOOP;
	return 'f';
END;
$$;


ALTER FUNCTION public.longtransactionsenabled() OWNER TO postgres;

--
-- Name: lwgeom_gist_compress(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_compress(internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_compress';


ALTER FUNCTION public.lwgeom_gist_compress(internal) OWNER TO postgres;

--
-- Name: lwgeom_gist_consistent(internal, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_consistent(internal, geometry, integer) RETURNS boolean
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_consistent';


ALTER FUNCTION public.lwgeom_gist_consistent(internal, geometry, integer) OWNER TO postgres;

--
-- Name: lwgeom_gist_decompress(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_decompress(internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_decompress';


ALTER FUNCTION public.lwgeom_gist_decompress(internal) OWNER TO postgres;

--
-- Name: lwgeom_gist_penalty(internal, internal, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_penalty(internal, internal, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_penalty';


ALTER FUNCTION public.lwgeom_gist_penalty(internal, internal, internal) OWNER TO postgres;

--
-- Name: lwgeom_gist_picksplit(internal, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_picksplit(internal, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_picksplit';


ALTER FUNCTION public.lwgeom_gist_picksplit(internal, internal) OWNER TO postgres;

--
-- Name: lwgeom_gist_same(box2d, box2d, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_same(box2d, box2d, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_same';


ALTER FUNCTION public.lwgeom_gist_same(box2d, box2d, internal) OWNER TO postgres;

--
-- Name: lwgeom_gist_union(bytea, internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION lwgeom_gist_union(bytea, internal) RETURNS internal
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_union';


ALTER FUNCTION public.lwgeom_gist_union(bytea, internal) OWNER TO postgres;

--
-- Name: m(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION m(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_m_point';


ALTER FUNCTION public.m(geometry) OWNER TO postgres;

--
-- Name: makebox2d(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makebox2d(geometry, geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_construct';


ALTER FUNCTION public.makebox2d(geometry, geometry) OWNER TO postgres;

--
-- Name: makebox3d(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makebox3d(geometry, geometry) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_construct';


ALTER FUNCTION public.makebox3d(geometry, geometry) OWNER TO postgres;

--
-- Name: makeline(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makeline(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makeline';


ALTER FUNCTION public.makeline(geometry, geometry) OWNER TO postgres;

--
-- Name: makeline_garray(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makeline_garray(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makeline_garray';


ALTER FUNCTION public.makeline_garray(geometry[]) OWNER TO postgres;

--
-- Name: makepoint(double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makepoint(double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.makepoint(double precision, double precision) OWNER TO postgres;

--
-- Name: makepoint(double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makepoint(double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.makepoint(double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: makepoint(double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makepoint(double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.makepoint(double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: makepointm(double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makepointm(double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint3dm';


ALTER FUNCTION public.makepointm(double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: makepolygon(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makepolygon(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoly';


ALTER FUNCTION public.makepolygon(geometry) OWNER TO postgres;

--
-- Name: makepolygon(geometry, geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION makepolygon(geometry, geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoly';


ALTER FUNCTION public.makepolygon(geometry, geometry[]) OWNER TO postgres;

--
-- Name: max_distance(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION max_distance(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_maxdistance2d_linestring';


ALTER FUNCTION public.max_distance(geometry, geometry) OWNER TO postgres;

--
-- Name: mem_size(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mem_size(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_mem_size';


ALTER FUNCTION public.mem_size(geometry) OWNER TO postgres;

--
-- Name: mlinefromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mlinefromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1)) = 'MULTILINESTRING'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mlinefromtext(text) OWNER TO postgres;

--
-- Name: mlinefromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mlinefromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromText($1, $2)) = 'MULTILINESTRING'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mlinefromtext(text, integer) OWNER TO postgres;

--
-- Name: mlinefromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mlinefromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'MULTILINESTRING'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mlinefromwkb(bytea) OWNER TO postgres;

--
-- Name: mlinefromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mlinefromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'MULTILINESTRING'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mlinefromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: mpointfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpointfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1)) = 'MULTIPOINT'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpointfromtext(text) OWNER TO postgres;

--
-- Name: mpointfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpointfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1,$2)) = 'MULTIPOINT'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpointfromtext(text, integer) OWNER TO postgres;

--
-- Name: mpointfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpointfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'MULTIPOINT'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpointfromwkb(bytea) OWNER TO postgres;

--
-- Name: mpointfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpointfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1,$2)) = 'MULTIPOINT'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpointfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: mpolyfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpolyfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1)) = 'MULTIPOLYGON'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpolyfromtext(text) OWNER TO postgres;

--
-- Name: mpolyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpolyfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1, $2)) = 'MULTIPOLYGON'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpolyfromtext(text, integer) OWNER TO postgres;

--
-- Name: mpolyfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpolyfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'MULTIPOLYGON'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpolyfromwkb(bytea) OWNER TO postgres;

--
-- Name: mpolyfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION mpolyfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'MULTIPOLYGON'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.mpolyfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: multi(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multi(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_multi';


ALTER FUNCTION public.multi(geometry) OWNER TO postgres;

--
-- Name: multilinefromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multilinefromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'MULTILINESTRING'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.multilinefromwkb(bytea) OWNER TO postgres;

--
-- Name: multilinefromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multilinefromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'MULTILINESTRING'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.multilinefromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: multilinestringfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multilinestringfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_MLineFromText($1)$_$;


ALTER FUNCTION public.multilinestringfromtext(text) OWNER TO postgres;

--
-- Name: multilinestringfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multilinestringfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MLineFromText($1, $2)$_$;


ALTER FUNCTION public.multilinestringfromtext(text, integer) OWNER TO postgres;

--
-- Name: multipointfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipointfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPointFromText($1)$_$;


ALTER FUNCTION public.multipointfromtext(text) OWNER TO postgres;

--
-- Name: multipointfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipointfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPointFromText($1, $2)$_$;


ALTER FUNCTION public.multipointfromtext(text, integer) OWNER TO postgres;

--
-- Name: multipointfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipointfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'MULTIPOINT'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.multipointfromwkb(bytea) OWNER TO postgres;

--
-- Name: multipointfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipointfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1,$2)) = 'MULTIPOINT'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.multipointfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: multipolyfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipolyfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'MULTIPOLYGON'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.multipolyfromwkb(bytea) OWNER TO postgres;

--
-- Name: multipolyfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipolyfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'MULTIPOLYGON'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.multipolyfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: multipolygonfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipolygonfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPolyFromText($1)$_$;


ALTER FUNCTION public.multipolygonfromtext(text) OWNER TO postgres;

--
-- Name: multipolygonfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION multipolygonfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPolyFromText($1, $2)$_$;


ALTER FUNCTION public.multipolygonfromtext(text, integer) OWNER TO postgres;

--
-- Name: ndims(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION ndims(geometry) RETURNS smallint
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_ndims';


ALTER FUNCTION public.ndims(geometry) OWNER TO postgres;

--
-- Name: noop(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION noop(geometry) RETURNS geometry
    LANGUAGE c STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_noop';


ALTER FUNCTION public.noop(geometry) OWNER TO postgres;

--
-- Name: npoints(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION npoints(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_npoints';


ALTER FUNCTION public.npoints(geometry) OWNER TO postgres;

--
-- Name: nrings(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION nrings(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_nrings';


ALTER FUNCTION public.nrings(geometry) OWNER TO postgres;

--
-- Name: numgeometries(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION numgeometries(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numgeometries_collection';


ALTER FUNCTION public.numgeometries(geometry) OWNER TO postgres;

--
-- Name: numinteriorring(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION numinteriorring(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numinteriorrings_polygon';


ALTER FUNCTION public.numinteriorring(geometry) OWNER TO postgres;

--
-- Name: numinteriorrings(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION numinteriorrings(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numinteriorrings_polygon';


ALTER FUNCTION public.numinteriorrings(geometry) OWNER TO postgres;

--
-- Name: numpoints(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION numpoints(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numpoints_linestring';


ALTER FUNCTION public.numpoints(geometry) OWNER TO postgres;

--
-- Name: overlaps(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "overlaps"(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'overlaps';


ALTER FUNCTION public."overlaps"(geometry, geometry) OWNER TO postgres;

--
-- Name: perimeter(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION perimeter(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_perimeter_poly';


ALTER FUNCTION public.perimeter(geometry) OWNER TO postgres;

--
-- Name: perimeter2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION perimeter2d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_perimeter2d_poly';


ALTER FUNCTION public.perimeter2d(geometry) OWNER TO postgres;

--
-- Name: perimeter3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION perimeter3d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_perimeter_poly';


ALTER FUNCTION public.perimeter3d(geometry) OWNER TO postgres;

--
-- Name: pgis_geometry_accum_finalfn(pgis_abs); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_geometry_accum_finalfn(pgis_abs) RETURNS geometry[]
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'pgis_geometry_accum_finalfn';


ALTER FUNCTION public.pgis_geometry_accum_finalfn(pgis_abs) OWNER TO postgres;

--
-- Name: pgis_geometry_accum_transfn(pgis_abs, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_geometry_accum_transfn(pgis_abs, geometry) RETURNS pgis_abs
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'pgis_geometry_accum_transfn';


ALTER FUNCTION public.pgis_geometry_accum_transfn(pgis_abs, geometry) OWNER TO postgres;

--
-- Name: pgis_geometry_collect_finalfn(pgis_abs); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_geometry_collect_finalfn(pgis_abs) RETURNS geometry
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'pgis_geometry_collect_finalfn';


ALTER FUNCTION public.pgis_geometry_collect_finalfn(pgis_abs) OWNER TO postgres;

--
-- Name: pgis_geometry_makeline_finalfn(pgis_abs); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_geometry_makeline_finalfn(pgis_abs) RETURNS geometry
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'pgis_geometry_makeline_finalfn';


ALTER FUNCTION public.pgis_geometry_makeline_finalfn(pgis_abs) OWNER TO postgres;

--
-- Name: pgis_geometry_polygonize_finalfn(pgis_abs); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_geometry_polygonize_finalfn(pgis_abs) RETURNS geometry
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'pgis_geometry_polygonize_finalfn';


ALTER FUNCTION public.pgis_geometry_polygonize_finalfn(pgis_abs) OWNER TO postgres;

--
-- Name: pgis_geometry_union_finalfn(pgis_abs); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pgis_geometry_union_finalfn(pgis_abs) RETURNS geometry
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'pgis_geometry_union_finalfn';


ALTER FUNCTION public.pgis_geometry_union_finalfn(pgis_abs) OWNER TO postgres;

--
-- Name: point_inside_circle(geometry, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION point_inside_circle(geometry, double precision, double precision, double precision) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_inside_circle_point';


ALTER FUNCTION public.point_inside_circle(geometry, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: pointfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pointfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1)) = 'POINT'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.pointfromtext(text) OWNER TO postgres;

--
-- Name: pointfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pointfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1, $2)) = 'POINT'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.pointfromtext(text, integer) OWNER TO postgres;

--
-- Name: pointfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pointfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'POINT'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.pointfromwkb(bytea) OWNER TO postgres;

--
-- Name: pointfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pointfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'POINT'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.pointfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: pointn(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pointn(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_pointn_linestring';


ALTER FUNCTION public.pointn(geometry, integer) OWNER TO postgres;

--
-- Name: pointonsurface(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION pointonsurface(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'pointonsurface';


ALTER FUNCTION public.pointonsurface(geometry) OWNER TO postgres;

--
-- Name: polyfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polyfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1)) = 'POLYGON'
	THEN GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.polyfromtext(text) OWNER TO postgres;

--
-- Name: polyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polyfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1, $2)) = 'POLYGON'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.polyfromtext(text, integer) OWNER TO postgres;

--
-- Name: polyfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polyfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'POLYGON'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.polyfromwkb(bytea) OWNER TO postgres;

--
-- Name: polyfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polyfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'POLYGON'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.polyfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: polygonfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polygonfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT PolyFromText($1)$_$;


ALTER FUNCTION public.polygonfromtext(text) OWNER TO postgres;

--
-- Name: polygonfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polygonfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT PolyFromText($1, $2)$_$;


ALTER FUNCTION public.polygonfromtext(text, integer) OWNER TO postgres;

--
-- Name: polygonfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polygonfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'POLYGON'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.polygonfromwkb(bytea) OWNER TO postgres;

--
-- Name: polygonfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polygonfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1,$2)) = 'POLYGON'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.polygonfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: polygonize_garray(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION polygonize_garray(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'polygonize_garray';


ALTER FUNCTION public.polygonize_garray(geometry[]) OWNER TO postgres;

--
-- Name: populate_geometry_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION populate_geometry_columns() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
	inserted    integer;
	oldcount    integer;
	probed      integer;
	stale       integer;
	gcs         RECORD;
	gc          RECORD;
	gsrid       integer;
	gndims      integer;
	gtype       text;
	query       text;
	gc_is_valid boolean;

BEGIN
	SELECT count(*) INTO oldcount FROM geometry_columns;
	inserted := 0;

	EXECUTE 'TRUNCATE geometry_columns';

	-- Count the number of geometry columns in all tables and views
	SELECT count(DISTINCT c.oid) INTO probed
	FROM pg_class c,
		 pg_attribute a,
		 pg_type t,
		 pg_namespace n
	WHERE (c.relkind = 'r' OR c.relkind = 'v')
	AND t.typname = 'geometry'
	AND a.attisdropped = false
	AND a.atttypid = t.oid
	AND a.attrelid = c.oid
	AND c.relnamespace = n.oid
	AND n.nspname NOT ILIKE 'pg_temp%';

	-- Iterate through all non-dropped geometry columns
	RAISE DEBUG 'Processing Tables.....';

	FOR gcs IN
	SELECT DISTINCT ON (c.oid) c.oid, n.nspname, c.relname
		FROM pg_class c,
			 pg_attribute a,
			 pg_type t,
			 pg_namespace n
		WHERE c.relkind = 'r'
		AND t.typname = 'geometry'
		AND a.attisdropped = false
		AND a.atttypid = t.oid
		AND a.attrelid = c.oid
		AND c.relnamespace = n.oid
		AND n.nspname NOT ILIKE 'pg_temp%'
	LOOP

	inserted := inserted + populate_geometry_columns(gcs.oid);
	END LOOP;

	-- Add views to geometry columns table
	RAISE DEBUG 'Processing Views.....';
	FOR gcs IN
	SELECT DISTINCT ON (c.oid) c.oid, n.nspname, c.relname
		FROM pg_class c,
			 pg_attribute a,
			 pg_type t,
			 pg_namespace n
		WHERE c.relkind = 'v'
		AND t.typname = 'geometry'
		AND a.attisdropped = false
		AND a.atttypid = t.oid
		AND a.attrelid = c.oid
		AND c.relnamespace = n.oid
	LOOP

	inserted := inserted + populate_geometry_columns(gcs.oid);
	END LOOP;

	IF oldcount > inserted THEN
	stale = oldcount-inserted;
	ELSE
	stale = 0;
	END IF;

	RETURN 'probed:' ||probed|| ' inserted:'||inserted|| ' conflicts:'||probed-inserted|| ' deleted:'||stale;
END

$$;


ALTER FUNCTION public.populate_geometry_columns() OWNER TO postgres;

--
-- Name: populate_geometry_columns(oid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION populate_geometry_columns(tbl_oid oid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
	gcs         RECORD;
	gc          RECORD;
	gsrid       integer;
	gndims      integer;
	gtype       text;
	query       text;
	gc_is_valid boolean;
	inserted    integer;

BEGIN
	inserted := 0;

	-- Iterate through all geometry columns in this table
	FOR gcs IN
	SELECT n.nspname, c.relname, a.attname
		FROM pg_class c,
			 pg_attribute a,
			 pg_type t,
			 pg_namespace n
		WHERE c.relkind = 'r'
		AND t.typname = 'geometry'
		AND a.attisdropped = false
		AND a.atttypid = t.oid
		AND a.attrelid = c.oid
		AND c.relnamespace = n.oid
		AND n.nspname NOT ILIKE 'pg_temp%'
		AND c.oid = tbl_oid
	LOOP

	RAISE DEBUG 'Processing table %.%.%', gcs.nspname, gcs.relname, gcs.attname;

	DELETE FROM geometry_columns
	  WHERE f_table_schema = quote_ident(gcs.nspname)
	  AND f_table_name = quote_ident(gcs.relname)
	  AND f_geometry_column = quote_ident(gcs.attname);

	gc_is_valid := true;

	-- Try to find srid check from system tables (pg_constraint)
	gsrid :=
		(SELECT replace(replace(split_part(s.consrc, ' = ', 2), ')', ''), '(', '')
		 FROM pg_class c, pg_namespace n, pg_attribute a, pg_constraint s
		 WHERE n.nspname = gcs.nspname
		 AND c.relname = gcs.relname
		 AND a.attname = gcs.attname
		 AND a.attrelid = c.oid
		 AND s.connamespace = n.oid
		 AND s.conrelid = c.oid
		 AND a.attnum = ANY (s.conkey)
		 AND s.consrc LIKE '%srid(% = %');
	IF (gsrid IS NULL) THEN
		-- Try to find srid from the geometry itself
		EXECUTE 'SELECT srid(' || quote_ident(gcs.attname) || ')
				 FROM ONLY ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				 WHERE ' || quote_ident(gcs.attname) || ' IS NOT NULL LIMIT 1'
			INTO gc;
		gsrid := gc.srid;

		-- Try to apply srid check to column
		IF (gsrid IS NOT NULL) THEN
			BEGIN
				EXECUTE 'ALTER TABLE ONLY ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
						 ADD CONSTRAINT ' || quote_ident('enforce_srid_' || gcs.attname) || '
						 CHECK (srid(' || quote_ident(gcs.attname) || ') = ' || gsrid || ')';
			EXCEPTION
				WHEN check_violation THEN
					RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not apply constraint CHECK (srid(%) = %)', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname), quote_ident(gcs.attname), gsrid;
					gc_is_valid := false;
			END;
		END IF;
	END IF;

	-- Try to find ndims check from system tables (pg_constraint)
	gndims :=
		(SELECT replace(split_part(s.consrc, ' = ', 2), ')', '')
		 FROM pg_class c, pg_namespace n, pg_attribute a, pg_constraint s
		 WHERE n.nspname = gcs.nspname
		 AND c.relname = gcs.relname
		 AND a.attname = gcs.attname
		 AND a.attrelid = c.oid
		 AND s.connamespace = n.oid
		 AND s.conrelid = c.oid
		 AND a.attnum = ANY (s.conkey)
		 AND s.consrc LIKE '%ndims(% = %');
	IF (gndims IS NULL) THEN
		-- Try to find ndims from the geometry itself
		EXECUTE 'SELECT ndims(' || quote_ident(gcs.attname) || ')
				 FROM ONLY ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				 WHERE ' || quote_ident(gcs.attname) || ' IS NOT NULL LIMIT 1'
			INTO gc;
		gndims := gc.ndims;

		-- Try to apply ndims check to column
		IF (gndims IS NOT NULL) THEN
			BEGIN
				EXECUTE 'ALTER TABLE ONLY ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
						 ADD CONSTRAINT ' || quote_ident('enforce_dims_' || gcs.attname) || '
						 CHECK (ndims(' || quote_ident(gcs.attname) || ') = '||gndims||')';
			EXCEPTION
				WHEN check_violation THEN
					RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not apply constraint CHECK (ndims(%) = %)', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname), quote_ident(gcs.attname), gndims;
					gc_is_valid := false;
			END;
		END IF;
	END IF;

	-- Try to find geotype check from system tables (pg_constraint)
	gtype :=
		(SELECT replace(split_part(s.consrc, '''', 2), ')', '')
		 FROM pg_class c, pg_namespace n, pg_attribute a, pg_constraint s
		 WHERE n.nspname = gcs.nspname
		 AND c.relname = gcs.relname
		 AND a.attname = gcs.attname
		 AND a.attrelid = c.oid
		 AND s.connamespace = n.oid
		 AND s.conrelid = c.oid
		 AND a.attnum = ANY (s.conkey)
		 AND s.consrc LIKE '%geometrytype(% = %');
	IF (gtype IS NULL) THEN
		-- Try to find geotype from the geometry itself
		EXECUTE 'SELECT geometrytype(' || quote_ident(gcs.attname) || ')
				 FROM ONLY ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				 WHERE ' || quote_ident(gcs.attname) || ' IS NOT NULL LIMIT 1'
			INTO gc;
		gtype := gc.geometrytype;
		--IF (gtype IS NULL) THEN
		--    gtype := 'GEOMETRY';
		--END IF;

		-- Try to apply geometrytype check to column
		IF (gtype IS NOT NULL) THEN
			BEGIN
				EXECUTE 'ALTER TABLE ONLY ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				ADD CONSTRAINT ' || quote_ident('enforce_geotype_' || gcs.attname) || '
				CHECK ((geometrytype(' || quote_ident(gcs.attname) || ') = ' || quote_literal(gtype) || ') OR (' || quote_ident(gcs.attname) || ' IS NULL))';
			EXCEPTION
				WHEN check_violation THEN
					-- No geometry check can be applied. This column contains a number of geometry types.
					RAISE WARNING 'Could not add geometry type check (%) to table column: %.%.%', gtype, quote_ident(gcs.nspname),quote_ident(gcs.relname),quote_ident(gcs.attname);
			END;
		END IF;
	END IF;

	IF (gsrid IS NULL) THEN
		RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not determine the srid', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname);
	ELSIF (gndims IS NULL) THEN
		RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not determine the number of dimensions', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname);
	ELSIF (gtype IS NULL) THEN
		RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not determine the geometry type', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname);
	ELSE
		-- Only insert into geometry_columns if table constraints could be applied.
		IF (gc_is_valid) THEN
			INSERT INTO geometry_columns (f_table_catalog,f_table_schema, f_table_name, f_geometry_column, coord_dimension, srid, type)
			VALUES ('', gcs.nspname, gcs.relname, gcs.attname, gndims, gsrid, gtype);
			inserted := inserted + 1;
		END IF;
	END IF;
	END LOOP;

	-- Add views to geometry columns table
	FOR gcs IN
	SELECT n.nspname, c.relname, a.attname
		FROM pg_class c,
			 pg_attribute a,
			 pg_type t,
			 pg_namespace n
		WHERE c.relkind = 'v'
		AND t.typname = 'geometry'
		AND a.attisdropped = false
		AND a.atttypid = t.oid
		AND a.attrelid = c.oid
		AND c.relnamespace = n.oid
		AND n.nspname NOT ILIKE 'pg_temp%'
		AND c.oid = tbl_oid
	LOOP
		RAISE DEBUG 'Processing view %.%.%', gcs.nspname, gcs.relname, gcs.attname;

		EXECUTE 'SELECT ndims(' || quote_ident(gcs.attname) || ')
				 FROM ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				 WHERE ' || quote_ident(gcs.attname) || ' IS NOT NULL LIMIT 1'
			INTO gc;
		gndims := gc.ndims;

		EXECUTE 'SELECT srid(' || quote_ident(gcs.attname) || ')
				 FROM ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				 WHERE ' || quote_ident(gcs.attname) || ' IS NOT NULL LIMIT 1'
			INTO gc;
		gsrid := gc.srid;

		EXECUTE 'SELECT geometrytype(' || quote_ident(gcs.attname) || ')
				 FROM ' || quote_ident(gcs.nspname) || '.' || quote_ident(gcs.relname) || '
				 WHERE ' || quote_ident(gcs.attname) || ' IS NOT NULL LIMIT 1'
			INTO gc;
		gtype := gc.geometrytype;

		IF (gndims IS NULL) THEN
			RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not determine ndims', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname);
		ELSIF (gsrid IS NULL) THEN
			RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not determine srid', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname);
		ELSIF (gtype IS NULL) THEN
			RAISE WARNING 'Not inserting ''%'' in ''%.%'' into geometry_columns: could not determine gtype', quote_ident(gcs.attname), quote_ident(gcs.nspname), quote_ident(gcs.relname);
		ELSE
			query := 'INSERT INTO geometry_columns (f_table_catalog,f_table_schema, f_table_name, f_geometry_column, coord_dimension, srid, type) ' ||
					 'VALUES ('''', ' || quote_literal(gcs.nspname) || ',' || quote_literal(gcs.relname) || ',' || quote_literal(gcs.attname) || ',' || gndims || ',' || gsrid || ',' || quote_literal(gtype) || ')';
			EXECUTE query;
			inserted := inserted + 1;
		END IF;
	END LOOP;

	RETURN inserted;
END

$$;


ALTER FUNCTION public.populate_geometry_columns(tbl_oid oid) OWNER TO postgres;

--
-- Name: postgis_addbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_addbbox(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_addBBOX';


ALTER FUNCTION public.postgis_addbbox(geometry) OWNER TO postgres;

--
-- Name: postgis_cache_bbox(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_cache_bbox() RETURNS trigger
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'cache_bbox';


ALTER FUNCTION public.postgis_cache_bbox() OWNER TO postgres;

--
-- Name: postgis_dropbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_dropbbox(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dropBBOX';


ALTER FUNCTION public.postgis_dropbbox(geometry) OWNER TO postgres;

--
-- Name: postgis_full_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_full_version() RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
	libver text;
	projver text;
	geosver text;
	libxmlver text;
	usestats bool;
	dbproc text;
	relproc text;
	fullver text;
BEGIN
	SELECT postgis_lib_version() INTO libver;
	SELECT postgis_proj_version() INTO projver;
	SELECT postgis_geos_version() INTO geosver;
	SELECT postgis_libxml_version() INTO libxmlver;
	SELECT postgis_uses_stats() INTO usestats;
	SELECT postgis_scripts_installed() INTO dbproc;
	SELECT postgis_scripts_released() INTO relproc;

	fullver = 'POSTGIS="' || libver || '"';

	IF  geosver IS NOT NULL THEN
		fullver = fullver || ' GEOS="' || geosver || '"';
	END IF;

	IF  projver IS NOT NULL THEN
		fullver = fullver || ' PROJ="' || projver || '"';
	END IF;

	IF  libxmlver IS NOT NULL THEN
		fullver = fullver || ' LIBXML="' || libxmlver || '"';
	END IF;

	IF usestats THEN
		fullver = fullver || ' USE_STATS';
	END IF;

	-- fullver = fullver || ' DBPROC="' || dbproc || '"';
	-- fullver = fullver || ' RELPROC="' || relproc || '"';

	IF dbproc != relproc THEN
		fullver = fullver || ' (procs from ' || dbproc || ' need upgrade)';
	END IF;

	RETURN fullver;
END
$$;


ALTER FUNCTION public.postgis_full_version() OWNER TO postgres;

--
-- Name: postgis_geos_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_geos_version() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_geos_version';


ALTER FUNCTION public.postgis_geos_version() OWNER TO postgres;

--
-- Name: postgis_getbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_getbbox(geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX2DFLOAT4';


ALTER FUNCTION public.postgis_getbbox(geometry) OWNER TO postgres;

--
-- Name: postgis_gist_joinsel(internal, oid, internal, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_gist_joinsel(internal, oid, internal, smallint) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_joinsel';


ALTER FUNCTION public.postgis_gist_joinsel(internal, oid, internal, smallint) OWNER TO postgres;

--
-- Name: postgis_gist_sel(internal, oid, internal, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_gist_sel(internal, oid, internal, integer) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_sel';


ALTER FUNCTION public.postgis_gist_sel(internal, oid, internal, integer) OWNER TO postgres;

--
-- Name: postgis_hasbbox(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_hasbbox(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_hasBBOX';


ALTER FUNCTION public.postgis_hasbbox(geometry) OWNER TO postgres;

--
-- Name: postgis_lib_build_date(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_lib_build_date() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_lib_build_date';


ALTER FUNCTION public.postgis_lib_build_date() OWNER TO postgres;

--
-- Name: postgis_lib_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_lib_version() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_lib_version';


ALTER FUNCTION public.postgis_lib_version() OWNER TO postgres;

--
-- Name: postgis_libxml_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_libxml_version() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_libxml_version';


ALTER FUNCTION public.postgis_libxml_version() OWNER TO postgres;

--
-- Name: postgis_noop(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_noop(geometry) RETURNS geometry
    LANGUAGE c STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_noop';


ALTER FUNCTION public.postgis_noop(geometry) OWNER TO postgres;

--
-- Name: postgis_proj_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_proj_version() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_proj_version';


ALTER FUNCTION public.postgis_proj_version() OWNER TO postgres;

--
-- Name: postgis_scripts_build_date(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_scripts_build_date() RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$SELECT '2010-09-30 02:44:42'::text AS version$$;


ALTER FUNCTION public.postgis_scripts_build_date() OWNER TO postgres;

--
-- Name: postgis_scripts_installed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_scripts_installed() RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$SELECT '1.5 r5976'::text AS version$$;


ALTER FUNCTION public.postgis_scripts_installed() OWNER TO postgres;

--
-- Name: postgis_scripts_released(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_scripts_released() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_scripts_released';


ALTER FUNCTION public.postgis_scripts_released() OWNER TO postgres;

--
-- Name: postgis_transform_geometry(geometry, text, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_transform_geometry(geometry, text, text, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'transform_geom';


ALTER FUNCTION public.postgis_transform_geometry(geometry, text, text, integer) OWNER TO postgres;

--
-- Name: postgis_uses_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_uses_stats() RETURNS boolean
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_uses_stats';


ALTER FUNCTION public.postgis_uses_stats() OWNER TO postgres;

--
-- Name: postgis_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION postgis_version() RETURNS text
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'postgis_version';


ALTER FUNCTION public.postgis_version() OWNER TO postgres;

--
-- Name: probe_geometry_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION probe_geometry_columns() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
	inserted integer;
	oldcount integer;
	probed integer;
	stale integer;
BEGIN

	SELECT count(*) INTO oldcount FROM geometry_columns;

	SELECT count(*) INTO probed
		FROM pg_class c, pg_attribute a, pg_type t,
			pg_namespace n,
			pg_constraint sridcheck, pg_constraint typecheck

		WHERE t.typname = 'geometry'
		AND a.atttypid = t.oid
		AND a.attrelid = c.oid
		AND c.relnamespace = n.oid
		AND sridcheck.connamespace = n.oid
		AND typecheck.connamespace = n.oid
		AND sridcheck.conrelid = c.oid
		AND sridcheck.consrc LIKE '(srid('||a.attname||') = %)'
		AND typecheck.conrelid = c.oid
		AND typecheck.consrc LIKE
		'((geometrytype('||a.attname||') = ''%''::text) OR (% IS NULL))'
		;

	INSERT INTO geometry_columns SELECT
		''::varchar as f_table_catalogue,
		n.nspname::varchar as f_table_schema,
		c.relname::varchar as f_table_name,
		a.attname::varchar as f_geometry_column,
		2 as coord_dimension,
		trim(both  ' =)' from
			replace(replace(split_part(
				sridcheck.consrc, ' = ', 2), ')', ''), '(', ''))::integer AS srid,
		trim(both ' =)''' from substr(typecheck.consrc,
			strpos(typecheck.consrc, '='),
			strpos(typecheck.consrc, '::')-
			strpos(typecheck.consrc, '=')
			))::varchar as type
		FROM pg_class c, pg_attribute a, pg_type t,
			pg_namespace n,
			pg_constraint sridcheck, pg_constraint typecheck
		WHERE t.typname = 'geometry'
		AND a.atttypid = t.oid
		AND a.attrelid = c.oid
		AND c.relnamespace = n.oid
		AND sridcheck.connamespace = n.oid
		AND typecheck.connamespace = n.oid
		AND sridcheck.conrelid = c.oid
		AND sridcheck.consrc LIKE '(st_srid('||a.attname||') = %)'
		AND typecheck.conrelid = c.oid
		AND typecheck.consrc LIKE
		'((geometrytype('||a.attname||') = ''%''::text) OR (% IS NULL))'

			AND NOT EXISTS (
					SELECT oid FROM geometry_columns gc
					WHERE c.relname::varchar = gc.f_table_name
					AND n.nspname::varchar = gc.f_table_schema
					AND a.attname::varchar = gc.f_geometry_column
			);

	GET DIAGNOSTICS inserted = ROW_COUNT;

	IF oldcount > probed THEN
		stale = oldcount-probed;
	ELSE
		stale = 0;
	END IF;

	RETURN 'probed:'||probed::text||
		' inserted:'||inserted::text||
		' conflicts:'||(probed-inserted)::text||
		' stale:'||stale::text;
END

$$;


ALTER FUNCTION public.probe_geometry_columns() OWNER TO postgres;

--
-- Name: relate(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION relate(geometry, geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'relate_full';


ALTER FUNCTION public.relate(geometry, geometry) OWNER TO postgres;

--
-- Name: relate(geometry, geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION relate(geometry, geometry, text) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'relate_pattern';


ALTER FUNCTION public.relate(geometry, geometry, text) OWNER TO postgres;

--
-- Name: removepoint(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION removepoint(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_removepoint';


ALTER FUNCTION public.removepoint(geometry, integer) OWNER TO postgres;

--
-- Name: rename_geometry_table_constraints(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION rename_geometry_table_constraints() RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT 'rename_geometry_table_constraint() is obsoleted'::text
$$;


ALTER FUNCTION public.rename_geometry_table_constraints() OWNER TO postgres;

--
-- Name: reverse(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION reverse(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_reverse';


ALTER FUNCTION public.reverse(geometry) OWNER TO postgres;

--
-- Name: rotate(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION rotate(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT rotateZ($1, $2)$_$;


ALTER FUNCTION public.rotate(geometry, double precision) OWNER TO postgres;

--
-- Name: rotatex(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION rotatex(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1, 1, 0, 0, 0, cos($2), -sin($2), 0, sin($2), cos($2), 0, 0, 0)$_$;


ALTER FUNCTION public.rotatex(geometry, double precision) OWNER TO postgres;

--
-- Name: rotatey(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION rotatey(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  cos($2), 0, sin($2),  0, 1, 0,  -sin($2), 0, cos($2), 0,  0, 0)$_$;


ALTER FUNCTION public.rotatey(geometry, double precision) OWNER TO postgres;

--
-- Name: rotatez(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION rotatez(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  cos($2), -sin($2), 0,  sin($2), cos($2), 0,  0, 0, 1,  0, 0, 0)$_$;


ALTER FUNCTION public.rotatez(geometry, double precision) OWNER TO postgres;

--
-- Name: scale(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION scale(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT scale($1, $2, $3, 1)$_$;


ALTER FUNCTION public.scale(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: scale(geometry, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION scale(geometry, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  $2, 0, 0,  0, $3, 0,  0, 0, $4,  0, 0, 0)$_$;


ALTER FUNCTION public.scale(geometry, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: se_envelopesintersect(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_envelopesintersect(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ 
	SELECT $1 && $2
	$_$;


ALTER FUNCTION public.se_envelopesintersect(geometry, geometry) OWNER TO postgres;

--
-- Name: se_is3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_is3d(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_hasz';


ALTER FUNCTION public.se_is3d(geometry) OWNER TO postgres;

--
-- Name: se_ismeasured(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_ismeasured(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_hasm';


ALTER FUNCTION public.se_ismeasured(geometry) OWNER TO postgres;

--
-- Name: se_locatealong(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_locatealong(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT locate_between_measures($1, $2, $2) $_$;


ALTER FUNCTION public.se_locatealong(geometry, double precision) OWNER TO postgres;

--
-- Name: se_locatebetween(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_locatebetween(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_locate_between_m';


ALTER FUNCTION public.se_locatebetween(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: se_m(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_m(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_m_point';


ALTER FUNCTION public.se_m(geometry) OWNER TO postgres;

--
-- Name: se_z(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION se_z(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_z_point';


ALTER FUNCTION public.se_z(geometry) OWNER TO postgres;

--
-- Name: segmentize(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION segmentize(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_segmentize2d';


ALTER FUNCTION public.segmentize(geometry, double precision) OWNER TO postgres;

--
-- Name: setfactor(chip, real); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION setfactor(chip, real) RETURNS chip
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_setFactor';


ALTER FUNCTION public.setfactor(chip, real) OWNER TO postgres;

--
-- Name: setpoint(geometry, integer, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION setpoint(geometry, integer, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_setpoint_linestring';


ALTER FUNCTION public.setpoint(geometry, integer, geometry) OWNER TO postgres;

--
-- Name: setsrid(chip, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION setsrid(chip, integer) RETURNS chip
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_setSRID';


ALTER FUNCTION public.setsrid(chip, integer) OWNER TO postgres;

--
-- Name: setsrid(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION setsrid(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_setSRID';


ALTER FUNCTION public.setsrid(geometry, integer) OWNER TO postgres;

--
-- Name: shift_longitude(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION shift_longitude(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_longitude_shift';


ALTER FUNCTION public.shift_longitude(geometry) OWNER TO postgres;

--
-- Name: simplify(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION simplify(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_simplify2d';


ALTER FUNCTION public.simplify(geometry, double precision) OWNER TO postgres;

--
-- Name: snaptogrid(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION snaptogrid(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT SnapToGrid($1, 0, 0, $2, $2)$_$;


ALTER FUNCTION public.snaptogrid(geometry, double precision) OWNER TO postgres;

--
-- Name: snaptogrid(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION snaptogrid(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT SnapToGrid($1, 0, 0, $2, $3)$_$;


ALTER FUNCTION public.snaptogrid(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: snaptogrid(geometry, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION snaptogrid(geometry, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_snaptogrid';


ALTER FUNCTION public.snaptogrid(geometry, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_snaptogrid_pointoff';


ALTER FUNCTION public.snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: srid(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION srid(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getSRID';


ALTER FUNCTION public.srid(chip) OWNER TO postgres;

--
-- Name: srid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION srid(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_getSRID';


ALTER FUNCTION public.srid(geometry) OWNER TO postgres;

--
-- Name: st_addmeasure(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_addmeasure(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ST_AddMeasure';


ALTER FUNCTION public.st_addmeasure(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_addpoint(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_addpoint(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_addpoint';


ALTER FUNCTION public.st_addpoint(geometry, geometry) OWNER TO postgres;

--
-- Name: st_addpoint(geometry, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_addpoint(geometry, geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_addpoint';


ALTER FUNCTION public.st_addpoint(geometry, geometry, integer) OWNER TO postgres;

--
-- Name: st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  $2, $3, 0,  $4, $5, 0,  0, 0, 1,  $6, $7, 0)$_$;


ALTER FUNCTION public.st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_affine';


ALTER FUNCTION public.st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_area(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_area(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_area_polygon';


ALTER FUNCTION public.st_area(geometry) OWNER TO postgres;

--
-- Name: st_area(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_area(geography) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_Area($1, true)$_$;


ALTER FUNCTION public.st_area(geography) OWNER TO postgres;

--
-- Name: st_area(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_area(text) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_Area($1::geometry);  $_$;


ALTER FUNCTION public.st_area(text) OWNER TO postgres;

--
-- Name: st_area(geography, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_area(geography, boolean) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'geography_area';


ALTER FUNCTION public.st_area(geography, boolean) OWNER TO postgres;

--
-- Name: st_area2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_area2d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_area_polygon';


ALTER FUNCTION public.st_area2d(geometry) OWNER TO postgres;

--
-- Name: st_asbinary(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asbinary(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asBinary';


ALTER FUNCTION public.st_asbinary(geometry) OWNER TO postgres;

--
-- Name: st_asbinary(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asbinary(geography) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_binary';


ALTER FUNCTION public.st_asbinary(geography) OWNER TO postgres;

--
-- Name: st_asbinary(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asbinary(text) RETURNS bytea
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_AsBinary($1::geometry);  $_$;


ALTER FUNCTION public.st_asbinary(text) OWNER TO postgres;

--
-- Name: st_asbinary(geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asbinary(geometry, text) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asBinary';


ALTER FUNCTION public.st_asbinary(geometry, text) OWNER TO postgres;

--
-- Name: st_asewkb(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asewkb(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'WKBFromLWGEOM';


ALTER FUNCTION public.st_asewkb(geometry) OWNER TO postgres;

--
-- Name: st_asewkb(geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asewkb(geometry, text) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'WKBFromLWGEOM';


ALTER FUNCTION public.st_asewkb(geometry, text) OWNER TO postgres;

--
-- Name: st_asewkt(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asewkt(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asEWKT';


ALTER FUNCTION public.st_asewkt(geometry) OWNER TO postgres;

--
-- Name: st_asgeojson(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson(1, $1, 15, 0)$_$;


ALTER FUNCTION public.st_asgeojson(geometry) OWNER TO postgres;

--
-- Name: st_asgeojson(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(geography) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson(1, $1, 15, 0)$_$;


ALTER FUNCTION public.st_asgeojson(geography) OWNER TO postgres;

--
-- Name: st_asgeojson(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_AsGeoJson($1::geometry);  $_$;


ALTER FUNCTION public.st_asgeojson(text) OWNER TO postgres;

--
-- Name: st_asgeojson(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson(1, $1, $2, 0)$_$;


ALTER FUNCTION public.st_asgeojson(geometry, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(integer, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(integer, geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson($1, $2, 15, 0)$_$;


ALTER FUNCTION public.st_asgeojson(integer, geometry) OWNER TO postgres;

--
-- Name: st_asgeojson(geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(geography, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson(1, $1, $2, 0)$_$;


ALTER FUNCTION public.st_asgeojson(geography, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(integer, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(integer, geography) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson($1, $2, 15, 0)$_$;


ALTER FUNCTION public.st_asgeojson(integer, geography) OWNER TO postgres;

--
-- Name: st_asgeojson(integer, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(integer, geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson($1, $2, $3, 0)$_$;


ALTER FUNCTION public.st_asgeojson(integer, geometry, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(geometry, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson(1, $1, $2, $3)$_$;


ALTER FUNCTION public.st_asgeojson(geometry, integer, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(integer, geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(integer, geography, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson($1, $2, $3, 0)$_$;


ALTER FUNCTION public.st_asgeojson(integer, geography, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(geography, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson(1, $1, $2, $3)$_$;


ALTER FUNCTION public.st_asgeojson(geography, integer, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(integer, geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(integer, geometry, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson($1, $2, $3, $4)$_$;


ALTER FUNCTION public.st_asgeojson(integer, geometry, integer, integer) OWNER TO postgres;

--
-- Name: st_asgeojson(integer, geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgeojson(integer, geography, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGeoJson($1, $2, $3, $4)$_$;


ALTER FUNCTION public.st_asgeojson(integer, geography, integer, integer) OWNER TO postgres;

--
-- Name: st_asgml(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, 15, 0)$_$;


ALTER FUNCTION public.st_asgml(geometry) OWNER TO postgres;

--
-- Name: st_asgml(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(geography) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, 15, 0)$_$;


ALTER FUNCTION public.st_asgml(geography) OWNER TO postgres;

--
-- Name: st_asgml(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_AsGML($1::geometry);  $_$;


ALTER FUNCTION public.st_asgml(text) OWNER TO postgres;

--
-- Name: st_asgml(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, $2, 0)$_$;


ALTER FUNCTION public.st_asgml(geometry, integer) OWNER TO postgres;

--
-- Name: st_asgml(integer, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(integer, geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML($1, $2, 15, 0)$_$;


ALTER FUNCTION public.st_asgml(integer, geometry) OWNER TO postgres;

--
-- Name: st_asgml(geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(geography, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, $2, 0)$_$;


ALTER FUNCTION public.st_asgml(geography, integer) OWNER TO postgres;

--
-- Name: st_asgml(integer, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(integer, geography) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML($1, $2, 15, 0)$_$;


ALTER FUNCTION public.st_asgml(integer, geography) OWNER TO postgres;

--
-- Name: st_asgml(integer, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(integer, geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML($1, $2, $3, 0)$_$;


ALTER FUNCTION public.st_asgml(integer, geometry, integer) OWNER TO postgres;

--
-- Name: st_asgml(geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(geometry, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, $2, $3)$_$;


ALTER FUNCTION public.st_asgml(geometry, integer, integer) OWNER TO postgres;

--
-- Name: st_asgml(integer, geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(integer, geography, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML($1, $2, $3, 0)$_$;


ALTER FUNCTION public.st_asgml(integer, geography, integer) OWNER TO postgres;

--
-- Name: st_asgml(geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(geography, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML(2, $1, $2, $3)$_$;


ALTER FUNCTION public.st_asgml(geography, integer, integer) OWNER TO postgres;

--
-- Name: st_asgml(integer, geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(integer, geometry, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML($1, $2, $3, $4)$_$;


ALTER FUNCTION public.st_asgml(integer, geometry, integer, integer) OWNER TO postgres;

--
-- Name: st_asgml(integer, geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_asgml(integer, geography, integer, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsGML($1, $2, $3, $4)$_$;


ALTER FUNCTION public.st_asgml(integer, geography, integer, integer) OWNER TO postgres;

--
-- Name: st_ashexewkb(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_ashexewkb(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asHEXEWKB';


ALTER FUNCTION public.st_ashexewkb(geometry) OWNER TO postgres;

--
-- Name: st_ashexewkb(geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_ashexewkb(geometry, text) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asHEXEWKB';


ALTER FUNCTION public.st_ashexewkb(geometry, text) OWNER TO postgres;

--
-- Name: st_askml(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML(2, ST_Transform($1,4326), 15)$_$;


ALTER FUNCTION public.st_askml(geometry) OWNER TO postgres;

--
-- Name: st_askml(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(geography) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML(2, $1, 15)$_$;


ALTER FUNCTION public.st_askml(geography) OWNER TO postgres;

--
-- Name: st_askml(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_AsKML($1::geometry);  $_$;


ALTER FUNCTION public.st_askml(text) OWNER TO postgres;

--
-- Name: st_askml(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML(2, ST_Transform($1,4326), $2)$_$;


ALTER FUNCTION public.st_askml(geometry, integer) OWNER TO postgres;

--
-- Name: st_askml(integer, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(integer, geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML($1, ST_Transform($2,4326), 15)$_$;


ALTER FUNCTION public.st_askml(integer, geometry) OWNER TO postgres;

--
-- Name: st_askml(geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(geography, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML(2, $1, $2)$_$;


ALTER FUNCTION public.st_askml(geography, integer) OWNER TO postgres;

--
-- Name: st_askml(integer, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(integer, geography) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML($1, $2, 15)$_$;


ALTER FUNCTION public.st_askml(integer, geography) OWNER TO postgres;

--
-- Name: st_askml(integer, geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(integer, geometry, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML($1, ST_Transform($2,4326), $3)$_$;


ALTER FUNCTION public.st_askml(integer, geometry, integer) OWNER TO postgres;

--
-- Name: st_askml(integer, geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_askml(integer, geography, integer) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_AsKML($1, $2, $3)$_$;


ALTER FUNCTION public.st_askml(integer, geography, integer) OWNER TO postgres;

--
-- Name: st_assvg(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'assvg_geometry';


ALTER FUNCTION public.st_assvg(geometry) OWNER TO postgres;

--
-- Name: st_assvg(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(geography) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_svg';


ALTER FUNCTION public.st_assvg(geography) OWNER TO postgres;

--
-- Name: st_assvg(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_AsSVG($1::geometry);  $_$;


ALTER FUNCTION public.st_assvg(text) OWNER TO postgres;

--
-- Name: st_assvg(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(geometry, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'assvg_geometry';


ALTER FUNCTION public.st_assvg(geometry, integer) OWNER TO postgres;

--
-- Name: st_assvg(geography, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(geography, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_svg';


ALTER FUNCTION public.st_assvg(geography, integer) OWNER TO postgres;

--
-- Name: st_assvg(geometry, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(geometry, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'assvg_geometry';


ALTER FUNCTION public.st_assvg(geometry, integer, integer) OWNER TO postgres;

--
-- Name: st_assvg(geography, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_assvg(geography, integer, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_svg';


ALTER FUNCTION public.st_assvg(geography, integer, integer) OWNER TO postgres;

--
-- Name: st_astext(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_astext(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_asText';


ALTER FUNCTION public.st_astext(geometry) OWNER TO postgres;

--
-- Name: st_astext(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_astext(geography) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_as_text';


ALTER FUNCTION public.st_astext(geography) OWNER TO postgres;

--
-- Name: st_astext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_astext(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_AsText($1::geometry);  $_$;


ALTER FUNCTION public.st_astext(text) OWNER TO postgres;

--
-- Name: st_azimuth(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_azimuth(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_azimuth';


ALTER FUNCTION public.st_azimuth(geometry, geometry) OWNER TO postgres;

--
-- Name: st_bdmpolyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_bdmpolyfromtext(text, integer) RETURNS geometry
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	geomtext alias for $1;
	srid alias for $2;
	mline geometry;
	geom geometry;
BEGIN
	mline := ST_MultiLineStringFromText(geomtext, srid);

	IF mline IS NULL
	THEN
		RAISE EXCEPTION 'Input is not a MultiLinestring';
	END IF;

	geom := multi(ST_BuildArea(mline));

	RETURN geom;
END;
$_$;


ALTER FUNCTION public.st_bdmpolyfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_bdpolyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_bdpolyfromtext(text, integer) RETURNS geometry
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	geomtext alias for $1;
	srid alias for $2;
	mline geometry;
	geom geometry;
BEGIN
	mline := ST_MultiLineStringFromText(geomtext, srid);

	IF mline IS NULL
	THEN
		RAISE EXCEPTION 'Input is not a MultiLinestring';
	END IF;

	geom := ST_BuildArea(mline);

	IF GeometryType(geom) != 'POLYGON'
	THEN
		RAISE EXCEPTION 'Input returns more then a single polygon, try using BdMPolyFromText instead';
	END IF;

	RETURN geom;
END;
$_$;


ALTER FUNCTION public.st_bdpolyfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_boundary(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_boundary(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'boundary';


ALTER FUNCTION public.st_boundary(geometry) OWNER TO postgres;

--
-- Name: st_box(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box(geometry) RETURNS box
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX';


ALTER FUNCTION public.st_box(geometry) OWNER TO postgres;

--
-- Name: st_box(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box(box3d) RETURNS box
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_BOX';


ALTER FUNCTION public.st_box(box3d) OWNER TO postgres;

--
-- Name: st_box2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box2d(geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX2DFLOAT4';


ALTER FUNCTION public.st_box2d(geometry) OWNER TO postgres;

--
-- Name: st_box2d(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box2d(box3d) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_BOX2DFLOAT4';


ALTER FUNCTION public.st_box2d(box3d) OWNER TO postgres;

--
-- Name: st_box2d(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box2d(box3d_extent) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_BOX2DFLOAT4';


ALTER FUNCTION public.st_box2d(box3d_extent) OWNER TO postgres;

--
-- Name: st_box2d_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box2d_in(cstring) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_in';


ALTER FUNCTION public.st_box2d_in(cstring) OWNER TO postgres;

--
-- Name: st_box2d_out(box2d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box2d_out(box2d) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_out';


ALTER FUNCTION public.st_box2d_out(box2d) OWNER TO postgres;

--
-- Name: st_box3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box3d(geometry) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_BOX3D';


ALTER FUNCTION public.st_box3d(geometry) OWNER TO postgres;

--
-- Name: st_box3d(box2d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box3d(box2d) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_to_BOX3D';


ALTER FUNCTION public.st_box3d(box2d) OWNER TO postgres;

--
-- Name: st_box3d_extent(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box3d_extent(box3d_extent) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_extent_to_BOX3D';


ALTER FUNCTION public.st_box3d_extent(box3d_extent) OWNER TO postgres;

--
-- Name: st_box3d_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box3d_in(cstring) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_in';


ALTER FUNCTION public.st_box3d_in(cstring) OWNER TO postgres;

--
-- Name: st_box3d_out(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_box3d_out(box3d) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_out';


ALTER FUNCTION public.st_box3d_out(box3d) OWNER TO postgres;

--
-- Name: st_buffer(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_buffer(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'buffer';


ALTER FUNCTION public.st_buffer(geometry, double precision) OWNER TO postgres;

--
-- Name: st_buffer(geography, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_buffer(geography, double precision) RETURNS geography
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT geography(ST_Transform(ST_Buffer(ST_Transform(geometry($1), _ST_BestSRID($1)), $2), 4326))$_$;


ALTER FUNCTION public.st_buffer(geography, double precision) OWNER TO postgres;

--
-- Name: st_buffer(text, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_buffer(text, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_Buffer($1::geometry, $2);  $_$;


ALTER FUNCTION public.st_buffer(text, double precision) OWNER TO postgres;

--
-- Name: st_buffer(geometry, double precision, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_buffer(geometry, double precision, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT _ST_Buffer($1, $2,
		CAST('quad_segs='||CAST($3 AS text) as cstring))
	   $_$;


ALTER FUNCTION public.st_buffer(geometry, double precision, integer) OWNER TO postgres;

--
-- Name: st_buffer(geometry, double precision, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_buffer(geometry, double precision, text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT _ST_Buffer($1, $2,
		CAST( regexp_replace($3, '^[0123456789]+$',
			'quad_segs='||$3) AS cstring)
		)
	   $_$;


ALTER FUNCTION public.st_buffer(geometry, double precision, text) OWNER TO postgres;

--
-- Name: st_buildarea(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_buildarea(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_buildarea';


ALTER FUNCTION public.st_buildarea(geometry) OWNER TO postgres;

--
-- Name: st_bytea(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_bytea(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_bytea';


ALTER FUNCTION public.st_bytea(geometry) OWNER TO postgres;

--
-- Name: st_centroid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_centroid(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'centroid';


ALTER FUNCTION public.st_centroid(geometry) OWNER TO postgres;

--
-- Name: st_chip_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_chip_in(cstring) RETURNS chip
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_in';


ALTER FUNCTION public.st_chip_in(cstring) OWNER TO postgres;

--
-- Name: st_chip_out(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_chip_out(chip) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_out';


ALTER FUNCTION public.st_chip_out(chip) OWNER TO postgres;

--
-- Name: st_closestpoint(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_closestpoint(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_closestpoint';


ALTER FUNCTION public.st_closestpoint(geometry, geometry) OWNER TO postgres;

--
-- Name: st_collect(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_collect(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_collect_garray';


ALTER FUNCTION public.st_collect(geometry[]) OWNER TO postgres;

--
-- Name: st_collect(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_collect(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'LWGEOM_collect';


ALTER FUNCTION public.st_collect(geometry, geometry) OWNER TO postgres;

--
-- Name: st_collectionextract(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_collectionextract(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ST_CollectionExtract';


ALTER FUNCTION public.st_collectionextract(geometry, integer) OWNER TO postgres;

--
-- Name: st_combine_bbox(box2d, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_combine_bbox(box2d, geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_combine';


ALTER FUNCTION public.st_combine_bbox(box2d, geometry) OWNER TO postgres;

--
-- Name: st_combine_bbox(box3d_extent, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_combine_bbox(box3d_extent, geometry) RETURNS box3d_extent
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'BOX3D_combine';


ALTER FUNCTION public.st_combine_bbox(box3d_extent, geometry) OWNER TO postgres;

--
-- Name: st_combine_bbox(box3d, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_combine_bbox(box3d, geometry) RETURNS box3d
    LANGUAGE c IMMUTABLE
    AS '$libdir/postgis-1.5', 'BOX3D_combine';


ALTER FUNCTION public.st_combine_bbox(box3d, geometry) OWNER TO postgres;

--
-- Name: st_compression(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_compression(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getCompression';


ALTER FUNCTION public.st_compression(chip) OWNER TO postgres;

--
-- Name: st_contains(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_contains(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Contains($1,$2)$_$;


ALTER FUNCTION public.st_contains(geometry, geometry) OWNER TO postgres;

--
-- Name: st_containsproperly(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_containsproperly(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_ContainsProperly($1,$2)$_$;


ALTER FUNCTION public.st_containsproperly(geometry, geometry) OWNER TO postgres;

--
-- Name: st_convexhull(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_convexhull(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'convexhull';


ALTER FUNCTION public.st_convexhull(geometry) OWNER TO postgres;

--
-- Name: st_coorddim(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_coorddim(geometry) RETURNS smallint
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_ndims';


ALTER FUNCTION public.st_coorddim(geometry) OWNER TO postgres;

--
-- Name: st_coveredby(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_coveredby(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_CoveredBy($1,$2)$_$;


ALTER FUNCTION public.st_coveredby(geometry, geometry) OWNER TO postgres;

--
-- Name: st_coveredby(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_coveredby(geography, geography) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Covers($2, $1)$_$;


ALTER FUNCTION public.st_coveredby(geography, geography) OWNER TO postgres;

--
-- Name: st_coveredby(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_coveredby(text, text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT ST_CoveredBy($1::geometry, $2::geometry);  $_$;


ALTER FUNCTION public.st_coveredby(text, text) OWNER TO postgres;

--
-- Name: st_covers(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_covers(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Covers($1,$2)$_$;


ALTER FUNCTION public.st_covers(geometry, geometry) OWNER TO postgres;

--
-- Name: st_covers(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_covers(geography, geography) RETURNS boolean
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT $1 && $2 AND _ST_Covers($1, $2)$_$;


ALTER FUNCTION public.st_covers(geography, geography) OWNER TO postgres;

--
-- Name: st_covers(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_covers(text, text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT ST_Covers($1::geometry, $2::geometry);  $_$;


ALTER FUNCTION public.st_covers(text, text) OWNER TO postgres;

--
-- Name: st_crosses(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_crosses(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Crosses($1,$2)$_$;


ALTER FUNCTION public.st_crosses(geometry, geometry) OWNER TO postgres;

--
-- Name: st_curvetoline(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_curvetoline(geometry) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_CurveToLine($1, 32)$_$;


ALTER FUNCTION public.st_curvetoline(geometry) OWNER TO postgres;

--
-- Name: st_curvetoline(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_curvetoline(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_curve_segmentize';


ALTER FUNCTION public.st_curvetoline(geometry, integer) OWNER TO postgres;

--
-- Name: st_datatype(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_datatype(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getDatatype';


ALTER FUNCTION public.st_datatype(chip) OWNER TO postgres;

--
-- Name: st_dfullywithin(geometry, geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dfullywithin(geometry, geometry, double precision) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && ST_Expand($2,$3) AND $2 && ST_Expand($1,$3) AND _ST_DFullyWithin(ST_ConvexHull($1), ST_ConvexHull($2), $3)$_$;


ALTER FUNCTION public.st_dfullywithin(geometry, geometry, double precision) OWNER TO postgres;

--
-- Name: st_difference(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_difference(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'difference';


ALTER FUNCTION public.st_difference(geometry, geometry) OWNER TO postgres;

--
-- Name: st_dimension(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dimension(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dimension';


ALTER FUNCTION public.st_dimension(geometry) OWNER TO postgres;

--
-- Name: st_disjoint(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_disjoint(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'disjoint';


ALTER FUNCTION public.st_disjoint(geometry, geometry) OWNER TO postgres;

--
-- Name: st_distance(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_distance(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_mindistance2d';


ALTER FUNCTION public.st_distance(geometry, geometry) OWNER TO postgres;

--
-- Name: st_distance(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_distance(geography, geography) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_Distance($1, $2, 0.0, true)$_$;


ALTER FUNCTION public.st_distance(geography, geography) OWNER TO postgres;

--
-- Name: st_distance(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_distance(text, text) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_Distance($1::geometry, $2::geometry);  $_$;


ALTER FUNCTION public.st_distance(text, text) OWNER TO postgres;

--
-- Name: st_distance(geography, geography, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_distance(geography, geography, boolean) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_Distance($1, $2, 0.0, $3)$_$;


ALTER FUNCTION public.st_distance(geography, geography, boolean) OWNER TO postgres;

--
-- Name: st_distance_sphere(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_distance_sphere(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_distance_sphere';


ALTER FUNCTION public.st_distance_sphere(geometry, geometry) OWNER TO postgres;

--
-- Name: st_distance_spheroid(geometry, geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_distance_spheroid(geometry, geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_distance_ellipsoid';


ALTER FUNCTION public.st_distance_spheroid(geometry, geometry, spheroid) OWNER TO postgres;

--
-- Name: st_dump(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dump(geometry) RETURNS SETOF geometry_dump
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dump';


ALTER FUNCTION public.st_dump(geometry) OWNER TO postgres;

--
-- Name: st_dumppoints(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dumppoints(geometry) RETURNS SETOF geometry_dump
    LANGUAGE sql
    AS $_$
  SELECT * FROM _ST_DumpPoints($1, NULL);
$_$;


ALTER FUNCTION public.st_dumppoints(geometry) OWNER TO postgres;

--
-- Name: st_dumprings(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dumprings(geometry) RETURNS SETOF geometry_dump
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_dump_rings';


ALTER FUNCTION public.st_dumprings(geometry) OWNER TO postgres;

--
-- Name: st_dwithin(geometry, geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dwithin(geometry, geometry, double precision) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && ST_Expand($2,$3) AND $2 && ST_Expand($1,$3) AND _ST_DWithin($1, $2, $3)$_$;


ALTER FUNCTION public.st_dwithin(geometry, geometry, double precision) OWNER TO postgres;

--
-- Name: st_dwithin(geography, geography, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dwithin(geography, geography, double precision) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && _ST_Expand($2,$3) AND $2 && _ST_Expand($1,$3) AND _ST_DWithin($1, $2, $3, true)$_$;


ALTER FUNCTION public.st_dwithin(geography, geography, double precision) OWNER TO postgres;

--
-- Name: st_dwithin(text, text, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dwithin(text, text, double precision) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT ST_DWithin($1::geometry, $2::geometry, $3);  $_$;


ALTER FUNCTION public.st_dwithin(text, text, double precision) OWNER TO postgres;

--
-- Name: st_dwithin(geography, geography, double precision, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_dwithin(geography, geography, double precision, boolean) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && _ST_Expand($2,$3) AND $2 && _ST_Expand($1,$3) AND _ST_DWithin($1, $2, $3, $4)$_$;


ALTER FUNCTION public.st_dwithin(geography, geography, double precision, boolean) OWNER TO postgres;

--
-- Name: st_endpoint(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_endpoint(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_endpoint_linestring';


ALTER FUNCTION public.st_endpoint(geometry) OWNER TO postgres;

--
-- Name: st_envelope(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_envelope(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_envelope';


ALTER FUNCTION public.st_envelope(geometry) OWNER TO postgres;

--
-- Name: st_equals(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_equals(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Equals($1,$2)$_$;


ALTER FUNCTION public.st_equals(geometry, geometry) OWNER TO postgres;

--
-- Name: st_estimated_extent(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_estimated_extent(text, text) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT SECURITY DEFINER
    AS '$libdir/postgis-1.5', 'LWGEOM_estimated_extent';


ALTER FUNCTION public.st_estimated_extent(text, text) OWNER TO postgres;

--
-- Name: st_estimated_extent(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_estimated_extent(text, text, text) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT SECURITY DEFINER
    AS '$libdir/postgis-1.5', 'LWGEOM_estimated_extent';


ALTER FUNCTION public.st_estimated_extent(text, text, text) OWNER TO postgres;

--
-- Name: st_expand(box3d, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_expand(box3d, double precision) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_expand';


ALTER FUNCTION public.st_expand(box3d, double precision) OWNER TO postgres;

--
-- Name: st_expand(box2d, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_expand(box2d, double precision) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_expand';


ALTER FUNCTION public.st_expand(box2d, double precision) OWNER TO postgres;

--
-- Name: st_expand(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_expand(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_expand';


ALTER FUNCTION public.st_expand(geometry, double precision) OWNER TO postgres;

--
-- Name: st_exteriorring(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_exteriorring(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_exteriorring_polygon';


ALTER FUNCTION public.st_exteriorring(geometry) OWNER TO postgres;

--
-- Name: st_factor(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_factor(chip) RETURNS real
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getFactor';


ALTER FUNCTION public.st_factor(chip) OWNER TO postgres;

--
-- Name: st_find_extent(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_find_extent(text, text) RETURNS box2d
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	tablename alias for $1;
	columnname alias for $2;
	myrec RECORD;

BEGIN
	FOR myrec IN EXECUTE 'SELECT extent("' || columnname || '") FROM "' || tablename || '"' LOOP
		return myrec.extent;
	END LOOP;
END;
$_$;


ALTER FUNCTION public.st_find_extent(text, text) OWNER TO postgres;

--
-- Name: st_find_extent(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_find_extent(text, text, text) RETURNS box2d
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
DECLARE
	schemaname alias for $1;
	tablename alias for $2;
	columnname alias for $3;
	myrec RECORD;

BEGIN
	FOR myrec IN EXECUTE 'SELECT extent("' || columnname || '") FROM "' || schemaname || '"."' || tablename || '"' LOOP
		return myrec.extent;
	END LOOP;
END;
$_$;


ALTER FUNCTION public.st_find_extent(text, text, text) OWNER TO postgres;

--
-- Name: st_force_2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_force_2d(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_2d';


ALTER FUNCTION public.st_force_2d(geometry) OWNER TO postgres;

--
-- Name: st_force_3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_force_3d(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_3dz';


ALTER FUNCTION public.st_force_3d(geometry) OWNER TO postgres;

--
-- Name: st_force_3dm(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_force_3dm(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_3dm';


ALTER FUNCTION public.st_force_3dm(geometry) OWNER TO postgres;

--
-- Name: st_force_3dz(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_force_3dz(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_3dz';


ALTER FUNCTION public.st_force_3dz(geometry) OWNER TO postgres;

--
-- Name: st_force_4d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_force_4d(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_4d';


ALTER FUNCTION public.st_force_4d(geometry) OWNER TO postgres;

--
-- Name: st_force_collection(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_force_collection(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_collection';


ALTER FUNCTION public.st_force_collection(geometry) OWNER TO postgres;

--
-- Name: st_forcerhr(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_forcerhr(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_forceRHR_poly';


ALTER FUNCTION public.st_forcerhr(geometry) OWNER TO postgres;

--
-- Name: st_geogfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geogfromtext(text) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_from_text';


ALTER FUNCTION public.st_geogfromtext(text) OWNER TO postgres;

--
-- Name: st_geogfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geogfromwkb(bytea) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_from_binary';


ALTER FUNCTION public.st_geogfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_geographyfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geographyfromtext(text) RETURNS geography
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geography_from_text';


ALTER FUNCTION public.st_geographyfromtext(text) OWNER TO postgres;

--
-- Name: st_geohash(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geohash(geometry) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_GeoHash($1, 0)$_$;


ALTER FUNCTION public.st_geohash(geometry) OWNER TO postgres;

--
-- Name: st_geohash(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geohash(geometry, integer) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ST_GeoHash';


ALTER FUNCTION public.st_geohash(geometry, integer) OWNER TO postgres;

--
-- Name: st_geomcollfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomcollfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(ST_GeomFromText($1)) = 'GEOMETRYCOLLECTION'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_geomcollfromtext(text) OWNER TO postgres;

--
-- Name: st_geomcollfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomcollfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(ST_GeomFromText($1, $2)) = 'GEOMETRYCOLLECTION'
	THEN ST_GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_geomcollfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_geomcollfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomcollfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(ST_GeomFromWKB($1)) = 'GEOMETRYCOLLECTION'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_geomcollfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_geomcollfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomcollfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromWKB($1, $2)) = 'GEOMETRYCOLLECTION'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_geomcollfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_geometry(box2d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry(box2d) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_to_LWGEOM';


ALTER FUNCTION public.st_geometry(box2d) OWNER TO postgres;

--
-- Name: st_geometry(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry(box3d) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_LWGEOM';


ALTER FUNCTION public.st_geometry(box3d) OWNER TO postgres;

--
-- Name: st_geometry(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'parse_WKT_lwgeom';


ALTER FUNCTION public.st_geometry(text) OWNER TO postgres;

--
-- Name: st_geometry(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry(chip) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_to_LWGEOM';


ALTER FUNCTION public.st_geometry(chip) OWNER TO postgres;

--
-- Name: st_geometry(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_bytea';


ALTER FUNCTION public.st_geometry(bytea) OWNER TO postgres;

--
-- Name: st_geometry(box3d_extent); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry(box3d_extent) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_to_LWGEOM';


ALTER FUNCTION public.st_geometry(box3d_extent) OWNER TO postgres;

--
-- Name: st_geometry_above(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_above(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_above';


ALTER FUNCTION public.st_geometry_above(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_analyze(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_analyze(internal) RETURNS boolean
    LANGUAGE c STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_analyze';


ALTER FUNCTION public.st_geometry_analyze(internal) OWNER TO postgres;

--
-- Name: st_geometry_below(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_below(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_below';


ALTER FUNCTION public.st_geometry_below(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_cmp(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_cmp(geometry, geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_cmp';


ALTER FUNCTION public.st_geometry_cmp(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_contain(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_contain(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_contain';


ALTER FUNCTION public.st_geometry_contain(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_contained(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_contained(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_contained';


ALTER FUNCTION public.st_geometry_contained(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_eq(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_eq(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_eq';


ALTER FUNCTION public.st_geometry_eq(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_ge(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_ge(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_ge';


ALTER FUNCTION public.st_geometry_ge(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_gt(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_gt(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_gt';


ALTER FUNCTION public.st_geometry_gt(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_in(cstring) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_in';


ALTER FUNCTION public.st_geometry_in(cstring) OWNER TO postgres;

--
-- Name: st_geometry_le(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_le(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_le';


ALTER FUNCTION public.st_geometry_le(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_left(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_left(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_left';


ALTER FUNCTION public.st_geometry_left(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_lt(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_lt(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'lwgeom_lt';


ALTER FUNCTION public.st_geometry_lt(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_out(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_out(geometry) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_out';


ALTER FUNCTION public.st_geometry_out(geometry) OWNER TO postgres;

--
-- Name: st_geometry_overabove(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_overabove(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overabove';


ALTER FUNCTION public.st_geometry_overabove(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_overbelow(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_overbelow(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overbelow';


ALTER FUNCTION public.st_geometry_overbelow(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_overlap(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_overlap(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overlap';


ALTER FUNCTION public.st_geometry_overlap(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_overleft(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_overleft(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overleft';


ALTER FUNCTION public.st_geometry_overleft(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_overright(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_overright(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_overright';


ALTER FUNCTION public.st_geometry_overright(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_recv(internal); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_recv(internal) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_recv';


ALTER FUNCTION public.st_geometry_recv(internal) OWNER TO postgres;

--
-- Name: st_geometry_right(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_right(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_right';


ALTER FUNCTION public.st_geometry_right(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_same(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_same(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_samebox';


ALTER FUNCTION public.st_geometry_same(geometry, geometry) OWNER TO postgres;

--
-- Name: st_geometry_send(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometry_send(geometry) RETURNS bytea
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_send';


ALTER FUNCTION public.st_geometry_send(geometry) OWNER TO postgres;

--
-- Name: st_geometryfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometryfromtext(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.st_geometryfromtext(text) OWNER TO postgres;

--
-- Name: st_geometryfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometryfromtext(text, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.st_geometryfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_geometryn(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometryn(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_geometryn_collection';


ALTER FUNCTION public.st_geometryn(geometry, integer) OWNER TO postgres;

--
-- Name: st_geometrytype(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geometrytype(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geometry_geometrytype';


ALTER FUNCTION public.st_geometrytype(geometry) OWNER TO postgres;

--
-- Name: st_geomfromewkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromewkb(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOMFromWKB';


ALTER FUNCTION public.st_geomfromewkb(bytea) OWNER TO postgres;

--
-- Name: st_geomfromewkt(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromewkt(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'parse_WKT_lwgeom';


ALTER FUNCTION public.st_geomfromewkt(text) OWNER TO postgres;

--
-- Name: st_geomfromgml(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromgml(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geom_from_gml';


ALTER FUNCTION public.st_geomfromgml(text) OWNER TO postgres;

--
-- Name: st_geomfromkml(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromkml(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geom_from_kml';


ALTER FUNCTION public.st_geomfromkml(text) OWNER TO postgres;

--
-- Name: st_geomfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromtext(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.st_geomfromtext(text) OWNER TO postgres;

--
-- Name: st_geomfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromtext(text, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.st_geomfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_geomfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromwkb(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_WKB';


ALTER FUNCTION public.st_geomfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_geomfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_geomfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_SetSRID(ST_GeomFromWKB($1), $2)$_$;


ALTER FUNCTION public.st_geomfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_gmltosql(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_gmltosql(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geom_from_gml';


ALTER FUNCTION public.st_gmltosql(text) OWNER TO postgres;

--
-- Name: st_hasarc(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_hasarc(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_has_arc';


ALTER FUNCTION public.st_hasarc(geometry) OWNER TO postgres;

--
-- Name: st_hausdorffdistance(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_hausdorffdistance(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'hausdorffdistance';


ALTER FUNCTION public.st_hausdorffdistance(geometry, geometry) OWNER TO postgres;

--
-- Name: st_hausdorffdistance(geometry, geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_hausdorffdistance(geometry, geometry, double precision) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'hausdorffdistancedensify';


ALTER FUNCTION public.st_hausdorffdistance(geometry, geometry, double precision) OWNER TO postgres;

--
-- Name: st_height(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_height(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getHeight';


ALTER FUNCTION public.st_height(chip) OWNER TO postgres;

--
-- Name: st_interiorringn(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_interiorringn(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_interiorringn_polygon';


ALTER FUNCTION public.st_interiorringn(geometry, integer) OWNER TO postgres;

--
-- Name: st_intersection(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_intersection(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'intersection';


ALTER FUNCTION public.st_intersection(geometry, geometry) OWNER TO postgres;

--
-- Name: st_intersection(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_intersection(geography, geography) RETURNS geography
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT geography(ST_Transform(ST_Intersection(ST_Transform(geometry($1), _ST_BestSRID($1, $2)), ST_Transform(geometry($2), _ST_BestSRID($1, $2))), 4326))$_$;


ALTER FUNCTION public.st_intersection(geography, geography) OWNER TO postgres;

--
-- Name: st_intersection(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_intersection(text, text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_Intersection($1::geometry, $2::geometry);  $_$;


ALTER FUNCTION public.st_intersection(text, text) OWNER TO postgres;

--
-- Name: st_intersects(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_intersects(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Intersects($1,$2)$_$;


ALTER FUNCTION public.st_intersects(geometry, geometry) OWNER TO postgres;

--
-- Name: st_intersects(geography, geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_intersects(geography, geography) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Distance($1, $2, 0.0, false) < 0.00001$_$;


ALTER FUNCTION public.st_intersects(geography, geography) OWNER TO postgres;

--
-- Name: st_intersects(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_intersects(text, text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT ST_Intersects($1::geometry, $2::geometry);  $_$;


ALTER FUNCTION public.st_intersects(text, text) OWNER TO postgres;

--
-- Name: st_isclosed(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_isclosed(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_isclosed_linestring';


ALTER FUNCTION public.st_isclosed(geometry) OWNER TO postgres;

--
-- Name: st_isempty(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_isempty(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_isempty';


ALTER FUNCTION public.st_isempty(geometry) OWNER TO postgres;

--
-- Name: st_isring(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_isring(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'isring';


ALTER FUNCTION public.st_isring(geometry) OWNER TO postgres;

--
-- Name: st_issimple(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_issimple(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'issimple';


ALTER FUNCTION public.st_issimple(geometry) OWNER TO postgres;

--
-- Name: st_isvalid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_isvalid(geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'isvalid';


ALTER FUNCTION public.st_isvalid(geometry) OWNER TO postgres;

--
-- Name: st_isvalidreason(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_isvalidreason(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'isvalidreason';


ALTER FUNCTION public.st_isvalidreason(geometry) OWNER TO postgres;

--
-- Name: st_length(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length2d_linestring';


ALTER FUNCTION public.st_length(geometry) OWNER TO postgres;

--
-- Name: st_length(geography); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length(geography) RETURNS double precision
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT ST_Length($1, true)$_$;


ALTER FUNCTION public.st_length(geography) OWNER TO postgres;

--
-- Name: st_length(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length(text) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT ST_Length($1::geometry);  $_$;


ALTER FUNCTION public.st_length(text) OWNER TO postgres;

--
-- Name: st_length(geography, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length(geography, boolean) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'geography_length';


ALTER FUNCTION public.st_length(geography, boolean) OWNER TO postgres;

--
-- Name: st_length2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length2d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length2d_linestring';


ALTER FUNCTION public.st_length2d(geometry) OWNER TO postgres;

--
-- Name: st_length2d_spheroid(geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length2d_spheroid(geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_length2d_ellipsoid';


ALTER FUNCTION public.st_length2d_spheroid(geometry, spheroid) OWNER TO postgres;

--
-- Name: st_length3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length3d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_length_linestring';


ALTER FUNCTION public.st_length3d(geometry) OWNER TO postgres;

--
-- Name: st_length3d_spheroid(geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length3d_spheroid(geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_length_ellipsoid_linestring';


ALTER FUNCTION public.st_length3d_spheroid(geometry, spheroid) OWNER TO postgres;

--
-- Name: st_length_spheroid(geometry, spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_length_spheroid(geometry, spheroid) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'LWGEOM_length_ellipsoid_linestring';


ALTER FUNCTION public.st_length_spheroid(geometry, spheroid) OWNER TO postgres;

--
-- Name: st_line_interpolate_point(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_line_interpolate_point(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_interpolate_point';


ALTER FUNCTION public.st_line_interpolate_point(geometry, double precision) OWNER TO postgres;

--
-- Name: st_line_locate_point(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_line_locate_point(geometry, geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_locate_point';


ALTER FUNCTION public.st_line_locate_point(geometry, geometry) OWNER TO postgres;

--
-- Name: st_line_substring(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_line_substring(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_substring';


ALTER FUNCTION public.st_line_substring(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_linecrossingdirection(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linecrossingdirection(geometry, geometry) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT CASE WHEN NOT $1 && $2 THEN 0 ELSE _ST_LineCrossingDirection($1,$2) END $_$;


ALTER FUNCTION public.st_linecrossingdirection(geometry, geometry) OWNER TO postgres;

--
-- Name: st_linefrommultipoint(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linefrommultipoint(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_from_mpoint';


ALTER FUNCTION public.st_linefrommultipoint(geometry) OWNER TO postgres;

--
-- Name: st_linefromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linefromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1)) = 'LINESTRING'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_linefromtext(text) OWNER TO postgres;

--
-- Name: st_linefromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linefromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1, $2)) = 'LINESTRING'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_linefromtext(text, integer) OWNER TO postgres;

--
-- Name: st_linefromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linefromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'LINESTRING'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_linefromwkb(bytea) OWNER TO postgres;

--
-- Name: st_linefromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linefromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'LINESTRING'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_linefromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_linemerge(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linemerge(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'linemerge';


ALTER FUNCTION public.st_linemerge(geometry) OWNER TO postgres;

--
-- Name: st_linestringfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linestringfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'LINESTRING'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_linestringfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_linestringfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linestringfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'LINESTRING'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_linestringfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_linetocurve(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_linetocurve(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_line_desegmentize';


ALTER FUNCTION public.st_linetocurve(geometry) OWNER TO postgres;

--
-- Name: st_locate_along_measure(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_locate_along_measure(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ SELECT locate_between_measures($1, $2, $2) $_$;


ALTER FUNCTION public.st_locate_along_measure(geometry, double precision) OWNER TO postgres;

--
-- Name: st_locate_between_measures(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_locate_between_measures(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_locate_between_m';


ALTER FUNCTION public.st_locate_between_measures(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_locatebetweenelevations(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_locatebetweenelevations(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ST_LocateBetweenElevations';


ALTER FUNCTION public.st_locatebetweenelevations(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_longestline(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_longestline(geometry, geometry) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_LongestLine(ST_ConvexHull($1), ST_ConvexHull($2))$_$;


ALTER FUNCTION public.st_longestline(geometry, geometry) OWNER TO postgres;

--
-- Name: st_m(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_m(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_m_point';


ALTER FUNCTION public.st_m(geometry) OWNER TO postgres;

--
-- Name: st_makebox2d(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makebox2d(geometry, geometry) RETURNS box2d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX2DFLOAT4_construct';


ALTER FUNCTION public.st_makebox2d(geometry, geometry) OWNER TO postgres;

--
-- Name: st_makebox3d(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makebox3d(geometry, geometry) RETURNS box3d
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_construct';


ALTER FUNCTION public.st_makebox3d(geometry, geometry) OWNER TO postgres;

--
-- Name: st_makeenvelope(double precision, double precision, double precision, double precision, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ST_MakeEnvelope';


ALTER FUNCTION public.st_makeenvelope(double precision, double precision, double precision, double precision, integer) OWNER TO postgres;

--
-- Name: st_makeline(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makeline(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makeline_garray';


ALTER FUNCTION public.st_makeline(geometry[]) OWNER TO postgres;

--
-- Name: st_makeline(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makeline(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makeline';


ALTER FUNCTION public.st_makeline(geometry, geometry) OWNER TO postgres;

--
-- Name: st_makeline_garray(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makeline_garray(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makeline_garray';


ALTER FUNCTION public.st_makeline_garray(geometry[]) OWNER TO postgres;

--
-- Name: st_makepoint(double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makepoint(double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.st_makepoint(double precision, double precision) OWNER TO postgres;

--
-- Name: st_makepoint(double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makepoint(double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.st_makepoint(double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_makepoint(double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makepoint(double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.st_makepoint(double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_makepointm(double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makepointm(double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint3dm';


ALTER FUNCTION public.st_makepointm(double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_makepolygon(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makepolygon(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoly';


ALTER FUNCTION public.st_makepolygon(geometry) OWNER TO postgres;

--
-- Name: st_makepolygon(geometry, geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_makepolygon(geometry, geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoly';


ALTER FUNCTION public.st_makepolygon(geometry, geometry[]) OWNER TO postgres;

--
-- Name: st_maxdistance(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_maxdistance(geometry, geometry) RETURNS double precision
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT _ST_MaxDistance(ST_ConvexHull($1), ST_ConvexHull($2))$_$;


ALTER FUNCTION public.st_maxdistance(geometry, geometry) OWNER TO postgres;

--
-- Name: st_mem_size(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mem_size(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_mem_size';


ALTER FUNCTION public.st_mem_size(geometry) OWNER TO postgres;

--
-- Name: st_minimumboundingcircle(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_minimumboundingcircle(geometry) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_MinimumBoundingCircle($1, 48)$_$;


ALTER FUNCTION public.st_minimumboundingcircle(geometry) OWNER TO postgres;

--
-- Name: st_minimumboundingcircle(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) RETURNS geometry
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
	DECLARE
	hull GEOMETRY;
	ring GEOMETRY;
	center GEOMETRY;
	radius DOUBLE PRECISION;
	dist DOUBLE PRECISION;
	d DOUBLE PRECISION;
	idx1 integer;
	idx2 integer;
	l1 GEOMETRY;
	l2 GEOMETRY;
	p1 GEOMETRY;
	p2 GEOMETRY;
	a1 DOUBLE PRECISION;
	a2 DOUBLE PRECISION;


	BEGIN

	-- First compute the ConvexHull of the geometry
	hull = ST_ConvexHull(inputgeom);
	--A point really has no MBC
	IF ST_GeometryType(hull) = 'ST_Point' THEN
		RETURN hull;
	END IF;
	-- convert the hull perimeter to a linestring so we can manipulate individual points
	--If its already a linestring force it to a closed linestring
	ring = CASE WHEN ST_GeometryType(hull) = 'ST_LineString' THEN ST_AddPoint(hull, ST_StartPoint(hull)) ELSE ST_ExteriorRing(hull) END;

	dist = 0;
	-- Brute Force - check every pair
	FOR i in 1 .. (ST_NumPoints(ring)-2)
		LOOP
			FOR j in i .. (ST_NumPoints(ring)-1)
				LOOP
				d = ST_Distance(ST_PointN(ring,i),ST_PointN(ring,j));
				-- Check the distance and update if larger
				IF (d > dist) THEN
					dist = d;
					idx1 = i;
					idx2 = j;
				END IF;
			END LOOP;
		END LOOP;

	-- We now have the diameter of the convex hull.  The following line returns it if desired.
	-- RETURN MakeLine(PointN(ring,idx1),PointN(ring,idx2));

	-- Now for the Minimum Bounding Circle.  Since we know the two points furthest from each
	-- other, the MBC must go through those two points. Start with those points as a diameter of a circle.

	-- The radius is half the distance between them and the center is midway between them
	radius = ST_Distance(ST_PointN(ring,idx1),ST_PointN(ring,idx2)) / 2.0;
	center = ST_Line_interpolate_point(ST_MakeLine(ST_PointN(ring,idx1),ST_PointN(ring,idx2)),0.5);

	-- Loop through each vertex and check if the distance from the center to the point
	-- is greater than the current radius.
	FOR k in 1 .. (ST_NumPoints(ring)-1)
		LOOP
		IF(k <> idx1 and k <> idx2) THEN
			dist = ST_Distance(center,ST_PointN(ring,k));
			IF (dist > radius) THEN
				-- We have to expand the circle.  The new circle must pass trhough
				-- three points - the two original diameters and this point.

				-- Draw a line from the first diameter to this point
				l1 = ST_Makeline(ST_PointN(ring,idx1),ST_PointN(ring,k));
				-- Compute the midpoint
				p1 = ST_line_interpolate_point(l1,0.5);
				-- Rotate the line 90 degrees around the midpoint (perpendicular bisector)
				l1 = ST_Translate(ST_Rotate(ST_Translate(l1,-X(p1),-Y(p1)),pi()/2),X(p1),Y(p1));
				--  Compute the azimuth of the bisector
				a1 = ST_Azimuth(ST_PointN(l1,1),ST_PointN(l1,2));
				--  Extend the line in each direction the new computed distance to insure they will intersect
				l1 = ST_AddPoint(l1,ST_Makepoint(X(ST_PointN(l1,2))+sin(a1)*dist,Y(ST_PointN(l1,2))+cos(a1)*dist),-1);
				l1 = ST_AddPoint(l1,ST_Makepoint(X(ST_PointN(l1,1))-sin(a1)*dist,Y(ST_PointN(l1,1))-cos(a1)*dist),0);

				-- Repeat for the line from the point to the other diameter point
				l2 = ST_Makeline(ST_PointN(ring,idx2),ST_PointN(ring,k));
				p2 = ST_Line_interpolate_point(l2,0.5);
				l2 = ST_Translate(ST_Rotate(ST_Translate(l2,-X(p2),-Y(p2)),pi()/2),X(p2),Y(p2));
				a2 = ST_Azimuth(ST_PointN(l2,1),ST_PointN(l2,2));
				l2 = ST_AddPoint(l2,ST_Makepoint(X(ST_PointN(l2,2))+sin(a2)*dist,Y(ST_PointN(l2,2))+cos(a2)*dist),-1);
				l2 = ST_AddPoint(l2,ST_Makepoint(X(ST_PointN(l2,1))-sin(a2)*dist,Y(ST_PointN(l2,1))-cos(a2)*dist),0);

				-- The new center is the intersection of the two bisectors
				center = ST_Intersection(l1,l2);
				-- The new radius is the distance to any of the three points
				radius = ST_Distance(center,ST_PointN(ring,idx1));
			END IF;
		END IF;
		END LOOP;
	--DONE!!  Return the MBC via the buffer command
	RETURN ST_Buffer(center,radius,segs_per_quarter);

	END;
$$;


ALTER FUNCTION public.st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) OWNER TO postgres;

--
-- Name: st_mlinefromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mlinefromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1)) = 'MULTILINESTRING'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mlinefromtext(text) OWNER TO postgres;

--
-- Name: st_mlinefromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mlinefromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE
	WHEN geometrytype(GeomFromText($1, $2)) = 'MULTILINESTRING'
	THEN GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mlinefromtext(text, integer) OWNER TO postgres;

--
-- Name: st_mlinefromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mlinefromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'MULTILINESTRING'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mlinefromwkb(bytea) OWNER TO postgres;

--
-- Name: st_mlinefromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mlinefromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'MULTILINESTRING'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mlinefromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_mpointfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpointfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1)) = 'MULTIPOINT'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpointfromtext(text) OWNER TO postgres;

--
-- Name: st_mpointfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpointfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromText($1, $2)) = 'MULTIPOINT'
	THEN GeomFromText($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpointfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_mpointfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpointfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'MULTIPOINT'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpointfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_mpointfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpointfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1, $2)) = 'MULTIPOINT'
	THEN GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpointfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_mpolyfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpolyfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1)) = 'MULTIPOLYGON'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpolyfromtext(text) OWNER TO postgres;

--
-- Name: st_mpolyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpolyfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1, $2)) = 'MULTIPOLYGON'
	THEN ST_GeomFromText($1,$2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpolyfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_mpolyfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpolyfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'MULTIPOLYGON'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpolyfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_mpolyfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_mpolyfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'MULTIPOLYGON'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_mpolyfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_multi(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multi(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_force_multi';


ALTER FUNCTION public.st_multi(geometry) OWNER TO postgres;

--
-- Name: st_multilinefromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multilinefromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'MULTILINESTRING'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_multilinefromwkb(bytea) OWNER TO postgres;

--
-- Name: st_multilinestringfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multilinestringfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_MLineFromText($1)$_$;


ALTER FUNCTION public.st_multilinestringfromtext(text) OWNER TO postgres;

--
-- Name: st_multilinestringfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multilinestringfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MLineFromText($1, $2)$_$;


ALTER FUNCTION public.st_multilinestringfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_multipointfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipointfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPointFromText($1)$_$;


ALTER FUNCTION public.st_multipointfromtext(text) OWNER TO postgres;

--
-- Name: st_multipointfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipointfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'MULTIPOINT'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_multipointfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_multipointfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipointfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1,$2)) = 'MULTIPOINT'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_multipointfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_multipolyfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipolyfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'MULTIPOLYGON'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_multipolyfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_multipolyfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipolyfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'MULTIPOLYGON'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_multipolyfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_multipolygonfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipolygonfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPolyFromText($1)$_$;


ALTER FUNCTION public.st_multipolygonfromtext(text) OWNER TO postgres;

--
-- Name: st_multipolygonfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_multipolygonfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT MPolyFromText($1, $2)$_$;


ALTER FUNCTION public.st_multipolygonfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_ndims(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_ndims(geometry) RETURNS smallint
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_ndims';


ALTER FUNCTION public.st_ndims(geometry) OWNER TO postgres;

--
-- Name: st_npoints(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_npoints(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_npoints';


ALTER FUNCTION public.st_npoints(geometry) OWNER TO postgres;

--
-- Name: st_nrings(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_nrings(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_nrings';


ALTER FUNCTION public.st_nrings(geometry) OWNER TO postgres;

--
-- Name: st_numgeometries(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_numgeometries(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numgeometries_collection';


ALTER FUNCTION public.st_numgeometries(geometry) OWNER TO postgres;

--
-- Name: st_numinteriorring(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_numinteriorring(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numinteriorrings_polygon';


ALTER FUNCTION public.st_numinteriorring(geometry) OWNER TO postgres;

--
-- Name: st_numinteriorrings(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_numinteriorrings(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numinteriorrings_polygon';


ALTER FUNCTION public.st_numinteriorrings(geometry) OWNER TO postgres;

--
-- Name: st_numpoints(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_numpoints(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_numpoints_linestring';


ALTER FUNCTION public.st_numpoints(geometry) OWNER TO postgres;

--
-- Name: st_orderingequals(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_orderingequals(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ 
	SELECT $1 ~= $2 AND _ST_OrderingEquals($1, $2)
	$_$;


ALTER FUNCTION public.st_orderingequals(geometry, geometry) OWNER TO postgres;

--
-- Name: st_overlaps(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_overlaps(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Overlaps($1,$2)$_$;


ALTER FUNCTION public.st_overlaps(geometry, geometry) OWNER TO postgres;

--
-- Name: st_perimeter(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_perimeter(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_perimeter2d_poly';


ALTER FUNCTION public.st_perimeter(geometry) OWNER TO postgres;

--
-- Name: st_perimeter2d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_perimeter2d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_perimeter2d_poly';


ALTER FUNCTION public.st_perimeter2d(geometry) OWNER TO postgres;

--
-- Name: st_perimeter3d(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_perimeter3d(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_perimeter_poly';


ALTER FUNCTION public.st_perimeter3d(geometry) OWNER TO postgres;

--
-- Name: st_point(double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_point(double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_makepoint';


ALTER FUNCTION public.st_point(double precision, double precision) OWNER TO postgres;

--
-- Name: st_point_inside_circle(geometry, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_point_inside_circle(geometry, double precision, double precision, double precision) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_inside_circle_point';


ALTER FUNCTION public.st_point_inside_circle(geometry, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_pointfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_pointfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1)) = 'POINT'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_pointfromtext(text) OWNER TO postgres;

--
-- Name: st_pointfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_pointfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1, $2)) = 'POINT'
	THEN ST_GeomFromText($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_pointfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_pointfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_pointfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'POINT'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_pointfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_pointfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_pointfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'POINT'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_pointfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_pointn(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_pointn(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_pointn_linestring';


ALTER FUNCTION public.st_pointn(geometry, integer) OWNER TO postgres;

--
-- Name: st_pointonsurface(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_pointonsurface(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'pointonsurface';


ALTER FUNCTION public.st_pointonsurface(geometry) OWNER TO postgres;

--
-- Name: st_polyfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polyfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1)) = 'POLYGON'
	THEN ST_GeomFromText($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_polyfromtext(text) OWNER TO postgres;

--
-- Name: st_polyfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polyfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromText($1, $2)) = 'POLYGON'
	THEN ST_GeomFromText($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_polyfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_polyfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polyfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1)) = 'POLYGON'
	THEN ST_GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_polyfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_polyfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polyfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1, $2)) = 'POLYGON'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_polyfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_polygon(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygon(geometry, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ 
	SELECT setSRID(makepolygon($1), $2)
	$_$;


ALTER FUNCTION public.st_polygon(geometry, integer) OWNER TO postgres;

--
-- Name: st_polygonfromtext(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygonfromtext(text) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_PolyFromText($1)$_$;


ALTER FUNCTION public.st_polygonfromtext(text) OWNER TO postgres;

--
-- Name: st_polygonfromtext(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygonfromtext(text, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT PolyFromText($1, $2)$_$;


ALTER FUNCTION public.st_polygonfromtext(text, integer) OWNER TO postgres;

--
-- Name: st_polygonfromwkb(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygonfromwkb(bytea) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(GeomFromWKB($1)) = 'POLYGON'
	THEN GeomFromWKB($1)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_polygonfromwkb(bytea) OWNER TO postgres;

--
-- Name: st_polygonfromwkb(bytea, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygonfromwkb(bytea, integer) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
	SELECT CASE WHEN geometrytype(ST_GeomFromWKB($1,$2)) = 'POLYGON'
	THEN ST_GeomFromWKB($1, $2)
	ELSE NULL END
	$_$;


ALTER FUNCTION public.st_polygonfromwkb(bytea, integer) OWNER TO postgres;

--
-- Name: st_polygonize(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygonize(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'polygonize_garray';


ALTER FUNCTION public.st_polygonize(geometry[]) OWNER TO postgres;

--
-- Name: st_polygonize_garray(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_polygonize_garray(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'polygonize_garray';


ALTER FUNCTION public.st_polygonize_garray(geometry[]) OWNER TO postgres;

--
-- Name: st_postgis_gist_joinsel(internal, oid, internal, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_postgis_gist_joinsel(internal, oid, internal, smallint) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_joinsel';


ALTER FUNCTION public.st_postgis_gist_joinsel(internal, oid, internal, smallint) OWNER TO postgres;

--
-- Name: st_postgis_gist_sel(internal, oid, internal, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_postgis_gist_sel(internal, oid, internal, integer) RETURNS double precision
    LANGUAGE c
    AS '$libdir/postgis-1.5', 'LWGEOM_gist_sel';


ALTER FUNCTION public.st_postgis_gist_sel(internal, oid, internal, integer) OWNER TO postgres;

--
-- Name: st_relate(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_relate(geometry, geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'relate_full';


ALTER FUNCTION public.st_relate(geometry, geometry) OWNER TO postgres;

--
-- Name: st_relate(geometry, geometry, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_relate(geometry, geometry, text) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'relate_pattern';


ALTER FUNCTION public.st_relate(geometry, geometry, text) OWNER TO postgres;

--
-- Name: st_removepoint(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_removepoint(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_removepoint';


ALTER FUNCTION public.st_removepoint(geometry, integer) OWNER TO postgres;

--
-- Name: st_reverse(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_reverse(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_reverse';


ALTER FUNCTION public.st_reverse(geometry) OWNER TO postgres;

--
-- Name: st_rotate(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_rotate(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT rotateZ($1, $2)$_$;


ALTER FUNCTION public.st_rotate(geometry, double precision) OWNER TO postgres;

--
-- Name: st_rotatex(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_rotatex(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1, 1, 0, 0, 0, cos($2), -sin($2), 0, sin($2), cos($2), 0, 0, 0)$_$;


ALTER FUNCTION public.st_rotatex(geometry, double precision) OWNER TO postgres;

--
-- Name: st_rotatey(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_rotatey(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  cos($2), 0, sin($2),  0, 1, 0,  -sin($2), 0, cos($2), 0,  0, 0)$_$;


ALTER FUNCTION public.st_rotatey(geometry, double precision) OWNER TO postgres;

--
-- Name: st_rotatez(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_rotatez(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  cos($2), -sin($2), 0,  sin($2), cos($2), 0,  0, 0, 1,  0, 0, 0)$_$;


ALTER FUNCTION public.st_rotatez(geometry, double precision) OWNER TO postgres;

--
-- Name: st_scale(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_scale(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT scale($1, $2, $3, 1)$_$;


ALTER FUNCTION public.st_scale(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_scale(geometry, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_scale(geometry, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  $2, 0, 0,  0, $3, 0,  0, 0, $4,  0, 0, 0)$_$;


ALTER FUNCTION public.st_scale(geometry, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_segmentize(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_segmentize(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_segmentize2d';


ALTER FUNCTION public.st_segmentize(geometry, double precision) OWNER TO postgres;

--
-- Name: st_setfactor(chip, real); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_setfactor(chip, real) RETURNS chip
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_setFactor';


ALTER FUNCTION public.st_setfactor(chip, real) OWNER TO postgres;

--
-- Name: st_setpoint(geometry, integer, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_setpoint(geometry, integer, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_setpoint_linestring';


ALTER FUNCTION public.st_setpoint(geometry, integer, geometry) OWNER TO postgres;

--
-- Name: st_setsrid(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_setsrid(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_setSRID';


ALTER FUNCTION public.st_setsrid(geometry, integer) OWNER TO postgres;

--
-- Name: st_shift_longitude(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_shift_longitude(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_longitude_shift';


ALTER FUNCTION public.st_shift_longitude(geometry) OWNER TO postgres;

--
-- Name: st_shortestline(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_shortestline(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_shortestline2d';


ALTER FUNCTION public.st_shortestline(geometry, geometry) OWNER TO postgres;

--
-- Name: st_simplify(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_simplify(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_simplify2d';


ALTER FUNCTION public.st_simplify(geometry, double precision) OWNER TO postgres;

--
-- Name: st_simplifypreservetopology(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_simplifypreservetopology(geometry, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT COST 100
    AS '$libdir/postgis-1.5', 'topologypreservesimplify';


ALTER FUNCTION public.st_simplifypreservetopology(geometry, double precision) OWNER TO postgres;

--
-- Name: st_snaptogrid(geometry, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_snaptogrid(geometry, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_SnapToGrid($1, 0, 0, $2, $2)$_$;


ALTER FUNCTION public.st_snaptogrid(geometry, double precision) OWNER TO postgres;

--
-- Name: st_snaptogrid(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_snaptogrid(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT ST_SnapToGrid($1, 0, 0, $2, $3)$_$;


ALTER FUNCTION public.st_snaptogrid(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_snaptogrid(geometry, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_snaptogrid(geometry, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_snaptogrid';


ALTER FUNCTION public.st_snaptogrid(geometry, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_snaptogrid_pointoff';


ALTER FUNCTION public.st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_spheroid_in(cstring); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_spheroid_in(cstring) RETURNS spheroid
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ellipsoid_in';


ALTER FUNCTION public.st_spheroid_in(cstring) OWNER TO postgres;

--
-- Name: st_spheroid_out(spheroid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_spheroid_out(spheroid) RETURNS cstring
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'ellipsoid_out';


ALTER FUNCTION public.st_spheroid_out(spheroid) OWNER TO postgres;

--
-- Name: st_srid(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_srid(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getSRID';


ALTER FUNCTION public.st_srid(chip) OWNER TO postgres;

--
-- Name: st_srid(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_srid(geometry) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_getSRID';


ALTER FUNCTION public.st_srid(geometry) OWNER TO postgres;

--
-- Name: st_startpoint(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_startpoint(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_startpoint_linestring';


ALTER FUNCTION public.st_startpoint(geometry) OWNER TO postgres;

--
-- Name: st_summary(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_summary(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_summary';


ALTER FUNCTION public.st_summary(geometry) OWNER TO postgres;

--
-- Name: st_symdifference(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_symdifference(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'symdifference';


ALTER FUNCTION public.st_symdifference(geometry, geometry) OWNER TO postgres;

--
-- Name: st_symmetricdifference(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_symmetricdifference(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'symdifference';


ALTER FUNCTION public.st_symmetricdifference(geometry, geometry) OWNER TO postgres;

--
-- Name: st_text(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_text(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_text';


ALTER FUNCTION public.st_text(geometry) OWNER TO postgres;

--
-- Name: st_touches(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_touches(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Touches($1,$2)$_$;


ALTER FUNCTION public.st_touches(geometry, geometry) OWNER TO postgres;

--
-- Name: st_transform(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_transform(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'transform';


ALTER FUNCTION public.st_transform(geometry, integer) OWNER TO postgres;

--
-- Name: st_translate(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_translate(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT translate($1, $2, $3, 0)$_$;


ALTER FUNCTION public.st_translate(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: st_translate(geometry, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_translate(geometry, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1, 1, 0, 0, 0, 1, 0, 0, 0, 1, $2, $3, $4)$_$;


ALTER FUNCTION public.st_translate(geometry, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_transscale(geometry, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_transscale(geometry, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  $4, 0, 0,  0, $5, 0,
		0, 0, 1,  $2 * $4, $3 * $5, 0)$_$;


ALTER FUNCTION public.st_transscale(geometry, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: st_union(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_union(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'pgis_union_geometry_array';


ALTER FUNCTION public.st_union(geometry[]) OWNER TO postgres;

--
-- Name: st_union(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_union(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'geomunion';


ALTER FUNCTION public.st_union(geometry, geometry) OWNER TO postgres;

--
-- Name: st_unite_garray(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_unite_garray(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'pgis_union_geometry_array';


ALTER FUNCTION public.st_unite_garray(geometry[]) OWNER TO postgres;

--
-- Name: st_width(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_width(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getWidth';


ALTER FUNCTION public.st_width(chip) OWNER TO postgres;

--
-- Name: st_within(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_within(geometry, geometry) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$SELECT $1 && $2 AND _ST_Within($1,$2)$_$;


ALTER FUNCTION public.st_within(geometry, geometry) OWNER TO postgres;

--
-- Name: st_wkbtosql(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_wkbtosql(bytea) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_WKB';


ALTER FUNCTION public.st_wkbtosql(bytea) OWNER TO postgres;

--
-- Name: st_wkttosql(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_wkttosql(text) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_from_text';


ALTER FUNCTION public.st_wkttosql(text) OWNER TO postgres;

--
-- Name: st_x(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_x(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_x_point';


ALTER FUNCTION public.st_x(geometry) OWNER TO postgres;

--
-- Name: st_xmax(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_xmax(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_xmax';


ALTER FUNCTION public.st_xmax(box3d) OWNER TO postgres;

--
-- Name: st_xmin(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_xmin(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_xmin';


ALTER FUNCTION public.st_xmin(box3d) OWNER TO postgres;

--
-- Name: st_y(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_y(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_y_point';


ALTER FUNCTION public.st_y(geometry) OWNER TO postgres;

--
-- Name: st_ymax(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_ymax(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_ymax';


ALTER FUNCTION public.st_ymax(box3d) OWNER TO postgres;

--
-- Name: st_ymin(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_ymin(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_ymin';


ALTER FUNCTION public.st_ymin(box3d) OWNER TO postgres;

--
-- Name: st_z(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_z(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_z_point';


ALTER FUNCTION public.st_z(geometry) OWNER TO postgres;

--
-- Name: st_zmax(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_zmax(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_zmax';


ALTER FUNCTION public.st_zmax(box3d) OWNER TO postgres;

--
-- Name: st_zmflag(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_zmflag(geometry) RETURNS smallint
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_zmflag';


ALTER FUNCTION public.st_zmflag(geometry) OWNER TO postgres;

--
-- Name: st_zmin(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION st_zmin(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_zmin';


ALTER FUNCTION public.st_zmin(box3d) OWNER TO postgres;

--
-- Name: startpoint(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION startpoint(geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_startpoint_linestring';


ALTER FUNCTION public.startpoint(geometry) OWNER TO postgres;

--
-- Name: summary(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION summary(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_summary';


ALTER FUNCTION public.summary(geometry) OWNER TO postgres;

--
-- Name: symdifference(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION symdifference(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'symdifference';


ALTER FUNCTION public.symdifference(geometry, geometry) OWNER TO postgres;

--
-- Name: symmetricdifference(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION symmetricdifference(geometry, geometry) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'symdifference';


ALTER FUNCTION public.symmetricdifference(geometry, geometry) OWNER TO postgres;

--
-- Name: text(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION text(geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_to_text';


ALTER FUNCTION public.text(geometry) OWNER TO postgres;

--
-- Name: touches(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION touches(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'touches';


ALTER FUNCTION public.touches(geometry, geometry) OWNER TO postgres;

--
-- Name: transform(geometry, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION transform(geometry, integer) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'transform';


ALTER FUNCTION public.transform(geometry, integer) OWNER TO postgres;

--
-- Name: translate(geometry, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION translate(geometry, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT translate($1, $2, $3, 0)$_$;


ALTER FUNCTION public.translate(geometry, double precision, double precision) OWNER TO postgres;

--
-- Name: translate(geometry, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION translate(geometry, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1, 1, 0, 0, 0, 1, 0, 0, 0, 1, $2, $3, $4)$_$;


ALTER FUNCTION public.translate(geometry, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: transscale(geometry, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION transscale(geometry, double precision, double precision, double precision, double precision) RETURNS geometry
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT affine($1,  $4, 0, 0,  0, $5, 0,
		0, 0, 1,  $2 * $4, $3 * $5, 0)$_$;


ALTER FUNCTION public.transscale(geometry, double precision, double precision, double precision, double precision) OWNER TO postgres;

--
-- Name: unite_garray(geometry[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION unite_garray(geometry[]) RETURNS geometry
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'pgis_union_geometry_array';


ALTER FUNCTION public.unite_garray(geometry[]) OWNER TO postgres;

--
-- Name: unlockrows(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION unlockrows(text) RETURNS integer
    LANGUAGE plpgsql STRICT
    AS $_$ 
DECLARE
	ret int;
BEGIN

	IF NOT LongTransactionsEnabled() THEN
		RAISE EXCEPTION 'Long transaction support disabled, use EnableLongTransaction() to enable.';
	END IF;

	EXECUTE 'DELETE FROM authorization_table where authid = ' ||
		quote_literal($1);

	GET DIAGNOSTICS ret = ROW_COUNT;

	RETURN ret;
END;
$_$;


ALTER FUNCTION public.unlockrows(text) OWNER TO postgres;

--
-- Name: update_the_geom_webmercator(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION update_the_geom_webmercator() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
              NEW.the_geom_webmercator := ST_Transform(NEW.the_geom,3857);
              RETURN NEW;
        END;
      $$;


ALTER FUNCTION public.update_the_geom_webmercator() OWNER TO postgres;

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
               NEW.updated_at := now();
               RETURN NEW;
        END;
      $$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

--
-- Name: updategeometrysrid(character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION updategeometrysrid(character varying, character varying, integer) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	ret  text;
BEGIN
	SELECT UpdateGeometrySRID('','',$1,$2,$3) into ret;
	RETURN ret;
END;
$_$;


ALTER FUNCTION public.updategeometrysrid(character varying, character varying, integer) OWNER TO postgres;

--
-- Name: updategeometrysrid(character varying, character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION updategeometrysrid(character varying, character varying, character varying, integer) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	ret  text;
BEGIN
	SELECT UpdateGeometrySRID('',$1,$2,$3,$4) into ret;
	RETURN ret;
END;
$_$;


ALTER FUNCTION public.updategeometrysrid(character varying, character varying, character varying, integer) OWNER TO postgres;

--
-- Name: updategeometrysrid(character varying, character varying, character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION updategeometrysrid(character varying, character varying, character varying, character varying, integer) RETURNS text
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
	catalog_name alias for $1;
	schema_name alias for $2;
	table_name alias for $3;
	column_name alias for $4;
	new_srid alias for $5;
	myrec RECORD;
	okay boolean;
	cname varchar;
	real_schema name;

BEGIN


	-- Find, check or fix schema_name
	IF ( schema_name != '' ) THEN
		okay = 'f';

		FOR myrec IN SELECT nspname FROM pg_namespace WHERE text(nspname) = schema_name LOOP
			okay := 't';
		END LOOP;

		IF ( okay <> 't' ) THEN
			RAISE EXCEPTION 'Invalid schema name';
		ELSE
			real_schema = schema_name;
		END IF;
	ELSE
		SELECT INTO real_schema current_schema()::text;
	END IF;

	-- Find out if the column is in the geometry_columns table
	okay = 'f';
	FOR myrec IN SELECT * from geometry_columns where f_table_schema = text(real_schema) and f_table_name = table_name and f_geometry_column = column_name LOOP
		okay := 't';
	END LOOP;
	IF (okay <> 't') THEN
		RAISE EXCEPTION 'column not found in geometry_columns table';
		RETURN 'f';
	END IF;

	-- Update ref from geometry_columns table
	EXECUTE 'UPDATE geometry_columns SET SRID = ' || new_srid::text ||
		' where f_table_schema = ' ||
		quote_literal(real_schema) || ' and f_table_name = ' ||
		quote_literal(table_name)  || ' and f_geometry_column = ' ||
		quote_literal(column_name);

	-- Make up constraint name
	cname = 'enforce_srid_'  || column_name;

	-- Drop enforce_srid constraint
	EXECUTE 'ALTER TABLE ' || quote_ident(real_schema) ||
		'.' || quote_ident(table_name) ||
		' DROP constraint ' || quote_ident(cname);

	-- Update geometries SRID
	EXECUTE 'UPDATE ' || quote_ident(real_schema) ||
		'.' || quote_ident(table_name) ||
		' SET ' || quote_ident(column_name) ||
		' = setSRID(' || quote_ident(column_name) ||
		', ' || new_srid::text || ')';

	-- Reset enforce_srid constraint
	EXECUTE 'ALTER TABLE ' || quote_ident(real_schema) ||
		'.' || quote_ident(table_name) ||
		' ADD constraint ' || quote_ident(cname) ||
		' CHECK (srid(' || quote_ident(column_name) ||
		') = ' || new_srid::text || ')';

	RETURN real_schema || '.' || table_name || '.' || column_name ||' SRID changed to ' || new_srid::text;

END;
$_$;


ALTER FUNCTION public.updategeometrysrid(character varying, character varying, character varying, character varying, integer) OWNER TO postgres;

--
-- Name: width(chip); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION width(chip) RETURNS integer
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'CHIP_getWidth';


ALTER FUNCTION public.width(chip) OWNER TO postgres;

--
-- Name: within(geometry, geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION within(geometry, geometry) RETURNS boolean
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'within';


ALTER FUNCTION public.within(geometry, geometry) OWNER TO postgres;

--
-- Name: x(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION x(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_x_point';


ALTER FUNCTION public.x(geometry) OWNER TO postgres;

--
-- Name: xmax(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION xmax(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_xmax';


ALTER FUNCTION public.xmax(box3d) OWNER TO postgres;

--
-- Name: xmin(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION xmin(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_xmin';


ALTER FUNCTION public.xmin(box3d) OWNER TO postgres;

--
-- Name: y(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION y(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_y_point';


ALTER FUNCTION public.y(geometry) OWNER TO postgres;

--
-- Name: ymax(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION ymax(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_ymax';


ALTER FUNCTION public.ymax(box3d) OWNER TO postgres;

--
-- Name: ymin(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION ymin(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_ymin';


ALTER FUNCTION public.ymin(box3d) OWNER TO postgres;

--
-- Name: z(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION z(geometry) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_z_point';


ALTER FUNCTION public.z(geometry) OWNER TO postgres;

--
-- Name: zmax(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION zmax(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_zmax';


ALTER FUNCTION public.zmax(box3d) OWNER TO postgres;

--
-- Name: zmflag(geometry); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION zmflag(geometry) RETURNS smallint
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'LWGEOM_zmflag';


ALTER FUNCTION public.zmflag(geometry) OWNER TO postgres;

--
-- Name: zmin(box3d); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION zmin(box3d) RETURNS double precision
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-1.5', 'BOX3D_zmin';


ALTER FUNCTION public.zmin(box3d) OWNER TO postgres;

--
-- Name: accum(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE accum(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_accum_finalfn
);


ALTER AGGREGATE public.accum(geometry) OWNER TO postgres;

--
-- Name: collect(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE collect(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_collect_finalfn
);


ALTER AGGREGATE public.collect(geometry) OWNER TO postgres;

--
-- Name: extent(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE extent(geometry) (
    SFUNC = public.st_combine_bbox,
    STYPE = box3d_extent
);


ALTER AGGREGATE public.extent(geometry) OWNER TO postgres;

--
-- Name: extent3d(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE extent3d(geometry) (
    SFUNC = public.combine_bbox,
    STYPE = box3d
);


ALTER AGGREGATE public.extent3d(geometry) OWNER TO postgres;

--
-- Name: makeline(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE makeline(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_makeline_finalfn
);


ALTER AGGREGATE public.makeline(geometry) OWNER TO postgres;

--
-- Name: memcollect(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE memcollect(geometry) (
    SFUNC = public.st_collect,
    STYPE = geometry
);


ALTER AGGREGATE public.memcollect(geometry) OWNER TO postgres;

--
-- Name: memgeomunion(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE memgeomunion(geometry) (
    SFUNC = geomunion,
    STYPE = geometry
);


ALTER AGGREGATE public.memgeomunion(geometry) OWNER TO postgres;

--
-- Name: polygonize(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE polygonize(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_polygonize_finalfn
);


ALTER AGGREGATE public.polygonize(geometry) OWNER TO postgres;

--
-- Name: st_accum(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_accum(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_accum_finalfn
);


ALTER AGGREGATE public.st_accum(geometry) OWNER TO postgres;

--
-- Name: st_collect(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_collect(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_collect_finalfn
);


ALTER AGGREGATE public.st_collect(geometry) OWNER TO postgres;

--
-- Name: st_extent(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_extent(geometry) (
    SFUNC = public.st_combine_bbox,
    STYPE = box3d_extent
);


ALTER AGGREGATE public.st_extent(geometry) OWNER TO postgres;

--
-- Name: st_extent3d(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_extent3d(geometry) (
    SFUNC = public.st_combine_bbox,
    STYPE = box3d
);


ALTER AGGREGATE public.st_extent3d(geometry) OWNER TO postgres;

--
-- Name: st_makeline(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_makeline(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_makeline_finalfn
);


ALTER AGGREGATE public.st_makeline(geometry) OWNER TO postgres;

--
-- Name: st_memcollect(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_memcollect(geometry) (
    SFUNC = public.st_collect,
    STYPE = geometry
);


ALTER AGGREGATE public.st_memcollect(geometry) OWNER TO postgres;

--
-- Name: st_memunion(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_memunion(geometry) (
    SFUNC = public.st_union,
    STYPE = geometry
);


ALTER AGGREGATE public.st_memunion(geometry) OWNER TO postgres;

--
-- Name: st_polygonize(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_polygonize(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_polygonize_finalfn
);


ALTER AGGREGATE public.st_polygonize(geometry) OWNER TO postgres;

--
-- Name: st_union(geometry); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE st_union(geometry) (
    SFUNC = pgis_geometry_accum_transfn,
    STYPE = pgis_abs,
    FINALFUNC = pgis_geometry_union_finalfn
);


ALTER AGGREGATE public.st_union(geometry) OWNER TO postgres;

--
-- Name: &&; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR && (
    PROCEDURE = geometry_overlap,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = &&,
    RESTRICT = geometry_gist_sel,
    JOIN = geometry_gist_joinsel
);


ALTER OPERATOR public.&& (geometry, geometry) OWNER TO postgres;

--
-- Name: &&; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR && (
    PROCEDURE = geography_overlaps,
    LEFTARG = geography,
    RIGHTARG = geography,
    COMMUTATOR = &&,
    RESTRICT = geography_gist_selectivity,
    JOIN = geography_gist_join_selectivity
);


ALTER OPERATOR public.&& (geography, geography) OWNER TO postgres;

--
-- Name: &<; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR &< (
    PROCEDURE = geometry_overleft,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = &>,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.&< (geometry, geometry) OWNER TO postgres;

--
-- Name: &<|; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR &<| (
    PROCEDURE = geometry_overbelow,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = |&>,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.&<| (geometry, geometry) OWNER TO postgres;

--
-- Name: &>; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR &> (
    PROCEDURE = geometry_overright,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = &<,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.&> (geometry, geometry) OWNER TO postgres;

--
-- Name: <; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR < (
    PROCEDURE = geometry_lt,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = >,
    NEGATOR = >=,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.< (geometry, geometry) OWNER TO postgres;

--
-- Name: <; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR < (
    PROCEDURE = geography_lt,
    LEFTARG = geography,
    RIGHTARG = geography,
    COMMUTATOR = >,
    NEGATOR = >=,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.< (geography, geography) OWNER TO postgres;

--
-- Name: <<; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR << (
    PROCEDURE = geometry_left,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = >>,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.<< (geometry, geometry) OWNER TO postgres;

--
-- Name: <<|; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR <<| (
    PROCEDURE = geometry_below,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = |>>,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.<<| (geometry, geometry) OWNER TO postgres;

--
-- Name: <=; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR <= (
    PROCEDURE = geometry_le,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = >=,
    NEGATOR = >,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.<= (geometry, geometry) OWNER TO postgres;

--
-- Name: <=; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR <= (
    PROCEDURE = geography_le,
    LEFTARG = geography,
    RIGHTARG = geography,
    COMMUTATOR = >=,
    NEGATOR = >,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.<= (geography, geography) OWNER TO postgres;

--
-- Name: =; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR = (
    PROCEDURE = geometry_eq,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = =,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.= (geometry, geometry) OWNER TO postgres;

--
-- Name: =; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR = (
    PROCEDURE = geography_eq,
    LEFTARG = geography,
    RIGHTARG = geography,
    COMMUTATOR = =,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.= (geography, geography) OWNER TO postgres;

--
-- Name: >; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR > (
    PROCEDURE = geometry_gt,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = <,
    NEGATOR = <=,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.> (geometry, geometry) OWNER TO postgres;

--
-- Name: >; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR > (
    PROCEDURE = geography_gt,
    LEFTARG = geography,
    RIGHTARG = geography,
    COMMUTATOR = <,
    NEGATOR = <=,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.> (geography, geography) OWNER TO postgres;

--
-- Name: >=; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR >= (
    PROCEDURE = geometry_ge,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = <=,
    NEGATOR = <,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.>= (geometry, geometry) OWNER TO postgres;

--
-- Name: >=; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR >= (
    PROCEDURE = geography_ge,
    LEFTARG = geography,
    RIGHTARG = geography,
    COMMUTATOR = <=,
    NEGATOR = <,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.>= (geography, geography) OWNER TO postgres;

--
-- Name: >>; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR >> (
    PROCEDURE = geometry_right,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = <<,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.>> (geometry, geometry) OWNER TO postgres;

--
-- Name: @; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR @ (
    PROCEDURE = geometry_contained,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = ~,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.@ (geometry, geometry) OWNER TO postgres;

--
-- Name: |&>; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR |&> (
    PROCEDURE = geometry_overabove,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = &<|,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.|&> (geometry, geometry) OWNER TO postgres;

--
-- Name: |>>; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR |>> (
    PROCEDURE = geometry_above,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = <<|,
    RESTRICT = positionsel,
    JOIN = positionjoinsel
);


ALTER OPERATOR public.|>> (geometry, geometry) OWNER TO postgres;

--
-- Name: ~; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR ~ (
    PROCEDURE = geometry_contain,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = @,
    RESTRICT = contsel,
    JOIN = contjoinsel
);


ALTER OPERATOR public.~ (geometry, geometry) OWNER TO postgres;

--
-- Name: ~=; Type: OPERATOR; Schema: public; Owner: postgres
--

CREATE OPERATOR ~= (
    PROCEDURE = geometry_samebox,
    LEFTARG = geometry,
    RIGHTARG = geometry,
    COMMUTATOR = ~=,
    RESTRICT = eqsel,
    JOIN = eqjoinsel
);


ALTER OPERATOR public.~= (geometry, geometry) OWNER TO postgres;

--
-- Name: btree_geography_ops; Type: OPERATOR FAMILY; Schema: public; Owner: simon
--

CREATE OPERATOR FAMILY btree_geography_ops USING btree;


ALTER OPERATOR FAMILY public.btree_geography_ops USING btree OWNER TO simon;

--
-- Name: btree_geography_ops; Type: OPERATOR CLASS; Schema: public; Owner: postgres
--

CREATE OPERATOR CLASS btree_geography_ops
    DEFAULT FOR TYPE geography USING btree AS
    OPERATOR 1 <(geography,geography) ,
    OPERATOR 2 <=(geography,geography) ,
    OPERATOR 3 =(geography,geography) ,
    OPERATOR 4 >=(geography,geography) ,
    OPERATOR 5 >(geography,geography) ,
    FUNCTION 1 geography_cmp(geography,geography);


ALTER OPERATOR CLASS public.btree_geography_ops USING btree OWNER TO postgres;

--
-- Name: btree_geometry_ops; Type: OPERATOR FAMILY; Schema: public; Owner: simon
--

CREATE OPERATOR FAMILY btree_geometry_ops USING btree;


ALTER OPERATOR FAMILY public.btree_geometry_ops USING btree OWNER TO simon;

--
-- Name: btree_geometry_ops; Type: OPERATOR CLASS; Schema: public; Owner: postgres
--

CREATE OPERATOR CLASS btree_geometry_ops
    DEFAULT FOR TYPE geometry USING btree AS
    OPERATOR 1 <(geometry,geometry) ,
    OPERATOR 2 <=(geometry,geometry) ,
    OPERATOR 3 =(geometry,geometry) ,
    OPERATOR 4 >=(geometry,geometry) ,
    OPERATOR 5 >(geometry,geometry) ,
    FUNCTION 1 geometry_cmp(geometry,geometry);


ALTER OPERATOR CLASS public.btree_geometry_ops USING btree OWNER TO postgres;

--
-- Name: gist_geography_ops; Type: OPERATOR FAMILY; Schema: public; Owner: simon
--

CREATE OPERATOR FAMILY gist_geography_ops USING gist;


ALTER OPERATOR FAMILY public.gist_geography_ops USING gist OWNER TO simon;

--
-- Name: gist_geography_ops; Type: OPERATOR CLASS; Schema: public; Owner: postgres
--

CREATE OPERATOR CLASS gist_geography_ops
    DEFAULT FOR TYPE geography USING gist AS
    STORAGE gidx ,
    OPERATOR 3 &&(geography,geography) ,
    FUNCTION 1 geography_gist_consistent(internal,geometry,integer) ,
    FUNCTION 2 geography_gist_union(bytea,internal) ,
    FUNCTION 3 geography_gist_compress(internal) ,
    FUNCTION 4 geography_gist_decompress(internal) ,
    FUNCTION 5 geography_gist_penalty(internal,internal,internal) ,
    FUNCTION 6 geography_gist_picksplit(internal,internal) ,
    FUNCTION 7 geography_gist_same(box2d,box2d,internal);


ALTER OPERATOR CLASS public.gist_geography_ops USING gist OWNER TO postgres;

--
-- Name: gist_geometry_ops; Type: OPERATOR FAMILY; Schema: public; Owner: simon
--

CREATE OPERATOR FAMILY gist_geometry_ops USING gist;


ALTER OPERATOR FAMILY public.gist_geometry_ops USING gist OWNER TO simon;

--
-- Name: gist_geometry_ops; Type: OPERATOR CLASS; Schema: public; Owner: postgres
--

CREATE OPERATOR CLASS gist_geometry_ops
    DEFAULT FOR TYPE geometry USING gist AS
    STORAGE box2d ,
    OPERATOR 1 <<(geometry,geometry) ,
    OPERATOR 2 &<(geometry,geometry) ,
    OPERATOR 3 &&(geometry,geometry) ,
    OPERATOR 4 &>(geometry,geometry) ,
    OPERATOR 5 >>(geometry,geometry) ,
    OPERATOR 6 ~=(geometry,geometry) ,
    OPERATOR 7 ~(geometry,geometry) ,
    OPERATOR 8 @(geometry,geometry) ,
    OPERATOR 9 &<|(geometry,geometry) ,
    OPERATOR 10 <<|(geometry,geometry) ,
    OPERATOR 11 |>>(geometry,geometry) ,
    OPERATOR 12 |&>(geometry,geometry) ,
    FUNCTION 1 lwgeom_gist_consistent(internal,geometry,integer) ,
    FUNCTION 2 lwgeom_gist_union(bytea,internal) ,
    FUNCTION 3 lwgeom_gist_compress(internal) ,
    FUNCTION 4 lwgeom_gist_decompress(internal) ,
    FUNCTION 5 lwgeom_gist_penalty(internal,internal,internal) ,
    FUNCTION 6 lwgeom_gist_picksplit(internal,internal) ,
    FUNCTION 7 lwgeom_gist_same(box2d,box2d,internal);


ALTER OPERATOR CLASS public.gist_geometry_ops USING gist OWNER TO postgres;

SET search_path = pg_catalog;

--
-- Name: CAST (public.box2d AS public.box3d); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box2d AS public.box3d) WITH FUNCTION public.box3d(public.box2d) AS IMPLICIT;


--
-- Name: CAST (public.box2d AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box2d AS public.geometry) WITH FUNCTION public.geometry(public.box2d) AS IMPLICIT;


--
-- Name: CAST (public.box3d AS box); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box3d AS box) WITH FUNCTION public.box(public.box3d) AS IMPLICIT;


--
-- Name: CAST (public.box3d AS public.box2d); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box3d AS public.box2d) WITH FUNCTION public.box2d(public.box3d) AS IMPLICIT;


--
-- Name: CAST (public.box3d AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box3d AS public.geometry) WITH FUNCTION public.geometry(public.box3d) AS IMPLICIT;


--
-- Name: CAST (public.box3d_extent AS public.box2d); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box3d_extent AS public.box2d) WITH FUNCTION public.box2d(public.box3d_extent) AS IMPLICIT;


--
-- Name: CAST (public.box3d_extent AS public.box3d); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box3d_extent AS public.box3d) WITH FUNCTION public.box3d_extent(public.box3d_extent) AS IMPLICIT;


--
-- Name: CAST (public.box3d_extent AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.box3d_extent AS public.geometry) WITH FUNCTION public.geometry(public.box3d_extent) AS IMPLICIT;


--
-- Name: CAST (bytea AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (bytea AS public.geometry) WITH FUNCTION public.geometry(bytea) AS IMPLICIT;


--
-- Name: CAST (public.chip AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.chip AS public.geometry) WITH FUNCTION public.geometry(public.chip) AS IMPLICIT;


--
-- Name: CAST (public.geography AS public.geography); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geography AS public.geography) WITH FUNCTION public.geography(public.geography, integer, boolean) AS IMPLICIT;


--
-- Name: CAST (public.geography AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geography AS public.geometry) WITH FUNCTION public.geometry(public.geography);


--
-- Name: CAST (public.geometry AS box); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geometry AS box) WITH FUNCTION public.box(public.geometry) AS IMPLICIT;


--
-- Name: CAST (public.geometry AS public.box2d); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geometry AS public.box2d) WITH FUNCTION public.box2d(public.geometry) AS IMPLICIT;


--
-- Name: CAST (public.geometry AS public.box3d); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geometry AS public.box3d) WITH FUNCTION public.box3d(public.geometry) AS IMPLICIT;


--
-- Name: CAST (public.geometry AS bytea); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geometry AS bytea) WITH FUNCTION public.bytea(public.geometry) AS IMPLICIT;


--
-- Name: CAST (public.geometry AS public.geography); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geometry AS public.geography) WITH FUNCTION public.geography(public.geometry) AS IMPLICIT;


--
-- Name: CAST (public.geometry AS text); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (public.geometry AS text) WITH FUNCTION public.text(public.geometry) AS IMPLICIT;


--
-- Name: CAST (text AS public.geometry); Type: CAST; Schema: pg_catalog; Owner: 
--

CREATE CAST (text AS public.geometry) WITH FUNCTION public.geometry(text) AS IMPLICIT;


SET search_path = public, pg_catalog;

--
-- Name: geography_columns; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW geography_columns AS
    SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, geography_typmod_dims(a.atttypmod) AS coord_dimension, geography_typmod_srid(a.atttypmod) AS srid, geography_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE ((((((c.relkind = ANY (ARRAY['r'::"char", 'v'::"char"])) AND (t.typname = 'geography'::name)) AND (a.attisdropped = false)) AND (a.atttypid = t.oid)) AND (a.attrelid = c.oid)) AND (c.relnamespace = n.oid));


ALTER TABLE public.geography_columns OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = true;

--
-- Name: geometry_columns; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE geometry_columns (
    f_table_catalog character varying(256) NOT NULL,
    f_table_schema character varying(256) NOT NULL,
    f_table_name character varying(256) NOT NULL,
    f_geometry_column character varying(256) NOT NULL,
    coord_dimension integer NOT NULL,
    srid integer NOT NULL,
    type character varying(30) NOT NULL
);


ALTER TABLE public.geometry_columns OWNER TO postgres;

SET default_with_oids = false;

--
-- Name: spatial_ref_sys; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE spatial_ref_sys (
    srid integer NOT NULL,
    auth_name character varying(256),
    auth_srid integer,
    srtext character varying(2048),
    proj4text character varying(2048)
);


ALTER TABLE public.spatial_ref_sys OWNER TO postgres;

--
-- Name: untitle_table; Type: TABLE; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE TABLE untitle_table (
    cartodb_id integer NOT NULL,
    name text,
    description text,
    created_at timestamp without time zone DEFAULT '2011-07-18 11:12:43.867364'::timestamp without time zone,
    updated_at timestamp without time zone DEFAULT '2011-07-18 11:12:43.867364'::timestamp without time zone,
    the_geom geometry,
    the_geom_webmercator geometry,
    CONSTRAINT enforce_dims_the_geom CHECK ((st_ndims(the_geom) = 2)),
    CONSTRAINT enforce_dims_the_geom_webmercator CHECK ((st_ndims(the_geom_webmercator) = 2)),
    CONSTRAINT enforce_geotype_the_geom CHECK (((geometrytype(the_geom) = 'POINT'::text) OR (the_geom IS NULL))),
    CONSTRAINT enforce_geotype_the_geom_webmercator CHECK (((geometrytype(the_geom_webmercator) = 'POINT'::text) OR (the_geom_webmercator IS NULL))),
    CONSTRAINT enforce_srid_the_geom CHECK ((st_srid(the_geom) = 4326)),
    CONSTRAINT enforce_srid_the_geom_webmercator CHECK ((st_srid(the_geom_webmercator) = 3857))
);


ALTER TABLE public.untitle_table OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_2; Type: TABLE; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE TABLE untitle_table_2 (
    cartodb_id integer NOT NULL,
    name text,
    description text,
    created_at timestamp without time zone DEFAULT '2011-07-18 11:12:43.98835'::timestamp without time zone,
    updated_at timestamp without time zone DEFAULT '2011-07-18 11:12:43.98835'::timestamp without time zone,
    the_geom geometry,
    the_geom_webmercator geometry,
    CONSTRAINT enforce_dims_the_geom CHECK ((st_ndims(the_geom) = 2)),
    CONSTRAINT enforce_dims_the_geom_webmercator CHECK ((st_ndims(the_geom_webmercator) = 2)),
    CONSTRAINT enforce_geotype_the_geom CHECK (((geometrytype(the_geom) = 'POINT'::text) OR (the_geom IS NULL))),
    CONSTRAINT enforce_geotype_the_geom_webmercator CHECK (((geometrytype(the_geom_webmercator) = 'POINT'::text) OR (the_geom_webmercator IS NULL))),
    CONSTRAINT enforce_srid_the_geom CHECK ((st_srid(the_geom) = 4326)),
    CONSTRAINT enforce_srid_the_geom_webmercator CHECK ((st_srid(the_geom_webmercator) = 3857))
);


ALTER TABLE public.untitle_table_2 OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_2_cartodb_id_seq; Type: SEQUENCE; Schema: public; Owner: development_cartodb_user_1
--

CREATE SEQUENCE untitle_table_2_cartodb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.untitle_table_2_cartodb_id_seq OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_2_cartodb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: development_cartodb_user_1
--

ALTER SEQUENCE untitle_table_2_cartodb_id_seq OWNED BY untitle_table_2.cartodb_id;


--
-- Name: untitle_table_3; Type: TABLE; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE TABLE untitle_table_3 (
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    cartodb_id integer NOT NULL,
    name character varying,
    surname character varying,
    address character varying,
    city character varying,
    country character varying,
    nif character varying,
    age integer,
    twitter_account character varying,
    postal_code integer
);


ALTER TABLE public.untitle_table_3 OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_3_cartodb_id_seq; Type: SEQUENCE; Schema: public; Owner: development_cartodb_user_1
--

CREATE SEQUENCE untitle_table_3_cartodb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.untitle_table_3_cartodb_id_seq OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_3_cartodb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: development_cartodb_user_1
--

ALTER SEQUENCE untitle_table_3_cartodb_id_seq OWNED BY untitle_table_3.cartodb_id;


--
-- Name: untitle_table_4; Type: TABLE; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE TABLE untitle_table_4 (
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    cartodb_id integer NOT NULL,
    name character varying,
    address character varying,
    the_geom geometry,
    the_geom_webmercator geometry,
    CONSTRAINT enforce_dims_the_geom CHECK ((st_ndims(the_geom) = 2)),
    CONSTRAINT enforce_dims_the_geom_webmercator CHECK ((st_ndims(the_geom_webmercator) = 2)),
    CONSTRAINT enforce_geotype_the_geom CHECK (((geometrytype(the_geom) = 'POINT'::text) OR (the_geom IS NULL))),
    CONSTRAINT enforce_geotype_the_geom_webmercator CHECK (((geometrytype(the_geom_webmercator) = 'POINT'::text) OR (the_geom_webmercator IS NULL))),
    CONSTRAINT enforce_srid_the_geom CHECK ((st_srid(the_geom) = 4326)),
    CONSTRAINT enforce_srid_the_geom_webmercator CHECK ((st_srid(the_geom_webmercator) = 3857))
);


ALTER TABLE public.untitle_table_4 OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_4_cartodb_id_seq; Type: SEQUENCE; Schema: public; Owner: development_cartodb_user_1
--

CREATE SEQUENCE untitle_table_4_cartodb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.untitle_table_4_cartodb_id_seq OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_4_cartodb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: development_cartodb_user_1
--

ALTER SEQUENCE untitle_table_4_cartodb_id_seq OWNED BY untitle_table_4.cartodb_id;


--
-- Name: untitle_table_cartodb_id_seq; Type: SEQUENCE; Schema: public; Owner: development_cartodb_user_1
--

CREATE SEQUENCE untitle_table_cartodb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.untitle_table_cartodb_id_seq OWNER TO development_cartodb_user_1;

--
-- Name: untitle_table_cartodb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: development_cartodb_user_1
--

ALTER SEQUENCE untitle_table_cartodb_id_seq OWNED BY untitle_table.cartodb_id;


--
-- Name: cartodb_id; Type: DEFAULT; Schema: public; Owner: development_cartodb_user_1
--

ALTER TABLE untitle_table ALTER COLUMN cartodb_id SET DEFAULT nextval('untitle_table_cartodb_id_seq'::regclass);


--
-- Name: cartodb_id; Type: DEFAULT; Schema: public; Owner: development_cartodb_user_1
--

ALTER TABLE untitle_table_2 ALTER COLUMN cartodb_id SET DEFAULT nextval('untitle_table_2_cartodb_id_seq'::regclass);


--
-- Name: cartodb_id; Type: DEFAULT; Schema: public; Owner: development_cartodb_user_1
--

ALTER TABLE untitle_table_3 ALTER COLUMN cartodb_id SET DEFAULT nextval('untitle_table_3_cartodb_id_seq'::regclass);


--
-- Name: cartodb_id; Type: DEFAULT; Schema: public; Owner: development_cartodb_user_1
--

ALTER TABLE untitle_table_4 ALTER COLUMN cartodb_id SET DEFAULT nextval('untitle_table_4_cartodb_id_seq'::regclass);


--
-- Name: geometry_columns_pk; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY geometry_columns
    ADD CONSTRAINT geometry_columns_pk PRIMARY KEY (f_table_catalog, f_table_schema, f_table_name, f_geometry_column);


--
-- Name: spatial_ref_sys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY spatial_ref_sys
    ADD CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid);


--
-- Name: untitle_table_2_pkey; Type: CONSTRAINT; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

ALTER TABLE ONLY untitle_table_2
    ADD CONSTRAINT untitle_table_2_pkey PRIMARY KEY (cartodb_id);


--
-- Name: untitle_table_3_pkey; Type: CONSTRAINT; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

ALTER TABLE ONLY untitle_table_3
    ADD CONSTRAINT untitle_table_3_pkey PRIMARY KEY (cartodb_id);


--
-- Name: untitle_table_4_pkey; Type: CONSTRAINT; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

ALTER TABLE ONLY untitle_table_4
    ADD CONSTRAINT untitle_table_4_pkey PRIMARY KEY (cartodb_id);


--
-- Name: untitle_table_pkey; Type: CONSTRAINT; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

ALTER TABLE ONLY untitle_table
    ADD CONSTRAINT untitle_table_pkey PRIMARY KEY (cartodb_id);


--
-- Name: untitle_table_2_the_geom_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX untitle_table_2_the_geom_idx ON untitle_table_2 USING gist (the_geom);


--
-- Name: untitle_table_2_the_geom_webmercator_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX untitle_table_2_the_geom_webmercator_idx ON untitle_table_2 USING gist (the_geom_webmercator);


--
-- Name: untitle_table_4_the_geom_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX untitle_table_4_the_geom_idx ON untitle_table_4 USING gist (the_geom);


--
-- Name: untitle_table_4_the_geom_webmercator_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX untitle_table_4_the_geom_webmercator_idx ON untitle_table_4 USING gist (the_geom_webmercator);


--
-- Name: untitle_table_the_geom_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX untitle_table_the_geom_idx ON untitle_table USING gist (the_geom);


--
-- Name: untitle_table_the_geom_webmercator_idx; Type: INDEX; Schema: public; Owner: development_cartodb_user_1; Tablespace: 
--

CREATE INDEX untitle_table_the_geom_webmercator_idx ON untitle_table USING gist (the_geom_webmercator);


--
-- Name: update_the_geom_webmercator_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_the_geom_webmercator_trigger BEFORE INSERT OR UPDATE OF the_geom ON untitle_table FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();


--
-- Name: update_the_geom_webmercator_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_the_geom_webmercator_trigger BEFORE INSERT OR UPDATE OF the_geom ON untitle_table_2 FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();


--
-- Name: update_the_geom_webmercator_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_the_geom_webmercator_trigger BEFORE INSERT OR UPDATE OF the_geom ON untitle_table_4 FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();


--
-- Name: update_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_updated_at_trigger BEFORE UPDATE ON untitle_table FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


--
-- Name: update_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_updated_at_trigger BEFORE UPDATE ON untitle_table_2 FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


--
-- Name: update_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_updated_at_trigger BEFORE UPDATE ON untitle_table_3 FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


--
-- Name: update_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: development_cartodb_user_1
--

CREATE TRIGGER update_updated_at_trigger BEFORE UPDATE ON untitle_table_4 FOR EACH ROW EXECUTE PROCEDURE update_updated_at();


--
-- Name: public; Type: ACL; Schema: -; Owner: simon
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM simon;
GRANT ALL ON SCHEMA public TO simon;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO development_cartodb_user_1;
GRANT USAGE ON SCHEMA public TO publicuser;


--
-- Name: box2d_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box2d_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION box2d_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION box2d_in(cstring) TO postgres;
GRANT ALL ON FUNCTION box2d_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION box2d_in(cstring) TO publicuser;


--
-- Name: box2d_out(box2d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box2d_out(box2d) FROM PUBLIC;
REVOKE ALL ON FUNCTION box2d_out(box2d) FROM postgres;
GRANT ALL ON FUNCTION box2d_out(box2d) TO postgres;
GRANT ALL ON FUNCTION box2d_out(box2d) TO PUBLIC;
GRANT ALL ON FUNCTION box2d_out(box2d) TO publicuser;


--
-- Name: box3d_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION box3d_in(cstring) TO postgres;
GRANT ALL ON FUNCTION box3d_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION box3d_in(cstring) TO publicuser;


--
-- Name: box3d_out(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d_out(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d_out(box3d) FROM postgres;
GRANT ALL ON FUNCTION box3d_out(box3d) TO postgres;
GRANT ALL ON FUNCTION box3d_out(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION box3d_out(box3d) TO publicuser;


--
-- Name: box3d_extent_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d_extent_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d_extent_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION box3d_extent_in(cstring) TO postgres;
GRANT ALL ON FUNCTION box3d_extent_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION box3d_extent_in(cstring) TO publicuser;


--
-- Name: box3d_extent_out(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d_extent_out(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d_extent_out(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION box3d_extent_out(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION box3d_extent_out(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION box3d_extent_out(box3d_extent) TO publicuser;


--
-- Name: chip_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION chip_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION chip_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION chip_in(cstring) TO postgres;
GRANT ALL ON FUNCTION chip_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION chip_in(cstring) TO publicuser;


--
-- Name: chip_out(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION chip_out(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION chip_out(chip) FROM postgres;
GRANT ALL ON FUNCTION chip_out(chip) TO postgres;
GRANT ALL ON FUNCTION chip_out(chip) TO PUBLIC;
GRANT ALL ON FUNCTION chip_out(chip) TO publicuser;


--
-- Name: geography_analyze(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_analyze(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_analyze(internal) FROM postgres;
GRANT ALL ON FUNCTION geography_analyze(internal) TO postgres;
GRANT ALL ON FUNCTION geography_analyze(internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_analyze(internal) TO publicuser;


--
-- Name: geography_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_in(cstring, oid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_in(cstring, oid, integer) FROM postgres;
GRANT ALL ON FUNCTION geography_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION geography_in(cstring, oid, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_in(cstring, oid, integer) TO publicuser;


--
-- Name: geography_out(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_out(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_out(geography) FROM postgres;
GRANT ALL ON FUNCTION geography_out(geography) TO postgres;
GRANT ALL ON FUNCTION geography_out(geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_out(geography) TO publicuser;


--
-- Name: geography_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_typmod_in(cstring[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_typmod_in(cstring[]) FROM postgres;
GRANT ALL ON FUNCTION geography_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION geography_typmod_in(cstring[]) TO PUBLIC;
GRANT ALL ON FUNCTION geography_typmod_in(cstring[]) TO publicuser;


--
-- Name: geography_typmod_out(integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_typmod_out(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_typmod_out(integer) FROM postgres;
GRANT ALL ON FUNCTION geography_typmod_out(integer) TO postgres;
GRANT ALL ON FUNCTION geography_typmod_out(integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_typmod_out(integer) TO publicuser;


--
-- Name: geometry_analyze(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_analyze(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_analyze(internal) FROM postgres;
GRANT ALL ON FUNCTION geometry_analyze(internal) TO postgres;
GRANT ALL ON FUNCTION geometry_analyze(internal) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_analyze(internal) TO publicuser;


--
-- Name: geometry_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION geometry_in(cstring) TO postgres;
GRANT ALL ON FUNCTION geometry_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_in(cstring) TO publicuser;


--
-- Name: geometry_out(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_out(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_out(geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_out(geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_out(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_out(geometry) TO publicuser;


--
-- Name: geometry_recv(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_recv(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_recv(internal) FROM postgres;
GRANT ALL ON FUNCTION geometry_recv(internal) TO postgres;
GRANT ALL ON FUNCTION geometry_recv(internal) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_recv(internal) TO publicuser;


--
-- Name: geometry_send(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_send(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_send(geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_send(geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_send(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_send(geometry) TO publicuser;


--
-- Name: gidx_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION gidx_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION gidx_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION gidx_in(cstring) TO postgres;
GRANT ALL ON FUNCTION gidx_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION gidx_in(cstring) TO publicuser;


--
-- Name: gidx_out(gidx); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION gidx_out(gidx) FROM PUBLIC;
REVOKE ALL ON FUNCTION gidx_out(gidx) FROM postgres;
GRANT ALL ON FUNCTION gidx_out(gidx) TO postgres;
GRANT ALL ON FUNCTION gidx_out(gidx) TO PUBLIC;
GRANT ALL ON FUNCTION gidx_out(gidx) TO publicuser;


--
-- Name: pgis_abs_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_abs_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_abs_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION pgis_abs_in(cstring) TO postgres;
GRANT ALL ON FUNCTION pgis_abs_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_abs_in(cstring) TO publicuser;


--
-- Name: pgis_abs_out(pgis_abs); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_abs_out(pgis_abs) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_abs_out(pgis_abs) FROM postgres;
GRANT ALL ON FUNCTION pgis_abs_out(pgis_abs) TO postgres;
GRANT ALL ON FUNCTION pgis_abs_out(pgis_abs) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_abs_out(pgis_abs) TO publicuser;


--
-- Name: spheroid_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION spheroid_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION spheroid_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION spheroid_in(cstring) TO postgres;
GRANT ALL ON FUNCTION spheroid_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION spheroid_in(cstring) TO publicuser;


--
-- Name: spheroid_out(spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION spheroid_out(spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION spheroid_out(spheroid) FROM postgres;
GRANT ALL ON FUNCTION spheroid_out(spheroid) TO postgres;
GRANT ALL ON FUNCTION spheroid_out(spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION spheroid_out(spheroid) TO publicuser;


--
-- Name: _st_asgeojson(integer, geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_asgeojson(integer, geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_asgeojson(integer, geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION _st_asgeojson(integer, geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION _st_asgeojson(integer, geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION _st_asgeojson(integer, geometry, integer, integer) TO publicuser;


--
-- Name: _st_asgeojson(integer, geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_asgeojson(integer, geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_asgeojson(integer, geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION _st_asgeojson(integer, geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION _st_asgeojson(integer, geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION _st_asgeojson(integer, geography, integer, integer) TO publicuser;


--
-- Name: _st_asgml(integer, geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_asgml(integer, geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_asgml(integer, geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION _st_asgml(integer, geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION _st_asgml(integer, geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION _st_asgml(integer, geometry, integer, integer) TO publicuser;


--
-- Name: _st_asgml(integer, geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_asgml(integer, geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_asgml(integer, geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION _st_asgml(integer, geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION _st_asgml(integer, geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION _st_asgml(integer, geography, integer, integer) TO publicuser;


--
-- Name: _st_askml(integer, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_askml(integer, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_askml(integer, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION _st_askml(integer, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION _st_askml(integer, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION _st_askml(integer, geometry, integer) TO publicuser;


--
-- Name: _st_askml(integer, geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_askml(integer, geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_askml(integer, geography, integer) FROM postgres;
GRANT ALL ON FUNCTION _st_askml(integer, geography, integer) TO postgres;
GRANT ALL ON FUNCTION _st_askml(integer, geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION _st_askml(integer, geography, integer) TO publicuser;


--
-- Name: _st_bestsrid(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_bestsrid(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_bestsrid(geography) FROM postgres;
GRANT ALL ON FUNCTION _st_bestsrid(geography) TO postgres;
GRANT ALL ON FUNCTION _st_bestsrid(geography) TO PUBLIC;
GRANT ALL ON FUNCTION _st_bestsrid(geography) TO publicuser;


--
-- Name: _st_bestsrid(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_bestsrid(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_bestsrid(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION _st_bestsrid(geography, geography) TO postgres;
GRANT ALL ON FUNCTION _st_bestsrid(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION _st_bestsrid(geography, geography) TO publicuser;


--
-- Name: _st_buffer(geometry, double precision, cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_buffer(geometry, double precision, cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_buffer(geometry, double precision, cstring) FROM postgres;
GRANT ALL ON FUNCTION _st_buffer(geometry, double precision, cstring) TO postgres;
GRANT ALL ON FUNCTION _st_buffer(geometry, double precision, cstring) TO PUBLIC;
GRANT ALL ON FUNCTION _st_buffer(geometry, double precision, cstring) TO publicuser;


--
-- Name: _st_contains(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_contains(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_contains(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_contains(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_contains(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_contains(geometry, geometry) TO publicuser;


--
-- Name: _st_containsproperly(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_containsproperly(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_containsproperly(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_containsproperly(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_containsproperly(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_containsproperly(geometry, geometry) TO publicuser;


--
-- Name: _st_coveredby(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_coveredby(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_coveredby(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_coveredby(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_coveredby(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_coveredby(geometry, geometry) TO publicuser;


--
-- Name: _st_covers(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_covers(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_covers(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_covers(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_covers(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_covers(geometry, geometry) TO publicuser;


--
-- Name: _st_covers(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_covers(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_covers(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION _st_covers(geography, geography) TO postgres;
GRANT ALL ON FUNCTION _st_covers(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION _st_covers(geography, geography) TO publicuser;


--
-- Name: _st_crosses(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_crosses(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_crosses(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_crosses(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_crosses(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_crosses(geometry, geometry) TO publicuser;


--
-- Name: _st_dfullywithin(geometry, geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_dfullywithin(geometry, geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_dfullywithin(geometry, geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION _st_dfullywithin(geometry, geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION _st_dfullywithin(geometry, geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION _st_dfullywithin(geometry, geometry, double precision) TO publicuser;


--
-- Name: _st_distance(geography, geography, double precision, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_distance(geography, geography, double precision, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_distance(geography, geography, double precision, boolean) FROM postgres;
GRANT ALL ON FUNCTION _st_distance(geography, geography, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION _st_distance(geography, geography, double precision, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION _st_distance(geography, geography, double precision, boolean) TO publicuser;


--
-- Name: _st_dumppoints(geometry, integer[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_dumppoints(the_geom geometry, cur_path integer[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_dumppoints(the_geom geometry, cur_path integer[]) FROM postgres;
GRANT ALL ON FUNCTION _st_dumppoints(the_geom geometry, cur_path integer[]) TO postgres;
GRANT ALL ON FUNCTION _st_dumppoints(the_geom geometry, cur_path integer[]) TO PUBLIC;
GRANT ALL ON FUNCTION _st_dumppoints(the_geom geometry, cur_path integer[]) TO publicuser;


--
-- Name: _st_dwithin(geometry, geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_dwithin(geometry, geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_dwithin(geometry, geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION _st_dwithin(geometry, geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION _st_dwithin(geometry, geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION _st_dwithin(geometry, geometry, double precision) TO publicuser;


--
-- Name: _st_dwithin(geography, geography, double precision, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_dwithin(geography, geography, double precision, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_dwithin(geography, geography, double precision, boolean) FROM postgres;
GRANT ALL ON FUNCTION _st_dwithin(geography, geography, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION _st_dwithin(geography, geography, double precision, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION _st_dwithin(geography, geography, double precision, boolean) TO publicuser;


--
-- Name: _st_equals(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_equals(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_equals(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_equals(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_equals(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_equals(geometry, geometry) TO publicuser;


--
-- Name: _st_expand(geography, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_expand(geography, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_expand(geography, double precision) FROM postgres;
GRANT ALL ON FUNCTION _st_expand(geography, double precision) TO postgres;
GRANT ALL ON FUNCTION _st_expand(geography, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION _st_expand(geography, double precision) TO publicuser;


--
-- Name: _st_intersects(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_intersects(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_intersects(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_intersects(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_intersects(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_intersects(geometry, geometry) TO publicuser;


--
-- Name: _st_linecrossingdirection(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_linecrossingdirection(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_linecrossingdirection(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_linecrossingdirection(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_linecrossingdirection(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_linecrossingdirection(geometry, geometry) TO publicuser;


--
-- Name: _st_longestline(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_longestline(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_longestline(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_longestline(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_longestline(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_longestline(geometry, geometry) TO publicuser;


--
-- Name: _st_maxdistance(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_maxdistance(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_maxdistance(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_maxdistance(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_maxdistance(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_maxdistance(geometry, geometry) TO publicuser;


--
-- Name: _st_orderingequals(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_orderingequals(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_orderingequals(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_orderingequals(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_orderingequals(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_orderingequals(geometry, geometry) TO publicuser;


--
-- Name: _st_overlaps(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_overlaps(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_overlaps(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_overlaps(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_overlaps(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_overlaps(geometry, geometry) TO publicuser;


--
-- Name: _st_pointoutside(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_pointoutside(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_pointoutside(geography) FROM postgres;
GRANT ALL ON FUNCTION _st_pointoutside(geography) TO postgres;
GRANT ALL ON FUNCTION _st_pointoutside(geography) TO PUBLIC;
GRANT ALL ON FUNCTION _st_pointoutside(geography) TO publicuser;


--
-- Name: _st_touches(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_touches(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_touches(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_touches(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_touches(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_touches(geometry, geometry) TO publicuser;


--
-- Name: _st_within(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION _st_within(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION _st_within(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION _st_within(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION _st_within(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION _st_within(geometry, geometry) TO publicuser;


--
-- Name: addauth(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addauth(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION addauth(text) FROM postgres;
GRANT ALL ON FUNCTION addauth(text) TO postgres;
GRANT ALL ON FUNCTION addauth(text) TO PUBLIC;
GRANT ALL ON FUNCTION addauth(text) TO publicuser;


--
-- Name: addbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION addbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION addbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION addbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION addbbox(geometry) TO publicuser;


--
-- Name: addgeometrycolumn(character varying, character varying, integer, character varying, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addgeometrycolumn(character varying, character varying, integer, character varying, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION addgeometrycolumn(character varying, character varying, integer, character varying, integer) FROM postgres;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, integer, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, integer, character varying, integer) TO PUBLIC;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, integer, character varying, integer) TO publicuser;


--
-- Name: addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) FROM postgres;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) TO PUBLIC;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, integer, character varying, integer) TO publicuser;


--
-- Name: addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) FROM postgres;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) TO PUBLIC;
GRANT ALL ON FUNCTION addgeometrycolumn(character varying, character varying, character varying, character varying, integer, character varying, integer) TO publicuser;


--
-- Name: addpoint(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addpoint(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION addpoint(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION addpoint(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION addpoint(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION addpoint(geometry, geometry) TO publicuser;


--
-- Name: addpoint(geometry, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION addpoint(geometry, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION addpoint(geometry, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION addpoint(geometry, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION addpoint(geometry, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION addpoint(geometry, geometry, integer) TO publicuser;


--
-- Name: affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: area(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION area(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION area(geometry) FROM postgres;
GRANT ALL ON FUNCTION area(geometry) TO postgres;
GRANT ALL ON FUNCTION area(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION area(geometry) TO publicuser;


--
-- Name: area2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION area2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION area2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION area2d(geometry) TO postgres;
GRANT ALL ON FUNCTION area2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION area2d(geometry) TO publicuser;


--
-- Name: asbinary(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asbinary(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION asbinary(geometry) FROM postgres;
GRANT ALL ON FUNCTION asbinary(geometry) TO postgres;
GRANT ALL ON FUNCTION asbinary(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION asbinary(geometry) TO publicuser;


--
-- Name: asbinary(geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asbinary(geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION asbinary(geometry, text) FROM postgres;
GRANT ALL ON FUNCTION asbinary(geometry, text) TO postgres;
GRANT ALL ON FUNCTION asbinary(geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION asbinary(geometry, text) TO publicuser;


--
-- Name: asewkb(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asewkb(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION asewkb(geometry) FROM postgres;
GRANT ALL ON FUNCTION asewkb(geometry) TO postgres;
GRANT ALL ON FUNCTION asewkb(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION asewkb(geometry) TO publicuser;


--
-- Name: asewkb(geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asewkb(geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION asewkb(geometry, text) FROM postgres;
GRANT ALL ON FUNCTION asewkb(geometry, text) TO postgres;
GRANT ALL ON FUNCTION asewkb(geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION asewkb(geometry, text) TO publicuser;


--
-- Name: asewkt(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asewkt(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION asewkt(geometry) FROM postgres;
GRANT ALL ON FUNCTION asewkt(geometry) TO postgres;
GRANT ALL ON FUNCTION asewkt(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION asewkt(geometry) TO publicuser;


--
-- Name: asgml(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asgml(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION asgml(geometry) FROM postgres;
GRANT ALL ON FUNCTION asgml(geometry) TO postgres;
GRANT ALL ON FUNCTION asgml(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION asgml(geometry) TO publicuser;


--
-- Name: asgml(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION asgml(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION asgml(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION asgml(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION asgml(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION asgml(geometry, integer) TO publicuser;


--
-- Name: ashexewkb(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION ashexewkb(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION ashexewkb(geometry) FROM postgres;
GRANT ALL ON FUNCTION ashexewkb(geometry) TO postgres;
GRANT ALL ON FUNCTION ashexewkb(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION ashexewkb(geometry) TO publicuser;


--
-- Name: ashexewkb(geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION ashexewkb(geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION ashexewkb(geometry, text) FROM postgres;
GRANT ALL ON FUNCTION ashexewkb(geometry, text) TO postgres;
GRANT ALL ON FUNCTION ashexewkb(geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION ashexewkb(geometry, text) TO publicuser;


--
-- Name: askml(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION askml(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION askml(geometry) FROM postgres;
GRANT ALL ON FUNCTION askml(geometry) TO postgres;
GRANT ALL ON FUNCTION askml(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION askml(geometry) TO publicuser;


--
-- Name: askml(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION askml(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION askml(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION askml(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION askml(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION askml(geometry, integer) TO publicuser;


--
-- Name: askml(integer, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION askml(integer, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION askml(integer, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION askml(integer, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION askml(integer, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION askml(integer, geometry, integer) TO publicuser;


--
-- Name: assvg(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION assvg(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION assvg(geometry) FROM postgres;
GRANT ALL ON FUNCTION assvg(geometry) TO postgres;
GRANT ALL ON FUNCTION assvg(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION assvg(geometry) TO publicuser;


--
-- Name: assvg(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION assvg(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION assvg(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION assvg(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION assvg(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION assvg(geometry, integer) TO publicuser;


--
-- Name: assvg(geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION assvg(geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION assvg(geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION assvg(geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION assvg(geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION assvg(geometry, integer, integer) TO publicuser;


--
-- Name: astext(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION astext(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION astext(geometry) FROM postgres;
GRANT ALL ON FUNCTION astext(geometry) TO postgres;
GRANT ALL ON FUNCTION astext(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION astext(geometry) TO publicuser;


--
-- Name: azimuth(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION azimuth(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION azimuth(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION azimuth(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION azimuth(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION azimuth(geometry, geometry) TO publicuser;


--
-- Name: bdmpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION bdmpolyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION bdmpolyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION bdmpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION bdmpolyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION bdmpolyfromtext(text, integer) TO publicuser;


--
-- Name: bdpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION bdpolyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION bdpolyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION bdpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION bdpolyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION bdpolyfromtext(text, integer) TO publicuser;


--
-- Name: boundary(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION boundary(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION boundary(geometry) FROM postgres;
GRANT ALL ON FUNCTION boundary(geometry) TO postgres;
GRANT ALL ON FUNCTION boundary(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION boundary(geometry) TO publicuser;


--
-- Name: box(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION box(geometry) FROM postgres;
GRANT ALL ON FUNCTION box(geometry) TO postgres;
GRANT ALL ON FUNCTION box(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION box(geometry) TO publicuser;


--
-- Name: box(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION box(box3d) FROM postgres;
GRANT ALL ON FUNCTION box(box3d) TO postgres;
GRANT ALL ON FUNCTION box(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION box(box3d) TO publicuser;


--
-- Name: box2d(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box2d(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION box2d(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION box2d(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION box2d(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION box2d(box3d_extent) TO publicuser;


--
-- Name: box2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION box2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION box2d(geometry) TO postgres;
GRANT ALL ON FUNCTION box2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION box2d(geometry) TO publicuser;


--
-- Name: box2d(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box2d(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION box2d(box3d) FROM postgres;
GRANT ALL ON FUNCTION box2d(box3d) TO postgres;
GRANT ALL ON FUNCTION box2d(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION box2d(box3d) TO publicuser;


--
-- Name: box3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION box3d(geometry) TO postgres;
GRANT ALL ON FUNCTION box3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION box3d(geometry) TO publicuser;


--
-- Name: box3d(box2d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d(box2d) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d(box2d) FROM postgres;
GRANT ALL ON FUNCTION box3d(box2d) TO postgres;
GRANT ALL ON FUNCTION box3d(box2d) TO PUBLIC;
GRANT ALL ON FUNCTION box3d(box2d) TO publicuser;


--
-- Name: box3d_extent(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3d_extent(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3d_extent(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION box3d_extent(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION box3d_extent(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION box3d_extent(box3d_extent) TO publicuser;


--
-- Name: box3dtobox(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION box3dtobox(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION box3dtobox(box3d) FROM postgres;
GRANT ALL ON FUNCTION box3dtobox(box3d) TO postgres;
GRANT ALL ON FUNCTION box3dtobox(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION box3dtobox(box3d) TO publicuser;


--
-- Name: buffer(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION buffer(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION buffer(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION buffer(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION buffer(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION buffer(geometry, double precision) TO publicuser;


--
-- Name: buffer(geometry, double precision, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION buffer(geometry, double precision, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION buffer(geometry, double precision, integer) FROM postgres;
GRANT ALL ON FUNCTION buffer(geometry, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION buffer(geometry, double precision, integer) TO PUBLIC;
GRANT ALL ON FUNCTION buffer(geometry, double precision, integer) TO publicuser;


--
-- Name: buildarea(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION buildarea(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION buildarea(geometry) FROM postgres;
GRANT ALL ON FUNCTION buildarea(geometry) TO postgres;
GRANT ALL ON FUNCTION buildarea(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION buildarea(geometry) TO publicuser;


--
-- Name: bytea(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION bytea(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION bytea(geometry) FROM postgres;
GRANT ALL ON FUNCTION bytea(geometry) TO postgres;
GRANT ALL ON FUNCTION bytea(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION bytea(geometry) TO publicuser;


--
-- Name: centroid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION centroid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION centroid(geometry) FROM postgres;
GRANT ALL ON FUNCTION centroid(geometry) TO postgres;
GRANT ALL ON FUNCTION centroid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION centroid(geometry) TO publicuser;


--
-- Name: checkauth(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION checkauth(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION checkauth(text, text) FROM postgres;
GRANT ALL ON FUNCTION checkauth(text, text) TO postgres;
GRANT ALL ON FUNCTION checkauth(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION checkauth(text, text) TO publicuser;


--
-- Name: checkauth(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION checkauth(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION checkauth(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION checkauth(text, text, text) TO postgres;
GRANT ALL ON FUNCTION checkauth(text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION checkauth(text, text, text) TO publicuser;


--
-- Name: checkauthtrigger(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION checkauthtrigger() FROM PUBLIC;
REVOKE ALL ON FUNCTION checkauthtrigger() FROM postgres;
GRANT ALL ON FUNCTION checkauthtrigger() TO postgres;
GRANT ALL ON FUNCTION checkauthtrigger() TO PUBLIC;
GRANT ALL ON FUNCTION checkauthtrigger() TO publicuser;


--
-- Name: collect(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION collect(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION collect(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION collect(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION collect(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION collect(geometry, geometry) TO publicuser;


--
-- Name: combine_bbox(box2d, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION combine_bbox(box2d, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION combine_bbox(box2d, geometry) FROM postgres;
GRANT ALL ON FUNCTION combine_bbox(box2d, geometry) TO postgres;
GRANT ALL ON FUNCTION combine_bbox(box2d, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION combine_bbox(box2d, geometry) TO publicuser;


--
-- Name: combine_bbox(box3d_extent, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION combine_bbox(box3d_extent, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION combine_bbox(box3d_extent, geometry) FROM postgres;
GRANT ALL ON FUNCTION combine_bbox(box3d_extent, geometry) TO postgres;
GRANT ALL ON FUNCTION combine_bbox(box3d_extent, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION combine_bbox(box3d_extent, geometry) TO publicuser;


--
-- Name: combine_bbox(box3d, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION combine_bbox(box3d, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION combine_bbox(box3d, geometry) FROM postgres;
GRANT ALL ON FUNCTION combine_bbox(box3d, geometry) TO postgres;
GRANT ALL ON FUNCTION combine_bbox(box3d, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION combine_bbox(box3d, geometry) TO publicuser;


--
-- Name: compression(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION compression(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION compression(chip) FROM postgres;
GRANT ALL ON FUNCTION compression(chip) TO postgres;
GRANT ALL ON FUNCTION compression(chip) TO PUBLIC;
GRANT ALL ON FUNCTION compression(chip) TO publicuser;


--
-- Name: contains(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION contains(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION contains(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION contains(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION contains(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION contains(geometry, geometry) TO publicuser;


--
-- Name: convexhull(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION convexhull(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION convexhull(geometry) FROM postgres;
GRANT ALL ON FUNCTION convexhull(geometry) TO postgres;
GRANT ALL ON FUNCTION convexhull(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION convexhull(geometry) TO publicuser;


--
-- Name: crosses(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION crosses(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION crosses(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION crosses(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION crosses(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION crosses(geometry, geometry) TO publicuser;


--
-- Name: datatype(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION datatype(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION datatype(chip) FROM postgres;
GRANT ALL ON FUNCTION datatype(chip) TO postgres;
GRANT ALL ON FUNCTION datatype(chip) TO PUBLIC;
GRANT ALL ON FUNCTION datatype(chip) TO publicuser;


--
-- Name: difference(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION difference(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION difference(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION difference(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION difference(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION difference(geometry, geometry) TO publicuser;


--
-- Name: dimension(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dimension(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION dimension(geometry) FROM postgres;
GRANT ALL ON FUNCTION dimension(geometry) TO postgres;
GRANT ALL ON FUNCTION dimension(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION dimension(geometry) TO publicuser;


--
-- Name: disablelongtransactions(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION disablelongtransactions() FROM PUBLIC;
REVOKE ALL ON FUNCTION disablelongtransactions() FROM postgres;
GRANT ALL ON FUNCTION disablelongtransactions() TO postgres;
GRANT ALL ON FUNCTION disablelongtransactions() TO PUBLIC;
GRANT ALL ON FUNCTION disablelongtransactions() TO publicuser;


--
-- Name: disjoint(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION disjoint(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION disjoint(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION disjoint(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION disjoint(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION disjoint(geometry, geometry) TO publicuser;


--
-- Name: distance(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION distance(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION distance(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION distance(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION distance(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION distance(geometry, geometry) TO publicuser;


--
-- Name: distance_sphere(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION distance_sphere(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION distance_sphere(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION distance_sphere(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION distance_sphere(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION distance_sphere(geometry, geometry) TO publicuser;


--
-- Name: distance_spheroid(geometry, geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION distance_spheroid(geometry, geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION distance_spheroid(geometry, geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION distance_spheroid(geometry, geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION distance_spheroid(geometry, geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION distance_spheroid(geometry, geometry, spheroid) TO publicuser;


--
-- Name: dropbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION dropbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION dropbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION dropbbox(geometry) TO publicuser;


--
-- Name: dropgeometrycolumn(character varying, character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropgeometrycolumn(character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropgeometrycolumn(character varying, character varying) FROM postgres;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying) TO PUBLIC;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying) TO publicuser;


--
-- Name: dropgeometrycolumn(character varying, character varying, character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying) FROM postgres;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying) TO PUBLIC;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying) TO publicuser;


--
-- Name: dropgeometrycolumn(character varying, character varying, character varying, character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying, character varying) FROM postgres;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying, character varying) TO PUBLIC;
GRANT ALL ON FUNCTION dropgeometrycolumn(character varying, character varying, character varying, character varying) TO publicuser;


--
-- Name: dropgeometrytable(character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropgeometrytable(character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropgeometrytable(character varying) FROM postgres;
GRANT ALL ON FUNCTION dropgeometrytable(character varying) TO postgres;
GRANT ALL ON FUNCTION dropgeometrytable(character varying) TO PUBLIC;
GRANT ALL ON FUNCTION dropgeometrytable(character varying) TO publicuser;


--
-- Name: dropgeometrytable(character varying, character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropgeometrytable(character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropgeometrytable(character varying, character varying) FROM postgres;
GRANT ALL ON FUNCTION dropgeometrytable(character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION dropgeometrytable(character varying, character varying) TO PUBLIC;
GRANT ALL ON FUNCTION dropgeometrytable(character varying, character varying) TO publicuser;


--
-- Name: dropgeometrytable(character varying, character varying, character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dropgeometrytable(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION dropgeometrytable(character varying, character varying, character varying) FROM postgres;
GRANT ALL ON FUNCTION dropgeometrytable(character varying, character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION dropgeometrytable(character varying, character varying, character varying) TO PUBLIC;
GRANT ALL ON FUNCTION dropgeometrytable(character varying, character varying, character varying) TO publicuser;


--
-- Name: dump(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dump(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION dump(geometry) FROM postgres;
GRANT ALL ON FUNCTION dump(geometry) TO postgres;
GRANT ALL ON FUNCTION dump(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION dump(geometry) TO publicuser;


--
-- Name: dumprings(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION dumprings(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION dumprings(geometry) FROM postgres;
GRANT ALL ON FUNCTION dumprings(geometry) TO postgres;
GRANT ALL ON FUNCTION dumprings(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION dumprings(geometry) TO publicuser;


--
-- Name: enablelongtransactions(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION enablelongtransactions() FROM PUBLIC;
REVOKE ALL ON FUNCTION enablelongtransactions() FROM postgres;
GRANT ALL ON FUNCTION enablelongtransactions() TO postgres;
GRANT ALL ON FUNCTION enablelongtransactions() TO PUBLIC;
GRANT ALL ON FUNCTION enablelongtransactions() TO publicuser;


--
-- Name: endpoint(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION endpoint(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION endpoint(geometry) FROM postgres;
GRANT ALL ON FUNCTION endpoint(geometry) TO postgres;
GRANT ALL ON FUNCTION endpoint(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION endpoint(geometry) TO publicuser;


--
-- Name: envelope(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION envelope(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION envelope(geometry) FROM postgres;
GRANT ALL ON FUNCTION envelope(geometry) TO postgres;
GRANT ALL ON FUNCTION envelope(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION envelope(geometry) TO publicuser;


--
-- Name: equals(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION equals(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION equals(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION equals(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION equals(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION equals(geometry, geometry) TO publicuser;


--
-- Name: estimated_extent(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION estimated_extent(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION estimated_extent(text, text) FROM postgres;
GRANT ALL ON FUNCTION estimated_extent(text, text) TO postgres;
GRANT ALL ON FUNCTION estimated_extent(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION estimated_extent(text, text) TO publicuser;


--
-- Name: estimated_extent(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION estimated_extent(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION estimated_extent(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION estimated_extent(text, text, text) TO postgres;
GRANT ALL ON FUNCTION estimated_extent(text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION estimated_extent(text, text, text) TO publicuser;


--
-- Name: expand(box3d, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION expand(box3d, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION expand(box3d, double precision) FROM postgres;
GRANT ALL ON FUNCTION expand(box3d, double precision) TO postgres;
GRANT ALL ON FUNCTION expand(box3d, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION expand(box3d, double precision) TO publicuser;


--
-- Name: expand(box2d, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION expand(box2d, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION expand(box2d, double precision) FROM postgres;
GRANT ALL ON FUNCTION expand(box2d, double precision) TO postgres;
GRANT ALL ON FUNCTION expand(box2d, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION expand(box2d, double precision) TO publicuser;


--
-- Name: expand(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION expand(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION expand(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION expand(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION expand(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION expand(geometry, double precision) TO publicuser;


--
-- Name: exteriorring(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION exteriorring(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION exteriorring(geometry) FROM postgres;
GRANT ALL ON FUNCTION exteriorring(geometry) TO postgres;
GRANT ALL ON FUNCTION exteriorring(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION exteriorring(geometry) TO publicuser;


--
-- Name: factor(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION factor(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION factor(chip) FROM postgres;
GRANT ALL ON FUNCTION factor(chip) TO postgres;
GRANT ALL ON FUNCTION factor(chip) TO PUBLIC;
GRANT ALL ON FUNCTION factor(chip) TO publicuser;


--
-- Name: find_extent(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION find_extent(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION find_extent(text, text) FROM postgres;
GRANT ALL ON FUNCTION find_extent(text, text) TO postgres;
GRANT ALL ON FUNCTION find_extent(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION find_extent(text, text) TO publicuser;


--
-- Name: find_extent(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION find_extent(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION find_extent(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION find_extent(text, text, text) TO postgres;
GRANT ALL ON FUNCTION find_extent(text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION find_extent(text, text, text) TO publicuser;


--
-- Name: find_srid(character varying, character varying, character varying); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION find_srid(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION find_srid(character varying, character varying, character varying) FROM postgres;
GRANT ALL ON FUNCTION find_srid(character varying, character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION find_srid(character varying, character varying, character varying) TO PUBLIC;
GRANT ALL ON FUNCTION find_srid(character varying, character varying, character varying) TO publicuser;


--
-- Name: fix_geometry_columns(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION fix_geometry_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION fix_geometry_columns() FROM postgres;
GRANT ALL ON FUNCTION fix_geometry_columns() TO postgres;
GRANT ALL ON FUNCTION fix_geometry_columns() TO PUBLIC;
GRANT ALL ON FUNCTION fix_geometry_columns() TO publicuser;


--
-- Name: force_2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION force_2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION force_2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION force_2d(geometry) TO postgres;
GRANT ALL ON FUNCTION force_2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION force_2d(geometry) TO publicuser;


--
-- Name: force_3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION force_3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION force_3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION force_3d(geometry) TO postgres;
GRANT ALL ON FUNCTION force_3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION force_3d(geometry) TO publicuser;


--
-- Name: force_3dm(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION force_3dm(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION force_3dm(geometry) FROM postgres;
GRANT ALL ON FUNCTION force_3dm(geometry) TO postgres;
GRANT ALL ON FUNCTION force_3dm(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION force_3dm(geometry) TO publicuser;


--
-- Name: force_3dz(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION force_3dz(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION force_3dz(geometry) FROM postgres;
GRANT ALL ON FUNCTION force_3dz(geometry) TO postgres;
GRANT ALL ON FUNCTION force_3dz(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION force_3dz(geometry) TO publicuser;


--
-- Name: force_4d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION force_4d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION force_4d(geometry) FROM postgres;
GRANT ALL ON FUNCTION force_4d(geometry) TO postgres;
GRANT ALL ON FUNCTION force_4d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION force_4d(geometry) TO publicuser;


--
-- Name: force_collection(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION force_collection(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION force_collection(geometry) FROM postgres;
GRANT ALL ON FUNCTION force_collection(geometry) TO postgres;
GRANT ALL ON FUNCTION force_collection(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION force_collection(geometry) TO publicuser;


--
-- Name: forcerhr(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION forcerhr(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION forcerhr(geometry) FROM postgres;
GRANT ALL ON FUNCTION forcerhr(geometry) TO postgres;
GRANT ALL ON FUNCTION forcerhr(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION forcerhr(geometry) TO publicuser;


--
-- Name: geography(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography(geometry) FROM postgres;
GRANT ALL ON FUNCTION geography(geometry) TO postgres;
GRANT ALL ON FUNCTION geography(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geography(geometry) TO publicuser;


--
-- Name: geography(geography, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography(geography, integer, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography(geography, integer, boolean) FROM postgres;
GRANT ALL ON FUNCTION geography(geography, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION geography(geography, integer, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION geography(geography, integer, boolean) TO publicuser;


--
-- Name: geography_cmp(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_cmp(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_cmp(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_cmp(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_cmp(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_cmp(geography, geography) TO publicuser;


--
-- Name: geography_eq(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_eq(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_eq(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_eq(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_eq(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_eq(geography, geography) TO publicuser;


--
-- Name: geography_ge(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_ge(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_ge(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_ge(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_ge(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_ge(geography, geography) TO publicuser;


--
-- Name: geography_gist_compress(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_compress(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_compress(internal) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_compress(internal) TO postgres;
GRANT ALL ON FUNCTION geography_gist_compress(internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_compress(internal) TO publicuser;


--
-- Name: geography_gist_consistent(internal, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_consistent(internal, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_consistent(internal, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_consistent(internal, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION geography_gist_consistent(internal, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_consistent(internal, geometry, integer) TO publicuser;


--
-- Name: geography_gist_decompress(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_decompress(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_decompress(internal) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION geography_gist_decompress(internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_decompress(internal) TO publicuser;


--
-- Name: geography_gist_join_selectivity(internal, oid, internal, smallint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_join_selectivity(internal, oid, internal, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_join_selectivity(internal, oid, internal, smallint) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_join_selectivity(internal, oid, internal, smallint) TO postgres;
GRANT ALL ON FUNCTION geography_gist_join_selectivity(internal, oid, internal, smallint) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_join_selectivity(internal, oid, internal, smallint) TO publicuser;


--
-- Name: geography_gist_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_penalty(internal, internal, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_penalty(internal, internal, internal) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION geography_gist_penalty(internal, internal, internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_penalty(internal, internal, internal) TO publicuser;


--
-- Name: geography_gist_picksplit(internal, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_picksplit(internal, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_picksplit(internal, internal) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION geography_gist_picksplit(internal, internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_picksplit(internal, internal) TO publicuser;


--
-- Name: geography_gist_same(box2d, box2d, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_same(box2d, box2d, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_same(box2d, box2d, internal) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_same(box2d, box2d, internal) TO postgres;
GRANT ALL ON FUNCTION geography_gist_same(box2d, box2d, internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_same(box2d, box2d, internal) TO publicuser;


--
-- Name: geography_gist_selectivity(internal, oid, internal, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_selectivity(internal, oid, internal, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_selectivity(internal, oid, internal, integer) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_selectivity(internal, oid, internal, integer) TO postgres;
GRANT ALL ON FUNCTION geography_gist_selectivity(internal, oid, internal, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_selectivity(internal, oid, internal, integer) TO publicuser;


--
-- Name: geography_gist_union(bytea, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gist_union(bytea, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gist_union(bytea, internal) FROM postgres;
GRANT ALL ON FUNCTION geography_gist_union(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION geography_gist_union(bytea, internal) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gist_union(bytea, internal) TO publicuser;


--
-- Name: geography_gt(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_gt(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_gt(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_gt(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_gt(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_gt(geography, geography) TO publicuser;


--
-- Name: geography_le(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_le(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_le(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_le(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_le(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_le(geography, geography) TO publicuser;


--
-- Name: geography_lt(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_lt(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_lt(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_lt(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_lt(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_lt(geography, geography) TO publicuser;


--
-- Name: geography_overlaps(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_overlaps(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_overlaps(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION geography_overlaps(geography, geography) TO postgres;
GRANT ALL ON FUNCTION geography_overlaps(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION geography_overlaps(geography, geography) TO publicuser;


--
-- Name: geography_typmod_dims(integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_typmod_dims(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_typmod_dims(integer) FROM postgres;
GRANT ALL ON FUNCTION geography_typmod_dims(integer) TO postgres;
GRANT ALL ON FUNCTION geography_typmod_dims(integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_typmod_dims(integer) TO publicuser;


--
-- Name: geography_typmod_srid(integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_typmod_srid(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_typmod_srid(integer) FROM postgres;
GRANT ALL ON FUNCTION geography_typmod_srid(integer) TO postgres;
GRANT ALL ON FUNCTION geography_typmod_srid(integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_typmod_srid(integer) TO publicuser;


--
-- Name: geography_typmod_type(integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geography_typmod_type(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geography_typmod_type(integer) FROM postgres;
GRANT ALL ON FUNCTION geography_typmod_type(integer) TO postgres;
GRANT ALL ON FUNCTION geography_typmod_type(integer) TO PUBLIC;
GRANT ALL ON FUNCTION geography_typmod_type(integer) TO publicuser;


--
-- Name: geomcollfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomcollfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomcollfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION geomcollfromtext(text) TO postgres;
GRANT ALL ON FUNCTION geomcollfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION geomcollfromtext(text) TO publicuser;


--
-- Name: geomcollfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomcollfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomcollfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION geomcollfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION geomcollfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geomcollfromtext(text, integer) TO publicuser;


--
-- Name: geomcollfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomcollfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomcollfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION geomcollfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION geomcollfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION geomcollfromwkb(bytea) TO publicuser;


--
-- Name: geomcollfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomcollfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomcollfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION geomcollfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION geomcollfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geomcollfromwkb(bytea, integer) TO publicuser;


--
-- Name: geometry(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION geometry(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION geometry(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(box3d_extent) TO publicuser;


--
-- Name: geometry(box2d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(box2d) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(box2d) FROM postgres;
GRANT ALL ON FUNCTION geometry(box2d) TO postgres;
GRANT ALL ON FUNCTION geometry(box2d) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(box2d) TO publicuser;


--
-- Name: geometry(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(box3d) FROM postgres;
GRANT ALL ON FUNCTION geometry(box3d) TO postgres;
GRANT ALL ON FUNCTION geometry(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(box3d) TO publicuser;


--
-- Name: geometry(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(text) FROM postgres;
GRANT ALL ON FUNCTION geometry(text) TO postgres;
GRANT ALL ON FUNCTION geometry(text) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(text) TO publicuser;


--
-- Name: geometry(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(chip) FROM postgres;
GRANT ALL ON FUNCTION geometry(chip) TO postgres;
GRANT ALL ON FUNCTION geometry(chip) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(chip) TO publicuser;


--
-- Name: geometry(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(bytea) FROM postgres;
GRANT ALL ON FUNCTION geometry(bytea) TO postgres;
GRANT ALL ON FUNCTION geometry(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(bytea) TO publicuser;


--
-- Name: geometry(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry(geography) FROM postgres;
GRANT ALL ON FUNCTION geometry(geography) TO postgres;
GRANT ALL ON FUNCTION geometry(geography) TO PUBLIC;
GRANT ALL ON FUNCTION geometry(geography) TO publicuser;


--
-- Name: geometry_above(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_above(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_above(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_above(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_above(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_above(geometry, geometry) TO publicuser;


--
-- Name: geometry_below(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_below(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_below(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_below(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_below(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_below(geometry, geometry) TO publicuser;


--
-- Name: geometry_cmp(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_cmp(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_cmp(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_cmp(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_cmp(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_cmp(geometry, geometry) TO publicuser;


--
-- Name: geometry_contain(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_contain(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_contain(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_contain(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_contain(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_contain(geometry, geometry) TO publicuser;


--
-- Name: geometry_contained(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_contained(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_contained(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_contained(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_contained(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_contained(geometry, geometry) TO publicuser;


--
-- Name: geometry_eq(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_eq(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_eq(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_eq(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_eq(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_eq(geometry, geometry) TO publicuser;


--
-- Name: geometry_ge(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_ge(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_ge(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_ge(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_ge(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_ge(geometry, geometry) TO publicuser;


--
-- Name: geometry_gist_joinsel(internal, oid, internal, smallint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_gist_joinsel(internal, oid, internal, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_gist_joinsel(internal, oid, internal, smallint) FROM postgres;
GRANT ALL ON FUNCTION geometry_gist_joinsel(internal, oid, internal, smallint) TO postgres;
GRANT ALL ON FUNCTION geometry_gist_joinsel(internal, oid, internal, smallint) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_gist_joinsel(internal, oid, internal, smallint) TO publicuser;


--
-- Name: geometry_gist_sel(internal, oid, internal, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_gist_sel(internal, oid, internal, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_gist_sel(internal, oid, internal, integer) FROM postgres;
GRANT ALL ON FUNCTION geometry_gist_sel(internal, oid, internal, integer) TO postgres;
GRANT ALL ON FUNCTION geometry_gist_sel(internal, oid, internal, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_gist_sel(internal, oid, internal, integer) TO publicuser;


--
-- Name: geometry_gt(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_gt(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_gt(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_gt(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_gt(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_gt(geometry, geometry) TO publicuser;


--
-- Name: geometry_le(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_le(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_le(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_le(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_le(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_le(geometry, geometry) TO publicuser;


--
-- Name: geometry_left(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_left(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_left(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_left(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_left(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_left(geometry, geometry) TO publicuser;


--
-- Name: geometry_lt(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_lt(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_lt(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_lt(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_lt(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_lt(geometry, geometry) TO publicuser;


--
-- Name: geometry_overabove(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_overabove(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_overabove(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_overabove(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_overabove(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_overabove(geometry, geometry) TO publicuser;


--
-- Name: geometry_overbelow(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_overbelow(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_overbelow(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_overbelow(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_overbelow(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_overbelow(geometry, geometry) TO publicuser;


--
-- Name: geometry_overlap(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_overlap(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_overlap(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_overlap(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_overlap(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_overlap(geometry, geometry) TO publicuser;


--
-- Name: geometry_overleft(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_overleft(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_overleft(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_overleft(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_overleft(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_overleft(geometry, geometry) TO publicuser;


--
-- Name: geometry_overright(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_overright(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_overright(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_overright(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_overright(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_overright(geometry, geometry) TO publicuser;


--
-- Name: geometry_right(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_right(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_right(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_right(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_right(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_right(geometry, geometry) TO publicuser;


--
-- Name: geometry_same(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_same(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_same(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_same(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_same(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_same(geometry, geometry) TO publicuser;


--
-- Name: geometry_samebox(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometry_samebox(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometry_samebox(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geometry_samebox(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geometry_samebox(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometry_samebox(geometry, geometry) TO publicuser;


--
-- Name: geometryfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometryfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometryfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION geometryfromtext(text) TO postgres;
GRANT ALL ON FUNCTION geometryfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION geometryfromtext(text) TO publicuser;


--
-- Name: geometryfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometryfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometryfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION geometryfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION geometryfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geometryfromtext(text, integer) TO publicuser;


--
-- Name: geometryn(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometryn(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometryn(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION geometryn(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION geometryn(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geometryn(geometry, integer) TO publicuser;


--
-- Name: geometrytype(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geometrytype(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geometrytype(geometry) FROM postgres;
GRANT ALL ON FUNCTION geometrytype(geometry) TO postgres;
GRANT ALL ON FUNCTION geometrytype(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geometrytype(geometry) TO publicuser;


--
-- Name: geomfromewkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomfromewkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomfromewkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION geomfromewkb(bytea) TO postgres;
GRANT ALL ON FUNCTION geomfromewkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION geomfromewkb(bytea) TO publicuser;


--
-- Name: geomfromewkt(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomfromewkt(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomfromewkt(text) FROM postgres;
GRANT ALL ON FUNCTION geomfromewkt(text) TO postgres;
GRANT ALL ON FUNCTION geomfromewkt(text) TO PUBLIC;
GRANT ALL ON FUNCTION geomfromewkt(text) TO publicuser;


--
-- Name: geomfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION geomfromtext(text) TO postgres;
GRANT ALL ON FUNCTION geomfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION geomfromtext(text) TO publicuser;


--
-- Name: geomfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION geomfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION geomfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geomfromtext(text, integer) TO publicuser;


--
-- Name: geomfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION geomfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION geomfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION geomfromwkb(bytea) TO publicuser;


--
-- Name: geomfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION geomfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION geomfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION geomfromwkb(bytea, integer) TO publicuser;


--
-- Name: geomunion(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION geomunion(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION geomunion(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION geomunion(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION geomunion(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION geomunion(geometry, geometry) TO publicuser;


--
-- Name: get_proj4_from_srid(integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION get_proj4_from_srid(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_proj4_from_srid(integer) FROM postgres;
GRANT ALL ON FUNCTION get_proj4_from_srid(integer) TO postgres;
GRANT ALL ON FUNCTION get_proj4_from_srid(integer) TO PUBLIC;
GRANT ALL ON FUNCTION get_proj4_from_srid(integer) TO publicuser;


--
-- Name: getbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION getbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION getbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION getbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION getbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION getbbox(geometry) TO publicuser;


--
-- Name: getsrid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION getsrid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION getsrid(geometry) FROM postgres;
GRANT ALL ON FUNCTION getsrid(geometry) TO postgres;
GRANT ALL ON FUNCTION getsrid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION getsrid(geometry) TO publicuser;


--
-- Name: gettransactionid(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION gettransactionid() FROM PUBLIC;
REVOKE ALL ON FUNCTION gettransactionid() FROM postgres;
GRANT ALL ON FUNCTION gettransactionid() TO postgres;
GRANT ALL ON FUNCTION gettransactionid() TO PUBLIC;
GRANT ALL ON FUNCTION gettransactionid() TO publicuser;


--
-- Name: hasbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION hasbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION hasbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION hasbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION hasbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION hasbbox(geometry) TO publicuser;


--
-- Name: height(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION height(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION height(chip) FROM postgres;
GRANT ALL ON FUNCTION height(chip) TO postgres;
GRANT ALL ON FUNCTION height(chip) TO PUBLIC;
GRANT ALL ON FUNCTION height(chip) TO publicuser;


--
-- Name: interiorringn(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION interiorringn(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION interiorringn(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION interiorringn(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION interiorringn(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION interiorringn(geometry, integer) TO publicuser;


--
-- Name: intersection(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION intersection(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION intersection(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION intersection(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION intersection(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION intersection(geometry, geometry) TO publicuser;


--
-- Name: intersects(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION intersects(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION intersects(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION intersects(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION intersects(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION intersects(geometry, geometry) TO publicuser;


--
-- Name: isclosed(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION isclosed(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION isclosed(geometry) FROM postgres;
GRANT ALL ON FUNCTION isclosed(geometry) TO postgres;
GRANT ALL ON FUNCTION isclosed(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION isclosed(geometry) TO publicuser;


--
-- Name: isempty(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION isempty(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION isempty(geometry) FROM postgres;
GRANT ALL ON FUNCTION isempty(geometry) TO postgres;
GRANT ALL ON FUNCTION isempty(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION isempty(geometry) TO publicuser;


--
-- Name: isring(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION isring(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION isring(geometry) FROM postgres;
GRANT ALL ON FUNCTION isring(geometry) TO postgres;
GRANT ALL ON FUNCTION isring(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION isring(geometry) TO publicuser;


--
-- Name: issimple(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION issimple(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION issimple(geometry) FROM postgres;
GRANT ALL ON FUNCTION issimple(geometry) TO postgres;
GRANT ALL ON FUNCTION issimple(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION issimple(geometry) TO publicuser;


--
-- Name: isvalid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION isvalid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION isvalid(geometry) FROM postgres;
GRANT ALL ON FUNCTION isvalid(geometry) TO postgres;
GRANT ALL ON FUNCTION isvalid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION isvalid(geometry) TO publicuser;


--
-- Name: length(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION length(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION length(geometry) FROM postgres;
GRANT ALL ON FUNCTION length(geometry) TO postgres;
GRANT ALL ON FUNCTION length(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION length(geometry) TO publicuser;


--
-- Name: length2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION length2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION length2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION length2d(geometry) TO postgres;
GRANT ALL ON FUNCTION length2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION length2d(geometry) TO publicuser;


--
-- Name: length2d_spheroid(geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION length2d_spheroid(geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION length2d_spheroid(geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION length2d_spheroid(geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION length2d_spheroid(geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION length2d_spheroid(geometry, spheroid) TO publicuser;


--
-- Name: length3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION length3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION length3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION length3d(geometry) TO postgres;
GRANT ALL ON FUNCTION length3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION length3d(geometry) TO publicuser;


--
-- Name: length3d_spheroid(geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION length3d_spheroid(geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION length3d_spheroid(geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION length3d_spheroid(geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION length3d_spheroid(geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION length3d_spheroid(geometry, spheroid) TO publicuser;


--
-- Name: length_spheroid(geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION length_spheroid(geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION length_spheroid(geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION length_spheroid(geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION length_spheroid(geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION length_spheroid(geometry, spheroid) TO publicuser;


--
-- Name: line_interpolate_point(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION line_interpolate_point(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION line_interpolate_point(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION line_interpolate_point(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION line_interpolate_point(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION line_interpolate_point(geometry, double precision) TO publicuser;


--
-- Name: line_locate_point(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION line_locate_point(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION line_locate_point(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION line_locate_point(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION line_locate_point(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION line_locate_point(geometry, geometry) TO publicuser;


--
-- Name: line_substring(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION line_substring(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION line_substring(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION line_substring(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION line_substring(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION line_substring(geometry, double precision, double precision) TO publicuser;


--
-- Name: linefrommultipoint(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linefrommultipoint(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION linefrommultipoint(geometry) FROM postgres;
GRANT ALL ON FUNCTION linefrommultipoint(geometry) TO postgres;
GRANT ALL ON FUNCTION linefrommultipoint(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION linefrommultipoint(geometry) TO publicuser;


--
-- Name: linefromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linefromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION linefromtext(text) FROM postgres;
GRANT ALL ON FUNCTION linefromtext(text) TO postgres;
GRANT ALL ON FUNCTION linefromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION linefromtext(text) TO publicuser;


--
-- Name: linefromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linefromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION linefromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION linefromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION linefromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION linefromtext(text, integer) TO publicuser;


--
-- Name: linefromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linefromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION linefromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION linefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION linefromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION linefromwkb(bytea) TO publicuser;


--
-- Name: linefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linefromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION linefromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION linefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION linefromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION linefromwkb(bytea, integer) TO publicuser;


--
-- Name: linemerge(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linemerge(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION linemerge(geometry) FROM postgres;
GRANT ALL ON FUNCTION linemerge(geometry) TO postgres;
GRANT ALL ON FUNCTION linemerge(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION linemerge(geometry) TO publicuser;


--
-- Name: linestringfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linestringfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION linestringfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION linestringfromtext(text) TO postgres;
GRANT ALL ON FUNCTION linestringfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION linestringfromtext(text) TO publicuser;


--
-- Name: linestringfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linestringfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION linestringfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION linestringfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION linestringfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION linestringfromtext(text, integer) TO publicuser;


--
-- Name: linestringfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linestringfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION linestringfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION linestringfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION linestringfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION linestringfromwkb(bytea) TO publicuser;


--
-- Name: linestringfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION linestringfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION linestringfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION linestringfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION linestringfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION linestringfromwkb(bytea, integer) TO publicuser;


--
-- Name: locate_along_measure(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION locate_along_measure(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION locate_along_measure(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION locate_along_measure(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION locate_along_measure(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION locate_along_measure(geometry, double precision) TO publicuser;


--
-- Name: locate_between_measures(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION locate_between_measures(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION locate_between_measures(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION locate_between_measures(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION locate_between_measures(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION locate_between_measures(geometry, double precision, double precision) TO publicuser;


--
-- Name: lockrow(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lockrow(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION lockrow(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text) TO postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION lockrow(text, text, text) TO publicuser;


--
-- Name: lockrow(text, text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lockrow(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION lockrow(text, text, text, text) FROM postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text, text) TO postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION lockrow(text, text, text, text) TO publicuser;


--
-- Name: lockrow(text, text, text, timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lockrow(text, text, text, timestamp without time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION lockrow(text, text, text, timestamp without time zone) FROM postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text, timestamp without time zone) TO postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text, timestamp without time zone) TO PUBLIC;
GRANT ALL ON FUNCTION lockrow(text, text, text, timestamp without time zone) TO publicuser;


--
-- Name: lockrow(text, text, text, text, timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lockrow(text, text, text, text, timestamp without time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION lockrow(text, text, text, text, timestamp without time zone) FROM postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text, text, timestamp without time zone) TO postgres;
GRANT ALL ON FUNCTION lockrow(text, text, text, text, timestamp without time zone) TO PUBLIC;
GRANT ALL ON FUNCTION lockrow(text, text, text, text, timestamp without time zone) TO publicuser;


--
-- Name: longtransactionsenabled(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION longtransactionsenabled() FROM PUBLIC;
REVOKE ALL ON FUNCTION longtransactionsenabled() FROM postgres;
GRANT ALL ON FUNCTION longtransactionsenabled() TO postgres;
GRANT ALL ON FUNCTION longtransactionsenabled() TO PUBLIC;
GRANT ALL ON FUNCTION longtransactionsenabled() TO publicuser;


--
-- Name: lwgeom_gist_compress(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_compress(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_compress(internal) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_compress(internal) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_compress(internal) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_compress(internal) TO publicuser;


--
-- Name: lwgeom_gist_consistent(internal, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_consistent(internal, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_consistent(internal, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_consistent(internal, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_consistent(internal, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_consistent(internal, geometry, integer) TO publicuser;


--
-- Name: lwgeom_gist_decompress(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_decompress(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_decompress(internal) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_decompress(internal) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_decompress(internal) TO publicuser;


--
-- Name: lwgeom_gist_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_penalty(internal, internal, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_penalty(internal, internal, internal) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_penalty(internal, internal, internal) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_penalty(internal, internal, internal) TO publicuser;


--
-- Name: lwgeom_gist_picksplit(internal, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_picksplit(internal, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_picksplit(internal, internal) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_picksplit(internal, internal) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_picksplit(internal, internal) TO publicuser;


--
-- Name: lwgeom_gist_same(box2d, box2d, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_same(box2d, box2d, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_same(box2d, box2d, internal) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_same(box2d, box2d, internal) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_same(box2d, box2d, internal) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_same(box2d, box2d, internal) TO publicuser;


--
-- Name: lwgeom_gist_union(bytea, internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION lwgeom_gist_union(bytea, internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION lwgeom_gist_union(bytea, internal) FROM postgres;
GRANT ALL ON FUNCTION lwgeom_gist_union(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION lwgeom_gist_union(bytea, internal) TO PUBLIC;
GRANT ALL ON FUNCTION lwgeom_gist_union(bytea, internal) TO publicuser;


--
-- Name: m(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION m(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION m(geometry) FROM postgres;
GRANT ALL ON FUNCTION m(geometry) TO postgres;
GRANT ALL ON FUNCTION m(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION m(geometry) TO publicuser;


--
-- Name: makebox2d(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makebox2d(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION makebox2d(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION makebox2d(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION makebox2d(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION makebox2d(geometry, geometry) TO publicuser;


--
-- Name: makebox3d(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makebox3d(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION makebox3d(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION makebox3d(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION makebox3d(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION makebox3d(geometry, geometry) TO publicuser;


--
-- Name: makeline(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makeline(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION makeline(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION makeline(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION makeline(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION makeline(geometry, geometry) TO publicuser;


--
-- Name: makeline_garray(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makeline_garray(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION makeline_garray(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION makeline_garray(geometry[]) TO postgres;
GRANT ALL ON FUNCTION makeline_garray(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION makeline_garray(geometry[]) TO publicuser;


--
-- Name: makepoint(double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makepoint(double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION makepoint(double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION makepoint(double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION makepoint(double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION makepoint(double precision, double precision) TO publicuser;


--
-- Name: makepoint(double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makepoint(double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION makepoint(double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION makepoint(double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION makepoint(double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION makepoint(double precision, double precision, double precision) TO publicuser;


--
-- Name: makepoint(double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makepoint(double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION makepoint(double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION makepoint(double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION makepoint(double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION makepoint(double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: makepointm(double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makepointm(double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION makepointm(double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION makepointm(double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION makepointm(double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION makepointm(double precision, double precision, double precision) TO publicuser;


--
-- Name: makepolygon(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makepolygon(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION makepolygon(geometry) FROM postgres;
GRANT ALL ON FUNCTION makepolygon(geometry) TO postgres;
GRANT ALL ON FUNCTION makepolygon(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION makepolygon(geometry) TO publicuser;


--
-- Name: makepolygon(geometry, geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makepolygon(geometry, geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION makepolygon(geometry, geometry[]) FROM postgres;
GRANT ALL ON FUNCTION makepolygon(geometry, geometry[]) TO postgres;
GRANT ALL ON FUNCTION makepolygon(geometry, geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION makepolygon(geometry, geometry[]) TO publicuser;


--
-- Name: max_distance(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION max_distance(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION max_distance(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION max_distance(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION max_distance(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION max_distance(geometry, geometry) TO publicuser;


--
-- Name: mem_size(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mem_size(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION mem_size(geometry) FROM postgres;
GRANT ALL ON FUNCTION mem_size(geometry) TO postgres;
GRANT ALL ON FUNCTION mem_size(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION mem_size(geometry) TO publicuser;


--
-- Name: mlinefromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mlinefromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION mlinefromtext(text) FROM postgres;
GRANT ALL ON FUNCTION mlinefromtext(text) TO postgres;
GRANT ALL ON FUNCTION mlinefromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION mlinefromtext(text) TO publicuser;


--
-- Name: mlinefromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mlinefromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mlinefromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION mlinefromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION mlinefromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION mlinefromtext(text, integer) TO publicuser;


--
-- Name: mlinefromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mlinefromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION mlinefromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION mlinefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION mlinefromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION mlinefromwkb(bytea) TO publicuser;


--
-- Name: mlinefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mlinefromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mlinefromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION mlinefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION mlinefromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION mlinefromwkb(bytea, integer) TO publicuser;


--
-- Name: mpointfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpointfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpointfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION mpointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION mpointfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION mpointfromtext(text) TO publicuser;


--
-- Name: mpointfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpointfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpointfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION mpointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION mpointfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION mpointfromtext(text, integer) TO publicuser;


--
-- Name: mpointfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpointfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpointfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION mpointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION mpointfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION mpointfromwkb(bytea) TO publicuser;


--
-- Name: mpointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpointfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpointfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION mpointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION mpointfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION mpointfromwkb(bytea, integer) TO publicuser;


--
-- Name: mpolyfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpolyfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpolyfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION mpolyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION mpolyfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION mpolyfromtext(text) TO publicuser;


--
-- Name: mpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpolyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpolyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION mpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION mpolyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION mpolyfromtext(text, integer) TO publicuser;


--
-- Name: mpolyfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpolyfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpolyfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION mpolyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION mpolyfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION mpolyfromwkb(bytea) TO publicuser;


--
-- Name: mpolyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION mpolyfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mpolyfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION mpolyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION mpolyfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION mpolyfromwkb(bytea, integer) TO publicuser;


--
-- Name: multi(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multi(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION multi(geometry) FROM postgres;
GRANT ALL ON FUNCTION multi(geometry) TO postgres;
GRANT ALL ON FUNCTION multi(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION multi(geometry) TO publicuser;


--
-- Name: multilinefromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multilinefromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION multilinefromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION multilinefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION multilinefromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION multilinefromwkb(bytea) TO publicuser;


--
-- Name: multilinefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multilinefromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION multilinefromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION multilinefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION multilinefromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION multilinefromwkb(bytea, integer) TO publicuser;


--
-- Name: multilinestringfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multilinestringfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION multilinestringfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION multilinestringfromtext(text) TO postgres;
GRANT ALL ON FUNCTION multilinestringfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION multilinestringfromtext(text) TO publicuser;


--
-- Name: multilinestringfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multilinestringfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION multilinestringfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION multilinestringfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION multilinestringfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION multilinestringfromtext(text, integer) TO publicuser;


--
-- Name: multipointfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipointfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipointfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION multipointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION multipointfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION multipointfromtext(text) TO publicuser;


--
-- Name: multipointfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipointfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipointfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION multipointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION multipointfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION multipointfromtext(text, integer) TO publicuser;


--
-- Name: multipointfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipointfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipointfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION multipointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION multipointfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION multipointfromwkb(bytea) TO publicuser;


--
-- Name: multipointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipointfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipointfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION multipointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION multipointfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION multipointfromwkb(bytea, integer) TO publicuser;


--
-- Name: multipolyfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipolyfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipolyfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION multipolyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION multipolyfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION multipolyfromwkb(bytea) TO publicuser;


--
-- Name: multipolyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipolyfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipolyfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION multipolyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION multipolyfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION multipolyfromwkb(bytea, integer) TO publicuser;


--
-- Name: multipolygonfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipolygonfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipolygonfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION multipolygonfromtext(text) TO postgres;
GRANT ALL ON FUNCTION multipolygonfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION multipolygonfromtext(text) TO publicuser;


--
-- Name: multipolygonfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION multipolygonfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION multipolygonfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION multipolygonfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION multipolygonfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION multipolygonfromtext(text, integer) TO publicuser;


--
-- Name: ndims(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION ndims(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION ndims(geometry) FROM postgres;
GRANT ALL ON FUNCTION ndims(geometry) TO postgres;
GRANT ALL ON FUNCTION ndims(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION ndims(geometry) TO publicuser;


--
-- Name: noop(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION noop(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION noop(geometry) FROM postgres;
GRANT ALL ON FUNCTION noop(geometry) TO postgres;
GRANT ALL ON FUNCTION noop(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION noop(geometry) TO publicuser;


--
-- Name: npoints(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION npoints(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION npoints(geometry) FROM postgres;
GRANT ALL ON FUNCTION npoints(geometry) TO postgres;
GRANT ALL ON FUNCTION npoints(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION npoints(geometry) TO publicuser;


--
-- Name: nrings(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION nrings(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION nrings(geometry) FROM postgres;
GRANT ALL ON FUNCTION nrings(geometry) TO postgres;
GRANT ALL ON FUNCTION nrings(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION nrings(geometry) TO publicuser;


--
-- Name: numgeometries(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION numgeometries(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION numgeometries(geometry) FROM postgres;
GRANT ALL ON FUNCTION numgeometries(geometry) TO postgres;
GRANT ALL ON FUNCTION numgeometries(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION numgeometries(geometry) TO publicuser;


--
-- Name: numinteriorring(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION numinteriorring(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION numinteriorring(geometry) FROM postgres;
GRANT ALL ON FUNCTION numinteriorring(geometry) TO postgres;
GRANT ALL ON FUNCTION numinteriorring(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION numinteriorring(geometry) TO publicuser;


--
-- Name: numinteriorrings(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION numinteriorrings(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION numinteriorrings(geometry) FROM postgres;
GRANT ALL ON FUNCTION numinteriorrings(geometry) TO postgres;
GRANT ALL ON FUNCTION numinteriorrings(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION numinteriorrings(geometry) TO publicuser;


--
-- Name: numpoints(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION numpoints(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION numpoints(geometry) FROM postgres;
GRANT ALL ON FUNCTION numpoints(geometry) TO postgres;
GRANT ALL ON FUNCTION numpoints(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION numpoints(geometry) TO publicuser;


--
-- Name: overlaps(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "overlaps"(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION "overlaps"(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION "overlaps"(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION "overlaps"(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION "overlaps"(geometry, geometry) TO publicuser;


--
-- Name: perimeter(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION perimeter(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION perimeter(geometry) FROM postgres;
GRANT ALL ON FUNCTION perimeter(geometry) TO postgres;
GRANT ALL ON FUNCTION perimeter(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION perimeter(geometry) TO publicuser;


--
-- Name: perimeter2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION perimeter2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION perimeter2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION perimeter2d(geometry) TO postgres;
GRANT ALL ON FUNCTION perimeter2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION perimeter2d(geometry) TO publicuser;


--
-- Name: perimeter3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION perimeter3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION perimeter3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION perimeter3d(geometry) TO postgres;
GRANT ALL ON FUNCTION perimeter3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION perimeter3d(geometry) TO publicuser;


--
-- Name: pgis_geometry_accum_finalfn(pgis_abs); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_geometry_accum_finalfn(pgis_abs) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_geometry_accum_finalfn(pgis_abs) FROM postgres;
GRANT ALL ON FUNCTION pgis_geometry_accum_finalfn(pgis_abs) TO postgres;
GRANT ALL ON FUNCTION pgis_geometry_accum_finalfn(pgis_abs) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_geometry_accum_finalfn(pgis_abs) TO publicuser;


--
-- Name: pgis_geometry_accum_transfn(pgis_abs, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_geometry_accum_transfn(pgis_abs, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_geometry_accum_transfn(pgis_abs, geometry) FROM postgres;
GRANT ALL ON FUNCTION pgis_geometry_accum_transfn(pgis_abs, geometry) TO postgres;
GRANT ALL ON FUNCTION pgis_geometry_accum_transfn(pgis_abs, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_geometry_accum_transfn(pgis_abs, geometry) TO publicuser;


--
-- Name: pgis_geometry_collect_finalfn(pgis_abs); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_geometry_collect_finalfn(pgis_abs) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_geometry_collect_finalfn(pgis_abs) FROM postgres;
GRANT ALL ON FUNCTION pgis_geometry_collect_finalfn(pgis_abs) TO postgres;
GRANT ALL ON FUNCTION pgis_geometry_collect_finalfn(pgis_abs) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_geometry_collect_finalfn(pgis_abs) TO publicuser;


--
-- Name: pgis_geometry_makeline_finalfn(pgis_abs); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_geometry_makeline_finalfn(pgis_abs) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_geometry_makeline_finalfn(pgis_abs) FROM postgres;
GRANT ALL ON FUNCTION pgis_geometry_makeline_finalfn(pgis_abs) TO postgres;
GRANT ALL ON FUNCTION pgis_geometry_makeline_finalfn(pgis_abs) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_geometry_makeline_finalfn(pgis_abs) TO publicuser;


--
-- Name: pgis_geometry_polygonize_finalfn(pgis_abs); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_geometry_polygonize_finalfn(pgis_abs) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_geometry_polygonize_finalfn(pgis_abs) FROM postgres;
GRANT ALL ON FUNCTION pgis_geometry_polygonize_finalfn(pgis_abs) TO postgres;
GRANT ALL ON FUNCTION pgis_geometry_polygonize_finalfn(pgis_abs) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_geometry_polygonize_finalfn(pgis_abs) TO publicuser;


--
-- Name: pgis_geometry_union_finalfn(pgis_abs); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pgis_geometry_union_finalfn(pgis_abs) FROM PUBLIC;
REVOKE ALL ON FUNCTION pgis_geometry_union_finalfn(pgis_abs) FROM postgres;
GRANT ALL ON FUNCTION pgis_geometry_union_finalfn(pgis_abs) TO postgres;
GRANT ALL ON FUNCTION pgis_geometry_union_finalfn(pgis_abs) TO PUBLIC;
GRANT ALL ON FUNCTION pgis_geometry_union_finalfn(pgis_abs) TO publicuser;


--
-- Name: point_inside_circle(geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION point_inside_circle(geometry, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION point_inside_circle(geometry, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION point_inside_circle(geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION point_inside_circle(geometry, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION point_inside_circle(geometry, double precision, double precision, double precision) TO publicuser;


--
-- Name: pointfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pointfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION pointfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION pointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION pointfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION pointfromtext(text) TO publicuser;


--
-- Name: pointfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pointfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION pointfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION pointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION pointfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION pointfromtext(text, integer) TO publicuser;


--
-- Name: pointfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pointfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION pointfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION pointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION pointfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION pointfromwkb(bytea) TO publicuser;


--
-- Name: pointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pointfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION pointfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION pointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION pointfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION pointfromwkb(bytea, integer) TO publicuser;


--
-- Name: pointn(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pointn(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION pointn(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION pointn(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION pointn(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION pointn(geometry, integer) TO publicuser;


--
-- Name: pointonsurface(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION pointonsurface(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION pointonsurface(geometry) FROM postgres;
GRANT ALL ON FUNCTION pointonsurface(geometry) TO postgres;
GRANT ALL ON FUNCTION pointonsurface(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION pointonsurface(geometry) TO publicuser;


--
-- Name: polyfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polyfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION polyfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION polyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION polyfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION polyfromtext(text) TO publicuser;


--
-- Name: polyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION polyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION polyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION polyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION polyfromtext(text, integer) TO publicuser;


--
-- Name: polyfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polyfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION polyfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION polyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION polyfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION polyfromwkb(bytea) TO publicuser;


--
-- Name: polyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polyfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION polyfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION polyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION polyfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION polyfromwkb(bytea, integer) TO publicuser;


--
-- Name: polygonfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polygonfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION polygonfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION polygonfromtext(text) TO postgres;
GRANT ALL ON FUNCTION polygonfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION polygonfromtext(text) TO publicuser;


--
-- Name: polygonfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polygonfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION polygonfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION polygonfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION polygonfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION polygonfromtext(text, integer) TO publicuser;


--
-- Name: polygonfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polygonfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION polygonfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION polygonfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION polygonfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION polygonfromwkb(bytea) TO publicuser;


--
-- Name: polygonfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polygonfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION polygonfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION polygonfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION polygonfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION polygonfromwkb(bytea, integer) TO publicuser;


--
-- Name: polygonize_garray(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polygonize_garray(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION polygonize_garray(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION polygonize_garray(geometry[]) TO postgres;
GRANT ALL ON FUNCTION polygonize_garray(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION polygonize_garray(geometry[]) TO publicuser;


--
-- Name: populate_geometry_columns(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION populate_geometry_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION populate_geometry_columns() FROM postgres;
GRANT ALL ON FUNCTION populate_geometry_columns() TO postgres;
GRANT ALL ON FUNCTION populate_geometry_columns() TO PUBLIC;
GRANT ALL ON FUNCTION populate_geometry_columns() TO publicuser;


--
-- Name: populate_geometry_columns(oid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION populate_geometry_columns(tbl_oid oid) FROM PUBLIC;
REVOKE ALL ON FUNCTION populate_geometry_columns(tbl_oid oid) FROM postgres;
GRANT ALL ON FUNCTION populate_geometry_columns(tbl_oid oid) TO postgres;
GRANT ALL ON FUNCTION populate_geometry_columns(tbl_oid oid) TO PUBLIC;
GRANT ALL ON FUNCTION populate_geometry_columns(tbl_oid oid) TO publicuser;


--
-- Name: postgis_addbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_addbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_addbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION postgis_addbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION postgis_addbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_addbbox(geometry) TO publicuser;


--
-- Name: postgis_cache_bbox(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_cache_bbox() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_cache_bbox() FROM postgres;
GRANT ALL ON FUNCTION postgis_cache_bbox() TO postgres;
GRANT ALL ON FUNCTION postgis_cache_bbox() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_cache_bbox() TO publicuser;


--
-- Name: postgis_dropbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_dropbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_dropbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION postgis_dropbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION postgis_dropbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_dropbbox(geometry) TO publicuser;


--
-- Name: postgis_full_version(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_full_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_full_version() FROM postgres;
GRANT ALL ON FUNCTION postgis_full_version() TO postgres;
GRANT ALL ON FUNCTION postgis_full_version() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_full_version() TO publicuser;


--
-- Name: postgis_geos_version(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_geos_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_geos_version() FROM postgres;
GRANT ALL ON FUNCTION postgis_geos_version() TO postgres;
GRANT ALL ON FUNCTION postgis_geos_version() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_geos_version() TO publicuser;


--
-- Name: postgis_getbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_getbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_getbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION postgis_getbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION postgis_getbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_getbbox(geometry) TO publicuser;


--
-- Name: postgis_gist_joinsel(internal, oid, internal, smallint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_gist_joinsel(internal, oid, internal, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_gist_joinsel(internal, oid, internal, smallint) FROM postgres;
GRANT ALL ON FUNCTION postgis_gist_joinsel(internal, oid, internal, smallint) TO postgres;
GRANT ALL ON FUNCTION postgis_gist_joinsel(internal, oid, internal, smallint) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_gist_joinsel(internal, oid, internal, smallint) TO publicuser;


--
-- Name: postgis_gist_sel(internal, oid, internal, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_gist_sel(internal, oid, internal, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_gist_sel(internal, oid, internal, integer) FROM postgres;
GRANT ALL ON FUNCTION postgis_gist_sel(internal, oid, internal, integer) TO postgres;
GRANT ALL ON FUNCTION postgis_gist_sel(internal, oid, internal, integer) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_gist_sel(internal, oid, internal, integer) TO publicuser;


--
-- Name: postgis_hasbbox(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_hasbbox(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_hasbbox(geometry) FROM postgres;
GRANT ALL ON FUNCTION postgis_hasbbox(geometry) TO postgres;
GRANT ALL ON FUNCTION postgis_hasbbox(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_hasbbox(geometry) TO publicuser;


--
-- Name: postgis_lib_build_date(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_lib_build_date() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_lib_build_date() FROM postgres;
GRANT ALL ON FUNCTION postgis_lib_build_date() TO postgres;
GRANT ALL ON FUNCTION postgis_lib_build_date() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_lib_build_date() TO publicuser;


--
-- Name: postgis_lib_version(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_lib_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_lib_version() FROM postgres;
GRANT ALL ON FUNCTION postgis_lib_version() TO postgres;
GRANT ALL ON FUNCTION postgis_lib_version() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_lib_version() TO publicuser;


--
-- Name: postgis_libxml_version(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_libxml_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_libxml_version() FROM postgres;
GRANT ALL ON FUNCTION postgis_libxml_version() TO postgres;
GRANT ALL ON FUNCTION postgis_libxml_version() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_libxml_version() TO publicuser;


--
-- Name: postgis_noop(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_noop(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_noop(geometry) FROM postgres;
GRANT ALL ON FUNCTION postgis_noop(geometry) TO postgres;
GRANT ALL ON FUNCTION postgis_noop(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_noop(geometry) TO publicuser;


--
-- Name: postgis_proj_version(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_proj_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_proj_version() FROM postgres;
GRANT ALL ON FUNCTION postgis_proj_version() TO postgres;
GRANT ALL ON FUNCTION postgis_proj_version() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_proj_version() TO publicuser;


--
-- Name: postgis_scripts_build_date(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_scripts_build_date() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_scripts_build_date() FROM postgres;
GRANT ALL ON FUNCTION postgis_scripts_build_date() TO postgres;
GRANT ALL ON FUNCTION postgis_scripts_build_date() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_scripts_build_date() TO publicuser;


--
-- Name: postgis_scripts_installed(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_scripts_installed() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_scripts_installed() FROM postgres;
GRANT ALL ON FUNCTION postgis_scripts_installed() TO postgres;
GRANT ALL ON FUNCTION postgis_scripts_installed() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_scripts_installed() TO publicuser;


--
-- Name: postgis_scripts_released(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_scripts_released() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_scripts_released() FROM postgres;
GRANT ALL ON FUNCTION postgis_scripts_released() TO postgres;
GRANT ALL ON FUNCTION postgis_scripts_released() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_scripts_released() TO publicuser;


--
-- Name: postgis_transform_geometry(geometry, text, text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_transform_geometry(geometry, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_transform_geometry(geometry, text, text, integer) FROM postgres;
GRANT ALL ON FUNCTION postgis_transform_geometry(geometry, text, text, integer) TO postgres;
GRANT ALL ON FUNCTION postgis_transform_geometry(geometry, text, text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION postgis_transform_geometry(geometry, text, text, integer) TO publicuser;


--
-- Name: postgis_uses_stats(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_uses_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_uses_stats() FROM postgres;
GRANT ALL ON FUNCTION postgis_uses_stats() TO postgres;
GRANT ALL ON FUNCTION postgis_uses_stats() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_uses_stats() TO publicuser;


--
-- Name: postgis_version(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION postgis_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION postgis_version() FROM postgres;
GRANT ALL ON FUNCTION postgis_version() TO postgres;
GRANT ALL ON FUNCTION postgis_version() TO PUBLIC;
GRANT ALL ON FUNCTION postgis_version() TO publicuser;


--
-- Name: probe_geometry_columns(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION probe_geometry_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION probe_geometry_columns() FROM postgres;
GRANT ALL ON FUNCTION probe_geometry_columns() TO postgres;
GRANT ALL ON FUNCTION probe_geometry_columns() TO PUBLIC;
GRANT ALL ON FUNCTION probe_geometry_columns() TO publicuser;


--
-- Name: relate(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION relate(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION relate(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION relate(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION relate(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION relate(geometry, geometry) TO publicuser;


--
-- Name: relate(geometry, geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION relate(geometry, geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION relate(geometry, geometry, text) FROM postgres;
GRANT ALL ON FUNCTION relate(geometry, geometry, text) TO postgres;
GRANT ALL ON FUNCTION relate(geometry, geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION relate(geometry, geometry, text) TO publicuser;


--
-- Name: removepoint(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION removepoint(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION removepoint(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION removepoint(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION removepoint(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION removepoint(geometry, integer) TO publicuser;


--
-- Name: rename_geometry_table_constraints(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION rename_geometry_table_constraints() FROM PUBLIC;
REVOKE ALL ON FUNCTION rename_geometry_table_constraints() FROM postgres;
GRANT ALL ON FUNCTION rename_geometry_table_constraints() TO postgres;
GRANT ALL ON FUNCTION rename_geometry_table_constraints() TO PUBLIC;
GRANT ALL ON FUNCTION rename_geometry_table_constraints() TO publicuser;


--
-- Name: reverse(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION reverse(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION reverse(geometry) FROM postgres;
GRANT ALL ON FUNCTION reverse(geometry) TO postgres;
GRANT ALL ON FUNCTION reverse(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION reverse(geometry) TO publicuser;


--
-- Name: rotate(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION rotate(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION rotate(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION rotate(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION rotate(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION rotate(geometry, double precision) TO publicuser;


--
-- Name: rotatex(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION rotatex(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION rotatex(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION rotatex(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION rotatex(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION rotatex(geometry, double precision) TO publicuser;


--
-- Name: rotatey(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION rotatey(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION rotatey(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION rotatey(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION rotatey(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION rotatey(geometry, double precision) TO publicuser;


--
-- Name: rotatez(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION rotatez(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION rotatez(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION rotatez(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION rotatez(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION rotatez(geometry, double precision) TO publicuser;


--
-- Name: scale(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION scale(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION scale(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION scale(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION scale(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION scale(geometry, double precision, double precision) TO publicuser;


--
-- Name: scale(geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION scale(geometry, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION scale(geometry, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION scale(geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION scale(geometry, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION scale(geometry, double precision, double precision, double precision) TO publicuser;


--
-- Name: se_envelopesintersect(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_envelopesintersect(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_envelopesintersect(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION se_envelopesintersect(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION se_envelopesintersect(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION se_envelopesintersect(geometry, geometry) TO publicuser;


--
-- Name: se_is3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_is3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_is3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION se_is3d(geometry) TO postgres;
GRANT ALL ON FUNCTION se_is3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION se_is3d(geometry) TO publicuser;


--
-- Name: se_ismeasured(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_ismeasured(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_ismeasured(geometry) FROM postgres;
GRANT ALL ON FUNCTION se_ismeasured(geometry) TO postgres;
GRANT ALL ON FUNCTION se_ismeasured(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION se_ismeasured(geometry) TO publicuser;


--
-- Name: se_locatealong(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_locatealong(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_locatealong(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION se_locatealong(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION se_locatealong(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION se_locatealong(geometry, double precision) TO publicuser;


--
-- Name: se_locatebetween(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_locatebetween(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_locatebetween(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION se_locatebetween(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION se_locatebetween(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION se_locatebetween(geometry, double precision, double precision) TO publicuser;


--
-- Name: se_m(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_m(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_m(geometry) FROM postgres;
GRANT ALL ON FUNCTION se_m(geometry) TO postgres;
GRANT ALL ON FUNCTION se_m(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION se_m(geometry) TO publicuser;


--
-- Name: se_z(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION se_z(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION se_z(geometry) FROM postgres;
GRANT ALL ON FUNCTION se_z(geometry) TO postgres;
GRANT ALL ON FUNCTION se_z(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION se_z(geometry) TO publicuser;


--
-- Name: segmentize(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION segmentize(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION segmentize(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION segmentize(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION segmentize(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION segmentize(geometry, double precision) TO publicuser;


--
-- Name: setfactor(chip, real); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION setfactor(chip, real) FROM PUBLIC;
REVOKE ALL ON FUNCTION setfactor(chip, real) FROM postgres;
GRANT ALL ON FUNCTION setfactor(chip, real) TO postgres;
GRANT ALL ON FUNCTION setfactor(chip, real) TO PUBLIC;
GRANT ALL ON FUNCTION setfactor(chip, real) TO publicuser;


--
-- Name: setpoint(geometry, integer, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION setpoint(geometry, integer, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION setpoint(geometry, integer, geometry) FROM postgres;
GRANT ALL ON FUNCTION setpoint(geometry, integer, geometry) TO postgres;
GRANT ALL ON FUNCTION setpoint(geometry, integer, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION setpoint(geometry, integer, geometry) TO publicuser;


--
-- Name: setsrid(chip, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION setsrid(chip, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION setsrid(chip, integer) FROM postgres;
GRANT ALL ON FUNCTION setsrid(chip, integer) TO postgres;
GRANT ALL ON FUNCTION setsrid(chip, integer) TO PUBLIC;
GRANT ALL ON FUNCTION setsrid(chip, integer) TO publicuser;


--
-- Name: setsrid(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION setsrid(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION setsrid(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION setsrid(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION setsrid(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION setsrid(geometry, integer) TO publicuser;


--
-- Name: shift_longitude(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION shift_longitude(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION shift_longitude(geometry) FROM postgres;
GRANT ALL ON FUNCTION shift_longitude(geometry) TO postgres;
GRANT ALL ON FUNCTION shift_longitude(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION shift_longitude(geometry) TO publicuser;


--
-- Name: simplify(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION simplify(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION simplify(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION simplify(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION simplify(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION simplify(geometry, double precision) TO publicuser;


--
-- Name: snaptogrid(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION snaptogrid(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION snaptogrid(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision) TO publicuser;


--
-- Name: snaptogrid(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION snaptogrid(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION snaptogrid(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision, double precision) TO publicuser;


--
-- Name: snaptogrid(geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION snaptogrid(geometry, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION snaptogrid(geometry, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION snaptogrid(geometry, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: srid(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION srid(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION srid(chip) FROM postgres;
GRANT ALL ON FUNCTION srid(chip) TO postgres;
GRANT ALL ON FUNCTION srid(chip) TO PUBLIC;
GRANT ALL ON FUNCTION srid(chip) TO publicuser;


--
-- Name: srid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION srid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION srid(geometry) FROM postgres;
GRANT ALL ON FUNCTION srid(geometry) TO postgres;
GRANT ALL ON FUNCTION srid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION srid(geometry) TO publicuser;


--
-- Name: st_addmeasure(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_addmeasure(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_addmeasure(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_addmeasure(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_addmeasure(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_addmeasure(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_addpoint(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_addpoint(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_addpoint(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_addpoint(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_addpoint(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_addpoint(geometry, geometry) TO publicuser;


--
-- Name: st_addpoint(geometry, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_addpoint(geometry, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_addpoint(geometry, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_addpoint(geometry, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_addpoint(geometry, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_addpoint(geometry, geometry, integer) TO publicuser;


--
-- Name: st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_affine(geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_area(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_area(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_area(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_area(geometry) TO postgres;
GRANT ALL ON FUNCTION st_area(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_area(geometry) TO publicuser;


--
-- Name: st_area(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_area(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_area(geography) FROM postgres;
GRANT ALL ON FUNCTION st_area(geography) TO postgres;
GRANT ALL ON FUNCTION st_area(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_area(geography) TO publicuser;


--
-- Name: st_area(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_area(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_area(text) FROM postgres;
GRANT ALL ON FUNCTION st_area(text) TO postgres;
GRANT ALL ON FUNCTION st_area(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_area(text) TO publicuser;


--
-- Name: st_area(geography, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_area(geography, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_area(geography, boolean) FROM postgres;
GRANT ALL ON FUNCTION st_area(geography, boolean) TO postgres;
GRANT ALL ON FUNCTION st_area(geography, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION st_area(geography, boolean) TO publicuser;


--
-- Name: st_area2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_area2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_area2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_area2d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_area2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_area2d(geometry) TO publicuser;


--
-- Name: st_asbinary(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asbinary(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asbinary(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asbinary(geometry) TO postgres;
GRANT ALL ON FUNCTION st_asbinary(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asbinary(geometry) TO publicuser;


--
-- Name: st_asbinary(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asbinary(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asbinary(geography) FROM postgres;
GRANT ALL ON FUNCTION st_asbinary(geography) TO postgres;
GRANT ALL ON FUNCTION st_asbinary(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_asbinary(geography) TO publicuser;


--
-- Name: st_asbinary(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asbinary(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asbinary(text) FROM postgres;
GRANT ALL ON FUNCTION st_asbinary(text) TO postgres;
GRANT ALL ON FUNCTION st_asbinary(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_asbinary(text) TO publicuser;


--
-- Name: st_asbinary(geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asbinary(geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asbinary(geometry, text) FROM postgres;
GRANT ALL ON FUNCTION st_asbinary(geometry, text) TO postgres;
GRANT ALL ON FUNCTION st_asbinary(geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_asbinary(geometry, text) TO publicuser;


--
-- Name: st_asewkb(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asewkb(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asewkb(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asewkb(geometry) TO postgres;
GRANT ALL ON FUNCTION st_asewkb(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asewkb(geometry) TO publicuser;


--
-- Name: st_asewkb(geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asewkb(geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asewkb(geometry, text) FROM postgres;
GRANT ALL ON FUNCTION st_asewkb(geometry, text) TO postgres;
GRANT ALL ON FUNCTION st_asewkb(geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_asewkb(geometry, text) TO publicuser;


--
-- Name: st_asewkt(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asewkt(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asewkt(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asewkt(geometry) TO postgres;
GRANT ALL ON FUNCTION st_asewkt(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asewkt(geometry) TO publicuser;


--
-- Name: st_asgeojson(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(geometry) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(geometry) TO publicuser;


--
-- Name: st_asgeojson(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(geography) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(geography) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(geography) TO publicuser;


--
-- Name: st_asgeojson(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(text) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(text) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(text) TO publicuser;


--
-- Name: st_asgeojson(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(geometry, integer) TO publicuser;


--
-- Name: st_asgeojson(integer, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(integer, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(integer, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry) TO publicuser;


--
-- Name: st_asgeojson(geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(geography, integer) TO publicuser;


--
-- Name: st_asgeojson(integer, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(integer, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(integer, geography) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography) TO publicuser;


--
-- Name: st_asgeojson(integer, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(integer, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(integer, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry, integer) TO publicuser;


--
-- Name: st_asgeojson(geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(geometry, integer, integer) TO publicuser;


--
-- Name: st_asgeojson(integer, geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(integer, geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(integer, geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography, integer) TO publicuser;


--
-- Name: st_asgeojson(geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(geography, integer, integer) TO publicuser;


--
-- Name: st_asgeojson(integer, geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(integer, geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(integer, geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(integer, geometry, integer, integer) TO publicuser;


--
-- Name: st_asgeojson(integer, geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgeojson(integer, geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgeojson(integer, geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgeojson(integer, geography, integer, integer) TO publicuser;


--
-- Name: st_asgml(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(geometry) TO postgres;
GRANT ALL ON FUNCTION st_asgml(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(geometry) TO publicuser;


--
-- Name: st_asgml(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(geography) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(geography) TO postgres;
GRANT ALL ON FUNCTION st_asgml(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(geography) TO publicuser;


--
-- Name: st_asgml(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(text) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(text) TO postgres;
GRANT ALL ON FUNCTION st_asgml(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(text) TO publicuser;


--
-- Name: st_asgml(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(geometry, integer) TO publicuser;


--
-- Name: st_asgml(integer, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(integer, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(integer, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geometry) TO postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(integer, geometry) TO publicuser;


--
-- Name: st_asgml(geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(geography, integer) TO publicuser;


--
-- Name: st_asgml(integer, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(integer, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(integer, geography) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geography) TO postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(integer, geography) TO publicuser;


--
-- Name: st_asgml(integer, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(integer, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(integer, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(integer, geometry, integer) TO publicuser;


--
-- Name: st_asgml(geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(geometry, integer, integer) TO publicuser;


--
-- Name: st_asgml(integer, geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(integer, geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(integer, geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(integer, geography, integer) TO publicuser;


--
-- Name: st_asgml(geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(geography, integer, integer) TO publicuser;


--
-- Name: st_asgml(integer, geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(integer, geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(integer, geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(integer, geometry, integer, integer) TO publicuser;


--
-- Name: st_asgml(integer, geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_asgml(integer, geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_asgml(integer, geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_asgml(integer, geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_asgml(integer, geography, integer, integer) TO publicuser;


--
-- Name: st_ashexewkb(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_ashexewkb(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_ashexewkb(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_ashexewkb(geometry) TO postgres;
GRANT ALL ON FUNCTION st_ashexewkb(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_ashexewkb(geometry) TO publicuser;


--
-- Name: st_ashexewkb(geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_ashexewkb(geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_ashexewkb(geometry, text) FROM postgres;
GRANT ALL ON FUNCTION st_ashexewkb(geometry, text) TO postgres;
GRANT ALL ON FUNCTION st_ashexewkb(geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_ashexewkb(geometry, text) TO publicuser;


--
-- Name: st_askml(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_askml(geometry) TO postgres;
GRANT ALL ON FUNCTION st_askml(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(geometry) TO publicuser;


--
-- Name: st_askml(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(geography) FROM postgres;
GRANT ALL ON FUNCTION st_askml(geography) TO postgres;
GRANT ALL ON FUNCTION st_askml(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(geography) TO publicuser;


--
-- Name: st_askml(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(text) FROM postgres;
GRANT ALL ON FUNCTION st_askml(text) TO postgres;
GRANT ALL ON FUNCTION st_askml(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(text) TO publicuser;


--
-- Name: st_askml(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_askml(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_askml(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(geometry, integer) TO publicuser;


--
-- Name: st_askml(integer, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(integer, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(integer, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_askml(integer, geometry) TO postgres;
GRANT ALL ON FUNCTION st_askml(integer, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(integer, geometry) TO publicuser;


--
-- Name: st_askml(geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_askml(geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_askml(geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(geography, integer) TO publicuser;


--
-- Name: st_askml(integer, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(integer, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(integer, geography) FROM postgres;
GRANT ALL ON FUNCTION st_askml(integer, geography) TO postgres;
GRANT ALL ON FUNCTION st_askml(integer, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(integer, geography) TO publicuser;


--
-- Name: st_askml(integer, geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(integer, geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(integer, geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_askml(integer, geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_askml(integer, geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(integer, geometry, integer) TO publicuser;


--
-- Name: st_askml(integer, geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_askml(integer, geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_askml(integer, geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_askml(integer, geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_askml(integer, geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_askml(integer, geography, integer) TO publicuser;


--
-- Name: st_assvg(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(geometry) TO postgres;
GRANT ALL ON FUNCTION st_assvg(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(geometry) TO publicuser;


--
-- Name: st_assvg(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(geography) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(geography) TO postgres;
GRANT ALL ON FUNCTION st_assvg(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(geography) TO publicuser;


--
-- Name: st_assvg(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(text) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(text) TO postgres;
GRANT ALL ON FUNCTION st_assvg(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(text) TO publicuser;


--
-- Name: st_assvg(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_assvg(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(geometry, integer) TO publicuser;


--
-- Name: st_assvg(geography, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(geography, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(geography, integer) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(geography, integer) TO postgres;
GRANT ALL ON FUNCTION st_assvg(geography, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(geography, integer) TO publicuser;


--
-- Name: st_assvg(geometry, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(geometry, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(geometry, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(geometry, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_assvg(geometry, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(geometry, integer, integer) TO publicuser;


--
-- Name: st_assvg(geography, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_assvg(geography, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_assvg(geography, integer, integer) FROM postgres;
GRANT ALL ON FUNCTION st_assvg(geography, integer, integer) TO postgres;
GRANT ALL ON FUNCTION st_assvg(geography, integer, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_assvg(geography, integer, integer) TO publicuser;


--
-- Name: st_astext(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_astext(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_astext(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_astext(geometry) TO postgres;
GRANT ALL ON FUNCTION st_astext(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_astext(geometry) TO publicuser;


--
-- Name: st_astext(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_astext(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_astext(geography) FROM postgres;
GRANT ALL ON FUNCTION st_astext(geography) TO postgres;
GRANT ALL ON FUNCTION st_astext(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_astext(geography) TO publicuser;


--
-- Name: st_astext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_astext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_astext(text) FROM postgres;
GRANT ALL ON FUNCTION st_astext(text) TO postgres;
GRANT ALL ON FUNCTION st_astext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_astext(text) TO publicuser;


--
-- Name: st_azimuth(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_azimuth(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_azimuth(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_azimuth(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_azimuth(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_azimuth(geometry, geometry) TO publicuser;


--
-- Name: st_bdmpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_bdmpolyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_bdmpolyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_bdmpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_bdmpolyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_bdmpolyfromtext(text, integer) TO publicuser;


--
-- Name: st_bdpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_bdpolyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_bdpolyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_bdpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_bdpolyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_bdpolyfromtext(text, integer) TO publicuser;


--
-- Name: st_boundary(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_boundary(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_boundary(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_boundary(geometry) TO postgres;
GRANT ALL ON FUNCTION st_boundary(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_boundary(geometry) TO publicuser;


--
-- Name: st_box(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_box(geometry) TO postgres;
GRANT ALL ON FUNCTION st_box(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_box(geometry) TO publicuser;


--
-- Name: st_box(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_box(box3d) TO postgres;
GRANT ALL ON FUNCTION st_box(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_box(box3d) TO publicuser;


--
-- Name: st_box2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_box2d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_box2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_box2d(geometry) TO publicuser;


--
-- Name: st_box2d(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box2d(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box2d(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_box2d(box3d) TO postgres;
GRANT ALL ON FUNCTION st_box2d(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_box2d(box3d) TO publicuser;


--
-- Name: st_box2d(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box2d(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box2d(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION st_box2d(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION st_box2d(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION st_box2d(box3d_extent) TO publicuser;


--
-- Name: st_box2d_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box2d_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box2d_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION st_box2d_in(cstring) TO postgres;
GRANT ALL ON FUNCTION st_box2d_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION st_box2d_in(cstring) TO publicuser;


--
-- Name: st_box2d_out(box2d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box2d_out(box2d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box2d_out(box2d) FROM postgres;
GRANT ALL ON FUNCTION st_box2d_out(box2d) TO postgres;
GRANT ALL ON FUNCTION st_box2d_out(box2d) TO PUBLIC;
GRANT ALL ON FUNCTION st_box2d_out(box2d) TO publicuser;


--
-- Name: st_box3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_box3d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_box3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_box3d(geometry) TO publicuser;


--
-- Name: st_box3d(box2d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box3d(box2d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box3d(box2d) FROM postgres;
GRANT ALL ON FUNCTION st_box3d(box2d) TO postgres;
GRANT ALL ON FUNCTION st_box3d(box2d) TO PUBLIC;
GRANT ALL ON FUNCTION st_box3d(box2d) TO publicuser;


--
-- Name: st_box3d_extent(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box3d_extent(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box3d_extent(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION st_box3d_extent(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION st_box3d_extent(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION st_box3d_extent(box3d_extent) TO publicuser;


--
-- Name: st_box3d_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box3d_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box3d_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION st_box3d_in(cstring) TO postgres;
GRANT ALL ON FUNCTION st_box3d_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION st_box3d_in(cstring) TO publicuser;


--
-- Name: st_box3d_out(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_box3d_out(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_box3d_out(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_box3d_out(box3d) TO postgres;
GRANT ALL ON FUNCTION st_box3d_out(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_box3d_out(box3d) TO publicuser;


--
-- Name: st_buffer(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_buffer(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_buffer(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision) TO publicuser;


--
-- Name: st_buffer(geography, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_buffer(geography, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_buffer(geography, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_buffer(geography, double precision) TO postgres;
GRANT ALL ON FUNCTION st_buffer(geography, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_buffer(geography, double precision) TO publicuser;


--
-- Name: st_buffer(text, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_buffer(text, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_buffer(text, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_buffer(text, double precision) TO postgres;
GRANT ALL ON FUNCTION st_buffer(text, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_buffer(text, double precision) TO publicuser;


--
-- Name: st_buffer(geometry, double precision, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_buffer(geometry, double precision, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_buffer(geometry, double precision, integer) FROM postgres;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision, integer) TO publicuser;


--
-- Name: st_buffer(geometry, double precision, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_buffer(geometry, double precision, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_buffer(geometry, double precision, text) FROM postgres;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision, text) TO postgres;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_buffer(geometry, double precision, text) TO publicuser;


--
-- Name: st_buildarea(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_buildarea(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_buildarea(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_buildarea(geometry) TO postgres;
GRANT ALL ON FUNCTION st_buildarea(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_buildarea(geometry) TO publicuser;


--
-- Name: st_bytea(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_bytea(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_bytea(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_bytea(geometry) TO postgres;
GRANT ALL ON FUNCTION st_bytea(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_bytea(geometry) TO publicuser;


--
-- Name: st_centroid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_centroid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_centroid(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_centroid(geometry) TO postgres;
GRANT ALL ON FUNCTION st_centroid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_centroid(geometry) TO publicuser;


--
-- Name: st_chip_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_chip_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_chip_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION st_chip_in(cstring) TO postgres;
GRANT ALL ON FUNCTION st_chip_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION st_chip_in(cstring) TO publicuser;


--
-- Name: st_chip_out(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_chip_out(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_chip_out(chip) FROM postgres;
GRANT ALL ON FUNCTION st_chip_out(chip) TO postgres;
GRANT ALL ON FUNCTION st_chip_out(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_chip_out(chip) TO publicuser;


--
-- Name: st_closestpoint(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_closestpoint(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_closestpoint(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_closestpoint(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_closestpoint(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_closestpoint(geometry, geometry) TO publicuser;


--
-- Name: st_collect(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_collect(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_collect(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_collect(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_collect(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_collect(geometry[]) TO publicuser;


--
-- Name: st_collect(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_collect(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_collect(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_collect(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_collect(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_collect(geometry, geometry) TO publicuser;


--
-- Name: st_collectionextract(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_collectionextract(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_collectionextract(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_collectionextract(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_collectionextract(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_collectionextract(geometry, integer) TO publicuser;


--
-- Name: st_combine_bbox(box2d, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_combine_bbox(box2d, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_combine_bbox(box2d, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_combine_bbox(box2d, geometry) TO postgres;
GRANT ALL ON FUNCTION st_combine_bbox(box2d, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_combine_bbox(box2d, geometry) TO publicuser;


--
-- Name: st_combine_bbox(box3d_extent, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_combine_bbox(box3d_extent, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_combine_bbox(box3d_extent, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_combine_bbox(box3d_extent, geometry) TO postgres;
GRANT ALL ON FUNCTION st_combine_bbox(box3d_extent, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_combine_bbox(box3d_extent, geometry) TO publicuser;


--
-- Name: st_combine_bbox(box3d, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_combine_bbox(box3d, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_combine_bbox(box3d, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_combine_bbox(box3d, geometry) TO postgres;
GRANT ALL ON FUNCTION st_combine_bbox(box3d, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_combine_bbox(box3d, geometry) TO publicuser;


--
-- Name: st_compression(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_compression(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_compression(chip) FROM postgres;
GRANT ALL ON FUNCTION st_compression(chip) TO postgres;
GRANT ALL ON FUNCTION st_compression(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_compression(chip) TO publicuser;


--
-- Name: st_contains(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_contains(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_contains(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_contains(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_contains(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_contains(geometry, geometry) TO publicuser;


--
-- Name: st_containsproperly(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_containsproperly(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_containsproperly(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_containsproperly(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_containsproperly(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_containsproperly(geometry, geometry) TO publicuser;


--
-- Name: st_convexhull(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_convexhull(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_convexhull(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_convexhull(geometry) TO postgres;
GRANT ALL ON FUNCTION st_convexhull(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_convexhull(geometry) TO publicuser;


--
-- Name: st_coorddim(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_coorddim(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_coorddim(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_coorddim(geometry) TO postgres;
GRANT ALL ON FUNCTION st_coorddim(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_coorddim(geometry) TO publicuser;


--
-- Name: st_coveredby(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_coveredby(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_coveredby(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_coveredby(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_coveredby(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_coveredby(geometry, geometry) TO publicuser;


--
-- Name: st_coveredby(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_coveredby(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_coveredby(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION st_coveredby(geography, geography) TO postgres;
GRANT ALL ON FUNCTION st_coveredby(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_coveredby(geography, geography) TO publicuser;


--
-- Name: st_coveredby(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_coveredby(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_coveredby(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_coveredby(text, text) TO postgres;
GRANT ALL ON FUNCTION st_coveredby(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_coveredby(text, text) TO publicuser;


--
-- Name: st_covers(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_covers(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_covers(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_covers(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_covers(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_covers(geometry, geometry) TO publicuser;


--
-- Name: st_covers(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_covers(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_covers(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION st_covers(geography, geography) TO postgres;
GRANT ALL ON FUNCTION st_covers(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_covers(geography, geography) TO publicuser;


--
-- Name: st_covers(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_covers(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_covers(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_covers(text, text) TO postgres;
GRANT ALL ON FUNCTION st_covers(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_covers(text, text) TO publicuser;


--
-- Name: st_crosses(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_crosses(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_crosses(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_crosses(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_crosses(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_crosses(geometry, geometry) TO publicuser;


--
-- Name: st_curvetoline(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_curvetoline(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_curvetoline(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_curvetoline(geometry) TO postgres;
GRANT ALL ON FUNCTION st_curvetoline(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_curvetoline(geometry) TO publicuser;


--
-- Name: st_curvetoline(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_curvetoline(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_curvetoline(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_curvetoline(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_curvetoline(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_curvetoline(geometry, integer) TO publicuser;


--
-- Name: st_datatype(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_datatype(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_datatype(chip) FROM postgres;
GRANT ALL ON FUNCTION st_datatype(chip) TO postgres;
GRANT ALL ON FUNCTION st_datatype(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_datatype(chip) TO publicuser;


--
-- Name: st_dfullywithin(geometry, geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dfullywithin(geometry, geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dfullywithin(geometry, geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_dfullywithin(geometry, geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_dfullywithin(geometry, geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_dfullywithin(geometry, geometry, double precision) TO publicuser;


--
-- Name: st_difference(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_difference(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_difference(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_difference(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_difference(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_difference(geometry, geometry) TO publicuser;


--
-- Name: st_dimension(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dimension(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dimension(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_dimension(geometry) TO postgres;
GRANT ALL ON FUNCTION st_dimension(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_dimension(geometry) TO publicuser;


--
-- Name: st_disjoint(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_disjoint(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_disjoint(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_disjoint(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_disjoint(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_disjoint(geometry, geometry) TO publicuser;


--
-- Name: st_distance(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_distance(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_distance(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_distance(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_distance(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_distance(geometry, geometry) TO publicuser;


--
-- Name: st_distance(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_distance(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_distance(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION st_distance(geography, geography) TO postgres;
GRANT ALL ON FUNCTION st_distance(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_distance(geography, geography) TO publicuser;


--
-- Name: st_distance(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_distance(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_distance(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_distance(text, text) TO postgres;
GRANT ALL ON FUNCTION st_distance(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_distance(text, text) TO publicuser;


--
-- Name: st_distance(geography, geography, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_distance(geography, geography, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_distance(geography, geography, boolean) FROM postgres;
GRANT ALL ON FUNCTION st_distance(geography, geography, boolean) TO postgres;
GRANT ALL ON FUNCTION st_distance(geography, geography, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION st_distance(geography, geography, boolean) TO publicuser;


--
-- Name: st_distance_sphere(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_distance_sphere(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_distance_sphere(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_distance_sphere(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_distance_sphere(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_distance_sphere(geometry, geometry) TO publicuser;


--
-- Name: st_distance_spheroid(geometry, geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_distance_spheroid(geometry, geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_distance_spheroid(geometry, geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION st_distance_spheroid(geometry, geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION st_distance_spheroid(geometry, geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION st_distance_spheroid(geometry, geometry, spheroid) TO publicuser;


--
-- Name: st_dump(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dump(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dump(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_dump(geometry) TO postgres;
GRANT ALL ON FUNCTION st_dump(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_dump(geometry) TO publicuser;


--
-- Name: st_dumppoints(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dumppoints(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dumppoints(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_dumppoints(geometry) TO postgres;
GRANT ALL ON FUNCTION st_dumppoints(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_dumppoints(geometry) TO publicuser;


--
-- Name: st_dumprings(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dumprings(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dumprings(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_dumprings(geometry) TO postgres;
GRANT ALL ON FUNCTION st_dumprings(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_dumprings(geometry) TO publicuser;


--
-- Name: st_dwithin(geometry, geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dwithin(geometry, geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dwithin(geometry, geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_dwithin(geometry, geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_dwithin(geometry, geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_dwithin(geometry, geometry, double precision) TO publicuser;


--
-- Name: st_dwithin(geography, geography, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dwithin(geography, geography, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dwithin(geography, geography, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_dwithin(geography, geography, double precision) TO postgres;
GRANT ALL ON FUNCTION st_dwithin(geography, geography, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_dwithin(geography, geography, double precision) TO publicuser;


--
-- Name: st_dwithin(text, text, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dwithin(text, text, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dwithin(text, text, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_dwithin(text, text, double precision) TO postgres;
GRANT ALL ON FUNCTION st_dwithin(text, text, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_dwithin(text, text, double precision) TO publicuser;


--
-- Name: st_dwithin(geography, geography, double precision, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_dwithin(geography, geography, double precision, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_dwithin(geography, geography, double precision, boolean) FROM postgres;
GRANT ALL ON FUNCTION st_dwithin(geography, geography, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION st_dwithin(geography, geography, double precision, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION st_dwithin(geography, geography, double precision, boolean) TO publicuser;


--
-- Name: st_endpoint(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_endpoint(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_endpoint(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_endpoint(geometry) TO postgres;
GRANT ALL ON FUNCTION st_endpoint(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_endpoint(geometry) TO publicuser;


--
-- Name: st_envelope(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_envelope(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_envelope(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_envelope(geometry) TO postgres;
GRANT ALL ON FUNCTION st_envelope(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_envelope(geometry) TO publicuser;


--
-- Name: st_equals(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_equals(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_equals(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_equals(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_equals(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_equals(geometry, geometry) TO publicuser;


--
-- Name: st_estimated_extent(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_estimated_extent(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_estimated_extent(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_estimated_extent(text, text) TO postgres;
GRANT ALL ON FUNCTION st_estimated_extent(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_estimated_extent(text, text) TO publicuser;


--
-- Name: st_estimated_extent(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_estimated_extent(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_estimated_extent(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION st_estimated_extent(text, text, text) TO postgres;
GRANT ALL ON FUNCTION st_estimated_extent(text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_estimated_extent(text, text, text) TO publicuser;


--
-- Name: st_expand(box3d, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_expand(box3d, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_expand(box3d, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_expand(box3d, double precision) TO postgres;
GRANT ALL ON FUNCTION st_expand(box3d, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_expand(box3d, double precision) TO publicuser;


--
-- Name: st_expand(box2d, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_expand(box2d, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_expand(box2d, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_expand(box2d, double precision) TO postgres;
GRANT ALL ON FUNCTION st_expand(box2d, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_expand(box2d, double precision) TO publicuser;


--
-- Name: st_expand(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_expand(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_expand(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_expand(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_expand(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_expand(geometry, double precision) TO publicuser;


--
-- Name: st_exteriorring(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_exteriorring(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_exteriorring(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_exteriorring(geometry) TO postgres;
GRANT ALL ON FUNCTION st_exteriorring(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_exteriorring(geometry) TO publicuser;


--
-- Name: st_factor(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_factor(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_factor(chip) FROM postgres;
GRANT ALL ON FUNCTION st_factor(chip) TO postgres;
GRANT ALL ON FUNCTION st_factor(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_factor(chip) TO publicuser;


--
-- Name: st_find_extent(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_find_extent(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_find_extent(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_find_extent(text, text) TO postgres;
GRANT ALL ON FUNCTION st_find_extent(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_find_extent(text, text) TO publicuser;


--
-- Name: st_find_extent(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_find_extent(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_find_extent(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION st_find_extent(text, text, text) TO postgres;
GRANT ALL ON FUNCTION st_find_extent(text, text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_find_extent(text, text, text) TO publicuser;


--
-- Name: st_force_2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_force_2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_force_2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_force_2d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_force_2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_force_2d(geometry) TO publicuser;


--
-- Name: st_force_3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_force_3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_force_3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_force_3d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_force_3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_force_3d(geometry) TO publicuser;


--
-- Name: st_force_3dm(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_force_3dm(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_force_3dm(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_force_3dm(geometry) TO postgres;
GRANT ALL ON FUNCTION st_force_3dm(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_force_3dm(geometry) TO publicuser;


--
-- Name: st_force_3dz(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_force_3dz(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_force_3dz(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_force_3dz(geometry) TO postgres;
GRANT ALL ON FUNCTION st_force_3dz(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_force_3dz(geometry) TO publicuser;


--
-- Name: st_force_4d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_force_4d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_force_4d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_force_4d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_force_4d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_force_4d(geometry) TO publicuser;


--
-- Name: st_force_collection(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_force_collection(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_force_collection(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_force_collection(geometry) TO postgres;
GRANT ALL ON FUNCTION st_force_collection(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_force_collection(geometry) TO publicuser;


--
-- Name: st_forcerhr(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_forcerhr(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_forcerhr(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_forcerhr(geometry) TO postgres;
GRANT ALL ON FUNCTION st_forcerhr(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_forcerhr(geometry) TO publicuser;


--
-- Name: st_geogfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geogfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geogfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_geogfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_geogfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geogfromtext(text) TO publicuser;


--
-- Name: st_geogfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geogfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geogfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_geogfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_geogfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_geogfromwkb(bytea) TO publicuser;


--
-- Name: st_geographyfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geographyfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geographyfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_geographyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_geographyfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geographyfromtext(text) TO publicuser;


--
-- Name: st_geohash(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geohash(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geohash(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geohash(geometry) TO postgres;
GRANT ALL ON FUNCTION st_geohash(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geohash(geometry) TO publicuser;


--
-- Name: st_geohash(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geohash(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geohash(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geohash(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_geohash(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geohash(geometry, integer) TO publicuser;


--
-- Name: st_geomcollfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomcollfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomcollfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_geomcollfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_geomcollfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomcollfromtext(text) TO publicuser;


--
-- Name: st_geomcollfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomcollfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomcollfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geomcollfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_geomcollfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomcollfromtext(text, integer) TO publicuser;


--
-- Name: st_geomcollfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomcollfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomcollfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_geomcollfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_geomcollfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomcollfromwkb(bytea) TO publicuser;


--
-- Name: st_geomcollfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomcollfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomcollfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geomcollfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_geomcollfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomcollfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_geometry(box2d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry(box2d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry(box2d) FROM postgres;
GRANT ALL ON FUNCTION st_geometry(box2d) TO postgres;
GRANT ALL ON FUNCTION st_geometry(box2d) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry(box2d) TO publicuser;


--
-- Name: st_geometry(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_geometry(box3d) TO postgres;
GRANT ALL ON FUNCTION st_geometry(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry(box3d) TO publicuser;


--
-- Name: st_geometry(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry(text) FROM postgres;
GRANT ALL ON FUNCTION st_geometry(text) TO postgres;
GRANT ALL ON FUNCTION st_geometry(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry(text) TO publicuser;


--
-- Name: st_geometry(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry(chip) FROM postgres;
GRANT ALL ON FUNCTION st_geometry(chip) TO postgres;
GRANT ALL ON FUNCTION st_geometry(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry(chip) TO publicuser;


--
-- Name: st_geometry(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_geometry(bytea) TO postgres;
GRANT ALL ON FUNCTION st_geometry(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry(bytea) TO publicuser;


--
-- Name: st_geometry(box3d_extent); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry(box3d_extent) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry(box3d_extent) FROM postgres;
GRANT ALL ON FUNCTION st_geometry(box3d_extent) TO postgres;
GRANT ALL ON FUNCTION st_geometry(box3d_extent) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry(box3d_extent) TO publicuser;


--
-- Name: st_geometry_above(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_above(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_above(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_above(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_above(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_above(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_analyze(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_analyze(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_analyze(internal) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_analyze(internal) TO postgres;
GRANT ALL ON FUNCTION st_geometry_analyze(internal) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_analyze(internal) TO publicuser;


--
-- Name: st_geometry_below(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_below(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_below(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_below(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_below(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_below(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_cmp(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_cmp(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_cmp(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_cmp(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_cmp(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_cmp(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_contain(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_contain(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_contain(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_contain(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_contain(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_contain(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_contained(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_contained(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_contained(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_contained(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_contained(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_contained(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_eq(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_eq(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_eq(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_eq(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_eq(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_eq(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_ge(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_ge(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_ge(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_ge(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_ge(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_ge(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_gt(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_gt(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_gt(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_gt(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_gt(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_gt(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_in(cstring) TO postgres;
GRANT ALL ON FUNCTION st_geometry_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_in(cstring) TO publicuser;


--
-- Name: st_geometry_le(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_le(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_le(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_le(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_le(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_le(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_left(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_left(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_left(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_left(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_left(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_left(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_lt(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_lt(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_lt(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_lt(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_lt(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_lt(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_out(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_out(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_out(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_out(geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_out(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_out(geometry) TO publicuser;


--
-- Name: st_geometry_overabove(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_overabove(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_overabove(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_overabove(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_overabove(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_overabove(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_overbelow(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_overbelow(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_overbelow(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_overbelow(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_overbelow(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_overbelow(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_overlap(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_overlap(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_overlap(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_overlap(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_overlap(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_overlap(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_overleft(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_overleft(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_overleft(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_overleft(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_overleft(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_overleft(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_overright(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_overright(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_overright(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_overright(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_overright(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_overright(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_recv(internal); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_recv(internal) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_recv(internal) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_recv(internal) TO postgres;
GRANT ALL ON FUNCTION st_geometry_recv(internal) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_recv(internal) TO publicuser;


--
-- Name: st_geometry_right(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_right(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_right(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_right(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_right(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_right(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_same(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_same(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_same(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_same(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_same(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_same(geometry, geometry) TO publicuser;


--
-- Name: st_geometry_send(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometry_send(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometry_send(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometry_send(geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometry_send(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometry_send(geometry) TO publicuser;


--
-- Name: st_geometryfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometryfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometryfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_geometryfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_geometryfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometryfromtext(text) TO publicuser;


--
-- Name: st_geometryfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometryfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometryfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geometryfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_geometryfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometryfromtext(text, integer) TO publicuser;


--
-- Name: st_geometryn(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometryn(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometryn(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geometryn(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_geometryn(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometryn(geometry, integer) TO publicuser;


--
-- Name: st_geometrytype(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geometrytype(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geometrytype(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_geometrytype(geometry) TO postgres;
GRANT ALL ON FUNCTION st_geometrytype(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_geometrytype(geometry) TO publicuser;


--
-- Name: st_geomfromewkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromewkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromewkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromewkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_geomfromewkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromewkb(bytea) TO publicuser;


--
-- Name: st_geomfromewkt(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromewkt(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromewkt(text) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromewkt(text) TO postgres;
GRANT ALL ON FUNCTION st_geomfromewkt(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromewkt(text) TO publicuser;


--
-- Name: st_geomfromgml(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromgml(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromgml(text) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromgml(text) TO postgres;
GRANT ALL ON FUNCTION st_geomfromgml(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromgml(text) TO publicuser;


--
-- Name: st_geomfromkml(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromkml(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromkml(text) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromkml(text) TO postgres;
GRANT ALL ON FUNCTION st_geomfromkml(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromkml(text) TO publicuser;


--
-- Name: st_geomfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_geomfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromtext(text) TO publicuser;


--
-- Name: st_geomfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_geomfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromtext(text, integer) TO publicuser;


--
-- Name: st_geomfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_geomfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromwkb(bytea) TO publicuser;


--
-- Name: st_geomfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_geomfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_geomfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_geomfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_geomfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_geomfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_gmltosql(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_gmltosql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_gmltosql(text) FROM postgres;
GRANT ALL ON FUNCTION st_gmltosql(text) TO postgres;
GRANT ALL ON FUNCTION st_gmltosql(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_gmltosql(text) TO publicuser;


--
-- Name: st_hasarc(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_hasarc(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_hasarc(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_hasarc(geometry) TO postgres;
GRANT ALL ON FUNCTION st_hasarc(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_hasarc(geometry) TO publicuser;


--
-- Name: st_hausdorffdistance(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_hausdorffdistance(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_hausdorffdistance(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_hausdorffdistance(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_hausdorffdistance(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_hausdorffdistance(geometry, geometry) TO publicuser;


--
-- Name: st_hausdorffdistance(geometry, geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_hausdorffdistance(geometry, geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_hausdorffdistance(geometry, geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_hausdorffdistance(geometry, geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_hausdorffdistance(geometry, geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_hausdorffdistance(geometry, geometry, double precision) TO publicuser;


--
-- Name: st_height(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_height(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_height(chip) FROM postgres;
GRANT ALL ON FUNCTION st_height(chip) TO postgres;
GRANT ALL ON FUNCTION st_height(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_height(chip) TO publicuser;


--
-- Name: st_interiorringn(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_interiorringn(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_interiorringn(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_interiorringn(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_interiorringn(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_interiorringn(geometry, integer) TO publicuser;


--
-- Name: st_intersection(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_intersection(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_intersection(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_intersection(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_intersection(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_intersection(geometry, geometry) TO publicuser;


--
-- Name: st_intersection(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_intersection(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_intersection(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION st_intersection(geography, geography) TO postgres;
GRANT ALL ON FUNCTION st_intersection(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_intersection(geography, geography) TO publicuser;


--
-- Name: st_intersection(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_intersection(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_intersection(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_intersection(text, text) TO postgres;
GRANT ALL ON FUNCTION st_intersection(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_intersection(text, text) TO publicuser;


--
-- Name: st_intersects(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_intersects(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_intersects(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_intersects(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_intersects(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_intersects(geometry, geometry) TO publicuser;


--
-- Name: st_intersects(geography, geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_intersects(geography, geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_intersects(geography, geography) FROM postgres;
GRANT ALL ON FUNCTION st_intersects(geography, geography) TO postgres;
GRANT ALL ON FUNCTION st_intersects(geography, geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_intersects(geography, geography) TO publicuser;


--
-- Name: st_intersects(text, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_intersects(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_intersects(text, text) FROM postgres;
GRANT ALL ON FUNCTION st_intersects(text, text) TO postgres;
GRANT ALL ON FUNCTION st_intersects(text, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_intersects(text, text) TO publicuser;


--
-- Name: st_isclosed(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_isclosed(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_isclosed(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_isclosed(geometry) TO postgres;
GRANT ALL ON FUNCTION st_isclosed(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_isclosed(geometry) TO publicuser;


--
-- Name: st_isempty(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_isempty(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_isempty(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_isempty(geometry) TO postgres;
GRANT ALL ON FUNCTION st_isempty(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_isempty(geometry) TO publicuser;


--
-- Name: st_isring(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_isring(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_isring(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_isring(geometry) TO postgres;
GRANT ALL ON FUNCTION st_isring(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_isring(geometry) TO publicuser;


--
-- Name: st_issimple(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_issimple(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_issimple(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_issimple(geometry) TO postgres;
GRANT ALL ON FUNCTION st_issimple(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_issimple(geometry) TO publicuser;


--
-- Name: st_isvalid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_isvalid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_isvalid(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_isvalid(geometry) TO postgres;
GRANT ALL ON FUNCTION st_isvalid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_isvalid(geometry) TO publicuser;


--
-- Name: st_isvalidreason(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_isvalidreason(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_isvalidreason(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_isvalidreason(geometry) TO postgres;
GRANT ALL ON FUNCTION st_isvalidreason(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_isvalidreason(geometry) TO publicuser;


--
-- Name: st_length(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_length(geometry) TO postgres;
GRANT ALL ON FUNCTION st_length(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_length(geometry) TO publicuser;


--
-- Name: st_length(geography); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length(geography) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length(geography) FROM postgres;
GRANT ALL ON FUNCTION st_length(geography) TO postgres;
GRANT ALL ON FUNCTION st_length(geography) TO PUBLIC;
GRANT ALL ON FUNCTION st_length(geography) TO publicuser;


--
-- Name: st_length(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length(text) FROM postgres;
GRANT ALL ON FUNCTION st_length(text) TO postgres;
GRANT ALL ON FUNCTION st_length(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_length(text) TO publicuser;


--
-- Name: st_length(geography, boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length(geography, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length(geography, boolean) FROM postgres;
GRANT ALL ON FUNCTION st_length(geography, boolean) TO postgres;
GRANT ALL ON FUNCTION st_length(geography, boolean) TO PUBLIC;
GRANT ALL ON FUNCTION st_length(geography, boolean) TO publicuser;


--
-- Name: st_length2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_length2d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_length2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_length2d(geometry) TO publicuser;


--
-- Name: st_length2d_spheroid(geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length2d_spheroid(geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length2d_spheroid(geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION st_length2d_spheroid(geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION st_length2d_spheroid(geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION st_length2d_spheroid(geometry, spheroid) TO publicuser;


--
-- Name: st_length3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_length3d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_length3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_length3d(geometry) TO publicuser;


--
-- Name: st_length3d_spheroid(geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length3d_spheroid(geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length3d_spheroid(geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION st_length3d_spheroid(geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION st_length3d_spheroid(geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION st_length3d_spheroid(geometry, spheroid) TO publicuser;


--
-- Name: st_length_spheroid(geometry, spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_length_spheroid(geometry, spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_length_spheroid(geometry, spheroid) FROM postgres;
GRANT ALL ON FUNCTION st_length_spheroid(geometry, spheroid) TO postgres;
GRANT ALL ON FUNCTION st_length_spheroid(geometry, spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION st_length_spheroid(geometry, spheroid) TO publicuser;


--
-- Name: st_line_interpolate_point(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_line_interpolate_point(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_line_interpolate_point(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_line_interpolate_point(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_line_interpolate_point(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_line_interpolate_point(geometry, double precision) TO publicuser;


--
-- Name: st_line_locate_point(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_line_locate_point(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_line_locate_point(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_line_locate_point(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_line_locate_point(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_line_locate_point(geometry, geometry) TO publicuser;


--
-- Name: st_line_substring(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_line_substring(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_line_substring(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_line_substring(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_line_substring(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_line_substring(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_linecrossingdirection(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linecrossingdirection(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linecrossingdirection(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_linecrossingdirection(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_linecrossingdirection(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_linecrossingdirection(geometry, geometry) TO publicuser;


--
-- Name: st_linefrommultipoint(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linefrommultipoint(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linefrommultipoint(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_linefrommultipoint(geometry) TO postgres;
GRANT ALL ON FUNCTION st_linefrommultipoint(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_linefrommultipoint(geometry) TO publicuser;


--
-- Name: st_linefromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linefromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linefromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_linefromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_linefromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_linefromtext(text) TO publicuser;


--
-- Name: st_linefromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linefromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linefromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_linefromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_linefromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_linefromtext(text, integer) TO publicuser;


--
-- Name: st_linefromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linefromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linefromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_linefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_linefromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_linefromwkb(bytea) TO publicuser;


--
-- Name: st_linefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linefromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linefromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_linefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_linefromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_linefromwkb(bytea, integer) TO publicuser;


--
-- Name: st_linemerge(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linemerge(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linemerge(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_linemerge(geometry) TO postgres;
GRANT ALL ON FUNCTION st_linemerge(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_linemerge(geometry) TO publicuser;


--
-- Name: st_linestringfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linestringfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linestringfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_linestringfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_linestringfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_linestringfromwkb(bytea) TO publicuser;


--
-- Name: st_linestringfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linestringfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linestringfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_linestringfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_linestringfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_linestringfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_linetocurve(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_linetocurve(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_linetocurve(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_linetocurve(geometry) TO postgres;
GRANT ALL ON FUNCTION st_linetocurve(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_linetocurve(geometry) TO publicuser;


--
-- Name: st_locate_along_measure(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_locate_along_measure(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_locate_along_measure(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_locate_along_measure(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_locate_along_measure(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_locate_along_measure(geometry, double precision) TO publicuser;


--
-- Name: st_locate_between_measures(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_locate_between_measures(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_locate_between_measures(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_locate_between_measures(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_locate_between_measures(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_locate_between_measures(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_locatebetweenelevations(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_locatebetweenelevations(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_locatebetweenelevations(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_locatebetweenelevations(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_locatebetweenelevations(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_locatebetweenelevations(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_longestline(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_longestline(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_longestline(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_longestline(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_longestline(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_longestline(geometry, geometry) TO publicuser;


--
-- Name: st_m(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_m(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_m(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_m(geometry) TO postgres;
GRANT ALL ON FUNCTION st_m(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_m(geometry) TO publicuser;


--
-- Name: st_makebox2d(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makebox2d(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makebox2d(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_makebox2d(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_makebox2d(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_makebox2d(geometry, geometry) TO publicuser;


--
-- Name: st_makebox3d(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makebox3d(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makebox3d(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_makebox3d(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_makebox3d(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_makebox3d(geometry, geometry) TO publicuser;


--
-- Name: st_makeenvelope(double precision, double precision, double precision, double precision, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer) FROM postgres;
GRANT ALL ON FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO publicuser;


--
-- Name: st_makeline(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makeline(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makeline(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_makeline(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_makeline(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_makeline(geometry[]) TO publicuser;


--
-- Name: st_makeline(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makeline(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makeline(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_makeline(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_makeline(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_makeline(geometry, geometry) TO publicuser;


--
-- Name: st_makeline_garray(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makeline_garray(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makeline_garray(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_makeline_garray(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_makeline_garray(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_makeline_garray(geometry[]) TO publicuser;


--
-- Name: st_makepoint(double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makepoint(double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makepoint(double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision) TO publicuser;


--
-- Name: st_makepoint(double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makepoint(double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makepoint(double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision, double precision) TO publicuser;


--
-- Name: st_makepoint(double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makepoint(double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makepoint(double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_makepoint(double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_makepointm(double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makepointm(double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makepointm(double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_makepointm(double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_makepointm(double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_makepointm(double precision, double precision, double precision) TO publicuser;


--
-- Name: st_makepolygon(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makepolygon(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makepolygon(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_makepolygon(geometry) TO postgres;
GRANT ALL ON FUNCTION st_makepolygon(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_makepolygon(geometry) TO publicuser;


--
-- Name: st_makepolygon(geometry, geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makepolygon(geometry, geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makepolygon(geometry, geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_makepolygon(geometry, geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_makepolygon(geometry, geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_makepolygon(geometry, geometry[]) TO publicuser;


--
-- Name: st_maxdistance(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_maxdistance(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_maxdistance(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_maxdistance(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_maxdistance(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_maxdistance(geometry, geometry) TO publicuser;


--
-- Name: st_mem_size(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mem_size(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mem_size(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_mem_size(geometry) TO postgres;
GRANT ALL ON FUNCTION st_mem_size(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_mem_size(geometry) TO publicuser;


--
-- Name: st_minimumboundingcircle(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_minimumboundingcircle(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_minimumboundingcircle(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_minimumboundingcircle(geometry) TO postgres;
GRANT ALL ON FUNCTION st_minimumboundingcircle(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_minimumboundingcircle(geometry) TO publicuser;


--
-- Name: st_minimumboundingcircle(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) FROM postgres;
GRANT ALL ON FUNCTION st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) TO postgres;
GRANT ALL ON FUNCTION st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_minimumboundingcircle(inputgeom geometry, segs_per_quarter integer) TO publicuser;


--
-- Name: st_mlinefromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mlinefromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mlinefromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_mlinefromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_mlinefromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_mlinefromtext(text) TO publicuser;


--
-- Name: st_mlinefromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mlinefromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mlinefromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_mlinefromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_mlinefromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_mlinefromtext(text, integer) TO publicuser;


--
-- Name: st_mlinefromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mlinefromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mlinefromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_mlinefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_mlinefromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_mlinefromwkb(bytea) TO publicuser;


--
-- Name: st_mlinefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mlinefromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mlinefromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_mlinefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_mlinefromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_mlinefromwkb(bytea, integer) TO publicuser;


--
-- Name: st_mpointfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpointfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpointfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_mpointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_mpointfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpointfromtext(text) TO publicuser;


--
-- Name: st_mpointfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpointfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpointfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_mpointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_mpointfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpointfromtext(text, integer) TO publicuser;


--
-- Name: st_mpointfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpointfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpointfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_mpointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_mpointfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpointfromwkb(bytea) TO publicuser;


--
-- Name: st_mpointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpointfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpointfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_mpointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_mpointfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpointfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_mpolyfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpolyfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpolyfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_mpolyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_mpolyfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpolyfromtext(text) TO publicuser;


--
-- Name: st_mpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpolyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpolyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_mpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_mpolyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpolyfromtext(text, integer) TO publicuser;


--
-- Name: st_mpolyfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpolyfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpolyfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_mpolyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_mpolyfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpolyfromwkb(bytea) TO publicuser;


--
-- Name: st_mpolyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_mpolyfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_mpolyfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_mpolyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_mpolyfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_mpolyfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_multi(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multi(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multi(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_multi(geometry) TO postgres;
GRANT ALL ON FUNCTION st_multi(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_multi(geometry) TO publicuser;


--
-- Name: st_multilinefromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multilinefromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multilinefromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_multilinefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_multilinefromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_multilinefromwkb(bytea) TO publicuser;


--
-- Name: st_multilinestringfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multilinestringfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multilinestringfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_multilinestringfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_multilinestringfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_multilinestringfromtext(text) TO publicuser;


--
-- Name: st_multilinestringfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multilinestringfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multilinestringfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_multilinestringfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_multilinestringfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_multilinestringfromtext(text, integer) TO publicuser;


--
-- Name: st_multipointfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipointfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipointfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_multipointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_multipointfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipointfromtext(text) TO publicuser;


--
-- Name: st_multipointfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipointfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipointfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_multipointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_multipointfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipointfromwkb(bytea) TO publicuser;


--
-- Name: st_multipointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipointfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipointfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_multipointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_multipointfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipointfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_multipolyfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipolyfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipolyfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_multipolyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_multipolyfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipolyfromwkb(bytea) TO publicuser;


--
-- Name: st_multipolyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipolyfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipolyfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_multipolyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_multipolyfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipolyfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_multipolygonfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipolygonfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipolygonfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_multipolygonfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_multipolygonfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipolygonfromtext(text) TO publicuser;


--
-- Name: st_multipolygonfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_multipolygonfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_multipolygonfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_multipolygonfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_multipolygonfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_multipolygonfromtext(text, integer) TO publicuser;


--
-- Name: st_ndims(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_ndims(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_ndims(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_ndims(geometry) TO postgres;
GRANT ALL ON FUNCTION st_ndims(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_ndims(geometry) TO publicuser;


--
-- Name: st_npoints(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_npoints(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_npoints(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_npoints(geometry) TO postgres;
GRANT ALL ON FUNCTION st_npoints(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_npoints(geometry) TO publicuser;


--
-- Name: st_nrings(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_nrings(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_nrings(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_nrings(geometry) TO postgres;
GRANT ALL ON FUNCTION st_nrings(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_nrings(geometry) TO publicuser;


--
-- Name: st_numgeometries(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_numgeometries(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_numgeometries(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_numgeometries(geometry) TO postgres;
GRANT ALL ON FUNCTION st_numgeometries(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_numgeometries(geometry) TO publicuser;


--
-- Name: st_numinteriorring(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_numinteriorring(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_numinteriorring(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_numinteriorring(geometry) TO postgres;
GRANT ALL ON FUNCTION st_numinteriorring(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_numinteriorring(geometry) TO publicuser;


--
-- Name: st_numinteriorrings(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_numinteriorrings(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_numinteriorrings(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_numinteriorrings(geometry) TO postgres;
GRANT ALL ON FUNCTION st_numinteriorrings(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_numinteriorrings(geometry) TO publicuser;


--
-- Name: st_numpoints(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_numpoints(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_numpoints(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_numpoints(geometry) TO postgres;
GRANT ALL ON FUNCTION st_numpoints(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_numpoints(geometry) TO publicuser;


--
-- Name: st_orderingequals(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_orderingequals(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_orderingequals(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_orderingequals(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_orderingequals(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_orderingequals(geometry, geometry) TO publicuser;


--
-- Name: st_overlaps(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_overlaps(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_overlaps(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_overlaps(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_overlaps(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_overlaps(geometry, geometry) TO publicuser;


--
-- Name: st_perimeter(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_perimeter(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_perimeter(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_perimeter(geometry) TO postgres;
GRANT ALL ON FUNCTION st_perimeter(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_perimeter(geometry) TO publicuser;


--
-- Name: st_perimeter2d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_perimeter2d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_perimeter2d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_perimeter2d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_perimeter2d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_perimeter2d(geometry) TO publicuser;


--
-- Name: st_perimeter3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_perimeter3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_perimeter3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_perimeter3d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_perimeter3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_perimeter3d(geometry) TO publicuser;


--
-- Name: st_point(double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_point(double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_point(double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_point(double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_point(double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_point(double precision, double precision) TO publicuser;


--
-- Name: st_point_inside_circle(geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_point_inside_circle(geometry, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_point_inside_circle(geometry, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_point_inside_circle(geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_point_inside_circle(geometry, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_point_inside_circle(geometry, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_pointfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_pointfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_pointfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_pointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_pointfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_pointfromtext(text) TO publicuser;


--
-- Name: st_pointfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_pointfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_pointfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_pointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_pointfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_pointfromtext(text, integer) TO publicuser;


--
-- Name: st_pointfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_pointfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_pointfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_pointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_pointfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_pointfromwkb(bytea) TO publicuser;


--
-- Name: st_pointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_pointfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_pointfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_pointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_pointfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_pointfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_pointn(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_pointn(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_pointn(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_pointn(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_pointn(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_pointn(geometry, integer) TO publicuser;


--
-- Name: st_pointonsurface(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_pointonsurface(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_pointonsurface(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_pointonsurface(geometry) TO postgres;
GRANT ALL ON FUNCTION st_pointonsurface(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_pointonsurface(geometry) TO publicuser;


--
-- Name: st_polyfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polyfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polyfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_polyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_polyfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_polyfromtext(text) TO publicuser;


--
-- Name: st_polyfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polyfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polyfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_polyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_polyfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_polyfromtext(text, integer) TO publicuser;


--
-- Name: st_polyfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polyfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polyfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_polyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_polyfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_polyfromwkb(bytea) TO publicuser;


--
-- Name: st_polyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polyfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polyfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_polyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_polyfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_polyfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_polygon(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygon(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygon(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_polygon(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_polygon(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygon(geometry, integer) TO publicuser;


--
-- Name: st_polygonfromtext(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonfromtext(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonfromtext(text) FROM postgres;
GRANT ALL ON FUNCTION st_polygonfromtext(text) TO postgres;
GRANT ALL ON FUNCTION st_polygonfromtext(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonfromtext(text) TO publicuser;


--
-- Name: st_polygonfromtext(text, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonfromtext(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonfromtext(text, integer) FROM postgres;
GRANT ALL ON FUNCTION st_polygonfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION st_polygonfromtext(text, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonfromtext(text, integer) TO publicuser;


--
-- Name: st_polygonfromwkb(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonfromwkb(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonfromwkb(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_polygonfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION st_polygonfromwkb(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonfromwkb(bytea) TO publicuser;


--
-- Name: st_polygonfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonfromwkb(bytea, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonfromwkb(bytea, integer) FROM postgres;
GRANT ALL ON FUNCTION st_polygonfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION st_polygonfromwkb(bytea, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonfromwkb(bytea, integer) TO publicuser;


--
-- Name: st_polygonize(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonize(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonize(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_polygonize(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_polygonize(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonize(geometry[]) TO publicuser;


--
-- Name: st_polygonize_garray(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonize_garray(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonize_garray(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_polygonize_garray(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_polygonize_garray(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonize_garray(geometry[]) TO publicuser;


--
-- Name: st_postgis_gist_joinsel(internal, oid, internal, smallint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_postgis_gist_joinsel(internal, oid, internal, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_postgis_gist_joinsel(internal, oid, internal, smallint) FROM postgres;
GRANT ALL ON FUNCTION st_postgis_gist_joinsel(internal, oid, internal, smallint) TO postgres;
GRANT ALL ON FUNCTION st_postgis_gist_joinsel(internal, oid, internal, smallint) TO PUBLIC;
GRANT ALL ON FUNCTION st_postgis_gist_joinsel(internal, oid, internal, smallint) TO publicuser;


--
-- Name: st_postgis_gist_sel(internal, oid, internal, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_postgis_gist_sel(internal, oid, internal, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_postgis_gist_sel(internal, oid, internal, integer) FROM postgres;
GRANT ALL ON FUNCTION st_postgis_gist_sel(internal, oid, internal, integer) TO postgres;
GRANT ALL ON FUNCTION st_postgis_gist_sel(internal, oid, internal, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_postgis_gist_sel(internal, oid, internal, integer) TO publicuser;


--
-- Name: st_relate(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_relate(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_relate(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_relate(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_relate(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_relate(geometry, geometry) TO publicuser;


--
-- Name: st_relate(geometry, geometry, text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_relate(geometry, geometry, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_relate(geometry, geometry, text) FROM postgres;
GRANT ALL ON FUNCTION st_relate(geometry, geometry, text) TO postgres;
GRANT ALL ON FUNCTION st_relate(geometry, geometry, text) TO PUBLIC;
GRANT ALL ON FUNCTION st_relate(geometry, geometry, text) TO publicuser;


--
-- Name: st_removepoint(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_removepoint(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_removepoint(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_removepoint(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_removepoint(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_removepoint(geometry, integer) TO publicuser;


--
-- Name: st_reverse(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_reverse(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_reverse(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_reverse(geometry) TO postgres;
GRANT ALL ON FUNCTION st_reverse(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_reverse(geometry) TO publicuser;


--
-- Name: st_rotate(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_rotate(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_rotate(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_rotate(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_rotate(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_rotate(geometry, double precision) TO publicuser;


--
-- Name: st_rotatex(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_rotatex(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_rotatex(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_rotatex(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_rotatex(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_rotatex(geometry, double precision) TO publicuser;


--
-- Name: st_rotatey(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_rotatey(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_rotatey(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_rotatey(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_rotatey(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_rotatey(geometry, double precision) TO publicuser;


--
-- Name: st_rotatez(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_rotatez(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_rotatez(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_rotatez(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_rotatez(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_rotatez(geometry, double precision) TO publicuser;


--
-- Name: st_scale(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_scale(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_scale(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_scale(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_scale(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_scale(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_scale(geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_scale(geometry, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_scale(geometry, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_scale(geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_scale(geometry, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_scale(geometry, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_segmentize(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_segmentize(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_segmentize(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_segmentize(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_segmentize(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_segmentize(geometry, double precision) TO publicuser;


--
-- Name: st_setfactor(chip, real); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_setfactor(chip, real) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_setfactor(chip, real) FROM postgres;
GRANT ALL ON FUNCTION st_setfactor(chip, real) TO postgres;
GRANT ALL ON FUNCTION st_setfactor(chip, real) TO PUBLIC;
GRANT ALL ON FUNCTION st_setfactor(chip, real) TO publicuser;


--
-- Name: st_setpoint(geometry, integer, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_setpoint(geometry, integer, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_setpoint(geometry, integer, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_setpoint(geometry, integer, geometry) TO postgres;
GRANT ALL ON FUNCTION st_setpoint(geometry, integer, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_setpoint(geometry, integer, geometry) TO publicuser;


--
-- Name: st_setsrid(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_setsrid(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_setsrid(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_setsrid(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_setsrid(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_setsrid(geometry, integer) TO publicuser;


--
-- Name: st_shift_longitude(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_shift_longitude(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_shift_longitude(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_shift_longitude(geometry) TO postgres;
GRANT ALL ON FUNCTION st_shift_longitude(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_shift_longitude(geometry) TO publicuser;


--
-- Name: st_shortestline(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_shortestline(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_shortestline(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_shortestline(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_shortestline(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_shortestline(geometry, geometry) TO publicuser;


--
-- Name: st_simplify(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_simplify(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_simplify(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_simplify(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_simplify(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_simplify(geometry, double precision) TO publicuser;


--
-- Name: st_simplifypreservetopology(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_simplifypreservetopology(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_simplifypreservetopology(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_simplifypreservetopology(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_simplifypreservetopology(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_simplifypreservetopology(geometry, double precision) TO publicuser;


--
-- Name: st_snaptogrid(geometry, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_snaptogrid(geometry, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_snaptogrid(geometry, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision) TO publicuser;


--
-- Name: st_snaptogrid(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_snaptogrid(geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_snaptogrid(geometry, geometry, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_spheroid_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_spheroid_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_spheroid_in(cstring) FROM postgres;
GRANT ALL ON FUNCTION st_spheroid_in(cstring) TO postgres;
GRANT ALL ON FUNCTION st_spheroid_in(cstring) TO PUBLIC;
GRANT ALL ON FUNCTION st_spheroid_in(cstring) TO publicuser;


--
-- Name: st_spheroid_out(spheroid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_spheroid_out(spheroid) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_spheroid_out(spheroid) FROM postgres;
GRANT ALL ON FUNCTION st_spheroid_out(spheroid) TO postgres;
GRANT ALL ON FUNCTION st_spheroid_out(spheroid) TO PUBLIC;
GRANT ALL ON FUNCTION st_spheroid_out(spheroid) TO publicuser;


--
-- Name: st_srid(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_srid(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_srid(chip) FROM postgres;
GRANT ALL ON FUNCTION st_srid(chip) TO postgres;
GRANT ALL ON FUNCTION st_srid(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_srid(chip) TO publicuser;


--
-- Name: st_srid(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_srid(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_srid(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_srid(geometry) TO postgres;
GRANT ALL ON FUNCTION st_srid(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_srid(geometry) TO publicuser;


--
-- Name: st_startpoint(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_startpoint(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_startpoint(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_startpoint(geometry) TO postgres;
GRANT ALL ON FUNCTION st_startpoint(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_startpoint(geometry) TO publicuser;


--
-- Name: st_summary(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_summary(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_summary(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_summary(geometry) TO postgres;
GRANT ALL ON FUNCTION st_summary(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_summary(geometry) TO publicuser;


--
-- Name: st_symdifference(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_symdifference(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_symdifference(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_symdifference(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_symdifference(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_symdifference(geometry, geometry) TO publicuser;


--
-- Name: st_symmetricdifference(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_symmetricdifference(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_symmetricdifference(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_symmetricdifference(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_symmetricdifference(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_symmetricdifference(geometry, geometry) TO publicuser;


--
-- Name: st_text(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_text(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_text(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_text(geometry) TO postgres;
GRANT ALL ON FUNCTION st_text(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_text(geometry) TO publicuser;


--
-- Name: st_touches(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_touches(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_touches(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_touches(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_touches(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_touches(geometry, geometry) TO publicuser;


--
-- Name: st_transform(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_transform(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_transform(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION st_transform(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION st_transform(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION st_transform(geometry, integer) TO publicuser;


--
-- Name: st_translate(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_translate(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_translate(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_translate(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_translate(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_translate(geometry, double precision, double precision) TO publicuser;


--
-- Name: st_translate(geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_translate(geometry, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_translate(geometry, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_translate(geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_translate(geometry, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_translate(geometry, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_transscale(geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_transscale(geometry, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_transscale(geometry, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION st_transscale(geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION st_transscale(geometry, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION st_transscale(geometry, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: st_union(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_union(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_union(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_union(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_union(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_union(geometry[]) TO publicuser;


--
-- Name: st_union(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_union(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_union(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_union(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_union(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_union(geometry, geometry) TO publicuser;


--
-- Name: st_unite_garray(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_unite_garray(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_unite_garray(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION st_unite_garray(geometry[]) TO postgres;
GRANT ALL ON FUNCTION st_unite_garray(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION st_unite_garray(geometry[]) TO publicuser;


--
-- Name: st_width(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_width(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_width(chip) FROM postgres;
GRANT ALL ON FUNCTION st_width(chip) TO postgres;
GRANT ALL ON FUNCTION st_width(chip) TO PUBLIC;
GRANT ALL ON FUNCTION st_width(chip) TO publicuser;


--
-- Name: st_within(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_within(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_within(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION st_within(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION st_within(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_within(geometry, geometry) TO publicuser;


--
-- Name: st_wkbtosql(bytea); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_wkbtosql(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_wkbtosql(bytea) FROM postgres;
GRANT ALL ON FUNCTION st_wkbtosql(bytea) TO postgres;
GRANT ALL ON FUNCTION st_wkbtosql(bytea) TO PUBLIC;
GRANT ALL ON FUNCTION st_wkbtosql(bytea) TO publicuser;


--
-- Name: st_wkttosql(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_wkttosql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_wkttosql(text) FROM postgres;
GRANT ALL ON FUNCTION st_wkttosql(text) TO postgres;
GRANT ALL ON FUNCTION st_wkttosql(text) TO PUBLIC;
GRANT ALL ON FUNCTION st_wkttosql(text) TO publicuser;


--
-- Name: st_x(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_x(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_x(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_x(geometry) TO postgres;
GRANT ALL ON FUNCTION st_x(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_x(geometry) TO publicuser;


--
-- Name: st_xmax(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_xmax(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_xmax(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_xmax(box3d) TO postgres;
GRANT ALL ON FUNCTION st_xmax(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_xmax(box3d) TO publicuser;


--
-- Name: st_xmin(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_xmin(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_xmin(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_xmin(box3d) TO postgres;
GRANT ALL ON FUNCTION st_xmin(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_xmin(box3d) TO publicuser;


--
-- Name: st_y(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_y(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_y(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_y(geometry) TO postgres;
GRANT ALL ON FUNCTION st_y(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_y(geometry) TO publicuser;


--
-- Name: st_ymax(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_ymax(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_ymax(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_ymax(box3d) TO postgres;
GRANT ALL ON FUNCTION st_ymax(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_ymax(box3d) TO publicuser;


--
-- Name: st_ymin(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_ymin(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_ymin(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_ymin(box3d) TO postgres;
GRANT ALL ON FUNCTION st_ymin(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_ymin(box3d) TO publicuser;


--
-- Name: st_z(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_z(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_z(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_z(geometry) TO postgres;
GRANT ALL ON FUNCTION st_z(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_z(geometry) TO publicuser;


--
-- Name: st_zmax(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_zmax(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_zmax(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_zmax(box3d) TO postgres;
GRANT ALL ON FUNCTION st_zmax(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_zmax(box3d) TO publicuser;


--
-- Name: st_zmflag(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_zmflag(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_zmflag(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_zmflag(geometry) TO postgres;
GRANT ALL ON FUNCTION st_zmflag(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_zmflag(geometry) TO publicuser;


--
-- Name: st_zmin(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_zmin(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_zmin(box3d) FROM postgres;
GRANT ALL ON FUNCTION st_zmin(box3d) TO postgres;
GRANT ALL ON FUNCTION st_zmin(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION st_zmin(box3d) TO publicuser;


--
-- Name: startpoint(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION startpoint(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION startpoint(geometry) FROM postgres;
GRANT ALL ON FUNCTION startpoint(geometry) TO postgres;
GRANT ALL ON FUNCTION startpoint(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION startpoint(geometry) TO publicuser;


--
-- Name: summary(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION summary(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION summary(geometry) FROM postgres;
GRANT ALL ON FUNCTION summary(geometry) TO postgres;
GRANT ALL ON FUNCTION summary(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION summary(geometry) TO publicuser;


--
-- Name: symdifference(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION symdifference(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION symdifference(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION symdifference(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION symdifference(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION symdifference(geometry, geometry) TO publicuser;


--
-- Name: symmetricdifference(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION symmetricdifference(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION symmetricdifference(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION symmetricdifference(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION symmetricdifference(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION symmetricdifference(geometry, geometry) TO publicuser;


--
-- Name: text(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION text(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION text(geometry) FROM postgres;
GRANT ALL ON FUNCTION text(geometry) TO postgres;
GRANT ALL ON FUNCTION text(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION text(geometry) TO publicuser;


--
-- Name: touches(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION touches(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION touches(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION touches(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION touches(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION touches(geometry, geometry) TO publicuser;


--
-- Name: transform(geometry, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION transform(geometry, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION transform(geometry, integer) FROM postgres;
GRANT ALL ON FUNCTION transform(geometry, integer) TO postgres;
GRANT ALL ON FUNCTION transform(geometry, integer) TO PUBLIC;
GRANT ALL ON FUNCTION transform(geometry, integer) TO publicuser;


--
-- Name: translate(geometry, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION translate(geometry, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION translate(geometry, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION translate(geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION translate(geometry, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION translate(geometry, double precision, double precision) TO publicuser;


--
-- Name: translate(geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION translate(geometry, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION translate(geometry, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION translate(geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION translate(geometry, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION translate(geometry, double precision, double precision, double precision) TO publicuser;


--
-- Name: transscale(geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION transscale(geometry, double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION transscale(geometry, double precision, double precision, double precision, double precision) FROM postgres;
GRANT ALL ON FUNCTION transscale(geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION transscale(geometry, double precision, double precision, double precision, double precision) TO PUBLIC;
GRANT ALL ON FUNCTION transscale(geometry, double precision, double precision, double precision, double precision) TO publicuser;


--
-- Name: unite_garray(geometry[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION unite_garray(geometry[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION unite_garray(geometry[]) FROM postgres;
GRANT ALL ON FUNCTION unite_garray(geometry[]) TO postgres;
GRANT ALL ON FUNCTION unite_garray(geometry[]) TO PUBLIC;
GRANT ALL ON FUNCTION unite_garray(geometry[]) TO publicuser;


--
-- Name: unlockrows(text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION unlockrows(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION unlockrows(text) FROM postgres;
GRANT ALL ON FUNCTION unlockrows(text) TO postgres;
GRANT ALL ON FUNCTION unlockrows(text) TO PUBLIC;
GRANT ALL ON FUNCTION unlockrows(text) TO publicuser;


--
-- Name: updategeometrysrid(character varying, character varying, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION updategeometrysrid(character varying, character varying, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION updategeometrysrid(character varying, character varying, integer) FROM postgres;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, integer) TO PUBLIC;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, integer) TO publicuser;


--
-- Name: updategeometrysrid(character varying, character varying, character varying, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, integer) FROM postgres;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, integer) TO PUBLIC;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, integer) TO publicuser;


--
-- Name: updategeometrysrid(character varying, character varying, character varying, character varying, integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, character varying, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, character varying, integer) FROM postgres;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, character varying, integer) TO PUBLIC;
GRANT ALL ON FUNCTION updategeometrysrid(character varying, character varying, character varying, character varying, integer) TO publicuser;


--
-- Name: width(chip); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION width(chip) FROM PUBLIC;
REVOKE ALL ON FUNCTION width(chip) FROM postgres;
GRANT ALL ON FUNCTION width(chip) TO postgres;
GRANT ALL ON FUNCTION width(chip) TO PUBLIC;
GRANT ALL ON FUNCTION width(chip) TO publicuser;


--
-- Name: within(geometry, geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION within(geometry, geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION within(geometry, geometry) FROM postgres;
GRANT ALL ON FUNCTION within(geometry, geometry) TO postgres;
GRANT ALL ON FUNCTION within(geometry, geometry) TO PUBLIC;
GRANT ALL ON FUNCTION within(geometry, geometry) TO publicuser;


--
-- Name: x(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION x(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION x(geometry) FROM postgres;
GRANT ALL ON FUNCTION x(geometry) TO postgres;
GRANT ALL ON FUNCTION x(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION x(geometry) TO publicuser;


--
-- Name: xmax(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION xmax(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION xmax(box3d) FROM postgres;
GRANT ALL ON FUNCTION xmax(box3d) TO postgres;
GRANT ALL ON FUNCTION xmax(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION xmax(box3d) TO publicuser;


--
-- Name: xmin(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION xmin(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION xmin(box3d) FROM postgres;
GRANT ALL ON FUNCTION xmin(box3d) TO postgres;
GRANT ALL ON FUNCTION xmin(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION xmin(box3d) TO publicuser;


--
-- Name: y(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION y(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION y(geometry) FROM postgres;
GRANT ALL ON FUNCTION y(geometry) TO postgres;
GRANT ALL ON FUNCTION y(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION y(geometry) TO publicuser;


--
-- Name: ymax(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION ymax(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION ymax(box3d) FROM postgres;
GRANT ALL ON FUNCTION ymax(box3d) TO postgres;
GRANT ALL ON FUNCTION ymax(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION ymax(box3d) TO publicuser;


--
-- Name: ymin(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION ymin(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION ymin(box3d) FROM postgres;
GRANT ALL ON FUNCTION ymin(box3d) TO postgres;
GRANT ALL ON FUNCTION ymin(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION ymin(box3d) TO publicuser;


--
-- Name: z(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION z(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION z(geometry) FROM postgres;
GRANT ALL ON FUNCTION z(geometry) TO postgres;
GRANT ALL ON FUNCTION z(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION z(geometry) TO publicuser;


--
-- Name: zmax(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION zmax(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION zmax(box3d) FROM postgres;
GRANT ALL ON FUNCTION zmax(box3d) TO postgres;
GRANT ALL ON FUNCTION zmax(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION zmax(box3d) TO publicuser;


--
-- Name: zmflag(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION zmflag(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION zmflag(geometry) FROM postgres;
GRANT ALL ON FUNCTION zmflag(geometry) TO postgres;
GRANT ALL ON FUNCTION zmflag(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION zmflag(geometry) TO publicuser;


--
-- Name: zmin(box3d); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION zmin(box3d) FROM PUBLIC;
REVOKE ALL ON FUNCTION zmin(box3d) FROM postgres;
GRANT ALL ON FUNCTION zmin(box3d) TO postgres;
GRANT ALL ON FUNCTION zmin(box3d) TO PUBLIC;
GRANT ALL ON FUNCTION zmin(box3d) TO publicuser;


--
-- Name: accum(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION accum(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION accum(geometry) FROM postgres;
GRANT ALL ON FUNCTION accum(geometry) TO postgres;
GRANT ALL ON FUNCTION accum(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION accum(geometry) TO publicuser;


--
-- Name: collect(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION collect(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION collect(geometry) FROM postgres;
GRANT ALL ON FUNCTION collect(geometry) TO postgres;
GRANT ALL ON FUNCTION collect(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION collect(geometry) TO publicuser;


--
-- Name: extent(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION extent(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION extent(geometry) FROM postgres;
GRANT ALL ON FUNCTION extent(geometry) TO postgres;
GRANT ALL ON FUNCTION extent(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION extent(geometry) TO publicuser;


--
-- Name: extent3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION extent3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION extent3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION extent3d(geometry) TO postgres;
GRANT ALL ON FUNCTION extent3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION extent3d(geometry) TO publicuser;


--
-- Name: makeline(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION makeline(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION makeline(geometry) FROM postgres;
GRANT ALL ON FUNCTION makeline(geometry) TO postgres;
GRANT ALL ON FUNCTION makeline(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION makeline(geometry) TO publicuser;


--
-- Name: memcollect(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION memcollect(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION memcollect(geometry) FROM postgres;
GRANT ALL ON FUNCTION memcollect(geometry) TO postgres;
GRANT ALL ON FUNCTION memcollect(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION memcollect(geometry) TO publicuser;


--
-- Name: memgeomunion(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION memgeomunion(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION memgeomunion(geometry) FROM postgres;
GRANT ALL ON FUNCTION memgeomunion(geometry) TO postgres;
GRANT ALL ON FUNCTION memgeomunion(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION memgeomunion(geometry) TO publicuser;


--
-- Name: polygonize(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION polygonize(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION polygonize(geometry) FROM postgres;
GRANT ALL ON FUNCTION polygonize(geometry) TO postgres;
GRANT ALL ON FUNCTION polygonize(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION polygonize(geometry) TO publicuser;


--
-- Name: st_accum(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_accum(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_accum(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_accum(geometry) TO postgres;
GRANT ALL ON FUNCTION st_accum(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_accum(geometry) TO publicuser;


--
-- Name: st_collect(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_collect(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_collect(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_collect(geometry) TO postgres;
GRANT ALL ON FUNCTION st_collect(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_collect(geometry) TO publicuser;


--
-- Name: st_extent(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_extent(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_extent(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_extent(geometry) TO postgres;
GRANT ALL ON FUNCTION st_extent(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_extent(geometry) TO publicuser;


--
-- Name: st_extent3d(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_extent3d(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_extent3d(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_extent3d(geometry) TO postgres;
GRANT ALL ON FUNCTION st_extent3d(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_extent3d(geometry) TO publicuser;


--
-- Name: st_makeline(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_makeline(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_makeline(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_makeline(geometry) TO postgres;
GRANT ALL ON FUNCTION st_makeline(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_makeline(geometry) TO publicuser;


--
-- Name: st_memcollect(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_memcollect(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_memcollect(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_memcollect(geometry) TO postgres;
GRANT ALL ON FUNCTION st_memcollect(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_memcollect(geometry) TO publicuser;


--
-- Name: st_memunion(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_memunion(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_memunion(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_memunion(geometry) TO postgres;
GRANT ALL ON FUNCTION st_memunion(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_memunion(geometry) TO publicuser;


--
-- Name: st_polygonize(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_polygonize(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_polygonize(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_polygonize(geometry) TO postgres;
GRANT ALL ON FUNCTION st_polygonize(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_polygonize(geometry) TO publicuser;


--
-- Name: st_union(geometry); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION st_union(geometry) FROM PUBLIC;
REVOKE ALL ON FUNCTION st_union(geometry) FROM postgres;
GRANT ALL ON FUNCTION st_union(geometry) TO postgres;
GRANT ALL ON FUNCTION st_union(geometry) TO PUBLIC;
GRANT ALL ON FUNCTION st_union(geometry) TO publicuser;


--
-- Name: geography_columns; Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON TABLE geography_columns FROM PUBLIC;
REVOKE ALL ON TABLE geography_columns FROM postgres;
GRANT ALL ON TABLE geography_columns TO postgres;
GRANT ALL ON TABLE geography_columns TO development_cartodb_user_1;


--
-- Name: geometry_columns; Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON TABLE geometry_columns FROM PUBLIC;
REVOKE ALL ON TABLE geometry_columns FROM postgres;
GRANT ALL ON TABLE geometry_columns TO postgres;
GRANT ALL ON TABLE geometry_columns TO development_cartodb_user_1;


--
-- Name: spatial_ref_sys; Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON TABLE spatial_ref_sys FROM PUBLIC;
REVOKE ALL ON TABLE spatial_ref_sys FROM postgres;
GRANT ALL ON TABLE spatial_ref_sys TO postgres;
GRANT ALL ON TABLE spatial_ref_sys TO development_cartodb_user_1;


--
-- Name: untitle_table; Type: ACL; Schema: public; Owner: development_cartodb_user_1
--

REVOKE ALL ON TABLE untitle_table FROM PUBLIC;
REVOKE ALL ON TABLE untitle_table FROM development_cartodb_user_1;
GRANT ALL ON TABLE untitle_table TO development_cartodb_user_1;
GRANT SELECT ON TABLE untitle_table TO publicuser;


--
-- Name: untitle_table_2; Type: ACL; Schema: public; Owner: development_cartodb_user_1
--

REVOKE ALL ON TABLE untitle_table_2 FROM PUBLIC;
REVOKE ALL ON TABLE untitle_table_2 FROM development_cartodb_user_1;
GRANT ALL ON TABLE untitle_table_2 TO development_cartodb_user_1;
GRANT SELECT ON TABLE untitle_table_2 TO publicuser;


--
-- Name: untitle_table_3; Type: ACL; Schema: public; Owner: development_cartodb_user_1
--

REVOKE ALL ON TABLE untitle_table_3 FROM PUBLIC;
REVOKE ALL ON TABLE untitle_table_3 FROM development_cartodb_user_1;
GRANT ALL ON TABLE untitle_table_3 TO development_cartodb_user_1;
GRANT SELECT ON TABLE untitle_table_3 TO publicuser;


--
-- Name: untitle_table_4; Type: ACL; Schema: public; Owner: development_cartodb_user_1
--

REVOKE ALL ON TABLE untitle_table_4 FROM PUBLIC;
REVOKE ALL ON TABLE untitle_table_4 FROM development_cartodb_user_1;
GRANT ALL ON TABLE untitle_table_4 TO development_cartodb_user_1;
GRANT SELECT ON TABLE untitle_table_4 TO publicuser;


--
-- PostgreSQL database dump complete
--

