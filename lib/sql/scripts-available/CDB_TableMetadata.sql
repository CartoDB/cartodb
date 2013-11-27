
CREATE TABLE IF NOT EXISTS
  public.CDB_TableMetadata (
    tabname regclass not null primary key,
    updated_at timestamp with time zone not null default now()
  );

-- Anyone can see this, but updates are only possible trough
-- the security definer trigger
GRANT SELECT ON public.CDB_TableMetadata TO public;

--
-- Trigger logging updated_at in the CDB_TableMetadata
-- and notifying cdb_tabledata_update with table name as payload.
--
-- Attach to tables like this:
--
--   CREATE trigger track_updates
--    AFTER INSERT OR UPDATE OR TRUNCATE OR DELETE ON <tablename>
--    FOR EACH STATEMENT
--    EXECUTE PROCEDURE cdb_tablemetadata_trigger(); 
--
-- NOTE: _never_ attach to CDB_TableMetadata ...
--
CREATE OR REPLACE FUNCTION CDB_TableMetadata_Trigger()
RETURNS trigger AS
$$
BEGIN
  -- Guard against infinite loop
  IF TG_RELID = 'public.CDB_TableMetadata'::regclass::oid THEN
    RETURN NULL;
  END IF;

  -- Cleanup stale entries
  DELETE FROM public.CDB_TableMetadata
   WHERE NOT EXISTS (
    SELECT oid FROM pg_class WHERE oid = tabname
  );

  WITH nv as (
    SELECT TG_RELID as tabname, NOW() as t
  ), updated as (
    UPDATE public.CDB_TableMetadata x SET updated_at = nv.t
    FROM nv WHERE x.tabname = nv.tabname
    RETURNING x.tabname
  )
  INSERT INTO public.CDB_TableMetadata SELECT nv.*
  FROM nv LEFT JOIN updated USING(tabname)
  WHERE updated.tabname IS NULL;

  RETURN NULL;
END;
$$
LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

--
-- Trigger invalidating varnish whenever CDB_TableMetadata
-- record change.
--
CREATE OR REPLACE FUNCTION _CDB_TableMetadata_Updated()
RETURNS trigger AS
$$
DECLARE
  tabname TEXT;
BEGIN

  IF TG_OP = 'UPDATE' or TG_OP = 'INSERT' THEN
    tabname = NEW.tabname;
  ELSE
    tabname = OLD.tabname;
  END IF;

  -- Notify table data update
  -- This needs a little bit more of research regarding security issues
  -- see https://github.com/CartoDB/cartodb/pull/241
  -- PERFORM pg_notify('cdb_tabledata_update', tabname);

  --RAISE NOTICE 'Table % was updated', tabname;

  -- This will be needed until we'll have someone listening
  -- on the event we just broadcasted:
  --
  --  LISTEN cdb_tabledata_update;
  --
  PERFORM cdb_invalidate_varnish(tabname);

  RETURN NULL;
END;
$$
LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

DROP TRIGGER IF EXISTS table_modified ON CDB_TableMetadata;
CREATE TRIGGER table_modified AFTER INSERT OR UPDATE OR DELETE
ON CDB_TableMetadata FOR EACH ROW EXECUTE PROCEDURE
 _CDB_TableMetadata_Updated();

