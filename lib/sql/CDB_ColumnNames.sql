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
