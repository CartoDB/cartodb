-- Return an array of table names used by a given query
CREATE OR REPLACE FUNCTION CDB_QueryTables(query text)
RETURNS name[]
AS $$
DECLARE
  exp XML;
  tables NAME[];
BEGIN
  
  EXECUTE 'EXPLAIN (FORMAT XML) ' || query INTO STRICT exp;

  -- Now need to extract all values of <Relation-Name>

  --RAISE DEBUG 'Explain: %', exp;

  tables := xpath('//x:Relation-Name/text()', exp, ARRAY[ARRAY['x', 'http://www.postgresql.org/2009/explain']]);

  --RAISE DEBUG 'Tables: %', tables;

  return tables;
END
$$ LANGUAGE 'plpgsql' VOLATILE STRICT;
