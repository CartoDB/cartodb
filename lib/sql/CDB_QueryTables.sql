-- Return an array of table names scanned by a given query
--
-- Requires PostgreSQL 9.x+
--
CREATE OR REPLACE FUNCTION CDB_QueryTables(query text)
RETURNS name[]
AS $$
DECLARE
  exp XML;
  tables NAME[];
BEGIN
  
  BEGIN
    EXECUTE 'EXPLAIN (FORMAT XML) ' || query INTO STRICT exp;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Cannot explain query: % (%)', query, SQLERRM;
    return ARRAY[]::name[];
  END;

  -- Now need to extract all values of <Relation-Name>

  --RAISE DEBUG 'Explain: %', exp;

  with inp as ( SELECT xpath('//x:Relation-Name/text()', exp, ARRAY[ARRAY['x', 'http://www.postgresql.org/2009/explain']]) as x ),
       dist as ( SELECT DISTINCT unnest(x)::text as p from inp ORDER BY p )
       SELECT array_agg(p) from dist into tables;
  IF tables IS NULL THEN
    tables := ARRAY[]::name[];
  END IF;

  --RAISE DEBUG 'Tables: %', tables;

  return tables;
END
$$ LANGUAGE 'plpgsql' VOLATILE STRICT;
