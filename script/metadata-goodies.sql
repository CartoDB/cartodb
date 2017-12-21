-- This is a set of functions not intended to be used in production
-- but useful to explore the database without rails ORM.
-- They are thought to be loosely coupled to the models and just rely on FK relations.
--
-- To install:
--   \i metadata-goodies.psql
-- To uninstall:
--   DROP SCHEMA goodies CASCADE;


CREATE SCHEMA IF NOT EXISTS goodies AUTHORIZATION postgres;

CREATE OR REPLACE FUNCTION goodies.related_layer_ids(table_id uuid)
RETURNS SETOF uuid  AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT(layer_id) FROM layers_user_tables WHERE layers_user_tables.user_table_id = table_id;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION goodies.related_map_ids(table_id uuid)
RETURNS SETOF uuid  AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT(map_id) FROM layers_maps WHERE layers_maps.layer_id
    IN (SELECT goodies.related_layer_ids(table_id));

END;
$$ LANGUAGE plpgsql;


-- E.g: SELECT id, name, type FROM goodies.related_vizs('6eb62d84-c4bc-446b-89dd-5435f6cc9346');
CREATE OR REPLACE FUNCTION goodies.related_vizs(table_id uuid)
RETURNS SETOF visualizations  AS $$
BEGIN
  RETURN QUERY SELECT * FROM visualizations WHERE visualizations.map_id
    IN (SELECT goodies.related_map_ids(table_id));
END;
$$ LANGUAGE plpgsql;
