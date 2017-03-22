Sequel.migration do
  up do
    execute "CREATE TABLE visualization_categories (
            id SERIAL,
            type integer NOT NULL,
            name text NOT NULL,
            parent_id integer NOT NULL,
            list_order integer DEFAULT 0
        );"
    execute "COMMENT ON COLUMN visualization_categories.type IS '1: dataset, 2: map';"
    execute "CREATE INDEX parent_id_idx ON visualization_categories (parent_id);"

    execute "CREATE OR REPLACE FUNCTION get_viz_child_category_ids(category_id integer)
      RETURNS integer[] AS $$

      DECLARE
         ids integer[];
         sub_ids integer[];
         each_id integer;

      BEGIN
          SELECT ARRAY(SELECT id FROM visualization_categories WHERE parent_id=category_id ORDER BY list_order, name) INTO ids;
          
          IF array_length(ids, 1) <> 0 THEN
              FOREACH each_id IN ARRAY ids
              LOOP
                  SELECT get_viz_child_category_ids(each_id) INTO sub_ids;
                  SELECT array_cat(ids, sub_ids) INTO ids;
              END LOOP;
          END IF;

          RETURN ids;
      END;

      $$ language plpgsql;"
  end

  down do
    drop_table :visualization_categories

    execute "DROP FUNCTION get_viz_child_category_ids(category_id integer);"
  end
end