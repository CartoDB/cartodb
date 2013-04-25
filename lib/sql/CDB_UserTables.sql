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

