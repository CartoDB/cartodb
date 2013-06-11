
WITH inp AS ( select 'SELECT * FROM geometry_columns'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'SELECT a.attname FROM pg_class c JOIN pg_attribute a on (a.attrelid = c.oid)'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select $quote$CREATE table "my'tab;le" as select 1$quote$::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'SELECT a.oid, b.oid FROM pg_class a, pg_class b'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'SELECT 1 as col1; select 2 as col2'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'select 1 from nonexistant'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'begin; select * from pg_class; commit;'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'create table test (a int); insert into test values (1); select * from test;'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;

WITH inp AS ( select 'WITH a AS (select * from pg_class) select * from a'::text as q )
 SELECT q, CDB_QueryTables(q) from inp;
