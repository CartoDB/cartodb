Sequel.migration do
  up do
    SequelRails.connection.run(%{
      CREATE EXTENSION IF NOT EXISTS "postgis"
    })

    SequelRails.connection.run(%{
      ALTER TABLE visualizations ADD COLUMN bbox geometry;
    })

    SequelRails.connection.run(%{
      CREATE INDEX visualizations_bbox_idx ON visualizations USING GIST (bbox);
    })
  end

  down do
    SequelRails.connection.run(%{
      DROP INDEX IF EXISTS visualizations_bbox_idx
    })

    SequelRails.connection.run(%{
      ALTER TABLE visualizations DROP COLUMN IF EXISTS bbox
    })
  end
end
