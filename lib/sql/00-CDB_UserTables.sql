-- Function returning list of cartodb user tables
CREATE OR REPLACE FUNCTION CDB_UserTables()
RETURNS SETOF information_schema.sql_identifier
AS $$
  SELECT table_name
  FROM information_schema.tables
  WHERE
       table_type='BASE TABLE'
   AND table_schema='public'
   AND table_name NOT IN (
    'cdb_tablemetadata',
    'spatial_ref_sys'
   )
   ;
$$ LANGUAGE 'sql';

-- This is a private function, so only the db owner need privileges
REVOKE ALL ON FUNCTION CDB_UserTables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION CDB_UserTables() TO :DATABASE_USERNAME;
