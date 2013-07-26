SET client_min_messages TO warning;
\set VERBOSITY terse;

CREATE OR REPLACE FUNCTION CDB_CartodbfyTableCheck(tabname regclass, label text)
RETURNS text AS
$$
DECLARE
  sql TEXT;
  id INTEGER;
  rec RECORD;
  lag INTERVAL;
  tmp INTEGER;
  ogc_geom geometry_columns; -- old the_geom record in geometry_columns
  ogc_merc geometry_columns; -- old the_geom_webmercator record in geometry_columns
BEGIN

  -- Save current constraints on geometry columns, if any
  ogc_geom = ('','','','',0,0,'GEOMETRY'); 
  ogc_merc = ogc_geom; 
  sql := 'SELECT gc.* FROM geometry_columns gc, pg_class c, pg_namespace n '
    || 'WHERE c.oid = ' || tabname::oid || ' AND n.oid = c.relnamespace'
    || ' AND gc.f_table_schema = n.nspname AND gc.f_table_name = c.relname'
    || ' AND gc.f_geometry_column IN ( ' || quote_literal('the_geom')
    || ',' || quote_literal('the_geom_webmercator') || ')';
  FOR rec IN EXECUTE sql LOOP
    IF rec.f_geometry_column = 'the_geom' THEN
      ogc_geom := rec;
    ELSE
      ogc_merc := rec;
    END IF;
  END LOOP;

  PERFORM CDB_CartodbfyTable(tabname); 

  sql := 'INSERT INTO ' || tabname::text || '(the_geom) values ( CDB_LatLng(2,1) ) RETURNING cartodb_id';
  EXECUTE sql INTO STRICT id;
  sql := 'SELECT created_at,updated_at,the_geom_webmercator FROM '
    || tabname::text || ' WHERE cartodb_id = ' || id;
  EXECUTE sql INTO STRICT rec;

  -- Check created_at and updated_at at creation time
  lag = rec.created_at - now();
  IF lag > '1 second' THEN
    RAISE EXCEPTION 'created_at not defaulting to now() after insert [ valued % ago ]', lag;
  END IF;
  lag = rec.updated_at - now();
  IF lag > '1 second' THEN
    RAISE EXCEPTION 'updated_at not defaulting to now() after insert [ valued % ago ]', lag;
  END IF;

  -- Check the_geom_webmercator trigger
  IF round(st_x(rec.the_geom_webmercator)) != 111319 THEN
    RAISE EXCEPTION 'the_geom_webmercator X is % (expecting 111319)', round(st_x(rec.the_geom_webmercator));
  END IF;
  IF round(st_y(rec.the_geom_webmercator)) != 222684 THEN
    RAISE EXCEPTION 'the_geom_webmercator Y is % (expecting 222684)', round(st_y(rec.the_geom_webmercator));
  END IF;

  -- Check CDB_TableMetadata entry
  sql := 'SELECT * FROM CDB_TableMetadata WHERE tabname = ' || tabname::oid;
  EXECUTE sql INTO STRICT rec;
  lag = rec.updated_at - now();
  IF lag > '1 second' THEN
    RAISE EXCEPTION 'updated_at in CDB_TableMetadata not set to now() after insert [ valued % ago ]', lag;
  END IF;

  -- Check geometry_columns entries
  tmp := 0;
  FOR rec IN
    SELECT
      CASE WHEN gc.f_geometry_column = 'the_geom' THEN 4326
           ELSE 3857 END as expsrid,
      CASE WHEN gc.f_geometry_column = 'the_geom' THEN ogc_geom.type
           ELSE ogc_merc.type END as exptype, gc.*
    FROM geometry_columns gc, pg_class c, pg_namespace n 
    WHERE c.oid = tabname::oid AND n.oid = c.relnamespace
          AND gc.f_table_schema = n.nspname AND gc.f_table_name = c.relname
          AND gc.f_geometry_column IN ( 'the_geom', 'the_geom_webmercator')
  LOOP
    tmp := tmp + 1;
    -- Check SRID constraint
    IF rec.srid != rec.expsrid THEN
      RAISE EXCEPTION 'SRID of % in geometry_columns is %, expected %',
        rec.f_geometry_column, rec.srid, rec.expsrid;
    END IF;
    -- Check TYPE constraint didn't change
    IF rec.type != rec.exptype THEN
      RAISE EXCEPTION 'type of % in geometry_columns is %, expected %',
        rec.f_geometry_column, rec.type, rec.exptype;
    END IF;
    -- check coord_dimension ?
  END LOOP;
  IF tmp != 2 THEN
      RAISE EXCEPTION '% entries found for table % in geometry_columns, expected 2', tmp, tabname;
  END IF;

  -- Check GiST index 
  sql := 'SELECT a.attname, count(ri.relname) FROM'
    || ' pg_index i, pg_class c, pg_class ri, pg_attribute a, pg_opclass o'
    || ' WHERE i.indrelid = c.oid AND ri.oid = i.indexrelid'
    || ' AND a.attrelid = ri.oid AND o.oid = i.indclass[0]'
    || ' AND a.attname IN ( ' || quote_literal('the_geom')
    || ',' || quote_literal('the_geom_webmercator') || ')'
    || ' AND ri.relnatts = 1 AND o.opcname = '
    || quote_literal('gist_geometry_ops_2d')
    || ' AND c.oid = ' || tabname::oid
    || ' GROUP BY a.attname';
  RAISE NOTICE 'sql: %', sql;
  EXECUTE sql;
  GET DIAGNOSTICS tmp = ROW_COUNT;
  IF tmp != 2 THEN
      RAISE EXCEPTION '% gist indices found on the_geom and the_geom_webmercator, expected 2', tmp;
  END IF;

  -- Check null constraint on cartodb_id, created_at, updated_at
  SELECT count(*) FROM pg_attribute a, pg_class c WHERE c.oid = tabname::oid
    AND a.attrelid = c.oid AND NOT a.attisdropped AND a.attname in
      ( 'cartodb_id', 'created_at', 'updated_at' )
    AND NOT a.attnotnull INTO strict tmp;
  IF tmp > 0 THEN
      RAISE EXCEPTION 'cartodb_id or created_at or updated_at are missing not-null constraint';
  END IF;

  -- Cleanup
  sql := 'DELETE FROM ' || tabname::text || ' WHERE cartodb_id = ' || id;
  EXECUTE sql;

  RETURN label || ' cartodbfied fine';
END;
$$
LANGUAGE 'plpgsql';

-- table with single non-geometrical column
CREATE TABLE t AS SELECT 1::int as a;
SELECT CDB_CartodbfyTableCheck('t', 'single non-geometrical column');
DROP TABLE t;

-- table with existing srid-unconstrained (but type-constrained) the_geom
CREATE TABLE t AS SELECT ST_SetSRID(ST_MakePoint(0,0),4326)::geometry(point) as the_geom;
SELECT CDB_CartodbfyTableCheck('t', 'srid-unconstrained the_geom');
DROP TABLE t;

-- table with mixed-srid the_geom values
CREATE TABLE t AS SELECT ST_SetSRID(ST_MakePoint(-1,-1),4326) as the_geom
UNION ALL SELECT ST_SetSRID(ST_MakePoint(0,0),3857);
SELECT CDB_CartodbfyTableCheck('t', 'mixed-srid the_geom');
SELECT 'extent',ST_Extent(the_geom) FROM t;
DROP TABLE t;

-- table with wrong srid-constrained the_geom values
CREATE TABLE t AS SELECT 'SRID=3857;LINESTRING(222638.981586547 222684.208505545, 111319.490793274 111325.142866385)'::geometry(geometry,3857) as the_geom;
SELECT CDB_CartodbfyTableCheck('t', 'wrong srid-constrained the_geom');
SELECT 'extent',ST_Extent(the_geom) FROM t;
DROP TABLE t;

-- table with wrong srid-constrained the_geom_webmercator values (and no the_geom!)
CREATE TABLE t AS SELECT 'SRID=4326;LINESTRING(1 1,2 2)'::geometry(geometry,4326) as the_geom_webmercator;
SELECT CDB_CartodbfyTableCheck('t', 'wrong srid-constrained the_geom_webmercator');
-- expect the_geom to be populated from the_geom_webmercator
SELECT 'extent',ST_Extent(ST_SnapToGrid(the_geom,0.1)) FROM t;
DROP TABLE t;


DROP FUNCTION CDB_CartodbfyTableCheck(regclass, text);
