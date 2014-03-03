-- Return an array of statements found in the given query text
--
-- Regexp curtesy of Hubert Lubaczewski (depesz)
-- Implemented in plpython for performance reasons
--
CREATE OR REPLACE FUNCTION CDB_QueryStatements(query text) 
RETURNS SETOF TEXT AS $$
  import re
  pat = re.compile( r'''((?:[^'"$;]+|"[^"]*"|'[^']*'|(\$[^$]*\$).*?\2)+)''', re.DOTALL )
  for match in pat.findall(query):
    cleaned = match[0].strip()
    if ( cleaned ):
      yield cleaned
$$ language 'plpythonu' IMMUTABLE STRICT;
