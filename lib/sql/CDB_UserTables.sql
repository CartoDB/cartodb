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

-- Function returning the column names of a table
CREATE OR REPLACE FUNCTION CDB_ColumnNames(REGCLASS)
RETURNS SETOF information_schema.sql_identifier
AS $$

    SELECT column_name 
      FROM information_schema.columns 
      WHERE
        table_name IN (SELECT CDB_UserTables())
        AND table_name = '' || $1 || '';
         
$$ LANGUAGE SQL;

-- Function returning the type of a column
CREATE OR REPLACE FUNCTION CDB_ColumnType(REGCLASS, TEXT)
RETURNS information_schema.character_data
AS $$

    SELECT data_type 
      FROM information_schema.columns 
      WHERE
        table_name IN (SELECT CDB_UserTables())
        AND table_name = '' || $1 || ''
        AND column_name = '' || quote_ident($2) || '';
         
$$ LANGUAGE SQL;
