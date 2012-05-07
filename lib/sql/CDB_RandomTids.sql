
-- {
-- 
-- Return random TIDs in a table.
--
-- You can use like this:
--
--   SELECT * FROM lots_of_points WHERE ctid = ANY (
--      ARRAY[ (SELECT CDB_RandomTids('lots_of_points', 100000)) ]
--   );
--
-- NOTE:
-- It currently doesn't really do it random, but in a
-- equally-distributed way among all tuples.
--
--
-- }{
CREATE OR REPLACE FUNCTION CDB_RandomTids(in_table regclass, in_nsamples integer)
  RETURNS tid[]
AS $$
DECLARE
  class_info RECORD;
  tuples_per_page INTEGER;
  needed_pages INTEGER;
  skip_pages INTEGER;
  tidlist TID[];
  pnrec RECORD;
BEGIN

  -- (#) estimate pages and tuples-per-page
  --     HINT: pg_class.relpages, pg_class.reltuples
  SELECT relpages, reltuples 
    FROM pg_class WHERE oid = in_table
    INTO class_info;

  RAISE DEBUG 'Table % has % pages and % tuples',
    in_table::text, class_info.relpages, class_info.reltuples;

  IF in_nsamples > class_info.reltuples THEN
    RAISE WARNING 'Table has less tuples than requested';
    -- should just perform a sequencial scan here...
  END IF;

  tuples_per_page := floor(class_info.reltuples/class_info.relpages);
  needed_pages := ceil(in_nsamples::real/tuples_per_page);

  RAISE DEBUG '% tuples per page, we need % pages for % tuples',
    tuples_per_page, needed_pages, in_nsamples;

  -- (#) select random pages
  --     TODO: see how good this is first

  skip_pages := floor( (class_info.relpages-needed_pages)/(needed_pages+1) );

  RAISE DEBUG 'we are going to skip % pages at each iteration',
    skip_pages;

  SELECT array_agg(t) FROM (
    SELECT '(' || pn || ',' || tn || ')' as t
    FROM generate_series(1, tuples_per_page) x(tn),
         generate_series(skip_pages+1, class_info.relpages, skip_pages) y(pn) ) f
        INTO tidlist;

  RETURN tidlist;

END
$$ LANGUAGE 'plpgsql' STABLE STRICT;
-- }

