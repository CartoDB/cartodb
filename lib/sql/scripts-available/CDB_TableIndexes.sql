-- Function returning indexes for a table
CREATE OR REPLACE FUNCTION CDB_TableIndexes(REGCLASS)
RETURNS TABLE(index_name name, index_unique bool, index_primary bool, index_keys text array)
AS $$

  SELECT pg_class.relname as index_name,
         idx.indisunique as index_unique,
         idx.indisprimary as index_primary,
         ARRAY(
         SELECT pg_get_indexdef(idx.indexrelid, k + 1, true)
         FROM generate_subscripts(idx.indkey, 1) as k
         ORDER BY k
         ) as index_keys
  FROM pg_indexes,
       pg_index as idx 
  JOIN pg_class
  ON pg_class.oid = idx.indexrelid 
  WHERE pg_indexes.tablename = '' || $1 || ''
  AND '' || $1 || '' IN (SELECT CDB_UserTables())
  AND pg_class.relname=pg_indexes.indexname;

$$ LANGUAGE SQL;

-- This is a private function, so only the db owner need privileges
REVOKE ALL ON FUNCTION CDB_TableIndexes(REGCLASS) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION CDB_TableIndexes(REGCLASS) TO :DATABASE_USERNAME;
