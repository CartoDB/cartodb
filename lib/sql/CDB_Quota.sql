-- Return the estimated size of user data. Used for quota checking.
CREATE OR REPLACE FUNCTION CDB_UserDataSize()
RETURNS bigint AS
$$
  -- TODO: double check this query. Maybe use CDB_TableMetadata for lookup ?
  --       also, it's "table_name" sounds sensible to search_path
  --
  -- NOTE: division by 2 is an hack for the_geom_webmercator
  --
  SELECT coalesce(int8(sum(pg_total_relation_size(quote_ident(table_name))) / 2), 0)
    AS quota
  FROM information_schema.tables
  WHERE table_catalog = current_database() AND table_schema = 'public'
    AND table_name != 'spatial_ref_sys'
    AND table_name != 'cdb_tablemetadata'
    AND table_type = 'BASE TABLE';
$$
LANGUAGE 'sql' VOLATILE;

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
    SELECT CDB_UserDataSize() INTO quota;
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
