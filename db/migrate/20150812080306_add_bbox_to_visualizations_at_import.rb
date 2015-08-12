Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE EXTENSION IF NOT EXISTS "postgis"
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE visualizations ADD COLUMN bbox geometry;
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX bounding_box_visualizations_gix ON visualizations USING GIST (bbox);
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS bbox_visualizations_gix
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE visualizations DROP COLUMN IF EXISTS bbox
    })
  end
end
