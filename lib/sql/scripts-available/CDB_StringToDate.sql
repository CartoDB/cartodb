-- Convert string to date
--
CREATE OR REPLACE FUNCTION CDB_StringToDate(input character varying)
RETURNS date AS $$
DECLARE output DATE DEFAULT NULL;
BEGIN
    BEGIN
        output := input::date;
    EXCEPTION WHEN OTHERS THEN
        BEGIN
          SELECT to_timestamp(input::integer) INTO output;
        EXCEPTION WHEN OTHERS THEN
          RETURN NULL;
        END;
    END;
RETURN output;
END;
$$
LANGUAGE 'plpgsql' STABLE STRICT;
