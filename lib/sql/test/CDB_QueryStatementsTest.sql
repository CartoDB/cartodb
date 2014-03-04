WITH q AS ( SELECT CDB_QueryStatements('
SELECT * FROM geometry_columns;
') as statement )
SELECT '1', row_number() over (), statement FROM q;

WITH q AS ( SELECT CDB_QueryStatements('
SELECT * FROM geometry_columns
') as statement )
SELECT '2', row_number() over (), statement FROM q;

WITH q AS ( SELECT CDB_QueryStatements('
;;;SELECT * FROM geometry_columns
') as statement )
SELECT '3', row_number() over (), statement FROM q;

WITH q AS ( SELECT CDB_QueryStatements($the_param$
CREATE table "my'tab;le" ("$" int);
SELECT '1','$$', '$hello$', "$" FROM "my'tab;le";
CREATE function "hi'there" ("'" text default '$') returns void as $h$ declare a int; b text; begin b='hi'; return; end; $h$ language 'plpgsql';
SELECT 5;
$the_param$) as statement )
SELECT '4', row_number() over (), statement FROM q;

WITH q AS ( SELECT CDB_QueryStatements($the_param$
INSER INTO "my''""t" values ('''','""'';;');
SELECT $qu;oted$ hi $qu;oted$;
$the_param$) as statement )
SELECT '5', row_number() over (), statement FROM q;

WITH q AS ( SELECT CDB_QueryStatements($the_param$
SELECT
1 ; SELECT
2
$the_param$) as statement )
SELECT '6', row_number() over (), statement FROM q;

-- This is an insane input, illegal sql
-- we are really only testing that it does not
-- take forever to process..
-- The actual result is not correct, so if the function
-- ever gets fixed check if it's better
WITH q AS ( SELECT CDB_QueryStatements($the_param$








    /a
    $b$
    $c$d
    ;
$the_param$) as statement )
SELECT '7', row_number() over (), statement FROM q;


WITH q AS ( SELECT CDB_QueryStatements($the_param$
SELECT $quoted$ hi
$quoted$;
$the_param$) as statement )
SELECT '8', row_number() over (), statement FROM q;
