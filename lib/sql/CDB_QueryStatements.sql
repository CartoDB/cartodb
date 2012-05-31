-- Return an array of statements found in the given query text
--
-- Curtesy of Hubert Lubaczewski (depesz)
--
CREATE OR REPLACE FUNCTION CDB_QueryStatements(query text) 
RETURNS SETOF TEXT AS $$
   SELECT stmt FROM (
     SELECT btrim(q[1], E' \n\t\r;') as stmt FROM (
       SELECT regexp_matches( $1, $REG$((?:[^'"$;]+|"[^"]*"|'(?:[^']*|'')*'|(\$[^$]*\$).*?\2)+)$REG$, 'g' ) as q
     ) i
   ) j
   WHERE stmt <> '';
$$ language sql;
