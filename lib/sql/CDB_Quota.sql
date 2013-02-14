CREATE OR REPLACE FUNCTION CDB_CheckQuota()
RETURNS trigger AS
$$
DECLARE

  pbfact float8;
  qmax int8;
  dice float8;
  quota float8;
BEGIN

  pbfact := TG_ARGV[0];
  qmax := TG_ARGV[1];
  dice := random();

  -- RAISE DEBUG 'CDB_CheckQuota enter: pbfact=% qmax=% dice=%', pbfact, qmax, dice;

  IF dice < pbfact THEN
    RAISE DEBUG 'Checking quota on table % (dice:%, needed:<%)', TG_RELID::text, dice, pbfact;
    -- TODO: double check this query. Maybe use CDB_TableMetadata for lookup ?
    --       also, it's "table_name" sounds sensible to search_path
    SELECT sum(pg_total_relation_size(quote_ident(table_name))) / 2
      FROM information_schema.tables
      WHERE table_catalog = quote_ident(current_database())
      AND table_schema = 'public'
      INTO quota;
    IF quota > qmax THEN
        RAISE EXCEPTION 'Quota exceeded by %KB', (quota-qmax)/1024;
    ELSE RAISE DEBUG 'User quota in bytes: % < % (max allowed)', quota, qmax;
    END IF;
  -- ELSE RAISE DEBUG 'Not checking quota on table % (dice:%, needed:<%)', TG_RELID::text, dice, pbfact;
  END IF;

  RETURN NEW;
END;
$$
LANGUAGE 'plpgsql' VOLATILE;
