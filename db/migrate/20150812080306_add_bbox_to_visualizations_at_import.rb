Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE EXTENSION IF NOT EXISTS "postgis"
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE visualizations ADD COLUMN bbox geometry;
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX visualizations_bbox_idx ON visualizations USING GIST (bbox);
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS visualizations_bbox_idx
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE visualizations DROP COLUMN IF EXISTS bbox
    })
  end
end
