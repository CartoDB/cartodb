-- Find thousand and decimal digits separators
CREATE OR REPLACE FUNCTION CDB_DigitSeparator (rel REGCLASS, fld TEXT, OUT t CHAR, OUT d CHAR)
as $$ 
DECLARE
  sql TEXT;
  rec RECORD;
BEGIN

  -- We're only interested in rows with either "," or '.'
  sql := 'SELECT ' || quote_ident(fld) || ' as f FROM ' || rel::text
                   || ' WHERE ' || quote_ident(fld) || ' ~ ''[,.]''';

  FOR rec IN EXECUTE sql
  LOOP
    -- Any separator appearing more than once
    -- will be assumed to be thousand separator
    IF rec.f ~ ',.*,' THEN
      t := ','; d := '.';
      RETURN;
    ELSIF rec.f ~ '\..*\.' THEN
      t := '.'; d := ',';
      RETURN;
    END IF;

    -- If both separator are present, rightmost
    -- will be assumed to be decimal separator
    IF rec.f ~ '\.' AND rec.f ~ ',' THEN
      rec.f = reverse(rec.f);
      IF strpos(rec.f, ',') < strpos(rec.f, '.') THEN
        t := '.'; d := ',';
      ELSE
        t := ','; d := '.';
      END IF;
      RETURN;
    END IF;

    -- A separator NOT followed by 3 digits
    -- will be assumed to be decimal separator
    IF rec.f ~ ',' AND rec.f !~ '(,[0-9]{3}$)|(,[0-9]{3}[,.])' THEN
      t := '.'; d := ',';
      RETURN;
    ELSIF rec.f ~ '\.' AND rec.f !~ '(\.[0-9]{3}$)|(\.[0-9]{3}[,.])' THEN
      t := ','; d := '.';
      RETURN;
    END IF;

    -- Otherwise continue looking

  END LOOP;

END
$$
LANGUAGE 'plpgsql' STABLE STRICT;
