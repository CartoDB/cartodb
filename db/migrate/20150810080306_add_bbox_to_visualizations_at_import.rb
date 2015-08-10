Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE EXTENSION IF NOT EXISTS "postgis"
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE visualizations ADD COLUMN bounding_box geometry;
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX bounding_box_visualizations_gix ON visualizations USING GIST (bounding_box);
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS bounding_box_visualizations_gix
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE visualizations DROP COLUMN IF EXISTS bounding_box
    })
  end
end