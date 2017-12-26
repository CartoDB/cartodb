Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      CREATE EXTENSION IF NOT EXISTS "postgis"
    })

    SequelRails.connection.run(%Q{
      ALTER TABLE visualizations ADD COLUMN bbox geometry;
    })

    SequelRails.connection.run(%Q{
      CREATE INDEX visualizations_bbox_idx ON visualizations USING GIST (bbox);
    })
  end

  down do
    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS visualizations_bbox_idx
    })

    SequelRails.connection.run(%Q{
      ALTER TABLE visualizations DROP COLUMN IF EXISTS bbox
    })
  end
end
