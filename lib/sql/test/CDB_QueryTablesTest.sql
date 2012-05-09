WITH inp AS ( select 'SELECT * FROM geometry_columns'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'SELECT a.attname FROM pg_class c JOIN pg_attribute a on (a.attrelid = c.oid)'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;
