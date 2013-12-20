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

-- This is a private function, so only the db owner need privileges
REVOKE ALL ON FUNCTION CDB_ColumnType(REGCLASS, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION CDB_ColumnType(REGCLASS, TEXT) TO ":DATABASE_USERNAME";
